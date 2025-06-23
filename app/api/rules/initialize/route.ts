
import { NextRequest, NextResponse } from 'next/server';
import { BusinessRulesService } from '@/lib/business-rules-service';

export const dynamic = "force-dynamic";

// POST - Inicializar reglas predefinidas
export async function POST(request: NextRequest) {
  try {
    const rulesService = new BusinessRulesService();
    
    // Inicializar reglas predefinidas
    await rulesService.initializeDefaultRules();
    
    // Contar reglas activas después de la inicialización
    const activeRules = await rulesService.getActiveRules();
    
    return NextResponse.json({
      success: true,
      message: 'Reglas predefinidas inicializadas correctamente',
      count: activeRules.length
    });
  } catch (error) {
    console.error('Error initializing default rules:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize default rules',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
