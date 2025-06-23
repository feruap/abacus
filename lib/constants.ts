
export const CONVERSATION_STATUS = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  ESCALATED: 'escalated',
  CLOSED: 'closed'
} as const;

export const CONVERSATION_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export const MESSAGE_DIRECTION = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound'
} as const;

export const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  DOCUMENT: 'document',
  TEMPLATE: 'template',
  SYSTEM: 'system'
} as const;

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft'
} as const;

export const STOCK_STATUS = {
  IN_STOCK: 'instock',
  OUT_OF_STOCK: 'outofstock',
  ON_BACKORDER: 'onbackorder'
} as const;

export const RULE_CATEGORY = {
  ESCALATION: 'escalation',
  DISCOUNT: 'discount',
  RESPONSE: 'response',
  INVENTORY: 'inventory'
} as const;

export const NOTIFICATION_TYPE = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success'
} as const;

export const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    title: 'Dashboard Principal',
    href: '/',
    icon: 'BarChart3'
  },
  {
    id: 'agent',
    title: 'Agente LLM',
    href: '/agent',
    icon: 'Bot'
  },
  {
    id: 'products',
    title: 'Entrenamiento de Productos',
    href: '/products',
    icon: 'Package'
  },
  {
    id: 'conversations',
    title: 'Área de Conversaciones',
    href: '/conversations',
    icon: 'MessageSquare'
  },
  {
    id: 'config',
    title: 'Configuración del Sistema',
    href: '/config',
    icon: 'Settings'
  },
  {
    id: 'rules',
    title: 'Motor de Reglas',
    href: '/rules',
    icon: 'Zap'
  }
] as const;
