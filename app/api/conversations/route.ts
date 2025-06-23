
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Fetch conversations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');
    const search = searchParams.get('search') || '';

    const where: any = {};
    
    // Filtro por estado
    if (status && status !== 'all') {
      where.status = status;
    }
    
    // Filtro por canal
    if (channel && channel !== 'all') {
      where.channel = channel;
    }
    
    // Filtro por búsqueda
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        customer: true,
        myaliceChannel: true,
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1
        },
        sentimentAnalysis: {
          orderBy: { analyzedAt: 'desc' },
          take: 1
        },
        _count: {
          select: { messages: true }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'desc' }
    });

    const total = await prisma.conversation.count({ where });

    return NextResponse.json({
      success: true,
      conversations: conversations.map(conv => ({
        id: conv.id,
        customer: {
          name: conv.customer.name || 'Cliente',
          phone: conv.customer.phone,
          email: conv.customer.email
        },
        status: conv.status,
        assignedAgent: conv.assignedTo,
        lastMessage: conv.messages[0]?.content || conv.subject || 'Sin mensajes',
        lastMessageAt: conv.messages[0]?.sentAt || conv.updatedAt,
        channel: conv.myaliceChannel?.name || conv.channel,
        sentiment: conv.sentimentAnalysis[0]?.sentiment || 'neutral',
        metadata: {
          channel_id: conv.channelId,
          agent_id: conv.assignedTo,
          tags: conv.tags,
          myalice_ticket_id: conv.myaliceTicketId
        },
        messageCount: conv._count.messages,
        priority: conv.priority,
        humanTookOver: conv.humanTookOver,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch conversations',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST - Create conversation
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const conversation = await prisma.conversation.create({
      data: {
        myaliceTicketId: data.myaliceTicketId,
        customerId: data.customerId,
        channel: data.channel || 'whatsapp',
        status: data.status || 'active',
        priority: data.priority || 'normal',
        subject: data.subject,
        tags: data.tags || []
      },
      include: {
        customer: true
      }
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
