
'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Eye, Edit, Trash2, Play, Pause } from 'lucide-react';
import { BusinessRule } from '@/lib/types';

export function RulesTable() {
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/rules');
      const data = await response.json();
      // La API devuelve { rules, pagination }, necesitamos solo rules
      setRules(data.rules || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      setRules([]); // Asegurar que siempre sea un array
    } finally {
      setLoading(false);
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        setRules(prev => 
          prev.map(rule => 
            rule.id === ruleId ? { ...rule, isActive } : rule
          )
        );
      }
    } catch (error) {
      console.error('Error updating rule:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta regla?')) {
      try {
        const response = await fetch(`/api/rules/${ruleId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setRules(prev => prev.filter(rule => rule.id !== ruleId));
        }
      } catch (error) {
        console.error('Error deleting rule:', error);
      }
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'escalation': return 'bg-red-100 text-red-800';
      case 'discount': return 'bg-green-100 text-green-800';
      case 'response': return 'bg-blue-100 text-blue-800';
      case 'inventory': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Nombre de la Regla',
      render: (value: string, row: BusinessRule) => (
        <div>
          <p className="font-medium">{value}</p>
          {row.category && (
            <Badge className={getCategoryColor(row.category)}>
              {row.category}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'description',
      title: 'Descripción',
      render: (value: string) => (
        <p className="text-sm text-muted-foreground max-w-xs truncate">
          {value || 'Sin descripción'}
        </p>
      )
    },
    {
      key: 'priority',
      title: 'Prioridad',
      render: (value: number) => (
        <Badge variant="outline">
          {value}
        </Badge>
      )
    },
    {
      key: 'isActive',
      title: 'Estado',
      render: (value: boolean, row: BusinessRule) => (
        <div className="flex items-center space-x-2">
          <Switch
            checked={value}
            onCheckedChange={(checked) => toggleRuleStatus(row.id, checked)}
          />
          <StatusBadge status={value ? 'active' : 'inactive'} />
        </div>
      )
    },
    {
      key: 'executions',
      title: 'Ejecuciones',
      render: (_: any, row: BusinessRule) => (
        <div className="text-center">
          <p className="font-medium">
            {row.executions?.length || 0}
          </p>
          <p className="text-xs text-muted-foreground">
            este mes
          </p>
        </div>
      )
    },
    {
      key: 'createdAt',
      title: 'Creada',
      render: (value: Date) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value).toLocaleDateString('es-MX')}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Acciones',
      render: (_: any, row: BusinessRule) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            {row.isActive ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => deleteRule(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return <div>Cargando reglas...</div>;
  }

  return (
    <DataTable
      data={rules}
      columns={columns}
      searchPlaceholder="Buscar reglas por nombre o categoría..."
      onExport={() => {
        console.log('Exportar reglas');
      }}
    />
  );
}
