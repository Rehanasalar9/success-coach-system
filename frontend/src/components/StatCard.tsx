import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  badge?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'red';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  badge,
  color = 'blue',
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
      badge: 'bg-sky-500/20 text-sky-300',
    },
    emerald: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300',
    },
    amber: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300',
    },
    purple: {
      bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      badge: 'bg-purple-500/20 text-purple-300',
    },
    red: {
      bg: 'bg-red-500/10 border-red-500/20 text-red-400',
      badge: 'bg-red-500/20 text-red-300',
    },
  };

  const selectedColor = colorMap[color];

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg shadow-black/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl border ${selectedColor.bg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">{value}</span>
        {badge && (
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${selectedColor.badge}`}>
            {badge}
          </span>
        )}
      </div>
      {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
    </div>
  );
};
