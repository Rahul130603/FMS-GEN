import React, { useState } from 'react';
import { 
  Filter, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  SearchX, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  Download, 
  X,
  Info,
  RotateCcw
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import ColumnFilterPopover from './ColumnFilterPopover';
import { 
  calculatePending, 
  calculateCompletionRate, 
  calculateTargetAchievement, 
  calculateProductivityScore 
} from '../utils/statusCalculations';
import { DEFAULT_VISIBLE_COLUMNS } from '../data/dailyAllotmentDummyData';

export default function DailyAllotmentTable({
  records,
  filterRecords = [],
  sortBy,
  sortOrder,
  onSortChange,
  columnFilters = {},
  onColumnFilterChange,
  onClearColumnFilter,
  onClearAllColumnFilters,
  totalFilteredCount,
  totalAllRecordsCount,
  onSelectEmployee,
  selectedEmployeeId,
  onResetFilters,
  selectedIds = [],
  onToggleSelect,
  onSelectAllPage,
  visibleColumns = DEFAULT_VISIBLE_COLUMNS,
  onOpenCompare,
  onExportSelected,
  onClearSelection
}) {
  const allPageSelected = records && records.length > 0 && records.every(r => selectedIds.includes(r.id));
  const somePageSelected = records && records.some(r => selectedIds.includes(r.id)) && !allPageSelected;

  const [activePopover, setActivePopover] = useState(null);

  const handleTogglePopover = (colKey, e) => {
    e.stopPropagation();
    setActivePopover(prev => prev === colKey ? null : colKey);
  };

  const handleClosePopover = () => {
    setActivePopover(null);
  };

  const activeFilterCount = Object.entries(columnFilters).filter(([_, v]) => v && v !== 'all').length;
  const hasActiveFilters = activeFilterCount > 0;

  const renderFilterTrigger = (columnKey, title, alignRight = false) => {
    const isFiltered = columnFilters[columnKey] && columnFilters[columnKey] !== 'all';
    const isOpen = activePopover === columnKey;

    return (
      <div className="th-filter-trigger-wrapper" style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
        <button
          type="button"
          className={`th-filter-btn ${isFiltered ? 'is-filtered' : ''}`}
          onClick={(e) => handleTogglePopover(columnKey, e)}
          title={`Filter / Sort ${title}`}
          style={{ cursor: 'pointer' }}
        >
          <Filter size={12} />
          {isFiltered && <span className="filter-active-dot" />}
        </button>

        <ColumnFilterPopover
          columnKey={columnKey}
          title={title}
          isOpen={isOpen}
          onClose={handleClosePopover}
          currentValue={columnFilters[columnKey]}
          sourceRecords={filterRecords}
          onApplyFilter={onColumnFilterChange}
          onClearFilter={onClearColumnFilter}
          currentSortBy={sortBy}
          currentSortOrder={sortOrder}
          onSortChange={onSortChange}
          alignRight={alignRight}
        />
      </div>
    );
  };

  if (!records || records.length === 0) {
    return (
      <div className="table-section-container">
        <div className="empty-state-card">
          <div className="empty-icon-circle">
            <SearchX size={26} />
          </div>
          <h3 className="empty-state-title">No employees found</h3>
          <p className="empty-state-desc">
            No employees match your selected filter parameters or search criteria.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={onResetFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-section-container" style={{ position: 'relative' }}>
      {/* Table Header Bar */}
      <div className="table-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div className="table-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>Employee Daily Allotment</span>
          <span className="table-count-badge">
            {totalFilteredCount !== undefined ? `${totalFilteredCount} Employees` : `${records.length} Employees`}
          </span>
          {hasActiveFilters && (
            <div className="table-filter-status-badge">
              <span>{activeFilterCount} Filter{activeFilterCount > 1 ? 's' : ''} Active</span>
              <button
                type="button"
                className="btn-clear-all-column-filters"
                onClick={onClearAllColumnFilters}
                title="Reset all column filters"
              >
                <RotateCcw size={11} />
                <span>Reset All</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="floating-bulk-bar">
          <div className="bulk-selection-count">
            <strong>{selectedIds.length}</strong> {selectedIds.length === 1 ? 'employee' : 'employees'} selected
          </div>

          <div className="bulk-actions-group">
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={onExportSelected}
              title="Export selected employees as CSV"
            >
              <Download size={13} />
              <span>Export Selected</span>
            </button>

            {selectedIds.length >= 2 && selectedIds.length <= 5 && (
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={onOpenCompare}
                title="Compare selected employees side-by-side"
              >
                <Scale size={13} />
                <span>Compare Employees</span>
              </button>
            )}

            {selectedIds.length > 5 && (
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                (Select 2-5 for side-by-side comparison)
              </span>
            )}

            <button
              type="button"
              className="btn-text-clear"
              onClick={onClearSelection}
              title="Clear employee selection"
            >
              <X size={14} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Responsive Table with Sticky Header */}
      <div className="table-responsive-wrapper" style={{ maxHeight: '680px', overflowY: 'auto' }}>
        <table className="allotment-table">
          <thead className="sticky-table-head">
            <tr>
              {/* Checkbox Column */}
              <th style={{ width: '38px', textAlign: 'center', padding: '12px 8px' }}>
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  ref={el => { if (el) el.indeterminate = somePageSelected; }}
                  onChange={() => onSelectAllPage(records)}
                  title="Select / Deselect all on this page"
                  style={{ cursor: 'pointer' }}
                />
              </th>

              {/* 1. Employee Name */}
              {visibleColumns.employeeName && (
                <th style={{ position: 'relative' }}>
                  <div className="th-filter-content">
                    <span>Employee Name</span>
                    {renderFilterTrigger('employeeName', 'Employee Name')}
                  </div>
                </th>
              )}

              {/* 2. Employee ID */}
              {visibleColumns.employeeId && (
                <th style={{ position: 'relative' }}>
                  <div className="th-filter-content">
                    <span>Emp ID</span>
                    {renderFilterTrigger('employeeId', 'Emp ID')}
                  </div>
                </th>
              )}

              {/* 3. Role */}
              {visibleColumns.role && (
                <th style={{ position: 'relative' }}>
                  <div className="th-filter-content">
                    <span>Role</span>
                    {renderFilterTrigger('role', 'Role')}
                  </div>
                </th>
              )}

              {/* Allocated */}
              {visibleColumns.allocated && (
                <th style={{ textAlign: 'right', position: 'relative' }}>
                  <div className="th-filter-content" style={{ justifyContent: 'flex-end' }}>
                    <span>Allocated</span>
                    {renderFilterTrigger('allocated', 'Allocated')}
                  </div>
                </th>
              )}

              {/* Target */}
              {visibleColumns.dailyTarget && (
                <th style={{ minWidth: '110px', position: 'relative' }}>
                  <div className="th-filter-content">
                    <span>Target</span>
                    {renderFilterTrigger('dailyTarget', 'Target')}
                  </div>
                </th>
              )}

              {/* Completed */}
              {visibleColumns.completed && (
                <th style={{ minWidth: '115px', position: 'relative' }}>
                  <div className="th-filter-content">
                    <span>Completed</span>
                    {renderFilterTrigger('completed', 'Completed')}
                  </div>
                </th>
              )}

              {/* Pending */}
              {visibleColumns.pending && (
                <th style={{ textAlign: 'right', position: 'relative' }}>
                  <div className="th-filter-content" style={{ justifyContent: 'flex-end' }}>
                    <span>Pending</span>
                    {renderFilterTrigger('pending', 'Pending')}
                  </div>
                </th>
              )}

              {/* Rework */}
              {visibleColumns.rework && (
                <th style={{ textAlign: 'right', position: 'relative' }}>
                  <div className="th-filter-content" style={{ justifyContent: 'flex-end' }}>
                    <span>Rework</span>
                    {renderFilterTrigger('rework', 'Rework', true)}
                  </div>
                </th>
              )}

              {/* Productivity Score */}
              {visibleColumns.productivityScore && (
                <th style={{ position: 'relative' }} title="Productivity Score based on work volume and completion">
                  <div className="th-filter-content">
                    <span>Productivity</span>
                    <Info size={11} className="text-slate-400" />
                    {renderFilterTrigger('productivityScore', 'Productivity', true)}
                  </div>
                </th>
              )}

              {/* Status */}
              {visibleColumns.status && (
                <th style={{ position: 'relative' }}>
                  <div className="th-filter-content">
                    <span>Status</span>
                    {renderFilterTrigger('status', 'Status', true)}
                  </div>
                </th>
              )}

              {/* Action */}
              {visibleColumns.action && (
                <th style={{ textAlign: 'center' }}>Action</th>
              )}
            </tr>
          </thead>

          <tbody>
            {(!records || records.length === 0) ? (
              <tr>
                <td colSpan={100} style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <SearchX size={32} className="text-slate-300" />
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>No records found</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>No daily allotment records available for this date.</span>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((emp) => {
              const isSelected = selectedIds.includes(emp.id);
              const pendingSafe = calculatePending(emp.allocated, emp.completed, emp.wip);
              const completionPercent = calculateCompletionRate(emp.completed, emp.allocated);
              const targetAch = calculateTargetAchievement(emp.completed, emp.dailyTarget || emp.allocated);
              const productivity = calculateProductivityScore(emp);

              return (
                <tr key={emp.id} className={`${isSelected ? 'row-selected' : ''} ${selectedEmployeeId === emp.id ? 'row-active' : ''}`}>
                  {/* Checkbox Column */}
                  <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(emp.id)}
                      style={{ cursor: 'pointer' }}
                      title={`Select ${emp.employeeName}`}
                    />
                  </td>

                  {/* Employee Name */}
                  {visibleColumns.employeeName && (
                    <td>
                      <div className="emp-name-cell">
                        <span className="emp-avatar-sm">
                          {emp.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                        <div>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{emp.employeeName}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>{emp.firstDownload ? `Started: ${emp.firstDownload}` : 'Not started'}</div>
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Employee ID */}
                  {visibleColumns.employeeId && (
                    <td>
                      <span className="emp-id-badge">{emp.employeeId}</span>
                    </td>
                  )}

                  {/* Role */}
                  {visibleColumns.role && (
                    <td>
                      <span style={{ fontWeight: '500' }}>{emp.role}</span>
                    </td>
                  )}

                  {/* Allocated */}
                  {visibleColumns.allocated && (
                    <td style={{ textAlign: 'right' }} className="num-cell">
                      <strong>{emp.allocated}</strong>
                    </td>
                  )}

                  {/* Daily Target vs Completed */}
                  {visibleColumns.dailyTarget && (
                    <td>
                      <div className="completion-cell-box" title={`Target: ${emp.dailyTarget || emp.allocated} files (${targetAch.label})`}>
                        <div className="completion-text-row">
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {emp.completed}/{emp.dailyTarget || emp.allocated}
                          </span>
                          <span style={{ fontWeight: '600', fontSize: '11px', color: targetAch.color }}>
                            {targetAch.percent}%
                          </span>
                        </div>
                        <div className="completion-mini-bar">
                          <div
                            className="completion-mini-fill"
                            style={{
                              width: `${Math.min(100, targetAch.percent)}%`,
                              backgroundColor: targetAch.color
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Completed with mini progress indicator */}
                  {visibleColumns.completed && (
                    <td>
                      <div className="completion-cell-box" title={`${completionPercent}% of allocation completed`}>
                        <div className="completion-text-row">
                          <span className="completion-ratio">{emp.completed}</span>
                          <span style={{ fontWeight: '600', color: completionPercent === 100 ? '#059669' : '#475569' }}>
                            {completionPercent}%
                          </span>
                        </div>
                        <div className="completion-mini-bar">
                          <div 
                            className="completion-mini-fill"
                            style={{
                              width: `${Math.min(100, completionPercent)}%`,
                              backgroundColor: completionPercent === 100 ? '#10b981' : completionPercent > 50 ? '#3b82f6' : '#f59e0b'
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Pending */}
                  {visibleColumns.pending && (
                    <td style={{ textAlign: 'right' }} className="num-cell">
                      {pendingSafe > 0 ? (
                        <span style={{ color: '#d97706', fontWeight: '600' }}>{pendingSafe}</span>
                      ) : (
                        <span className="num-cell-muted">0</span>
                      )}
                    </td>
                  )}

                  {/* Rework */}
                  {visibleColumns.rework && (
                    <td style={{ textAlign: 'right' }} className="num-cell">
                      {emp.rework > 0 ? (
                        <span style={{ color: '#dc2626', fontWeight: '700' }} title={`${emp.rework} rework items flagged`}>
                          {emp.rework}
                        </span>
                      ) : (
                        <span className="num-cell-muted">0</span>
                      )}
                    </td>
                  )}

                  {/* Productivity Score */}
                  {visibleColumns.productivityScore && (
                    <td>
                      <div 
                        title={`Productivity Score: ${productivity.score}/100 (${productivity.tier}). Calculated using completion and work activity.`}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <span style={{ fontWeight: '700', color: productivity.color }}>
                          {emp.status === 'No Activity' ? 0 : productivity.score}
                        </span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                          ({emp.status === 'No Activity' ? 'None' : productivity.tier.split(' ')[0]})
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Status Badge */}
                  {visibleColumns.status && (
                    <td>
                      <StatusBadge status={emp.status} />
                    </td>
                  )}

                  {/* Action */}
                  {visibleColumns.action && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-view-details"
                        onClick={() => onSelectEmployee(emp)}
                        title={`View full details for ${emp.employeeName}`}
                      >
                        <span>Details</span>
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
