
import { LLMAgentService } from './llm-agent-service';
import { IdentityResolutionService } from './identity-resolution-service';
import { SalesIntelligenceService } from './sales-intelligence-service';
import { WooCommerceIntegrationService } from './woocommerce-integration-service';
import { MyAliceClient } from './api-clients';
import { PrismaClient } from '@prisma/client';

// Servicio principal de integración del agente
export class AgentIntegrationService {
  private llmAgent: LLMAgentService;
  private identityResolver: IdentityResolutionService;
  private salesIntelligence: SalesIntelligenceService;
  private wooService: WooCommerceIntegrationService;
  private myAliceClient: MyAliceClient;
  private prisma: PrismaClient;

  constructor() {
    this.llmAgent = new LLMAgentService();
    this.identityResolver = new IdentityResolutionService();
    this.salesIntelligence = new SalesIntelligenceService();
    this.wooService = new WooCommerceIntegrationService();
    this.myAliceClient = new MyAliceClient();
    this.prisma = new PrismaClient();
  }

  // Procesamiento completo de mensaje entrante de MyAlice.ai
  async processIncomingMessage(webhookPayload: any): Promise<{
    success: boolean;
    response?: string;
    action?: string;
    error?: string;
  }> {
    try {
      console.log('Procesando mensaje entrante:', webhookPayload.action);

      // 1. Resolver identidad del cliente
      const customerData = await this.resolveCustomerFromWebhook(webhookPayload);
      
      // 2. Obtener o crear conversación
      const conversation = await this.getOrCreateConversation(webhookPayload, customerData.customer.id);
      
      // 3. Verificar si la conversación está siendo manejada por humano
      if (conversation.humanTookOver) {
        console.log('Conversación siendo manejada por humano, saltando procesamiento del agente');
        return { success: true, response: 'Handled by human' };
      }

      // 4. Construir contexto para el agente
      const agentContext = await this.buildAgentContext(conversation, webhookPayload);

      // 5. Procesar con el agente LLM
      const agentResponse = await this.llmAgent.processMessage(agentContext);

      // 6. Ejecutar acciones del agente
      await this.executeAgentActions(agentResponse, conversation, customerData);

      // 7. Enviar respuesta via MyAlice.ai
      if (agentResponse.message && !agentResponse.needsHumanIntervention) {
        await this.sendResponseToCustomer(conversation, agentResponse.message);
      }

      // 8. Actualizar métricas
      await this.updateAgentMetrics(agentResponse, conversation);

      return {
        success: true,
        response: agentResponse.message,
        action: agentResponse.action
      };

    } catch (error) {
      console.error('Error procesando mensaje entrante:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // Resolver identidad del cliente desde webhook
  private async resolveCustomerFromWebhook(webhookPayload: any) {
    const identityData = {
      myaliceId: webhookPayload.customer?.id,
      email: webhookPayload.customer?.email,
      phone: webhookPayload.customer?.phone,
      name: webhookPayload.customer?.name
    };

    return await this.identityResolver.resolveWooCommerceCustomer(identityData);
  }

  // Obtener o crear conversación
  private async getOrCreateConversation(webhookPayload: any, customerId: string) {
    let conversation = await this.prisma.conversation.findUnique({
      where: { myaliceTicketId: webhookPayload.ticket.id },
      include: {
        customer: true,
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 10
        }
      }
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          myaliceTicketId: webhookPayload.ticket.id,
          customerId: customerId,
          channelId: webhookPayload.channel?.id,
          channel: webhookPayload.channel?.type || 'whatsapp',
          status: 'active',
          priority: webhookPayload.ticket.priority || 'normal',
          subject: webhookPayload.ticket.conversation_text?.substring(0, 100)
        },
        include: {
          customer: true,
          messages: true
        }
      });
    }

    return conversation;
  }

  // Construir contexto para el agente
  private async buildAgentContext(conversation: any, webhookPayload: any) {
    // Obtener análisis del cliente
    const customerInsight = await this.salesIntelligence.analyzeCustomer(conversation.customerId);
    
    // Obtener recomendaciones de productos
    const recommendations = await this.salesIntelligence.getCustomerRecommendations(
      conversation.customerId,
      webhookPayload.message?.content || webhookPayload.ticket.conversation_text
    );

    return {
      conversationId: conversation.id,
      customerId: conversation.customerId,
      customerInfo: conversation.customer,
      conversationHistory: conversation.messages,
      currentMessage: webhookPayload.message?.content || webhookPayload.ticket.conversation_text,
      metadata: {
        customerInsight,
        recommendations,
        channel: webhookPayload.channel,
        messageType: webhookPayload.message?.type || 'text'
      }
    };
  }

  // Ejecutar acciones del agente
  private async executeAgentActions(agentResponse: any, conversation: any, customerData: any) {
    if (!agentResponse.action) return;

    try {
      switch (agentResponse.action) {
        case 'create_order':
          await this.handleCreateOrder(agentResponse.actionData, conversation, customerData);
          break;
        
        case 'apply_discount':
          await this.handleApplyDiscount(agentResponse.actionData, conversation);
          break;
        
        case 'recommend_products':
          await this.handleProductRecommendations(agentResponse.actionData, conversation);
          break;
        
        case 'escalate':
          await this.handleEscalation(agentResponse.actionData, conversation);
          break;
        
        case 'schedule_followup':
          await this.handleScheduleFollowup(agentResponse.actionData, conversation);
          break;

        default:
          console.log('Acción no implementada:', agentResponse.action);
      }
    } catch (error) {
      console.error('Error ejecutando acción del agente:', error);
    }
  }

  // Crear orden automatizada
  private async handleCreateOrder(actionData: any, conversation: any, customerData: any) {
    try {
      const { productSku, quantity = 1 } = actionData;
      
      if (!productSku || !customerData.customer.email) {
        throw new Error('Datos insuficientes para crear orden');
      }

      const orderResult = await this.wooService.createQuickOrder(
        customerData.customer.email,
        productSku,
        quantity
      );

      if (orderResult) {
        // Enviar enlace de pago al cliente
        const paymentMessage = `✅ He creado tu pedido exitosamente!\n\n📋 Orden #${orderResult.orderId}\n💰 Total: $${orderResult.total} MXN\n\n🔗 Completa tu pago aquí: ${orderResult.paymentUrl}\n\nTienes 24 horas para completar el pago.`;
        
        await this.sendResponseToCustomer(conversation, paymentMessage);

        // Registrar venta
        await this.recordSale(orderResult, conversation.customerId, productSku, quantity);
      }
    } catch (error) {
      console.error('Error creando orden:', error);
      await this.sendResponseToCustomer(
        conversation, 
        'Hubo un problema creando tu pedido. Un agente se comunicará contigo para ayudarte.'
      );
    }
  }

  // Aplicar descuento
  private async handleApplyDiscount(actionData: any, conversation: any) {
    const { discountType, percentage, message } = actionData;
    
    // Crear cupón en WooCommerce
    const couponCode = `AUTO${Date.now()}`;
    await this.wooService.createCoupon(couponCode, discountType, percentage);
    
    const discountMessage = `🎉 ${message}\n\nCódigo de descuento: **${couponCode}**\nVálido por 7 días\n\n¿Te gustaría ver nuestros productos?`;
    await this.sendResponseToCustomer(conversation, discountMessage);
  }

  // Manejar recomendaciones de productos
  private async handleProductRecommendations(actionData: any, conversation: any) {
    const { products } = actionData;
    
    if (products && products.length > 0) {
      let message = '🔍 He encontrado estos productos que podrían interesarte:\n\n';
      
      for (const productSku of products) {
        const productInfo = await this.wooService.getProductInfo(productSku);
        if (productInfo) {
          message += `📦 **${productInfo.name}**\n`;
          message += `💰 $${productInfo.price} MXN\n`;
          message += `📋 SKU: ${productInfo.sku}\n\n`;
        }
      }
      
      message += '¿Te gustaría más información sobre alguno de estos productos?';
      await this.sendResponseToCustomer(conversation, message);
    }
  }

  // Manejar escalamiento
  private async handleEscalation(actionData: any, conversation: any) {
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: 'escalated',
        humanTookOver: true,
        humanTakeoverAt: new Date()
      }
    });

    await this.prisma.escalation.create({
      data: {
        conversationId: conversation.id,
        type: 'automatic',
        reason: actionData.reason || 'Escalamiento automático por agente LLM',
        status: 'pending'
      }
    });

    const escalationMessage = actionData.message || 'Un especialista se comunicará contigo en breve para brindarte atención personalizada.';
    await this.sendResponseToCustomer(conversation, escalationMessage);
  }

  // Programar seguimiento
  private async handleScheduleFollowup(actionData: any, conversation: any) {
    const { delayHours = 24, message } = actionData;
    const followupTime = new Date(Date.now() + delayHours * 60 * 60 * 1000);

    await this.prisma.messageQueue.create({
      data: {
        type: 'send_follow_up',
        payload: {
          conversationId: conversation.id,
          message: message || '¿Hay algo más en lo que pueda ayudarte?'
        },
        priority: 3,
        processAt: followupTime
      }
    });
  }

  // Enviar respuesta al cliente
  private async sendResponseToCustomer(conversation: any, message: string) {
    if (!conversation.channelId || !conversation.customer?.phone) {
      console.warn('Información insuficiente para enviar mensaje');
      return;
    }

    try {
      await this.myAliceClient.sendTextMessage(
        conversation.channelId,
        conversation.customer.phone,
        message
      );

      // Registrar mensaje enviado
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: 'outbound',
          messageType: 'text',
          content: message,
          llmResponse: message
        }
      });

    } catch (error) {
      console.error('Error enviando mensaje al cliente:', error);
    }
  }

  // Actualizar métricas del agente
  private async updateAgentMetrics(agentResponse: any, conversation: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Incrementar conversaciones manejadas
    await this.prisma.metric.upsert({
      where: {
        name_date: {
          name: 'agent_conversations_handled',
          date: today
        }
      },
      update: {
        value: { increment: 1 }
      },
      create: {
        name: 'agent_conversations_handled',
        category: 'agent',
        value: 1,
        unit: 'count',
        date: today
      }
    });

    // Actualizar confianza promedio
    await this.prisma.metric.upsert({
      where: {
        name_date: {
          name: 'agent_confidence_avg',
          date: today
        }
      },
      update: {
        value: agentResponse.confidence
      },
      create: {
        name: 'agent_confidence_avg',
        category: 'agent',
        value: agentResponse.confidence,
        unit: 'score',
        date: today
      }
    });

    // Incrementar escalamientos si es necesario
    if (agentResponse.needsHumanIntervention) {
      await this.prisma.metric.upsert({
        where: {
          name_date: {
            name: 'agent_escalations_triggered',
            date: today
          }
        },
        update: {
          value: { increment: 1 }
        },
        create: {
          name: 'agent_escalations_triggered',
          category: 'agent',
          value: 1,
          unit: 'count',
          date: today
        }
      });
    }
  }

  // Registrar venta
  private async recordSale(orderResult: any, customerId: string, productSku: string, quantity: number) {
    try {
      const productInfo = await this.wooService.getProductInfo(productSku);
      
      await this.prisma.salesData.create({
        data: {
          date: new Date(),
          orderId: orderResult.orderId.toString(),
          woocommerceOrderId: orderResult.orderId,
          customerId: customerId,
          totalAmount: orderResult.total,
          currency: 'MXN',
          products: {
            sku: productSku,
            name: productInfo?.name || 'Producto',
            quantity: quantity,
            unitPrice: productInfo?.price || 0,
            totalPrice: orderResult.total
          },
          source: 'agent_llm',
          channel: 'whatsapp'
        }
      });
    } catch (error) {
      console.error('Error registrando venta:', error);
    }
  }
}
