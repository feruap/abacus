
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Fetch customer attributes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attributes = await prisma.customerAttribute.findMany({
      where: { customerId: params.id },
      orderBy: { key: 'asc' }
    });

    return NextResponse.json({
      success: true,
      attributes: attributes.map(attr => ({
        id: attr.id,
        key: attr.key,
        value: attr.value,
        type: attr.type,
        isDefault: attr.isDefault,
        createdAt: attr.createdAt,
        updatedAt: attr.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching customer attributes:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch customer attributes'
    }, { status: 500 });
  }
}

// POST - Add/Update customer attribute
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { key, value, type = 'text' } = data;

    if (!key || value === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Key and value are required'
      }, { status: 400 });
    }

    const attribute = await prisma.customerAttribute.upsert({
      where: {
        customerId_key: {
          customerId: params.id,
          key
        }
      },
      update: {
        value: String(value),
        type
      },
      create: {
        customerId: params.id,
        key,
        value: String(value),
        type,
        isDefault: false
      }
    });

    return NextResponse.json({
      success: true,
      attribute: {
        id: attribute.id,
        key: attribute.key,
        value: attribute.value,
        type: attribute.type,
        isDefault: attribute.isDefault,
        createdAt: attribute.createdAt,
        updatedAt: attribute.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating/updating customer attribute:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create/update customer attribute'
    }, { status: 500 });
  }
}

// DELETE - Delete customer attribute
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'Key parameter is required'
      }, { status: 400 });
    }

    await prisma.customerAttribute.delete({
      where: {
        customerId_key: {
          customerId: params.id,
          key
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Attribute deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer attribute:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete customer attribute'
    }, { status: 500 });
  }
}
