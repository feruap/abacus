
'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const salesData = [
  { name: 'Ene', ventas: 12000, pedidos: 45 },
  { name: 'Feb', ventas: 19000, pedidos: 67 },
  { name: 'Mar', ventas: 15000, pedidos: 52 },
  { name: 'Abr', ventas: 25000, pedidos: 89 },
  { name: 'May', ventas: 22000, pedidos: 78 },
  { name: 'Jun', ventas: 30000, pedidos: 102 },
];

export function SalesChart() {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tickLine={false}
            tick={{ fontSize: 10 }}
            label={{ value: 'Mes', position: 'insideBottom', offset: -15, style: { textAnchor: 'middle', fontSize: 11 } }}
          />
          <YAxis 
            tickLine={false}
            tick={{ fontSize: 10 }}
            label={{ value: 'Ventas (MXN)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
          />
          <Tooltip 
            contentStyle={{ fontSize: 11 }}
            formatter={(value, name) => [
              name === 'ventas' ? `$${value.toLocaleString()} MXN` : value,
              name === 'ventas' ? 'Ventas' : 'Pedidos'
            ]}
          />
          <Legend 
            verticalAlign="top"
            wrapperStyle={{ fontSize: 11 }}
          />
          <Area
            type="monotone"
            dataKey="ventas"
            stackId="1"
            stroke="#60B5FF"
            fill="#60B5FF"
            fillOpacity={0.6}
            name="ventas"
          />
          <Area
            type="monotone"
            dataKey="pedidos"
            stackId="2"
            stroke="#FF9149"
            fill="#FF9149"
            fillOpacity={0.6}
            name="pedidos"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
