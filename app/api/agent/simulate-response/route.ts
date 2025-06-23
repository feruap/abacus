
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

// POST - Simular respuesta del agente IA
export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, context } = await request.json();

    // Simular procesamiento del mensaje
    const response = await processMessageWithAI(message, context);

    return NextResponse.json({
      success: true,
      response: response.message,
      intent: response.intent,
      confidence: response.confidence,
      productMentioned: response.productMentioned,
      suggestedActions: response.suggestedActions
    });
  } catch (error) {
    console.error('Error simulating AI response:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to simulate response' 
    }, { status: 500 });
  }
}

async function processMessageWithAI(message: string, context: any) {
  const messageText = message.toLowerCase();
  
  // Detectar intent basado en el mensaje
  let intent = 'unknown';
  let confidence = 0.8;
  let productMentioned = null;
  
  // Reglas básicas de detección de intent
  if (messageText.includes('hola') || messageText.includes('buenas') || messageText.includes('buenos')) {
    intent = 'greeting';
    confidence = 0.95;
  } else if (messageText.includes('precio') || messageText.includes('costo') || messageText.includes('cuanto')) {
    intent = 'price_inquiry';
    confidence = 0.9;
  } else if (messageText.includes('catálogo') || messageText.includes('catalogo') || messageText.includes('productos')) {
    intent = 'catalog_request';
    confidence = 0.9;
  } else if (messageText.includes('comprar') || messageText.includes('pedido') || messageText.includes('orden')) {
    intent = 'purchase_intent';
    confidence = 0.85;
  } else if (messageText.includes('ayuda') || messageText.includes('información') || messageText.includes('info')) {
    intent = 'help_request';
    confidence = 0.8;
  }

  // Detectar productos médicos mencionados
  const medicalProducts = [
    'termómetro', 'tensiómetro', 'oxímetro', 'estetoscopio', 'jeringa',
    'guantes', 'mascarilla', 'alcohol', 'gasas', 'vendas', 'suero',
    'equipo médico', 'dispositivo médico', 'instrumental'
  ];
  
  for (const product of medicalProducts) {
    if (messageText.includes(product)) {
      productMentioned = product;
      break;
    }
  }

  // Generar respuesta basada en el intent y contexto
  let responseMessage = generateResponse(intent, productMentioned, message);

  // Si hay un producto seleccionado en el contexto, personalizar la respuesta
  if (context.selectedProduct) {
    responseMessage = personalizeResponseForProduct(responseMessage, context.selectedProduct);
  }

  return {
    message: responseMessage,
    intent,
    confidence,
    productMentioned,
    suggestedActions: getSuggestedActions(intent, productMentioned)
  };
}

function generateResponse(intent: string, productMentioned: string | null, originalMessage: string): string {
  switch (intent) {
    case 'greeting':
      return '¡Hola! Bienvenido a Amunet, tu especialista en productos médicos. Soy tu asistente virtual y estoy aquí para ayudarte a encontrar exactamente lo que necesitas. ¿En qué puedo asistirte hoy?';
    
    case 'catalog_request':
      return '¡Por supuesto! Tenemos una amplia gama de productos médicos:\n\n📋 Dispositivos médicos (termómetros, tensiómetros, oxímetros)\n🧤 Suministros médicos (guantes, mascarillas, gasas)\n🏥 Equipo hospitalario (camillas, sillas de ruedas)\n💊 Productos farmacéuticos\n🚑 Equipos de emergencia\n\n¿Hay alguna categoría específica que te interese?';
    
    case 'price_inquiry':
      if (productMentioned) {
        return `Te ayudo con el precio del ${productMentioned}. Tenemos diferentes modelos y marcas disponibles. Los precios varían desde $150 MXN hasta $2,500 MXN dependiendo de las características. ¿Te gustaría que te muestre las opciones disponibles?`;
      }
      return 'Con gusto te ayudo con información de precios. ¿Qué producto específico te interesa? Tenemos una amplia gama con precios competitivos y la mejor calidad del mercado.';
    
    case 'purchase_intent':
      if (productMentioned) {
        return `Excelente elección el ${productMentioned}. Para proceder con tu pedido necesito algunos datos:\n\n📦 Cantidad que necesitas\n📍 Ubicación para envío\n📝 ¿Es para uso personal o institucional?\n\nTambién puedo ofrecerte descuentos por volumen si necesitas varias piezas.`;
      }
      return 'Perfecto, estoy aquí para ayudarte con tu compra. ¿Qué productos necesitas? Puedo ofrecerte los mejores precios y condiciones de envío a toda la República Mexicana.';
    
    case 'help_request':
      return 'Estoy aquí para ayudarte con cualquier consulta sobre nuestros productos médicos. Puedo asistirte con:\n\n🔍 Búsqueda de productos específicos\n💰 Información de precios y descuentos\n📦 Proceso de compra y envío\n📋 Especificaciones técnicas\n🏥 Recomendaciones para tu necesidad\n\n¿En qué específicamente necesitas ayuda?';
    
    default:
      if (productMentioned) {
        return `Entiendo que preguntas sobre ${productMentioned}. Es un excelente producto que tenemos disponible en diferentes presentaciones. ¿Te gustaría conocer más detalles como precios, especificaciones técnicas o disponibilidad?`;
      }
      return 'Gracias por tu mensaje. Como especialista en productos médicos, puedo ayudarte a encontrar exactamente lo que necesitas. ¿Podrías ser más específico sobre qué tipo de producto o información buscas?';
  }
}

function personalizeResponseForProduct(response: string, selectedProduct: string): string {
  return response + `\n\n💡 Como veo que te interesa ${selectedProduct}, puedo darte información específica sobre este producto si gustas.`;
}

function getSuggestedActions(intent: string, productMentioned: string | null): string[] {
  const actions: string[] = [];
  
  switch (intent) {
    case 'greeting':
      actions.push('Mostrar catálogo general', 'Preguntar sobre necesidades específicas');
      break;
    case 'catalog_request':
      actions.push('Mostrar productos por categoría', 'Filtrar por precio');
      break;
    case 'price_inquiry':
      actions.push('Mostrar opciones de productos', 'Ofrecer descuentos');
      break;
    case 'purchase_intent':
      actions.push('Solicitar datos de envío', 'Calcular costos totales');
      break;
    case 'help_request':
      actions.push('Ofrecer asistencia especializada', 'Conectar con experto');
      break;
  }
  
  if (productMentioned) {
    actions.push(`Mostrar detalles de ${productMentioned}`);
  }
  
  return actions;
}
