
import { PrismaClient } from '@prisma/client';
import { WooCommerceIntegrationService } from './woocommerce-integration-service';

interface CustomerMatchResult {
  customer: any;
  confidence: number;
  matchMethod: 'exact_email' | 'exact_phone' | 'fuzzy_name' | 'myalice_id' | 'new_customer';
  suggestions?: any[];
}

interface IdentityData {
  email?: string;
  phone?: string;
  name?: string;
  myaliceId?: string;
  additionalData?: any;
}

// Servicio para resolución de identidad de clientes
export class IdentityResolutionService {
  private prisma: PrismaClient;
  private wooService: WooCommerceIntegrationService;

  constructor() {
    this.prisma = new PrismaClient();
    this.wooService = new WooCommerceIntegrationService();
  }

  // Método principal de resolución de identidad
  async resolveCustomerIdentity(identityData: IdentityData): Promise<CustomerMatchResult> {
    try {
      console.log('Resolviendo identidad de cliente:', identityData);

      // 1. Búsqueda exacta por MyAlice ID
      if (identityData.myaliceId) {
        const myaliceMatch = await this.findByMyAliceId(identityData.myaliceId);
        if (myaliceMatch) {
          return {
            customer: myaliceMatch,
            confidence: 1.0,
            matchMethod: 'myalice_id'
          };
        }
      }

      // 2. Búsqueda exacta por email
      if (identityData.email) {
        const emailMatch = await this.findByEmail(identityData.email);
        if (emailMatch) {
          // Actualizar MyAlice ID si no lo tenía
          if (identityData.myaliceId && !emailMatch.myaliceId) {
            await this.updateMyAliceId(emailMatch.id, identityData.myaliceId);
            emailMatch.myaliceId = identityData.myaliceId;
          }
          return {
            customer: emailMatch,
            confidence: 0.95,
            matchMethod: 'exact_email'
          };
        }
      }

      // 3. Búsqueda exacta por teléfono
      if (identityData.phone) {
        const phoneMatch = await this.findByPhone(identityData.phone);
        if (phoneMatch) {
          // Actualizar información faltante
          await this.updateCustomerInfo(phoneMatch.id, identityData);
          return {
            customer: phoneMatch,
            confidence: 0.9,
            matchMethod: 'exact_phone'
          };
        }
      }

      // 4. Búsqueda difusa por nombre
      if (identityData.name) {
        const nameMatches = await this.findByFuzzyName(identityData.name);
        if (nameMatches.length > 0) {
          const bestMatch = nameMatches[0];
          return {
            customer: bestMatch.customer,
            confidence: bestMatch.confidence,
            matchMethod: 'fuzzy_name',
            suggestions: nameMatches.slice(1, 4) // Hasta 3 sugerencias adicionales
          };
        }
      }

      // 5. No se encontró coincidencia - crear nuevo cliente
      const newCustomer = await this.createNewCustomer(identityData);
      return {
        customer: newCustomer,
        confidence: 1.0,
        matchMethod: 'new_customer'
      };

    } catch (error) {
      console.error('Error resolviendo identidad de cliente:', error);
      throw error;
    }
  }

  // Resolución específica para clientes de WooCommerce
  async resolveWooCommerceCustomer(identityData: IdentityData): Promise<CustomerMatchResult> {
    try {
      // Intentar encontrar en WooCommerce primero
      const wooCustomer = await this.wooService.findOrCreateCustomer(
        identityData.email || '',
        identityData.name,
        identityData.phone
      );

      if (wooCustomer) {
        // Buscar o crear en base de datos local
        let localCustomer = await this.findByEmail(wooCustomer.email);
        
        if (!localCustomer) {
          localCustomer = await this.prisma.customer.create({
            data: {
              woocommerceId: wooCustomer.id,
              myaliceId: identityData.myaliceId,
              email: wooCustomer.email,
              phone: identityData.phone,
              name: `${wooCustomer.firstName} ${wooCustomer.lastName}`.trim(),
              whatsappNumber: this.normalizePhoneNumber(identityData.phone || '')
            }
          });
        } else {
          // Actualizar información de WooCommerce
          localCustomer = await this.prisma.customer.update({
            where: { id: localCustomer.id },
            data: {
              woocommerceId: wooCustomer.id,
              myaliceId: identityData.myaliceId || localCustomer.myaliceId
            }
          });
        }

        return {
          customer: localCustomer,
          confidence: 0.95,
          matchMethod: 'exact_email'
        };
      }

      // Si no se encuentra en WooCommerce, usar resolución normal
      return await this.resolveCustomerIdentity(identityData);

    } catch (error) {
      console.error('Error resolviendo cliente de WooCommerce:', error);
      // Fallback a resolución normal
      return await this.resolveCustomerIdentity(identityData);
    }
  }

  // Vincular clientes duplicados
  async mergeCustomers(primaryCustomerId: string, secondaryCustomerId: string): Promise<any> {
    try {
      const primary = await this.prisma.customer.findUnique({
        where: { id: primaryCustomerId }
      });

      const secondary = await this.prisma.customer.findUnique({
        where: { id: secondaryCustomerId }
      });

      if (!primary || !secondary) {
        throw new Error('Uno o ambos clientes no encontrados');
      }

      // Combinar datos de ambos clientes
      const mergedData = {
        email: primary.email || secondary.email,
        phone: primary.phone || secondary.phone,
        name: primary.name || secondary.name,
        woocommerceId: primary.woocommerceId || secondary.woocommerceId,
        myaliceId: primary.myaliceId || secondary.myaliceId,
        whatsappNumber: primary.whatsappNumber || secondary.whatsappNumber,
        totalOrders: primary.totalOrders + secondary.totalOrders,
        totalSpent: Number(primary.totalSpent) + Number(secondary.totalSpent),
        customerSegment: this.determineBestSegment(primary.customerSegment || undefined, secondary.customerSegment || undefined)
      };

      // Actualizar cliente principal
      const updatedPrimary = await this.prisma.customer.update({
        where: { id: primaryCustomerId },
        data: mergedData
      });

      // Migrar conversaciones del cliente secundario al principal
      await this.prisma.conversation.updateMany({
        where: { customerId: secondaryCustomerId },
        data: { customerId: primaryCustomerId }
      });

      // Migrar datos de ventas
      await this.prisma.salesData.updateMany({
        where: { customerId: secondaryCustomerId },
        data: { customerId: primaryCustomerId }
      });

      // Eliminar cliente secundario
      await this.prisma.customer.delete({
        where: { id: secondaryCustomerId }
      });

      // Registrar la fusión
      await this.prisma.activityLog.create({
        data: {
          action: 'merge_customers',
          entityType: 'customer',
          entityId: primaryCustomerId,
          details: {
            primaryCustomerId,
            secondaryCustomerId,
            mergedData
          }
        }
      });

      return updatedPrimary;

    } catch (error) {
      console.error('Error fusionando clientes:', error);
      throw error;
    }
  }

  // Detectar clientes duplicados
  async findDuplicateCustomers(): Promise<Array<{
    customers: any[];
    matchType: string;
    confidence: number;
  }>> {
    try {
      const duplicates = [];

      // Duplicados por email
      const emailDuplicates = await this.prisma.customer.groupBy({
        by: ['email'],
        where: {
          email: { not: null }
        },
        having: {
          email: { _count: { gt: 1 } }
        }
      });

      for (const dup of emailDuplicates) {
        if (dup.email) {
          const customers = await this.prisma.customer.findMany({
            where: { email: dup.email }
          });
          duplicates.push({
            customers,
            matchType: 'email',
            confidence: 1.0
          });
        }
      }

      // Duplicados por teléfono
      const phoneDuplicates = await this.prisma.customer.groupBy({
        by: ['phone'],
        where: {
          phone: { not: null }
        },
        having: {
          phone: { _count: { gt: 1 } }
        }
      });

      for (const dup of phoneDuplicates) {
        if (dup.phone) {
          const customers = await this.prisma.customer.findMany({
            where: { phone: dup.phone }
          });
          duplicates.push({
            customers,
            matchType: 'phone',
            confidence: 0.95
          });
        }
      }

      return duplicates;

    } catch (error) {
      console.error('Error encontrando duplicados:', error);
      return [];
    }
  }

  // === MÉTODOS PRIVADOS ===

  private async findByMyAliceId(myaliceId: string) {
    return await this.prisma.customer.findUnique({
      where: { myaliceId }
    });
  }

  private async findByEmail(email: string) {
    return await this.prisma.customer.findUnique({
      where: { email: email.toLowerCase() }
    });
  }

  private async findByPhone(phone: string) {
    const normalizedPhone = this.normalizePhoneNumber(phone);
    return await this.prisma.customer.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { whatsappNumber: normalizedPhone }
        ]
      }
    });
  }

  private async findByFuzzyName(name: string): Promise<Array<{customer: any, confidence: number}>> {
    const nameVariations = this.generateNameVariations(name);
    const customers = await this.prisma.customer.findMany({
      where: {
        name: { not: null }
      }
    });

    const matches = customers.map(customer => {
      const confidence = this.calculateNameSimilarity(name, customer.name || '');
      return { customer, confidence };
    }).filter(match => match.confidence > 0.7)
      .sort((a, b) => b.confidence - a.confidence);

    return matches;
  }

  private async updateMyAliceId(customerId: string, myaliceId: string) {
    return await this.prisma.customer.update({
      where: { id: customerId },
      data: { myaliceId }
    });
  }

  private async updateCustomerInfo(customerId: string, identityData: IdentityData) {
    const updates: any = {};
    
    if (identityData.email) updates.email = identityData.email;
    if (identityData.myaliceId) updates.myaliceId = identityData.myaliceId;
    if (identityData.name) updates.name = identityData.name;

    if (Object.keys(updates).length > 0) {
      return await this.prisma.customer.update({
        where: { id: customerId },
        data: updates
      });
    }
  }

  private async createNewCustomer(identityData: IdentityData) {
    return await this.prisma.customer.create({
      data: {
        myaliceId: identityData.myaliceId,
        email: identityData.email?.toLowerCase(),
        phone: identityData.phone,
        name: identityData.name,
        whatsappNumber: this.normalizePhoneNumber(identityData.phone || ''),
        customerSegment: 'new'
      }
    });
  }

  private normalizePhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Remover espacios y caracteres especiales
    let normalized = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Si no empieza con +, agregar código de país por defecto (México +52)
    if (!normalized.startsWith('+')) {
      if (normalized.startsWith('52')) {
        normalized = '+' + normalized;
      } else if (normalized.length === 10) {
        normalized = '+52' + normalized;
      } else {
        normalized = '+' + normalized;
      }
    }
    
    return normalized;
  }

  private generateNameVariations(name: string): string[] {
    const variations = [name.toLowerCase()];
    
    // Variaciones comunes
    const parts = name.toLowerCase().split(' ');
    if (parts.length > 1) {
      variations.push(parts[0]); // Solo primer nombre
      variations.push(parts[parts.length - 1]); // Solo apellido
      variations.push(`${parts[0]} ${parts[parts.length - 1]}`); // Nombre y último apellido
    }
    
    return variations;
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalize = (str: string) => str.toLowerCase().trim();
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    if (n1 === n2) return 1.0;
    
    // Similitud usando distancia de Levenshtein
    const levenshtein = this.levenshteinDistance(n1, n2);
    const maxLength = Math.max(n1.length, n2.length);
    const similarity = 1 - (levenshtein / maxLength);
    
    return similarity;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private determineBestSegment(segment1?: string, segment2?: string): string {
    const segmentPriority: Record<string, number> = {
      'vip': 4,
      'loyal': 3,
      'regular': 2,
      'new': 1
    };

    const priority1 = segmentPriority[segment1 || 'new'] || 1;
    const priority2 = segmentPriority[segment2 || 'new'] || 1;

    return priority1 >= priority2 ? (segment1 || 'new') : (segment2 || 'new');
  }
}
