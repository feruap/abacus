
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { ApiConfigTable } from '@/components/config/api-config-table';
import { SystemConfigForm } from '@/components/config/system-config-form';
import { BackupSettings } from '@/components/config/backup-settings';
import { Settings, Key, Database, Shield } from 'lucide-react';

export default function ConfigPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
          <p className="text-muted-foreground">
            Gestión de APIs, credenciales, fuentes de datos y configuración general
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Database className="mr-2 h-4 w-4" />
            Backup Manual
          </Button>
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            Configuración Avanzada
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="APIs Configuradas"
          value="4"
          description="servicios activos"
          icon="Key"
        />
        <MetricCard
          title="Estado General"
          value="100%"
          description="servicios operativos"
          icon="Shield"
          trend="up"
        />
        <MetricCard
          title="Último Backup"
          value="2h"
          description="hace"
          icon="Database"
        />
        <MetricCard
          title="Configuraciones"
          value="23"
          description="parámetros activos"
          icon="Settings"
        />
      </div>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Configuración de APIs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Cargando configuración de APIs...</div>}>
            <ApiConfigTable />
          </Suspense>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración General</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Cargando configuración...</div>}>
            <SystemConfigForm />
          </Suspense>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Configuración de Backup</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Cargando configuración de backup...</div>}>
            <BackupSettings />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
