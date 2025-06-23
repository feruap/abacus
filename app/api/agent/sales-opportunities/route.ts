
import { NextRequest, NextResponse } from 'next/server';
import { SalesIntelligenceService } from '@/lib/sales-intelligence-service';

export const dynamic = "force-dynamic";

const salesIntelligence = new SalesIntelligenceService();

// Obtener oportunidades de ventas
export async function GET() {
  try {
    const opportunities = await salesIntelligence.detectSalesOpportunities();

    return NextResponse.json({
      success: true,
      opportunities,
      count: opportunities.length
    });

  } catch (error) {
    console.error('Error detectando oportunidades:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Análisis de cliente específico
export async function POST(request: NextRequest) {
  try {
    const { customerId, action } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId es requerido' },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case 'analyze':
        result = await salesIntelligence.analyzeCustomer(customerId);
        break;
      
      case 'recommendations':
        const context = request.json().then(body => body.context);
        result = await salesIntelligence.getCustomerRecommendations(customerId, await context);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Error en análisis de cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
