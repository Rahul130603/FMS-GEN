import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, max = 5, size = 'md', showValue = true, interactive = false, onChange = null }) {
  const sizeMap = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const numRating = Math.round(Number(rating) * 10) / 10;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, idx) => {
          const starValue = idx + 1;
          const isFilled = starValue <= Math.round(numRating);
          return (
            <button
              key={idx}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starValue)}
              className={`${interactive ? 'cursor-pointer hover:scale-125 transition-transform' : 'cursor-default'} focus:outline-none`}
            >
              <Star
                className={`${currentSize} ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_1px_4px_rgba(251,191,36,0.4)]'
                    : 'text-slate-300 dark:text-slate-600 fill-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
          {numRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

