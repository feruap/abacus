
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando sincronización manual de conversaciones...');
    
    // Get MyAlice API credentials
    const myaliceConfig = await prisma.apiCredential.findUnique({
      where: { service: 'myalice' }
    });

    if (!myaliceConfig) {
      console.log('❌ No hay credenciales de MyAlice configuradas, usando datos de demo');
      return await syncDemoConversations();
    }

    const { apiKey, baseUrl } = myaliceConfig.credentials as any;
    
    if (!apiKey || !baseUrl) {
      console.log('❌ Credenciales incompletas, usando datos de demo');
      return await syncDemoConversations();
    }

    // Fetch conversations from MyAlice.ai
    const response = await fetch(`${baseUrl}/conversations`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log('❌ Error al conectar con MyAlice.ai, usando datos de demo');
      return await syncDemoConversations();
    }

    const data = await response.json();
    const conversations = data.conversations || data.data || [];

    console.log(`📋 Obtenidas ${conversations.length} conversaciones de MyAlice.ai`);

    let syncedCount = 0;
    let updatedCount = 0;

    for (const conv of conversations) {
      try {
        // Find or create customer
        const customer = await prisma.customer.upsert({
          where: { 
            myaliceId: conv.customer?.id || `temp_${conv.id}_customer`
          },
          update: {
            name: conv.customer?.name || conv.customer_name || `Cliente ${conv.id}`,
            email: conv.customer?.email,
            phone: conv.customer?.phone || conv.customer_phone,
            whatsappNumber: conv.customer?.whatsapp_number || conv.customer?.phone,
            avatar: conv.customer?.avatar,
            isActive: true
          },
          create: {
            myaliceId: conv.customer?.id || `temp_${conv.id}_customer`,
            name: conv.customer?.name || conv.customer_name || `Cliente ${conv.id}`,
            email: conv.customer?.email,
            phone: conv.customer?.phone || conv.customer_phone,
            whatsappNumber: conv.customer?.whatsapp_number || conv.customer?.phone,
            avatar: conv.customer?.avatar,
            isActive: true
          }
        });

        // Create or update conversation
        const conversation = await prisma.conversation.upsert({
          where: { 
            myaliceTicketId: conv.id
          },
          update: {
            subject: conv.subject || conv.title || 'Conversación',
            status: mapMyAliceStatus(conv.status),
            priority: mapMyAlicePriority(conv.priority),
            channel: conv.channel || 'whatsapp',
            assignedTo: conv.assigned_to,
            tags: conv.tags || [],
            messageCount: conv.message_count || 0,
            updatedAt: conv.updated_at ? new Date(conv.updated_at) : new Date(),
            humanTookOver: conv.human_takeover || false
          },
          create: {
            myaliceTicketId: conv.id,
            customerId: customer.id,
            subject: conv.subject || conv.title || 'Conversación',
            status: mapMyAliceStatus(conv.status),
            priority: mapMyAlicePriority(conv.priority),
            channel: conv.channel || 'whatsapp',
            assignedTo: conv.assigned_to,
            tags: conv.tags || [],
            messageCount: conv.message_count || 0,
            startedAt: conv.created_at ? new Date(conv.created_at) : new Date(),
            updatedAt: conv.updated_at ? new Date(conv.updated_at) : new Date(),
            humanTookOver: conv.human_takeover || false
          }
        });

        syncedCount++;
        console.log(`✅ Sincronizada conversación: ${conv.id} - ${customer.name}`);

      } catch (error) {
        console.error(`❌ Error sincronizando conversación ${conv.id}:`, error);
      }
    }

    console.log(`🎉 Sincronización completada: ${syncedCount} conversaciones sincronizadas`);

    return NextResponse.json({
      success: true,
      syncedCount,
      totalFound: conversations.length,
      message: `Sincronizadas ${syncedCount} conversaciones exitosamente`
    });

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

async function syncDemoConversations() {
  console.log('🎭 Sincronizando conversaciones de demo para testing...');
  
  // Demo conversations based on what we saw in MyAlice.ai
  const demoConversations = [
    {
      id: 'demo_eric_ranney',
      customer_name: 'ERIC RANNEY',
      customer_phone: '+1234567890',
      subject: 'Laboratorio portátil',
      status: 'active',
      priority: 'low',
      channel: 'whatsapp',
      last_message: 'Interesado en equipos de laboratorio portátil',
      updated_at: new Date(Date.now() - 7 * 60 * 60 * 1000) // 7h ago
    },
    {
      id: 'demo_alice',
      customer_name: 'Alice',
      customer_phone: '+1234567891',
      subject: 'Amunet Laboratorios',
      status: 'active',
      priority: 'high',
      channel: 'whatsapp',
      last_message: 'Consulta sobre servicios de laboratorio',
      updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1d ago
    },
    {
      id: 'demo_dra_rodriguez',
      customer_name: 'Dra Rodriguez',
      customer_phone: '+1234567892',
      subject: 'Amunet Laboratorios',
      status: 'active',
      priority: 'high',
      channel: 'whatsapp',
      last_message: 'Necesito información sobre análisis específicos',
      updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3h ago
    },
    {
      id: 'demo_8331401094',
      customer_name: '8331401094',
      customer_phone: '+8331401094',
      subject: 'Amunet Laboratorios',
      status: 'active',
      priority: 'low',
      channel: 'whatsapp',
      last_message: 'Consulta general',
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2h ago
    },
    {
      id: 'demo_mago',
      customer_name: 'Mago',
      customer_phone: '+1234567894',
      subject: 'Amunet Laboratorios',
      status: 'active',
      priority: 'high',
      channel: 'whatsapp',
      last_message: 'Servicios especializados',
      updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4h ago
    },
    {
      id: 'demo_dra_coco',
      customer_name: 'Dra. Coco',
      customer_phone: '+1234567895',
      subject: 'Amunet Laboratorios',
      status: 'active',
      priority: 'high',
      channel: 'whatsapp',
      last_message: 'Consulta médica especializada',
      updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5h ago
    },
    {
      id: 'demo_business_support',
      customer_name: 'Business Support Services',
      customer_phone: '+1234567896',
      subject: 'Bot assignment',
      status: 'bot_assigned',
      priority: 'normal',
      channel: 'whatsapp',
      last_message: 'Asignado al bot automáticamente',
      updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6h ago
    }
  ];

  let syncedCount = 0;

  for (const conv of demoConversations) {
    try {
      // Create customer
      const customer = await prisma.customer.upsert({
        where: { 
          myaliceId: `${conv.id}_customer`
        },
        update: {
          name: conv.customer_name,
          phone: conv.customer_phone,
          whatsappNumber: conv.customer_phone,
          isActive: true
        },
        create: {
          myaliceId: `${conv.id}_customer`,
          name: conv.customer_name,
          phone: conv.customer_phone,
          whatsappNumber: conv.customer_phone,
          isActive: true
        }
      });

      // Create conversation
      await prisma.conversation.upsert({
        where: { 
          myaliceTicketId: conv.id
        },
        update: {
          subject: conv.subject,
          status: conv.status,
          priority: conv.priority,
          channel: conv.channel,
          updatedAt: conv.updated_at
        },
        create: {
          myaliceTicketId: conv.id,
          customerId: customer.id,
          subject: conv.subject,
          status: conv.status,
          priority: conv.priority,
          channel: conv.channel,
          startedAt: conv.updated_at,
          updatedAt: conv.updated_at
        }
      });

      // Create a demo message
      const existingConversation = await prisma.conversation.findUnique({
        where: { myaliceTicketId: conv.id }
      });

      if (existingConversation) {
        await prisma.message.upsert({
          where: {
            id: `${conv.id}_msg_1`
          },
          update: {
            content: conv.last_message
          },
          create: {
            id: `${conv.id}_msg_1`,
            conversationId: existingConversation.id,
            direction: 'inbound',
            messageType: 'text',
            content: conv.last_message,
            status: 'received',
            sentAt: conv.updated_at
          }
        });
      }

      syncedCount++;
      console.log(`✅ Demo conversation sincronizada: ${conv.customer_name}`);

    } catch (error) {
      console.error(`❌ Error sincronizando demo conversation ${conv.id}:`, error);
    }
  }

  console.log(`🎉 Demo sync completado: ${syncedCount} conversaciones`);

  return NextResponse.json({
    success: true,
    syncedCount,
    totalFound: demoConversations.length,
    message: `Demo: Sincronizadas ${syncedCount} conversaciones exitosamente`,
    mode: 'demo'
  });
}

function mapMyAliceStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'open': 'active',
    'pending': 'active', 
    'resolved': 'resolved',
    'closed': 'resolved',
    'active': 'active',
    'bot_assigned': 'active'
  };
  return statusMap[status] || 'active';
}

function mapMyAlicePriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    'urgent': 'high',
    'high': 'high',
    'medium': 'normal',
    'normal': 'normal',
    'low': 'low'
  };
  return priorityMap[priority] || 'normal';
}

export async function GET(request: NextRequest) {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        customer: {
          select: { name: true, phone: true }
        },
        messages: {
          take: 1,
          orderBy: { sentAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      conversations,
      count: conversations.length
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
