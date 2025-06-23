
import { NextRequest, NextResponse } from 'next/server';
import { MyAliceClient } from '@/lib/api-clients';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const myaliceClient = new MyAliceClient();
    
    // Obtener canales desde MyAlice.ai
    const externalChannels = await myaliceClient.getAllChannels() as any[];
    
    // Sincronizar con base de datos local
    const syncPromises = externalChannels.map(async (channel: any) => {
      return prisma.myAliceChannel.upsert({
        where: { myaliceId: channel.id },
        update: {
          name: channel.name,
          type: channel.type,
          provider: channel.provider,
          status: channel.status,
          settings: channel.settings || {},
          lastUsed: new Date(),
        },
        create: {
          myaliceId: channel.id,
          name: channel.name,
          type: channel.type,
          provider: channel.provider,
          status: channel.status,
          settings: channel.settings || {},
        },
      });
    });

    const syncedChannels = await Promise.all(syncPromises);

    return NextResponse.json({
      success: true,
      channels: syncedChannels,
      total: syncedChannels.length
    });

  } catch (error) {
    console.error('Error obteniendo canales de MyAlice.ai:', error);
    return NextResponse.json(
      { error: 'Error al obtener canales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, channelId } = body;

    if (action === 'sync') {
      // Sincronizar canal específico
      const myaliceClient = new MyAliceClient();
      const channelDetails = await myaliceClient.getChannelDetails(channelId) as any;
      
      const syncedChannel = await prisma.myAliceChannel.upsert({
        where: { myaliceId: channelId },
        update: {
          name: channelDetails.name,
          type: channelDetails.type,
          provider: channelDetails.provider,
          status: channelDetails.status,
          settings: channelDetails.settings || {},
          lastUsed: new Date(),
        },
        create: {
          myaliceId: channelId,
          name: channelDetails.name,
          type: channelDetails.type,
          provider: channelDetails.provider,
          status: channelDetails.status,
          settings: channelDetails.settings || {},
        },
      });

      return NextResponse.json({
        success: true,
        channel: syncedChannel
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error en operación de canal:', error);
    return NextResponse.json(
      { error: 'Error en operación' },
      { status: 500 }
    );
  }
}
