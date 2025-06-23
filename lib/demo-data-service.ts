
import { prisma } from './db';

export class DemoDataService {
  
  async populateDemoData() {
    console.log('🎭 Poblando datos de demostración...');
    
    const result = {
      channels: 0,
      templates: 0,
      conversations: 0,
      messages: 0,
      customers: 0
    };

    try {
      // 1. Crear canales de demostración
      const channels = [
        {
          myaliceId: 'whatsapp_main',
          name: 'WhatsApp Principal',
          type: 'whatsapp',
          provider: 'whatsapp',
          status: 'active',
          settings: { phone: '+5215512345678' },
          messageCount: 145,
          conversationCount: 28
        },
        {
          myaliceId: 'whatsapp_ventas',
          name: 'WhatsApp Ventas',
          type: 'whatsapp',
          provider: 'whatsapp',
          status: 'active',
          settings: { phone: '+5215587654321' },
          messageCount: 89,
          conversationCount: 15
        },
        {
          myaliceId: 'webchat_support',
          name: 'Chat Web Soporte',
          type: 'webchat',
          provider: 'webchat',
          status: 'active',
          settings: { website: 'https://empresa.com' },
          messageCount: 67,
          conversationCount: 12
        }
      ];

      for (const channel of channels) {
        await prisma.myAliceChannel.upsert({
          where: { myaliceId: channel.myaliceId },
          update: channel,
          create: channel
        });
        result.channels++;
      }

      // 2. Crear plantillas de demostración
      const channelRecords = await prisma.myAliceChannel.findMany();
      const templates = [
        {
          myaliceId: 'welcome_msg',
          channelId: channelRecords[0].id,
          name: 'Mensaje de Bienvenida',
          content: 'Hola {{name}}, bienvenido a {{company}}. ¿En qué podemos ayudarte hoy?',
          variables: [{ name: 'name', type: 'text' }, { name: 'company', type: 'text' }],
          status: 'approved',
          category: 'greeting',
          usageCount: 25
        },
        {
          myaliceId: 'product_info',
          channelId: channelRecords[0].id,
          name: 'Información de Producto',
          content: 'El producto {{product}} tiene un precio de {{price}} y está {{availability}}. ¿Te interesa conocer más detalles?',
          variables: [{ name: 'product', type: 'text' }, { name: 'price', type: 'currency' }, { name: 'availability', type: 'text' }],
          status: 'approved',
          category: 'sales',
          usageCount: 18
        },
        {
          myaliceId: 'order_confirmation',
          channelId: channelRecords[1].id,
          name: 'Confirmación de Pedido',
          content: 'Tu pedido #{{order_id}} ha sido confirmado. El total es {{total}} y será entregado en {{delivery_time}}.',
          variables: [{ name: 'order_id', type: 'text' }, { name: 'total', type: 'currency' }, { name: 'delivery_time', type: 'text' }],
          status: 'approved',
          category: 'orders',
          usageCount: 12
        }
      ];

      for (const template of templates) {
        await prisma.myAliceTemplate.upsert({
          where: { myaliceId: template.myaliceId },
          update: template,
          create: template
        });
        result.templates++;
      }

      // 3. Crear clientes de demostración
      const customers = [
        {
          myaliceId: 'customer_001',
          name: 'María González',
          phone: '+5215512345678',
          email: 'maria.gonzalez@email.com',
          whatsappNumber: '+5215512345678',
          totalOrders: 3,
          totalSpent: 2500.00,
          customerSegment: 'regular'
        },
        {
          myaliceId: 'customer_002',
          name: 'Carlos Rodríguez',
          phone: '+5215587654321',
          email: 'carlos.rodriguez@email.com',
          whatsappNumber: '+5215587654321',
          totalOrders: 8,
          totalSpent: 12500.00,
          customerSegment: 'vip'
        },
        {
          myaliceId: 'customer_003',
          name: 'Ana López',
          phone: '+5215555555555',
          email: 'ana.lopez@email.com',
          whatsappNumber: '+5215555555555',
          totalOrders: 1,
          totalSpent: 450.00,
          customerSegment: 'new'
        },
        {
          myaliceId: 'customer_004',
          name: 'Roberto Martínez',
          phone: '+5215544444444',
          email: 'roberto.martinez@email.com',
          whatsappNumber: '+5215544444444',
          totalOrders: 0,
          totalSpent: 0.00,
          customerSegment: 'new'
        },
        {
          myaliceId: 'customer_005',
          name: 'Carmen Jiménez',
          phone: '+5215533333333',
          email: 'carmen.jimenez@email.com',
          whatsappNumber: '+5215533333333',
          totalOrders: 15,
          totalSpent: 25000.00,
          customerSegment: 'vip'
        }
      ];

      for (const customer of customers) {
        await prisma.customer.upsert({
          where: { myaliceId: customer.myaliceId },
          update: customer,
          create: customer
        });
        result.customers++;
      }

      // 4. Crear conversaciones de demostración
      const customerRecords = await prisma.customer.findMany();
      const conversations = [
        {
          myaliceTicketId: 'conv_001',
          customerId: customerRecords[0].id,
          channelId: channelRecords[0].id,
          channel: 'whatsapp_main',
          status: 'active',
          priority: 'normal',
          subject: 'Consulta sobre producto smartphone',
          tags: ['producto', 'smartphone', 'consulta'],
          assignedTo: null,
          humanTookOver: false,
          messageCount: 5,
          startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
          updatedAt: new Date(Date.now() - 30 * 60 * 1000) // 30 min atrás
        },
        {
          myaliceTicketId: 'conv_002',
          customerId: customerRecords[1].id,
          channelId: channelRecords[1].id,
          channel: 'whatsapp_ventas',
          status: 'escalated',
          priority: 'high',
          subject: 'Problema con pedido #12345',
          tags: ['pedido', 'problema', 'urgente'],
          assignedTo: 'fernando.ruiz@amunet.com.mx',
          humanTookOver: true,
          humanTakeoverAt: new Date(Date.now() - 45 * 60 * 1000),
          messageCount: 8,
          startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
          updatedAt: new Date(Date.now() - 15 * 60 * 1000) // 15 min atrás
        },
        {
          myaliceTicketId: 'conv_003',
          customerId: customerRecords[2].id,
          channelId: channelRecords[2].id,
          channel: 'webchat_support',
          status: 'active',
          priority: 'low',
          subject: 'Información sobre envíos',
          tags: ['envío', 'información'],
          assignedTo: null,
          humanTookOver: false,
          messageCount: 3,
          startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
          updatedAt: new Date(Date.now() - 10 * 60 * 1000) // 10 min atrás
        },
        {
          myaliceTicketId: 'conv_004',
          customerId: customerRecords[3].id,
          channelId: channelRecords[0].id,
          channel: 'whatsapp_main',
          status: 'active',
          priority: 'normal',
          subject: 'Solicitud de cotización',
          tags: ['cotización', 'nuevo_cliente'],
          assignedTo: null,
          humanTookOver: false,
          messageCount: 2,
          startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min atrás
          updatedAt: new Date(Date.now() - 5 * 60 * 1000) // 5 min atrás
        },
        {
          myaliceTicketId: 'conv_005',
          customerId: customerRecords[4].id,
          channelId: channelRecords[1].id,
          channel: 'whatsapp_ventas',
          status: 'resolved',
          priority: 'normal',
          subject: 'Compra completada - Laptop',
          tags: ['venta', 'laptop', 'completada'],
          assignedTo: 'admin@sistema.com',
          humanTookOver: true,
          humanTakeoverAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          messageCount: 12,
          startedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 horas atrás
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hora atrás
        }
      ];

      for (const conversation of conversations) {
        await prisma.conversation.upsert({
          where: { myaliceTicketId: conversation.myaliceTicketId },
          update: conversation,
          create: conversation
        });
        result.conversations++;
      }

      // 5. Crear mensajes de demostración
      const conversationRecords = await prisma.conversation.findMany();
      
      const messages = [
        // Conversación 1 - Consulta smartphone
        {
          id: 'msg_001',
          conversationId: conversationRecords[0].id,
          direction: 'inbound',
          messageType: 'text',
          content: 'Hola, me pueden dar información sobre smartphones disponibles?',
          status: 'delivered',
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: 'msg_002',
          conversationId: conversationRecords[0].id,
          direction: 'outbound',
          messageType: 'text',
          content: 'Hola María! Claro, tenemos varios modelos disponibles. ¿Buscas algo específico?',
          status: 'delivered',
          sentAt: new Date(Date.now() - 110 * 60 * 1000)
        },
        {
          id: 'msg_003',
          conversationId: conversationRecords[0].id,
          direction: 'inbound',
          messageType: 'text',
          content: 'Me interesa un iPhone o Samsung, presupuesto hasta $15,000',
          status: 'delivered',
          sentAt: new Date(Date.now() - 100 * 60 * 1000)
        },
        {
          id: 'msg_004',
          conversationId: conversationRecords[0].id,
          direction: 'outbound',
          messageType: 'template',
          content: 'El iPhone 14 tiene un precio de $14,500 y está disponible. ¿Te interesa conocer más detalles?',
          status: 'delivered',
          sentAt: new Date(Date.now() - 90 * 60 * 1000)
        },
        {
          id: 'msg_005',
          conversationId: conversationRecords[0].id,
          direction: 'inbound',
          messageType: 'text',
          content: 'Sí, me interesa. ¿Qué colores tienen?',
          status: 'delivered',
          sentAt: new Date(Date.now() - 30 * 60 * 1000)
        },

        // Conversación 2 - Problema con pedido
        {
          id: 'msg_006',
          conversationId: conversationRecords[1].id,
          direction: 'inbound',
          messageType: 'text',
          content: 'Tengo un problema con mi pedido #12345, no ha llegado',
          status: 'delivered',
          sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
        },
        {
          id: 'msg_007',
          conversationId: conversationRecords[1].id,
          direction: 'outbound',
          messageType: 'text',
          content: 'Disculpe las molestias Carlos. Déjeme revisar el estado de su pedido.',
          status: 'delivered',
          sentAt: new Date(Date.now() - 230 * 60 * 1000)
        },
        {
          id: 'msg_008',
          conversationId: conversationRecords[1].id,
          direction: 'outbound',
          messageType: 'system',
          content: 'fernando.ruiz@amunet.com.mx se ha unido a la conversación y ha tomado control.',
          status: 'sent',
          sentAt: new Date(Date.now() - 45 * 60 * 1000)
        },
        {
          id: 'msg_009',
          conversationId: conversationRecords[1].id,
          direction: 'outbound',
          messageType: 'text',
          content: 'Hola Carlos, soy Fernando del equipo de soporte. He revisado tu pedido y veo que hubo un retraso. Te voy a gestionar una compensación.',
          status: 'delivered',
          sentAt: new Date(Date.now() - 40 * 60 * 1000)
        },
        {
          id: 'msg_010',
          conversationId: conversationRecords[1].id,
          direction: 'inbound',
          messageType: 'text',
          content: 'Muchas gracias Fernando, espero una pronta solución',
          status: 'delivered',
          sentAt: new Date(Date.now() - 15 * 60 * 1000)
        },

        // Conversación 3 - Información envíos
        {
          id: 'msg_011',
          conversationId: conversationRecords[2].id,
          direction: 'inbound',
          messageType: 'text',
          content: '¿Hacen envíos a toda la república?',
          status: 'delivered',
          sentAt: new Date(Date.now() - 60 * 60 * 1000)
        },
        {
          id: 'msg_012',
          conversationId: conversationRecords[2].id,
          direction: 'outbound',
          messageType: 'text',
          content: 'Sí Ana, hacemos envíos a toda la República Mexicana. Los tiempos varían de 2-5 días.',
          status: 'delivered',
          sentAt: new Date(Date.now() - 50 * 60 * 1000)
        },
        {
          id: 'msg_013',
          conversationId: conversationRecords[2].id,
          direction: 'inbound',
          messageType: 'text',
          content: 'Perfecto, ¿cuál es el costo del envío?',
          status: 'delivered',
          sentAt: new Date(Date.now() - 10 * 60 * 1000)
        }
      ];

      for (const message of messages) {
        await prisma.message.upsert({
          where: { id: message.id },
          update: message,
          create: message
        });
        result.messages++;
      }

      // 6. Crear análisis de sentimiento
      const sentimentData = [
        { conversationId: conversationRecords[0].id, sentiment: 'positive', score: 0.7 },
        { conversationId: conversationRecords[1].id, sentiment: 'negative', score: -0.6 },
        { conversationId: conversationRecords[2].id, sentiment: 'neutral', score: 0.1 },
        { conversationId: conversationRecords[3].id, sentiment: 'positive', score: 0.5 },
        { conversationId: conversationRecords[4].id, sentiment: 'positive', score: 0.8 }
      ];

      for (const sentiment of sentimentData) {
        await prisma.sentimentAnalysis.create({
          data: {
            conversationId: sentiment.conversationId,
            sentiment: sentiment.sentiment,
            score: sentiment.score,
            confidence: 0.85,
            keywords: ['producto', 'consulta', 'ayuda']
          }
        });
      }

      console.log('✅ Datos de demostración creados exitosamente:', result);
      return result;

    } catch (error) {
      console.error('❌ Error creando datos de demostración:', error);
      throw error;
    }
  }

  async clearDemoData() {
    console.log('🧹 Limpiando datos de demostración...');
    
    try {
      await prisma.sentimentAnalysis.deleteMany();
      await prisma.message.deleteMany();
      await prisma.conversation.deleteMany();
      await prisma.customer.deleteMany();
      await prisma.myAliceTemplate.deleteMany();
      await prisma.myAliceChannel.deleteMany();
      
      console.log('✅ Datos de demostración eliminados');
    } catch (error) {
      console.error('❌ Error eliminando datos de demostración:', error);
      throw error;
    }
  }
}
