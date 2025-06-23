'use client';

import { ProductTrainingSimulator } from '@/components/products/product-training-simulator';
import { ProductOptimizationCatalog } from '@/components/products/product-optimization-catalog';
import { ProductsTable } from '@/components/products/products-table';
import { ProductsSync } from '@/components/products/products-sync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  RefreshCw, 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Target, 
  Zap,
  BookOpen
} from 'lucide-react';

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Entrenamiento de Productos</h1>
        <p className="text-muted-foreground">
          Optimiza las respuestas del agente IA y entrena con simulaciones de conversaciones reales
        </p>
      </div>

      <Tabs defaultValue="simulator" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Simulador
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Optimización
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Sincronización
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulator" className="space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Simulador de Conversaciones</h2>
            <p className="text-muted-foreground">
              Practica conversaciones como cliente para probar y mejorar las respuestas del agente IA
            </p>
          </div>
          <ProductTrainingSimulator />
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Optimización de Productos</h2>
            <p className="text-muted-foreground">
              Configura frases clave y respuestas optimizadas para cada producto del catálogo
            </p>
          </div>
          <ProductOptimizationCatalog />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Catálogo de Productos</h2>
            <p className="text-muted-foreground">
              Gestiona tu inventario de productos médicos sincronizado con WooCommerce
            </p>
          </div>
          <ProductsTable />
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Sincronización con WooCommerce</h2>
            <p className="text-muted-foreground">
              Mantén actualizado tu catálogo con la tienda en línea
            </p>
          </div>
          <ProductsSync />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Métricas de Entrenamiento</h2>
            <p className="text-muted-foreground">
              Analiza el rendimiento del agente IA y la efectividad del entrenamiento
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Productos Optimizados
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">892</div>
                <p className="text-xs text-muted-foreground">
                  71% del catálogo total
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sesiones de Entrenamiento
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">147</div>
                <p className="text-xs text-muted-foreground">
                  +23 esta semana
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Precisión del Agente
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">
                  +2.1% desde el mes pasado
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tiempo de Respuesta
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.8s</div>
                <p className="text-xs text-muted-foreground">
                  -0.3s mejora promedio
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Productos Más Entrenados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Termómetros Digitales</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                      <span className="text-xs text-muted-foreground">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tensiómetros</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '78%'}}></div>
                      </div>
                      <span className="text-xs text-muted-foreground">78%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Oxímetros</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '72%'}}></div>
                      </div>
                      <span className="text-xs text-muted-foreground">72%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Estetoscopios</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '65%'}}></div>
                      </div>
                      <span className="text-xs text-muted-foreground">65%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Rendimiento Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lunes</span>
                    <span className="text-sm font-medium">94.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Martes</span>
                    <span className="text-sm font-medium">92.8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Miércoles</span>
                    <span className="text-sm font-medium">95.1%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Jueves</span>
                    <span className="text-sm font-medium">93.7%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Viernes</span>
                    <span className="text-sm font-medium">96.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sábado</span>
                    <span className="text-sm font-medium">91.4%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Domingo</span>
                    <span className="text-sm font-medium">89.6%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
