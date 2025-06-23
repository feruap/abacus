
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, RotateCcw, Zap } from 'lucide-react';

export function SystemConfigForm() {
  const [config, setConfig] = useState({
    // LLM Configuration
    llmProvider: 'abacusai',
    llmModel: 'gpt-4.1-mini',
    llmTemperature: 0.7,
    llmMaxTokens: 1000,
    llmRateLimit: 60,
    apiKey: '',
    deepseekEndpoint: 'https://api.deepseek.com',
    deepseekVersion: 'v1',
    
    // Scraping Configuration
    scrapingEnabled: true,
    scrapingInterval: 24,
    scrapingTimeout: 30,
    scrapingUserAgent: 'Sistema Agéntico Bot 1.0',
    
    // Notifications
    notificationsEnabled: true,
    emailNotifications: true,
    webhookNotifications: true,
    notificationRetention: 30,
    
    // Security
    sessionTimeout: 8,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    
    // System
    logLevel: 'info',
    logRetention: 90,
    cacheTimeout: 300,
    defaultLanguage: 'es'
  });

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/config/system', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        toast({
          title: "Configuración guardada",
          description: "La configuración se ha guardado correctamente"
        });
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "Error al guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.apiKey) {
      toast({
        title: "API Key requerida",
        description: "Por favor ingresa tu API key antes de probar la conexión",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    
    try {
      const response = await fetch('/api/config/test-llm-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: config.llmProvider,
          model: config.llmModel,
          apiKey: config.apiKey,
          endpoint: config.deepseekEndpoint,
          version: config.deepseekVersion
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "Conexión exitosa",
          description: `Conectado correctamente a ${config.llmProvider.toUpperCase()}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Error de conexión",
          description: result.message || "No se pudo conectar al proveedor LLM",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: "Error",
        description: "Error al probar la conexión",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    // Reset to default values
    setConfig({
      llmProvider: 'abacusai',
      llmModel: 'gpt-4.1-mini',
      llmTemperature: 0.7,
      llmMaxTokens: 1000,
      llmRateLimit: 60,
      apiKey: '',
      deepseekEndpoint: 'https://api.deepseek.com',
      deepseekVersion: 'v1',
      scrapingEnabled: true,
      scrapingInterval: 24,
      scrapingTimeout: 30,
      scrapingUserAgent: 'Sistema Agéntico Bot 1.0',
      notificationsEnabled: true,
      emailNotifications: true,
      webhookNotifications: true,
      notificationRetention: 30,
      sessionTimeout: 8,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      logLevel: 'info',
      logRetention: 90,
      cacheTimeout: 300,
      defaultLanguage: 'es'
    });
  };

  return (
    <div className="space-y-6">
      {/* LLM Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del LLM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="llmProvider">Proveedor</Label>
              <Select value={config.llmProvider} onValueChange={(value) => 
                setConfig(prev => ({ ...prev, llmProvider: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="abacusai">Abacus.AI</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="claude">Anthropic Claude</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="llmModel">Modelo</Label>
              <Select value={config.llmModel} onValueChange={(value) => 
                setConfig(prev => ({ ...prev, llmModel: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {config.llmProvider === 'gemini' && (
                    <>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                    </>
                  )}
                  {config.llmProvider === 'abacusai' && (
                    <>
                      <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    </>
                  )}
                  {config.llmProvider === 'deepseek' && (
                    <>
                      <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                      <SelectItem value="deepseek-coder">DeepSeek Coder</SelectItem>
                      <SelectItem value="deepseek-reasoner">DeepSeek Reasoner</SelectItem>
                    </>
                  )}
                  {config.llmProvider === 'openai' && (
                    <>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    </>
                  )}
                  {config.llmProvider === 'claude' && (
                    <>
                      <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="temperature">Temperatura</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={config.llmTemperature}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  llmTemperature: parseFloat(e.target.value) 
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="maxTokens">Tokens Máximos</Label>
              <Input
                id="maxTokens"
                type="number"
                value={config.llmMaxTokens}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  llmMaxTokens: parseInt(e.target.value) 
                }))}
              />
            </div>
          </div>

          {/* API Configuration Section */}
          <div className="grid gap-4 md:grid-cols-1">
            <div>
              <Label htmlFor="apiKey">
                API Key para {config.llmProvider === 'gemini' ? 'Google Gemini' : 
                            config.llmProvider === 'abacusai' ? 'Abacus.AI' :
                            config.llmProvider === 'deepseek' ? 'DeepSeek' :
                            config.llmProvider === 'openai' ? 'OpenAI' :
                            config.llmProvider === 'claude' ? 'Anthropic' : 'el proveedor seleccionado'}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={`Ingresa tu API key de ${config.llmProvider}...`}
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => testConnection()}
                  disabled={!config.apiKey || testing}
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                      Probando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Probar
                    </>
                  )}
                </Button>
              </div>
              {config.llmProvider === 'deepseek' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Obtén tu API key de DeepSeek en: https://platform.deepseek.com/api_keys
                </p>
              )}
            </div>

            {/* DeepSeek specific configuration */}
            {config.llmProvider === 'deepseek' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="deepseekEndpoint">Endpoint Base URL</Label>
                  <Input
                    id="deepseekEndpoint"
                    placeholder="https://api.deepseek.com"
                    value={config.deepseekEndpoint || 'https://api.deepseek.com'}
                    onChange={(e) => setConfig(prev => ({ ...prev, deepseekEndpoint: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="deepseekVersion">Versión de API</Label>
                  <Select value={config.deepseekVersion || 'v1'} onValueChange={(value) => 
                    setConfig(prev => ({ ...prev, deepseekVersion: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v1">v1 (Recomendado)</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scraping Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Scraping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="scrapingEnabled">Scraping Automático</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar scraping automático de productos
              </p>
            </div>
            <Switch
              id="scrapingEnabled"
              checked={config.scrapingEnabled}
              onCheckedChange={(checked) => setConfig(prev => ({ 
                ...prev, 
                scrapingEnabled: checked 
              }))}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="scrapingInterval">Intervalo (horas)</Label>
              <Input
                id="scrapingInterval"
                type="number"
                value={config.scrapingInterval}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  scrapingInterval: parseInt(e.target.value) 
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="scrapingTimeout">Timeout (segundos)</Label>
              <Input
                id="scrapingTimeout"
                type="number"
                value={config.scrapingTimeout}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  scrapingTimeout: parseInt(e.target.value) 
                }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="userAgent">User Agent</Label>
            <Input
              id="userAgent"
              value={config.scrapingUserAgent}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                scrapingUserAgent: e.target.value 
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notificationsEnabled">Notificaciones Habilitadas</Label>
              <Switch
                id="notificationsEnabled"
                checked={config.notificationsEnabled}
                onCheckedChange={(checked) => setConfig(prev => ({ 
                  ...prev, 
                  notificationsEnabled: checked 
                }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications">Notificaciones por Email</Label>
              <Switch
                id="emailNotifications"
                checked={config.emailNotifications}
                onCheckedChange={(checked) => setConfig(prev => ({ 
                  ...prev, 
                  emailNotifications: checked 
                }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="webhookNotifications">Notificaciones por Webhook</Label>
              <Switch
                id="webhookNotifications"
                checked={config.webhookNotifications}
                onCheckedChange={(checked) => setConfig(prev => ({ 
                  ...prev, 
                  webhookNotifications: checked 
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Restaurar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
}
