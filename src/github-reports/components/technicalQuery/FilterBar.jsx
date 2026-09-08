import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

/**
 * Renders a row of <select>/<input> filter controls from a declarative
 * config, plus a "clear all" affordance. Used identically by the Admin
 * grid and every Reports screen so filtering behaves consistently.
 *
 * fields: [{ key, label, type: 'select'|'text'|'date'|'number', options?: [{value,label}] }]
 */
export default function FilterBar({ fields, values, onChange, onClear }) {
  const hasActiveFilters = Object.values(values || {}).some((v) => v !== '' && v !== undefined && v !== null);

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/40">
      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
        <SlidersHorizontal size={14} /> Filters
      </span>
      {fields.map((field) => (
        <div key={field.key} className="min-w-[9rem]">
          {field.type === 'select' ? (
            <select
              value={values[field.key] || ''}
              onChange={(e) => onChange({ [field.key]: e.target.value })}
              className="input !py-1.5 text-sm"
            >
              <option value="">{field.label}</option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type || 'text'}
              value={values[field.key] || ''}
              onChange={(e) => onChange({ [field.key]: e.target.value })}
              placeholder={field.label}
              className="input !py-1.5 text-sm"
            />
          )}
        </div>
      ))}
      {hasActiveFilters && (
        <button onClick={onClear} className="flex items-center gap-1 text-xs text-brand-700 dark:text-brand-400 hover:underline ml-1">
          <X size={13} /> Clear all
        </button>
      )}
    </div>
  );
}
