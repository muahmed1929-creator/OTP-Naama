'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const AreaChart = ({ data }: { data: any[] }) => {
  return (
    <div className="bg-white rounded-card shadow-soft p-8 h-[400px] border border-white/40">
      <h3 className="text-xl font-bold text-gray-900 mb-8">Area-wise Distribution</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: 'none', 
                borderRadius: '16px', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
              }}
            />
            <Bar dataKey="count" radius={[10, 10, 10, 10]} barSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
