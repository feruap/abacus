
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { WooCommerceClient } from '@/lib/api-clients';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const wooClient = new WooCommerceClient();
    
    // Log sync start
    const syncLog = await prisma.scrapingLog.create({
      data: {
        url: process.env.WOOCOMMERCE_URL || '',
        status: 'running',
        message: 'Iniciando sincronización con WooCommerce',
        startTime: new Date()
      }
    });

    let syncedCount = 0;
    let errorCount = 0;
    let page = 1;
    const perPage = 100;

    try {
      while (true) {
        const products = await wooClient.getProducts(page, perPage);
        
        if (!products || products.length === 0) {
          break;
        }

        for (const wcProduct of products) {
          try {
            await prisma.product.upsert({
              where: { woocommerceId: wcProduct.id },
              update: {
                name: wcProduct.name,
                description: wcProduct.description,
                shortDescription: wcProduct.short_description,
                price: wcProduct.price ? parseFloat(wcProduct.price) : null,
                regularPrice: wcProduct.regular_price ? parseFloat(wcProduct.regular_price) : null,
                salePrice: wcProduct.sale_price ? parseFloat(wcProduct.sale_price) : null,
                stockQuantity: wcProduct.stock_quantity,
                stockStatus: wcProduct.stock_status,
                categories: wcProduct.categories?.map((cat: any) => cat.name) || [],
                tags: wcProduct.tags?.map((tag: any) => tag.name) || [],
                images: wcProduct.images?.map((img: any) => img.src) || [],
                attributes: wcProduct.attributes || {},
                status: wcProduct.status === 'publish' ? 'active' : 'inactive',
                lastSynced: new Date()
              },
              create: {
                woocommerceId: wcProduct.id,
                sku: wcProduct.sku || `wc_${wcProduct.id}`,
                name: wcProduct.name,
                description: wcProduct.description,
                shortDescription: wcProduct.short_description,
                price: wcProduct.price ? parseFloat(wcProduct.price) : null,
                regularPrice: wcProduct.regular_price ? parseFloat(wcProduct.regular_price) : null,
                salePrice: wcProduct.sale_price ? parseFloat(wcProduct.sale_price) : null,
                stockQuantity: wcProduct.stock_quantity,
                stockStatus: wcProduct.stock_status,
                categories: wcProduct.categories?.map((cat: any) => cat.name) || [],
                tags: wcProduct.tags?.map((tag: any) => tag.name) || [],
                images: wcProduct.images?.map((img: any) => img.src) || [],
                attributes: wcProduct.attributes || {},
                status: wcProduct.status === 'publish' ? 'active' : 'inactive',
                keyFeatures: [],
                useCases: [],
                relatedProducts: []
              }
            });
            
            syncedCount++;
          } catch (productError) {
            console.error(`Error syncing product ${wcProduct.id}:`, productError);
            errorCount++;
          }
        }

        page++;
      }

      // Update sync log
      await prisma.scrapingLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'success',
          message: `Sincronización completada. ${syncedCount} productos sincronizados, ${errorCount} errores.`,
          dataCount: syncedCount,
          endTime: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        syncedCount,
        errorCount,
        message: 'Sincronización completada exitosamente'
      });

    } catch (syncError) {
      // Update sync log with error
      await prisma.scrapingLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'failed',
          message: `Error durante la sincronización: ${syncError}`,
          dataCount: syncedCount,
          endTime: new Date()
        }
      });

      throw syncError;
    }

  } catch (error) {
    console.error('Error syncing products:', error);
    return NextResponse.json({ 
      error: 'Failed to sync products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
