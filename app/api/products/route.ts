
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { WooCommerceClient } from '@/lib/api-clients';

export const dynamic = "force-dynamic";

// GET - Fetch products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.product.count({ where });

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST - Create product
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price,
        regularPrice: data.regularPrice,
        salePrice: data.salePrice,
        stockQuantity: data.stockQuantity,
        stockStatus: data.stockStatus || 'instock',
        categories: data.categories || [],
        tags: data.tags || [],
        images: data.images || [],
        attributes: data.attributes,
        status: data.status || 'active',
        woocommerceId: data.woocommerceId,
        enrichedDescription: data.enrichedDescription,
        keyFeatures: data.keyFeatures || [],
        targetAudience: data.targetAudience,
        useCases: data.useCases || [],
        relatedProducts: data.relatedProducts || []
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
