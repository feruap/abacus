
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Test LLM API (optional)
    const llmApiKey = process.env.ABACUSAI_API_KEY;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        llm_api: llmApiKey ? 'configured' : 'not_configured'
      },
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    }, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}
