
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { MetricCard } from '@/components/ui/metric-card';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';

export default function DashboardPage() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Principal
          </h1>
          <p className="text-gray-600">
            Resumen completo del rendimiento del sistema agéntico de ventas
          </p>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Conversaciones Activas"
            value="127"
            trend="up"
            trendValue="+12%"
            icon="MessageSquare"
          />
          <MetricCard
            title="Leads Generados"
            value="89"
            trend="up"
            trendValue="+24%"
            icon="Users"
          />
          <MetricCard
            title="Tasa de Conversión"
            value="68.5%"
            trend="up"
            trendValue="+5.2%"
            icon="TrendingUp"
          />
          <MetricCard
            title="Agente IA Activo"
            value="99.8%"
            trend="up"
            trendValue="+0.1%"
            icon="Bot"
          />
        </div>

        {/* Gráficos y análisis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DashboardCharts />
          </div>
          <div className="space-y-6">
            <QuickActions />
            <RecentActivity />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
