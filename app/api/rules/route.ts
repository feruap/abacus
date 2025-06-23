
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Fetch rules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const rules = await prisma.businessRule.findMany({
      where,
      include: {
        executions: {
          take: 10,
          orderBy: { executedAt: 'desc' }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const total = await prisma.businessRule.count({ where });

    return NextResponse.json({
      rules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

// POST - Create rule
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const rule = await prisma.businessRule.create({
      data: {
        name: data.name,
        description: data.description,
        trigger: data.trigger || {},
        conditions: data.conditions || {},
        actions: data.actions || {},
        priority: data.priority || 0,
        isActive: data.isActive !== false,
        category: data.category,
        maxExecutions: data.maxExecutions,
        cooldownMinutes: data.cooldownMinutes,
        createdBy: data.createdBy
      }
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }
}
