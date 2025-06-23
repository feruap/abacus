
import { WooCommerceClient } from './api-clients';
import { PrismaClient } from '@prisma/client';

interface ProductInfo {
  id: number;
  sku: string;
  name: string;
  price: number;
  stockQuantity: number;
  stockStatus: string;
  images: string[];
  categories: any[];
  attributes: any[];
}

interface CustomerInfo {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface OrderData {
  customerId: number;
  products: Array<{
    productId: number;
    quantity: number;
    price?: number;
  }>;
  shippingAddress?: any;
  billingAddress?: any;
  paymentMethod?: string;
  couponCode?: string;
}

interface OrderResult {
  orderId: number;
  orderKey: string;
  paymentUrl: string;
  total: number;
  status: string;
}

// Servicio de integración con WooCommerce
export class WooCommerceIntegrationService {
  private wooClient: WooCommerceClient;
  private prisma: PrismaClient;

  constructor() {
    this.wooClient = new WooCommerceClient();
    this.prisma = new PrismaClient();
  }

  // === GESTIÓN DE INVENTARIO ===
  async getProductInfo(sku: string): Promise<ProductInfo | null> {
    try {
      // Buscar en caché local primero
      const localProduct = await this.prisma.product.findUnique({
        where: { sku }
      });

      if (localProduct && this.isRecentSync(localProduct.lastSynced)) {
        return this.formatLocalProduct(localProduct);
      }

      // Buscar en WooCommerce
      const products = await this.wooClient.getProducts(1, 100);
      const product = products.find((p: any) => p.sku === sku);

      if (product) {
        // Actualizar caché local
        await this.updateLocalProduct(product);
        return this.formatWooProduct(product);
      }

      return null;
    } catch (error) {
      console.error('Error obteniendo información de producto:', error);
      return null;
    }
  }

  async getProductsByCategory(categoryName: string, limit = 10): Promise<ProductInfo[]> {
    try {
      const products = await this.wooClient.getProducts(1, limit);
      return products
        .filter((p: any) => 
          p.categories.some((cat: any) => 
            cat.name.toLowerCase().includes(categoryName.toLowerCase())
          )
        )
        .map((p: any) => this.formatWooProduct(p));
    } catch (error) {
      console.error('Error obteniendo productos por categoría:', error);
      return [];
    }
  }

  async searchProducts(searchTerm: string, limit = 10): Promise<ProductInfo[]> {
    try {
      // Buscar en base de datos local primero
      const localProducts = await this.prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { keyFeatures: { hasSome: [searchTerm] } }
          ],
          status: 'active'
        },
        take: limit
      });

      if (localProducts.length > 0) {
        return localProducts.map(p => this.formatLocalProduct(p));
      }

      // Buscar en WooCommerce si no hay resultados locales
      const products = await this.wooClient.getProducts(1, 100);
      const filtered = products
        .filter((p: any) => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, limit);

      return filtered.map((p: any) => this.formatWooProduct(p));
    } catch (error) {
      console.error('Error buscando productos:', error);
      return [];
    }
  }

  async checkInventory(sku: string): Promise<{inStock: boolean, quantity: number, status: string}> {
    try {
      const productInfo = await this.getProductInfo(sku);
      if (!productInfo) {
        return { inStock: false, quantity: 0, status: 'not_found' };
      }

      return {
        inStock: productInfo.stockStatus === 'instock' && productInfo.stockQuantity > 0,
        quantity: productInfo.stockQuantity,
        status: productInfo.stockStatus
      };
    } catch (error) {
      console.error('Error verificando inventario:', error);
      return { inStock: false, quantity: 0, status: 'error' };
    }
  }

  // === GESTIÓN DE CLIENTES ===
  async findOrCreateCustomer(email: string, name?: string, phone?: string): Promise<CustomerInfo | null> {
    try {
      // Buscar cliente existente
      const customers = await this.wooClient.getCustomers(1, 100);
      let customer = customers.find((c: any) => c.email === email);

      if (!customer && (name || phone)) {
        // Crear nuevo cliente
        const [firstName, ...lastNameParts] = (name || 'Cliente').split(' ');
        const lastName = lastNameParts.join(' ') || 'Nuevo';

        const newCustomerData = {
          email,
          first_name: firstName,
          last_name: lastName,
          billing: {
            first_name: firstName,
            last_name: lastName,
            email,
            phone: phone || ''
          },
          shipping: {
            first_name: firstName,
            last_name: lastName
          }
        };

        customer = await this.wooClient.createCustomer(newCustomerData);
      }

      if (customer) {
        return {
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.billing?.phone
        };
      }

      return null;
    } catch (error) {
      console.error('Error encontrando/creando cliente:', error);
      return null;
    }
  }

  async getCustomerOrderHistory(customerId: number): Promise<any[]> {
    try {
      const orders = await this.wooClient.getOrders(1, 50);
      return orders.filter((order: any) => order.customer_id === customerId);
    } catch (error) {
      console.error('Error obteniendo historial de órdenes:', error);
      return [];
    }
  }

  // === GESTIÓN DE ÓRDENES ===
  async createOrder(orderData: OrderData): Promise<OrderResult | null> {
    try {
      // Verificar inventario antes de crear la orden
      for (const item of orderData.products) {
        const product = await this.wooClient.getProduct(item.productId);
        if (!product || product.stock_quantity < item.quantity) {
          throw new Error(`Producto ${item.productId} no tiene suficiente inventario`);
        }
      }

      // Preparar datos de la orden para WooCommerce
      const wooOrderData = {
        customer_id: orderData.customerId,
        payment_method: orderData.paymentMethod || 'pending',
        payment_method_title: orderData.paymentMethod || 'Pendiente de pago',
        status: 'pending',
        billing: orderData.billingAddress,
        shipping: orderData.shippingAddress,
        line_items: orderData.products.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        coupon_lines: orderData.couponCode ? [{ code: orderData.couponCode }] : []
      };

      const createdOrder = await this.wooClient.createOrder(wooOrderData);

      if (createdOrder) {
        // Guardar en base de datos local
        await this.saveOrderToLocal(createdOrder);

        return {
          orderId: createdOrder.id,
          orderKey: createdOrder.order_key,
          paymentUrl: this.generatePaymentUrl(createdOrder),
          total: parseFloat(createdOrder.total),
          status: createdOrder.status
        };
      }

      return null;
    } catch (error) {
      console.error('Error creando orden:', error);
      return null;
    }
  }

  async createQuickOrder(customerEmail: string, sku: string, quantity: number = 1): Promise<OrderResult | null> {
    try {
      // 1. Encontrar o crear cliente
      const customer = await this.findOrCreateCustomer(customerEmail);
      if (!customer || !customer.id) {
        throw new Error('No se pudo crear o encontrar el cliente');
      }

      // 2. Buscar producto
      const productInfo = await this.getProductInfo(sku);
      if (!productInfo) {
        throw new Error(`Producto con SKU ${sku} no encontrado`);
      }

      // 3. Verificar inventario
      const inventory = await this.checkInventory(sku);
      if (!inventory.inStock || inventory.quantity < quantity) {
        throw new Error(`No hay suficiente inventario para ${sku}`);
      }

      // 4. Crear orden
      const orderData: OrderData = {
        customerId: customer.id,
        products: [{
          productId: productInfo.id,
          quantity,
          price: productInfo.price
        }]
      };

      return await this.createOrder(orderData);
    } catch (error) {
      console.error('Error creando orden rápida:', error);
      return null;
    }
  }

  async updateOrderStatus(orderId: number, status: string): Promise<boolean> {
    try {
      const updatedOrder = await this.wooClient.createOrder({ id: orderId, status });
      return !!updatedOrder;
    } catch (error) {
      console.error('Error actualizando estado de orden:', error);
      return false;
    }
  }

  // === GESTIÓN DE CUPONES Y DESCUENTOS ===
  async createCoupon(code: string, discountType: 'percent' | 'fixed_cart', amount: number, expiryDays = 7): Promise<any> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const couponData = {
        code,
        discount_type: discountType,
        amount: amount.toString(),
        date_expires: expiryDate.toISOString().split('T')[0],
        individual_use: true,
        usage_limit: 1,
        description: `Descuento generado automáticamente por el agente de ventas`
      };

      return await this.wooClient.createCustomer(couponData); // Usar método genérico
    } catch (error) {
      console.error('Error creando cupón:', error);
      return null;
    }
  }

  // === MÉTRICAS Y REPORTES ===
  async getSalesMetrics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const orders = await this.wooClient.getOrders(1, 1000);
      const filteredOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.date_created);
        return orderDate >= startDate && orderDate <= endDate;
      });

      const totalSales = filteredOrders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.total), 0
      );

      const totalOrders = filteredOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      return {
        totalSales,
        totalOrders,
        averageOrderValue,
        period: { startDate, endDate }
      };
    } catch (error) {
      console.error('Error obteniendo métricas de ventas:', error);
      return null;
    }
  }

  // === UTILIDADES PRIVADAS ===
  private isRecentSync(lastSynced: Date): boolean {
    const hoursSinceSync = (Date.now() - lastSynced.getTime()) / (1000 * 60 * 60);
    return hoursSinceSync < 2; // Considerar reciente si fue sincronizado en las últimas 2 horas
  }

  private formatLocalProduct(product: any): ProductInfo {
    return {
      id: product.woocommerceId || 0,
      sku: product.sku,
      name: product.name,
      price: parseFloat(product.price || '0'),
      stockQuantity: product.stockQuantity || 0,
      stockStatus: product.stockStatus,
      images: product.images || [],
      categories: [],
      attributes: []
    };
  }

  private formatWooProduct(product: any): ProductInfo {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: parseFloat(product.price || '0'),
      stockQuantity: product.stock_quantity || 0,
      stockStatus: product.stock_status,
      images: product.images?.map((img: any) => img.src) || [],
      categories: product.categories || [],
      attributes: product.attributes || []
    };
  }

  private async updateLocalProduct(wooProduct: any): Promise<void> {
    try {
      await this.prisma.product.upsert({
        where: { sku: wooProduct.sku },
        update: {
          woocommerceId: wooProduct.id,
          name: wooProduct.name,
          description: wooProduct.description,
          price: parseFloat(wooProduct.price || '0'),
          stockQuantity: wooProduct.stock_quantity || 0,
          stockStatus: wooProduct.stock_status,
          images: wooProduct.images?.map((img: any) => img.src) || [],
          lastSynced: new Date()
        },
        create: {
          sku: wooProduct.sku,
          woocommerceId: wooProduct.id,
          name: wooProduct.name,
          description: wooProduct.description,
          price: parseFloat(wooProduct.price || '0'),
          stockQuantity: wooProduct.stock_quantity || 0,
          stockStatus: wooProduct.stock_status,
          categories: wooProduct.categories?.map((cat: any) => cat.name) || [],
          images: wooProduct.images?.map((img: any) => img.src) || [],
          lastSynced: new Date()
        }
      });
    } catch (error) {
      console.error('Error actualizando producto local:', error);
    }
  }

  private generatePaymentUrl(order: any): string {
    // Generar URL de pago basada en la estructura de WooCommerce
    const baseUrl = process.env.WOOCOMMERCE_URL || '';
    return `${baseUrl}/checkout/order-pay/${order.id}/?pay_for_order=true&key=${order.order_key}`;
  }

  private async saveOrderToLocal(order: any): Promise<void> {
    try {
      await this.prisma.salesData.create({
        data: {
          date: new Date(order.date_created),
          orderId: order.number,
          woocommerceOrderId: order.id,
          totalAmount: parseFloat(order.total),
          taxAmount: parseFloat(order.total_tax || '0'),
          shippingAmount: parseFloat(order.shipping_total || '0'),
          discountAmount: parseFloat(order.discount_total || '0'),
          currency: order.currency,
          products: order.line_items,
          source: 'woocommerce',
          channel: 'whatsapp' // Asumiendo que viene del agente
        }
      });
    } catch (error) {
      console.error('Error guardando orden localmente:', error);
    }
  }
}
