
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Send, 
  Copy, 
  Edit, 
  Trash2, 
  Plus,
  FileText,
  Variable,
  Activity
} from 'lucide-react';

interface Template {
  id: string;
  myaliceId: string;
  name: string;
  content: string;
  variables: any[];
  status: 'approved' | 'pending' | 'rejected';
  category?: string;
  language: string;
  usageCount: number;
  lastUsed?: string;
  channel: {
    id: string;
    name: string;
    type: string;
  };
}

interface Channel {
  id: string;
  myaliceId: string;
  name: string;
  type: string;
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
    loadChannels();
  }, []);

  useEffect(() => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (channelFilter !== 'all') {
      filtered = filtered.filter(template => template.channel.id === channelFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(template => template.status === statusFilter);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, channelFilter, statusFilter]);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/myalice/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error cargando plantillas:', error);
      toast({
        title: "Error",
        description: "Error al cargar plantillas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    try {
      const response = await fetch('/api/myalice/channels');
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error('Error cargando canales:', error);
    }
  };

  const openSendDialog = (template: Template) => {
    setSelectedTemplate(template);
    // Inicializar variables con valores vacíos
    const initialVariables: Record<string, string> = {};
    template.variables.forEach((variable: any) => {
      initialVariables[variable.name] = variable.default_value || '';
    });
    setTemplateVariables(initialVariables);
    setSendDialogOpen(true);
  };

  const sendTemplate = async () => {
    if (!selectedTemplate || !recipientPhone.trim()) {
      toast({
        title: "Error",
        description: "Selecciona una plantilla y proporciona un número de teléfono",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/myalice/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          templateId: selectedTemplate.id,
          to: recipientPhone,
          variables: templateVariables
        })
      });

      if (response.ok) {
        toast({
          title: "Plantilla enviada",
          description: "La plantilla se envió correctamente"
        });
        setSendDialogOpen(false);
        setRecipientPhone('');
        setTemplateVariables({});
        loadTemplates(); // Actualizar estadísticas de uso
      } else {
        throw new Error('Error al enviar plantilla');
      }
    } catch (error) {
      console.error('Error enviando plantilla:', error);
      toast({
        title: "Error",
        description: "Error al enviar la plantilla",
        variant: "destructive"
      });
    }
  };

  const copyTemplateContent = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: "Copiado",
      description: "Contenido de la plantilla copiado al portapapeles"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const columns = [
    {
      key: 'name',
      title: 'Nombre',
      render: (_: any, row: Template) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-gray-500">{row.category || 'Sin categoría'}</p>
        </div>
      )
    },
    {
      key: 'channel',
      title: 'Canal',
      render: (_: any, row: Template) => (
        <div>
          <p className="text-sm font-medium">{row.channel.name}</p>
          <p className="text-xs text-gray-500 capitalize">{row.channel.type}</p>
        </div>
      )
    },
    {
      key: 'content',
      title: 'Contenido',
      render: (_: any, row: Template) => (
        <div className="max-w-xs">
          <p className="text-sm truncate" title={row.content}>
            {row.content}
          </p>
          {row.variables.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Variable className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {row.variables.length} variables
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Estado',
      render: (_: any, row: Template) => (
        <Badge className={getStatusColor(row.status)}>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'usage',
      title: 'Uso',
      render: (_: any, row: Template) => (
        <div className="text-center">
          <p className="text-sm font-medium">{row.usageCount}</p>
          <p className="text-xs text-gray-500">
            {formatDate(row.lastUsed)}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Acciones',
      render: (_: any, row: Template) => (
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => openSendDialog(row)}
            disabled={row.status !== 'approved'}
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => copyTemplateContent(row)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Cargando plantillas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Gestión de Plantillas</CardTitle>
              <CardDescription>
                Administra plantillas de mensajes para MyAlice.ai
              </CardDescription>
            </div>
            <Button onClick={loadTemplates} variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Sincronizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Buscar plantillas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los canales</SelectItem>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.name} ({channel.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="approved">Aprobadas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            data={filteredTemplates}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Dialog para enviar plantilla */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Plantilla</DialogTitle>
            <DialogDescription>
              Enviar plantilla "{selectedTemplate?.name}" por {selectedTemplate?.channel.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Número de teléfono del destinatario</label>
              <Input
                placeholder="+52 555 123 4567"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
              />
            </div>

            {selectedTemplate && selectedTemplate.variables.length > 0 && (
              <div>
                <label className="text-sm font-medium">Variables de la plantilla</label>
                <div className="space-y-3 mt-2">
                  {selectedTemplate.variables.map((variable: any) => (
                    <div key={variable.name}>
                      <label className="text-sm text-gray-600">
                        {variable.name} {variable.required && <span className="text-red-500">*</span>}
                      </label>
                      <Input
                        placeholder={variable.description || `Valor para ${variable.name}`}
                        value={templateVariables[variable.name] || ''}
                        onChange={(e) => setTemplateVariables(prev => ({
                          ...prev,
                          [variable.name]: e.target.value
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTemplate && (
              <div>
                <label className="text-sm font-medium">Vista previa</label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{selectedTemplate.content}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={sendTemplate}
                disabled={!recipientPhone.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Plantilla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
