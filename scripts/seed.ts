
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Empezando a sembrar la base de datos...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      email: 'admin@sistema.com',
      name: 'Administrador',
      role: 'admin'
    }
  });

  console.log('✅ Usuario administrador creado');

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'cliente1@ejemplo.com' },
      update: {},
      create: {
        email: 'cliente1@ejemplo.com',
        name: 'Juan Pérez',
        phone: '+52 55 1234 5678',
        whatsappNumber: '+525512345678',
        totalOrders: 3,
        totalSpent: 2500.00,
        averageOrderValue: 833.33,
        customerSegment: 'regular',
        preferredLanguage: 'es'
      }
    }),
    prisma.customer.upsert({
      where: { email: 'cliente2@ejemplo.com' },
      update: {},
      create: {
        email: 'cliente2@ejemplo.com',
        name: 'María García',
        phone: '+52 55 9876 5432',
        whatsappNumber: '+525598765432',
        totalOrders: 8,
        totalSpent: 12000.00,
        averageOrderValue: 1500.00,
        customerSegment: 'vip',
        preferredLanguage: 'es'
      }
    })
  ]);

  console.log('✅ Clientes de ejemplo creados');

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'IPHONE15-128-BLK' },
      update: {},
      create: {
        sku: 'IPHONE15-128-BLK',
        name: 'iPhone 15 128GB Negro',
        description: 'El nuevo iPhone 15 con Dynamic Island, cámara principal de 48 MP y USB-C.',
        shortDescription: 'iPhone 15 128GB en color negro',
        price: 22999.00,
        regularPrice: 22999.00,
        stockQuantity: 25,
        stockStatus: 'instock',
        categories: ['Smartphones', 'Apple', 'Electrónicos'],
        tags: ['iPhone', 'Apple', 'Smartphone', 'iOS'],
        images: ['https://www.att.com/scmsassets/global/devices/phones/apple/apple-iphone-15/carousel/black-2.png'],
        status: 'active',
        keyFeatures: ['Dynamic Island', 'Cámara 48MP', 'USB-C', 'A16 Bionic'],
        targetAudience: 'Usuarios de smartphones premium',
        useCases: ['Fotografía profesional', 'Productividad', 'Entretenimiento']
      }
    }),
    prisma.product.upsert({
      where: { sku: 'MACBOOK-PRO-M3' },
      update: {},
      create: {
        sku: 'MACBOOK-PRO-M3',
        name: 'MacBook Pro 14" M3',
        description: 'MacBook Pro de 14 pulgadas con chip M3, pantalla Liquid Retina XDR y hasta 22 horas de batería.',
        shortDescription: 'MacBook Pro 14" con chip M3',
        price: 45999.00,
        regularPrice: 45999.00,
        stockQuantity: 8,
        stockStatus: 'instock',
        categories: ['Laptops', 'Apple', 'Computadoras'],
        tags: ['MacBook', 'Apple', 'M3', 'Laptop'],
        images: ['https://www.notebookcheck.org/fileadmin/Notebooks/Apple/MacBook_Pro_14_2023_M3_Max/IMG_1008.JPG'],
        status: 'active',
        keyFeatures: ['Chip M3', 'Pantalla Liquid Retina XDR', '22 horas de batería', 'Thunderbolt 4'],
        targetAudience: 'Profesionales creativos y desarrolladores',
        useCases: ['Desarrollo de software', 'Edición de video', 'Diseño gráfico']
      }
    }),
    prisma.product.upsert({
      where: { sku: 'AIRPODS-PRO-2' },
      update: {},
      create: {
        sku: 'AIRPODS-PRO-2',
        name: 'AirPods Pro (2ª generación)',
        description: 'AirPods Pro con cancelación activa de ruido, audio espacial personalizado y estuche MagSafe.',
        shortDescription: 'AirPods Pro de segunda generación',
        price: 6999.00,
        regularPrice: 6999.00,
        stockQuantity: 45,
        stockStatus: 'instock',
        categories: ['Audífonos', 'Apple', 'Accesorios'],
        tags: ['AirPods', 'Apple', 'Pro', 'Wireless'],
        images: ['https://i.ytimg.com/vi/aVBMCVfeK3I/maxresdefault.jpg'],
        status: 'active',
        keyFeatures: ['Cancelación activa de ruido', 'Audio espacial', 'MagSafe', 'Resistente al agua'],
        targetAudience: 'Usuarios de dispositivos Apple',
        useCases: ['Música', 'Llamadas', 'Deportes', 'Viajes']
      }
    })
  ]);

  console.log('✅ Productos de ejemplo creados');

  // Create sample conversations
  const conversations = await Promise.all([
    prisma.conversation.create({
      data: {
        customerId: customers[0].id,
        channel: 'whatsapp',
        status: 'active',
        priority: 'normal',
        subject: 'Consulta sobre iPhone 15',
        tags: ['producto', 'consulta']
      }
    }),
    prisma.conversation.create({
      data: {
        customerId: customers[1].id,
        channel: 'whatsapp',
        status: 'resolved',
        priority: 'high',
        subject: 'Problema con MacBook',
        tags: ['soporte', 'problema'],
        resolvedAt: new Date()
      }
    })
  ]);

  console.log('✅ Conversaciones de ejemplo creadas');

  // Create sample messages
  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversations[0].id,
        direction: 'inbound',
        messageType: 'text',
        content: '¿Cuánto cuesta el iPhone 15 negro?',
        status: 'received'
      }
    }),
    prisma.message.create({
      data: {
        conversationId: conversations[0].id,
        direction: 'outbound',
        messageType: 'text',
        content: 'El iPhone 15 de 128GB en negro tiene un precio de $22,999 MXN. ¿Te interesa conocer más detalles?',
        status: 'sent',
        processedByLLM: true
      }
    })
  ]);

  console.log('✅ Mensajes de ejemplo creados');

  // Create sample business rules
  await Promise.all([
    prisma.businessRule.create({
      data: {
        name: 'Escalación por Sentimiento Negativo',
        description: 'Escala conversaciones cuando se detecta sentimiento muy negativo',
        category: 'escalation',
        priority: 10,
        isActive: true,
        trigger: {
          event: 'sentiment_analysis',
          conditions: [
            { field: 'sentiment_score', operator: 'less_than', value: '-0.7' }
          ]
        },
        conditions: {},
        actions: [
          {
            type: 'escalate_conversation',
            parameters: { reason: 'Sentimiento negativo detectado', priority: 'high' }
          }
        ]
      }
    }),
    prisma.businessRule.create({
      data: {
        name: 'Descuento por Abandono',
        description: 'Ofrece descuento cuando el cliente menciona precios altos',
        category: 'discount',
        priority: 5,
        isActive: true,
        trigger: {
          event: 'message_received',
          conditions: [
            { field: 'content', operator: 'contains', value: 'muy caro' }
          ]
        },
        conditions: {},
        actions: [
          {
            type: 'apply_discount',
            parameters: { percentage: 10, message: '¡Tengo una oferta especial para ti!' }
          }
        ]
      }
    })
  ]);

  console.log('✅ Reglas de negocio de ejemplo creadas');

  // Create sample sales data
  const salesData = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    salesData.push({
      date,
      orderId: `ORD-${Date.now()}-${i}`,
      woocommerceOrderId: 1000 + i,
      customerId: customers[i % 2].id,
      totalAmount: Math.floor(Math.random() * 5000) + 1000,
      taxAmount: Math.floor(Math.random() * 500) + 100,
      shippingAmount: 200,
      discountAmount: Math.floor(Math.random() * 300),
      currency: 'MXN',
      products: [
        {
          sku: products[i % 3].sku,
          name: products[i % 3].name,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: products[i % 3].price
        }
      ],
      source: 'woocommerce',
      channel: ['whatsapp', 'web', 'email'][i % 3],
      commission: Math.floor(Math.random() * 200) + 50
    });
  }

  await prisma.salesData.createMany({
    data: salesData
  });

  console.log('✅ Datos de ventas de ejemplo creados');

  // Create system config
  await Promise.all([
    prisma.systemConfig.upsert({
      where: { key: 'llm_provider' },
      update: {},
      create: {
        key: 'llm_provider',
        value: 'gemini',
        type: 'string',
        description: 'Proveedor de LLM configurado',
        category: 'llm'
      }
    }),
    prisma.systemConfig.upsert({
      where: { key: 'scraping_enabled' },
      update: {},
      create: {
        key: 'scraping_enabled',
        value: true,
        type: 'boolean',
        description: 'Scraping automático habilitado',
        category: 'scraping'
      }
    }),
    prisma.systemConfig.upsert({
      where: { key: 'notifications_enabled' },
      update: {},
      create: {
        key: 'notifications_enabled',
        value: true,
        type: 'boolean',
        description: 'Notificaciones habilitadas',
        category: 'notifications'
      }
    })
  ]);

  console.log('✅ Configuración del sistema creada');

  // Create sample metrics
  const metricsData = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    metricsData.push(
      {
        name: 'daily_sales',
        category: 'sales',
        value: Math.floor(Math.random() * 50000) + 10000,
        unit: 'MXN',
        date
      },
      {
        name: 'conversations_handled',
        category: 'conversations',
        value: Math.floor(Math.random() * 100) + 20,
        unit: 'count',
        date
      },
      {
        name: 'response_time',
        category: 'system',
        value: Math.random() * 2 + 0.5,
        unit: 'seconds',
        date
      }
    );
  }

  await prisma.metric.createMany({
    data: metricsData
  });

  console.log('✅ Métricas de ejemplo creadas');

  console.log('🎉 ¡Sembrado de base de datos completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el sembrado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
