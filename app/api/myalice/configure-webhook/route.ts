
import { NextRequest, NextResponse } from 'next/server';
import { MyAliceSyncService } from '@/lib/myalice-sync-service';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { webhookUrl, secret } = await request.json();

    if (!webhookUrl) {
      return NextResponse.json({
        success: false,
        message: 'URL de webhook es requerida'
      }, { status: 400 });
    }

    const syncService = new MyAliceSyncService();
    
    console.log('🔗 Configurando webhook:', webhookUrl);
    const result = await syncService.configureWebhook(webhookUrl, secret);

    return NextResponse.json({
      success: true,
      message: 'Webhook configurado exitosamente',
      result
    });

  } catch (error) {
    console.error('❌ Error configurando webhook:', error);
    return NextResponse.json({
      success: false,
      message: 'Error configurando webhook',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { MyAliceClient } = await import('@/lib/api-clients');
    const myAliceClient = new MyAliceClient();
    
    const config = await myAliceClient.getWebhookConfig() as any;

    return NextResponse.json({
      success: true,
      config: config.data || config
    });

  } catch (error) {
    console.error('❌ Error obteniendo configuración webhook:', error);
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo configuración webhook',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
