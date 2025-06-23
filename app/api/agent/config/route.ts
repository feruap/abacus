
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// Obtener configuración del agente
export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        category: { in: ['agent', 'escalation', 'behavior'] }
      },
      orderBy: { category: 'asc' }
    });

    const configByCategory = configs.reduce((acc, config) => {
      const category = config.category || 'general';
      if (!acc[category]) {
        acc[category] = {};
      }
      acc[category][config.key] = {
        value: config.value,
        type: config.type,
        description: config.description
      };
      return acc;
    }, {} as any);

    return NextResponse.json({
      success: true,
      config: configByCategory
    });

  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Actualizar configuración del agente
export async function PUT(request: NextRequest) {
  try {
    const { updates } = await request.json();

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Se requiere objeto updates' },
        { status: 400 }
      );
    }

    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      try {
        const updated = await prisma.systemConfig.update({
          where: { key },
          data: { value: value as any }
        });
        results.push({ key, success: true, value: updated.value });
      } catch (error) {
        results.push({ key, success: false, error: (error as Error).message });
      }
    }

    const allSuccess = results.every(r => r.success);

    return NextResponse.json({
      success: allSuccess,
      results,
      message: allSuccess ? 'Configuración actualizada' : 'Algunas actualizaciones fallaron'
    });

  } catch (error) {
    console.error('Error actualizando configuración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
