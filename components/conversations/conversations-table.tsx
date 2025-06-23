'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  MessageCircle, 
  Clock, 
  User, 
  PhoneCall, 
  Bot, 
  UserCheck, 
  MessageSquare, 
  Zap, 
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Send,
  Play,
  Pause,
  X,
  AlertTriangle
} from 'lucide-react';

interface ConversationData {
  id: string;
  myaliceTicketId?: string;
  customer: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  channel: {
    id: string;
    name: string;
    type: string;
  };
  status: string;
  priority: string;
  subject?: string;
  messageCount: number;
  humanTookOver: boolean;
  assignedTo?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  lastMessage: string;
  startedAt: string;
  responseTime?: number;
}

export function ConversationsTable() {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [agentTypeFilter, setAgentTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ConversationData | null>(null);
  const [controlDialogOpen, setControlDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [controlAction, setControlAction] = useState<string>('');
  const [controlReason, setControlReason] = useState('');
  const { toast } = useToast();

  // Cargar conversaciones
  useEffect(() => {
    loadConversations();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        throw new Error('Error al cargar conversaciones');
      }
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
      toast({
        title: "Error",
        description: "Error al cargar conversaciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtros
  useEffect(() => {
    let filtered = conversations;

    if (searchTerm) {
      filtered = filtered.filter(conv =>
        conv.customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    if (channelFilter !== 'all') {
      filtered = filtered.filter(conv => conv.channel.type === channelFilter);
    }

    if (sentimentFilter !== 'all') {
      filtered = filtered.filter(conv => conv.sentiment === sentimentFilter);
    }

    if (agentTypeFilter !== 'all') {
      if (agentTypeFilter === 'human') {
        filtered = filtered.filter(conv => conv.humanTookOver);
      } else if (agentTypeFilter === 'ai') {
        filtered = filtered.filter(conv => !conv.humanTookOver);
      }
    }

    setFilteredConversations(filtered);
  }, [conversations, searchTerm, statusFilter, channelFilter, sentimentFilter, agentTypeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-gray-100 text-gray-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'neutral': return <Minus className="h-4 w-4 text-gray-600" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleConversationControl = async (action: string) => {
    if (!selectedConversation) return;

    try {
      const response = await fetch('/api/myalice/conversation-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          conversationId: selectedConversation.id,
          reason: controlReason
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Éxito",
          description: `Acción ${action} ejecutada correctamente`
        });
        setControlDialogOpen(false);
        setControlReason('');
        loadConversations(); // Recargar conversaciones
      } else {
        throw new Error('Error en la operación');
      }
    } catch (error) {
      console.error('Error en control de conversación:', error);
      toast({
        title: "Error",
        description: "Error al ejecutar la acción",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const response = await fetch('/api/myalice/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: selectedConversation.channel.id,
          to: selectedConversation.customer.phone,
          message: newMessage,
          type: 'text',
          conversationId: selectedConversation.id
        })
      });

      if (response.ok) {
        toast({
          title: "Mensaje enviado",
          description: "El mensaje se envió correctamente"
        });
        setMessageDialogOpen(false);
        setNewMessage('');
        loadConversations();
      } else {
        throw new Error('Error al enviar mensaje');
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      toast({
        title: "Error",
        description: "Error al enviar el mensaje",
        variant: "destructive"
      });
    }
  };

  const openControlDialog = (conversation: ConversationData, action: string) => {
    setSelectedConversation(conversation);
    setControlAction(action);
    setControlDialogOpen(true);
  };

  const openMessageDialog = (conversation: ConversationData) => {
    setSelectedConversation(conversation);
    setMessageDialogOpen(true);
  };

  const columns = [
    {
      key: 'customer',
      title: 'Cliente',
      render: (_: any, row: ConversationData) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.customer.name || 'Sin nombre'}</span>
          <span className="text-sm text-gray-500">{row.customer.email}</span>
          <span className="text-sm text-gray-500">{row.customer.phone}</span>
        </div>
      )
    },
    {
      key: 'channel',
      title: 'Canal',
      render: (_: any, row: ConversationData) => (
        <div className="flex items-center gap-2">
          {row.channel.type === 'whatsapp' && <MessageCircle className="h-4 w-4 text-green-600" />}
          {row.channel.type === 'webchat' && <Eye className="h-4 w-4 text-blue-600" />}
          {row.channel.type === 'telegram' && <MessageSquare className="h-4 w-4 text-blue-500" />}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{row.channel.name}</span>
            <span className="text-xs text-gray-500 capitalize">{row.channel.type}</span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Estado',
      render: (_: any, row: ConversationData) => (
        <div className="flex flex-col gap-1">
          <Badge className={getStatusColor(row.status)}>
            {row.status}
          </Badge>
          <div className="flex items-center gap-1">
            {row.humanTookOver ? (
              <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                <User className="h-3 w-3 mr-1" />
                Agente Humano
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                <Bot className="h-3 w-3 mr-1" />
                Agente IA
              </Badge>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'priority',
      title: 'Prioridad',
      render: (_: any, row: ConversationData) => (
        <Badge className={getPriorityColor(row.priority)}>
          {row.priority}
        </Badge>
      )
    },
    {
      key: 'sentiment',
      title: 'Sentimiento',
      render: (_: any, row: ConversationData) => (
        <div className="flex items-center gap-1">
          {getSentimentIcon(row.sentiment)}
          <span className="text-sm capitalize">{row.sentiment || 'N/A'}</span>
          {row.sentimentScore && (
            <span className="text-xs text-gray-500">
              ({row.sentimentScore.toFixed(2)})
            </span>
          )}
        </div>
      )
    },
    {
      key: 'subject',
      title: 'Asunto',
      render: (_: any, row: ConversationData) => (
        <div className="max-w-xs truncate" title={row.subject}>
          {row.subject || 'Sin asunto'}
        </div>
      )
    },
    {
      key: 'messageCount',
      title: 'Mensajes',
      render: (_: any, row: ConversationData) => (
        <div className="flex items-center gap-1">
          <MessageCircle className="h-4 w-4 text-gray-400" />
          <span>{row.messageCount}</span>
        </div>
      )
    },
    {
      key: 'assignedTo',
      title: 'Asignado',
      render: (_: any, row: ConversationData) => (
        <div className="flex items-center gap-1">
          {row.humanTookOver ? <User className="h-4 w-4 text-blue-500" /> : <Bot className="h-4 w-4 text-gray-400" />}
          <span className="text-sm">{row.assignedTo || 'Bot'}</span>
        </div>
      )
    },
    {
      key: 'lastMessage',
      title: 'Último mensaje',
      render: (_: any, row: ConversationData) => (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>{row.lastMessage}</span>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Acciones',
      render: (_: any, row: ConversationData) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => openMessageDialog(row)}
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => openControlDialog(row, row.humanTookOver ? 'release_control' : 'take_control')}
          >
            {row.humanTookOver ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => openControlDialog(row, 'escalate')}
          >
            <AlertTriangle className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Cargando conversaciones...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Conversaciones MyAlice.ai</CardTitle>
              <CardDescription>
                Gestiona todas las conversaciones de clientes en tiempo real
              </CardDescription>
            </div>
            <Button onClick={loadConversations} variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Buscar por cliente, email o asunto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="resolved">Resuelta</SelectItem>
                <SelectItem value="escalated">Escalada</SelectItem>
                <SelectItem value="closed">Cerrada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los canales</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="webchat">Web Chat</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sentimiento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="positive">Positivo</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agentTypeFilter} onValueChange={setAgentTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo de Agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Agentes</SelectItem>
                <SelectItem value="human">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Agentes Humanos
                  </div>
                </SelectItem>
                <SelectItem value="ai">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-purple-600" />
                    Agentes IA
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            data={filteredConversations}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Dialog para control de conversación */}
      <Dialog open={controlDialogOpen} onOpenChange={setControlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Control de Conversación</DialogTitle>
            <DialogDescription>
              {controlAction === 'take_control' && 'Tomar control manual de la conversación'}
              {controlAction === 'release_control' && 'Liberar control y devolver al bot'}
              {controlAction === 'escalate' && 'Escalar conversación a supervisión'}
              {controlAction === 'close' && 'Cerrar conversación'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Razón (opcional)</label>
              <Textarea
                placeholder="Describe la razón de esta acción..."
                value={controlReason}
                onChange={(e) => setControlReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setControlDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => handleConversationControl(controlAction)}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para enviar mensaje */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Mensaje</DialogTitle>
            <DialogDescription>
              Enviar mensaje manual a {selectedConversation?.customer.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mensaje</label>
              <Textarea
                placeholder="Escribe tu mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}