
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Zap,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RefreshCw
} from 'lucide-react';

interface MyAliceMetrics {
  total_messages: number;
  total_conversations: number;
  active_conversations: number;
  response_time_avg: number;
  resolution_time_avg: number;
  customer_satisfaction: number;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

interface Channel {
  id: string;
  myaliceId: string;
  name: string;
  type: string;
  status: string;
  messageCount: number;
  conversationCount: number;
}

export function MyAliceDashboard() {
  const [metrics, setMetrics] = useState<MyAliceMetrics | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [selectedChannel]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar métricas
      const metricsParams = selectedChannel !== 'all' ? `?channelId=${selectedChannel}` : '';
      const metricsResponse = await fetch(`/api/myalice/metrics${metricsParams}`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.external_metrics || null);
      }

      // Cargar canales
      const channelsResponse = await fetch('/api/myalice/channels');
      if (channelsResponse.ok) {
        const channelsData = await channelsResponse.json();
        setChannels(channelsData.channels || []);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      toast({
        title: "Error",
        description: "Error al cargar datos de MyAlice.ai",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncChannels = async () => {
    try {
      const response = await fetch('/api/myalice/channels');
      if (response.ok) {
        await loadDashboardData();
        toast({
          title: "Éxito",
          description: "Canales sincronizados correctamente"
        });
      }
    } catch (error) {
      console.error('Error sincronizando canales:', error);
      toast({
        title: "Error",
        description: "Error al sincronizar canales",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getChannelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return <MessageCircle className="h-5 w-5 text-green-600" />;
      case 'telegram': return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'webchat': return <MessageCircle className="h-5 w-5 text-purple-600" />;
      default: return <MessageCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading && !metrics) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Cargando métricas de MyAlice.ai...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard MyAlice.ai</h2>
          <p className="text-gray-600">Monitoreo en tiempo real de conversaciones</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Seleccionar canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los canales</SelectItem>
              {channels.map((channel) => (
                <SelectItem key={channel.id} value={channel.myaliceId}>
                  {channel.name} ({channel.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={syncChannels} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensajes Totales</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_messages.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total de mensajes procesados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_conversations.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.active_conversations} activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo de Respuesta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(metrics.response_time_avg)}</div>
              <p className="text-xs text-muted-foreground">
                Promedio de respuesta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.customer_satisfaction * 100)}%</div>
              <p className="text-xs text-muted-foreground">
                Satisfacción del cliente
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Análisis de sentimiento */}
      {metrics?.sentiment_distribution && (
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Sentimiento</CardTitle>
            <CardDescription>
              Distribución del sentimiento en las conversaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Positivo</p>
                  <p className="text-2xl font-bold text-green-600">
                    {metrics.sentiment_distribution.positive}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium">Neutral</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {metrics.sentiment_distribution.neutral}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Negativo</p>
                  <p className="text-2xl font-bold text-red-600">
                    {metrics.sentiment_distribution.negative}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado de canales */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Canales</CardTitle>
          <CardDescription>
            Estado actual de todos los canales de comunicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {channels.map((channel) => (
              <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getChannelIcon(channel.type)}
                  <div>
                    <p className="font-medium">{channel.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{channel.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{channel.messageCount} mensajes</p>
                    <p className="text-sm text-gray-500">{channel.conversationCount} conversaciones</p>
                  </div>
                  <Badge className={getChannelStatusColor(channel.status)}>
                    {channel.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Información de última actualización */}
      <div className="text-center text-sm text-gray-500">
        Última actualización: {lastUpdate.toLocaleString('es-MX')}
      </div>
    </div>
  );
}
