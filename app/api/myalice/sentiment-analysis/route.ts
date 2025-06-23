
import { NextRequest, NextResponse } from 'next/server';
import { LLMClient } from '@/lib/api-clients';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, conversationId, messageId } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'text es requerido' },
        { status: 400 }
      );
    }

    const llmClient = new LLMClient();
    const analysis = await llmClient.analyzeSentiment(text);

    // Extraer keywords usando LLM
    const keywordMessages = [
      {
        role: 'system',
        content: 'Extrae las 5 palabras clave más importantes del siguiente texto. Responde solo con un array JSON de strings.'
      },
      {
        role: 'user',
        content: text
      }
    ];

    let keywords: string[] = [];
    try {
      const keywordResponse = await llmClient.chatCompletion(keywordMessages);
      const keywordContent = keywordResponse.choices[0].message.content.trim();
      // Intentar parsear como JSON
      if (keywordContent.startsWith('[') && keywordContent.endsWith(']')) {
        keywords = JSON.parse(keywordContent);
      } else {
        // Fallback: dividir por comas
        keywords = keywordContent.split(',').map((k: string) => k.trim().replace(/"/g, ''));
      }
    } catch (error) {
      console.error('Error extrayendo keywords:', error);
      keywords = [];
    }

    const sentimentData = {
      sentiment: analysis.sentiment,
      score: Number(analysis.score),
      confidence: 0.8, // Por defecto, en futuro se puede mejorar
      keywords: keywords.slice(0, 5), // Máximo 5 keywords
      analyzedAt: new Date()
    };

    // Guardar en base de datos si se proporciona conversationId
    if (conversationId) {
      const savedAnalysis = await prisma.sentimentAnalysis.create({
        data: {
          conversationId,
          messageId,
          ...sentimentData
        }
      });

      // Actualizar sentiment promedio de la conversación
      const avgSentiment = await prisma.sentimentAnalysis.aggregate({
        where: { conversationId },
        _avg: { score: true }
      });

      if (avgSentiment._avg.score !== null) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            // Aquí podrías agregar un campo de sentiment promedio si lo agregas al schema
          }
        });
      }

      return NextResponse.json({
        success: true,
        analysis: sentimentData,
        id: savedAnalysis.id,
        conversation_avg_sentiment: avgSentiment._avg.score
      });
    }

    return NextResponse.json({
      success: true,
      analysis: sentimentData
    });

  } catch (error) {
    console.error('Error en análisis de sentimiento:', error);
    return NextResponse.json(
      { error: 'Error al analizar sentimiento' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {};

    if (conversationId) {
      whereClause.conversationId = conversationId;
    }

    if (startDate) {
      whereClause.analyzedAt = {
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      whereClause.analyzedAt = {
        ...whereClause.analyzedAt,
        lte: new Date(endDate)
      };
    }

    if (conversationId) {
      // Obtener análisis de una conversación específica
      const analyses = await prisma.sentimentAnalysis.findMany({
        where: whereClause,
        orderBy: { analyzedAt: 'desc' },
        include: {
          conversation: {
            include: {
              customer: true
            }
          }
        }
      });

      // Calcular estadísticas de la conversación
      const stats = analyses.reduce((acc: any, analysis) => {
        acc.total++;
        acc[analysis.sentiment]++;
        acc.totalScore += Number(analysis.score);
        return acc;
      }, {
        total: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        totalScore: 0
      });

      const avgScore = stats.total > 0 ? stats.totalScore / stats.total : 0;

      return NextResponse.json({
        success: true,
        analyses,
        stats: {
          total: stats.total,
          distribution: {
            positive: stats.positive,
            negative: stats.negative,
            neutral: stats.neutral
          },
          average_score: avgScore
        }
      });
    } else {
      // Obtener estadísticas generales
      const stats = await prisma.sentimentAnalysis.groupBy({
        by: ['sentiment'],
        _count: { sentiment: true },
        _avg: { score: true },
        where: whereClause
      });

      const totalAnalyses = await prisma.sentimentAnalysis.count({
        where: whereClause
      });

      return NextResponse.json({
        success: true,
        total_analyses: totalAnalyses,
        distribution: stats.reduce((acc, stat) => {
          acc[stat.sentiment] = {
            count: stat._count.sentiment,
            average_score: stat._avg.score || 0
          };
          return acc;
        }, {} as Record<string, any>)
      });
    }

  } catch (error) {
    console.error('Error obteniendo análisis de sentimiento:', error);
    return NextResponse.json(
      { error: 'Error al obtener análisis' },
      { status: 500 }
    );
  }
}
