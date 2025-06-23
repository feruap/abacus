
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Obtener sesiones de entrenamiento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Por ahora simulamos las sesiones ya que no tenemos el modelo en Prisma
    // En una implementación real, esto vendría de la base de datos
    const mockSessions = [
      {
        id: 'session_1',
        title: 'Sesión de Entrenamiento - 20/06/2025',
        status: 'completed',
        messages: [
          { id: '1', content: 'Hola, necesito información sobre termómetros', sender: 'user', timestamp: new Date() },
          { id: '2', content: '¡Hola! Te ayudo con información sobre termómetros...', sender: 'ai', timestamp: new Date() }
        ],
        startedAt: new Date('2025-06-20'),
        productsFocused: ['termómetro', 'oxímetro'],
        metrics: {
          responseTime: 2.3,
          accuracy: 0.89,
          customerSatisfaction: 0.92
        }
      },
      {
        id: 'session_2',
        title: 'Sesión de Entrenamiento - 19/06/2025',
        status: 'completed',
        messages: [
          { id: '1', content: 'Buen día, busco equipo médico', sender: 'user', timestamp: new Date() },
          { id: '2', content: 'Buenos días, tenemos excelente equipo médico...', sender: 'ai', timestamp: new Date() }
        ],
        startedAt: new Date('2025-06-19'),
        productsFocused: ['estetoscopio', 'tensiómetro'],
        metrics: {
          responseTime: 1.8,
          accuracy: 0.94,
          customerSatisfaction: 0.87
        }
      }
    ];

    return NextResponse.json({
      success: true,
      sessions: mockSessions.slice(0, limit)
    });
  } catch (error) {
    console.error('Error fetching training sessions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch sessions' 
    }, { status: 500 });
  }
}

// POST - Crear nueva sesión de entrenamiento
export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json();

    // En una implementación real, guardaríamos en la base de datos
    console.log('Nueva sesión de entrenamiento creada:', sessionData);

    return NextResponse.json({
      success: true,
      session: sessionData
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating training session:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create session' 
    }, { status: 500 });
  }
}
