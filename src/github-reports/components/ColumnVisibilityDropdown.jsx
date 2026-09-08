import React, { useState, useRef, useEffect } from 'react';
import { Columns3, Check, RotateCcw } from 'lucide-react';
import { ALL_COLUMNS } from '../data/dailyAllotmentDummyData';

export default function ColumnVisibilityDropdown({ 
  visibleColumns, 
  onToggleColumn, 
  onResetColumns 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="export-dropdown-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="btn-secondary text-xs"
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle table column visibility"
      >
        <Columns3 size={14} />
        <span>Columns</span>
      </button>

      {isOpen && (
        <div className="columns-menu" style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          width: '230px',
          padding: '10px',
          zIndex: 60,
          maxHeight: '340px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>
              Toggle Columns
            </span>
            <button
              type="button"
              onClick={onResetColumns}
              style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <RotateCcw size={11} />
              Reset
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {ALL_COLUMNS.map((col) => {
              const isChecked = visibleColumns[col.key] !== false;
              return (
                <label
                  key={col.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: col.required ? '#94a3b8' : '#334155',
                    cursor: col.required ? 'not-allowed' : 'pointer',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={col.required}
                    onChange={() => onToggleColumn(col.key)}
                    style={{ cursor: col.required ? 'not-allowed' : 'pointer' }}
                  />
                  <span>{col.label}</span>
                  {col.required && <span style={{ fontSize: '10px', color: '#94a3b8' }}>(locked)</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
