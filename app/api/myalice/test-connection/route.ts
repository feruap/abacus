
import { NextRequest, NextResponse } from 'next/server';
import { MyAliceClient } from '@/lib/api-clients';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const myAliceClient = new MyAliceClient();
    
    // Diagnóstico completo de conectividad
    const diagnostics = {
      apiKey: !!process.env.MYALICE_API_KEY,
      baseConnection: false,
      channels: [] as any[],
      templates: [] as any[],
      conversations: [] as any[],
      webhookConfig: null as any,
      error: null as string | null
    };

    console.log('🔍 Iniciando diagnóstico de conectividad MyAlice.ai...');
    
    // 1. Verificar conexión básica
    try {
      diagnostics.baseConnection = await myAliceClient.validateConnection();
      console.log('✅ Conexión básica:', diagnostics.baseConnection);
    } catch (error) {
      console.error('❌ Error en conexión básica:', error);
      diagnostics.error = `Conexión básica falló: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }

    if (!diagnostics.baseConnection) {
      return NextResponse.json({
        success: false,
        message: 'No se pudo conectar con MyAlice.ai API',
        diagnostics
      }, { status: 500 });
    }

    // 2. Obtener canales disponibles
    try {
      const channelsResponse = await myAliceClient.getAllChannels() as any;
      diagnostics.channels = channelsResponse.data || channelsResponse || [];
      console.log('📱 Canales encontrados:', diagnostics.channels.length);
    } catch (error) {
      console.error('❌ Error obteniendo canales:', error);
      diagnostics.error = `Error obteniendo canales: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }

    // 3. Obtener plantillas disponibles
    try {
      const templatesResponse = await myAliceClient.getAllTemplates() as any;
      diagnostics.templates = templatesResponse.data || templatesResponse || [];
      console.log('📋 Plantillas encontradas:', diagnostics.templates.length);
    } catch (error) {
      console.error('❌ Error obteniendo plantillas:', error);
      // No es crítico si no hay plantillas
    }

    // 4. Obtener conversaciones de muestra
    try {
      const conversationsResponse = await myAliceClient.getConversations(undefined, 10, 0) as any;
      diagnostics.conversations = conversationsResponse.data || conversationsResponse || [];
      console.log('💬 Conversaciones encontradas:', diagnostics.conversations.length);
    } catch (error) {
      console.error('❌ Error obteniendo conversaciones:', error);
      // No es crítico si no hay conversaciones
    }

    // 5. Obtener configuración de webhook
    try {
      const webhookResponse = await myAliceClient.getWebhookConfig() as any;
      diagnostics.webhookConfig = webhookResponse.data || webhookResponse || null;
      console.log('🔗 Configuración webhook:', diagnostics.webhookConfig);
    } catch (error) {
      console.error('❌ Error obteniendo configuración webhook:', error);
      // No es crítico si no hay webhook configurado
    }

    return NextResponse.json({
      success: true,
      message: 'Conectividad verificada exitosamente',
      diagnostics,
      summary: {
        connection: diagnostics.baseConnection,
        channels: diagnostics.channels.length,
        templates: diagnostics.templates.length,
        conversations: diagnostics.conversations.length,
        webhookConfigured: !!diagnostics.webhookConfig
      }
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico de conectividad:', error);
    return NextResponse.json({
      success: false,
      message: 'Error en diagnóstico de conectividad',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
