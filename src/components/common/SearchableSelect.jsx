import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

/**
 * Accessible Searchable Select / Combobox Component
 */
export function SearchableSelect({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Search or select client...',
  allLabel = 'All Clients & Publishers',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = useId();

  // Normalize options array into [{ value, label }]
  const normalizedOptions = React.useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return normalizedOptions;
    }
    const query = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(opt =>
      opt.label.toLowerCase().includes(query) || opt.value.toLowerCase().includes(query)
    );
  }, [normalizedOptions, searchQuery]);

  // Total selectable items (including "All")
  const allItems = React.useMemo(() => {
    return [{ value: '', label: allLabel }, ...filteredOptions];
  }, [allLabel, filteredOptions]);

  // Current selected option label
  const selectedLabel = React.useMemo(() => {
    if (!value) return '';
    const found = normalizedOptions.find(opt => opt.value === value);
    return found ? found.label : value;
  }, [value, normalizedOptions]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < allItems.length) {
          const selected = allItems[highlightedIndex];
          onChange(selected.value);
          setIsOpen(false);
          setSearchQuery('');
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div className={`space-y-1.5 relative ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-700">
          {label}
        </label>
      )}

      {/* Combobox Trigger Button */}
      <div className="relative">
        <button
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          onClick={() => {
            setIsOpen(prev => !prev);
            if (!isOpen) {
              setSearchQuery('');
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          onKeyDown={handleKeyDown}
          className={`w-full text-xs rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-left transition-colors shadow-xs flex items-center justify-between focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${
            isOpen ? 'border-brand-500 ring-1 ring-brand-500' : ''
          }`}
        >
          <span className={`block truncate ${value ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
            {value ? selectedLabel : allLabel}
          </span>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1 pointer-events-none">
            {value && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="pointer-events-auto p-0.5 text-slate-400 hover:text-slate-600 rounded"
                title="Clear selection"
                aria-label="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-brand-600' : ''}`} />
          </div>
        </button>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white p-1 text-xs shadow-elevated border border-slate-200 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Search Input inside popover */}
          <div className="sticky top-0 z-10 bg-white p-1.5 border-b border-slate-100">
            <div className="relative rounded-md">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type to filter..."
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="py-1">
            {allItems.length === 0 ? (
              <div className="py-3 px-3 text-center text-xs text-slate-400">
                No matching clients found
              </div>
            ) : (
              allItems.map((opt, idx) => {
                const isSelected = value === opt.value || (!value && !opt.value);
                const isHighlighted = highlightedIndex === idx;

                return (
                  <div
                    key={opt.value || 'all'}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isHighlighted ? 'bg-brand-50 text-brand-900' : 'text-slate-700 hover:bg-slate-50'
                    } ${isSelected ? 'font-semibold text-brand-700 bg-brand-50/50' : ''}`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0 ml-2" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
