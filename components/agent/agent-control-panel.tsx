
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Bot, 
  Settings, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AgentStatus {
  enabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  activeRules: number;
  todayMetrics: {
    conversationsHandled: number;
    avgResponseTime: number;
    avgConfidence: number;
    escalationsTriggered: number;
  };
  queueStatus: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  lastCheck: string;
}

interface AgentMetrics {
  period: { days: number; startDate: string; endDate: string };
  dailyMetrics: Record<string, any>;
  today: Record<string, any>;
  conversationStats: {
    totalConversations: number;
    withLLMResponses: number;
    escalated: number;
    resolved: number;
    avgResponseTime: number;
    avgConfidence: number;
    escalationRate: number;
    resolutionRate: number;
  };
  ruleStats: {
    totalExecutions: number;
    successfulExecutions: number;
    successRate: number;
    byRule: Array<{
      ruleId: string;
      ruleName: string;
      category: string;
      success: boolean;
      executions: number;
      avgExecutionTime: number;
    }>;
  };
}

export default function AgentControlPanel() {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    try {
      const [statusRes, metricsRes] = await Promise.all([
        fetch('/api/agent/initialize'),
        fetch('/api/agent/metrics?days=7')
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setAgentStatus(statusData);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setAgentMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error cargando datos del agente:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del agente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeAgent = async () => {
    setInitializing(true);
    try {
      const response = await fetch('/api/agent/initialize', {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Agente Inicializado',
          description: 'El agente LLM ha sido inicializado correctamente',
        });
        await loadAgentData();
      } else {
        toast({
          title: 'Inicialización Parcial',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error inicializando el agente',
        variant: 'destructive'
      });
    } finally {
      setInitializing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAgentData();
    setRefreshing(false);
  };

  const toggleAgent = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/agent/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: { agent_enabled: enabled }
        })
      });

      if (response.ok) {
        toast({
          title: enabled ? 'Agente Habilitado' : 'Agente Deshabilitado',
          description: `El agente LLM ha sido ${enabled ? 'habilitado' : 'deshabilitado'}`,
        });
        await loadAgentData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error actualizando configuración del agente',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando panel de control del agente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles principales */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Panel de Control del Agente LLM</h1>
          <p className="text-muted-foreground">
            Monitorea y controla el comportamiento del agente de ventas autónomo
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={initializeAgent} disabled={initializing}>
            <Settings className={`h-4 w-4 mr-2 ${initializing ? 'animate-spin' : ''}`} />
            {initializing ? 'Inicializando...' : 'Inicializar'}
          </Button>
        </div>
      </div>

      {/* Estado del Agente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Estado del Agente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agentStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Estado</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={agentStatus.enabled ? 'default' : 'secondary'}>
                      {agentStatus.enabled ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Switch
                      checked={agentStatus.enabled}
                      onCheckedChange={toggleAgent}
                    />
                  </div>
                </div>
                <div className="text-right">
                  {agentStatus.enabled ? (
                    <Play className="h-8 w-8 text-green-500" />
                  ) : (
                    <Pause className="h-8 w-8 text-gray-400" />
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Modelo</p>
                <p className="text-lg font-bold">{agentStatus.model}</p>
                <p className="text-xs text-muted-foreground">
                  Temp: {agentStatus.temperature} | Tokens: {agentStatus.maxTokens}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Reglas Activas</p>
                <p className="text-2xl font-bold text-blue-600">{agentStatus.activeRules}</p>
              </div>

              <div>
                <p className="text-sm font-medium">Cola de Mensajes</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline">{agentStatus.queueStatus.pending} Pendientes</Badge>
                  <Badge variant="outline">{agentStatus.queueStatus.processing} Procesando</Badge>
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No se pudo cargar el estado del agente. Intenta inicializar el sistema.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Métricas del Agente */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Hoy</TabsTrigger>
          <TabsTrigger value="conversations">Conversaciones</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {agentStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversaciones Manejadas</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {agentStatus.todayMetrics.conversationsHandled}
                  </div>
                  <p className="text-xs text-muted-foreground">Hoy</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tiempo de Respuesta</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {agentStatus.todayMetrics.avgResponseTime.toFixed(1)}s
                  </div>
                  <p className="text-xs text-muted-foreground">Promedio</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Confianza Promedio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(agentStatus.todayMetrics.avgConfidence * 100).toFixed(1)}%
                  </div>
                  <Progress value={agentStatus.todayMetrics.avgConfidence * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Escalamientos</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {agentStatus.todayMetrics.escalationsTriggered}
                  </div>
                  <p className="text-xs text-muted-foreground">Hoy</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          {agentMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Conversación (7 días)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Total Conversaciones</p>
                      <p className="text-2xl font-bold">{agentMetrics.conversationStats.totalConversations}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Con Respuesta LLM</p>
                      <p className="text-2xl font-bold text-blue-600">{agentMetrics.conversationStats.withLLMResponses}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Tasa de Escalamiento</span>
                      <span className="text-sm font-medium">
                        {(agentMetrics.conversationStats.escalationRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={agentMetrics.conversationStats.escalationRate * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Tasa de Resolución</span>
                      <span className="text-sm font-medium">
                        {(agentMetrics.conversationStats.resolutionRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={agentMetrics.conversationStats.resolutionRate * 100} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento del Agente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Tiempo de Respuesta Promedio</p>
                    <p className="text-3xl font-bold text-green-600">
                      {agentMetrics.conversationStats.avgResponseTime.toFixed(2)}s
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm font-medium">Confianza Promedio</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {(agentMetrics.conversationStats.avgConfidence * 100).toFixed(1)}%
                    </p>
                    <Progress value={agentMetrics.conversationStats.avgConfidence * 100} className="mt-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          {agentMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Reglas de Negocio</CardTitle>
                <CardDescription>
                  Ejecuciones de reglas en los últimos 7 días
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{agentMetrics.ruleStats.totalExecutions}</p>
                    <p className="text-sm text-muted-foreground">Total Ejecuciones</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{agentMetrics.ruleStats.successfulExecutions}</p>
                    <p className="text-sm text-muted-foreground">Exitosas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {(agentMetrics.ruleStats.successRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Reglas Más Ejecutadas</h4>
                  {agentMetrics.ruleStats.byRule.slice(0, 5).map((rule, index) => (
                    <div key={rule.ruleId} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{rule.ruleName}</p>
                        <p className="text-xs text-muted-foreground">{rule.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{rule.executions} ejecuciones</p>
                        <div className="flex items-center gap-1">
                          {rule.success ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span className="text-xs">{rule.avgExecutionTime}ms</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {agentStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Estado de la Cola de Procesamiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-orange-600">{agentStatus.queueStatus.pending}</p>
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-blue-600">{agentStatus.queueStatus.processing}</p>
                    <p className="text-sm text-muted-foreground">Procesando</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-green-600">{agentStatus.queueStatus.completed}</p>
                    <p className="text-sm text-muted-foreground">Completados</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-red-600">{agentStatus.queueStatus.failed}</p>
                    <p className="text-sm text-muted-foreground">Fallidos</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Última verificación: {new Date(agentStatus.lastCheck).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
