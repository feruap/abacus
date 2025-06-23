
import { PrismaClient } from '@prisma/client';

interface RuleDefinition {
  name: string;
  description: string;
  trigger: any;
  conditions: any;
  actions: any;
  priority: number;
  category: string;
}

// Servicio para gestionar reglas de negocio predefinidas
export class BusinessRulesService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Crear reglas predefinidas del sistema
  async initializeDefaultRules(): Promise<void> {
    try {
      console.log('Inicializando reglas de negocio predefinidas...');

      const defaultRules: RuleDefinition[] = [
        // REGLAS DE SALUDO Y BIENVENIDA
        {
          name: 'Saludo Inicial Automático',
          description: 'Respuesta automática para saludos de nuevos clientes',
          trigger: {
            intents: ['greeting'],
            isFirstMessage: true
          },
          conditions: {
            customerSegment: 'new'
          },
          actions: {
            type: 'direct_response',
            message: '¡Hola! Bienvenido a Amunet, tu especialista en productos médicos. Soy tu asistente virtual y estoy aquí para ayudarte a encontrar exactamente lo que necesitas. ¿En qué puedo asistirte hoy?',
            nextSteps: ['Preguntar sobre necesidades específicas', 'Mostrar catálogo de productos']
          },
          priority: 10,
          category: 'response'
        },

        // REGLAS DE ESCALAMIENTO
        {
          name: 'Escalamiento por Palabras Clave Urgentes',
          description: 'Escalar conversaciones que contienen palabras clave de urgencia médica',
          trigger: {
            keywords: ['urgente', 'emergencia', 'crítico', 'inmediato', 'grave', 'hospital', 'cirugía']
          },
          conditions: {},
          actions: {
            type: 'escalate',
            reason: 'Consulta urgente detectada - requiere atención inmediata',
            message: 'Entiendo que tu consulta es urgente. Un especialista se comunicará contigo de inmediato para brindarte la atención que necesitas.'
          },
          priority: 100,
          category: 'escalation'
        },

        {
          name: 'Escalamiento por Insatisfacción',
          description: 'Escalar cuando el cliente expresa insatisfacción',
          trigger: {
            keywords: ['molesto', 'enojado', 'furioso', 'terrible', 'pésimo', 'malo', 'disgusto', 'queja']
          },
          conditions: {},
          actions: {
            type: 'escalate',
            reason: 'Cliente insatisfecho - requiere atención personalizada',
            message: 'Lamento que tengas esta experiencia. Un supervisor se contactará contigo para resolver personalmente tu situación.'
          },
          priority: 90,
          category: 'escalation'
        },

        {
          name: 'Escalamiento por Consultas Médicas',
          description: 'Escalar consultas que requieren conocimiento médico profesional',
          trigger: {
            keywords: ['diagnóstico', 'síntomas', 'enfermedad', 'tratamiento', 'medicina', 'doctor', 'médico']
          },
          conditions: {},
          actions: {
            type: 'escalate',
            reason: 'Consulta médica que requiere atención profesional',
            message: 'Tu consulta requiere la atención de nuestro equipo médico especializado. Un profesional te contactará pronto.'
          },
          priority: 95,
          category: 'escalation'
        },

        // REGLAS DE DESCUENTOS
        {
          name: 'Descuento VIP Automático',
          description: 'Aplicar descuento automático para clientes VIP',
          trigger: {
            intents: ['price_request', 'purchase_intent']
          },
          conditions: {
            customerSegment: 'vip'
          },
          actions: {
            type: 'apply_discount',
            discount: {
              type: 'percentage',
              percentage: 15
            },
            message: 'Como cliente VIP, tienes un descuento especial del 15% en todos nuestros productos. ¡Este descuento ya está aplicado en tu cotización!'
          },
          priority: 70,
          category: 'discount'
        },

        {
          name: 'Descuento por Volumen',
          description: 'Ofrecer descuento cuando se menciona compra en cantidad',
          trigger: {
            keywords: ['cantidad', 'varios', 'muchos', 'lote', 'mayoreo', 'volumen', 'bulk']
          },
          conditions: {},
          actions: {
            type: 'apply_discount',
            discount: {
              type: 'percentage',
              percentage: 10
            },
            message: 'Perfecto, para compras en volumen tenemos descuentos especiales. Te puedo ofrecer un 10% de descuento. ¿Qué cantidad necesitas?'
          },
          priority: 60,
          category: 'discount'
        },

        {
          name: 'Descuento de Reactivación',
          description: 'Ofrecer descuento a clientes inactivos que regresan',
          trigger: {
            intents: ['greeting', 'product_inquiry']
          },
          conditions: {
            daysSinceLastOrder: { min: 90 },
            totalOrders: { min: 1 }
          },
          actions: {
            type: 'apply_discount',
            discount: {
              type: 'percentage',
              percentage: 12
            },
            message: '¡Qué gusto verte de nuevo! Como cliente que regresa, te ofrezco un descuento especial del 12% en tu próxima compra. ¿En qué puedo ayudarte hoy?'
          },
          priority: 65,
          category: 'discount'
        },

        // REGLAS DE INVENTARIO
        {
          name: 'Alerta de Stock Bajo',
          description: 'Informar cuando un producto tiene stock bajo',
          trigger: {
            intents: ['product_inquiry', 'purchase_intent']
          },
          conditions: {
            productStock: { max: 5 }
          },
          actions: {
            type: 'direct_response',
            message: 'Te informo que este producto tiene disponibilidad limitada (solo {stock} unidades). Te recomiendo realizar tu pedido pronto para asegurar tu compra.',
            nextSteps: ['Proceder con la compra', 'Sugerir productos alternativos']
          },
          priority: 80,
          category: 'inventory'
        },

        {
          name: 'Producto Agotado',
          description: 'Manejar consultas sobre productos agotados',
          trigger: {
            intents: ['product_inquiry', 'purchase_intent']
          },
          conditions: {
            productStock: { max: 0 }
          },
          actions: {
            type: 'direct_response',
            message: 'Lamentablemente este producto está temporalmente agotado. Puedo sugerirte productos similares o avisarte cuando vuelva a estar disponible. ¿Qué prefieres?',
            nextSteps: ['Mostrar productos alternativos', 'Registrar para notificación de stock']
          },
          priority: 85,
          category: 'inventory'
        },

        // REGLAS DE RESPUESTA AUTOMÁTICA
        {
          name: 'Respuesta Catálogo',
          description: 'Respuesta automática cuando piden el catálogo',
          trigger: {
            keywords: ['catálogo', 'catalogo', 'productos', 'lista', 'qué tienen', 'que venden']
          },
          conditions: {},
          actions: {
            type: 'direct_response',
            message: '¡Por supuesto! Tenemos una amplia gama de productos médicos: \n\n📋 Dispositivos médicos\n🧤 Suministros médicos\n🏥 Equipo hospitalario\n💊 Productos farmacéuticos\n🚑 Equipos de emergencia\n\n¿Hay alguna categoría específica que te interese?',
            nextSteps: ['Especificar categoría de interés', 'Mostrar productos destacados']
          },
          priority: 50,
          category: 'response'
        },

        {
          name: 'Respuesta Información de Contacto',
          description: 'Proporcionar información de contacto cuando la soliciten',
          trigger: {
            keywords: ['contacto', 'teléfono', 'dirección', 'ubicación', 'horarios', 'donde están']
          },
          conditions: {},
          actions: {
            type: 'direct_response',
            message: '📞 Información de Contacto:\n\n🏢 Amunet - Productos Médicos\n📱 WhatsApp: Este mismo chat\n🌐 Web: https://tst.amunet.com.mx\n🕒 Horarios: Lun-Vie 9:00-18:00\n📍 Entregas a todo México\n\n¿Necesitas algo más específico?',
            nextSteps: ['Consultar productos', 'Realizar pedido']
          },
          priority: 45,
          category: 'response'
        },

        {
          name: 'Respuesta Despedida',
          description: 'Respuesta cordial de despedida',
          trigger: {
            intents: ['goodbye'],
            keywords: ['adiós', 'gracias', 'bye', 'hasta luego', 'nos vemos']
          },
          conditions: {},
          actions: {
            type: 'direct_response',
            message: '¡Gracias por contactar a Amunet! Ha sido un placer ayudarte. Recuerda que estamos aquí 24/7 para cualquier consulta sobre productos médicos. ¡Que tengas un excelente día! 😊',
            nextSteps: ['Finalizar conversación']
          },
          priority: 30,
          category: 'response'
        }
      ];

      // Crear o actualizar cada regla
      for (const rule of defaultRules) {
        const existingRule = await this.prisma.businessRule.findFirst({
          where: { name: rule.name }
        });
        
        if (existingRule) {
          await this.prisma.businessRule.update({
            where: { id: existingRule.id },
            data: {
              description: rule.description,
              trigger: rule.trigger,
              conditions: rule.conditions,
              actions: rule.actions,
              priority: rule.priority,
              category: rule.category,
              isActive: true,
              version: 1
            }
          });
        } else {
          await this.prisma.businessRule.create({
            data: {
              name: rule.name,
              description: rule.description,
              trigger: rule.trigger,
              conditions: rule.conditions,
              actions: rule.actions,
              priority: rule.priority,
              category: rule.category,
              isActive: true,
              version: 1
            }
          });
        }
      }

      console.log(`✅ ${defaultRules.length} reglas de negocio inicializadas correctamente`);

    } catch (error) {
      console.error('Error inicializando reglas de negocio:', error);
      throw error;
    }
  }

  // Obtener todas las reglas activas
  async getActiveRules(): Promise<any[]> {
    return await this.prisma.businessRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' }
    });
  }

  // Obtener reglas por categoría
  async getRulesByCategory(category: string): Promise<any[]> {
    return await this.prisma.businessRule.findMany({
      where: { 
        isActive: true,
        category 
      },
      orderBy: { priority: 'desc' }
    });
  }

  // Crear nueva regla personalizada
  async createCustomRule(ruleData: RuleDefinition): Promise<any> {
    return await this.prisma.businessRule.create({
      data: {
        name: ruleData.name,
        description: ruleData.description,
        trigger: ruleData.trigger,
        conditions: ruleData.conditions,
        actions: ruleData.actions,
        priority: ruleData.priority,
        category: ruleData.category,
        isActive: true,
        version: 1
      }
    });
  }

  // Actualizar regla existente
  async updateRule(id: string, updates: Partial<RuleDefinition>): Promise<any> {
    return await this.prisma.businessRule.update({
      where: { id },
      data: {
        ...updates,
        version: { increment: 1 }
      }
    });
  }

  // Desactivar regla
  async deactivateRule(id: string): Promise<any> {
    return await this.prisma.businessRule.update({
      where: { id },
      data: { isActive: false }
    });
  }

  // Obtener estadísticas de ejecución de reglas
  async getRuleExecutionStats(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.prisma.ruleExecution.groupBy({
      by: ['ruleId', 'success'],
      where: {
        executedAt: { gte: startDate }
      },
      _count: {
        id: true
      }
    });

    const rules = await this.prisma.businessRule.findMany({
      select: { id: true, name: true, category: true }
    });

    const statsWithNames = stats.map(stat => {
      const rule = rules.find(r => r.id === stat.ruleId);
      return {
        ...stat,
        ruleName: rule?.name,
        ruleCategory: rule?.category
      };
    });

    return statsWithNames;
  }

  // Limpiar ejecuciones antiguas
  async cleanupOldExecutions(days: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.prisma.ruleExecution.deleteMany({
      where: {
        executedAt: { lt: cutoffDate }
      }
    });

    return result.count;
  }
}
