
import { NextRequest, NextResponse } from 'next/server';
import { DemoDataService } from '@/lib/demo-data-service';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const demoService = new DemoDataService();
    
    console.log('🎭 Iniciando población de datos de demostración...');
    const result = await demoService.populateDemoData();

    return NextResponse.json({
      success: true,
      message: 'Datos de demostración creados exitosamente',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error poblando datos de demostración:', error);
    return NextResponse.json({
      success: false,
      message: 'Error creando datos de demostración',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const demoService = new DemoDataService();
    
    console.log('🧹 Iniciando limpieza de datos de demostración...');
    await demoService.clearDemoData();

    return NextResponse.json({
      success: true,
      message: 'Datos de demostración eliminados exitosamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error eliminando datos de demostración:', error);
    return NextResponse.json({
      success: false,
      message: 'Error eliminando datos de demostración',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
