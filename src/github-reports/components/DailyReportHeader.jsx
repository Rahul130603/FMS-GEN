import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  RotateCw, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  ChevronDown, 
  Scale,
  CalendarDays
} from 'lucide-react';
import { formatDisplayDate } from '../data/dailyAllotmentDummyData';

export default function DailyReportHeader({
  selectedDate = '2026-09-05',
  onDateChange,
  maxDate = '2026-09-05',
  onRefresh,
  isRefreshing,
  lastUpdated,
  onExportCsv,
  onExportExcel,
  selectedCount = 0,
  onOpenCompare
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const dropdownRef = useRef(null);
  const dateInputRef = useRef(null);

  const isToday = selectedDate === maxDate;

  const handleOpenCalendar = (e) => {
    if (e.target === dateInputRef.current) return;
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
        } catch {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="allotment-page-header">
      <div className="header-left">
        <h1 className="page-title">
          Daily Allotment Status
        </h1>
        <p className="page-subtitle">
          Track employee file allocation, production progress, and completion status.
        </p>
      </div>

      <div className="header-right">
        {lastUpdated && (
          <div className="last-refreshed-badge">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isToday ? '#10b981' : '#f59e0b', display: 'inline-block' }} />
            <span>{isToday ? `Last updated: ${lastUpdated}` : `Report archived: ${lastUpdated}`}</span>
          </div>
        )}

        {/* Interactive Calendar Date Picker */}
        <div className="header-date-picker-group">
          <div 
            className="header-date-picker-box" 
            title="Click to open calendar and view past or current reports"
            onClick={handleOpenCalendar}
          >
            <Calendar size={15} className="text-blue-600" />
            <span className="header-date-text">{formatDisplayDate(selectedDate)}</span>
            <ChevronDown size={13} className="text-slate-400" />
            <input
              ref={dateInputRef}
              type="date"
              className="header-date-hidden-input"
              value={selectedDate}
              max={maxDate}
              onChange={(e) => {
                if (e.target.value && onDateChange) {
                  onDateChange(e.target.value);
                }
              }}
              title="Click to select any report date"
            />
          </div>

          {!isToday && (
            <button
              type="button"
              className="btn-today-shortcut"
              onClick={() => onDateChange && onDateChange(maxDate)}
              title="Return to today's live report"
            >
              Today
            </button>
          )}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          className="btn-secondary"
          onClick={onRefresh}
          disabled={isRefreshing}
          title={isToday ? "Refresh Live Data" : "Reload this Date's Report"}
        >
          <RotateCw size={13} className={isRefreshing ? 'animate-spin' : ''} style={isRefreshing ? { animation: 'spin 1s linear infinite' } : {}} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>

        {/* Compare Employees Button */}
        {selectedCount >= 2 && (
          <button
            type="button"
            className="btn-secondary text-blue-600 border-blue-200 bg-blue-50"
            onClick={onOpenCompare}
            title={`Compare ${selectedCount} selected employees`}
          >
            <Scale size={14} />
            <span>Compare ({selectedCount})</span>
          </button>
        )}

        {/* Export Report Dropdown */}
        <div className="export-dropdown-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowExportMenu(!showExportMenu)}
            aria-expanded={showExportMenu}
          >
            <Download size={14} />
            <span>Export</span>
            <ChevronDown size={14} />
          </button>

          {showExportMenu && (
            <div className="export-menu" style={{ width: '210px' }}>
              <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>
                CSV Format
              </div>
              <button
                type="button"
                className="export-menu-item"
                onClick={() => {
                  setShowExportMenu(false);
                  onExportCsv('current');
                }}
              >
                <FileText size={14} className="text-blue-600" />
                <span>Export Current View</span>
              </button>
              {selectedCount > 0 && (
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportCsv('selected');
                  }}
                >
                  <FileText size={14} className="text-blue-600" />
                  <span>Export Selected ({selectedCount})</span>
                </button>
              )}
              <button
                type="button"
                className="export-menu-item"
                onClick={() => {
                  setShowExportMenu(false);
                  onExportCsv('all');
                }}
              >
                <FileText size={14} className="text-blue-600" />
                <span>Export All Records</span>
              </button>

              <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', borderTop: '1px solid #f1f5f9', marginTop: '4px' }}>
                Excel Format (.xls)
              </div>
              <button
                type="button"
                className="export-menu-item"
                onClick={() => {
                  setShowExportMenu(false);
                  onExportExcel('current');
                }}
              >
                <FileSpreadsheet size={14} className="text-emerald-600" />
                <span>Export Current View</span>
              </button>
              {selectedCount > 0 && (
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportExcel('selected');
                  }}
                >
                  <FileSpreadsheet size={14} className="text-emerald-600" />
                  <span>Export Selected ({selectedCount})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
