import React from 'react';
import { useErrors, SavedViewType } from '../../context/ErrorContext';
import {
  Inbox,
  UserCheck,
  Flame,
  AlertCircle,
  Clock,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { TEAM_MEMBERS } from '../../data/initialBooks';
import { ErrorStatus, ProjectType } from '../../types/errors';
import { Priority } from '../../types/common';

const PROJECT_TYPE_OPTIONS: ProjectType[] = ['Scan', 'POD', 'EPDF', 'Accessibility'];

export const ErrorViewsSidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    viewCounts,
    filters,
    updateFilter,
    clearFilters
  } = useErrors();

  const views: { id: SavedViewType; label: string; icon: any; count: number; color?: string }[] = [
    { id: 'all', label: 'All Issues', icon: Inbox, count: viewCounts.all },
    { id: 'my_issues', label: 'My Issues', icon: UserCheck, count: viewCounts.my_issues },
    { id: 'high_priority', label: 'High Priority', icon: Flame, count: viewCounts.high_priority, color: 'text-rose-600' },
    { id: 'open', label: 'Open', icon: AlertCircle, count: viewCounts.open, color: 'text-sky-600' },
    { id: 'overdue', label: 'Overdue', icon: Clock, count: viewCounts.overdue, color: 'text-amber-600' },
    { id: 'resolved', label: 'Recently Resolved', icon: CheckCircle2, count: viewCounts.resolved, color: 'text-emerald-600' }
  ];

  const hasActiveFilters =
    filters.projectType !== 'All' ||
    filters.priority !== 'All' ||
    filters.status !== 'All' ||
    filters.assignedTo !== 'All' ||
    filters.reportedBy !== 'All' ||
    filters.search !== '';

  return (
    <aside className="w-full lg:w-[220px] bg-white rounded-lg border border-slate-200 shadow-2xs p-3 flex flex-col justify-between shrink-0 text-xs">
      <div className="space-y-4">
        {/* Section 1: Views */}
        <div>
          <div className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Views
          </div>
          <nav className="space-y-0.5" aria-label="Issue Views">
            {views.map((v) => {
              const isSelected = activeView === v.id;
              const IconComp = v.icon;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveView(v.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md font-medium transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <IconComp
                      size={14}
                      className={isSelected ? 'text-white' : v.color || 'text-slate-500'}
                    />
                    <span className="truncate">{v.label}</span>
                  </div>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-slate-800 text-slate-200 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {v.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100" />

        {/* Section 2: Filters */}
        <div className="space-y-2">
          <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" title="Filters active" />
            )}
          </div>

          <div className="space-y-2">
            {/* Book / Project */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 px-2 mb-0.5">
                Book / Project
              </label>
              <select
                value={filters.projectType}
                onChange={(e) => updateFilter('projectType', e.target.value as ProjectType | 'All')}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 truncate"
              >
                <option value="All">All Projects</option>
                {PROJECT_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 px-2 mb-0.5">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => updateFilter('priority', e.target.value as Priority | 'All')}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 px-2 mb-0.5">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value as ErrorStatus | 'All')}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Verified">Verified</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 px-2 mb-0.5">
                Assigned To
              </label>
              <select
                value={filters.assignedTo}
                onChange={(e) => updateFilter('assignedTo', e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 truncate"
              >
                <option value="All">All Members</option>
                {TEAM_MEMBERS.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Reset Action */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-slate-100 mt-4">
          <button
            type="button"
            onClick={clearFilters}
            className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
          >
            <RotateCcw size={12} />
            <span>Clear all filters</span>
          </button>
        </div>
      )}
    </aside>
  );
};
