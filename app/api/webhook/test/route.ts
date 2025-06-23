
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'test', includeAuth = true } = body;

    // Generar datos de prueba realistas
    const testPayload = {
      action: action,
      ticket: {
        id: `test-ticket-${Date.now()}`,
        conversation_text: 'Hola, estoy interesado en conocer más sobre sus productos de tecnología. ¿Podrían ayudarme con información sobre precios y disponibilidad?',
        channel: 'whatsapp',
        status: 'open',
        priority: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        customer_id: `test-customer-${Date.now()}`
      },
      customer: {
        id: `test-customer-${Date.now()}`,
        email: 'cliente.prueba@ejemplo.com',
        phone: '+521234567890',
        name: 'Cliente de Prueba',
        company: 'Empresa Test S.A. de C.V.',
        country: 'México',
        metadata: {
          source: 'webhook_test',
          test_mode: true
        }
      },
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
        webhook_version: '2.0',
        source: 'sistema_agentico_test'
      }
    };

    // Configurar la URL del webhook
    const webhookUrl = process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/webhook/myalice`
      : 'http://localhost:3000/api/webhook/myalice';

    console.log(`🧪 Testing webhook en: ${webhookUrl}`);

    // Preparar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'MyAlice-Webhook-Test/1.0',
      'X-Test-Mode': 'true'
    };

    // Agregar autenticación si está configurada
    if (includeAuth) {
      const secret = process.env.MYALICE_WEBHOOK_SECRET;
      if (secret) {
        const signature = crypto
          .createHmac('sha256', secret)
          .update(JSON.stringify(testPayload))
          .digest('hex');
        headers['X-Myalice-Signature'] = `sha256=${signature}`;
        console.log(`🔐 Webhook signature generada: ${signature.substring(0, 16)}...`);
      } else {
        console.warn('⚠️ MYALICE_WEBHOOK_SECRET no configurado');
      }
    }

    // Realizar la petición de prueba
    const startTime = Date.now();
    const testResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload)
    });

    const responseTime = Date.now() - startTime;
    const responseText = await testResponse.text();
    
    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = { raw_response: responseText };
    }

    const testResult = {
      success: testResponse.ok,
      status_code: testResponse.status,
      response_time_ms: responseTime,
      webhook_url: webhookUrl,
      test_payload: testPayload,
      response_headers: Object.fromEntries(testResponse.headers.entries()),
      response_body: responseJson,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Test completado: ${testResponse.status} (${responseTime}ms)`);

    return NextResponse.json({
      success: true,
      message: 'Test de webhook ejecutado correctamente',
      test_result: testResult,
      recommendations: generateRecommendations(testResult)
    });

  } catch (error) {
    console.error('❌ Error en test de webhook:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error ejecutando test de webhook',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(testResult: any): string[] {
  const recommendations = [];

  if (!testResult.success) {
    recommendations.push('❌ El webhook no responde correctamente. Verificar configuración.');
  }

  if (testResult.response_time_ms > 5000) {
    recommendations.push('⚠️ Tiempo de respuesta alto (>5s). Optimizar procesamiento.');
  } else if (testResult.response_time_ms > 2000) {
    recommendations.push('⚡ Tiempo de respuesta moderado. Considerar optimizaciones.');
  } else {
    recommendations.push('✅ Tiempo de respuesta excelente (<2s).');
  }

  if (testResult.status_code === 200) {
    recommendations.push('✅ Webhook procesado correctamente.');
  } else if (testResult.status_code >= 400 && testResult.status_code < 500) {
    recommendations.push('❌ Error del cliente. Verificar formato de datos.');
  } else if (testResult.status_code >= 500) {
    recommendations.push('❌ Error del servidor. Verificar logs de aplicación.');
  }

  if (!testResult.response_headers['content-type']?.includes('application/json')) {
    recommendations.push('⚠️ Respuesta no es JSON. Verificar formato.');
  }

  return recommendations;
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de testing de webhooks',
    usage: 'POST /api/webhook/test con { "action": "test", "includeAuth": true }',
    environment: process.env.NODE_ENV || 'development',
    webhook_url: process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/webhook/myalice`
      : 'http://localhost:3000/api/webhook/myalice'
  });
}
