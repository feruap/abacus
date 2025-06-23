
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        humanTookOver: true,
        humanTakeoverAt: new Date(),
        assignedTo: 'admin', // In a real app, get from session
        status: 'escalated'
      }
    });

    // Create a system message to indicate takeover
    await prisma.message.create({
      data: {
        conversationId: conversationId,
        direction: 'outbound',
        messageType: 'system',
        content: 'Un agente humano se ha unido a la conversación.',
        status: 'sent'
      }
    });

    return NextResponse.json({ 
      success: true, 
      conversation 
    });
  } catch (error) {
    console.error('Error taking over conversation:', error);
    return NextResponse.json({ error: 'Failed to take over conversation' }, { status: 500 });
  }
}
