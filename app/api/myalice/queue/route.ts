
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MessageQueue } from '@/lib/webhook-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Obtener estadísticas de la cola en memoria
    const memoryQueueStats = MessageQueue.getQueueStats();

    // Obtener mensajes de la cola en base de datos
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const queueMessages = await prisma.messageQueue.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      take: limit,
      skip: offset
    });

    const totalMessages = await prisma.messageQueue.count({
      where: whereClause
    });

    // Obtener estadísticas por estado
    const statusStats = await prisma.messageQueue.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    // Obtener estadísticas por tipo
    const typeStats = await prisma.messageQueue.groupBy({
      by: ['type'],
      _count: { type: true }
    });

    return NextResponse.json({
      success: true,
      memory_queue: memoryQueueStats,
      database_queue: {
        messages: queueMessages,
        total: totalMessages,
        limit,
        offset,
        has_more: (offset + limit) < totalMessages
      },
      statistics: {
        by_status: statusStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {} as Record<string, number>),
        by_type: typeStats.reduce((acc, stat) => {
          acc[stat.type] = stat._count.type;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Error obteniendo información de la cola:', error);
    return NextResponse.json(
      { error: 'Error al obtener información de la cola' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, messageId, priority, type, payload } = body;

    switch (action) {
      case 'add':
        if (!type || !payload) {
          return NextResponse.json(
            { error: 'type y payload son requeridos' },
            { status: 400 }
          );
        }

        // Agregar a la cola en memoria
        const queueId = await MessageQueue.add(type, payload, priority || 5);

        // También agregar a la base de datos para persistencia
        const dbMessage = await prisma.messageQueue.create({
          data: {
            type,
            payload,
            priority: priority || 5,
            status: 'pending'
          }
        });

        return NextResponse.json({
          success: true,
          queue_id: queueId,
          db_id: dbMessage.id,
          message: 'Mensaje agregado a la cola'
        });

      case 'retry':
        if (!messageId) {
          return NextResponse.json(
            { error: 'messageId es requerido para retry' },
            { status: 400 }
          );
        }

        // Buscar mensaje en BD
        const message = await prisma.messageQueue.findUnique({
          where: { id: messageId }
        });

        if (!message) {
          return NextResponse.json(
            { error: 'Mensaje no encontrado' },
            { status: 404 }
          );
        }

        // Agregar nuevamente a la cola en memoria
        const retryQueueId = await MessageQueue.add(
          message.type, 
          message.payload, 
          message.priority
        );

        // Actualizar estado en BD
        await prisma.messageQueue.update({
          where: { id: messageId },
          data: {
            status: 'pending',
            attempts: { increment: 1 },
            lastError: null,
            processAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          queue_id: retryQueueId,
          message: 'Mensaje agregado nuevamente a la cola'
        });

      case 'clear_failed':
        // Limpiar mensajes fallidos
        const deletedCount = await prisma.messageQueue.deleteMany({
          where: { status: 'failed' }
        });

        return NextResponse.json({
          success: true,
          deleted_count: deletedCount.count,
          message: 'Mensajes fallidos eliminados'
        });

      case 'clear_completed':
        // Limpiar mensajes completados antiguos (más de 7 días)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const clearedCount = await prisma.messageQueue.deleteMany({
          where: {
            status: 'completed',
            processedAt: {
              lt: weekAgo
            }
          }
        });

        return NextResponse.json({
          success: true,
          cleared_count: clearedCount.count,
          message: 'Mensajes completados antiguos eliminados'
        });

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error en operación de cola:', error);
    return NextResponse.json(
      { error: 'Error en operación de cola' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId es requerido' },
        { status: 400 }
      );
    }

    // Eliminar mensaje de la cola en BD
    await prisma.messageQueue.delete({
      where: { id: messageId }
    });

    return NextResponse.json({
      success: true,
      message: 'Mensaje eliminado de la cola'
    });

  } catch (error) {
    console.error('Error eliminando mensaje de la cola:', error);
    return NextResponse.json(
      { error: 'Error al eliminar mensaje' },
      { status: 500 }
    );
  }
}
