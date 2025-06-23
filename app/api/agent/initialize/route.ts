
import { NextRequest, NextResponse } from 'next/server';
import { BusinessRulesService } from '@/lib/business-rules-service';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const rulesService = new BusinessRulesService();
const prisma = new PrismaClient();

// Endpoint para inicializar el agente LLM y sus reglas
export async function POST(request: NextRequest) {
  try {
    console.log('Inicializando agente LLM...');

    const results = {
      rulesInitialized: false,
      configInitialized: false,
      errors: [] as string[]
    };

    // 1. Inicializar reglas de negocio predefinidas
    try {
      await rulesService.initializeDefaultRules();
      results.rulesInitialized = true;
      console.log('✅ Reglas de negocio inicializadas');
    } catch (error) {
      console.error('Error inicializando reglas:', error);
      results.errors.push(`Reglas: ${(error as Error).message}`);
    }

    // 2. Inicializar configuración del sistema
    try {
      await initializeSystemConfig();
      results.configInitialized = true;
      console.log('✅ Configuración del sistema inicializada');
    } catch (error) {
      console.error('Error inicializando configuración:', error);
      results.errors.push(`Configuración: ${(error as Error).message}`);
    }

    // 3. Crear métricas iniciales
    try {
      await initializeMetrics();
      console.log('✅ Métricas iniciales creadas');
    } catch (error) {
      console.error('Error inicializando métricas:', error);
      results.errors.push(`Métricas: ${(error as Error).message}`);
    }

    const success = results.rulesInitialized && results.configInitialized;

    return NextResponse.json({
      success,
      message: success ? 'Agente LLM inicializado correctamente' : 'Inicialización parcial con errores',
      results
    });

  } catch (error) {
    console.error('Error inicializando agente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function initializeSystemConfig() {
  const defaultConfigs = [
    {
      key: 'agent_enabled',
      value: true,
      type: 'boolean',
      description: 'Habilitar o deshabilitar el agente LLM',
      category: 'agent'
    },
    {
      key: 'agent_model',
      value: 'gpt-4.1-mini',
      type: 'string',
      description: 'Modelo de LLM a utilizar',
      category: 'agent'
    },
    {
      key: 'agent_temperature',
      value: 0.7,
      type: 'number',
      description: 'Temperatura del modelo LLM (0-1)',
      category: 'agent'
    },
    {
      key: 'agent_max_tokens',
      value: 1000,
      type: 'number',
      description: 'Máximo número de tokens por respuesta',
      category: 'agent'
    },
    {
      key: 'auto_escalation_enabled',
      value: true,
      type: 'boolean',
      description: 'Habilitar escalamiento automático',
      category: 'escalation'
    },
    {
      key: 'escalation_confidence_threshold',
      value: 0.3,
      type: 'number',
      description: 'Umbral de confianza para escalamiento automático',
      category: 'escalation'
    },
    {
      key: 'response_delay_seconds',
      value: 2,
      type: 'number',
      description: 'Retraso antes de enviar respuesta (simular tipeo)',
      category: 'behavior'
    },
    {
      key: 'max_conversation_context',
      value: 10,
      type: 'number',
      description: 'Número máximo de mensajes a incluir en contexto',
      category: 'agent'
    }
  ];

  for (const config of defaultConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {
        value: config.value,
        type: config.type,
        description: config.description,
        category: config.category
      },
      create: config
    });
  }
}

async function initializeMetrics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const defaultMetrics = [
    {
      name: 'agent_conversations_handled',
      category: 'agent',
      value: 0,
      unit: 'count',
      date: today
    },
    {
      name: 'agent_response_time_avg',
      category: 'agent',
      value: 0,
      unit: 'seconds',
      date: today
    },
    {
      name: 'agent_confidence_avg',
      category: 'agent',
      value: 0,
      unit: 'score',
      date: today
    },
    {
      name: 'agent_escalations_triggered',
      category: 'agent',
      value: 0,
      unit: 'count',
      date: today
    },
    {
      name: 'sales_conversion_rate',
      category: 'sales',
      value: 0,
      unit: '%',
      date: today
    }
  ];

  for (const metric of defaultMetrics) {
    await prisma.metric.upsert({
      where: {
        name_date: {
          name: metric.name,
          date: metric.date
        }
      },
      update: {},
      create: metric
    });
  }
}

// Endpoint GET para verificar estado del agente
export async function GET() {
  try {
    const agentStatus = await getAgentStatus();
    return NextResponse.json(agentStatus);
  } catch (error) {
    console.error('Error obteniendo estado del agente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function getAgentStatus() {
  // Obtener configuración del agente
  const configs = await prisma.systemConfig.findMany({
    where: { category: 'agent' }
  });

  const configMap = configs.reduce((acc, config) => {
    acc[config.key] = config.value;
    return acc;
  }, {} as any);

  // Obtener estadísticas recientes
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayMetrics = await prisma.metric.findMany({
    where: {
      date: today,
      category: 'agent'
    }
  });

  const metricsMap = todayMetrics.reduce((acc, metric) => {
    acc[metric.name] = metric.value;
    return acc;
  }, {} as any);

  // Obtener estado de la cola
  const queueStats = await prisma.messageQueue.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  const queueStatsMap = queueStats.reduce((acc, stat) => {
    acc[stat.status] = stat._count.id;
    return acc;
  }, {} as any);

  // Obtener reglas activas
  const activeRules = await prisma.businessRule.count({
    where: { isActive: true }
  });

  return {
    enabled: configMap.agent_enabled || false,
    model: configMap.agent_model || 'gpt-4.1-mini',
    temperature: configMap.agent_temperature || 0.7,
    maxTokens: configMap.agent_max_tokens || 1000,
    activeRules,
    todayMetrics: {
      conversationsHandled: Number(metricsMap.agent_conversations_handled || 0),
      avgResponseTime: Number(metricsMap.agent_response_time_avg || 0),
      avgConfidence: Number(metricsMap.agent_confidence_avg || 0),
      escalationsTriggered: Number(metricsMap.agent_escalations_triggered || 0)
    },
    queueStatus: {
      pending: queueStatsMap.pending || 0,
      processing: queueStatsMap.processing || 0,
      completed: queueStatsMap.completed || 0,
      failed: queueStatsMap.failed || 0
    },
    lastCheck: new Date().toISOString()
  };
}
