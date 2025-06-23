
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export function ProductsSync() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSync = async () => {
    setSyncing(true);
    setProgress(0);

    try {
      const response = await fetch('/api/products/sync', {
        method: 'POST'
      });
      
      if (response.ok) {
        // Simulate progress updates
        for (let i = 0; i <= 100; i += 10) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error('Error syncing products:', error);
    } finally {
      setSyncing(false);
      setProgress(0);
    }
  };

  const syncStats = [
    {
      label: 'Última Sincronización',
      value: '2 horas',
      status: 'success',
      icon: CheckCircle
    },
    {
      label: 'Productos Procesados',
      value: '1,247',
      status: 'info',
      icon: Clock
    },
    {
      label: 'Errores',
      value: '3',
      status: 'warning',
      icon: AlertCircle
    }
  ];

  return (
    <div className="space-y-4">
      {/* Sync Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Sincronización con WooCommerce</h3>
          <p className="text-sm text-muted-foreground">
            Mantén actualizado el catálogo de productos
          </p>
        </div>
        <Button 
          onClick={handleSync} 
          disabled={syncing}
          className="min-w-32"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
        </Button>
      </div>

      {/* Progress Bar */}
      {syncing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso de sincronización</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {syncStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-semibold">{stat.value}</p>
                  </div>
                  <IconComponent 
                    className={`h-5 w-5 ${
                      stat.status === 'success' ? 'text-green-500' :
                      stat.status === 'warning' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`} 
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
