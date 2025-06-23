
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageSquare, Package, ShoppingCart } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'conversation',
    title: 'Nueva conversación iniciada',
    description: 'Cliente pregunta sobre iPhone 15',
    time: 'Hace 2 min',
    icon: MessageSquare,
    status: 'active'
  },
  {
    id: 2,
    type: 'order',
    title: 'Pedido creado',
    description: 'Orden #1023 por $2,500 MXN',
    time: 'Hace 15 min',
    icon: ShoppingCart,
    status: 'success'
  },
  {
    id: 3,
    type: 'product',
    title: 'Producto actualizado',
    description: 'MacBook Pro M3 - Stock actualizado',
    time: 'Hace 1 hora',
    icon: Package,
    status: 'info'
  },
  {
    id: 4,
    type: 'conversation',
    title: 'Conversación escalada',
    description: 'Cliente requiere soporte técnico',
    time: 'Hace 2 horas',
    icon: MessageSquare,
    status: 'warning'
  }
];

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Actividad Reciente</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const IconComponent = activity.icon;
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-blue-100 p-2">
                  <IconComponent className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
