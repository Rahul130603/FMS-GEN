import React, { useState } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import {
  Search,
  SlidersHorizontal,
  X,
  Download,
  Printer,
  FileSpreadsheet,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { FeedbackStatus, FeedbackType, FeedbackCategory } from '../../types/feedback';
import { Priority } from '../../types/common';
import { exportToCSV, exportToJSON, triggerPrint } from '../../utils/exportUtils';
import { TEAM_MEMBERS } from '../../data/initialBooks';

const STATUS_OPTIONS: FeedbackStatus[] = [
  'New',
  'Under Review',
  'Planned',
  'In Progress',
  'Implemented',
  'Rejected',
  'Duplicate'
];

const TYPE_OPTIONS: FeedbackType[] = [
  'Suggestion',
  'Improvement',
  'Feature Request',
  'Process Issue',
  'Usability Feedback'
];

const CATEGORY_OPTIONS: FeedbackCategory[] = [
  'Scanning',
  'POD',
  'EPDF',
  'Accessibility'
];

const MODULE_OPTIONS = [
  'Accessibility Checker',
  'Chapter Manager',
  'TOC Manager',
  'EPUB Compiler',
  'Spine Builder',
  'Metadata Editor',
  'Typesetting Tool',
  'Asset Validator'
];

export const FeedbackFilterBar: React.FC = () => {
  const { filters, updateFilter, clearFilters, filteredFeedback } = useFeedback();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const activeFilterCount = [
    filters.status !== 'All',
    filters.type !== 'All',
    filters.category !== 'All',
    filters.priority !== 'All',
    filters.submittedBy !== 'All',
    filters.relatedModule !== 'All'
  ].filter(Boolean).length;

  const handleExportCSV = () => {
    const exportData = filteredFeedback.map((f) => ({
      'Feedback ID': f.id,
      'Title': f.title,
      'Type': f.type,
      'Category': f.category,
      'Module': f.relatedModule,
      'Priority': f.priority,
      'Impact': f.productionImpact,
      'Status': f.status,
      'Submitted By': f.submittedBy,
      'Submitted Date': f.submittedDate,
      'Owner': f.owner || '',
      'Target Date': f.targetDate || '',
      'Decision': f.decision || ''
    }));
    exportToCSV(exportData, `pubvantage_internal_feedback_${new Date().toISOString().slice(0, 10)}`);
    setIsExportOpen(false);
  };

  const handleExportJSON = () => {
    exportToJSON(filteredFeedback, `pubvantage_internal_feedback_${new Date().toISOString().slice(0, 10)}`);
    setIsExportOpen(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
      {/* Primary Toolbar */}
      <div className="p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search feedback by title, category, book, or submitter..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => updateFilter('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Quick inline filters & actions */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Status Dropdown */}
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value as FeedbackStatus | 'All')}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
            aria-label="Filter by Status"
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {/* Type Dropdown */}
          <select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value as FeedbackType | 'All')}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
            aria-label="Filter by Feedback Type"
          >
            <option value="All">All Types</option>
            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Toggle More Filters */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              showAdvancedFilters || activeFilterCount > 0
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Export */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors"
              aria-expanded={isExportOpen}
            >
              <Download size={13} />
              <span>Export</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                >
                  <FileSpreadsheet size={14} className="text-emerald-600" />
                  <span>Export to CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                >
                  <Download size={14} className="text-blue-600" />
                  <span>Export to JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerPrint();
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 border-t border-slate-100"
                >
                  <Printer size={14} className="text-slate-500" />
                  <span>Print Table</span>
                </button>
              </div>
            )}
          </div>

          {/* Clear button */}
          {(activeFilterCount > 0 || filters.search) && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Reset all filters"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Drawer / Row */}
      {showAdvancedFilters && (
        <div className="p-3 sm:p-4 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in duration-150">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value as FeedbackCategory | 'All')}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Categories</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Related Module */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Related Module</label>
            <select
              value={filters.relatedModule}
              onChange={(e) => updateFilter('relatedModule', e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Modules</option>
              {MODULE_OPTIONS.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => updateFilter('priority', e.target.value as Priority | 'All')}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Submitted By */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Submitted By</label>
            <select
              value={filters.submittedBy}
              onChange={(e) => updateFilter('submittedBy', e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Submitters</option>
              {TEAM_MEMBERS.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name} ({member.team})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
