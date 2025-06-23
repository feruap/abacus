
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SyncConversationsButton from './sync-conversations-button';
import { 
  MessageSquare, 
  User, 
  Clock, 
  Search, 
  Phone,
  Mail,
  Calendar,
  Plus,
  ExternalLink,
  Package,
  Ticket,
  Settings,
  Send,
  Bot,
  RefreshCw,
  Circle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  status: string;
  lastMessage: string;
  lastMessageAt: string;
  channel: string;
  messageCount: number;
}

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  sentAt: string;
  processedByLLM: boolean;
}

interface CustomerDetails {
  id: string;
  name: string;
  email?: string;
  phone: string;
  registeredAt?: string;
  avatar?: string;
  totalOrders: number;
  totalSpent: number;
  attributes: Array<{
    id: string;
    key: string;
    value: string;
    type: string;
    isDefault: boolean;
  }>;
  tickets: Array<{
    id: string;
    number: string;
    subject?: string;
    status: string;
    createdAt: string;
    resolvedAt?: string;
  }>;
  orders: Array<{
    id: string;
    number: string;
    total: number;
    currency: string;
    status: string;
    placedAt: string;
  }>;
}

export function MyAliceDashboardReplica() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newAttribute, setNewAttribute] = useState({ key: '', value: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadConversationDetails(selectedConversation);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/conversations');
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.conversations || []);
        // Auto-select first conversation if none selected
        if (!selectedConversation && data.conversations?.length > 0) {
          setSelectedConversation(data.conversations[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Error cargando conversaciones",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationDetails = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.conversation.messages || []);
        setCustomerDetails(data.conversation.customer);
      }
    } catch (error) {
      console.error('Error loading conversation details:', error);
    }
  };

  const addCustomerAttribute = async () => {
    if (!customerDetails || !newAttribute.key || !newAttribute.value) return;

    try {
      const response = await fetch(`/api/customers/${customerDetails.id}/attributes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAttribute)
      });

      const data = await response.json();
      
      if (data.success) {
        setCustomerDetails(prev => prev ? {
          ...prev,
          attributes: [...prev.attributes, data.attribute]
        } : null);
        setNewAttribute({ key: '', value: '' });
        toast({
          title: "Atributo agregado",
          description: "El atributo se agregó correctamente"
        });
      }
    } catch (error) {
      console.error('Error adding attribute:', error);
      toast({
        title: "Error",
        description: "Error agregando atributo",
        variant: "destructive"
      });
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.customer.phone.includes(searchTerm) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-gray-100 text-gray-800',
      'escalated': 'bg-red-100 text-red-800',
      'open': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando conversaciones...</span>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] gap-4">
      {/* Panel Izquierdo - Lista de Conversaciones */}
      <div className="w-80 flex flex-col">
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversaciones
                <Badge variant="secondary">
                  {filteredConversations.length}
                </Badge>
              </CardTitle>
              <SyncConversationsButton onSyncComplete={loadConversations} />
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedConversation === conversation.id && "border-primary bg-muted"
                  )}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {conversation.customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">
                          {conversation.customer.name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conversation.customer.phone}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className={getStatusColor(conversation.status)}>
                          {conversation.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          {conversation.messageCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Panel Central - Conversación Activa */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1">
          {selectedConversation && customerDetails ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={customerDetails.avatar} />
                    <AvatarFallback>
                      {customerDetails.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{customerDetails.name}</h3>
                    <p className="text-sm text-muted-foreground">{customerDetails.phone}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                    <span className="text-sm text-muted-foreground">En línea</span>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.direction === 'outbound' && "flex-row-reverse"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        {message.direction === 'inbound' ? (
                          <AvatarFallback>
                            {customerDetails.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        ) : (
                          <AvatarFallback>
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg p-3",
                          message.direction === 'inbound' 
                            ? "bg-muted" 
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={cn(
                          "text-xs mt-1 flex items-center gap-1",
                          message.direction === 'inbound' 
                            ? "text-muted-foreground" 
                            : "text-primary-foreground/70"
                        )}>
                          <Clock className="h-3 w-3" />
                          {formatTime(message.sentAt)}
                          {message.processedByLLM && (
                            <Badge variant="secondary" className="ml-1 h-4 text-xs">
                              IA
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Separator />
              <div className="p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribe un mensaje..."
                    className="flex-1"
                  />
                  <Button size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecciona una conversación</h3>
                <p className="text-muted-foreground">
                  Elige una conversación del panel izquierdo para ver los detalles
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Panel Derecho - Información del Cliente */}
      <div className="w-80 flex flex-col gap-4">
        {customerDetails ? (
          <>
            {/* Customer Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={customerDetails.avatar} />
                    <AvatarFallback>
                      {customerDetails.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{customerDetails.name}</h4>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {customerDetails.phone}
                  </div>
                  {customerDetails.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {customerDetails.email}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Customer since {customerDetails.registeredAt ? 
                      new Date(customerDetails.registeredAt).toLocaleDateString() : 
                      'N/A'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Attributes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Customer Attributes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32 mb-3">
                  <div className="space-y-2">
                    {customerDetails.attributes.map((attr) => (
                      <div key={attr.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm font-medium">{attr.key}</span>
                        <span className="text-sm text-muted-foreground">
                          {attr.type === 'boolean' ? (attr.value === 'true' ? '✓' : '✗') : attr.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Separator className="my-3" />
                <div className="space-y-2">
                  <Input
                    placeholder="Attribute name"
                    value={newAttribute.key}
                    onChange={(e) => setNewAttribute(prev => ({ ...prev, key: e.target.value }))}
                  />
                  <Input
                    placeholder="Attribute value"
                    value={newAttribute.value}
                    onChange={(e) => setNewAttribute(prev => ({ ...prev, value: e.target.value }))}
                  />
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={addCustomerAttribute}
                    disabled={!newAttribute.key || !newAttribute.value}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add new attribute
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Ticket History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Ticket History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {customerDetails.tickets.map((ticket) => (
                      <div key={ticket.id} className="p-2 border rounded hover:bg-muted/50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{ticket.number}</span>
                          <Badge variant="outline" className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {ticket.subject || 'Sin asunto'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Order History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {customerDetails.orders.map((order) => (
                      <div key={order.id} className="p-2 border rounded hover:bg-muted/50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{order.number}</span>
                          <span className="text-sm font-semibold">
                            ${order.total.toFixed(2)} {order.currency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.placedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="flex-1">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Sin cliente seleccionado</h3>
                <p className="text-muted-foreground">
                  Selecciona una conversación para ver la información del cliente
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
