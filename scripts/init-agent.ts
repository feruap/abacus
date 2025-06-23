
import { BusinessRulesService } from '../lib/business-rules-service';
import { PrismaClient } from '@prisma/client';

const rulesService = new BusinessRulesService();
const prisma = new PrismaClient();

async function initializeAgent() {
  try {
    console.log('🤖 Inicializando Sistema Agente LLM...');

    // 1. Inicializar reglas de negocio
    console.log('📋 Inicializando reglas de negocio...');
    await rulesService.initializeDefaultRules();

    // 2. Crear configuración del sistema
    console.log('⚙️ Configurando sistema...');
    await initializeSystemConfig();

    // 3. Crear métricas iniciales
    console.log('📊 Inicializando métricas...');
    await initializeMetrics();

    // 4. Verificar base de datos
    console.log('🗄️ Verificando base de datos...');
    await verifyDatabase();

    console.log('✅ Sistema Agente LLM inicializado correctamente!');
    console.log('\n🚀 El agente está listo para procesar conversaciones.');
    console.log('📱 Puede recibir webhooks de MyAlice.ai en: /api/webhook/myalice');
    console.log('🎛️ Panel de control disponible en: /agent');

  } catch (error) {
    console.error('❌ Error inicializando agente:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function initializeSystemConfig() {
  const configs = [
    { key: 'agent_enabled', value: true, type: 'boolean', description: 'Habilitar agente LLM', category: 'agent' },
    { key: 'agent_model', value: 'gpt-4.1-mini', type: 'string', description: 'Modelo de LLM', category: 'agent' },
    { key: 'agent_temperature', value: 0.7, type: 'number', description: 'Temperatura del modelo', category: 'agent' },
    { key: 'agent_max_tokens', value: 1000, type: 'number', description: 'Máximo tokens por respuesta', category: 'agent' },
    { key: 'auto_escalation_enabled', value: true, type: 'boolean', description: 'Escalamiento automático', category: 'escalation' },
    { key: 'escalation_confidence_threshold', value: 0.3, type: 'number', description: 'Umbral de confianza para escalamiento', category: 'escalation' },
    { key: 'response_delay_seconds', value: 2, type: 'number', description: 'Retraso antes de responder', category: 'behavior' }
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config
    });
  }
}

async function initializeMetrics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const metrics = [
    { name: 'agent_conversations_handled', category: 'agent', value: 0, unit: 'count', date: today },
    { name: 'agent_response_time_avg', category: 'agent', value: 0, unit: 'seconds', date: today },
    { name: 'agent_confidence_avg', category: 'agent', value: 0, unit: 'score', date: today },
    { name: 'agent_escalations_triggered', category: 'agent', value: 0, unit: 'count', date: today },
    { name: 'sales_conversion_rate', category: 'sales', value: 0, unit: '%', date: today }
  ];

  for (const metric of metrics) {
    await prisma.metric.upsert({
      where: { name_date: { name: metric.name, date: metric.date } },
      update: {},
      create: metric
    });
  }
}

async function verifyDatabase() {
  const checks = [
    { name: 'Productos', count: await prisma.product.count() },
    { name: 'Clientes', count: await prisma.customer.count() },
    { name: 'Conversaciones', count: await prisma.conversation.count() },
    { name: 'Reglas de negocio', count: await prisma.businessRule.count() },
    { name: 'Configuraciones', count: await prisma.systemConfig.count() }
  ];

  console.log('\n📈 Estado de la base de datos:');
  checks.forEach(check => {
    console.log(`  ${check.name}: ${check.count} registros`);
  });
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  initializeAgent();
}

export default initializeAgent;
