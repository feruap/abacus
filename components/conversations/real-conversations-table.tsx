
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  MessageSquare, 
  User, 
  Clock, 
  Search, 
  Filter,
  Eye,
  UserCheck,
  UserX,
  Phone,
  Mail,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  status: string;
  assignedAgent?: string;
  lastMessage: string;
  lastMessageAt: string;
  channel: string;
  sentiment: string;
  metadata?: {
    channel_id?: string;
    agent_id?: string;
    tags?: string[];
  };
}

export function RealConversationsTable() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [channels, setChannels] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchTerm, statusFilter, channelFilter]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/conversations');
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.conversations || []);
        
        // Extraer canales únicos
        const uniqueChannels = Array.from(new Set(data.conversations?.map((c: Conversation) => c.channel).filter(Boolean))) as string[];
        setChannels(uniqueChannels);
      } else {
        toast({
          title: "Error cargando conversaciones",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
      toast({
        title: "Error cargando conversaciones",
        description: "Error de conexión",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterConversations = () => {
    let filtered = conversations;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(conv => 
        conv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.customer.phone.includes(searchTerm) ||
        conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    // Filtro por canal
    if (channelFilter !== 'all') {
      filtered = filtered.filter(conv => conv.channel === channelFilter);
    }

    setFilteredConversations(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'active': { variant: 'default', label: 'Activa' },
      'pending': { variant: 'secondary', label: 'Pendiente' },
      'assigned': { variant: 'default', label: 'Asignada' },
      'resolved': { variant: 'outline', label: 'Resuelta' },
      'escalated': { variant: 'destructive', label: 'Escalada' }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { variant: 'secondary', label: status };
    
    return (
      <Badge variant={statusInfo.variant as any}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getSentimentBadge = (sentiment: string) => {
    const sentimentMap = {
      'positive': { variant: 'default', label: 'Positivo', color: 'text-green-600' },
      'neutral': { variant: 'secondary', label: 'Neutral', color: 'text-gray-600' },
      'negative': { variant: 'destructive', label: 'Negativo', color: 'text-red-600' }
    };

    const sentimentInfo = sentimentMap[sentiment as keyof typeof sentimentMap] || { variant: 'secondary', label: sentiment, color: 'text-gray-600' };
    
    return (
      <span className={`text-sm ${sentimentInfo.color}`}>
        {sentimentInfo.label}
      </span>
    );
  };

  const takeConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'take' })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Conversación tomada",
          description: "Has tomado control de esta conversación",
        });
        await loadConversations(); // Recargar conversaciones
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error tomando conversación:', error);
      toast({
        title: "Error",
        description: "Error al tomar la conversación",
        variant: "destructive"
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Ahora';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando conversaciones...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversaciones Activas
          <Badge variant="secondary">{filteredConversations.length}</Badge>
        </CardTitle>
        <CardDescription>
          Conversaciones sincronizadas desde MyAlice.ai
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Controles de Filtro */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, teléfono o mensaje..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Estados</SelectItem>
              <SelectItem value="active">Activa</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="assigned">Asignada</SelectItem>
              <SelectItem value="resolved">Resuelta</SelectItem>
              <SelectItem value="escalated">Escalada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Canales</SelectItem>
              {channels.map(channel => (
                <SelectItem key={channel} value={channel}>
                  {channel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={loadConversations}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Tabla de Conversaciones */}
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay conversaciones</h3>
            <p className="text-muted-foreground">
              {conversations.length === 0 
                ? "No se han sincronizado conversaciones aún. Usa el panel de sincronización."
                : "No hay conversaciones que coincidan con los filtros seleccionados."
              }
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead>Último Mensaje</TableHead>
                  <TableHead>Sentimiento</TableHead>
                  <TableHead>Tiempo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.map((conversation) => (
                  <TableRow key={conversation.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{conversation.customer.name}</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {conversation.customer.phone}
                        </div>
                        {conversation.customer.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {conversation.customer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {conversation.channel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(conversation.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {conversation.assignedAgent ? (
                          <>
                            <UserCheck className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{conversation.assignedAgent}</span>
                          </>
                        ) : (
                          <>
                            <UserX className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Sin asignar</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm">
                        {conversation.lastMessage}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSentimentBadge(conversation.sentiment)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(conversation.lastMessageAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {/* Ver detalles */}}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!conversation.assignedAgent && (
                          <Button
                            size="sm"
                            onClick={() => takeConversation(conversation.id)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Tomar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
