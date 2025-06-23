
import { NextRequest, NextResponse } from 'next/server';
import { MyAliceClient } from '@/lib/api-clients';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const myaliceClient = new MyAliceClient();
    
    // Obtener configuración actual desde MyAlice.ai
    const externalConfig = await myaliceClient.getWebhookConfig();
    
    // Obtener configuración local
    const localConfig = await prisma.systemConfig.findUnique({
      where: { key: 'myalice_webhook_config' }
    });

    const isSecretConfigured = !!process.env.MYALICE_WEBHOOK_SECRET;

    return NextResponse.json({
      success: true,
      external_config: externalConfig,
      local_config: localConfig?.value || null,
      secret_configured: isSecretConfigured,
      webhook_endpoint: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhook/myalice`
    });

  } catch (error) {
    console.error('Error obteniendo configuración de webhook:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, webhookUrl, regenerateSecret } = body;

    if (action === 'update_url') {
      if (!webhookUrl) {
        return NextResponse.json(
          { error: 'webhookUrl es requerido' },
          { status: 400 }
        );
      }

      const myaliceClient = new MyAliceClient();
      
      let secret = process.env.MYALICE_WEBHOOK_SECRET;
      
      // Generar nuevo secreto si se solicita
      if (regenerateSecret || !secret) {
        secret = crypto.randomBytes(32).toString('hex');
        
        // Aquí deberías actualizar la variable de entorno de manera persistente
        // Por ejemplo, actualizando un archivo .env o usando un sistema de gestión de secretos
        console.log('Nuevo secreto de webhook generado:', secret);
        console.log('IMPORTANTE: Actualiza la variable MYALICE_WEBHOOK_SECRET con este valor');
      }

      // Actualizar configuración en MyAlice.ai
      const result = await myaliceClient.updateWebhookUrl(webhookUrl, secret);
      
      // Guardar configuración local
      await prisma.systemConfig.upsert({
        where: { key: 'myalice_webhook_config' },
        update: {
          value: {
            webhook_url: webhookUrl,
            secret_hash: crypto.createHash('sha256').update(secret || '').digest('hex'),
            updated_at: new Date().toISOString(),
            last_update_result: result as any
          }
        },
        create: {
          key: 'myalice_webhook_config',
          type: 'json',
          category: 'api',
          description: 'Configuración del webhook de MyAlice.ai',
          value: {
            webhook_url: webhookUrl,
            secret_hash: crypto.createHash('sha256').update(secret || '').digest('hex'),
            updated_at: new Date().toISOString(),
            last_update_result: result as any
          }
        }
      });

      return NextResponse.json({
        success: true,
        webhook_url: webhookUrl,
        secret_generated: regenerateSecret || !process.env.MYALICE_WEBHOOK_SECRET,
        secret: regenerateSecret ? secret : undefined,
        myalice_response: result
      });
    }

    if (action === 'test') {
      // Probar la configuración actual
      const testPayload = {
        action: 'test',
        ticket: {
          id: 'test-ticket-' + Date.now(),
          conversation_text: 'Mensaje de prueba del webhook',
          channel: 'test',
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        customer: {
          id: 'test-customer-' + Date.now(),
          email: 'test@example.com',
          phone: '+521234567890',
          name: 'Cliente de Prueba'
        }
      };

      // Simular firma del webhook
      const secret = process.env.MYALICE_WEBHOOK_SECRET;
      if (!secret) {
        return NextResponse.json(
          { error: 'MYALICE_WEBHOOK_SECRET no está configurado' },
          { status: 400 }
        );
      }

      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(testPayload))
        .digest('hex');

      // Hacer petición a nuestro propio endpoint
      const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhook/myalice`;
      
      const testResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Myalice-Signature': `sha256=${signature}`
        },
        body: JSON.stringify(testPayload)
      });

      const testResult = await testResponse.json();

      return NextResponse.json({
        success: testResponse.ok,
        test_payload: testPayload,
        response_status: testResponse.status,
        response_body: testResult,
        webhook_url: webhookUrl
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error en configuración de webhook:', error);
    return NextResponse.json(
      { error: 'Error en operación' },
      { status: 500 }
    );
  }
}
