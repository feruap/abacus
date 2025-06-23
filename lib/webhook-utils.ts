
import crypto from 'crypto';

// Utilidades para validación de webhooks
export class WebhookValidator {
  private static validateSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      // MyAlice.ai usa HMAC-SHA256
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      // Comparar firmas de forma segura
      const actualSignature = signature.replace('sha256=', '');
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(actualSignature, 'hex')
      );
    } catch (error) {
      console.error('Error validando firma de webhook:', error);
      return false;
    }
  }

  static async validateMyAliceWebhook(
    body: string,
    signature: string
  ): Promise<boolean> {
    const secret = process.env.MYALICE_WEBHOOK_SECRET;
    
    if (!secret) {
      console.error('MYALICE_WEBHOOK_SECRET no está configurado');
      return false;
    }

    if (!signature) {
      console.error('Firma de webhook no proporcionada');
      return false;
    }

    return this.validateSignature(body, signature, secret);
  }
}

// Rate Limiting simple en memoria
export class RateLimiter {
  private static requests: Map<string, { count: number; resetTime: number }> = new Map();

  static isAllowed(
    identifier: string,
    maxRequests = 60,
    windowMs = 60000
  ): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Limpiar entradas expiradas
    const entries = Array.from(this.requests.entries());
    for (const [key, value] of entries) {
      if (value.resetTime < now) {
        this.requests.delete(key);
      }
    }

    const current = this.requests.get(identifier);
    
    if (!current) {
      this.requests.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (current.resetTime < now) {
      // Ventana expirada, reiniciar
      this.requests.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (current.count >= maxRequests) {
      return false;
    }

    current.count++;
    return true;
  }

  static getRemainingRequests(
    identifier: string,
    maxRequests = 60
  ): number {
    const current = this.requests.get(identifier);
    if (!current || current.resetTime < Date.now()) {
      return maxRequests;
    }
    return Math.max(0, maxRequests - current.count);
  }
}

// Queue de mensajes simple (en memoria, para producción usar Redis/SQS)
export class MessageQueue {
  private static queue: Array<{
    id: string;
    type: string;
    payload: any;
    priority: number;
    attempts: number;
    maxAttempts: number;
    createdAt: Date;
    processAt: Date;
  }> = [];
  
  private static processing = false;

  static async add(
    type: string,
    payload: any,
    priority = 5,
    delayMs = 0,
    maxAttempts = 3
  ): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date();
    const processAt = new Date(now.getTime() + delayMs);

    this.queue.push({
      id,
      type,
      payload,
      priority,
      attempts: 0,
      maxAttempts,
      createdAt: now,
      processAt
    });

    // Ordenar por prioridad (mayor número = mayor prioridad)
    this.queue.sort((a, b) => b.priority - a.priority);

    // Iniciar procesamiento si no está corriendo
    if (!this.processing) {
      this.processQueue();
    }

    return id;
  }

  private static async processQueue() {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const now = new Date();
        const message = this.queue.find(m => m.processAt <= now);
        
        if (!message) {
          // No hay mensajes listos para procesar
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Remover mensaje de la cola
        const index = this.queue.indexOf(message);
        this.queue.splice(index, 1);

        try {
          await this.processMessage(message);
        } catch (error) {
          console.error(`Error procesando mensaje ${message.id}:`, error);
          
          // Reintentar si no se han agotado los intentos
          message.attempts++;
          if (message.attempts < message.maxAttempts) {
            const delay = Math.pow(2, message.attempts) * 1000; // Backoff exponencial
            message.processAt = new Date(Date.now() + delay);
            this.queue.push(message);
            this.queue.sort((a, b) => b.priority - a.priority);
          } else {
            console.error(`Mensaje ${message.id} falló después de ${message.maxAttempts} intentos`);
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private static async processMessage(message: any) {
    switch (message.type) {
      case 'webhook_myalice':
        await this.processMyAliceWebhook(message.payload);
        break;
      case 'send_message':
        await this.processSendMessage(message.payload);
        break;
      case 'analyze_sentiment':
        await this.processAnalyzeSentiment(message.payload);
        break;
      default:
        console.warn(`Tipo de mensaje desconocido: ${message.type}`);
    }
  }

  private static async processMyAliceWebhook(payload: any) {
    console.log('Procesando webhook de MyAlice.ai:', payload.action);
    
    try {
      const { action, ticket, customer, message, channel } = payload;
      
      // Importar dependencias dinámicamente para evitar errores de importación circular
      const { prisma } = await import('@/lib/db');
      const { MyAliceClient, LLMClient } = await import('@/lib/api-clients');
      
      // 1. RESOLVER IDENTIDAD DEL CLIENTE
      let dbCustomer = null;
      
      if (customer.email) {
        dbCustomer = await prisma.customer.findFirst({
          where: { email: customer.email }
        });
      }
      
      if (!dbCustomer && customer.phone) {
        dbCustomer = await prisma.customer.findFirst({
          where: { phone: customer.phone }
        });
      }
      
      // Crear cliente si no existe
      if (!dbCustomer) {
        dbCustomer = await prisma.customer.create({
          data: {
            myaliceId: customer.id,
            email: customer.email,
            phone: customer.phone,
            name: customer.name,
            whatsappNumber: customer.phone
          }
        });
        console.log('Nuevo cliente creado:', dbCustomer.id);
      } else {
        // Actualizar información del cliente
        dbCustomer = await prisma.customer.update({
          where: { id: dbCustomer.id },
          data: {
            myaliceId: customer.id,
            name: customer.name || dbCustomer.name,
            phone: customer.phone || dbCustomer.phone
          }
        });
      }
      
      // 2. GESTIONAR CANAL
      let dbChannel = null;
      if (channel) {
        dbChannel = await prisma.myAliceChannel.upsert({
          where: { myaliceId: channel.id },
          update: {
            name: channel.name,
            type: channel.type,
            provider: channel.provider || 'myalice',
            lastUsed: new Date()
          },
          create: {
            myaliceId: channel.id,
            name: channel.name,
            type: channel.type,
            provider: channel.provider || 'myalice',
            settings: {}
          }
        });
      }
      
      // 3. GESTIONAR CONVERSACIÓN
      let dbConversation = null;
      
      if (action === 'ticket.created') {
        // Crear nueva conversación
        dbConversation = await prisma.conversation.create({
          data: {
            myaliceTicketId: ticket.id,
            customerId: dbCustomer.id,
            channelId: dbChannel?.id,
            channel: channel?.type || 'unknown',
            status: 'active',
            priority: ticket.priority || 'normal',
            subject: ticket.conversation_text?.substring(0, 100),
            messageCount: 1,
            startedAt: new Date(ticket.created_at || new Date())
          }
        });
        
        console.log('Nueva conversación creada:', dbConversation.id);
        
        // Crear primer mensaje
        if (ticket.conversation_text) {
          await prisma.message.create({
            data: {
              conversationId: dbConversation.id,
              channelId: dbChannel?.id,
              direction: 'inbound',
              messageType: 'text',
              content: ticket.conversation_text,
              metadata: {
                myalice_ticket_id: ticket.id,
                myalice_customer_id: customer.id
              }
            }
          });
        }
        
        // 4. PROCESAR CON LLM Y RESPONDER
        await this.processWithLLMAndRespond(dbConversation, ticket.conversation_text, dbCustomer, dbChannel);
        
      } else if (action === 'message.received' && message) {
        // Buscar conversación existente
        dbConversation = await prisma.conversation.findFirst({
          where: { myaliceTicketId: ticket.id }
        });
        
        if (dbConversation) {
          // Crear nuevo mensaje
          await prisma.message.create({
            data: {
              conversationId: dbConversation.id,
              channelId: dbChannel?.id,
              direction: 'inbound',
              messageType: message.type || 'text',
              content: message.content,
              metadata: {
                myalice_message_id: message.id,
                myalice_ticket_id: ticket.id
              }
            }
          });
          
          // Actualizar contador de mensajes
          await prisma.conversation.update({
            where: { id: dbConversation.id },
            data: {
              messageCount: { increment: 1 }
            }
          });
          
          // Procesar con LLM si no hay control humano
          if (!dbConversation.humanTookOver) {
            await this.processWithLLMAndRespond(dbConversation, message.content, dbCustomer, dbChannel);
          }
        }
      } else if (action === 'ticket.resolved') {
        // Resolver conversación
        dbConversation = await prisma.conversation.findFirst({
          where: { myaliceTicketId: ticket.id }
        });
        
        if (dbConversation) {
          await prisma.conversation.update({
            where: { id: dbConversation.id },
            data: {
              status: 'resolved',
              resolvedAt: new Date()
            }
          });
        }
      }
      
      // 5. REGISTRAR WEBHOOK EN BD
      await prisma.webhookLog.create({
        data: {
          source: 'myalice',
          action,
          payload,
          status: 'processed',
          processedAt: new Date()
        }
      });
      
      console.log('Webhook procesado exitosamente');
      
    } catch (error) {
      console.error('Error procesando webhook:', error);
      
      // Registrar error en BD
      try {
        const { prisma } = await import('@/lib/db');
        await prisma.webhookLog.create({
          data: {
            source: 'myalice',
            action: payload.action,
            payload,
            status: 'failed',
            lastError: error instanceof Error ? error.message : 'Unknown error',
            attempts: 1
          }
        });
      } catch (dbError) {
        console.error('Error registrando webhook en BD:', dbError);
      }
      
      throw error;
    }
  }
  
  private static async processWithLLMAndRespond(
    conversation: any, 
    messageContent: string, 
    customer: any, 
    channel: any
  ) {
    try {
      const { prisma } = await import('@/lib/db');
      const { MyAliceClient, LLMClient } = await import('@/lib/api-clients');
      
      // 1. ANÁLISIS DE SENTIMIENTO
      const llmClient = new LLMClient();
      const sentimentAnalysis = await llmClient.analyzeSentiment(messageContent);
      
      // Guardar análisis de sentimiento
      await prisma.sentimentAnalysis.create({
        data: {
          conversationId: conversation.id,
          sentiment: sentimentAnalysis.sentiment,
          score: Number(sentimentAnalysis.score),
          confidence: 0.8,
          keywords: []
        }
      });
      
      // 2. VERIFICAR REGLAS DE NEGOCIO
      const businessRules = await prisma.businessRule.findMany({
        where: { isActive: true },
        orderBy: { priority: 'desc' }
      });
      
      let shouldRespondWithLLM = true;
      let customResponse = null;
      
      for (const rule of businessRules) {
        const ruleTriggered = this.evaluateRule(rule, {
          message: messageContent,
          customer,
          conversation,
          sentiment: sentimentAnalysis.sentiment
        });
        
        if (ruleTriggered) {
          console.log('Regla activada:', rule.name);
          
          // Ejecutar acciones de la regla
          const ruleResult = await this.executeRuleActions(rule, {
            conversation,
            customer,
            message: messageContent
          });
          
          if (ruleResult.stopLLMProcessing) {
            shouldRespondWithLLM = false;
            customResponse = ruleResult.response;
          }
          
          // Registrar ejecución de regla
          await prisma.ruleExecution.create({
            data: {
              ruleId: rule.id,
              trigger: { message: messageContent },
              context: { conversationId: conversation.id },
              success: true,
              actions: ruleResult.actions || {},
              result: ruleResult,
              executionTime: 100 // placeholder
            }
          });
          
          break; // Ejecutar solo la primera regla que coincida
        }
      }
      
      // 3. GENERAR RESPUESTA
      let response = customResponse;
      
      if (shouldRespondWithLLM) {
        // Obtener contexto de productos para el LLM
        const recentProducts = await prisma.product.findMany({
          where: { status: 'active' },
          take: 10,
          orderBy: { lastSynced: 'desc' }
        });
        
        const systemPrompt = `Eres un asistente de ventas experto para una tienda en línea. 
Tu objetivo es ayudar a los clientes con sus consultas sobre productos y facilitar ventas.

Información del cliente:
- Nombre: ${customer.name || 'No proporcionado'}
- Email: ${customer.email || 'No proporcionado'}
- Historial: ${customer.totalOrders} pedidos previos

Productos disponibles (muestra):
${recentProducts.slice(0, 5).map(p => `- ${p.name}: ${p.description} (${p.price ? '$' + p.price : 'Precio bajo consulta'})`).join('\n')}

Instrucciones:
1. Responde de manera amigable y profesional
2. Si preguntan sobre productos específicos, proporciona detalles útiles
3. Si quieren comprar, guíalos hacia el proceso de compra
4. Si es una consulta compleja, ofrece escalamiento a un humano
5. Mantén respuestas concisas pero informativas
6. Si detectas frustración, ofrece ayuda adicional

Responde en español y de manera natural.`;

        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: messageContent }
        ];
        
        const llmResponse = await llmClient.chatCompletion(messages);
        response = llmResponse.choices[0].message.content;
        
        // Registrar que fue procesado por LLM
        await prisma.message.updateMany({
          where: { 
            conversationId: conversation.id,
            content: messageContent,
            direction: 'inbound'
          },
          data: {
            processedByLLM: true,
            llmResponse: response
          }
        });
      }
      
      // 4. ENVIAR RESPUESTA
      if (response && channel) {
        const myaliceClient = new MyAliceClient();
        
        const sendResult = await myaliceClient.sendTextMessage(
          channel.myaliceId,
          customer.phone || customer.whatsappNumber,
          response
        ) as any;
        
        // Registrar mensaje de respuesta
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            channelId: channel.id,
            direction: 'outbound',
            messageType: 'text',
            content: response,
            status: sendResult.status || 'sent',
            metadata: {
              myalice_message_id: sendResult.id,
              generated_by: shouldRespondWithLLM ? 'llm' : 'rule',
              sentiment_context: sentimentAnalysis.sentiment
            }
          }
        });
        
        console.log('Respuesta enviada:', response.substring(0, 100));
      }
      
    } catch (error) {
      console.error('Error en procesamiento con LLM:', error);
      
      // En caso de error, enviar respuesta de fallback
      try {
        if (channel && customer.phone) {
          const { MyAliceClient } = await import('@/lib/api-clients');
          const myaliceClient = new MyAliceClient();
          
          const fallbackMessage = "Gracias por tu mensaje. En este momento estamos experimentando algunos problemas técnicos. Un agente humano se pondrá en contacto contigo pronto.";
          
          await myaliceClient.sendTextMessage(
            channel.myaliceId,
            customer.phone,
            fallbackMessage
          );
        }
      } catch (fallbackError) {
        console.error('Error enviando mensaje de fallback:', fallbackError);
      }
    }
  }
  
  private static evaluateRule(rule: any, context: any): boolean {
    try {
      // Evaluación simple de reglas basada en condiciones
      const { trigger, conditions } = rule;
      const { message, sentiment, customer } = context;
      
      // Evaluar trigger
      if (trigger.keywords) {
        const hasKeyword = trigger.keywords.some((keyword: string) => 
          message.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!hasKeyword) return false;
      }
      
      if (trigger.sentiment && trigger.sentiment !== sentiment) {
        return false;
      }
      
      // Evaluar condiciones adicionales
      if (conditions.customerSegment && customer.customerSegment !== conditions.customerSegment) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error evaluando regla:', error);
      return false;
    }
  }
  
  private static async executeRuleActions(rule: any, context: any): Promise<any> {
    try {
      const { actions } = rule;
      const result: any = {
        actions: {},
        stopLLMProcessing: false,
        response: null
      };
      
      if (actions.sendMessage) {
        result.response = actions.sendMessage;
        result.stopLLMProcessing = true;
        result.actions.sendMessage = actions.sendMessage;
      }
      
      if (actions.escalateToHuman) {
        const { prisma } = await import('@/lib/db');
        
        // Crear escalación
        await prisma.escalation.create({
          data: {
            conversationId: context.conversation.id,
            type: 'automatic',
            reason: actions.escalationReason || 'Escalado por regla de negocio',
            priority: actions.escalationPriority || 'normal'
          }
        });
        
        // Marcar conversación como escalada
        await prisma.conversation.update({
          where: { id: context.conversation.id },
          data: { 
            status: 'escalated',
            priority: 'high'
          }
        });
        
        result.actions.escalateToHuman = true;
        result.response = actions.escalationMessage || "Tu consulta ha sido escalada a un agente humano que te contactará pronto.";
        result.stopLLMProcessing = true;
      }
      
      if (actions.createDiscount) {
        // Aquí se podría integrar con WooCommerce para crear cupones
        result.actions.createDiscount = actions.createDiscount;
      }
      
      return result;
    } catch (error) {
      console.error('Error ejecutando acciones de regla:', error);
      return { actions: {}, stopLLMProcessing: false, response: null };
    }
  }

  private static async processSendMessage(payload: any) {
    console.log('Enviando mensaje:', payload);
    // Implementar envío de mensaje a MyAlice.ai
  }

  private static async processAnalyzeSentiment(payload: any) {
    console.log('Analizando sentimiento:', payload);
    // Implementar análisis de sentimiento
  }

  static getQueueSize(): number {
    return this.queue.length;
  }

  static getQueueStats() {
    return {
      totalMessages: this.queue.length,
      processing: this.processing,
      messagesByType: this.queue.reduce((acc, msg) => {
        acc[msg.type] = (acc[msg.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}
