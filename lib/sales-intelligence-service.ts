
import { PrismaClient } from '@prisma/client';
import { LLMClient } from './api-clients';
import { WooCommerceIntegrationService } from './woocommerce-integration-service';

interface CustomerInsight {
  customerId: string;
  segment: string;
  lifetimeValue: number;
  purchaseFrequency: number;
  averageOrderValue: number;
  preferredCategories: string[];
  riskScore: number; // 0-1, donde 1 es alto riesgo de abandono
  recommendedProducts: string[];
}

interface SalesRecommendation {
  productSku: string;
  productName: string;
  confidence: number;
  reason: string;
  suggestedPrice: number;
  estimatedConversionRate: number;
}

interface PriceCalculation {
  basePrice: number;
  discounts: Array<{
    type: string;
    amount: number;
    reason: string;
  }>;
  finalPrice: number;
  suggestedUpsells: string[];
}

interface SalesQuote {
  quoteId: string;
  customerId: string;
  products: Array<{
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  discounts: number;
  taxes: number;
  shipping: number;
  total: number;
  validUntil: Date;
  terms: string;
}

// Servicio de inteligencia de ventas
export class SalesIntelligenceService {
  private prisma: PrismaClient;
  private llmClient: LLMClient;
  private wooService: WooCommerceIntegrationService;

  constructor() {
    this.prisma = new PrismaClient();
    this.llmClient = new LLMClient();
    this.wooService = new WooCommerceIntegrationService();
  }

  // === ANÁLISIS DE CLIENTE ===
  async analyzeCustomer(customerId: string): Promise<CustomerInsight> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        throw new Error('Cliente no encontrado');
      }

      // Obtener historial de conversaciones
      const conversations = await this.prisma.conversation.findMany({
        where: { customerId },
        include: { messages: true }
      });

      // Calcular métricas básicas
      const metrics = await this.calculateCustomerMetrics(customerId);
      
      // Analizar patrones de compra
      const purchasePatterns = await this.analyzePurchasePatterns(customerId);
      
      // Generar recomendaciones
      const recommendations = await this.getCustomerRecommendations(customerId);

      return {
        customerId,
        segment: this.determineCustomerSegment(metrics),
        lifetimeValue: metrics.totalSpent,
        purchaseFrequency: metrics.purchaseFrequency,
        averageOrderValue: metrics.averageOrderValue,
        preferredCategories: purchasePatterns.preferredCategories,
        riskScore: await this.calculateChurnRisk(customerId, conversations),
        recommendedProducts: recommendations.map((r: any) => r.productSku)
      };
    } catch (error) {
      console.error('Error analizando cliente:', error);
      throw error;
    }
  }

  async getCustomerRecommendations(customerId: string, context?: string): Promise<SalesRecommendation[]> {
    try {
      const insight = await this.analyzeCustomer(customerId);
      const conversationHistory = await this.getRecentConversationContext(customerId);
      
      // Usar LLM para generar recomendaciones contextuales
      const prompt = this.buildRecommendationPrompt(insight, conversationHistory, context);
      const llmResponse = await this.llmClient.chatCompletion([
        { role: 'system', content: 'Eres un experto en ventas de productos médicos. Genera recomendaciones precisas basadas en el perfil del cliente.' },
        { role: 'user', content: prompt }
      ]);

      const recommendations = this.parseRecommendations(llmResponse.choices[0].message.content);
      
      // Enriquecer con datos de productos
      return await this.enrichRecommendations(recommendations);
    } catch (error) {
      console.error('Error generando recomendaciones:', error);
      return [];
    }
  }

  // === ANÁLISIS DE INTENCIÓN DE COMPRA ===
  async analyzeIntent(message: string, customerId: string): Promise<{
    intent: string;
    confidence: number;
    urgency: 'low' | 'medium' | 'high';
    products: string[];
    priceRange?: { min: number; max: number };
    timeframe?: string;
  }> {
    try {
      const customerInsight = await this.analyzeCustomer(customerId);
      
      const prompt = `
Analiza el siguiente mensaje de un cliente para determinar su intención de compra:

MENSAJE: "${message}"

PERFIL DEL CLIENTE:
- Segmento: ${customerInsight.segment}
- Valor promedio de orden: $${customerInsight.averageOrderValue}
- Categorías preferidas: ${customerInsight.preferredCategories.join(', ')}

Responde en formato JSON:
{
  "intent": "browsing|comparing|ready_to_buy|support|price_inquiry",
  "confidence": 0.0-1.0,
  "urgency": "low|medium|high",
  "products": ["array de productos mencionados"],
  "priceRange": {"min": number, "max": number},
  "timeframe": "immediate|this_week|this_month|flexible"
}
`;

      const response = await this.llmClient.chatCompletion([
        { role: 'user', content: prompt }
      ]);

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error analizando intención:', error);
      return {
        intent: 'browsing',
        confidence: 0.0,
        urgency: 'low',
        products: []
      };
    }
  }

  // === CÁLCULO DE PRECIOS INTELIGENTE ===
  async calculatePricing(productSku: string, customerId: string, quantity: number = 1): Promise<PriceCalculation> {
    try {
      const product = await this.wooService.getProductInfo(productSku);
      if (!product) {
        throw new Error('Producto no encontrado');
      }

      const customerInsight = await this.analyzeCustomer(customerId);
      const basePrice = product.price * quantity;
      
      const discounts = await this.calculateDiscounts(productSku, customerId, quantity, customerInsight);
      const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
      const finalPrice = Math.max(basePrice - totalDiscounts, 0);
      
      const upsells = await this.suggestUpsells(productSku, customerId);

      return {
        basePrice,
        discounts,
        finalPrice,
        suggestedUpsells: upsells
      };
    } catch (error) {
      console.error('Error calculando precios:', error);
      throw error;
    }
  }

  async generateQuote(customerId: string, products: Array<{sku: string, quantity: number}>): Promise<SalesQuote> {
    try {
      const quoteId = `QUOTE-${Date.now()}-${customerId.substring(0, 8)}`;
      let subtotal = 0;
      let totalDiscounts = 0;
      
      const productDetails = [];

      for (const item of products) {
        const pricing = await this.calculatePricing(item.sku, customerId, item.quantity);
        const discountAmount = pricing.basePrice - pricing.finalPrice;
        
        productDetails.push({
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: pricing.finalPrice / item.quantity,
          totalPrice: pricing.finalPrice
        });
        
        subtotal += pricing.basePrice;
        totalDiscounts += discountAmount;
      }

      const taxes = subtotal * 0.16; // IVA México
      const shipping = this.calculateShipping(subtotal);
      const total = subtotal - totalDiscounts + taxes + shipping;

      const quote: SalesQuote = {
        quoteId,
        customerId,
        products: productDetails,
        subtotal,
        discounts: totalDiscounts,
        taxes,
        shipping,
        total,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        terms: this.generateQuoteTerms()
      };

      // Guardar cotización en base de datos
      await this.saveQuote(quote);

      return quote;
    } catch (error) {
      console.error('Error generando cotización:', error);
      throw error;
    }
  }

  // === ANÁLISIS PREDICTIVO ===
  async predictSalesOutcome(conversationId: string): Promise<{
    conversionProbability: number;
    estimatedValue: number;
    timeToClose: number; // días estimados
    recommendedActions: string[];
    riskFactors: string[];
  }> {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: true,
          customer: true
        }
      });

      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      const customerInsight = await this.analyzeCustomer(conversation.customerId);
      const messageAnalysis = await this.analyzeConversationMessages(conversation.messages);
      
      // Usar LLM para predicción
      const predictionPrompt = this.buildPredictionPrompt(conversation, customerInsight, messageAnalysis);
      const llmResponse = await this.llmClient.chatCompletion([
        { role: 'system', content: 'Eres un experto en análisis predictivo de ventas médicas.' },
        { role: 'user', content: predictionPrompt }
      ]);

      return JSON.parse(llmResponse.choices[0].message.content);
    } catch (error) {
      console.error('Error en predicción de ventas:', error);
      return {
        conversionProbability: 0.5,
        estimatedValue: 0,
        timeToClose: 30,
        recommendedActions: ['Seguimiento personalizado'],
        riskFactors: ['Datos insuficientes']
      };
    }
  }

  // === DETECCIÓN DE OPORTUNIDADES ===
  async detectSalesOpportunities(): Promise<Array<{
    customerId: string;
    opportunityType: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
    recommendedAction: string;
    estimatedValue: number;
  }>> {
    try {
      const opportunities = [];

      // Carritos abandonados
      const abandonedCarts = await this.findAbandonedCarts();
      opportunities.push(...abandonedCarts);

      // Clientes inactivos con alto valor
      const inactiveHighValue = await this.findInactiveHighValueCustomers();
      opportunities.push(...inactiveHighValue);

      // Oportunidades de upsell
      const upsellOps = await this.findUpsellOpportunities();
      opportunities.push(...upsellOps);

      // Clientes en riesgo de abandono
      const churnRisk = await this.findChurnRiskCustomers();
      opportunities.push(...churnRisk);

      return opportunities.sort((a, b) => {
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Error detectando oportunidades:', error);
      return [];
    }
  }

  // === MÉTODOS PRIVADOS ===
  private async calculateCustomerMetrics(customerId: string) {
    const salesData = await this.prisma.salesData.findMany({
      where: { customerId }
    });

    const totalSpent = salesData.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalOrders = salesData.length;
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
    // Calcular frecuencia de compra
    const dateRange = this.getDateRange(salesData);
    const daysSinceFirst = dateRange ? (Date.now() - dateRange.first.getTime()) / (1000 * 60 * 60 * 24) : 0;
    const purchaseFrequency = daysSinceFirst > 0 ? totalOrders / (daysSinceFirst / 30) : 0; // órdenes por mes

    return {
      totalSpent,
      totalOrders,
      averageOrderValue,
      purchaseFrequency
    };
  }

  private async analyzePurchasePatterns(customerId: string) {
    const salesData = await this.prisma.salesData.findMany({
      where: { customerId }
    });

    const categories: Record<string, number> = {};
    
    salesData.forEach(sale => {
      const products = sale.products as any[];
      products.forEach(product => {
        if (product.categories) {
          product.categories.forEach((cat: string) => {
            categories[cat] = (categories[cat] || 0) + 1;
          });
        }
      });
    });

    const preferredCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    return { preferredCategories };
  }

  private determineCustomerSegment(metrics: any): string {
    if (metrics.totalSpent > 50000) return 'vip';
    if (metrics.totalSpent > 10000 && metrics.purchaseFrequency > 2) return 'loyal';
    if (metrics.totalOrders > 1) return 'regular';
    return 'new';
  }

  private async calculateChurnRisk(customerId: string, conversations: any[]): Promise<number> {
    // Factores de riesgo: tiempo desde última compra, frecuencia de interacción, sentimiento
    const lastSale = await this.prisma.salesData.findFirst({
      where: { customerId },
      orderBy: { date: 'desc' }
    });

    const daysSinceLastSale = lastSale 
      ? (Date.now() - lastSale.date.getTime()) / (1000 * 60 * 60 * 24)
      : 365;

    const recentNegativeSentiment = conversations
      .flatMap(c => c.messages)
      .filter(m => m.sentAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .some(m => m.metadata?.sentiment === 'negative');

    let riskScore = 0;
    if (daysSinceLastSale > 180) riskScore += 0.4;
    if (daysSinceLastSale > 90) riskScore += 0.2;
    if (recentNegativeSentiment) riskScore += 0.3;
    if (conversations.length === 0) riskScore += 0.1;

    return Math.min(riskScore, 1.0);
  }

  private async calculateDiscounts(productSku: string, customerId: string, quantity: number, insight: CustomerInsight) {
    const discounts = [];

    // Descuento por volumen
    if (quantity >= 5) {
      discounts.push({
        type: 'volume',
        amount: insight.averageOrderValue * 0.1 * quantity,
        reason: 'Descuento por volumen'
      });
    }

    // Descuento por lealtad
    if (insight.segment === 'vip') {
      discounts.push({
        type: 'loyalty',
        amount: insight.averageOrderValue * 0.15,
        reason: 'Descuento VIP'
      });
    }

    return discounts;
  }

  private calculateShipping(subtotal: number): number {
    if (subtotal > 5000) return 0; // Envío gratis
    if (subtotal > 1000) return 200;
    return 400;
  }

  private generateQuoteTerms(): string {
    return `
Términos y Condiciones:
- Cotización válida por 7 días
- Precios en pesos mexicanos (MXN)
- IVA incluido
- Tiempo de entrega: 3-5 días hábiles
- Garantía según especificaciones del fabricante
- Pago: Transferencia bancaria o tarjeta de crédito
    `.trim();
  }

  private async saveQuote(quote: SalesQuote): Promise<void> {
    // Guardar cotización en base de datos para seguimiento
    await this.prisma.metric.create({
      data: {
        name: 'quote_generated',
        category: 'sales',
        value: quote.total,
        date: new Date(),
        metadata: {
          quoteId: quote.quoteId,
          customerId: quote.customerId,
          productCount: quote.products.length
        }
      }
    });
  }

  private getDateRange(salesData: any[]) {
    if (salesData.length === 0) return null;
    const dates = salesData.map(s => s.date).sort();
    return { first: dates[0], last: dates[dates.length - 1] };
  }

  private async getRecentConversationContext(customerId: string): Promise<string> {
    const conversations = await this.prisma.conversation.findMany({
      where: { customerId },
      include: { messages: true },
      orderBy: { startedAt: 'desc' },
      take: 3
    });

    return conversations
      .flatMap(c => c.messages)
      .slice(0, 10)
      .map(m => `${m.direction}: ${m.content}`)
      .join('\n');
  }

  private buildRecommendationPrompt(insight: CustomerInsight, context: string, currentContext?: string): string {
    return `
Genera recomendaciones de productos médicos para este cliente:

PERFIL:
- Segmento: ${insight.segment}
- Valor de vida: $${insight.lifetimeValue}
- Categorías preferidas: ${insight.preferredCategories.join(', ')}
- Riesgo de abandono: ${(insight.riskScore * 100).toFixed(1)}%

CONTEXTO ACTUAL: ${currentContext || 'Consulta general'}

HISTORIAL RECIENTE:
${context}

Responde con array JSON de recomendaciones:
[{
  "productSku": "SKU",
  "confidence": 0.0-1.0,
  "reason": "explicación"
}]
`;
  }

  private parseRecommendations(llmResponse: string): any[] {
    try {
      const jsonMatch = llmResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parseando recomendaciones:', error);
    }
    return [];
  }

  private async enrichRecommendations(recommendations: any[]): Promise<SalesRecommendation[]> {
    const enriched = [];
    
    for (const rec of recommendations) {
      const product = await this.wooService.getProductInfo(rec.productSku);
      if (product) {
        enriched.push({
          productSku: rec.productSku,
          productName: product.name,
          confidence: rec.confidence,
          reason: rec.reason,
          suggestedPrice: product.price,
          estimatedConversionRate: this.estimateConversionRate(rec.confidence)
        });
      }
    }

    return enriched;
  }

  private estimateConversionRate(confidence: number): number {
    // Modelo simple: mayor confianza = mayor conversión
    return Math.min(confidence * 0.8, 0.9);
  }

  private buildPredictionPrompt(conversation: any, insight: CustomerInsight, messageAnalysis: any): string {
    return `
Predice el resultado de esta conversación de ventas:

CONVERSACIÓN:
- Duración: ${conversation.messages.length} mensajes
- Estado: ${conversation.status}
- Prioridad: ${conversation.priority}

CLIENTE:
- Segmento: ${insight.segment}
- Historial: $${insight.lifetimeValue}

ANÁLISIS DE MENSAJES:
${JSON.stringify(messageAnalysis)}

Responde en JSON:
{
  "conversionProbability": 0.0-1.0,
  "estimatedValue": number,
  "timeToClose": days,
  "recommendedActions": ["array"],
  "riskFactors": ["array"]
}
`;
  }

  private async analyzeConversationMessages(messages: any[]): Promise<any> {
    const totalMessages = messages.length;
    const customerMessages = messages.filter(m => m.direction === 'inbound');
    const lastMessage = messages[messages.length - 1];
    
    return {
      totalMessages,
      customerEngagement: customerMessages.length / totalMessages,
      lastMessageDirection: lastMessage?.direction,
      timeSinceLastMessage: lastMessage ? Date.now() - lastMessage.sentAt.getTime() : 0
    };
  }

  private async findAbandonedCarts(): Promise<any[]> {
    // Implementar lógica para encontrar carritos abandonados
    return [];
  }

  private async findInactiveHighValueCustomers(): Promise<any[]> {
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 días
    
    const customers = await this.prisma.customer.findMany({
      where: {
        totalSpent: { gt: 10000 },
        lastOrderDate: { lt: cutoffDate }
      }
    });

    return customers.map(customer => ({
      customerId: customer.id,
      opportunityType: 'inactive_high_value',
      priority: 'high' as const,
      description: `Cliente VIP inactivo por más de 90 días (valor: $${customer.totalSpent})`,
      recommendedAction: 'Campaña de reactivación personalizada',
      estimatedValue: Number(customer.totalSpent) * 0.3
    }));
  }

  private async findUpsellOpportunities(): Promise<any[]> {
    // Implementar lógica para encontrar oportunidades de upsell
    return [];
  }

  private async findChurnRiskCustomers(): Promise<any[]> {
    // Implementar lógica para encontrar clientes en riesgo
    return [];
  }

  private async suggestUpsells(productSku: string, customerId: string): Promise<string[]> {
    try {
      const product = await this.wooService.getProductInfo(productSku);
      if (!product) return [];

      // Buscar productos relacionados o complementarios
      const relatedProducts = await this.prisma.product.findMany({
        where: {
          categories: { hasSome: product.categories.map((c: any) => c.name) },
          sku: { not: productSku },
          status: 'active'
        },
        take: 3
      });

      return relatedProducts.map(p => p.sku);
    } catch (error) {
      console.error('Error sugiriendo upsells:', error);
      return [];
    }
  }
}
