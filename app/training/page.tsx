
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Plus, Brain, Target, MessageSquare } from 'lucide-react';

export default function TrainingPage() {
  const mockQnA = [
    {
      id: 1,
      question: '¿Cuáles son los métodos de pago disponibles?',
      answer: 'Aceptamos tarjetas de crédito, débito, transferencias bancarias, PayPal y pagos en efectivo en tienda.',
      category: 'Pagos',
      confidence: 0.95,
      lastTrained: '2025-01-20',
      status: 'Activo'
    },
    {
      id: 2,
      question: '¿Cuánto tiempo tarda la entrega?',
      answer: 'El tiempo de entrega varía según la ubicación: CDMX 1-2 días, interior de la república 3-5 días.',
      category: 'Envíos',
      confidence: 0.88,
      lastTrained: '2025-01-19',
      status: 'Entrenando'
    },
    {
      id: 3,
      question: '¿Puedo cambiar o devolver un producto?',
      answer: 'Sí, tienes 30 días para cambios y devoluciones. El producto debe estar en condiciones originales.',
      category: 'Devoluciones',
      confidence: 0.92,
      lastTrained: '2025-01-18',
      status: 'Activo'
    }
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo': return 'bg-green-100 text-green-800';
      case 'Entrenando': return 'bg-yellow-100 text-yellow-800';
      case 'Revisión': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Entrenamiento Q&A
            </h1>
            <p className="text-gray-600">
              Gestiona preguntas y respuestas para mejorar la precisión del agente IA
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Q&A
          </Button>
        </div>

        {/* Métricas de entrenamiento */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Q&A</p>
                  <p className="text-2xl font-bold text-gray-900">245</p>
                </div>
                <HelpCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confianza Prom.</p>
                  <p className="text-2xl font-bold text-green-600">91.5%</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En Entrenamiento</p>
                  <p className="text-2xl font-bold text-yellow-600">12</p>
                </div>
                <Brain className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Activas</p>
                  <p className="text-2xl font-bold text-purple-600">198</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Q&A */}
        <Card>
          <CardHeader>
            <CardTitle>Preguntas y Respuestas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockQnA.map((item) => (
                <div key={item.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant="secondary">{item.category}</Badge>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <span className={`text-sm font-medium ${getConfidenceColor(item.confidence)}`}>
                          Confianza: {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {item.question}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {item.answer}
                      </p>
                      <p className="text-sm text-gray-500">
                        Último entrenamiento: {item.lastTrained}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        Entrenar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
