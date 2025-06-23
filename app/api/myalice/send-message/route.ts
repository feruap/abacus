
import { NextRequest, NextResponse } from 'next/server';
import { MyAliceClient, LLMClient } from '@/lib/api-clients';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      channelId, 
      to, 
      message, 
      type = 'text',
      conversationId,
      templateName,
      templateVariables,
      fileUrl 
    } = body;

    // Validar datos requeridos
    if (!channelId || !to) {
      return NextResponse.json(
        { error: 'channelId y to son requeridos' },
        { status: 400 }
      );
    }

    const myaliceClient = new MyAliceClient();
    let result;
    let messageContent = '';

    // Enviar según el tipo de mensaje
    switch (type) {
      case 'text':
        if (!message) {
          return NextResponse.json(
            { error: 'message es requerido para tipo text' },
            { status: 400 }
          );
        }
        result = await myaliceClient.sendTextMessage(channelId, to, message) as any;
        messageContent = message;
        break;

      case 'template':
        if (!templateName) {
          return NextResponse.json(
            { error: 'templateName es requerido para tipo template' },
            { status: 400 }
          );
        }
        result = await myaliceClient.sendTemplateMessage(
          channelId, 
          to, 
          templateName, 
          templateVariables || {}
        ) as any;
        messageContent = `Plantilla: ${templateName}`;
        break;

      case 'attachment':
        if (!fileUrl) {
          return NextResponse.json(
            { error: 'fileUrl es requerido para tipo attachment' },
            { status: 400 }
          );
        }
        result = await myaliceClient.sendAttachmentMessage(channelId, to, fileUrl, message) as any;
        messageContent = message || 'Archivo adjunto';
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de mensaje no válido' },
          { status: 400 }
        );
    }

    // Registrar mensaje en la base de datos si hay conversación
    if (conversationId) {
      try {
        await prisma.message.create({
          data: {
            conversationId,
            channelId: await getLocalChannelId(channelId),
            direction: 'outbound',
            messageType: type,
            content: messageContent,
            metadata: {
              myalice_message_id: result.id,
              type,
              ...(templateName && { template_name: templateName }),
              ...(templateVariables && { template_variables: templateVariables }),
              ...(fileUrl && { file_url: fileUrl })
            },
            status: result.status || 'sent'
          }
        });

        // Actualizar contador de mensajes de la conversación
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            messageCount: { increment: 1 }
          }
        });
      } catch (dbError) {
        console.error('Error guardando mensaje en BD:', dbError);
        // No fallar si hay error en BD, el mensaje ya se envió
      }
    }

    return NextResponse.json({
      success: true,
      messageId: result.id,
      status: result.status,
      type,
      content: messageContent
    });

  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}

// Función auxiliar para obtener el ID local del canal
async function getLocalChannelId(myaliceChannelId: string): Promise<string | null> {
  try {
    const channel = await prisma.myAliceChannel.findUnique({
      where: { myaliceId: myaliceChannelId }
    });
    return channel?.id || null;
  } catch (error) {
    console.error('Error obteniendo canal local:', error);
    return null;
  }
}
