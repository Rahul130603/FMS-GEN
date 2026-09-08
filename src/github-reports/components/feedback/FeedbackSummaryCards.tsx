import React from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import {
  MessageSquare,
  Sparkles,
  Clock,
  CalendarCheck,
  CheckCircle2,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const FeedbackSummaryCards: React.FC = () => {
  const { metrics, filters, filterByMetricCard } = useFeedback();

  const cards = [
    {
      id: 'all' as const,
      label: 'Total Feedback',
      value: metrics.total,
      subtext: 'Publishing & EPUB ideas',
      icon: <Layers size={18} className="text-slate-600" />,
      badgeColor: 'bg-slate-100 text-slate-700',
      isActive: filters.status === 'All',
      trend: '6 modules covered'
    },
    {
      id: 'new' as const,
      label: 'New',
      value: metrics.newCount,
      subtext: 'Awaiting triage',
      icon: <MessageSquare size={18} className="text-blue-600" />,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      isActive: filters.status === 'New',
      trend: 'Fresh submissions'
    },
    {
      id: 'underReview' as const,
      label: 'Under Review',
      value: metrics.underReview,
      subtext: 'In feasibility analysis',
      icon: <Clock size={18} className="text-amber-600" />,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      isActive: filters.status === 'Under Review',
      trend: 'Editorial committee'
    },
    {
      id: 'planned' as const,
      label: 'Planned',
      value: metrics.planned,
      subtext: 'Scheduled on roadmap',
      icon: <Sparkles size={18} className="text-purple-600" />,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      isActive: filters.status === 'Planned',
      trend: 'Q4 release'
    },
    {
      id: 'inProgress' as const,
      label: 'In Progress',
      value: metrics.inProgress,
      subtext: 'Active tool enhancement',
      icon: <CalendarCheck size={18} className="text-indigo-600" />,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      isActive: filters.status === 'In Progress',
      trend: 'Engineers active'
    },
    {
      id: 'implemented' as const,
      label: 'Implemented',
      value: metrics.implemented,
      subtext: 'Shipped to production',
      icon: <CheckCircle2 size={18} className="text-emerald-600" />,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      isActive: filters.status === 'Implemented',
      trend: 'Live in Studio'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card) => {
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => filterByMetricCard(card.id)}
            className={`flex flex-col text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-150 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              card.isActive
                ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30'
                : 'border-slate-200 hover:border-slate-400 hover:shadow-md bg-white'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-semibold text-slate-600 tracking-tight">{card.label}</span>
              <div className={`p-1.5 rounded-lg ${card.badgeColor}`}>{card.icon}</div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {card.value}
              </span>
            </div>

            <div className="mt-auto">
              <p className="text-[11px] text-slate-500 leading-tight truncate">{card.subtext}</p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                <span>{card.value > 0 ? card.trend : '--'}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
