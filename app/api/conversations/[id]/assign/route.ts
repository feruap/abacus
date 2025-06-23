
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { MyAliceClient } from '@/lib/api-clients';

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ 
        success: false,
        error: 'No autorizado' 
      }, { status: 401 });
    }

    const conversationId = params.id;
    const { action } = await request.json();

    // Buscar la conversación
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: true,
        myaliceChannel: true
      }
    });

    if (!conversation) {
      return NextResponse.json({
        success: false,
        message: 'Conversación no encontrada'
      }, { status: 404 });
    }

    const agentId = session.user?.email || 'admin';
    const myAliceClient = new MyAliceClient();

    let updatedConversation;

    if (action === 'take') {
      // Tomar control de la conversación
      try {
        // Intentar tomar control en MyAlice.ai si hay ticket ID
        if (conversation.myaliceTicketId) {
          await myAliceClient.takeControlOfConversation(conversation.myaliceTicketId, agentId);
        }
      } catch (error) {
        console.warn('Error tomando control en MyAlice.ai:', error);
        // Continuar con la operación local aunque falle la de MyAlice.ai
      }

      // Actualizar localmente
      updatedConversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          assignedTo: agentId,
          humanTookOver: true,
          humanTakeoverAt: new Date(),
          status: 'escalated',
          updatedAt: new Date()
        },
        include: {
          customer: true,
          myaliceChannel: true
        }
      });

      // Crear mensaje del sistema
      await prisma.message.create({
        data: {
          conversationId: conversationId,
          direction: 'outbound',
          messageType: 'system',
          content: `${agentId} se ha unido a la conversación y ha tomado control.`,
          status: 'sent',
          sentAt: new Date()
        }
      });

      // Registrar acción
      await prisma.conversationAction.create({
        data: {
          conversationId: conversationId,
          actionType: 'human_takeover',
          performedBy: agentId,
          reason: 'Agente tomó control manual',
          previousStatus: conversation.status,
          newStatus: 'escalated'
        }
      });

    } else if (action === 'release') {
      // Liberar control de la conversación
      try {
        if (conversation.myaliceTicketId) {
          await myAliceClient.releaseControlOfConversation(conversation.myaliceTicketId);
        }
      } catch (error) {
        console.warn('Error liberando control en MyAlice.ai:', error);
      }

      updatedConversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          assignedTo: null,
          humanTookOver: false,
          status: 'active',
          updatedAt: new Date()
        },
        include: {
          customer: true,
          myaliceChannel: true
        }
      });

      // Crear mensaje del sistema
      await prisma.message.create({
        data: {
          conversationId: conversationId,
          direction: 'outbound',
          messageType: 'system',
          content: `${agentId} ha liberado el control de la conversación.`,
          status: 'sent',
          sentAt: new Date()
        }
      });

      // Registrar acción
      await prisma.conversationAction.create({
        data: {
          conversationId: conversationId,
          actionType: 'bot_resume',
          performedBy: agentId,
          reason: 'Agente liberó control manual',
          previousStatus: conversation.status,
          newStatus: 'active'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Acción no válida'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: action === 'take' ? 'Control tomado exitosamente' : 'Control liberado exitosamente',
      conversation: {
        id: updatedConversation.id,
        status: updatedConversation.status,
        assignedAgent: updatedConversation.assignedTo,
        humanTookOver: updatedConversation.humanTookOver,
        updatedAt: updatedConversation.updatedAt
      }
    });

  } catch (error) {
    console.error('Error en asignación de conversación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error asignando conversación',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: true,
        myaliceChannel: true,
        sentimentAnalysis: {
          orderBy: { analyzedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({
        success: false,
        message: 'Conversación no encontrada'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        customer: conversation.customer,
        status: conversation.status,
        assignedAgent: conversation.assignedTo,
        humanTookOver: conversation.humanTookOver,
        channel: conversation.myaliceChannel?.name || conversation.channel,
        sentiment: conversation.sentimentAnalysis[0]?.sentiment || 'neutral',
        subject: conversation.subject,
        priority: conversation.priority,
        tags: conversation.tags,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });

  } catch (error) {
    console.error('Error obteniendo conversación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo conversación',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
