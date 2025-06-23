
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Principal</h1>
        <p className="text-muted-foreground">
          Vista general del sistema agéntico de ventas
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<MetricCard title="Cargando..." value="..." />}>
          <MetricCard
            title="Productos Activos"
            value="1,247"
            description="desde ayer"
            icon="Package"
            trend="up"
            trendValue="+12%"
          />
        </Suspense>
        <Suspense fallback={<MetricCard title="Cargando..." value="..." />}>
          <MetricCard
            title="Conversaciones Activas"
            value="23"
            description="en tiempo real"
            icon="MessageSquare"
            trend="neutral"
          />
        </Suspense>
        <Suspense fallback={<MetricCard title="Cargando..." value="..." />}>
          <MetricCard
            title="Ventas Hoy"
            value="$15,240"
            description="MXN"
            icon="DollarSign"
            trend="up"
            trendValue="+8.2%"
          />
        </Suspense>
        <Suspense fallback={<MetricCard title="Cargando..." value="..." />}>
          <MetricCard
            title="Tiempo de Respuesta"
            value="1.2s"
            description="promedio"
            icon="Clock"
            trend="down"
            trendValue="-0.3s"
          />
        </Suspense>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<div>Cargando gráficos...</div>}>
            <DashboardCharts />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Suspense fallback={<div>Cargando actividad...</div>}>
            <RecentActivity />
          </Suspense>
          <Suspense fallback={<div>Cargando acciones...</div>}>
            <QuickActions />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
