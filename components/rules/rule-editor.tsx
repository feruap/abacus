
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, TestTube, Play, X, Plus } from 'lucide-react';

interface RuleCondition {
  field: string;
  operator: string;
  value: string;
}

interface RuleAction {
  type: string;
  parameters: Record<string, any>;
}

export function RuleEditor() {
  const [rule, setRule] = useState({
    name: '',
    description: '',
    category: '',
    priority: 0,
    isActive: true,
    trigger: {
      event: '',
      conditions: [] as RuleCondition[]
    },
    actions: [] as RuleAction[],
    maxExecutions: null as number | null,
    cooldownMinutes: null as number | null
  });

  const [testResult, setTestResult] = useState<any>(null);

  const eventTypes = [
    { value: 'message_received', label: 'Mensaje Recibido' },
    { value: 'conversation_started', label: 'Conversación Iniciada' },
    { value: 'product_inquiry', label: 'Consulta de Producto' },
    { value: 'order_attempt', label: 'Intento de Pedido' },
    { value: 'escalation_needed', label: 'Escalación Necesaria' }
  ];

  const actionTypes = [
    { value: 'send_message', label: 'Enviar Mensaje' },
    { value: 'escalate_conversation', label: 'Escalar Conversación' },
    { value: 'apply_discount', label: 'Aplicar Descuento' },
    { value: 'update_inventory', label: 'Actualizar Inventario' },
    { value: 'trigger_webhook', label: 'Activar Webhook' }
  ];

  const ruleCategories = [
    { value: 'escalation', label: 'Escalación' },
    { value: 'discount', label: 'Descuentos' },
    { value: 'response', label: 'Respuestas' },
    { value: 'inventory', label: 'Inventario' }
  ];

  const handleSaveRule = async () => {
    try {
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rule)
      });

      if (response.ok) {
        console.log('Rule saved successfully');
        // Reset form
        setRule({
          name: '',
          description: '',
          category: '',
          priority: 0,
          isActive: true,
          trigger: { event: '', conditions: [] },
          actions: [],
          maxExecutions: null,
          cooldownMinutes: null
        });
      }
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleTestRule = async () => {
    try {
      const response = await fetch('/api/rules/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rule)
      });

      if (response.ok) {
        const result = await response.json();
        setTestResult(result);
      }
    } catch (error) {
      console.error('Error testing rule:', error);
    }
  };

  const addCondition = () => {
    setRule(prev => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        conditions: [...prev.trigger.conditions, { field: '', operator: '', value: '' }]
      }
    }));
  };

  const removeCondition = (index: number) => {
    setRule(prev => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        conditions: prev.trigger.conditions.filter((_, i) => i !== index)
      }
    }));
  };

  const addAction = () => {
    setRule(prev => ({
      ...prev,
      actions: [...prev.actions, { type: '', parameters: {} }]
    }));
  };

  const removeAction = (index: number) => {
    setRule(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="ruleName">Nombre de la Regla</Label>
              <Input
                id="ruleName"
                value={rule.name}
                onChange={(e) => setRule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Escalación por keywords negativas"
              />
            </div>
            
            <div>
              <Label htmlFor="ruleCategory">Categoría</Label>
              <Select value={rule.category} onValueChange={(value) => 
                setRule(prev => ({ ...prev, category: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {ruleCategories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="rulePriority">Prioridad</Label>
              <Input
                id="rulePriority"
                type="number"
                value={rule.priority}
                onChange={(e) => setRule(prev => ({ 
                  ...prev, 
                  priority: parseInt(e.target.value) 
                }))}
                placeholder="0"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="ruleActive"
                checked={rule.isActive}
                onCheckedChange={(checked) => setRule(prev => ({ 
                  ...prev, 
                  isActive: checked 
                }))}
              />
              <Label htmlFor="ruleActive">Regla Activa</Label>
            </div>
          </div>
          
          <div>
            <Label htmlFor="ruleDescription">Descripción</Label>
            <Textarea
              id="ruleDescription"
              value={rule.description}
              onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe qué hace esta regla y cuándo se activa..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trigger Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Disparador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="triggerEvent">Evento Disparador</Label>
            <Select value={rule.trigger.event} onValueChange={(value) => 
              setRule(prev => ({ 
                ...prev, 
                trigger: { ...prev.trigger, event: value }
              }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar evento" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map(event => (
                  <SelectItem key={event.value} value={event.value}>
                    {event.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Condiciones</Label>
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar Condición
              </Button>
            </div>
            
            <div className="space-y-3">
              {rule.trigger.conditions.map((condition, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Input
                    placeholder="Campo"
                    value={condition.field}
                    onChange={(e) => {
                      const newConditions = [...rule.trigger.conditions];
                      newConditions[index] = { ...condition, field: e.target.value };
                      setRule(prev => ({
                        ...prev,
                        trigger: { ...prev.trigger, conditions: newConditions }
                      }));
                    }}
                  />
                  <Select value={condition.operator} onValueChange={(value) => {
                    const newConditions = [...rule.trigger.conditions];
                    newConditions[index] = { ...condition, operator: value };
                    setRule(prev => ({
                      ...prev,
                      trigger: { ...prev.trigger, conditions: newConditions }
                    }));
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Operador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Igual a</SelectItem>
                      <SelectItem value="contains">Contiene</SelectItem>
                      <SelectItem value="greater_than">Mayor que</SelectItem>
                      <SelectItem value="less_than">Menor que</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Valor"
                    value={condition.value}
                    onChange={(e) => {
                      const newConditions = [...rule.trigger.conditions];
                      newConditions[index] = { ...condition, value: e.target.value };
                      setRule(prev => ({
                        ...prev,
                        trigger: { ...prev.trigger, conditions: newConditions }
                      }));
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Acciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Acciones a Ejecutar</Label>
            <Button variant="outline" size="sm" onClick={addAction}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar Acción
            </Button>
          </div>
          
          <div className="space-y-3">
            {rule.actions.map((action, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                <Select value={action.type} onValueChange={(value) => {
                  const newActions = [...rule.actions];
                  newActions[index] = { ...action, type: value };
                  setRule(prev => ({ ...prev, actions: newActions }));
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tipo de acción" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map(actionType => (
                      <SelectItem key={actionType.value} value={actionType.value}>
                        {actionType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Parámetros (JSON)"
                  value={JSON.stringify(action.parameters)}
                  onChange={(e) => {
                    try {
                      const parameters = JSON.parse(e.target.value);
                      const newActions = [...rule.actions];
                      newActions[index] = { ...action, parameters };
                      setRule(prev => ({ ...prev, actions: newActions }));
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAction(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado de Prueba</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className={testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {testResult.success ? 'Éxito' : 'Error'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Tiempo de ejecución: {testResult.executionTime}ms
                </span>
              </div>
              <pre className="bg-muted p-3 rounded-md text-sm">
                {JSON.stringify(testResult.result, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handleTestRule}>
          <TestTube className="mr-2 h-4 w-4" />
          Probar Regla
        </Button>
        <Button onClick={handleSaveRule}>
          <Save className="mr-2 h-4 w-4" />
          Guardar Regla
        </Button>
      </div>
    </div>
  );
}
