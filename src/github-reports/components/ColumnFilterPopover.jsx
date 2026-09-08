import React, { useState, useEffect, useRef } from 'react';
import { 
  Filter, 
  Search, 
  Check, 
  X, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw 
} from 'lucide-react';

const FILTER_CONFIGS = {
  employeeName: {
    type: 'search',
    placeholder: 'Filter by employee name...',
  },
  employeeId: {
    type: 'search',
    placeholder: 'Search ID (e.g. EMP019)...',
  },
  role: {
    type: 'options',
    options: [
      { label: 'All Roles', value: 'all' },
      { label: 'POD Developer', value: 'POD Developer' },
      { label: 'Cover Developer', value: 'Cover Developer' },
      { label: 'QC', value: 'QC' },
      { label: 'QAG', value: 'QAG' }
    ]
  },
  allocated: {
    type: 'options',
    options: [
      { label: 'All Allocations', value: 'all' },
      { label: 'High (> 25 files)', value: 'high' },
      { label: 'Medium (15 - 25 files)', value: 'mid' },
      { label: 'Low (< 15 files)', value: 'low' }
    ]
  },
  dailyTarget: {
    type: 'options',
    options: [
      { label: 'All Targets', value: 'all' },
      { label: 'Target Achieved (≥ 100%)', value: 'met' },
      { label: 'On Track (70% - 99%)', value: 'ontrack' },
      { label: 'Behind Target (< 70%)', value: 'behind' }
    ]
  },
  completed: {
    type: 'options',
    options: [
      { label: 'All Completed', value: 'all' },
      { label: 'High (> 15 files)', value: 'high' },
      { label: 'In Progress (1 - 15 files)', value: 'mid' },
      { label: 'Zero Completed (0 files)', value: 'zero' }
    ]
  },
  pending: {
    type: 'options',
    options: [
      { label: 'All Pending', value: 'all' },
      { label: 'Has Pending (> 0 files)', value: 'has' },
      { label: 'High Pending (> 10 files)', value: 'high' },
      { label: 'Zero Pending (0 files)', value: 'zero' }
    ]
  },
  rework: {
    type: 'options',
    options: [
      { label: 'All Rework', value: 'all' },
      { label: 'Has Rework (> 0 files)', value: 'has' },
      { label: 'High Rework (≥ 3 files)', value: 'high' },
      { label: 'No Rework (0 files)', value: 'zero' }
    ]
  },
  productivityScore: {
    type: 'options',
    options: [
      { label: 'All Scores', value: 'all' },
      { label: 'High Productivity (≥ 80)', value: 'high' },
      { label: 'Average (50 - 79)', value: 'avg' },
      { label: 'Low Productivity (< 50)', value: 'low' }
    ]
  },
  status: {
    type: 'options',
    options: [
      { label: 'All Statuses', value: 'all' },
      { label: 'WIP (Work In Progress)', value: 'WIP' },
      { label: 'Completed', value: 'Completed' },
      { label: 'On Track', value: 'On Track' },
      { label: 'Delayed', value: 'Delayed' },
      { label: 'Overdue', value: 'Overdue' },
      { label: 'Rework Flagged', value: 'Rework' },
      { label: 'No Activity', value: 'No Activity' }
    ]
  }
};

export default function ColumnFilterPopover({
  columnKey,
  title,
  isOpen,
  onClose,
  currentValue,
  sourceRecords = [],
  onApplyFilter,
  onClearFilter,
  currentSortBy,
  currentSortOrder,
  onSortChange,
  alignRight = false
}) {
  const popoverRef = useRef(null);
  const config = FILTER_CONFIGS[columnKey];
  const [tempSearch, setTempSearch] = useState(
    config?.type === 'search' ? (currentValue || '') : ''
  );

  useEffect(() => {
    setTempSearch(config?.type === 'search' ? (currentValue || '') : '');
  }, [currentValue, config?.type]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !config) return null;

  const isFilterActive = currentValue && currentValue !== 'all';
  const isSortedThisCol = currentSortBy === columnKey;
  const searchText = tempSearch.trim().toLowerCase();
  const suggestions = config.type === 'search'
    ? [...new Set(sourceRecords
        .map((record) => record[columnKey])
        .filter(Boolean))]
      .filter((value) => value.toLowerCase().includes(searchText))
      .slice(0, 8)
      .map((value) => ({ label: value, value }))
    : config.options.filter((option) =>
        option.label.toLowerCase().includes(searchText) ||
        option.value.toLowerCase().includes(searchText)
      );

  const handleOptionClick = (val) => {
    onApplyFilter(columnKey, val);
    onClose();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (config.type !== 'search') return;
    onApplyFilter(columnKey, tempSearch);
    onClose();
  };

  return (
    <div 
      ref={popoverRef}
      className={`column-filter-popover ${alignRight ? 'align-right' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="filter-popover-header">
        <div className="filter-popover-title">
          <Filter size={12} className="text-blue-600 inline mr-1" />
          Filter: {title}
        </div>
        <button 
          type="button" 
          className="filter-popover-close" 
          onClick={onClose}
          title="Close filter menu"
        >
          <X size={14} />
        </button>
      </div>

      {/* Filter Body */}
      <form onSubmit={handleSearchSubmit} className="filter-search-form">
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <Search size={14} style={{ position: 'absolute', left: '8px', top: '9px', color: '#94a3b8' }} />
          <input
            type="text"
            className="filter-search-input"
            style={{ paddingLeft: '28px' }}
            placeholder={config.placeholder || `Search ${title} options...`}
            value={tempSearch}
            onChange={(e) => setTempSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="filter-options-list filter-suggestions-list" role="listbox" aria-label={`${title} suggestions`}>
          {suggestions.length > 0 ? suggestions.map((option) => {
            const isSelected = (currentValue || (config.type === 'options' ? 'all' : '')) === option.value;
            return (
              <button
                type="button"
                key={option.value}
                className={`filter-option-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleOptionClick(option.value)}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={14} className="text-blue-600" />}
              </button>
            );
          }) : (
            <div className="filter-no-options">No matching options</div>
          )}
        </div>

        {config.type === 'search' && (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            {tempSearch && <button type="button" className="btn-filter-clear" onClick={() => setTempSearch('')}>Clear</button>}
            <button type="submit" className="btn-filter-apply">Apply Filter</button>
          </div>
        )}
      </form>

      {/* Quick Sort Section inside Filter Popover */}
      <div className="filter-sort-section">
        <div className="filter-section-subtitle">Sort Direction</div>
        <div className="filter-sort-buttons">
          <button
            type="button"
            className={`btn-filter-sort ${isSortedThisCol && currentSortOrder === 'asc' ? 'active' : ''}`}
            onClick={() => {
              onSortChange(columnKey, 'asc');
              onClose();
            }}
          >
            <ArrowUp size={12} />
            <span>{columnKey === 'employeeName' || columnKey === 'role' ? 'A → Z' : 'Low → High'}</span>
          </button>
          <button
            type="button"
            className={`btn-filter-sort ${isSortedThisCol && (currentSortOrder === 'desc' || currentSortOrder === 'reverse-priority') ? 'active' : ''}`}
            onClick={() => {
              if (columnKey === 'status') {
                onSortChange(columnKey, 'reverse-priority');
              } else {
                onSortChange(columnKey, 'desc');
              }
              onClose();
            }}
          >
            <ArrowDown size={12} />
            <span>{columnKey === 'employeeName' || columnKey === 'role' ? 'Z → A' : 'High → Low'}</span>
          </button>
        </div>
      </div>

      {/* Footer Reset */}
      {isFilterActive && (
        <div className="filter-popover-footer">
          <button
            type="button"
            className="btn-filter-clear"
            style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => {
              onClearFilter(columnKey);
              onClose();
            }}
          >
            <RotateCcw size={12} />
            <span>Reset {title} Filter</span>
          </button>
        </div>
      )}
    </div>
  );
}
