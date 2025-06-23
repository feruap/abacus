
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { MyAliceWebhookPayload } from '@/lib/types';
import crypto from 'crypto';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// Webhook principal para recibir eventos de MyAlice.ai
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-myalice-signature');

    // Validar signature del webhook
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Signature de webhook inválida');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: MyAliceWebhookPayload = JSON.parse(body);
    console.log('Webhook MyAlice.ai recibido:', payload.action);

    // Guardar webhook log
    const webhookLog = await prisma.webhookLog.create({
      data: {
        source: 'myalice',
        action: payload.action,
        payload: payload as any,
        signature: signature || '',
        status: 'received'
      }
    });

    // Procesar según el tipo de acción
    const result = await processWebhookAction(payload, webhookLog.id);

    // Actualizar log con resultado
    await prisma.webhookLog.update({
      where: { id: webhookLog.id },
      data: {
        status: result.success ? 'processed' : 'failed',
        processedAt: new Date(),
        lastError: 'error' in result ? result.error || null : null
      }
    });

    // Responder rápidamente a MyAlice.ai (< 5 segundos)
    return NextResponse.json({ 
      received: true,
      action: payload.action,
      processed: result.success
    });

  } catch (error) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const secret = process.env.MYALICE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('MYALICE_WEBHOOK_SECRET no configurado');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const receivedSignature = signature.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  );
}

async function processWebhookAction(payload: MyAliceWebhookPayload, webhookLogId: string) {
  try {
    switch (payload.action) {
      case 'ticket.created':
        return await handleTicketCreated(payload);
      
      case 'ticket.message':
        return await handleNewMessage(payload);
      
      case 'ticket.resolved':
        return await handleTicketResolved(payload);
      
      case 'ticket.escalated':
        return await handleTicketEscalated(payload);

      default:
        console.log('Acción de webhook no manejada:', payload.action);
        return { success: true, message: 'Acción no manejada pero recibida' };
    }
  } catch (error) {
    console.error('Error procesando acción de webhook:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function handleTicketCreated(payload: MyAliceWebhookPayload) {
  try {
    console.log('Procesando nuevo ticket:', payload.ticket.id);

    // 1. Encontrar o crear cliente
    const customer = await findOrCreateCustomer(payload.customer);

    // 2. Crear conversación
    const conversation = await prisma.conversation.create({
      data: {
        myaliceTicketId: payload.ticket.id,
        customerId: customer.id,
        channelId: payload.channel?.id,
        channel: payload.channel?.type || 'whatsapp',
        status: 'active',
        priority: payload.ticket.priority || 'normal',
        subject: payload.ticket.conversation_text?.substring(0, 100),
        tags: payload.ticket.tags || []
      }
    });

    // 3. Crear mensaje inicial
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        channelId: payload.channel?.id,
        direction: 'inbound',
        messageType: 'text',
        content: payload.ticket.conversation_text,
        metadata: payload.message ? {
          messageId: payload.message.id,
          timestamp: payload.message.timestamp
        } : {}
      }
    });

    // 4. Procesar mensaje con el agente LLM (asíncrono)
    await queueMessageForProcessing(conversation.id, payload.ticket.conversation_text, customer.id);

    return { success: true, conversationId: conversation.id };
  } catch (error) {
    console.error('Error manejando ticket creado:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function handleNewMessage(payload: MyAliceWebhookPayload) {
  try {
    console.log('Procesando nuevo mensaje:', payload.message?.id);

    if (!payload.message) {
      return { success: false, error: 'No hay mensaje en el payload' };
    }

    // 1. Encontrar conversación
    const conversation = await prisma.conversation.findUnique({
      where: { myaliceTicketId: payload.ticket.id }
    });

    if (!conversation) {
      return { success: false, error: 'Conversación no encontrada' };
    }

    // 2. Crear mensaje
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        channelId: payload.channel?.id,
        direction: payload.message.sender === 'customer' ? 'inbound' : 'outbound',
        messageType: payload.message.type,
        content: payload.message.content,
        metadata: {
          messageId: payload.message.id,
          timestamp: payload.message.timestamp,
          attachments: payload.message.attachments || []
        } as any
      }
    });

    // 3. Si es mensaje del cliente y la conversación no está manejada por humano, procesar con agente
    if (payload.message.sender === 'customer' && !conversation.humanTookOver) {
      await queueMessageForProcessing(conversation.id, payload.message.content, conversation.customerId);
    }

    return { success: true, messageProcessed: true };
  } catch (error) {
    console.error('Error manejando nuevo mensaje:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function handleTicketResolved(payload: MyAliceWebhookPayload) {
  try {
    await prisma.conversation.updateMany({
      where: { myaliceTicketId: payload.ticket.id },
      data: {
        status: 'resolved',
        resolvedAt: new Date()
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error manejando ticket resuelto:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function handleTicketEscalated(payload: MyAliceWebhookPayload) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { myaliceTicketId: payload.ticket.id }
    });

    if (conversation) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          status: 'escalated',
          humanTookOver: true,
          humanTakeoverAt: new Date(),
          assignedTo: payload.agent?.id
        }
      });

      await prisma.escalation.create({
        data: {
          conversationId: conversation.id,
          type: 'manual',
          reason: 'Escalado desde MyAlice.ai',
          status: 'assigned',
          assignedTo: payload.agent?.id
        }
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error manejando ticket escalado:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function findOrCreateCustomer(customerData: any) {
  try {
    // Buscar por MyAlice ID
    if (customerData.id) {
      const existing = await prisma.customer.findUnique({
        where: { myaliceId: customerData.id }
      });
      if (existing) return existing;
    }

    // Buscar por email
    if (customerData.email) {
      const existing = await prisma.customer.findUnique({
        where: { email: customerData.email }
      });
      if (existing) {
        // Actualizar MyAlice ID si no lo tenía
        return await prisma.customer.update({
          where: { id: existing.id },
          data: { myaliceId: customerData.id }
        });
      }
    }

    // Crear nuevo cliente
    return await prisma.customer.create({
      data: {
        myaliceId: customerData.id,
        email: customerData.email,
        phone: customerData.phone,
        name: customerData.name,
        whatsappNumber: customerData.phone
      }
    });
  } catch (error) {
    console.error('Error encontrando/creando cliente:', error);
    throw error;
  }
}

async function queueMessageForProcessing(conversationId: string, message: string, customerId: string) {
  try {
    // Crear tarea en cola para procesamiento asíncrono
    await prisma.messageQueue.create({
      data: {
        type: 'process_agent_message',
        payload: {
          conversationId,
          message,
          customerId,
          timestamp: new Date().toISOString()
        },
        priority: 5, // Prioridad normal
        processAt: new Date() // Procesar inmediatamente
      }
    });

    console.log('Mensaje encolado para procesamiento:', conversationId);
  } catch (error) {
    console.error('Error encolando mensaje:', error);
  }
}
