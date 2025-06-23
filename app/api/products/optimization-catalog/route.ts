
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Obtener catálogo de productos con optimizaciones
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Obtener productos reales de la base de datos
    const products = await prisma.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' }
    });

    // Simular datos de optimización (en una implementación real esto vendría de tablas específicas)
    const optimizedProducts = products.map(product => ({
      id: product.id,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.categories[0] || 'General',
        price: product.price || 0
      },
      optimizationStatus: Math.random() > 0.6 ? 'optimized' : 
                         Math.random() > 0.3 ? 'in_progress' : 'not_optimized',
      keyPhrases: generateKeyPhrasesForProduct(product.name),
      suggestedResponses: generateResponsesForProduct(product.name),
      conversationCount: Math.floor(Math.random() * 50) + 1,
      conversionRate: Math.random() * 0.4 + 0.1, // 10% - 50%
      averageResponseTime: Math.random() * 3 + 1, // 1-4 segundos
      customerSatisfaction: Math.random() * 0.3 + 0.7, // 70% - 100%
      lastOptimized: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
      lastConversation: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      trends: {
        mentions: Math.floor(Math.random() * 20) + 1,
        conversions: Math.floor(Math.random() * 10) + 1,
        satisfaction: Math.floor(Math.random() * 10) - 5 // -5 a +5
      }
    }));

    const total = await prisma.product.count();

    return NextResponse.json({
      success: true,
      products: optimizedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching optimization catalog:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch catalog' 
    }, { status: 500 });
  }
}

function generateKeyPhrasesForProduct(productName: string): string[] {
  const lowerName = productName.toLowerCase();
  const baseKeyPhrases = ['precio', 'disponible', 'características', 'comprar'];
  
  if (lowerName.includes('termómetro')) {
    return [...baseKeyPhrases, 'temperatura', 'fiebre', 'digital', 'infrarrojo'];
  } else if (lowerName.includes('tensiómetro')) {
    return [...baseKeyPhrases, 'presión arterial', 'hipertensión', 'automático', 'manual'];
  } else if (lowerName.includes('oxímetro')) {
    return [...baseKeyPhrases, 'saturación de oxígeno', 'pulso', 'dedo', 'portátil'];
  } else if (lowerName.includes('estetoscopio')) {
    return [...baseKeyPhrases, 'auscultación', 'cardiología', 'pediatría', 'profesional'];
  } else if (lowerName.includes('guantes')) {
    return [...baseKeyPhrases, 'desechables', 'látex', 'nitrilo', 'talla'];
  }
  
  return baseKeyPhrases;
}

function generateResponsesForProduct(productName: string): string[] {
  const lowerName = productName.toLowerCase();
  
  if (lowerName.includes('termómetro')) {
    return [
      'Tenemos termómetros digitales de alta precisión con lectura rápida en 30 segundos.',
      'Nuestros termómetros infrarrojos son perfectos para uso contactless y son muy higiénicos.',
      'Los termómetros que manejamos tienen certificación médica y garantía de 2 años.'
    ];
  } else if (lowerName.includes('tensiómetro')) {
    return [
      'Los tensiómetros automáticos que ofrecemos son ideales para uso doméstico y profesional.',
      'Contamos con tensiómetros digitales con memoria para múltiples usuarios.',
      'Nuestros tensiómetros tienen validación clínica y cumplen estándares internacionales.'
    ];
  } else if (lowerName.includes('oxímetro')) {
    return [
      'Los oxímetros de pulso que manejamos muestran SpO2 y frecuencia cardíaca con precisión.',
      'Son ideales para monitoreo continuo en casa o consultorios médicos.',
      'Tenemos oxímetros portátiles con pantalla LED de fácil lectura.'
    ];
  }
  
  return [
    `El ${productName} que buscas está disponible en diferentes presentaciones y marcas.`,
    `Te puedo ofrecer las mejores opciones de ${productName} con garantía y envío incluido.`,
    `Nuestros ${productName} cumplen con todos los estándares de calidad médica.`
  ];
}
