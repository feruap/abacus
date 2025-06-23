
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Fetch conversation details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          include: {
            attributes: true,
            tickets: {
              orderBy: { createdAt: 'desc' }
            },
            orders: {
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        messages: {
          orderBy: { sentAt: 'asc' }
        },
        sentimentAnalysis: {
          orderBy: { analyzedAt: 'desc' }
        },
        myaliceChannel: true,
        products: {
          include: {
            product: true
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        myaliceTicketId: conversation.myaliceTicketId,
        status: conversation.status,
        priority: conversation.priority,
        subject: conversation.subject,
        summary: conversation.summary,
        tags: conversation.tags,
        assignedTo: conversation.assignedTo,
        humanTookOver: conversation.humanTookOver,
        humanTakeoverAt: conversation.humanTakeoverAt,
        responseTime: conversation.responseTime,
        resolutionTime: conversation.resolutionTime,
        messageCount: conversation.messageCount,
        startedAt: conversation.startedAt,
        resolvedAt: conversation.resolvedAt,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        channel: conversation.channel,
        customer: {
          id: conversation.customer.id,
          name: conversation.customer.name,
          email: conversation.customer.email,
          phone: conversation.customer.phone,
          whatsappNumber: conversation.customer.whatsappNumber,
          registeredAt: conversation.customer.registeredAt,
          avatar: conversation.customer.avatar,
          totalOrders: conversation.customer.totalOrders,
          totalSpent: conversation.customer.totalSpent,
          averageOrderValue: conversation.customer.averageOrderValue,
          lastOrderDate: conversation.customer.lastOrderDate,
          customerSegment: conversation.customer.customerSegment,
          tags: conversation.customer.tags,
          attributes: conversation.customer.attributes.map(attr => ({
            id: attr.id,
            key: attr.key,
            value: attr.value,
            type: attr.type,
            isDefault: attr.isDefault,
            createdAt: attr.createdAt,
            updatedAt: attr.updatedAt
          })),
          tickets: conversation.customer.tickets.map(ticket => ({
            id: ticket.id,
            number: ticket.number,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            createdAt: ticket.createdAt,
            resolvedAt: ticket.resolvedAt
          })),
          orders: conversation.customer.orders.map(order => ({
            id: order.id,
            number: order.number,
            total: order.total,
            currency: order.currency,
            status: order.status,
            placedAt: order.placedAt,
            deliveredAt: order.deliveredAt
          }))
        },
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          direction: msg.direction,
          messageType: msg.messageType,
          content: msg.content,
          status: msg.status,
          processedByLLM: msg.processedByLLM,
          llmResponse: msg.llmResponse,
          sentAt: msg.sentAt,
          createdAt: msg.createdAt
        })),
        sentimentAnalysis: conversation.sentimentAnalysis.map(analysis => ({
          id: analysis.id,
          sentiment: analysis.sentiment,
          score: analysis.score,
          confidence: analysis.confidence,
          keywords: analysis.keywords,
          analyzedAt: analysis.analyzedAt
        })),
        products: conversation.products.map(cp => ({
          id: cp.id,
          context: cp.context,
          product: {
            id: cp.product.id,
            name: cp.product.name,
            price: cp.product.price,
            sku: cp.product.sku
          }
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch conversation details',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PATCH - Update conversation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    const conversation = await prisma.conversation.update({
      where: { id: params.id },
      data: {
        status: data.status,
        priority: data.priority,
        assignedTo: data.assignedTo,
        humanTookOver: data.humanTookOver,
        humanTakeoverAt: data.humanTookOver ? new Date() : null,
        resolvedAt: data.status === 'resolved' ? new Date() : null,
        tags: data.tags
      },
      include: {
        customer: true
      }
    });

    return NextResponse.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update conversation'
    }, { status: 500 });
  }
}
