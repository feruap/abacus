'use client';

import { useState } from 'react';
import { RulesTable } from '@/components/rules/rules-table';
import { RuleEditor } from '@/components/rules/rule-editor';
import { RulesLibrary } from '@/components/rules/rules-library';
import { RuleTestPanel } from '@/components/rules/rule-test-panel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Zap, Plus, Database, BookOpen, TestTube, Play, RefreshCw } from 'lucide-react';

export default function RulesPage() {
  const [initializing, setInitializing] = useState(false);
  const { toast } = useToast();

  const initializeDefaultRules = async () => {
    setInitializing(true);
    
    try {
      const response = await fetch('/api/rules/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Reglas inicializadas",
          description: `${result.count || 0} reglas predefinidas han sido cargadas correctamente`
        });
        // Recargar la página para mostrar las nuevas reglas
        window.location.reload();
      } else {
        throw new Error('Error al inicializar reglas');
      }
    } catch (error) {
      console.error('Error initializing rules:', error);
      toast({
        title: "Error",
        description: "Error al inicializar las reglas predefinidas",
        variant: "destructive"
      });
    } finally {
      setInitializing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Motor de Reglas</h1>
          <p className="text-muted-foreground">
            Gestiona las reglas de negocio que automatizan las respuestas del sistema
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={initializeDefaultRules}
            disabled={initializing}
          >
            {initializing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                Inicializando...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Cargar Reglas Predefinidas
              </>
            )}
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Regla
          </Button>
        </div>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Reglas Activas
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Pruebas
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Biblioteca
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Reglas de Negocio Activas</h2>
            <p className="text-muted-foreground">
              Gestiona y monitorea todas las reglas que automatizan las respuestas del sistema
            </p>
          </div>
          <RulesTable />
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Panel de Pruebas</h2>
            <p className="text-muted-foreground">
              Prueba el comportamiento de las reglas con diferentes mensajes y escenarios
            </p>
          </div>
          <RuleTestPanel />
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Editor de Reglas</CardTitle>
              <CardDescription>
                Crea y edita reglas de negocio personalizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RuleEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Biblioteca de Reglas</CardTitle>
              <CardDescription>
                Plantillas predefinidas de reglas comunes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RulesLibrary />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
