
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Activity, Server, Globe, CheckCircle, AlertCircle } from 'lucide-react';

export default function DeployPage() {
  const deploymentStatus = [
    {
      service: 'MyAlice.ai Integration',
      status: 'active',
      uptime: '99.8%',
      lastCheck: '2025-01-20 14:30'
    },
    {
      service: 'Webhook Processor',
      status: 'active',
      uptime: '100%',
      lastCheck: '2025-01-20 14:30'
    },
    {
      service: 'WooCommerce Sync',
      status: 'warning',
      uptime: '97.2%',
      lastCheck: '2025-01-20 14:25'
    },
    {
      service: 'AI Agent',
      status: 'active',
      uptime: '99.9%',
      lastCheck: '2025-01-20 14:30'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Deploy & Monitor
            </h1>
            <p className="text-gray-600">
              Monitorea el estado del sistema y gestiona el despliegue en producción
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Test Webhooks
            </Button>
            <Button>
              <Rocket className="h-4 w-4 mr-2" />
              Deploy
            </Button>
          </div>
        </div>

        {/* Estado general del sistema */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sistema</p>
                  <p className="text-2xl font-bold text-green-600">Activo</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Uptime</p>
                  <p className="text-2xl font-bold text-blue-600">99.2%</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Servicios</p>
                  <p className="text-2xl font-bold text-purple-600">4/4</p>
                </div>
                <Server className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Región</p>
                  <p className="text-2xl font-bold text-orange-600">MX</p>
                </div>
                <Globe className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estado de servicios */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deploymentStatus.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(service.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">{service.service}</h3>
                      <p className="text-sm text-gray-600">Última verificación: {service.lastCheck}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">Uptime: {service.uptime}</p>
                    </div>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status.toUpperCase()}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Logs
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Información de deployment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Producción</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Dominio:</span>
                <span className="font-medium">crm.amunet.com.mx</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SSL:</span>
                <Badge className="bg-green-100 text-green-800">Activo</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CDN:</span>
                <Badge className="bg-blue-100 text-blue-800">Habilitado</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Webhooks:</span>
                <Badge className="bg-green-100 text-green-800">Configurados</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimas Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Deploy v1.0.0</span>
                <span className="text-sm text-gray-500">Hace 2 horas</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Webhook test</span>
                <span className="text-sm text-gray-500">Hace 30 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">SSL renovado</span>
                <span className="text-sm text-gray-500">Hace 1 día</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
