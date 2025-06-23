
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Eye, 
  EyeOff, 
  TestTube, 
  CheckCircle, 
  XCircle,
  RefreshCw
} from 'lucide-react';

interface ApiService {
  service: string;
  status: string;
  lastUsed: Date | null;
  description: string;
  testEndpoint: string;
}

export function ApiConfigTable() {
  const [services, setServices] = useState<ApiService[]>([]);
  const [showCredentials, setShowCredentials] = useState<{ [key: string]: boolean }>({});
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    fetchApiServices();
  }, []);

  const fetchApiServices = async () => {
    // Mock data - replace with actual API call
    setServices([
      {
        service: 'woocommerce',
        status: 'active',
        lastUsed: new Date(),
        description: 'WooCommerce REST API para productos y pedidos',
        testEndpoint: '/api/test/woocommerce'
      },
      {
        service: 'myalice',
        status: 'active',
        lastUsed: new Date(),
        description: 'MyAlice.ai API para comunicación WhatsApp',
        testEndpoint: '/api/test/myalice'
      },
      {
        service: 'gemini',
        status: 'active',
        lastUsed: new Date(),
        description: 'Google Gemini LLM para procesamiento de lenguaje',
        testEndpoint: '/api/test/gemini'
      },
      {
        service: 'custom_plugin',
        status: 'inactive',
        lastUsed: null,
        description: 'Plugin personalizado para funciones avanzadas',
        testEndpoint: '/api/test/plugin'
      }
    ]);
  };

  const testApiConnection = async (service: string, endpoint: string) => {
    setTesting(service);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Update service status
        setServices(prev => 
          prev.map(s => 
            s.service === service 
              ? { ...s, status: 'active', lastUsed: new Date() }
              : s
          )
        );
      } else {
        throw new Error('Test failed');
      }
    } catch (error) {
      console.error('API test failed:', error);
      setServices(prev => 
        prev.map(s => 
          s.service === service 
            ? { ...s, status: 'error' }
            : s
        )
      );
    } finally {
      setTesting(null);
    }
  };

  const toggleCredentialsVisibility = (service: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'woocommerce': return '🛒';
      case 'myalice': return '💬';
      case 'gemini': return '🤖';
      case 'custom_plugin': return '🔧';
      default: return '⚙️';
    }
  };

  const getServiceName = (service: string) => {
    switch (service) {
      case 'woocommerce': return 'WooCommerce';
      case 'myalice': return 'MyAlice.ai';
      case 'gemini': return 'Google Gemini';
      case 'custom_plugin': return 'Plugin Personalizado';
      default: return service;
    }
  };

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <Card key={service.service} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getServiceIcon(service.service)}</span>
                <div>
                  <CardTitle className="text-lg">
                    {getServiceName(service.service)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <StatusBadge status={service.status} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testApiConnection(service.service, service.testEndpoint)}
                  disabled={testing === service.service}
                >
                  {testing === service.service ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  {testing === service.service ? 'Probando...' : 'Probar'}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Configuration Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              {service.service === 'woocommerce' && (
                <>
                  <div>
                    <Label htmlFor={`${service.service}-url`}>URL Base</Label>
                    <Input
                      id={`${service.service}-url`}
                      value="https://tst.amunet.com.mx"
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${service.service}-key`}>Consumer Key</Label>
                    <div className="flex space-x-2">
                      <Input
                        id={`${service.service}-key`}
                        type={showCredentials[service.service] ? 'text' : 'password'}
                        value="ck_ba86724d963e025ec001f7b8c79d27588632fbee"
                        readOnly
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleCredentialsVisibility(service.service)}
                      >
                        {showCredentials[service.service] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
              
              {service.service === 'myalice' && (
                <div>
                  <Label htmlFor={`${service.service}-key`}>API Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      id={`${service.service}-key`}
                      type={showCredentials[service.service] ? 'text' : 'password'}
                      value="a3f650841e8311ed9ac54ea52f386655"
                      readOnly
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleCredentialsVisibility(service.service)}
                    >
                      {showCredentials[service.service] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Status Information */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-4">
                <span>
                  Último uso: {service.lastUsed 
                    ? service.lastUsed.toLocaleDateString('es-MX') 
                    : 'Nunca'
                  }
                </span>
                <div className="flex items-center space-x-1">
                  {service.status === 'active' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Conectado</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">Sin conexión</span>
                    </>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
