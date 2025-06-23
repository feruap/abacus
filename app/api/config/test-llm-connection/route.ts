
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

// POST - Probar conexión con proveedor LLM
export async function POST(request: NextRequest) {
  try {
    const { provider, model, apiKey, endpoint, version } = await request.json();

    if (!provider || !model || !apiKey) {
      return NextResponse.json({
        success: false,
        message: 'Provider, model y API key son requeridos'
      }, { status: 400 });
    }

    // Probar conexión según el proveedor
    let testResult;
    switch (provider) {
      case 'deepseek':
        testResult = await testDeepSeekConnection(apiKey, model, endpoint, version);
        break;
      case 'abacusai':
        testResult = await testAbacusAIConnection(apiKey, model);
        break;
      case 'openai':
        testResult = await testOpenAIConnection(apiKey, model);
        break;
      case 'gemini':
        testResult = await testGeminiConnection(apiKey, model);
        break;
      case 'claude':
        testResult = await testClaudeConnection(apiKey, model);
        break;
      default:
        return NextResponse.json({
          success: false,
          message: `Proveedor ${provider} no soportado`
        }, { status: 400 });
    }

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Error testing LLM connection:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

async function testDeepSeekConnection(apiKey: string, model: string, endpoint: string, version: string) {
  try {
    const response = await fetch(`${endpoint}/${version}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{
          role: 'user',
          content: 'Hello, this is a connection test.'
        }],
        max_tokens: 10
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Conexión exitosa con DeepSeek',
        details: {
          model: data.model || model,
          responseTime: Date.now()
        }
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: `Error de DeepSeek: ${error.error?.message || 'Conexión fallida'}`,
        statusCode: response.status
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error de conexión: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'network_error'
    };
  }
}

async function testAbacusAIConnection(apiKey: string, model: string) {
  try {
    // Usar la API de Abacus.AI (que ya está configurada en el sistema)
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY || apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{
          role: 'user',
          content: 'Hello, this is a connection test.'
        }],
        max_tokens: 10
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Conexión exitosa con Abacus.AI',
        details: {
          model: data.model || model,
          responseTime: Date.now()
        }
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: `Error de Abacus.AI: ${error.error?.message || 'Conexión fallida'}`,
        statusCode: response.status
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error de conexión: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'network_error'
    };
  }
}

async function testOpenAIConnection(apiKey: string, model: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{
          role: 'user',
          content: 'Hello, this is a connection test.'
        }],
        max_tokens: 10
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Conexión exitosa con OpenAI',
        details: {
          model: data.model || model,
          responseTime: Date.now()
        }
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: `Error de OpenAI: ${error.error?.message || 'Conexión fallida'}`,
        statusCode: response.status
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error de conexión: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'network_error'
    };
  }
}

async function testGeminiConnection(apiKey: string, model: string) {
  try {
    // Simulamos la prueba de Gemini
    // En una implementación real, se haría una llamada a la API de Google
    return {
      success: true,
      message: 'Configuración de Gemini verificada (simulado)',
      details: {
        model: model,
        note: 'Prueba simulada - implementar llamada real a Google AI API'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Error de conexión: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'network_error'
    };
  }
}

async function testClaudeConnection(apiKey: string, model: string) {
  try {
    // Simulamos la prueba de Claude
    // En una implementación real, se haría una llamada a la API de Anthropic
    return {
      success: true,
      message: 'Configuración de Claude verificada (simulado)',
      details: {
        model: model,
        note: 'Prueba simulada - implementar llamada real a Anthropic API'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Error de conexión: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'network_error'
    };
  }
}
