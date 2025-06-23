
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Copy } from 'lucide-react';

const predefinedRules = [
  {
    id: 1,
    name: 'Escalación por Sentimiento Negativo',
    description: 'Escala conversaciones cuando se detecta sentimiento muy negativo',
    category: 'escalation',
    usage: 'Alto',
    trigger: 'Análisis de sentimiento < -0.7',
    actions: ['Escalar a agente humano', 'Notificar supervisor']
  },
  {
    id: 2,
    name: 'Descuento por Abandono de Carrito',
    description: 'Ofrece descuento cuando el cliente menciona abandono',
    category: 'discount',
    usage: 'Medio',
    trigger: 'Keywords: "muy caro", "no puedo pagar"',
    actions: ['Aplicar descuento 10%', 'Enviar cupón']
  },
  {
    id: 3,
    name: 'Respuesta Automática FAQ',
    description: 'Responde preguntas frecuentes automáticamente',
    category: 'response',
    usage: 'Muy Alto',
    trigger: 'Preguntas sobre horarios, ubicación, políticas',
    actions: ['Enviar respuesta predefinida']
  },
  {
    id: 4,
    name: 'Alerta Stock Bajo',
    description: 'Notifica cuando un producto consultado tiene stock bajo',
    category: 'inventory',
    usage: 'Medio',
    trigger: 'Consulta de producto con stock < 5',
    actions: ['Notificar inventario', 'Sugerir alternativas']
  },
  {
    id: 5,
    name: 'Escalación por Tiempo de Respuesta',
    description: 'Escala si la conversación lleva mucho tiempo sin resolver',
    category: 'escalation',
    usage: 'Alto',
    trigger: 'Conversación > 30 minutos sin resolución',
    actions: ['Escalar a supervisor', 'Marcar como urgente']
  },
  {
    id: 6,
    name: 'Oferta Especial VIP',
    description: 'Ofrece descuentos especiales a clientes VIP',
    category: 'discount',
    usage: 'Bajo',
    trigger: 'Cliente segmento VIP hace consulta',
    actions: ['Aplicar descuento VIP', 'Notificar agente ventas']
  }
];

export function RulesLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'escalation', label: 'Escalación' },
    { value: 'discount', label: 'Descuentos' },
    { value: 'response', label: 'Respuestas' },
    { value: 'inventory', label: 'Inventario' }
  ];

  const filteredRules = selectedCategory === 'all' 
    ? predefinedRules 
    : predefinedRules.filter(rule => rule.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'escalation': return 'bg-red-100 text-red-800';
      case 'discount': return 'bg-green-100 text-green-800';
      case 'response': return 'bg-blue-100 text-blue-800';
      case 'inventory': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsageColor = (usage: string) => {
    switch (usage) {
      case 'Muy Alto': return 'bg-purple-100 text-purple-800';
      case 'Alto': return 'bg-red-100 text-red-800';
      case 'Medio': return 'bg-yellow-100 text-yellow-800';
      case 'Bajo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUseTemplate = async (ruleId: number) => {
    try {
      const response = await fetch(`/api/rules/templates/${ruleId}/use`, {
        method: 'POST'
      });
      
      if (response.ok) {
        console.log('Template applied successfully');
      }
    } catch (error) {
      console.error('Error applying template:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Rules Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRules.map((rule) => (
          <Card key={rule.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{rule.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rule.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={getCategoryColor(rule.category)}>
                  {rule.category}
                </Badge>
                <Badge variant="outline" className={getUsageColor(rule.usage)}>
                  Uso: {rule.usage}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  DISPARADOR:
                </p>
                <p className="text-sm bg-muted p-2 rounded text-muted-foreground">
                  {rule.trigger}
                </p>
              </div>
              
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  ACCIONES:
                </p>
                <div className="space-y-1">
                  {rule.actions.map((action, index) => (
                    <p key={index} className="text-sm text-muted-foreground">
                      • {action}
                    </p>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleUseTemplate(rule.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Usar
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
