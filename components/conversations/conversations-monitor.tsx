
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  User, 
  Clock, 
  ArrowRight,
  Bot,
  AlertCircle
} from 'lucide-react';

interface ActiveConversation {
  id: string;
  customer: {
    name?: string;
    email?: string;
    phone?: string;
  };
  lastMessage: string;
  status: string;
  priority: string;
  channel: string;
  responseTime: number;
  isHuman: boolean;
  updatedAt: Date;
}

export function ConversationsMonitor() {
  const [activeConversations, setActiveConversations] = useState<ActiveConversation[]>([]);

  useEffect(() => {
    // Fetch initial data
    fetchActiveConversations();

    // Set up real-time updates (WebSocket in production)
    const interval = setInterval(fetchActiveConversations, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchActiveConversations = async () => {
    try {
      const response = await fetch('/api/conversations/active');
      const data = await response.json();
      setActiveConversations(data);
    } catch (error) {
      console.error('Error fetching active conversations:', error);
    }
  };

  const handleTakeOver = async (conversationId: string) => {
    try {
      await fetch(`/api/conversations/${conversationId}/takeover`, {
        method: 'POST'
      });
      fetchActiveConversations();
    } catch (error) {
      console.error('Error taking over conversation:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Activas</p>
                <p className="text-2xl font-bold">{activeConversations.length}</p>
              </div>
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Con Agente IA</p>
                <p className="text-2xl font-bold">
                  {activeConversations.filter(c => !c.isHuman).length}
                </p>
              </div>
              <Bot className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Requieren Atención</p>
                <p className="text-2xl font-bold text-red-600">
                  {activeConversations.filter(c => c.priority === 'urgent').length}
                </p>
              </div>
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle>Conversaciones en Tiempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {activeConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {conversation.customer.name?.charAt(0) || 
                           conversation.customer.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div 
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getPriorityColor(conversation.priority)}`}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm">
                          {conversation.customer.name || conversation.customer.email || 'Cliente Anónimo'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {conversation.channel}
                        </Badge>
                        {conversation.isHuman ? (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <User className="w-3 h-3 mr-1" />
                            Humano
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Bot className="w-3 h-3 mr-1" />
                            IA
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Respuesta en {conversation.responseTime}s
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!conversation.isHuman && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTakeOver(conversation.id)}
                      >
                        <User className="h-4 w-4 mr-1" />
                        Intervenir
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {activeConversations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay conversaciones activas en este momento</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
