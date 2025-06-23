
import { MyAliceClient } from './api-clients';
import { prisma } from './db';
import { MyAliceChannel, MyAliceTemplate, Conversation, Message } from './types';

export class MyAliceSyncService {
  private myAliceClient: MyAliceClient;

  constructor() {
    this.myAliceClient = new MyAliceClient();
  }

  // Sincronización completa de datos
  async fullSync() {
    console.log('🔄 Iniciando sincronización completa con MyAlice.ai...');
    
    const syncResult = {
      channels: 0,
      templates: 0,
      conversations: 0,
      messages: 0,
      errors: [] as string[]
    };

    try {
      // 1. Sincronizar canales
      const channelsResult = await this.syncChannels();
      syncResult.channels = channelsResult.synced;
      if (channelsResult.errors.length > 0) {
        syncResult.errors.push(...channelsResult.errors);
      }

      // 2. Sincronizar plantillas
      const templatesResult = await this.syncTemplates();
      syncResult.templates = templatesResult.synced;
      if (templatesResult.errors.length > 0) {
        syncResult.errors.push(...templatesResult.errors);
      }

      // 3. Sincronizar conversaciones
      const conversationsResult = await this.syncConversations();
      syncResult.conversations = conversationsResult.synced;
      syncResult.messages = conversationsResult.messages;
      if (conversationsResult.errors.length > 0) {
        syncResult.errors.push(...conversationsResult.errors);
      }

      console.log('✅ Sincronización completa finalizada:', syncResult);
      return syncResult;

    } catch (error) {
      console.error('❌ Error en sincronización completa:', error);
      syncResult.errors.push(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return syncResult;
    }
  }

  // Sincronizar canales
  async syncChannels() {
    console.log('📱 Sincronizando canales...');
    const result = { synced: 0, errors: [] as string[] };

    try {
      const channelsResponse = await this.myAliceClient.getAllChannels() as any;
      const channels = channelsResponse.data || channelsResponse || [];

      for (const channel of channels) {
        try {
          await prisma.myAliceChannel.upsert({
            where: { myaliceId: channel.id || channel.channel_id },
            update: {
              name: channel.name,
              type: channel.type || 'whatsapp',
              provider: channel.provider || 'whatsapp',
              status: channel.status || 'active',
              settings: channel.settings || channel.config || {},
              messageCount: channel.message_count || 0,
              conversationCount: channel.conversation_count || 0,
              lastUsed: channel.last_used ? new Date(channel.last_used) : null,
              updatedAt: new Date()
            },
            create: {
              myaliceId: channel.id || channel.channel_id,
              name: channel.name,
              type: channel.type || 'whatsapp',
              provider: channel.provider || 'whatsapp',
              status: channel.status || 'active',
              settings: channel.settings || channel.config || {},
              messageCount: channel.message_count || 0,
              conversationCount: channel.conversation_count || 0,
              lastUsed: channel.last_used ? new Date(channel.last_used) : null
            }
          });
          result.synced++;
        } catch (error) {
          console.error(`Error sincronizando canal ${channel.id}:`, error);
          result.errors.push(`Canal ${channel.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

      console.log(`✅ Canales sincronizados: ${result.synced}`);
      return result;

    } catch (error) {
      console.error('❌ Error obteniendo canales:', error);
      result.errors.push(`Error obteniendo canales: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return result;
    }
  }

  // Sincronizar plantillas
  async syncTemplates() {
    console.log('📋 Sincronizando plantillas...');
    const result = { synced: 0, errors: [] as string[] };

    try {
      const templatesResponse = await this.myAliceClient.getAllTemplates() as any;
      const templates = templatesResponse.data || templatesResponse || [];

      for (const template of templates) {
        try {
          // Buscar el canal asociado
          const channel = await prisma.myAliceChannel.findFirst({
            where: { myaliceId: template.channel_id }
          });

          if (!channel) {
            console.warn(`Canal ${template.channel_id} no encontrado para plantilla ${template.id}`);
            continue;
          }

          await prisma.myAliceTemplate.upsert({
            where: { myaliceId: template.id || template.template_id },
            update: {
              name: template.name,
              content: template.content || template.body || '',
              variables: template.variables || template.components || [],
              status: template.status || 'approved',
              category: template.category,
              language: template.language || 'es',
              usageCount: template.usage_count || 0,
              lastUsed: template.last_used ? new Date(template.last_used) : null,
              updatedAt: new Date()
            },
            create: {
              myaliceId: template.id || template.template_id,
              channelId: channel.id,
              name: template.name,
              content: template.content || template.body || '',
              variables: template.variables || template.components || [],
              status: template.status || 'approved',
              category: template.category,
              language: template.language || 'es',
              usageCount: template.usage_count || 0,
              lastUsed: template.last_used ? new Date(template.last_used) : null
            }
          });
          result.synced++;
        } catch (error) {
          console.error(`Error sincronizando plantilla ${template.id}:`, error);
          result.errors.push(`Plantilla ${template.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

      console.log(`✅ Plantillas sincronizadas: ${result.synced}`);
      return result;

    } catch (error) {
      console.error('❌ Error obteniendo plantillas:', error);
      result.errors.push(`Error obteniendo plantillas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return result;
    }
  }

  // Sincronizar conversaciones
  async syncConversations() {
    console.log('💬 Sincronizando conversaciones...');
    const result = { synced: 0, messages: 0, errors: [] as string[] };

    try {
      // Obtener conversaciones por páginas
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        try {
          const conversationsResponse = await this.myAliceClient.getConversations(undefined, limit, offset) as any;
          const conversations = conversationsResponse.data || conversationsResponse || [];

          if (conversations.length === 0) {
            hasMore = false;
            break;
          }

          for (const conversation of conversations) {
            try {
              // Buscar o crear cliente
              let customer = await prisma.customer.findFirst({
                where: {
                  OR: [
                    { myaliceId: conversation.customer_id },
                    { phone: conversation.phone || conversation.customer_phone },
                    { email: conversation.customer_email }
                  ]
                }
              });

              if (!customer) {
                customer = await prisma.customer.create({
                  data: {
                    myaliceId: conversation.customer_id,
                    name: conversation.customer_name || conversation.contact_name || 'Cliente MyAlice',
                    phone: conversation.phone || conversation.customer_phone,
                    email: conversation.customer_email || null,
                    whatsappNumber: conversation.whatsapp_number || conversation.phone || conversation.customer_phone
                  }
                });
              }

              // Buscar canal
              const channel = await prisma.myAliceChannel.findFirst({
                where: { myaliceId: conversation.channel_id }
              });

              // Crear o actualizar conversación
              const conversationData = {
                myaliceTicketId: conversation.id || conversation.conversation_id,
                customerId: customer.id,
                channelId: channel?.id,
                channel: conversation.channel_id || 'whatsapp',
                status: this.mapConversationStatus(conversation.status),
                priority: this.mapPriority(conversation.priority),
                subject: conversation.subject || conversation.last_message || 'Conversación MyAlice.ai',
                summary: conversation.summary,
                tags: conversation.tags || [],
                assignedTo: conversation.agent_id,
                humanTookOver: !!conversation.agent_id,
                humanTakeoverAt: conversation.agent_assigned_at ? new Date(conversation.agent_assigned_at) : null,
                messageCount: conversation.message_count || 0,
                startedAt: conversation.created_at ? new Date(conversation.created_at) : new Date(),
                resolvedAt: conversation.resolved_at ? new Date(conversation.resolved_at) : null,
                updatedAt: conversation.updated_at ? new Date(conversation.updated_at) : new Date()
              };

              const savedConversation = await prisma.conversation.upsert({
                where: { myaliceTicketId: conversation.id || conversation.conversation_id },
                update: conversationData,
                create: conversationData
              });

              // Sincronizar mensajes de esta conversación
              const messagesSync = await this.syncConversationMessages(savedConversation, conversation);
              result.messages += messagesSync.messages;

              // Analizar sentimiento si hay mensajes
              if (conversation.last_message) {
                await this.analyzeSentiment(savedConversation.id, conversation.last_message);
              }

              result.synced++;
            } catch (error) {
              console.error(`Error sincronizando conversación ${conversation.id}:`, error);
              result.errors.push(`Conversación ${conversation.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
          }

          offset += limit;
          
          // Si obtuvo menos que el límite, no hay más
          if (conversations.length < limit) {
            hasMore = false;
          }

        } catch (error) {
          console.error(`Error obteniendo conversaciones (offset ${offset}):`, error);
          result.errors.push(`Error obteniendo conversaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          hasMore = false;
        }
      }

      console.log(`✅ Conversaciones sincronizadas: ${result.synced}, Mensajes: ${result.messages}`);
      return result;

    } catch (error) {
      console.error('❌ Error en sincronización de conversaciones:', error);
      result.errors.push(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return result;
    }
  }

  // Sincronizar mensajes de una conversación
  async syncConversationMessages(savedConversation: any, conversationData: any) {
    const result = { messages: 0, errors: [] as string[] };

    try {
      const conversationId = conversationData.id || conversationData.conversation_id;
      const messagesResponse = await this.myAliceClient.getConversationMessages(conversationId, 100, 0) as any;
      const messages = messagesResponse.data || messagesResponse || [];

      // Buscar canal para referencia
      const channel = await prisma.myAliceChannel.findFirst({
        where: { myaliceId: conversationData.channel_id }
      });

      for (const message of messages) {
        try {
          const messageData = {
            conversationId: savedConversation.id,
            channelId: channel?.id,
            direction: message.direction || (message.sender === 'customer' ? 'inbound' : 'outbound'),
            messageType: message.type || 'text',
            content: message.content || message.text || '',
            metadata: {
              myalice_id: message.id || message.message_id,
              original_direction: message.direction,
              channel_id: message.channel_id,
              sender: message.sender,
              attachments: message.attachments || []
            },
            status: message.status || 'sent',
            sentAt: message.timestamp ? new Date(message.timestamp) : 
                   message.sent_at ? new Date(message.sent_at) : new Date()
          };

          await prisma.message.upsert({
            where: { id: message.id || message.message_id },
            update: messageData,
            create: {
              id: message.id || message.message_id,
              ...messageData
            }
          });
          result.messages++;
        } catch (error) {
          console.error(`Error sincronizando mensaje ${message.id}:`, error);
          result.errors.push(`Mensaje ${message.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

      return result;

    } catch (error) {
      console.error(`Error obteniendo mensajes de conversación ${conversationData.id}:`, error);
      result.errors.push(`Error obteniendo mensajes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return result;
    }
  }

  // Mapear estado de conversación
  private mapConversationStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'open': 'active',
      'active': 'active',
      'pending': 'active',
      'assigned': 'escalated',
      'closed': 'resolved',
      'resolved': 'resolved',
      'escalated': 'escalated'
    };

    return statusMap[status] || 'active';
  }

  // Mapear prioridad de conversación
  private mapPriority(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'low': 'low',
      'normal': 'normal',
      'medium': 'normal',
      'high': 'high',
      'urgent': 'urgent',
      'critical': 'urgent'
    };

    return priorityMap[priority] || 'normal';
  }

  // Analizar sentimiento y guardarlo
  private async analyzeSentiment(conversationId: string, text: string) {
    try {
      const { LLMClient } = await import('./api-clients');
      const llmClient = new LLMClient();
      
      const sentimentResult = await llmClient.analyzeSentiment(text);
      
      // Guardar análisis de sentimiento
      await prisma.sentimentAnalysis.create({
        data: {
          conversationId,
          sentiment: sentimentResult.sentiment,
          score: sentimentResult.score,
          confidence: 0.8, // Por defecto
          keywords: this.extractKeywords(text),
          analyzedAt: new Date()
        }
      });

      console.log(`Sentimiento analizado para conversación ${conversationId}: ${sentimentResult.sentiment} (${sentimentResult.score})`);
    } catch (error) {
      console.error(`Error analizando sentimiento para conversación ${conversationId}:`, error);
    }
  }

  // Extraer palabras clave básicas
  private extractKeywords(text: string): string[] {
    const stopWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'las', 'una', 'su', 'me', 'si', 'ya', 'o'];
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 10); // Top 10 keywords
  }

  // Configurar webhook automáticamente
  async configureWebhook(webhookUrl: string, secret?: string) {
    console.log('🔗 Configurando webhook automáticamente...');
    
    try {
      const response = await this.myAliceClient.updateWebhookUrl(webhookUrl, secret);
      console.log('✅ Webhook configurado exitosamente:', response);
      return response;
    } catch (error) {
      console.error('❌ Error configurando webhook:', error);
      throw error;
    }
  }

  // Obtener estadísticas de sincronización
  async getSyncStats() {
    try {
      const [channels, templates, conversations, messages] = await Promise.all([
        prisma.myAliceChannel.count(),
        prisma.myAliceTemplate.count(),
        prisma.conversation.count(),
        prisma.message.count()
      ]);

      return {
        channels,
        templates,
        conversations,
        messages,
        lastSync: await this.getLastSyncTime()
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de sincronización:', error);
      return {
        channels: 0,
        templates: 0,
        conversations: 0,
        messages: 0,
        lastSync: null
      };
    }
  }

  // Obtener última vez que se sincronizó
  private async getLastSyncTime() {
    try {
      const lastConversation = await prisma.conversation.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      });

      return lastConversation?.updatedAt || null;
    } catch (error) {
      return null;
    }
  }
}
