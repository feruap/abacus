
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { LLMClient } from '@/lib/api-clients';
import crypto from 'crypto';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('X-Myalice-Signature');
    const body = await request.text();
    
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    
    // Process webhook asynchronously
    processWebhookAsync(payload);
    
    // Return 200 OK immediately to satisfy MyAlice.ai requirements
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  
  const secret = process.env.MYALICE_WEBHOOK_SECRET || '';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
    
  return signature === expectedSignature;
}

async function processWebhookAsync(payload: any) {
  try {
    const { action, customer, ticket, message } = payload;
    
    switch (action) {
      case 'ticket.created':
        await handleTicketCreated(customer, ticket);
        break;
      case 'message.received':
        await handleMessageReceived(customer, ticket, message);
        break;
      case 'ticket.resolved':
        await handleTicketResolved(ticket);
        break;
      default:
        console.log('Unknown webhook action:', action);
    }
  } catch (error) {
    console.error('Error in async webhook processing:', error);
  }
}

async function handleTicketCreated(customerData: any, ticketData: any) {
  // Find or create customer
  const customer = await prisma.customer.upsert({
    where: { myaliceId: customerData.id },
    update: {
      email: customerData.email,
      phone: customerData.phone,
      name: customerData.name,
      whatsappNumber: customerData.whatsapp_number
    },
    create: {
      myaliceId: customerData.id,
      email: customerData.email,
      phone: customerData.phone,
      name: customerData.name,
      whatsappNumber: customerData.whatsapp_number
    }
  });

  // Create conversation
  const conversation = await prisma.conversation.create({
    data: {
      myaliceTicketId: ticketData.id,
      customerId: customer.id,
      channel: ticketData.channel || 'whatsapp',
      status: 'active',
      priority: 'normal',
      subject: ticketData.subject || 'Nueva conversación'
    }
  });

  // If there's an initial message, process it
  if (ticketData.conversation_text) {
    await handleMessageReceived(customerData, ticketData, {
      content: ticketData.conversation_text,
      type: 'text'
    });
  }
}

async function handleMessageReceived(customerData: any, ticketData: any, messageData: any) {
  // Find conversation
  const conversation = await prisma.conversation.findUnique({
    where: { myaliceTicketId: ticketData.id },
    include: { customer: true }
  });

  if (!conversation) {
    console.error('Conversation not found for ticket:', ticketData.id);
    return;
  }

  // Create message record
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: 'inbound',
      messageType: messageData.type || 'text',
      content: messageData.content,
      status: 'received'
    }
  });

  // Process with LLM if not taken over by human
  if (!conversation.humanTookOver) {
    await processMessageWithLLM(conversation, message);
  }

  // Update conversation
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      messageCount: { increment: 1 },
      updatedAt: new Date()
    }
  });
}

async function handleTicketResolved(ticketData: any) {
  await prisma.conversation.updateMany({
    where: { myaliceTicketId: ticketData.id },
    data: {
      status: 'resolved',
      resolvedAt: new Date()
    }
  });
}

async function processMessageWithLLM(conversation: any, message: any) {
  try {
    const llmClient = new LLMClient();
    
    // Get conversation context
    const recentMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { sentAt: 'desc' },
      take: 10
    });

    // Build context for LLM
    const context = recentMessages.reverse().map(msg => ({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Add system prompt
    context.unshift({
      role: 'system',
      content: `Eres un asistente de ventas inteligente. Ayuda a los clientes con consultas sobre productos, precios y pedidos. Sé amable, profesional y útil. Si no puedes resolver algo, ofrece escalarlo a un agente humano.`
    });

    // Get LLM response
    const response = await llmClient.chatCompletion(context);
    const responseContent = response.choices[0]?.message?.content;

    if (responseContent) {
      // Create response message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: 'outbound',
          messageType: 'text',
          content: responseContent,
          status: 'sent',
          processedByLLM: true,
          llmResponse: responseContent
        }
      });

      // Send response via MyAlice (implement actual API call)
      // await sendMessageViaMyAlice(conversation.myaliceTicketId, responseContent);
    }

    // Analyze sentiment
    const sentimentResult = await llmClient.analyzeSentiment(message.content);
    
    if (sentimentResult.sentiment && sentimentResult.score !== undefined) {
      await prisma.sentimentAnalysis.create({
        data: {
          conversationId: conversation.id,
          messageId: message.id,
          sentiment: sentimentResult.sentiment,
          score: sentimentResult.score,
          confidence: 0.8, // Mock confidence
          keywords: []
        }
      });

      // Check if escalation is needed based on sentiment
      if (sentimentResult.score < -0.7) {
        await escalateConversation(conversation.id, 'Sentimiento muy negativo detectado');
      }
    }

  } catch (error) {
    console.error('Error processing message with LLM:', error);
  }
}

async function escalateConversation(conversationId: string, reason: string) {
  await prisma.escalation.create({
    data: {
      conversationId,
      type: 'automatic',
      reason,
      priority: 'high',
      status: 'pending'
    }
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: 'escalated',
      priority: 'high'
    }
  });
}
