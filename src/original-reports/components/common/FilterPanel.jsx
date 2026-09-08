import React, { useState } from 'react';
import { Filter, RotateCcw, Search, Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';

/**
 * Modern Filter Panel with responsive layout, field inputs, active badges, and Apply / Reset buttons
 */
export function FilterPanel({
  filters,
  onFilterChange,
  onApply,
  onReset,
  children,
  activeFilterCount = 0,
  title = 'Filters & Search'
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-brand-50 rounded-md text-brand-700">
            <Filter className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            {title}
            {activeFilterCount > 0 && (
              <span className="bg-brand-100 text-brand-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount} {activeFilterCount === 1 ? 'filter applied' : 'filters applied'}
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              type="button"
              className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            type="button"
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filter Body */}
      {isExpanded && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onApply();
          }}
          className="p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {children}
          </div>

          {/* Action Bar */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 active:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              Apply Filter
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/**
 * Filter Form Input Helper Components
 */
export function FilterInput({ label, id, value, onChange, placeholder, icon: Icon, type = 'text' }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-slate-700">
        {label}
      </label>
      <div className="relative rounded-lg shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
        <input
          type={type}
          id={id}
          name={id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full text-xs rounded-lg border border-slate-300 bg-white py-2 ${
            Icon ? 'pl-8' : 'pl-3'
          } pr-3 text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors`}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export function FilterSelect({ label, id, value, onChange, options = [], allLabel = 'All Options' }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-slate-700">
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors shadow-xs"
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
    </div>
  );
}


