import React from 'react';

const TONE_CLASSES = {
  default: 'text-gray-900 dark:text-gray-50',
  blue: 'text-blue-700 dark:text-blue-400',
  green: 'text-emerald-700 dark:text-emerald-400',
  amber: 'text-amber-700 dark:text-amber-400',
  red: 'text-red-700 dark:text-red-400',
  slate: 'text-slate-600 dark:text-slate-400',
};

export default function StatCard({ label, value, icon: Icon, tone = 'default', hint, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`card p-4 text-left transition-shadow hover:shadow-md ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {Icon && <Icon size={16} className="text-gray-300 dark:text-slate-600" />}
      </div>
      <p className={`mt-1.5 text-2xl font-semibold ${TONE_CLASSES[tone]}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </button>
  );
}
