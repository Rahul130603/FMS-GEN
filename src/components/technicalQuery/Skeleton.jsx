import React from 'react';

export function SkeletonLine({ className = '' }) {
  return <div className={`animate-shimmer rounded ${className}`} />;
}

export function SkeletonTable({ rows = 6, cols = 6 }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((__, c) => (
              <SkeletonLine key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 h-24 space-y-2">
          <SkeletonLine className="h-3 w-1/2" />
          <SkeletonLine className="h-6 w-1/3" />
        </div>
      ))}
    </div>
  );
}
