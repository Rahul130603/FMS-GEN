import React, { useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { formatDateForExcel } from '../../utils/exportExcel';

/**
 * Accessible Calendar Date Picker Input with DD-MM-YYYY display
 */
export function DatePickerInput({
  label,
  id,
  value, // YYYY-MM-DD
  onChange,
  placeholder = 'dd-mm-yyyy',
  className = ''
}) {
  const inputRef = useRef(null);

  // Format ISO value (YYYY-MM-DD) to readable DD-MM-YYYY for display
  const displayFormattedDate = value ? formatDateForExcel(value) : '';

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const openPicker = () => {
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker();
      } else {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-700">
          {label}
        </label>
      )}

      <div
        onClick={openPicker}
        className="relative rounded-lg shadow-xs cursor-pointer group"
      >
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 group-hover:text-brand-600 transition-colors">
          <Calendar className="w-3.5 h-3.5" />
        </div>

        {/* Display input overlay for clean DD-MM-YYYY presentation */}
        <input
          type="text"
          readOnly
          id={`${id}-display`}
          value={displayFormattedDate}
          placeholder={placeholder}
          tabIndex={-1}
          className="w-full text-xs rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-8 text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors cursor-pointer select-none font-medium"
        />

        {/* Hidden native date picker input for accessibility and full cross-browser calendar dialog */}
        <input
          ref={inputRef}
          type="date"
          id={id}
          name={id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          aria-label={label || 'Select date'}
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 z-20"
            title="Clear date"
            aria-label="Clear selected date"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}


