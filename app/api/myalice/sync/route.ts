
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

    const { type = 'full' } = await request.json();
    const syncService = new MyAliceSyncService();

    console.log(`🔄 Iniciando sincronización tipo: ${type}`);

    let result;
    switch (type) {
      case 'channels':
        result = await syncService.syncChannels();
        break;
      case 'templates':
        result = await syncService.syncTemplates();
        break;
      case 'conversations':
        result = await syncService.syncConversations();
        break;
      case 'full':
      default:
        result = await syncService.fullSync();
        break;
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronización completada',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return NextResponse.json({
      success: false,
      message: 'Error en sincronización',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const syncService = new MyAliceSyncService();
    const stats = await syncService.getSyncStats();

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
