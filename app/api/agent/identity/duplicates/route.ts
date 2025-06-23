
import { NextRequest, NextResponse } from 'next/server';
import { IdentityResolutionService } from '@/lib/identity-resolution-service';

export const dynamic = "force-dynamic";

const identityService = new IdentityResolutionService();

// Obtener clientes duplicados
export async function GET() {
  try {
    const duplicates = await identityService.findDuplicateCustomers();

    return NextResponse.json({
      success: true,
      duplicates,
      count: duplicates.length
    });

  } catch (error) {
    console.error('Error encontrando duplicados:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Fusionar clientes duplicados
export async function POST(request: NextRequest) {
  try {
    const { primaryCustomerId, secondaryCustomerId } = await request.json();

    if (!primaryCustomerId || !secondaryCustomerId) {
      return NextResponse.json(
        { error: 'primaryCustomerId y secondaryCustomerId son requeridos' },
        { status: 400 }
      );
    }

    const mergedCustomer = await identityService.mergeCustomers(
      primaryCustomerId,
      secondaryCustomerId
    );

    return NextResponse.json({
      success: true,
      mergedCustomer,
      message: 'Clientes fusionados exitosamente'
    });

  } catch (error) {
    console.error('Error fusionando clientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
