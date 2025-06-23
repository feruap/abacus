
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  TestTube, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Zap,
  MessageSquare
} from 'lucide-react';

interface TestResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  confidence: number;
  executionTime: number;
  actions: any[];
  reason: string;
}

export function RuleTestPanel() {
  const [testMessage, setTestMessage] = useState('');
  const [selectedRule, setSelectedRule] = useState('all');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [testScenario, setTestScenario] = useState('');
  const { toast } = useToast();

  const predefinedScenarios = [
    {
      id: 'greeting',
      title: 'Saludo de Cliente',
      message: 'Hola, buenos días. Necesito información sobre productos médicos.'
    },
    {
      id: 'urgent',
      title: 'Consulta Urgente',
      message: 'Urgente! Necesito un termómetro para una emergencia médica crítica.'
    },
    {
      id: 'price_inquiry',
      title: 'Consulta de Precio',
      message: '¿Cuánto cuesta un oxímetro? Necesito saber el precio.'
    },
    {
      id: 'bulk_order',
      title: 'Pedido al Mayoreo',
      message: 'Hola, necesito comprar varios termómetros en cantidad para mi clínica.'
    },
    {
      id: 'complaint',
      title: 'Queja de Cliente',
      message: 'Estoy muy molesto con el servicio, esto es terrible y pésimo.'
    },
    {
      id: 'catalog_request',
      title: 'Solicitud de Catálogo',
      message: '¿Podrían mostrarme su catálogo de productos? ¿Qué tienen disponible?'
    }
  ];

  const runTest = async () => {
    if (!testMessage.trim()) {
      toast({
        title: "Mensaje requerido",
        description: "Por favor ingresa un mensaje para probar",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setTestResults([]);

    try {
      const response = await fetch('/api/rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          ruleFilter: selectedRule === 'all' ? null : selectedRule,
          context: {
            customerSegment: 'new',
            previousMessages: [],
            sessionId: 'test_session'
          }
        })
      });

      if (response.ok) {
        const results = await response.json();
        setTestResults(results.testResults || []);
        
        if (results.testResults && results.testResults.length > 0) {
          const matchedRules = results.testResults.filter((r: TestResult) => r.matched);
          toast({
            title: "Prueba completada",
            description: `${matchedRules.length} regla(s) coincidieron con el mensaje`
          });
        } else {
          toast({
            title: "Sin coincidencias",
            description: "Ninguna regla coincidió con el mensaje de prueba"
          });
        }
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error testing rules:', error);
      toast({
        title: "Error",
        description: "Error al probar las reglas",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const loadScenario = (scenario: any) => {
    setTestMessage(scenario.message);
    setTestScenario(scenario.title);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panel de Prueba */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Panel de Prueba de Reglas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Escenarios Predefinidos */}
          <div>
            <label className="text-sm font-medium">Escenarios de Prueba</label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {predefinedScenarios.map((scenario) => (
                <Button
                  key={scenario.id}
                  variant="outline"
                  size="sm"
                  onClick={() => loadScenario(scenario)}
                  className="justify-start"
                >
                  <MessageSquare className="h-3 w-3 mr-2" />
                  {scenario.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Mensaje de Prueba */}
          <div>
            <label className="text-sm font-medium">Mensaje de Prueba</label>
            <Textarea
              placeholder="Escribe un mensaje para probar contra las reglas..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={4}
            />
            {testScenario && (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">
                  Escenario: {testScenario}
                </Badge>
              </div>
            )}
          </div>

          {/* Filtro de Reglas */}
          <div>
            <label className="text-sm font-medium">Filtrar por Regla</label>
            <Select value={selectedRule} onValueChange={setSelectedRule}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar regla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Reglas</SelectItem>
                <SelectItem value="escalation">Solo Escalamiento</SelectItem>
                <SelectItem value="discount">Solo Descuentos</SelectItem>
                <SelectItem value="response">Solo Respuestas</SelectItem>
                <SelectItem value="inventory">Solo Inventario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botón de Prueba */}
          <Button 
            onClick={runTest} 
            disabled={!testMessage.trim() || testing}
            className="w-full"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Probando Reglas...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Ejecutar Prueba
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Resultados de la Prueba
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ejecuta una prueba para ver los resultados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 border rounded-lg ${
                    result.matched 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.matched ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium text-sm">{result.ruleName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.matched ? "default" : "secondary"}>
                        {Math.round(result.confidence * 100)}%
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {result.executionTime}ms
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">{result.reason}</p>
                  
                  {result.matched && result.actions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Acciones:</p>
                      <div className="flex flex-wrap gap-1">
                        {result.actions.map((action, actionIndex) => (
                          <Badge key={actionIndex} variant="outline" className="text-xs">
                            {action.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
