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
    
    // Log webhook received for debugging
    console.log('MyAlice webhook received:', {
      action: payload.action,
      timestamp: new Date().toISOString(),
      ticketId: payload.ticket?.id,
      customerId: payload.customer?.id
    });
    
    // Process webhook asynchronously
    processWebhookAsync(payload);
    
    // Return 200 OK immediately to satisfy MyAlice.ai requirements
    return NextResponse.json({ received: true, status: 'processed' }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing MyAlice webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  // For now, skip signature verification if no secret is configured
  if (!signature && !process.env.MYALICE_WEBHOOK_SECRET) {
    console.log('Webhook signature verification skipped - no secret configured');
    return true;
  }
  
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
    const { action, customer, ticket, message, order, attributes } = payload;
    
    console.log('Processing webhook action:', action);
    
    switch (action) {
      case 'ticket.created':
      case 'ticket_created':
        await handleTicketCreated(customer, ticket);
        break;
      case 'message.received':
      case 'message_received':
        await handleMessageReceived(customer, ticket, message);
        break;
      case 'ticket.resolved':
      case 'ticket_resolved':
        await handleTicketResolved(ticket);
        break;
      case 'ticket.updated':
      case 'ticket_updated':
        await handleTicketUpdated(ticket);
        break;
      case 'customer.created':
      case 'customer_created':
        await handleCustomerCreated(customer, attributes);
        break;
      case 'customer.updated':
      case 'customer_updated':
        await handleCustomerUpdated(customer, attributes);
        break;
      case 'order.created':
      case 'order_created':
        await handleOrderCreated(customer, order);
        break;
      case 'order.updated':
      case 'order_updated':
        await handleOrderUpdated(order);
        break;
      case 'attributes.updated':
      case 'attributes_updated':
        await handleAttributesUpdated(customer, attributes);
        break;
      default:
        console.log('Unknown webhook action:', action);
    }
  } catch (error) {
    console.error('Error in async webhook processing:', error);
  }
}

async function handleCustomerCreated(customerData: any, attributesData?: any) {
  try {
    const customer = await prisma.customer.upsert({
      where: { myaliceId: customerData.id },
      update: {
        email: customerData.email,
        phone: customerData.phone,
        name: customerData.name,
        whatsappNumber: customerData.whatsapp_number || customerData.phone,
        registeredAt: customerData.created_at ? new Date(customerData.created_at) : new Date(),
        avatar: customerData.avatar,
        isActive: customerData.is_active !== false
      },
      create: {
        myaliceId: customerData.id,
        email: customerData.email,
        phone: customerData.phone,
        name: customerData.name,
        whatsappNumber: customerData.whatsapp_number || customerData.phone,
        registeredAt: customerData.created_at ? new Date(customerData.created_at) : new Date(),
        avatar: customerData.avatar,
        isActive: customerData.is_active !== false
      }
    });

    // Handle customer attributes
    if (attributesData || customerData.attributes) {
      await handleCustomerAttributes(customer.id, attributesData || customerData.attributes);
    }
    
    console.log('Customer created/updated:', customer.id);
    return customer;
  } catch (error) {
    console.error('Error handling customer created:', error);
    return null;
  }
}

async function handleTicketCreated(customerData: any, ticketData: any) {
  try {
    // Find or create customer
    const customer = await prisma.customer.upsert({
      where: { myaliceId: customerData.id },
      update: {
        email: customerData.email,
        phone: customerData.phone,
        name: customerData.name,
        whatsappNumber: customerData.whatsapp_number || customerData.phone,
        registeredAt: customerData.created_at ? new Date(customerData.created_at) : undefined,
        avatar: customerData.avatar,
        isActive: customerData.is_active !== false
      },
      create: {
        myaliceId: customerData.id,
        email: customerData.email,
        phone: customerData.phone,
        name: customerData.name,
        whatsappNumber: customerData.whatsapp_number || customerData.phone,
        registeredAt: customerData.created_at ? new Date(customerData.created_at) : new Date(),
        avatar: customerData.avatar,
        isActive: customerData.is_active !== false
      }
    });

    // Create ticket record
    const ticket = await prisma.ticket.create({
      data: {
        myaliceId: ticketData.id,
        customerId: customer.id,
        number: ticketData.number || `#${ticketData.id}`,
        subject: ticketData.subject || 'Nueva consulta',
        description: ticketData.description || ticketData.conversation_text,
        status: 'open',
        priority: ticketData.priority || 'normal',
        channel: ticketData.channel || 'whatsapp',
        assignedTo: ticketData.assigned_to,
        tags: ticketData.tags || [],
        metadata: {
          myaliceData: ticketData
        }
      }
    });

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        myaliceTicketId: ticketData.id,
        customerId: customer.id,
        channel: ticketData.channel || 'whatsapp',
        status: 'active',
        priority: ticketData.priority || 'normal',
        subject: ticketData.subject || 'Nueva conversación'
      }
    });

    console.log('Ticket and conversation created:', { ticketId: ticket.id, conversationId: conversation.id });

    // If there's an initial message, process it
    if (ticketData.conversation_text) {
      await handleMessageReceived(customerData, ticketData, {
        content: ticketData.conversation_text,
        type: 'text'
      });
    }
  } catch (error) {
    console.error('Error handling ticket created:', error);
  }
}

async function handleMessageReceived(customerData: any, ticketData: any, messageData: any) {
  try {
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

    console.log('Message created:', message.id);

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
  } catch (error) {
    console.error('Error handling message received:', error);
  }
}

async function handleTicketResolved(ticketData: any) {
  try {
    await prisma.conversation.updateMany({
      where: { myaliceTicketId: ticketData.id },
      data: {
        status: 'resolved',
        resolvedAt: new Date()
      }
    });
    
    console.log('Ticket resolved:', ticketData.id);
  } catch (error) {
    console.error('Error handling ticket resolved:', error);
  }
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

      console.log('LLM response created for conversation:', conversation.id);
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
          confidence: 0.8,
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
  try {
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
    
    console.log('Conversation escalated:', conversationId);
  } catch (error) {
    console.error('Error escalating conversation:', error);
  }
}

async function handleCustomerUpdated(customerData: any, attributesData?: any) {
  try {
    const customer = await prisma.customer.update({
      where: { myaliceId: customerData.id },
      data: {
        email: customerData.email,
        phone: customerData.phone,
        name: customerData.name,
        whatsappNumber: customerData.whatsapp_number || customerData.phone,
        avatar: customerData.avatar,
        isActive: customerData.is_active !== false
      }
    });

    // Handle customer attributes
    if (attributesData || customerData.attributes) {
      await handleCustomerAttributes(customer.id, attributesData || customerData.attributes);
    }
    
    console.log('Customer updated:', customer.id);
    return customer;
  } catch (error) {
    console.error('Error handling customer updated:', error);
    return null;
  }
}

async function handleTicketUpdated(ticketData: any) {
  try {
    await prisma.ticket.updateMany({
      where: { myaliceId: ticketData.id },
      data: {
        subject: ticketData.subject,
        description: ticketData.description,
        status: ticketData.status,
        priority: ticketData.priority,
        assignedTo: ticketData.assigned_to,
        tags: ticketData.tags || [],
        resolvedAt: ticketData.resolved_at ? new Date(ticketData.resolved_at) : undefined,
        metadata: {
          myaliceData: ticketData
        }
      }
    });
    
    console.log('Ticket updated:', ticketData.id);
  } catch (error) {
    console.error('Error handling ticket updated:', error);
  }
}

async function handleOrderCreated(customerData: any, orderData: any) {
  try {
    // Find or create customer
    const customer = await prisma.customer.upsert({
      where: { myaliceId: customerData.id },
      update: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: orderData.total || 0 },
        lastOrderDate: new Date()
      },
      create: {
        myaliceId: customerData.id,
        email: customerData.email,
        phone: customerData.phone,
        name: customerData.name,
        whatsappNumber: customerData.whatsapp_number || customerData.phone,
        totalOrders: 1,
        totalSpent: orderData.total || 0,
        lastOrderDate: new Date()
      }
    });

    // Create order record
    const order = await prisma.order.create({
      data: {
        myaliceId: orderData.id,
        customerId: customer.id,
        number: orderData.number || `#${orderData.id}`,
        total: orderData.total || 0,
        currency: orderData.currency || 'MXN',
        status: orderData.status || 'pending',
        paymentMethod: orderData.payment_method,
        paymentStatus: orderData.payment_status,
        shippingMethod: orderData.shipping_method,
        shippingStatus: orderData.shipping_status,
        items: orderData.items || [],
        placedAt: orderData.placed_at ? new Date(orderData.placed_at) : new Date(),
        shippedAt: orderData.shipped_at ? new Date(orderData.shipped_at) : undefined,
        deliveredAt: orderData.delivered_at ? new Date(orderData.delivered_at) : undefined,
        metadata: {
          myaliceData: orderData
        }
      }
    });

    console.log('Order created:', order.id);
    return order;
  } catch (error) {
    console.error('Error handling order created:', error);
    return null;
  }
}

async function handleOrderUpdated(orderData: any) {
  try {
    await prisma.order.updateMany({
      where: { myaliceId: orderData.id },
      data: {
        status: orderData.status,
        paymentStatus: orderData.payment_status,
        shippingStatus: orderData.shipping_status,
        shippedAt: orderData.shipped_at ? new Date(orderData.shipped_at) : undefined,
        deliveredAt: orderData.delivered_at ? new Date(orderData.delivered_at) : undefined,
        metadata: {
          myaliceData: orderData
        }
      }
    });
    
    console.log('Order updated:', orderData.id);
  } catch (error) {
    console.error('Error handling order updated:', error);
  }
}

async function handleAttributesUpdated(customerData: any, attributesData: any) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { myaliceId: customerData.id }
    });

    if (customer) {
      await handleCustomerAttributes(customer.id, attributesData);
      console.log('Customer attributes updated for:', customer.id);
    }
  } catch (error) {
    console.error('Error handling attributes updated:', error);
  }
}

async function handleCustomerAttributes(customerId: string, attributesData: any) {
  try {
    if (!attributesData || typeof attributesData !== 'object') {
      return;
    }

    // Process each attribute
    for (const [key, value] of Object.entries(attributesData)) {
      if (value !== null && value !== undefined) {
        await prisma.customerAttribute.upsert({
          where: {
            customerId_key: {
              customerId,
              key
            }
          },
          update: {
            value: String(value),
            type: typeof value === 'boolean' ? 'boolean' : 
                  typeof value === 'number' ? 'number' : 'text'
          },
          create: {
            customerId,
            key,
            value: String(value),
            type: typeof value === 'boolean' ? 'boolean' : 
                  typeof value === 'number' ? 'number' : 'text',
            isDefault: ['default', 'reminder_sent', 'ticket_status', 'business_hours'].includes(key)
          }
        });
      }
    }

    console.log('Customer attributes processed for:', customerId);
  } catch (error) {
    console.error('Error handling customer attributes:', error);
  }
}
