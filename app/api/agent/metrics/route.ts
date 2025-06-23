
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// Obtener métricas del agente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const category = searchParams.get('category') || 'agent';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Métricas por día
    const dailyMetrics = await prisma.metric.findMany({
      where: {
        category,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });

    // Agrupar por fecha
    const metricsByDate = dailyMetrics.reduce((acc, metric) => {
      const dateKey = metric.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {};
      }
      acc[dateKey][metric.name] = {
        value: Number(metric.value),
        unit: metric.unit
      };
      return acc;
    }, {} as any);

    // Métricas de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMetrics = await prisma.metric.findMany({
      where: {
        category,
        date: today
      }
    });

    const todayMap = todayMetrics.reduce((acc, metric) => {
      acc[metric.name] = {
        value: Number(metric.value),
        unit: metric.unit
      };
      return acc;
    }, {} as any);

    // Estadísticas de conversaciones
    const conversationStats = await getConversationStats(days);

    // Estadísticas de reglas
    const ruleStats = await getRuleExecutionStats(days);

    return NextResponse.json({
      success: true,
      period: { days, startDate, endDate: new Date() },
      dailyMetrics: metricsByDate,
      today: todayMap,
      conversationStats,
      ruleStats
    });

  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Actualizar métricas del agente
export async function POST(request: NextRequest) {
  try {
    const { metrics } = await request.json();

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { error: 'Se requiere array de métricas' },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = [];
    for (const metric of metrics) {
      try {
        const updated = await prisma.metric.upsert({
          where: {
            name_date: {
              name: metric.name,
              date: today
            }
          },
          update: {
            value: metric.value,
            metadata: metric.metadata
          },
          create: {
            name: metric.name,
            category: metric.category || 'agent',
            value: metric.value,
            unit: metric.unit || 'count',
            date: today,
            metadata: metric.metadata
          }
        });
        results.push({ name: metric.name, success: true });
      } catch (error) {
        results.push({ name: metric.name, success: false, error: (error as Error).message });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      updated: results.filter(r => r.success).length
    });

  } catch (error) {
    console.error('Error actualizando métricas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function getConversationStats(days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const conversations = await prisma.conversation.findMany({
    where: {
      startedAt: { gte: startDate }
    },
    include: {
      messages: {
        where: {
          llmMetadata: { not: {} as any }
        }
      }
    }
  });

  const totalConversations = conversations.length;
  const withLLMResponses = conversations.filter(c => c.messages.length > 0).length;
  const escalated = conversations.filter(c => c.humanTookOver).length;
  const resolved = conversations.filter(c => c.status === 'resolved').length;

  // Calcular tiempo promedio de respuesta
  const responseTimes = conversations.flatMap(c => 
    c.messages
      .filter((m: any) => m.llmMetadata)
      .map((m: any) => m.llmMetadata as any)
      .filter((meta: any) => meta.responseTime)
      .map((meta: any) => meta.responseTime)
  );

  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;

  // Calcular confianza promedio
  const confidenceScores = conversations.flatMap(c => 
    c.messages
      .filter((m: any) => m.llmMetadata)
      .map((m: any) => m.llmMetadata as any)
      .filter((meta: any) => meta.confidence)
      .map((meta: any) => meta.confidence)
  );

  const avgConfidence = confidenceScores.length > 0
    ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
    : 0;

  return {
    totalConversations,
    withLLMResponses,
    escalated,
    resolved,
    avgResponseTime: Math.round(avgResponseTime * 100) / 100,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    escalationRate: totalConversations > 0 ? escalated / totalConversations : 0,
    resolutionRate: totalConversations > 0 ? resolved / totalConversations : 0
  };
}

async function getRuleExecutionStats(days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const executions = await prisma.ruleExecution.groupBy({
    by: ['ruleId', 'success'],
    where: {
      executedAt: { gte: startDate }
    },
    _count: {
      id: true
    },
    _avg: {
      executionTime: true
    }
  });

  const rules = await prisma.businessRule.findMany({
    select: { id: true, name: true, category: true }
  });

  const ruleMap = rules.reduce((acc, rule) => {
    acc[rule.id] = rule;
    return acc;
  }, {} as any);

  const ruleStats = executions.map(exec => ({
    ruleId: exec.ruleId,
    ruleName: ruleMap[exec.ruleId]?.name || 'Desconocida',
    category: ruleMap[exec.ruleId]?.category || 'unknown',
    success: exec.success,
    executions: exec._count.id,
    avgExecutionTime: Math.round(exec._avg.executionTime || 0)
  }));

  // Estadísticas generales
  const totalExecutions = executions.reduce((sum, exec) => sum + exec._count.id, 0);
  const successfulExecutions = executions
    .filter(exec => exec.success)
    .reduce((sum, exec) => sum + exec._count.id, 0);

  const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;

  return {
    totalExecutions,
    successfulExecutions,
    successRate: Math.round(successRate * 100) / 100,
    byRule: ruleStats
  };
}
