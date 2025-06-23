
import { LLMClient } from './api-clients';
import { WooCommerceClient } from './api-clients';
import { MyAliceClient } from './api-clients';
import { PrismaClient } from '@prisma/client';

// Interfaces para el agente LLM
interface AgentContext {
  conversationId: string;
  customerId: string;
  customerInfo?: any;
  conversationHistory: any[];
  currentMessage: string;
  metadata?: any;
}

interface AgentResponse {
  message: string;
  action?: string;
  actionData?: any;
  needsHumanIntervention: boolean;
  confidence: number;
  intent: string;
  productRecommendations?: any[];
  nextSteps?: string[];
}

interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  fallbackPrompt: string;
}

// Servicio principal del agente LLM
export class LLMAgentService {
  private llmClient: LLMClient;
  private wooCommerceClient: WooCommerceClient;
  private myAliceClient: MyAliceClient;
  private prisma: PrismaClient;
  private config: AgentConfig;

  constructor() {
    this.llmClient = new LLMClient();
    this.wooCommerceClient = new WooCommerceClient();
    this.myAliceClient = new MyAliceClient();
    this.prisma = new PrismaClient();
    
    this.config = {
      model: 'gpt-4.1-mini',
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: this.getSystemPrompt(),
      fallbackPrompt: this.getFallbackPrompt()
    };
  }

  // === MÉTODO PRINCIPAL DE PROCESAMIENTO ===
  async processMessage(context: AgentContext): Promise<AgentResponse> {
    try {
      // 1. Analizar intención del cliente
      const intent = await this.analyzeIntent(context.currentMessage);
      
      // 2. Verificar reglas de negocio
      const ruleResult = await this.checkBusinessRules(context, intent);
      if (ruleResult.shouldExecute && ruleResult.response) {
        return ruleResult.response;
      }

      // 3. Enriquecer contexto con información relevante
      const enrichedContext = await this.enrichContext(context);

      // 4. Generar respuesta usando LLM
      const llmResponse = await this.generateLLMResponse(enrichedContext, intent);

      // 5. Guardar interacción en la base de datos
      await this.saveInteraction(context, llmResponse);

      return llmResponse;

    } catch (error) {
      console.error('Error procesando mensaje:', error);
      return this.getFallbackResponse(context);
    }
  }

  // === ANÁLISIS DE INTENCIÓN ===
  private async analyzeIntent(message: string): Promise<string> {
    const intentPrompt = `
Analiza la siguiente consulta de cliente y determina la intención principal. 
Responde solo con una de estas opciones: greeting, product_inquiry, price_request, purchase_intent, support_request, complaint, goodbye, other

Mensaje del cliente: "${message}"

Intención:`;

    try {
      const response = await this.llmClient.chatCompletion([
        { role: 'user', content: intentPrompt }
      ], this.config.model);

      const intent = response.choices[0].message.content.trim().toLowerCase();
      return ['greeting', 'product_inquiry', 'price_request', 'purchase_intent', 'support_request', 'complaint', 'goodbye', 'other'].includes(intent) 
        ? intent 
        : 'other';
    } catch (error) {
      console.error('Error analizando intención:', error);
      return 'other';
    }
  }

  // === MOTOR DE REGLAS DE NEGOCIO ===
  private async checkBusinessRules(context: AgentContext, intent: string): Promise<{shouldExecute: boolean, response?: AgentResponse}> {
    try {
      // Obtener reglas activas que apliquen al contexto
      const activeRules = await this.prisma.businessRule.findMany({
        where: {
          isActive: true,
          // Filtrar por categoría basada en la intención
          category: this.getRelevantRuleCategories(intent)
        },
        orderBy: { priority: 'desc' }
      });

      for (const rule of activeRules) {
        const shouldExecute = await this.evaluateRule(rule, context, intent);
        if (shouldExecute) {
          const response = await this.executeRule(rule, context);
          if (response) {
            // Guardar ejecución de regla
            await this.prisma.ruleExecution.create({
              data: {
                ruleId: rule.id,
                trigger: { intent, message: context.currentMessage } as any,
                context: { ...context, conversationHistory: [] } as any,
                success: true,
                actions: rule.actions as any,
                result: response as any,
                executionTime: Date.now()
              }
            });
            
            return { shouldExecute: true, response };
          }
        }
      }

      return { shouldExecute: false };
    } catch (error) {
      console.error('Error verificando reglas de negocio:', error);
      return { shouldExecute: false };
    }
  }

  private getRelevantRuleCategories(intent: string): any {
    const categoryMap: Record<string, string[]> = {
      'greeting': ['response'],
      'product_inquiry': ['response', 'inventory'],
      'price_request': ['discount', 'response'],
      'purchase_intent': ['discount', 'inventory'],
      'support_request': ['escalation'],
      'complaint': ['escalation'],
      'goodbye': ['response']
    };

    const categories = categoryMap[intent] || ['response'];
    return { in: categories };
  }

  private async evaluateRule(rule: any, context: AgentContext, intent: string): Promise<boolean> {
    try {
      const trigger = rule.trigger as any;
      const conditions = rule.conditions as any;

      // Evaluar trigger
      if (trigger.intents && !trigger.intents.includes(intent)) {
        return false;
      }

      if (trigger.keywords) {
        const messageWords = context.currentMessage.toLowerCase().split(' ');
        const hasKeyword = trigger.keywords.some((keyword: string) => 
          messageWords.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) return false;
      }

      // Evaluar condiciones adicionales
      if (conditions.customerSegment && context.customerInfo?.customerSegment !== conditions.customerSegment) {
        return false;
      }

      if (conditions.messageCount) {
        const messageCount = await this.getConversationMessageCount(context.conversationId);
        if (messageCount < conditions.messageCount.min || messageCount > conditions.messageCount.max) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error evaluando regla:', error);
      return false;
    }
  }

  private async executeRule(rule: any, context: AgentContext): Promise<AgentResponse | null> {
    try {
      const actions = rule.actions as any;

      if (actions.type === 'direct_response') {
        return {
          message: actions.message,
          action: 'direct_response',
          needsHumanIntervention: false,
          confidence: 1.0,
          intent: 'rule_based',
          nextSteps: actions.nextSteps || []
        };
      }

      if (actions.type === 'escalate') {
        await this.escalateConversation(context.conversationId, actions.reason || 'Regla automática de escalamiento');
        return {
          message: actions.message || 'Un agente humano se comunicará contigo en breve.',
          action: 'escalate',
          needsHumanIntervention: true,
          confidence: 1.0,
          intent: 'escalation'
        };
      }

      if (actions.type === 'apply_discount') {
        const discountInfo = await this.applyDiscount(context.customerId, actions.discount);
        return {
          message: actions.message?.replace('{discount}', actions.discount.percentage + '%') || 
                  `¡Tengo un descuento especial del ${actions.discount.percentage}% para ti!`,
          action: 'discount_applied',
          actionData: discountInfo,
          needsHumanIntervention: false,
          confidence: 1.0,
          intent: 'discount'
        };
      }

      return null;
    } catch (error) {
      console.error('Error ejecutando regla:', error);
      return null;
    }
  }

  // === ENRIQUECIMIENTO DE CONTEXTO ===
  private async enrichContext(context: AgentContext): Promise<AgentContext> {
    try {
      // Obtener información del cliente
      const customer = await this.prisma.customer.findUnique({
        where: { id: context.customerId }
      });

      // Obtener historial de conversación reciente
      const recentMessages = await this.prisma.message.findMany({
        where: { conversationId: context.conversationId },
        orderBy: { sentAt: 'desc' },
        take: 10,
        include: {
          conversation: true
        }
      });

      // Obtener productos relacionados si se mencionan en la conversación
      const relatedProducts = await this.findRelatedProducts(context.currentMessage);

      return {
        ...context,
        customerInfo: customer,
        conversationHistory: recentMessages.reverse(), // Orden cronológico
        metadata: {
          ...context.metadata,
          relatedProducts,
          customerSegment: customer?.customerSegment,
          totalOrders: customer?.totalOrders || 0,
          totalSpent: customer?.totalSpent || 0
        }
      };
    } catch (error) {
      console.error('Error enriqueciendo contexto:', error);
      return context;
    }
  }

  // === GENERACIÓN DE RESPUESTA LLM ===
  private async generateLLMResponse(context: AgentContext, intent: string): Promise<AgentResponse> {
    try {
      const messages = this.buildPromptMessages(context, intent);
      
      const response = await this.llmClient.chatCompletion(messages, this.config.model);
      const llmMessage = response.choices[0].message.content;

      // Parsear respuesta estructurada del LLM
      return this.parseLLMResponse(llmMessage, intent);
    } catch (error) {
      console.error('Error generando respuesta LLM:', error);
      return this.getFallbackResponse(context);
    }
  }

  private buildPromptMessages(context: AgentContext, intent: string): any[] {
    const systemPrompt = this.getSystemPrompt();
    const contextPrompt = this.buildContextPrompt(context, intent);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: contextPrompt }
    ];

    // Agregar historial de conversación
    context.conversationHistory.forEach(msg => {
      if (msg.direction === 'inbound') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.llmResponse) {
        messages.push({ role: 'assistant', content: msg.llmResponse });
      }
    });

    // Agregar mensaje actual
    messages.push({ role: 'user', content: context.currentMessage });

    return messages;
  }

  private buildContextPrompt(context: AgentContext, intent: string): string {
    const customerInfo = context.customerInfo;
    const relatedProducts = context.metadata?.relatedProducts || [];

    let contextPrompt = `
CONTEXTO DE LA CONVERSACIÓN:
- Intención detectada: ${intent}
- ID de conversación: ${context.conversationId}
`;

    if (customerInfo) {
      contextPrompt += `
INFORMACIÓN DEL CLIENTE:
- Nombre: ${customerInfo.name || 'No proporcionado'}
- Email: ${customerInfo.email || 'No proporcionado'}
- Segmento: ${customerInfo.customerSegment || 'nuevo'}
- Total de órdenes: ${customerInfo.totalOrders}
- Total gastado: $${customerInfo.totalSpent} MXN
`;
    }

    if (relatedProducts.length > 0) {
      contextPrompt += `
PRODUCTOS RELEVANTES MENCIONADOS:
${relatedProducts.map((p: any) => `- ${p.name} (SKU: ${p.sku}) - $${p.price} MXN`).join('\n')}
`;
    }

    contextPrompt += `
INSTRUCCIONES ESPECÍFICAS PARA ESTA INTENCIÓN:
${this.getIntentSpecificInstructions(intent)}

Responde en formato JSON con esta estructura:
{
  "message": "mensaje para el cliente",
  "action": "acción a realizar (opcional)",
  "actionData": "datos adicionales para la acción (opcional)",
  "needsHumanIntervention": boolean,
  "confidence": número entre 0 y 1,
  "productRecommendations": ["array de SKUs recomendados"],
  "nextSteps": ["array de próximos pasos sugeridos"]
}
`;

    return contextPrompt;
  }

  // === PROMPTS DEL SISTEMA ===
  private getSystemPrompt(): string {
    return `
Eres un agente de ventas especializado en productos médicos para la empresa Amunet. Tu objetivo es ayudar a los clientes a encontrar los productos médicos que necesitan, proporcionarles información detallada y guiarlos hacia una compra exitosa.

PERSONALIDAD Y TONO:
- Profesional pero amigable
- Empático y comprensivo con las necesidades de salud
- Conocedor de productos médicos
- Proactivo en ofrecer soluciones
- Respetuoso de la privacidad médica

CAPACIDADES PRINCIPALES:
1. Consultar información de productos médicos en tiempo real
2. Proporcionar recomendaciones personalizadas
3. Calcular precios y aplicar descuentos
4. Crear órdenes de compra
5. Generar enlaces de pago seguros
6. Escalar a agentes humanos cuando sea necesario

LIMITACIONES:
- NO puedes dar consejos médicos o diagnósticos
- NO puedes procesar pagos directamente
- Siempre recomienda consultar con profesionales de la salud
- Respeta la privacidad y confidencialidad

PRODUCTOS PRINCIPALES:
- Dispositivos médicos (monitores, equipos de diagnóstico)
- Suministros médicos (jeringas, guantes, mascarillas)
- Equipo de rehabilitación
- Productos farmacéuticos de venta libre
- Equipos de primeros auxilios

PROCESO DE VENTAS:
1. Identificar necesidades del cliente
2. Recomendar productos apropiados
3. Proporcionar información detallada
4. Calcular precios con descuentos aplicables
5. Facilitar el proceso de compra
6. Programar seguimiento post-venta

Siempre mantén un enfoque centrado en el cliente y en la calidad de la atención médica.
`;
  }

  private getIntentSpecificInstructions(intent: string): string {
    const instructions: Record<string, string> = {
      'greeting': 'Saluda de manera profesional y amigable. Pregunta cómo puedes ayudar con productos médicos.',
      'product_inquiry': 'Proporciona información detallada del producto. Incluye especificaciones, usos recomendados y beneficios.',
      'price_request': 'Proporciona precios claros. Menciona descuentos disponibles y opciones de financiamiento si aplica.',
      'purchase_intent': 'Facilita el proceso de compra. Confirma detalles, calcula totales y prepara para generar orden.',
      'support_request': 'Ayuda con consultas técnicas o de uso. Si es complejo, considera escalar a soporte técnico.',
      'complaint': 'Muestra empatía y busca soluciones. Considera escalamiento a agente humano si es necesario.',
      'goodbye': 'Despídete cordialmente y ofrece soporte futuro. Proporciona información de contacto.'
    };

    return instructions[intent] || 'Responde de manera útil y profesional según el contexto de la consulta.';
  }

  private getFallbackPrompt(): string {
    return `
Disculpa, estoy experimentando dificultades técnicas en este momento. 
Sin embargo, puedo ayudarte con:

- Información básica de productos médicos
- Consultas de precios
- Procesos de compra

¿Podrías reformular tu consulta o ser más específico sobre lo que necesitas?

Si tu consulta es urgente, puedo conectarte con uno de nuestros agentes humanos.
`;
  }

  // === UTILIDADES ===
  private async findRelatedProducts(message: string): Promise<any[]> {
    try {
      // Buscar productos mencionados por nombre o SKU
      const words = message.toLowerCase().split(' ');
      const products = await this.prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: message, mode: 'insensitive' } },
            { description: { contains: message, mode: 'insensitive' } },
            { sku: { in: words } }
          ],
          status: 'active'
        },
        take: 5
      });

      return products;
    } catch (error) {
      console.error('Error buscando productos relacionados:', error);
      return [];
    }
  }

  private parseLLMResponse(llmMessage: string, intent: string): AgentResponse {
    try {
      // Intentar parsear JSON de la respuesta del LLM
      const jsonMatch = llmMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          message: parsed.message,
          action: parsed.action,
          actionData: parsed.actionData,
          needsHumanIntervention: parsed.needsHumanIntervention || false,
          confidence: parsed.confidence || 0.8,
          intent,
          productRecommendations: parsed.productRecommendations || [],
          nextSteps: parsed.nextSteps || []
        };
      }
    } catch (error) {
      console.error('Error parseando respuesta LLM:', error);
    }

    // Fallback a respuesta simple
    return {
      message: llmMessage,
      needsHumanIntervention: false,
      confidence: 0.6,
      intent
    };
  }

  private getFallbackResponse(context: AgentContext): AgentResponse {
    return {
      message: this.config.fallbackPrompt,
      needsHumanIntervention: true,
      confidence: 0.0,
      intent: 'fallback',
      nextSteps: ['Conectar con agente humano']
    };
  }

  private async saveInteraction(context: AgentContext, response: AgentResponse): Promise<void> {
    try {
      // Actualizar el mensaje con la respuesta del LLM
      await this.prisma.message.updateMany({
        where: {
          conversationId: context.conversationId,
          content: context.currentMessage,
          direction: 'inbound'
        },
        data: {
          processedByLLM: true,
          llmResponse: response.message,
          llmMetadata: {
            intent: response.intent,
            confidence: response.confidence,
            action: response.action,
            needsHumanIntervention: response.needsHumanIntervention
          }
        }
      });

      // Crear mensaje de respuesta
      await this.prisma.message.create({
        data: {
          conversationId: context.conversationId,
          direction: 'outbound',
          messageType: 'text',
          content: response.message,
          llmResponse: response.message,
          llmMetadata: {
            intent: response.intent,
            confidence: response.confidence,
            action: response.action
          }
        }
      });

    } catch (error) {
      console.error('Error guardando interacción:', error);
    }
  }

  // === MÉTODOS DE SOPORTE ===
  private async getConversationMessageCount(conversationId: string): Promise<number> {
    return await this.prisma.message.count({
      where: { conversationId }
    });
  }

  private async escalateConversation(conversationId: string, reason: string): Promise<void> {
    try {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'escalated',
          humanTookOver: true,
          humanTakeoverAt: new Date()
        }
      });

      await this.prisma.escalation.create({
        data: {
          conversationId,
          type: 'automatic',
          reason,
          status: 'pending'
        }
      });
    } catch (error) {
      console.error('Error escalando conversación:', error);
    }
  }

  private async applyDiscount(customerId: string, discountConfig: any): Promise<any> {
    // Implementar lógica de descuentos
    return {
      type: discountConfig.type,
      value: discountConfig.percentage,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    };
  }
}
