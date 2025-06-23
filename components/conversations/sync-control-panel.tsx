
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  MessageSquare,
  Users,
  Phone,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SyncStats {
  channels: number;
  templates: number;
  conversations: number;
  messages: number;
  lastSync: string | null;
}

interface ConnectionStatus {
  connection: boolean;
  channels: number;
  templates: number;
  conversations: number;
  webhookConfigured: boolean;
}

export function SyncControlPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [syncResults, setSyncResults] = useState<any>(null);
  const { toast } = useToast();

  // Verificar conectividad al cargar
  useEffect(() => {
    checkConnection();
    getSyncStats();
  }, []);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/myalice/test-connection');
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus(data.summary);
        toast({
          title: "Conectividad verificada",
          description: `Conectado a MyAlice.ai con ${data.summary.channels} canales`,
        });
      } else {
        setConnectionStatus(null);
        toast({
          title: "Error de conectividad",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verificando conectividad:', error);
      setConnectionStatus(null);
      toast({
        title: "Error de conectividad",
        description: "No se pudo conectar con MyAlice.ai",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSyncStats = async () => {
    try {
      const response = await fetch('/api/myalice/sync');
      const data = await response.json();
      
      if (data.success) {
        setSyncStats(data.stats);
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
    }
  };

  const executeSync = async (type: 'full' | 'channels' | 'templates' | 'conversations') => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/myalice/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      });

      const data = await response.json();
      
      if (data.success) {
        setSyncResults(data.result);
        await getSyncStats(); // Actualizar estadísticas
        
        toast({
          title: "Sincronización completada",
          description: `${type === 'full' ? 'Sincronización completa' : `Sincronización de ${type}`} realizada exitosamente`,
        });
      } else {
        toast({
          title: "Error en sincronización",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
      toast({
        title: "Error en sincronización",
        description: "Error inesperado durante la sincronización",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const configureWebhook = async () => {
    try {
      setIsLoading(true);
      
      // Obtener URL base del sistema
      const baseUrl = window.location.origin;
      const webhookUrl = `${baseUrl}/api/webhook/myalice`;
      const secret = process.env.NEXT_PUBLIC_MYALICE_WEBHOOK_SECRET || 'webhook-secret-key';

      const response = await fetch('/api/myalice/configure-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          webhookUrl,
          secret
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await checkConnection(); // Verificar conectividad actualizada
        toast({
          title: "Webhook configurado",
          description: `Webhook configurado en: ${webhookUrl}`,
        });
      } else {
        toast({
          title: "Error configurando webhook",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error configurando webhook:', error);
      toast({
        title: "Error configurando webhook",
        description: "Error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const populateDemoData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/demo/populate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        await getSyncStats(); // Actualizar estadísticas
        toast({
          title: "Datos de demostración creados",
          description: `Se crearon ${data.result.conversations} conversaciones y ${data.result.messages} mensajes`,
        });
      } else {
        toast({
          title: "Error creando datos demo",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error poblando datos demo:', error);
      toast({
        title: "Error creando datos demo",
        description: "Error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearDemoData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/demo/populate', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        await getSyncStats(); // Actualizar estadísticas
        toast({
          title: "Datos de demostración eliminados",
          description: "Todos los datos de demostración han sido removidos",
        });
      } else {
        toast({
          title: "Error eliminando datos demo",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error eliminando datos demo:', error);
      toast({
        title: "Error eliminando datos demo",
        description: "Error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado de Conectividad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {connectionStatus?.connection ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Estado de Conectividad MyAlice.ai
          </CardTitle>
          <CardDescription>
            Verificación de conexión y configuración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={connectionStatus?.connection ? "default" : "destructive"}>
                {connectionStatus?.connection ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span className="text-sm">{connectionStatus?.channels || 0} Canales</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm">{connectionStatus?.templates || 0} Plantillas</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">{connectionStatus?.conversations || 0} Conversaciones</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={connectionStatus?.webhookConfigured ? "default" : "secondary"}>
                {connectionStatus?.webhookConfigured ? "Webhook OK" : "Sin Webhook"}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={checkConnection}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Verificar Conexión
            </Button>
            <Button
              onClick={configureWebhook}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Configurar Webhook
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Panel de Sincronización */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Control de Sincronización
          </CardTitle>
          <CardDescription>
            Sincroniza datos entre MyAlice.ai y el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sync" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sync">Sincronización</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sync" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  onClick={() => executeSync('full')}
                  disabled={isLoading}
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Sincronización Completa
                </Button>
                <Button
                  onClick={() => executeSync('channels')}
                  disabled={isLoading}
                  variant="outline"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Solo Canales
                </Button>
                <Button
                  onClick={() => executeSync('templates')}
                  disabled={isLoading}
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Solo Plantillas
                </Button>
                <Button
                  onClick={() => executeSync('conversations')}
                  disabled={isLoading}
                  variant="outline"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Solo Conversaciones
                </Button>
              </div>

              {/* Datos de Demostración */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">Datos de Demostración</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={populateDemoData}
                    disabled={isLoading}
                    variant="secondary"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Poblar Datos Demo
                  </Button>
                  <Button
                    onClick={clearDemoData}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Limpiar Datos Demo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Los datos de demostración simulan conversaciones reales de MyAlice.ai para testing
                </p>
              </div>

              {/* Resultados de Sincronización */}
              {syncResults && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Resultado de la última sincronización:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{syncResults.channels} Canales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{syncResults.templates} Plantillas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{syncResults.conversations} Conversaciones</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{syncResults.messages} Mensajes</span>
                    </div>
                  </div>
                  {syncResults.errors && syncResults.errors.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{syncResults.errors.length} errores</span>
                      </div>
                      <details className="mt-1">
                        <summary className="cursor-pointer text-sm">Ver errores</summary>
                        <ul className="mt-2 text-xs text-red-600 space-y-1">
                          {syncResults.errors.map((error: string, index: number) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{syncStats?.channels || 0}</div>
                    <p className="text-xs text-muted-foreground">Canales Sincronizados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{syncStats?.templates || 0}</div>
                    <p className="text-xs text-muted-foreground">Plantillas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{syncStats?.conversations || 0}</div>
                    <p className="text-xs text-muted-foreground">Conversaciones</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{syncStats?.messages || 0}</div>
                    <p className="text-xs text-muted-foreground">Mensajes</p>
                  </CardContent>
                </Card>
              </div>
              
              {syncStats?.lastSync && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Última sincronización: {new Date(syncStats.lastSync).toLocaleString()}</span>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
