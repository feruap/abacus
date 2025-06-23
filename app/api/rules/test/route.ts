
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { BusinessRulesService } from '@/lib/business-rules-service';

export const dynamic = "force-dynamic";

// POST - Probar reglas contra un mensaje
export async function POST(request: NextRequest) {
  try {
    const { message, ruleFilter, context } = await request.json();

    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    const rulesService = new BusinessRulesService();
    
    // Obtener reglas a probar
    let rules;
    if (ruleFilter && ruleFilter !== 'all') {
      rules = await rulesService.getRulesByCategory(ruleFilter);
    } else {
      rules = await rulesService.getActiveRules();
    }

    // Probar cada regla contra el mensaje
    const testResults = [];
    
    for (const rule of rules) {
      const startTime = Date.now();
      const testResult = await testRuleAgainstMessage(rule, message, context);
      const executionTime = Date.now() - startTime;

      testResults.push({
        ruleId: rule.id,
        ruleName: rule.name,
        matched: testResult.matched,
        confidence: testResult.confidence,
        executionTime,
        actions: testResult.matched ? rule.actions : [],
        reason: testResult.reason
      });
    }

    // Ordenar por coincidencias primero, luego por confianza
    testResults.sort((a, b) => {
      if (a.matched !== b.matched) {
        return b.matched ? 1 : -1;
      }
      return b.confidence - a.confidence;
    });

    return NextResponse.json({
      success: true,
      testResults,
      summary: {
        totalRules: rules.length,
        matchedRules: testResults.filter(r => r.matched).length,
        averageExecutionTime: testResults.reduce((sum, r) => sum + r.executionTime, 0) / testResults.length
      }
    });
  } catch (error) {
    console.error('Error testing rules:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test rules'
    }, { status: 500 });
  }
}

async function testRuleAgainstMessage(rule: any, message: string, context: any) {
  const messageText = message.toLowerCase();
  let matched = false;
  let confidence = 0;
  let reason = '';

  try {
    // Verificar triggers
    if (rule.trigger) {
      // Verificar keywords
      if (rule.trigger.keywords && Array.isArray(rule.trigger.keywords)) {
        const keywordMatches = rule.trigger.keywords.filter((keyword: string) => 
          messageText.includes(keyword.toLowerCase())
        );
        
        if (keywordMatches.length > 0) {
          matched = true;
          confidence = Math.min(keywordMatches.length / rule.trigger.keywords.length, 1);
          reason = `Coincidió con palabras clave: ${keywordMatches.join(', ')}`;
        }
      }

      // Verificar intents
      if (rule.trigger.intents && Array.isArray(rule.trigger.intents)) {
        const detectedIntent = detectIntent(messageText);
        if (rule.trigger.intents.includes(detectedIntent)) {
          matched = true;
          confidence = Math.max(confidence, 0.8);
          reason = reason ? `${reason}; Intent detectado: ${detectedIntent}` : `Intent detectado: ${detectedIntent}`;
        }
      }

      // Verificar si es primer mensaje
      if (rule.trigger.isFirstMessage && context.previousMessages && context.previousMessages.length === 0) {
        matched = true;
        confidence = Math.max(confidence, 0.9);
        reason = reason ? `${reason}; Es primer mensaje` : 'Es primer mensaje';
      }
    }

    // Verificar condiciones adicionales
    if (matched && rule.conditions) {
      // Verificar segmento de cliente
      if (rule.conditions.customerSegment && context.customerSegment !== rule.conditions.customerSegment) {
        matched = false;
        reason = `No coincide el segmento de cliente (esperado: ${rule.conditions.customerSegment}, actual: ${context.customerSegment})`;
        confidence = 0;
      }
    }

    if (!matched) {
      reason = reason || 'No coincidió con ningún trigger de la regla';
    }

  } catch (error) {
    console.error('Error testing rule:', error);
    matched = false;
    confidence = 0;
    reason = `Error al evaluar regla: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  return { matched, confidence, reason };
}

function detectIntent(messageText: string): string {
  // Detección básica de intent basada en palabras clave
  if (messageText.includes('hola') || messageText.includes('buenas') || messageText.includes('buenos')) {
    return 'greeting';
  } else if (messageText.includes('precio') || messageText.includes('costo') || messageText.includes('cuanto')) {
    return 'price_request';
  } else if (messageText.includes('catálogo') || messageText.includes('catalogo') || messageText.includes('productos')) {
    return 'catalog_request';
  } else if (messageText.includes('comprar') || messageText.includes('pedido') || messageText.includes('orden')) {
    return 'purchase_intent';
  } else if (messageText.includes('ayuda') || messageText.includes('información') || messageText.includes('info')) {
    return 'help_request';
  } else if (messageText.includes('adiós') || messageText.includes('gracias') || messageText.includes('bye')) {
    return 'goodbye';
  }
  
  return 'unknown';
}
