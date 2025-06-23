
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

// Nueva estructura de navegación basada en CRM AI
export const NAVIGATION_CATEGORIES = [
  {
    id: 'activity',
    title: 'ACTIVITY',
    icon: 'Activity',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/',
        icon: 'BarChart3',
        description: 'Resumen general del sistema'
      },
      {
        id: 'conversations',
        title: 'Live Chat',
        href: '/conversations',
        icon: 'MessageSquare',
        description: 'Conversaciones en tiempo real'
      },
      {
        id: 'leads',
        title: 'Leads',
        href: '/leads',
        icon: 'Users',
        description: 'Gestión de leads y prospectos'
      }
    ]
  },
  {
    id: 'training',
    title: 'TRAINING DATA',
    icon: 'BookOpen',
    items: [
      {
        id: 'products',
        title: 'Products',
        href: '/products',
        icon: 'Package',
        description: 'Catálogo y entrenamiento de productos'
      },
      {
        id: 'knowledge',
        title: 'Knowledge Base',
        href: '/knowledge',
        icon: 'FileText',
        description: 'Base de conocimiento y documentos'
      },
      {
        id: 'qna',
        title: 'Q&A Training',
        href: '/training',
        icon: 'HelpCircle',
        description: 'Preguntas y respuestas para entrenamiento'
      }
    ]
  },
  {
    id: 'behaviour',
    title: 'BEHAVIOUR',
    icon: 'Brain',
    items: [
      {
        id: 'agent',
        title: 'AI Agent',
        href: '/agent',
        icon: 'Bot',
        description: 'Configuración del agente IA'
      },
      {
        id: 'rules',
        title: 'Business Rules',
        href: '/rules',
        icon: 'Zap',
        description: 'Reglas de negocio y automatización'
      }
    ]
  },
  {
    id: 'deployment',
    title: 'DEPLOYMENT',
    icon: 'Settings',
    items: [
      {
        id: 'config',
        title: 'System Config',
        href: '/config',
        icon: 'Settings',
        description: 'Configuración del sistema'
      },
      {
        id: 'deploy',
        title: 'Deploy & Monitor',
        href: '/deploy',
        icon: 'Rocket',
        description: 'Despliegue y monitoreo'
      }
    ]
  }
] as const;

// Para compatibilidad con componentes existentes
export const NAVIGATION_ITEMS = NAVIGATION_CATEGORIES.flatMap(category => 
  category.items.map(item => ({
    ...item,
    category: category.id
  }))
);
