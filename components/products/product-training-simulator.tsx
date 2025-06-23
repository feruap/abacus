
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  RotateCcw, 
  Play, 
  Pause,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  productMentioned?: string;
  intent?: string;
  confidence?: number;
}

interface SimulationSession {
  id: string;
  title: string;
  status: 'active' | 'paused' | 'completed';
  messages: Message[];
  startedAt: Date;
  productsFocused: string[];
  metrics: {
    responseTime: number;
    accuracy: number;
    customerSatisfaction: number;
  };
}

export function ProductTrainingSimulator() {
  const [currentSession, setCurrentSession] = useState<SimulationSession | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<SimulationSession[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  useEffect(() => {
    loadSessionHistory();
  }, []);

  const loadSessionHistory = async () => {
    try {
      const response = await fetch('/api/products/training-sessions');
      if (response.ok) {
        const data = await response.json();
        setSessionHistory(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading session history:', error);
    }
  };

  const startNewSession = async () => {
    const newSession: SimulationSession = {
      id: `session_${Date.now()}`,
      title: `Sesión de Entrenamiento - ${new Date().toLocaleDateString()}`,
      status: 'active',
      messages: [{
        id: '1',
        content: '¡Hola! Bienvenido a Amunet, tu especialista en productos médicos. Soy tu asistente virtual y estoy aquí para ayudarte a encontrar exactamente lo que necesitas. ¿En qué puedo asistirte hoy?',
        sender: 'ai',
        timestamp: new Date(),
        intent: 'greeting',
        confidence: 0.95
      }],
      startedAt: new Date(),
      productsFocused: [],
      metrics: {
        responseTime: 0,
        accuracy: 0,
        customerSatisfaction: 0
      }
    };

    setCurrentSession(newSession);
    
    try {
      await fetch('/api/products/training-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      });
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    // Agregar mensaje del usuario
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage]
    };
    setCurrentSession(updatedSession);
    setInputMessage('');
    setIsAiTyping(true);

    // Simular respuesta del AI
    try {
      const response = await fetch('/api/agent/simulate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: currentSession.id,
          context: {
            previousMessages: currentSession.messages.slice(-5),
            selectedProduct: selectedProduct
          }
        })
      });

      if (response.ok) {
        const aiResponse = await response.json();
        
        const aiMessage: Message = {
          id: `msg_${Date.now() + 1}`,
          content: aiResponse.response,
          sender: 'ai',
          timestamp: new Date(),
          productMentioned: aiResponse.productMentioned,
          intent: aiResponse.intent,
          confidence: aiResponse.confidence
        };

        setCurrentSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, aiMessage],
          productsFocused: aiResponse.productMentioned ? 
            Array.from(new Set([...prev.productsFocused, aiResponse.productMentioned])) : 
            prev.productsFocused
        } : null);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Error al obtener respuesta del AI",
        variant: "destructive"
      });
    } finally {
      setIsAiTyping(false);
    }
  };

  const pauseSession = () => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        status: 'paused'
      });
    }
  };

  const resumeSession = () => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        status: 'active'
      });
    }
  };

  const endSession = async () => {
    if (!currentSession) return;

    const completedSession = {
      ...currentSession,
      status: 'completed' as const
    };

    setCurrentSession(null);
    setSessionHistory(prev => [completedSession, ...prev]);

    try {
      await fetch(`/api/products/training-sessions/${currentSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completedSession)
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel de Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Control del Simulador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentSession ? (
            <Button onClick={startNewSession} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              Iniciar Nueva Sesión
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado:</span>
                <Badge variant={currentSession.status === 'active' ? 'default' : 'secondary'}>
                  {currentSession.status}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                {currentSession.status === 'active' ? (
                  <Button onClick={pauseSession} variant="outline" size="sm">
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                ) : (
                  <Button onClick={resumeSession} variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Reanudar
                  </Button>
                )}
                
                <Button onClick={endSession} variant="destructive" size="sm">
                  Finalizar
                </Button>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Productos Mencionados:</span>
                <div className="flex flex-wrap gap-1">
                  {currentSession.productsFocused.map((product, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Métricas:</span>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Mensajes:</span>
                    <span>{currentSession.messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duración:</span>
                    <span>{Math.round((Date.now() - currentSession.startedAt.getTime()) / 60000)} min</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Simulator */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Simulador de Conversación
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentSession ? (
            <div className="space-y-4">
              <ScrollArea className="h-96 border rounded-lg p-4">
                <div className="space-y-4">
                  {currentSession.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`flex gap-2 max-w-[80%] ${
                          message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          ${message.sender === 'user' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-purple-100 text-purple-600'
                          }
                        `}>
                          {message.sender === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        
                        <div className={`
                          rounded-lg p-3 
                          ${message.sender === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                          }
                        `}>
                          <p className="text-sm">{message.content}</p>
                          
                          {message.sender === 'ai' && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {message.intent && (
                                <Badge variant="secondary" className="text-xs">
                                  Intent: {message.intent}
                                </Badge>
                              )}
                              {message.confidence && (
                                <Badge variant="outline" className="text-xs">
                                  Confianza: {Math.round(message.confidence * 100)}%
                                </Badge>
                              )}
                              {message.productMentioned && (
                                <Badge variant="default" className="text-xs">
                                  Producto: {message.productMentioned}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="mt-1 text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isAiTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder="Escribe tu mensaje como cliente..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={currentSession.status !== 'active' || isAiTyping}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || currentSession.status !== 'active' || isAiTyping}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-center text-gray-500">
              <div>
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Inicia una nueva sesión para comenzar a entrenar</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Sesiones */}
      {sessionHistory.length > 0 && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historial de Sesiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionHistory.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{session.title}</span>
                      <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {session.messages.length} mensajes • {session.productsFocused.length} productos
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {session.startedAt.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
