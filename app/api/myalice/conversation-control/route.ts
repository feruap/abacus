
import { NextRequest, NextResponse } from 'next/server';
import { MyAliceClient } from '@/lib/api-clients';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, conversationId, reason } = body;

    // Validar datos requeridos
    if (!action || !conversationId) {
      return NextResponse.json(
        { error: 'action y conversationId son requeridos' },
        { status: 400 }
      );
    }

    // Buscar la conversación
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { 
        customer: true,
        myaliceChannel: true 
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    const myaliceClient = new MyAliceClient();
    let result;
    let newStatus = conversation.status;
    let humanTookOver = conversation.humanTookOver;

    switch (action) {
      case 'take_control':
        if (conversation.myaliceTicketId) {
          result = await myaliceClient.takeControlOfConversation(
            conversation.myaliceTicketId,
            session.user.email
          );
        }
        
        newStatus = 'active';
        humanTookOver = true;
        
        // Actualizar conversación en BD
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            status: newStatus,
            humanTookOver: true,
            humanTakeoverAt: new Date(),
            assignedTo: session.user.email
          }
        });

        break;

      case 'release_control':
        if (conversation.myaliceTicketId) {
          result = await myaliceClient.releaseControlOfConversation(
            conversation.myaliceTicketId
          );
        }

        humanTookOver = false;
        
        // Actualizar conversación en BD
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            humanTookOver: false,
            assignedTo: null
          }
        });

        break;

      case 'close':
        if (conversation.myaliceTicketId) {
          result = await myaliceClient.closeConversation(
            conversation.myaliceTicketId,
            reason
          );
        }

        newStatus = 'closed';
        
        // Actualizar conversación en BD
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            status: newStatus,
            resolvedAt: new Date()
          }
        });

        break;

      case 'escalate':
        newStatus = 'escalated';
        
        // Crear escalación
        await prisma.escalation.create({
          data: {
            conversationId,
            type: 'manual',
            reason: reason || 'Escalación manual',
            priority: 'normal'
          }
        });

        // Actualizar conversación
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            status: newStatus,
            priority: 'high'
          }
        });

        break;

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

    // Registrar la acción
    await prisma.conversationAction.create({
      data: {
        conversationId,
        actionType: action,
        performedBy: session.user.email,
        reason,
        previousStatus: conversation.status,
        newStatus,
        metadata: {
          myalice_result: result as any,
          user_agent: request.headers.get('user-agent'),
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        }
      }
    });

    return NextResponse.json({
      success: true,
      action,
      conversation_id: conversationId,
      new_status: newStatus,
      human_took_over: humanTookOver,
      result
    });

  } catch (error) {
    console.error('Error en control de conversación:', error);
    return NextResponse.json(
      { error: 'Error en operación de control' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId es requerido' },
        { status: 400 }
      );
    }

    // Obtener historial de acciones de la conversación
    const actions = await prisma.conversationAction.findMany({
      where: { conversationId },
      orderBy: { performedAt: 'desc' }
    });

    // Obtener estado actual de la conversación
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: true,
        myaliceChannel: true
      }
    });

    return NextResponse.json({
      success: true,
      conversation,
      actions,
      can_take_control: !conversation?.humanTookOver,
      can_release_control: conversation?.humanTookOver,
      can_close: conversation?.status !== 'closed',
      can_escalate: !['escalated', 'closed'].includes(conversation?.status || '')
    });

  } catch (error) {
    console.error('Error obteniendo control de conversación:', error);
    return NextResponse.json(
      { error: 'Error al obtener información' },
      { status: 500 }
    );
  }
}
