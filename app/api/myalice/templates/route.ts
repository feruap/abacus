
import { NextRequest, NextResponse } from 'next/server';
import { MyAliceClient } from '@/lib/api-clients';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (channelId) {
      // Obtener plantillas para un canal específico
      const myaliceClient = new MyAliceClient();
      const externalTemplates = await myaliceClient.getTemplates(channelId) as any[];
      
      // Buscar el canal en nuestra base de datos
      const localChannel = await prisma.myAliceChannel.findFirst({
        where: { myaliceId: channelId }
      });

      if (!localChannel) {
        return NextResponse.json(
          { error: 'Canal no encontrado' },
          { status: 404 }
        );
      }

      // Sincronizar plantillas con base de datos local
      const syncPromises = externalTemplates.map(async (template: any) => {
        return prisma.myAliceTemplate.upsert({
          where: { myaliceId: template.id },
          update: {
            name: template.name,
            content: template.content,
            variables: template.variables || [],
            status: template.status,
            category: template.category,
            language: template.language || 'es',
            lastUsed: new Date(),
          },
          create: {
            myaliceId: template.id,
            channelId: localChannel.id,
            name: template.name,
            content: template.content,
            variables: template.variables || [],
            status: template.status,
            category: template.category,
            language: template.language || 'es',
          },
        });
      });

      const syncedTemplates = await Promise.all(syncPromises);

      return NextResponse.json({
        success: true,
        templates: syncedTemplates,
        total: syncedTemplates.length
      });
    } else {
      // Obtener todas las plantillas de la base de datos local
      const templates = await prisma.myAliceTemplate.findMany({
        include: {
          channel: true
        },
        orderBy: {
          usageCount: 'desc'
        }
      });

      return NextResponse.json({
        success: true,
        templates,
        total: templates.length
      });
    }

  } catch (error) {
    console.error('Error obteniendo plantillas:', error);
    return NextResponse.json(
      { error: 'Error al obtener plantillas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, templateId, channelId, to, variables } = body;

    if (action === 'send') {
      // Enviar plantilla
      const template = await prisma.myAliceTemplate.findUnique({
        where: { id: templateId },
        include: { channel: true }
      });

      if (!template) {
        return NextResponse.json(
          { error: 'Plantilla no encontrada' },
          { status: 404 }
        );
      }

      const myaliceClient = new MyAliceClient();
      const result = await myaliceClient.sendTemplateMessage(
        template.channel.myaliceId,
        to,
        template.name,
        variables || {}
      ) as any;

      // Actualizar contador de uso
      await prisma.myAliceTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: { increment: 1 },
          lastUsed: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        messageId: result.id,
        template: template.name
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error en operación de plantilla:', error);
    return NextResponse.json(
      { error: 'Error en operación' },
      { status: 500 }
    );
  }
}
