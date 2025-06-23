
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  User, 
  Bot, 
  Clock, 
  Send,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';

interface LiveMessage {
  id: string;
  conversationId: string;
  content: string;
  direction: 'inbound' | 'outbound';
  messageType: string;
  timestamp: string;
  customer: {
    name?: string;
    email?: string;
    phone?: string;
  };
  channel: {
    name: string;
    type: string;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  processedByLLM: boolean;
}

interface LiveConversation {
  id: string;
  customer: {
    name?: string;
    email?: string;
    phone?: string;
  };
  channel: {
    name: string;
    type: string;
  };
  status: string;
  priority: string;
  humanTookOver: boolean;
  lastMessage: string;
  messageCount: number;
  updatedAt: string;
}

export function ConversationMonitor() {
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [activeConversations, setActiveConversations] = useState<LiveConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simular conexión en tiempo real
    // En una implementación real, esto sería WebSocket o Server-Sent Events
    const interval = setInterval(fetchLiveData, 5000);
    setIsConnected(true);
    
    fetchLiveData();
    
    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, []);

  const fetchLiveData = async () => {
    try {
      // Obtener mensajes recientes
      const messagesResponse = await fetch('/api/conversations/live-messages');
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setLiveMessages(messagesData.messages || []);
      }

      // Obtener conversaciones activas
      const conversationsResponse = await fetch('/api/conversations?status=active&limit=10');
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        setActiveConversations(conversationsData.conversations || []);
      }
    } catch (error) {
      console.error('Error obteniendo datos en tiempo real:', error);
      setIsConnected(false);
    }
  };

  const sendQuickMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const conversation = activeConversations.find(c => c.id === selectedConversation);
      if (!conversation) return;

      const response = await fetch('/api/myalice/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: conversation.channel.name, // Esto debería ser el ID real del canal
          to: conversation.customer.phone,
          message: newMessage,
          type: 'text',
          conversationId: selectedConversation
        })
      });

      if (response.ok) {
        setNewMessage('');
        toast({
          title: "Mensaje enviado",
          description: "El mensaje se envió correctamente"
        });
        fetchLiveData(); // Actualizar datos
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'escalated': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-400';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Ahora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('es-MX');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Panel de conversaciones activas */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Conversaciones Activas</CardTitle>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">En vivo</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-red-600">Desconectado</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[480px]">
            <div className="space-y-3">
              {activeConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedConversation === conversation.id 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {conversation.customer.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conversation.customer.name || 'Cliente'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {conversation.channel.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusIcon(conversation.status)}
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-600 truncate flex-1">
                      {conversation.lastMessage}
                    </p>
                    <div className="flex items-center gap-2">
                      {conversation.humanTookOver ? (
                        <User className="h-3 w-3 text-blue-500" />
                      ) : (
                        <Bot className="h-3 w-3 text-gray-400" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {conversation.messageCount}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Panel de mensajes en tiempo real */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Mensajes en Tiempo Real</CardTitle>
          <CardDescription>
            Flujo de mensajes de todas las conversaciones activas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] mb-4">
            <div className="space-y-3">
              {liveMessages.map((message) => (
                <div key={message.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.direction === 'inbound' 
                        ? (message.customer.name?.charAt(0) || 'U')
                        : 'B'
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {message.direction === 'inbound' 
                          ? (message.customer.name || 'Cliente')
                          : 'Bot'
                        }
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {message.channel.name}
                      </Badge>
                      {message.sentiment && (
                        <span className={`text-xs ${getSentimentColor(message.sentiment)}`}>
                          {message.sentiment}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{message.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {message.processedByLLM && (
                        <Badge variant="outline" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          LLM
                        </Badge>
                      )}
                      {message.messageType !== 'text' && (
                        <Badge variant="outline" className="text-xs">
                          {message.messageType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Panel de respuesta rápida */}
          {selectedConversation && (
            <div className="border-t pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Escribir respuesta rápida..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendQuickMessage()}
                />
                <Button onClick={sendQuickMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
