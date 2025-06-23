
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MyAliceClient } from '@/lib/api-clients';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Obtener métricas desde MyAlice.ai
    const myaliceClient = new MyAliceClient();
    let externalMetrics: any;

    if (channelId) {
      externalMetrics = await myaliceClient.getChannelMetrics(channelId, startDate || undefined, endDate || undefined) as any;
    } else {
      externalMetrics = await myaliceClient.getMessageMetrics(startDate || undefined, endDate || undefined) as any;
    }

    // Obtener métricas locales
    const whereClause: any = {};
    if (channelId) {
      const localChannel = await prisma.myAliceChannel.findFirst({
        where: { myaliceId: channelId }
      });
      if (localChannel) {
        whereClause.channelId = localChannel.id;
      }
    }

    if (startDate) {
      whereClause.date = {
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      whereClause.date = {
        ...whereClause.date,
        lte: new Date(endDate)
      };
    }

    const localMetrics = await prisma.myAliceMetrics.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });

    // Obtener estadísticas de conversaciones
    const conversationStats = await prisma.conversation.groupBy({
      by: ['status'],
      _count: { status: true },
      where: {
        ...(channelId && {
          myaliceChannel: {
            myaliceId: channelId
          }
        }),
        ...(startDate && {
          createdAt: {
            gte: new Date(startDate)
          }
        }),
        ...(endDate && {
          createdAt: {
            ...((startDate && { gte: new Date(startDate) }) ? { gte: new Date(startDate) } : {}),
            lte: new Date(endDate)
          }
        })
      }
    });

    // Obtener estadísticas de mensajes
    const messageStats = await prisma.message.groupBy({
      by: ['direction'],
      _count: { direction: true },
      where: {
        ...(channelId && {
          myaliceChannel: {
            myaliceId: channelId
          }
        }),
        ...(startDate && {
          createdAt: {
            gte: new Date(startDate)
          }
        }),
        ...(endDate && {
          createdAt: {
            ...((startDate && { gte: new Date(startDate) }) ? { gte: new Date(startDate) } : {}),
            lte: new Date(endDate)
          }
        })
      }
    });

    // Obtener análisis de sentimiento
    const sentimentStats = await prisma.sentimentAnalysis.groupBy({
      by: ['sentiment'],
      _count: { sentiment: true },
      _avg: { score: true },
      where: {
        ...(startDate && {
          analyzedAt: {
            gte: new Date(startDate)
          }
        }),
        ...(endDate && {
          analyzedAt: {
            ...((startDate && { gte: new Date(startDate) }) ? { gte: new Date(startDate) } : {}),
            lte: new Date(endDate)
          }
        })
      }
    });

    return NextResponse.json({
      success: true,
      external_metrics: externalMetrics,
      local_metrics: localMetrics,
      conversation_stats: conversationStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {} as Record<string, number>),
      message_stats: messageStats.reduce((acc, stat) => {
        acc[stat.direction] = stat._count.direction;
        return acc;
      }, {} as Record<string, number>),
      sentiment_stats: {
        distribution: sentimentStats.reduce((acc, stat) => {
          acc[stat.sentiment] = stat._count.sentiment;
          return acc;
        }, {} as Record<string, number>),
        averages: sentimentStats.reduce((acc, stat) => {
          acc[stat.sentiment] = Number(stat._avg.score) || 0;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    return NextResponse.json(
      { error: 'Error al obtener métricas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, channelId, date } = body;

    if (action === 'sync') {
      // Sincronizar métricas para una fecha específica
      const targetDate = date ? new Date(date) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      const myaliceClient = new MyAliceClient();
      
      if (channelId) {
        // Sincronizar métricas de un canal específico
        const metrics = await myaliceClient.getChannelMetrics(
          channelId,
          targetDate.toISOString(),
          new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString()
        ) as any;

        const localChannel = await prisma.myAliceChannel.findFirst({
          where: { myaliceId: channelId }
        });

        if (!localChannel) {
          return NextResponse.json(
            { error: 'Canal no encontrado' },
            { status: 404 }
          );
        }

        const syncedMetrics = await prisma.myAliceMetrics.upsert({
          where: {
            channelId_date: {
              channelId: localChannel.id,
              date: targetDate
            }
          },
          update: {
            totalMessages: metrics.total_messages || 0,
            inboundMessages: metrics.inbound_messages || 0,
            outboundMessages: metrics.outbound_messages || 0,
            totalConversations: metrics.total_conversations || 0,
            newConversations: metrics.new_conversations || 0,
            resolvedConversations: metrics.resolved_conversations || 0,
            avgResponseTime: metrics.avg_response_time ? Number(metrics.avg_response_time) : null,
            avgResolutionTime: metrics.avg_resolution_time ? Number(metrics.avg_resolution_time) : null,
          },
          create: {
            channelId: localChannel.id,
            date: targetDate,
            totalMessages: metrics.total_messages || 0,
            inboundMessages: metrics.inbound_messages || 0,
            outboundMessages: metrics.outbound_messages || 0,
            totalConversations: metrics.total_conversations || 0,
            newConversations: metrics.new_conversations || 0,
            resolvedConversations: metrics.resolved_conversations || 0,
            avgResponseTime: metrics.avg_response_time ? Number(metrics.avg_response_time) : null,
            avgResolutionTime: metrics.avg_resolution_time ? Number(metrics.avg_resolution_time) : null,
          }
        });

        return NextResponse.json({
          success: true,
          metrics: syncedMetrics
        });
      }

      return NextResponse.json(
        { error: 'channelId es requerido para sincronización' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error en operación de métricas:', error);
    return NextResponse.json(
      { error: 'Error en operación' },
      { status: 500 }
    );
  }
}
