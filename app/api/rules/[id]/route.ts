
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// PATCH - Update rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ruleId = params.id;
    const data = await request.json();
    
    const rule = await prisma.businessRule.update({
      where: { id: ruleId },
      data: {
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        conditions: data.conditions,
        actions: data.actions,
        priority: data.priority,
        isActive: data.isActive,
        category: data.category,
        maxExecutions: data.maxExecutions,
        cooldownMinutes: data.cooldownMinutes
      }
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error updating rule:', error);
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}

// DELETE - Delete rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ruleId = params.id;
    
    await prisma.businessRule.delete({
      where: { id: ruleId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rule:', error);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}
