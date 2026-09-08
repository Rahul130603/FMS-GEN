import React from 'react';

/**
 * Modern Compact Enterprise Summary Metric Card
 */
export function SummaryCard({
  title,
  count,
  subtitle,
  icon: Icon,
  variant = 'default',
  badgeText,
  onClick,
  active = false
}) {
  // Variant theme colors
  const variants = {
    default: {
      card: 'border-slate-200 hover:border-slate-300',
      iconBg: 'bg-slate-100 text-slate-700',
      count: 'text-slate-900',
      accent: 'border-l-slate-400'
    },
    primary: {
      card: 'border-brand-200 hover:border-brand-300 bg-gradient-to-b from-brand-50/30 to-white',
      iconBg: 'bg-brand-100 text-brand-700',
      count: 'text-brand-900',
      accent: 'border-l-brand-600'
    },
    success: {
      card: 'border-emerald-200 hover:border-emerald-300 bg-gradient-to-b from-emerald-50/30 to-white',
      iconBg: 'bg-emerald-100 text-emerald-700',
      count: 'text-emerald-950',
      accent: 'border-l-emerald-600'
    },
    warning: {
      card: 'border-amber-200 hover:border-amber-300 bg-gradient-to-b from-amber-50/30 to-white',
      iconBg: 'bg-amber-100 text-amber-700',
      count: 'text-amber-950',
      accent: 'border-l-amber-500'
    },
    danger: {
      card: 'border-rose-200 hover:border-rose-300 bg-gradient-to-b from-rose-50/30 to-white',
      iconBg: 'bg-rose-100 text-rose-700',
      count: 'text-rose-950',
      accent: 'border-l-rose-500'
    },
    info: {
      card: 'border-cyan-200 hover:border-cyan-300 bg-gradient-to-b from-cyan-50/30 to-white',
      iconBg: 'bg-cyan-100 text-cyan-700',
      count: 'text-cyan-950',
      accent: 'border-l-cyan-600'
    },
    purple: {
      card: 'border-purple-200 hover:border-purple-300 bg-gradient-to-b from-purple-50/30 to-white',
      iconBg: 'bg-purple-100 text-purple-700',
      count: 'text-purple-950',
      accent: 'border-l-purple-600'
    }
  };

  const currentTheme = variants[variant] || variants.default;

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl p-4 border border-l-4 ${currentTheme.accent} ${currentTheme.card} shadow-subtle transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-card hover:-translate-y-0.5' : ''
      } ${active ? 'ring-2 ring-brand-500 ring-offset-1' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${currentTheme.count} font-mono`}>
              {count}
            </span>
            {badgeText && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${currentTheme.iconBg} shrink-0`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
