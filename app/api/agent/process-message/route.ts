
import { NextRequest, NextResponse } from 'next/server';
import { LLMAgentService } from '@/lib/llm-agent-service';
import { MyAliceClient } from '@/lib/api-clients';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();
const agentService = new LLMAgentService();
const myAliceClient = new MyAliceClient();

// Endpoint principal para procesar mensajes del agente LLM
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Procesando mensaje del agente:', body);

    // Validar estructura del payload
    if (!body.conversationId || !body.message) {
      return NextResponse.json(
        { error: 'conversationId y message son requeridos' },
        { status: 400 }
      );
    }

    // Procesar mensaje con el agente LLM
    const result = await processMessageWithAgent(body);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Error procesando mensaje:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function processMessageWithAgent(payload: any) {
  const { conversationId, message, customerId, metadata } = payload;

  try {
    // 1. Obtener información de la conversación
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: true,
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 10
        }
      }
    });

    if (!conversation) {
      throw new Error('Conversación no encontrada');
    }

    // 2. Construir contexto para el agente
    const agentContext = {
      conversationId,
      customerId: conversation.customerId,
      customerInfo: conversation.customer,
      conversationHistory: conversation.messages,
      currentMessage: message,
      metadata
    };

    // 3. Procesar con el agente LLM
    const agentResponse = await agentService.processMessage(agentContext);

    // 4. Enviar respuesta a través de MyAlice.ai
    if (agentResponse.message && conversation.myaliceTicketId) {
      await sendResponseToMyAlice(conversation, agentResponse);
    }

    // 5. Ejecutar acciones adicionales si es necesario
    if (agentResponse.action) {
      await executeAgentAction(agentResponse, conversation);
    }

    // 6. Actualizar estado de la conversación si es necesario
    if (agentResponse.needsHumanIntervention) {
      await escalateToHuman(conversationId, 'Agente LLM solicitó intervención humana');
    }

    return {
      agentResponse: agentResponse.message,
      action: agentResponse.action,
      actionData: agentResponse.actionData,
      needsHumanIntervention: agentResponse.needsHumanIntervention,
      confidence: agentResponse.confidence,
      intent: agentResponse.intent
    };

  } catch (error) {
    console.error('Error en processMessageWithAgent:', error);
    throw error;
  }
}

async function sendResponseToMyAlice(conversation: any, agentResponse: any) {
  try {
    if (!conversation.channelId || !conversation.customer?.phone) {
      console.warn('Información insuficiente para enviar mensaje a MyAlice.ai');
      return;
    }

    // Enviar mensaje de texto
    await myAliceClient.sendTextMessage(
      conversation.channelId,
      conversation.customer.phone,
      agentResponse.message
    );

    console.log('Mensaje enviado exitosamente a MyAlice.ai');
  } catch (error) {
    console.error('Error enviando mensaje a MyAlice.ai:', error);
  }
}

async function executeAgentAction(agentResponse: any, conversation: any) {
  try {
    const { action, actionData } = agentResponse;

    switch (action) {
      case 'create_order':
        await handleCreateOrder(actionData, conversation);
        break;
      
      case 'apply_discount':
        await handleApplyDiscount(actionData, conversation);
        break;
      
      case 'send_product_info':
        await handleSendProductInfo(actionData, conversation);
        break;
      
      case 'schedule_followup':
        await handleScheduleFollowup(actionData, conversation);
        break;
      
      case 'escalate':
        await escalateToHuman(conversation.id, actionData.reason || 'Escalamiento automático');
        break;

      default:
        console.log('Acción no reconocida:', action);
    }
  } catch (error) {
    console.error('Error ejecutando acción del agente:', error);
  }
}

async function handleCreateOrder(actionData: any, conversation: any) {
  // Implementar lógica de creación de orden
  console.log('Creando orden:', actionData);
}

async function handleApplyDiscount(actionData: any, conversation: any) {
  // Implementar lógica de aplicación de descuentos
  console.log('Aplicando descuento:', actionData);
}

async function handleSendProductInfo(actionData: any, conversation: any) {
  // Implementar envío de información de productos
  console.log('Enviando información de producto:', actionData);
}

async function handleScheduleFollowup(actionData: any, conversation: any) {
  // Implementar programación de seguimiento
  console.log('Programando seguimiento:', actionData);
}

async function escalateToHuman(conversationId: string, reason: string) {
  try {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'escalated',
        humanTookOver: true,
        humanTakeoverAt: new Date()
      }
    });

    await prisma.escalation.create({
      data: {
        conversationId,
        type: 'automatic',
        reason,
        status: 'pending'
      }
    });

    console.log('Conversación escalada a agente humano');
  } catch (error) {
    console.error('Error escalando conversación:', error);
  }
}
