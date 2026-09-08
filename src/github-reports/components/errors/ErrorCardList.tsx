import React from 'react';
import { useErrors } from '../../context/ErrorContext';
import { ErrorReport } from '../../types/errors';
import { ProjectTypeBadge, PriorityBadge, ErrorStatusBadge } from '../common/Badge';
import { formatDate, getDaysRemaining } from '../../utils/formatters';
import {
  Search,
  Paperclip,
  MessageSquare,
  X,
  Server
} from 'lucide-react';

interface ErrorCardListProps {
  onOpenReportModal: () => void;
}

export const ErrorCardList: React.FC<ErrorCardListProps> = ({ onOpenReportModal }) => {
  const {
    filteredErrors,
    selectedError,
    setSelectedError,
    filters,
    updateFilter,
    sortField,
    sortDirection,
    setSort
  } = useErrors();

  const handleKeyDown = (e: React.KeyboardEvent, error: ErrorReport) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedError(error);
    }
  };

  return (
    <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col min-w-0 h-full overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-2.5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-2.5 shrink-0">
        {/* Compact Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search issues, ISBN, server path..."
            className="w-full pl-8 pr-7 py-1 text-xs bg-white border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => updateFilter('search', '')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Sort & Status summary */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{filteredErrors.length}</span>
            <span className="text-[11px] text-slate-400">issues</span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Sort trigger */}
          <select
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field] = e.target.value.split('-');
              setSort(field);
            }}
            className="text-[11px] font-medium bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="Sort issues"
          >
            <option value="id-desc">Newest First</option>
            <option value="id-asc">Oldest First</option>
            <option value="dueDate-asc">Due Date</option>
            <option value="priority-desc">Priority</option>
            <option value="isbnNumber-asc">ISBN Number</option>
          </select>
        </div>
      </div>

      {/* Issues Stacked List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
        {filteredErrors.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <p className="font-medium text-slate-700">No issues found matching criteria.</p>
            <button
              type="button"
              onClick={onOpenReportModal}
              className="text-indigo-600 hover:underline font-semibold text-xs"
            >
              + Report a new issue
            </button>
          </div>
        ) : (
          filteredErrors.map((err) => {
            const isSelected = selectedError?.id === err.id;
            const dueInfo = getDaysRemaining(err.dueDate);
            const isOverdue = dueInfo.isOverdue && err.status !== 'Resolved' && err.status !== 'Closed' && err.status !== 'Verified';

            return (
              <div
                key={err.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedError(err)}
                onKeyDown={(e) => handleKeyDown(e, err)}
                aria-pressed={isSelected}
                className={`w-full text-left p-3 rounded-md transition-all duration-100 cursor-pointer border relative focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isSelected
                    ? 'bg-indigo-50/40 border-indigo-300 shadow-2xs'
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                {/* Left vertical accent on selected */}
                {isSelected && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-r" />
                )}

                {/* Top Row: ID, Badges */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-indigo-600 hover:underline">
                      {err.id}
                    </span>
                    <ProjectTypeBadge projectType={err.projectType} size="sm" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={err.priority} size="sm" />
                    <ErrorStatusBadge status={err.status} size="sm" />
                  </div>
                </div>

                {/* ISBN Title */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">
                    ISBN: {err.isbnNumber}
                  </h3>
                </div>

                {/* Metadata row: Chapter • Server Location */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-1 truncate">
                  <span className="font-sans font-medium text-slate-700 truncate">{err.chapter}</span>
                  <span>•</span>
                  <span className="text-slate-400 truncate flex items-center gap-0.5" title={err.serverLocation}>
                    <Server size={10} className="shrink-0 text-slate-400" />
                    <span>{err.serverLocation}</span>
                  </span>
                </div>

                {/* Description Snippet */}
                <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                  {err.description}
                </p>

                {/* Bottom Row: Assignee, Due date, Indicators */}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-400">Assigned:</span>
                    <span className="font-semibold text-slate-700 truncate">{err.assignedTo}</span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {err.attachments && err.attachments.length > 0 && (
                      <span className="flex items-center gap-0.5 text-slate-400" title={`${err.attachments.length} attachments`}>
                        <Paperclip size={11} />
                        <span>{err.attachments.length}</span>
                      </span>
                    )}

                    {err.comments && err.comments.length > 0 && (
                      <span className="flex items-center gap-0.5 text-slate-400" title={`${err.comments.length} notes`}>
                        <MessageSquare size={11} />
                        <span>{err.comments.length}</span>
                      </span>
                    )}

                    {err.status === 'Resolved' || err.status === 'Verified' ? (
                      <span className="text-emerald-700 font-medium">
                        Fixed: {formatDate(err.fixedDate || err.dueDate)}
                      </span>
                    ) : (
                      <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500 font-medium'}>
                        Due: {formatDate(err.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
