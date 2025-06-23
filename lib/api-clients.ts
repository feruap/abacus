
// Cliente para WooCommerce
export class WooCommerceClient {
  private baseURL: string;
  private consumerKey: string;
  private consumerSecret: string;

  constructor() {
    this.baseURL = process.env.WOOCOMMERCE_URL || '';
    this.consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || '';
    this.consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || '';
  }

  private getAuthHeaders() {
    const credentials = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    };
  }

  async getProducts(page = 1, perPage = 20) {
    try {
      const response = await fetch(
        `${this.baseURL}/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`,
        {
          headers: this.getAuthHeaders()
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching WooCommerce products:', error);
      throw error;
    }
  }

  async getProduct(id: number) {
    try {
      const response = await fetch(
        `${this.baseURL}/wp-json/wc/v3/products/${id}`,
        {
          headers: this.getAuthHeaders()
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching WooCommerce product:', error);
      throw error;
    }
  }

  async getOrders(page = 1, perPage = 20) {
    try {
      const response = await fetch(
        `${this.baseURL}/wp-json/wc/v3/orders?page=${page}&per_page=${perPage}`,
        {
          headers: this.getAuthHeaders()
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching WooCommerce orders:', error);
      throw error;
    }
  }

  async getCustomers(page = 1, perPage = 20) {
    try {
      const response = await fetch(
        `${this.baseURL}/wp-json/wc/v3/customers?page=${page}&per_page=${perPage}`,
        {
          headers: this.getAuthHeaders()
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching WooCommerce customers:', error);
      throw error;
    }
  }

  async createOrder(orderData: any) {
    try {
      const response = await fetch(
        `${this.baseURL}/wp-json/wc/v3/orders`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(orderData)
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error creating WooCommerce order:', error);
      throw error;
    }
  }

  async createCustomer(customerData: any) {
    try {
      const response = await fetch(
        `${this.baseURL}/wp-json/wc/v3/customers`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(customerData)
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error creating WooCommerce customer:', error);
      throw error;
    }
  }
}

// Cliente para MyAlice.ai - Integración Completa
export class MyAliceClient {
  private apiKey: string;
  private baseURL: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    this.apiKey = process.env.MYALICE_API_KEY || '';
    this.baseURL = 'https://api.myalice.ai';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 segundo inicial
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  private getMultipartHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      // No incluir Content-Type para multipart/form-data, fetch lo maneja automáticamente
    };
  }

  // Función de reintento con backoff exponencial
  private async retryRequest<T>(
    requestFn: () => Promise<Response>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await requestFn();
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error as Error;
        console.error(`${context} - Intento ${attempt + 1}/${this.maxRetries + 1} falló:`, error);
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          console.log(`Reintentando en ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`${context} falló después de ${this.maxRetries + 1} intentos. Último error: ${lastError?.message}`);
  }

  // === GESTIÓN DE CANALES ===
  async getWhatsAppChannels() {
    return this.retryRequest(
      () => fetch(`${this.baseURL}/channels/whatsapp`, {
        headers: this.getHeaders()
      }),
      'Obtener canales de WhatsApp'
    );
  }

  async getAllChannels() {
    return this.retryRequest(
      () => fetch(`${this.baseURL}/channels`, {
        headers: this.getHeaders()
      }),
      'Obtener todos los canales'
    );
  }

  async getChannelDetails(channelId: string) {
    return this.retryRequest(
      () => fetch(`${this.baseURL}/channels/${channelId}`, {
        headers: this.getHeaders()
      }),
      `Obtener detalles del canal ${channelId}`
    );
  }

  // === GESTIÓN DE PLANTILLAS ===
  async getTemplates(channelId: string) {
    return this.retryRequest(
      () => fetch(`${this.baseURL}/templates?channel_id=${channelId}`, {
        headers: this.getHeaders()
      }),
      `Obtener plantillas del canal ${channelId}`
    );
  }

  async getTemplateDetails(templateId: string) {
    return this.retryRequest(
      () => fetch(`${this.baseURL}/templates/${templateId}`, {
        headers: this.getHeaders()
      }),
      `Obtener detalles de la plantilla ${templateId}`
    );
  }

  async getAllTemplates() {
    return this.retryRequest(
      () => fetch(`${this.baseURL}/templates`, {
        headers: this.getHeaders()
      }),
      'Obtener todas las plantillas'
    );
  }

  // === ENVÍO DE MENSAJES ===
  async sendTextMessage(channelId: string, to: string, message: string) {
    const payload = {
      channel_id: channelId,
      to: this.normalizePhoneNumber(to),
      message
    };

    return this.retryRequest(
      () => fetch(`${this.baseURL}/messages/text`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      }),
      `Enviar mensaje de texto a ${to}`
    );
  }

  async sendTemplateMessage(
    channelId: string, 
    to: string, 
    templateName: string, 
    variables: Record<string, any> = {},
    attachmentUrl?: string
  ) {
    const payload: any = {
      channel_id: channelId,
      to: this.normalizePhoneNumber(to),
      template_name: templateName,
      variables
    };

    if (attachmentUrl) {
      payload.attachment_url = attachmentUrl;
    }

    return this.retryRequest(
      () => fetch(`${this.baseURL}/messages/template`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      }),
      `Enviar plantilla ${templateName} a ${to}`
    );
  }

  async sendAttachmentMessage(channelId: string, to: string, fileUrl: string, caption?: string) {
    const payload: any = {
      channel_id: channelId,
      to: this.normalizePhoneNumber(to),
      attachment_url: fileUrl
    };

    if (caption) {
      payload.caption = caption;
    }

    return this.retryRequest(
      () => fetch(`${this.baseURL}/messages/attachment`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      }),
      `Enviar adjunto a ${to}`
    );
  }

  async sendTemplateWithFile(
    channelId: string,
    to: string,
    templateName: string,
    variables: Record<string, any>,
    file: File
  ) {
    const formData = new FormData();
    formData.append('channel_id', channelId);
    formData.append('to', this.normalizePhoneNumber(to));
    formData.append('template_name', templateName);
    formData.append('variables', JSON.stringify(variables));
    formData.append('file', file);

    return this.retryRequest(
      () => fetch(`${this.baseURL}/messages/template-with-file`, {
        method: 'POST',
        headers: this.getMultipartHeaders(),
        body: formData
      }),
      `Enviar plantilla con archivo a ${to}`
    );
  }

  // === GESTIÓN DE CONVERSACIONES ===
  async getConversations(channelId?: string, limit = 50, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (channelId) {
      params.append('channel_id', channelId);
    }

    return this.retryRequest(
      () => fetch(`${this.baseURL}/conversations?${params.toString()}`, {
        headers: this.getHeaders()
      }),
      'Obtener conversaciones'
    );
  }

  async getConversationDetails(conversationId: string) {
    return this.retryRequest(
      () => fetch(`${this.baseURL}/conversations/${conversationId}`, {
        headers: this.getHeaders()
      }),
      `Obtener detalles de la conversación ${conversationId}`
    );
  }

  async getConversationMessages(conversationId: string, limit = 50, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    return this.retryRequest(
      () => fetch(`${this.baseURL}/conversations/${conversationId}/messages?${params.toString()}`, {
        headers: this.getHeaders()
      }),
      `Obtener mensajes de la conversación ${conversationId}`
    );
  }

  async takeControlOfConversation(conversationId: string, agentId: string) {
    const payload = {
      agent_id: agentId,
      action: 'take_control'
    };

    return this.retryRequest(
      () => fetch(`${this.baseURL}/conversations/${conversationId}/control`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      }),
      `Tomar control de la conversación ${conversationId}`
    );
  }

  async releaseControlOfConversation(conversationId: string) {
    const payload = {
      action: 'release_control'
    };

    return this.retryRequest(
      () => fetch(`${this.baseURL}/conversations/${conversationId}/control`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      }),
      `Liberar control de la conversación ${conversationId}`
    );
  }

  async closeConversation(conversationId: string, reason?: string) {
    const payload: any = {
      action: 'close'
    };

    if (reason) {
      payload.reason = reason;
    }

    return this.retryRequest(
      () => fetch(`${this.baseURL}/conversations/${conversationId}/status`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      }),
      `Cerrar conversación ${conversationId}`
    );
  }

  // === CONFIGURACIÓN DE WEBHOOKS ===
  async getWebhookConfig() {
    return this.retryRequest(
      () => fetch(`${this.baseURL}/webhooks/config`, {
        headers: this.getHeaders()
      }),
      'Obtener configuración de webhook'
    );
  }

  async updateWebhookUrl(webhookUrl: string, secret?: string) {
    const payload: any = {
      webhook_url: webhookUrl
    };

    if (secret) {
      payload.secret = secret;
    }

    return this.retryRequest(
      () => fetch(`${this.baseURL}/webhooks/config`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      }),
      'Actualizar URL de webhook'
    );
  }

  // === MÉTRICAS Y ESTADÍSTICAS ===
  async getChannelMetrics(channelId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return this.retryRequest(
      () => fetch(`${this.baseURL}/analytics/channels/${channelId}/metrics?${params.toString()}`, {
        headers: this.getHeaders()
      }),
      `Obtener métricas del canal ${channelId}`
    );
  }

  async getMessageMetrics(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return this.retryRequest(
      () => fetch(`${this.baseURL}/analytics/messages?${params.toString()}`, {
        headers: this.getHeaders()
      }),
      'Obtener métricas de mensajes'
    );
  }

  // === UTILIDADES ===
  private normalizePhoneNumber(phone: string): string {
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

  async validateConnection(): Promise<boolean> {
    try {
      await this.getAllChannels();
      return true;
    } catch (error) {
      console.error('Error validando conexión con MyAlice.ai:', error);
      return false;
    }
  }

  // === GESTIÓN DE ARCHIVOS ===
  async uploadFile(file: File): Promise<{ file_url: string; file_id: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.retryRequest(
      () => fetch(`${this.baseURL}/files/upload`, {
        method: 'POST',
        headers: this.getMultipartHeaders(),
        body: formData
      }),
      'Subir archivo'
    );
  }

  async getFileDetails(fileId: string) {
    return this.retryRequest(
      () => fetch(`${this.baseURL}/files/${fileId}`, {
        headers: this.getHeaders()
      }),
      `Obtener detalles del archivo ${fileId}`
    );
  }
}

// Cliente para LLM (AbacusAI)
export class LLMClient {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.ABACUSAI_API_KEY || '';
    this.baseURL = process.env.LLM_ENDPOINT_URL || 'https://apps.abacus.ai';
  }

  async chatCompletion(messages: any[], model = 'gpt-4.1-mini') {
    try {
      const response = await fetch(
        `${this.baseURL}/v1/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 1000
          })
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error calling LLM API:', error);
      throw error;
    }
  }

  async analyzeSentiment(text: string) {
    const messages = [
      {
        role: 'system',
        content: 'Analiza el sentimiento del siguiente texto. Responde solo con "positive", "negative" o "neutral" seguido de un score entre -1.0 y 1.0.'
      },
      {
        role: 'user',
        content: text
      }
    ];

    try {
      const response = await this.chatCompletion(messages);
      return this.parseSentimentResponse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return { sentiment: 'neutral', score: 0.0 };
    }
  }

  private parseSentimentResponse(response: string) {
    const lines = response.trim().split(' ');
    const sentiment = lines[0].toLowerCase();
    const score = parseFloat(lines[1]) || 0.0;
    
    return { sentiment, score };
  }
}
