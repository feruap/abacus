
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesChart } from './sales-chart';
import { ConversationsChart } from './conversations-chart';
import { PerformanceChart } from './performance-chart';

export function DashboardCharts() {
  return (
    <div className="space-y-6">
      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesChart />
        </CardContent>
      </Card>

      {/* Conversations and Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversaciones por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ConversationsChart />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento del Agente</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
