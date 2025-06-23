
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// Endpoint para procesar cola de mensajes
export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando procesamiento de cola de mensajes...');

    // Obtener mensajes pendientes de la cola
    const pendingMessages = await prisma.messageQueue.findMany({
      where: {
        status: 'pending',
        processAt: { lte: new Date() }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      take: 10 // Procesar en lotes de 10
    });

    console.log(`Encontrados ${pendingMessages.length} mensajes pendientes`);

    const results = [];
    for (const queueMessage of pendingMessages) {
      const result = await processQueueMessage(queueMessage);
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Error procesando cola:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function processQueueMessage(queueMessage: any) {
  try {
    // Marcar como procesando
    await prisma.messageQueue.update({
      where: { id: queueMessage.id },
      data: {
        status: 'processing',
        attempts: queueMessage.attempts + 1
      }
    });

    let result;
    switch (queueMessage.type) {
      case 'process_agent_message':
        result = await processAgentMessage(queueMessage.payload);
        break;
      
      case 'send_follow_up':
        result = await sendFollowUp(queueMessage.payload);
        break;
      
      case 'analyze_sentiment':
        result = await analyzeSentiment(queueMessage.payload);
        break;
      
      default:
        throw new Error(`Tipo de mensaje no reconocido: ${queueMessage.type}`);
    }

    // Marcar como completado
    await prisma.messageQueue.update({
      where: { id: queueMessage.id },
      data: {
        status: 'completed',
        processedAt: new Date()
      }
    });

    console.log(`Mensaje ${queueMessage.id} procesado exitosamente`);
    return { id: queueMessage.id, success: true, result };

  } catch (error) {
    console.error(`Error procesando mensaje ${queueMessage.id}:`, error);

    // Determinar si reintentarlo o marcarlo como fallido
    const shouldRetry = queueMessage.attempts < queueMessage.maxAttempts;
    
    if (shouldRetry) {
      // Programar reintento con backoff exponencial
      const delay = Math.pow(2, queueMessage.attempts) * 1000; // 2^n segundos
      await prisma.messageQueue.update({
        where: { id: queueMessage.id },
        data: {
          status: 'pending',
          processAt: new Date(Date.now() + delay),
          lastError: (error as Error).message
        }
      });
    } else {
      // Marcar como fallido
      await prisma.messageQueue.update({
        where: { id: queueMessage.id },
        data: {
          status: 'failed',
          processedAt: new Date(),
          lastError: (error as Error).message
        }
      });
    }

    return { id: queueMessage.id, success: false, error: (error as Error).message };
  }
}

async function processAgentMessage(payload: any) {
  const { conversationId, message, customerId } = payload;

  // Llamar al endpoint de procesamiento de mensajes del agente
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/agent/process-message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      conversationId,
      message,
      customerId
    })
  });

  if (!response.ok) {
    throw new Error(`Error llamando al procesador de mensajes: ${response.status}`);
  }

  return await response.json();
}

async function sendFollowUp(payload: any) {
  // Implementar lógica de seguimiento
  console.log('Enviando seguimiento:', payload);
  return { success: true, action: 'follow_up_sent' };
}

async function analyzeSentiment(payload: any) {
  // Implementar análisis de sentimiento
  console.log('Analizando sentimiento:', payload);
  return { success: true, action: 'sentiment_analyzed' };
}

// Endpoint GET para verificar estado de la cola
export async function GET() {
  try {
    const stats = await prisma.messageQueue.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const queueStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      queueStats,
      lastCheck: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de cola:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
