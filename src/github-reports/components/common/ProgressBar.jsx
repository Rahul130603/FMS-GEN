import React from 'react';

/**
 * Visual Progress Bar with Percentage and accessible ARIA attributes
 */
export function ProgressBar({ value = 0, max = 100, showLabel = true, size = 'md' }) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  let barColor = 'bg-brand-600';
  if (percentage === 100) {
    barColor = 'bg-emerald-500';
  } else if (percentage >= 75) {
    barColor = 'bg-blue-600';
  } else if (percentage >= 40) {
    barColor = 'bg-indigo-600';
  } else if (percentage > 0) {
    barColor = 'bg-amber-500';
  } else {
    barColor = 'bg-slate-300';
  }

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="w-full flex items-center gap-2.5">
      <div 
        className={`flex-1 bg-slate-200/80 rounded-full overflow-hidden ${heightClass}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Project progress: ${percentage}%`}
      >
        <div
          className={`${heightClass} ${barColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-700 min-w-[2.5rem] text-right font-mono">
          {percentage}%
        </span>
      )}
    </div>
  );
}
