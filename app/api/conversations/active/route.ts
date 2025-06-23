
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const activeConversations = await prisma.conversation.findMany({
      where: {
        status: 'active'
      },
      include: {
        customer: true,
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 50 // Limit to 50 most recent active conversations
    });

    const formattedConversations = activeConversations.map(conv => ({
      id: conv.id,
      customer: {
        name: conv.customer.name,
        email: conv.customer.email,
        phone: conv.customer.phone
      },
      lastMessage: conv.messages[0]?.content || 'Sin mensajes recientes',
      status: conv.status,
      priority: conv.priority,
      channel: conv.channel,
      responseTime: Math.floor(Math.random() * 10) + 1, // Mock response time
      isHuman: conv.humanTookOver,
      updatedAt: conv.updatedAt
    }));

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching active conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch active conversations' }, { status: 500 });
  }
}
