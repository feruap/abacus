
import { NextRequest, NextResponse } from 'next/server';
import { AgentIntegrationService } from '@/lib/agent-integration-service';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const agentIntegration = new AgentIntegrationService();
const prisma = new PrismaClient();

// Procesador especializado para webhooks de MyAlice.ai usando el agente LLM
export async function POST(request: NextRequest) {
  try {
    const { webhookPayload } = await request.json();

    if (!webhookPayload) {
      return NextResponse.json(
        { error: 'webhookPayload es requerido' },
        { status: 400 }
      );
    }

    console.log('Procesando webhook con agente LLM:', webhookPayload.action);

    // Verificar si el agente está habilitado
    const agentConfig = await prisma.systemConfig.findUnique({
      where: { key: 'agent_enabled' }
    });

    if (!agentConfig || !agentConfig.value) {
      console.log('Agente LLM deshabilitado, saltando procesamiento');
      return NextResponse.json({
        success: true,
        message: 'Agente LLM deshabilitado'
      });
    }

    // Procesar solo mensajes de clientes y tickets nuevos
    if (webhookPayload.action === 'ticket.created' || 
        (webhookPayload.action === 'ticket.message' && webhookPayload.message?.sender === 'customer')) {
      
      const result = await agentIntegration.processIncomingMessage(webhookPayload);
      
      return NextResponse.json({
        success: result.success,
        processed: true,
        response: result.response,
        action: result.action,
        error: result.error
      });
    }

    return NextResponse.json({
      success: true,
      processed: false,
      message: 'Webhook no requiere procesamiento del agente'
    });

  } catch (error) {
    console.error('Error en procesador de webhook:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
