import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'amber' }) {
  const colorMap = {
    amber: {
      bg: 'bg-amber-50/60',
      text: 'text-amber-700',
      iconBg: 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-amber-600/30',
      border: 'border-amber-200/80 hover:border-amber-400',
      glow: 'group-hover:shadow-amber-500/10',
    },
    emerald: {
      bg: 'bg-emerald-50/60',
      text: 'text-emerald-700',
      iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-600/30',
      border: 'border-emerald-200/80 hover:border-emerald-400',
      glow: 'group-hover:shadow-emerald-500/10',
    },
    rose: {
      bg: 'bg-rose-50/60',
      text: 'text-rose-700',
      iconBg: 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-600/30',
      border: 'border-rose-200/80 hover:border-rose-400',
      glow: 'group-hover:shadow-rose-500/10',
    },
    blue: {
      bg: 'bg-blue-50/60',
      text: 'text-blue-700',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-blue-600/30',
      border: 'border-blue-200/80 hover:border-blue-400',
      glow: 'group-hover:shadow-blue-500/10',
    },
    purple: {
      bg: 'bg-purple-50/60',
      text: 'text-purple-700',
      iconBg: 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-600/30',
      border: 'border-purple-200/80 hover:border-purple-400',
      glow: 'group-hover:shadow-purple-500/10',
    },
  };

  const scheme = colorMap[color] || colorMap.amber;

  return (
    <div
      className={`group bg-white p-6 rounded-3xl border ${scheme.border} shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden`}
    >
      {/* Soft background glow */}
      <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full ${scheme.bg} blur-xl pointer-events-none transition-all duration-300 group-hover:scale-150`} />

      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="heading-font text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
              <span>{subtitle}</span>
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`w-14 h-14 rounded-2xl ${scheme.iconBg} flex items-center justify-center shadow-lg shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
          >
            <Icon className="w-7 h-7" />
          </div>
        )}
      </div>
    </div>
  );
}
