
'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const conversationData = [
  { name: 'WhatsApp', value: 65, color: '#60B5FF' },
  { name: 'Web Chat', value: 25, color: '#FF9149' },
  { name: 'Email', value: 10, color: '#80D8C3' },
];

export function ConversationsChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={conversationData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {conversationData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ fontSize: 11 }}
            formatter={(value, name) => [`${value}%`, name]}
          />
          <Legend 
            verticalAlign="top"
            align="center"
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
