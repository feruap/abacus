
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  MessageSquare, 
  FileText, 
  Settings, 
  Zap,
  Plus 
} from 'lucide-react';

const quickActions = [
  {
    title: 'Sincronizar Productos',
    description: 'Actualizar catálogo desde WooCommerce',
    icon: Package,
    href: '/products/sync',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    title: 'Ver Conversaciones',
    description: 'Monitorear chat en tiempo real',
    icon: MessageSquare,
    href: '/conversations',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    title: 'Nueva Regla',
    description: 'Configurar comportamiento del agente',
    icon: Zap,
    href: '/rules/new',
    color: 'bg-orange-500 hover:bg-orange-600'
  }
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Acciones Rápidas</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start h-auto p-3 hover:bg-gray-50"
              asChild
            >
              <div className="flex items-center space-x-3">
                <div className={`rounded-lg p-2 text-white ${action.color}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
