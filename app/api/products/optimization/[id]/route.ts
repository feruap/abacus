
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

// PUT - Actualizar optimización de producto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { keyPhrases, suggestedResponses } = await request.json();
    const productId = params.id;

    // En una implementación real, esto se guardaría en la base de datos
    // Por ahora solo simulamos la respuesta exitosa
    console.log('Optimización actualizada para producto:', productId, {
      keyPhrases,
      suggestedResponses
    });

    return NextResponse.json({
      success: true,
      message: 'Optimización guardada correctamente',
      data: {
        productId,
        keyPhrases,
        suggestedResponses,
        lastOptimized: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating product optimization:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update optimization' 
    }, { status: 500 });
  }
}
