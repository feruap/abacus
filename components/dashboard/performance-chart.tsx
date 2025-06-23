
'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const performanceData = [
  { metric: 'Respuesta', value: 95, target: 90 },
  { metric: 'Resolución', value: 87, target: 85 },
  { metric: 'Satisfacción', value: 92, target: 88 },
  { metric: 'Conversión', value: 78, target: 75 },
];

export function PerformanceChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="metric" 
            tickLine={false}
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tickLine={false}
            tick={{ fontSize: 10 }}
            label={{ value: 'Porcentaje (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
          />
          <Tooltip 
            contentStyle={{ fontSize: 11 }}
            formatter={(value, name) => [
              `${value}%`,
              name === 'value' ? 'Actual' : 'Objetivo'
            ]}
          />
          <Bar dataKey="value" fill="#60B5FF" name="value" />
          <Bar dataKey="target" fill="#FF9149" name="target" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
