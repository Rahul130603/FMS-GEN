import React from 'react';
import { useErrors } from '../../context/ErrorContext';
import { useFeedback } from '../../context/FeedbackContext';
import { INITIAL_BOOKS } from '../../data/initialBooks';
import {
  BookOpen,
  AlertTriangle,
  MessageSquarePlus,
  CheckCircle2,
  Cpu,
  Flame,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp
} from 'lucide-react';
import { NavRoute } from '../layout/Sidebar';
import { ProjectTypeBadge, PriorityBadge, ErrorStatusBadge, FeedbackStatusBadge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';

interface DashboardPageProps {
  onNavigate: (route: NavRoute) => void;
  onNewError: () => void;
  onNewFeedback: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onNewError,
  onNewFeedback
}) => {
  const { errors, metrics: errorMetrics, setSelectedError } = useErrors();
  const { feedback, metrics: feedbackMetrics, setSelectedFeedback } = useFeedback();

  const recentErrors = errors.slice(0, 5);
  const recentFeedback = feedback.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-3">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>EPUB 3.2 Conformance Engine • Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Book Publishing & Production Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Centralized workspace for reflowable & fixed-layout EPUB production, automated EpubCheck validation, WCAG 2.1 accessibility auditing, issue resolution, and team feedback.
          </p>

          <div className="flex items-center flex-wrap gap-3 mt-5">
            <button
              type="button"
              onClick={() => onNavigate('error-reports')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <AlertTriangle size={14} />
              <span>Track Error Reports ({errorMetrics.open} Open)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('internal-feedback')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <MessageSquarePlus size={14} />
              <span>Internal Feedback Hub</span>
            </button>
          </div>
        </div>

        {/* Decorative background grid */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Cpu size={240} />
        </div>
      </div>

      {/* Production Health Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Active Titles</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{INITIAL_BOOKS.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp size={12} />
            <span>4 in final QA stage</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">High Priority Issues</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{errorMetrics.highPriority}</div>
          <div className="text-[11px] text-slate-400 mt-1">Production blockers</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Resolved Errors</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{errorMetrics.resolved}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Passed validation check</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Internal Ideas</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{feedbackMetrics.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">{feedbackMetrics.planned} planned for roadmap</div>
        </div>
      </div>

      {/* 2-Column Section: Recent Error Reports & Recent Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Reports Widget */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900">Active Error Reports</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('error-reports')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View all ({errors.length})</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentErrors.map((err) => (
              <div
                key={err.id}
                onClick={() => {
                  setSelectedError(err);
                  onNavigate('error-reports');
                }}
                className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-600">{err.id}</span>
                    <ProjectTypeBadge projectType={err.projectType} size="sm" />
                    <span className="font-semibold text-slate-800 truncate">ISBN: {err.isbnNumber}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {err.chapter} • <span className="font-mono text-slate-400">{err.serverLocation}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PriorityBadge priority={err.priority} />
                  <ErrorStatusBadge status={err.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Internal Feedback Widget */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquarePlus size={16} className="text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Latest Internal Feedback</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('internal-feedback')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View all ({feedback.length})</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentFeedback.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedFeedback(item);
                  onNavigate('internal-feedback');
                }}
                className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-600">{item.id}</span>
                    <span className="font-semibold text-slate-800 truncate">{item.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    By {item.submittedBy} • {item.category}
                  </div>
                </div>
                <div className="shrink-0">
                  <FeedbackStatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
