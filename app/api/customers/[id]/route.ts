
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Fetch customer details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        attributes: {
          orderBy: { key: 'asc' }
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 10,
          include: {
            _count: {
              select: { messages: true }
            }
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        myaliceId: customer.myaliceId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        whatsappNumber: customer.whatsappNumber,
        registeredAt: customer.registeredAt,
        avatar: customer.avatar,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        averageOrderValue: customer.averageOrderValue,
        lastOrderDate: customer.lastOrderDate,
        customerSegment: customer.customerSegment,
        tags: customer.tags,
        notes: customer.notes,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        attributes: customer.attributes.map(attr => ({
          id: attr.id,
          key: attr.key,
          value: attr.value,
          type: attr.type,
          isDefault: attr.isDefault,
          createdAt: attr.createdAt,
          updatedAt: attr.updatedAt
        })),
        tickets: customer.tickets.map(ticket => ({
          id: ticket.id,
          myaliceId: ticket.myaliceId,
          number: ticket.number,
          subject: ticket.subject,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          channel: ticket.channel,
          assignedTo: ticket.assignedTo,
          tags: ticket.tags,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          resolvedAt: ticket.resolvedAt
        })),
        orders: customer.orders.map(order => ({
          id: order.id,
          myaliceId: order.myaliceId,
          number: order.number,
          total: order.total,
          currency: order.currency,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          shippingMethod: order.shippingMethod,
          shippingStatus: order.shippingStatus,
          items: order.items,
          placedAt: order.placedAt,
          shippedAt: order.shippedAt,
          deliveredAt: order.deliveredAt
        })),
        conversations: customer.conversations.map(conv => ({
          id: conv.id,
          status: conv.status,
          channel: conv.channel,
          subject: conv.subject,
          messageCount: conv._count.messages,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch customer details',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PATCH - Update customer
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        whatsappNumber: data.whatsappNumber,
        customerSegment: data.customerSegment,
        tags: data.tags,
        notes: data.notes,
        isActive: data.isActive
      }
    });

    return NextResponse.json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update customer'
    }, { status: 500 });
  }
}
