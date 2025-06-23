
export interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
}

export interface Product {
  id: string;
  woocommerceId?: number;
  sku: string;
  name: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  stockStatus: string;
  categories: string[];
  images: string[];
  status: string;
  lastSynced: Date;
}

export interface Customer {
  id: string;
  woocommerceId?: number;
  myaliceId?: string;
  email?: string;
  phone?: string;
  name?: string;
  totalOrders: number;
  totalSpent: number;
  customerSegment?: string;
}

export interface Conversation {
  id: string;
  myaliceTicketId?: string;
  customerId: string;
  customer?: Customer;
  channel: string;
  status: string;
  priority: string;
  subject?: string;
  messageCount: number;
  startedAt: Date;
  resolvedAt?: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: string;
  messageType: string;
  content: string;
  sentAt: Date;
}

export interface BusinessRule {
  id: string;
  name: string;
  description?: string;
  trigger: any;
  conditions: any;
  actions: any;
  priority: number;
  isActive: boolean;
  category?: string;
  executions?: any[];
  createdAt: Date;
}

export interface Report {
  id: string;
  name: string;
  type: string;
  parameters: any;
  format: string[];
  isActive: boolean;
}

export interface SalesData {
  id: string;
  date: Date;
  orderId: string;
  totalAmount: number;
  currency: string;
  source: string;
  channel: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface DashboardStats {
  totalProducts: number;
  activeConversations: number;
  totalSales: number;
  responseTime: number;
  conversionRate: number;
  customerSatisfaction: number;
}

// Tipos para MyAlice.ai - Integración Completa
export interface MyAliceWebhookPayload {
  action: string;
  ticket: {
    id: string;
    conversation_text: string;
    channel: string;
    status: string;
    created_at: string;
    updated_at: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    tags?: string[];
  };
  customer: {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    avatar_url?: string;
    custom_fields?: Record<string, any>;
  };
  message?: {
    id: string;
    content: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
    attachments?: MyAliceAttachment[];
    timestamp: string;
    sender: 'customer' | 'agent' | 'bot';
  };
  channel?: {
    id: string;
    name: string;
    type: 'whatsapp' | 'telegram' | 'messenger' | 'webchat';
    provider: string;
  };
  agent?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface MyAliceChannel {
  id: string;
  name: string;
  type: 'whatsapp' | 'telegram' | 'messenger' | 'webchat';
  provider: string;
  status: 'active' | 'inactive' | 'error';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MyAliceTemplate {
  id: string;
  name: string;
  content: string;
  variables: MyAliceTemplateVariable[];
  channel_id: string;
  status: 'approved' | 'pending' | 'rejected';
  created_at: string;
  updated_at: string;
  category?: string;
  language: string;
}

export interface MyAliceTemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'url' | 'email';
  required: boolean;
  default_value?: string;
  description?: string;
}

export interface MyAliceConversation {
  id: string;
  ticket_id: string;
  customer_id: string;
  channel_id: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_agent_id?: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  tags: string[];
  custom_fields: Record<string, any>;
  message_count: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentiment_score?: number;
}

export interface MyAliceMessage {
  id: string;
  conversation_id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'template';
  sender: 'customer' | 'agent' | 'bot';
  sender_id: string;
  attachments: MyAliceAttachment[];
  metadata: Record<string, any>;
  created_at: string;
  delivered_at?: string;
  read_at?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface MyAliceAttachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  thumbnail_url?: string;
  created_at: string;
}

export interface MyAliceMetrics {
  total_messages: number;
  total_conversations: number;
  active_conversations: number;
  response_time_avg: number;
  resolution_time_avg: number;
  customer_satisfaction: number;
  message_volume_by_hour: Record<string, number>;
  top_conversation_topics: Array<{
    topic: string;
    count: number;
  }>;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface MyAliceWebhookConfig {
  webhook_url: string;
  secret: string;
  events: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para Rate Limiting
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Tipos para Queue de Mensajes
export interface QueueMessage {
  id: string;
  type: 'webhook' | 'message' | 'analysis';
  payload: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

// Tipos para Análisis de Sentimiento
export interface SentimentAnalysis {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  keywords: string[];
  analyzed_at: Date;
}
