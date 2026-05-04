import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  gradient?: string;
  subtitle?: string;
}

export const StatsCard = ({ title, value, icon: Icon, gradient, subtitle }: StatsCardProps) => {
  return (
    <div className={`p-8 rounded-card shadow-soft border border-white/40 flex flex-col justify-between min-h-[180px] transition-all hover:scale-[1.02] ${gradient || 'bg-white'}`}>
      <div className="flex justify-between items-start">
        <span className="text-gray-500 font-semibold text-lg">{title}</span>
        <div className="p-2 bg-white/40 backdrop-blur-md rounded-xl">
          <Icon className="w-5 h-5 text-gray-700" />
        </div>
      </div>
      <div>
        <h3 className="text-4xl font-bold text-gray-900 leading-tight">{value}</h3>
        {subtitle && <p className="text-gray-500 text-sm font-medium mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};
