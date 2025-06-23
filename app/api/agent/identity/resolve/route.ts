
import { NextRequest, NextResponse } from 'next/server';
import { IdentityResolutionService } from '@/lib/identity-resolution-service';

export const dynamic = "force-dynamic";

const identityService = new IdentityResolutionService();

// Endpoint para resolver identidad de clientes
export async function POST(request: NextRequest) {
  try {
    const { identityData, includeWooCommerce = false } = await request.json();

    if (!identityData) {
      return NextResponse.json(
        { error: 'identityData es requerido' },
        { status: 400 }
      );
    }

    let result;
    if (includeWooCommerce) {
      result = await identityService.resolveWooCommerceCustomer(identityData);
    } else {
      result = await identityService.resolveCustomerIdentity(identityData);
    }

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Error resolviendo identidad:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
