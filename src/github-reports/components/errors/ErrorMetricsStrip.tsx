import React from 'react';
import { useErrors } from '../../context/ErrorContext';

export const ErrorMetricsStrip: React.FC = () => {
  const { metrics, filters, activeView, filterByMetricStrip } = useErrors();

  const items = [
    {
      id: 'all' as const,
      label: 'ALL',
      count: metrics.total,
      isActive: activeView === 'all' && filters.status === 'All' && filters.priority === 'All',
      color: 'text-slate-900',
      activeBorder: 'border-slate-900 text-slate-900'
    },
    {
      id: 'open' as const,
      label: 'OPEN',
      count: metrics.open,
      isActive: activeView === 'open' || filters.status === 'Open',
      color: 'text-sky-700',
      activeBorder: 'border-sky-600 text-sky-700 font-bold'
    },
    {
      id: 'inProgress' as const,
      label: 'IN PROGRESS',
      count: metrics.inProgress,
      isActive: filters.status === 'In Progress',
      color: 'text-indigo-700',
      activeBorder: 'border-indigo-600 text-indigo-700 font-bold'
    },
    {
      id: 'highPriority' as const,
      label: 'HIGH PRIORITY',
      count: metrics.highPriority,
      isActive: activeView === 'high_priority' || filters.priority === 'High',
      color: 'text-rose-700',
      activeBorder: 'border-rose-600 text-rose-700 font-bold'
    },
    {
      id: 'resolved' as const,
      label: 'RESOLVED',
      count: metrics.resolved,
      isActive: activeView === 'resolved' || filters.status === 'Resolved',
      color: 'text-emerald-700',
      activeBorder: 'border-emerald-600 text-emerald-700 font-bold'
    },
    {
      id: 'overdue' as const,
      label: 'OVERDUE',
      count: metrics.overdue,
      isActive: activeView === 'overdue',
      color: 'text-amber-700',
      activeBorder: 'border-amber-600 text-amber-700 font-bold'
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-2xs px-1 py-0.5 overflow-x-auto">
      <div className="flex items-center min-w-max divide-x divide-slate-200/80">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => filterByMetricStrip(item.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs transition-colors relative focus:outline-none focus:bg-slate-50 ${
              item.isActive
                ? `${item.color} font-bold bg-slate-50/70`
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            <span className="text-[11px] font-semibold tracking-wider">{item.label}</span>
            <span
              className={`text-xs px-1.5 py-0.2 rounded font-mono font-bold ${
                item.isActive ? 'bg-slate-200/80 text-slate-900' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {item.count}
            </span>

            {/* Bottom active indicator */}
            {item.isActive && (
              <span className={`absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
