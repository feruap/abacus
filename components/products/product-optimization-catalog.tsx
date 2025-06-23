
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Edit, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  BarChart3,
  MessageSquare,
  Target,
  Zap
} from 'lucide-react';

interface ProductOptimization {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
  };
  optimizationStatus: 'optimized' | 'not_optimized' | 'in_progress';
  keyPhrases: string[];
  suggestedResponses: string[];
  conversationCount: number;
  conversionRate: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  lastOptimized: Date;
  lastConversation: Date;
  trends: {
    mentions: number;
    conversions: number;
    satisfaction: number;
  };
}

export function ProductOptimizationCatalog() {
  const [products, setProducts] = useState<ProductOptimization[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductOptimization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductOptimization | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [metricsDialogOpen, setMetricsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Estado para edición
  const [editData, setEditData] = useState({
    keyPhrases: [] as string[],
    suggestedResponses: [] as string[],
    newKeyPhrase: '',
    newResponse: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, statusFilter]);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products/optimization-catalog');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Error al cargar productos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.optimizationStatus === statusFilter);
    }

    setFilteredProducts(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimized': return 'bg-green-100 text-green-800';
      case 'not_optimized': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimized': return <CheckCircle2 className="h-4 w-4" />;
      case 'not_optimized': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const openEditDialog = (product: ProductOptimization) => {
    setSelectedProduct(product);
    setEditData({
      keyPhrases: [...product.keyPhrases],
      suggestedResponses: [...product.suggestedResponses],
      newKeyPhrase: '',
      newResponse: ''
    });
    setEditDialogOpen(true);
  };

  const openMetricsDialog = (product: ProductOptimization) => {
    setSelectedProduct(product);
    setMetricsDialogOpen(true);
  };

  const addKeyPhrase = () => {
    if (editData.newKeyPhrase.trim()) {
      setEditData(prev => ({
        ...prev,
        keyPhrases: [...prev.keyPhrases, prev.newKeyPhrase.trim()],
        newKeyPhrase: ''
      }));
    }
  };

  const removeKeyPhrase = (index: number) => {
    setEditData(prev => ({
      ...prev,
      keyPhrases: prev.keyPhrases.filter((_, i) => i !== index)
    }));
  };

  const addResponse = () => {
    if (editData.newResponse.trim()) {
      setEditData(prev => ({
        ...prev,
        suggestedResponses: [...prev.suggestedResponses, prev.newResponse.trim()],
        newResponse: ''
      }));
    }
  };

  const removeResponse = (index: number) => {
    setEditData(prev => ({
      ...prev,
      suggestedResponses: prev.suggestedResponses.filter((_, i) => i !== index)
    }));
  };

  const saveOptimization = async () => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/products/optimization/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyPhrases: editData.keyPhrases,
          suggestedResponses: editData.suggestedResponses
        })
      });

      if (response.ok) {
        toast({
          title: "Optimización guardada",
          description: "Las optimizaciones se han guardado correctamente"
        });
        setEditDialogOpen(false);
        loadProducts(); // Recargar datos
      }
    } catch (error) {
      console.error('Error saving optimization:', error);
      toast({
        title: "Error",
        description: "Error al guardar optimización",
        variant: "destructive"
      });
    }
  };

  const columns = [
    {
      key: 'product',
      title: 'Producto',
      render: (_: any, row: ProductOptimization) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="font-medium">{row.product.name}</p>
            <p className="text-sm text-gray-500">{row.product.sku}</p>
            <Badge variant="outline" className="text-xs">
              {row.product.category}
            </Badge>
          </div>
        </div>
      )
    },
    {
      key: 'optimizationStatus',
      title: 'Estado de Optimización',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(value)}
          <Badge className={getStatusColor(value)}>
            {value === 'optimized' && 'Optimizado'}
            {value === 'not_optimized' && 'No Optimizado'}
            {value === 'in_progress' && 'En Proceso'}
          </Badge>
        </div>
      )
    },
    {
      key: 'metrics',
      title: 'Métricas',
      render: (_: any, row: ProductOptimization) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <MessageSquare className="h-3 w-3 text-gray-400" />
            <span>{row.conversationCount} conversaciones</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Target className="h-3 w-3 text-gray-400" />
            <span>{Math.round(row.conversionRate * 100)}% conversión</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="h-3 w-3 text-gray-400" />
            <span>{Math.round(row.customerSatisfaction * 100)}% satisfacción</span>
          </div>
        </div>
      )
    },
    {
      key: 'keyPhrases',
      title: 'Frases Clave',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {value.slice(0, 3).map((phrase, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {phrase}
            </Badge>
          ))}
          {value.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{value.length - 3} más
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'lastOptimized',
      title: 'Última Optimización',
      render: (value: Date) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : 'Nunca'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Acciones',
      render: (_: any, row: ProductOptimization) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => openMetricsDialog(row)}>
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => openEditDialog(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Zap className="h-4 w-4" />
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
            <span className="ml-2">Cargando catálogo...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Catálogo de Optimización de Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Buscar por nombre, SKU o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Estado de Optimización" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="optimized">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Optimizado
                  </div>
                </SelectItem>
                <SelectItem value="in_progress">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    En Proceso
                  </div>
                </SelectItem>
                <SelectItem value="not_optimized">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    No Optimizado
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            data={filteredProducts}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Dialog de Edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Optimizar Producto</DialogTitle>
            <DialogDescription>
              Configura frases clave y respuestas sugeridas para {selectedProduct?.product.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Frases Clave */}
            <div>
              <h4 className="font-medium mb-3">Frases Clave</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar nueva frase clave..."
                    value={editData.newKeyPhrase}
                    onChange={(e) => setEditData(prev => ({ ...prev, newKeyPhrase: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyPhrase()}
                  />
                  <Button onClick={addKeyPhrase} disabled={!editData.newKeyPhrase.trim()}>
                    Agregar
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {editData.keyPhrases.map((phrase, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => removeKeyPhrase(index)}
                    >
                      {phrase} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Respuestas Sugeridas */}
            <div>
              <h4 className="font-medium mb-3">Respuestas Sugeridas</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Agregar nueva respuesta sugerida..."
                    value={editData.newResponse}
                    onChange={(e) => setEditData(prev => ({ ...prev, newResponse: e.target.value }))}
                    rows={3}
                  />
                </div>
                <Button onClick={addResponse} disabled={!editData.newResponse.trim()}>
                  Agregar Respuesta
                </Button>
                
                <div className="space-y-2">
                  {editData.suggestedResponses.map((response, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg relative group">
                      <p className="text-sm">{response}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                        onClick={() => removeResponse(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveOptimization}>
                Guardar Optimización
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Métricas */}
      <Dialog open={metricsDialogOpen} onOpenChange={setMetricsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Métricas de Rendimiento</DialogTitle>
            <DialogDescription>
              Estadísticas de {selectedProduct?.product.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Conversaciones</p>
                <p className="text-2xl font-bold">{selectedProduct.conversationCount}</p>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  {selectedProduct.trends.mentions} este mes
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Tasa de Conversión</p>
                <p className="text-2xl font-bold">{Math.round(selectedProduct.conversionRate * 100)}%</p>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  {selectedProduct.trends.conversions} conversiones
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Tiempo de Respuesta</p>
                <p className="text-2xl font-bold">{selectedProduct.averageResponseTime}s</p>
                <p className="text-sm text-gray-500">Promedio</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Satisfacción</p>
                <p className="text-2xl font-bold">{Math.round(selectedProduct.customerSatisfaction * 100)}%</p>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  {selectedProduct.trends.satisfaction}% mejoría
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
