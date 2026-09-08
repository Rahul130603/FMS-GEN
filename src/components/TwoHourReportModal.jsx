import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock8, 
  Search, 
  ExternalLink, 
  X, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  UserCheck,
  Filter
} from 'lucide-react';
import { 
  getTwoHourTrackingData, 
  CURRENT_REPORT_DATE 
} from '../data/dailyAllotmentDummyData';
import { getEmployeeTwoHourStats } from '../utils/statusCalculations';
import { exportTwoHourReportToExcel } from '../utils/exportUtils';

export default function TwoHourReportModal({
  isOpen,
  selectedSlot,
  onSelectSlot,
  selectedDate,
  records = [],
  onClose,
  onSelectEmployee
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isToday = !selectedDate || selectedDate === CURRENT_REPORT_DATE;

  const trackingData = useMemo(() => {
    return getTwoHourTrackingData(selectedDate);
  }, [selectedDate]);

  const activeSlotData = useMemo(() => {
    return trackingData.find(d => d.slot === selectedSlot) || trackingData[0];
  }, [trackingData, selectedSlot]);

  // Compute individual employee statistics for the selected 2-hour window
  const employeeSlotBreakdown = useMemo(() => {
    if (!activeSlotData) return [];

    return records.map(emp => {
      const stats = getEmployeeTwoHourStats(emp, activeSlotData.timeWindow, isToday);
      return {
        ...emp,
        ...stats
      };
    }).sort((a, b) => b.slotCompleted - a.slotCompleted);
  }, [records, activeSlotData, isToday]);

  // Filtered employee list
  const filteredEmployees = useMemo(() => {
    let list = employeeSlotBreakdown;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(e => 
        e.employeeName.toLowerCase().includes(q) || 
        e.employeeId.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'active') {
      list = list.filter(e => e.slotCompleted > 0);
    } else if (statusFilter === 'met') {
      list = list.filter(e => e.slotStatus === 'Target Met');
    } else if (statusFilter === 'behind') {
      list = list.filter(e => e.slotStatus === 'Behind Pace');
    }

    return list;
  }, [employeeSlotBreakdown, searchQuery, statusFilter]);

  const activeInSlotCount = useMemo(() => {
    return employeeSlotBreakdown.filter(e => e.slotCompleted > 0).length;
  }, [employeeSlotBreakdown]);

  const targetMetCount = useMemo(() => {
    return employeeSlotBreakdown.filter(e => e.slotStatus === 'Target Met').length;
  }, [employeeSlotBreakdown]);

  const handleExportSlotExcel = () => {
    exportTwoHourReportToExcel({
      slotData: [activeSlotData],
      employees: records,
      selectedDate: selectedDate || CURRENT_REPORT_DATE,
      activeSlot: activeSlotData.slot
    });
  };

  const handleExportFullExcel = () => {
    exportTwoHourReportToExcel({
      slotData: trackingData,
      employees: records,
      selectedDate: selectedDate || CURRENT_REPORT_DATE
    });
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Target Met':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'On Track':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'Behind Pace':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'Upcoming':
        return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' };
      default:
        return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' };
    }
  };

  if (!isOpen || !activeSlotData) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 300 }}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '920px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
          background: '#ffffff'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ 
                background: activeSlotData.isFuture ? '#64748b' : '#2563eb', 
                color: '#ffffff', 
                fontSize: '11px', 
                fontWeight: '700', 
                padding: '3px 8px', 
                borderRadius: '4px' 
              }}>
                {activeSlotData.slot}
              </span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                {activeSlotData.timeWindow}
              </h3>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                ({activeSlotData.session})
              </span>
              {activeSlotData.isFuture && (
                <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '10px', fontWeight: '600' }}>
                  ⏳ Future Time Window (Empty)
                </span>
              )}
              {activeSlotData.isCurrent && (
                <span style={{ fontSize: '10px', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>
                  ⚡ Active Live Shift (~2:18 PM)
                </span>
              )}
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#64748b' }}>
              2 Hours Report Tracking • Individual Employee File Breakdown
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Quick Slot Switcher tabs inside modal */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '6px', gap: '3px' }}>
              {trackingData.map(slot => (
                <button
                  key={slot.slot}
                  type="button"
                  onClick={() => onSelectSlot && onSelectSlot(slot.slot)}
                  style={{
                    padding: '4px 9px',
                    fontSize: '11px',
                    fontWeight: activeSlotData.slot === slot.slot ? '700' : '500',
                    color: activeSlotData.slot === slot.slot ? '#ffffff' : '#475569',
                    background: activeSlotData.slot === slot.slot ? '#2563eb' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {slot.slot}
                </button>
              ))}
            </div>

            {/* Export Slot Excel Button */}
            <button
              type="button"
              onClick={handleExportSlotExcel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#059669',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(5, 150, 105, 0.2)'
              }}
              title={`Export ${activeSlotData.slot} employee list to Excel`}
            >
              <FileSpreadsheet size={13} />
              <span>Export Slot Excel</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#475569',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '6px',
                transition: 'all 0.1s ease'
              }}
              title="Close modal (ESC)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Informative Alert for Future Slot (Slot 4: 3.30 PM to 5.30 PM) */}
          {activeSlotData.isFuture && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              marginBottom: '14px',
              color: '#334155',
              fontSize: '12px'
            }}>
              <Clock8 size={20} style={{ color: '#64748b', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#0f172a', fontSize: '13px' }}>Future Production Time Window (3.30 PM to 5.30 PM):</strong>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', lineHeight: '1.5' }}>
                  Current real-time shift is <strong>~2:18 PM</strong> (Slot 3: 12.45 PM to 3.30 PM is active). 
                  This evening closing window has not started yet, so all 40 employee file completions are currently <strong>0</strong>. Production tracking for this window will activate after 3:30 PM.
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics Bar for this Slot */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Window Target</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{activeSlotData.target} files</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Files Completed</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: activeSlotData.isFuture ? '#94a3b8' : '#2563eb' }}>
                {activeSlotData.completed} files
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>QC Approved</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: activeSlotData.isFuture ? '#94a3b8' : '#059669' }}>
                {activeSlotData.qcPassed} files
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Active Employees</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                {activeInSlotCount} of {records.length}
              </div>
            </div>
          </div>

          {/* Search Bar & Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {/* Filter pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  border: statusFilter === 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  background: statusFilter === 'all' ? '#eff6ff' : '#ffffff',
                  color: statusFilter === 'all' ? '#2563eb' : '#64748b',
                  fontWeight: statusFilter === 'all' ? '700' : 'normal',
                  cursor: 'pointer'
                }}
              >
                All ({employeeSlotBreakdown.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  border: statusFilter === 'active' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  background: statusFilter === 'active' ? '#eff6ff' : '#ffffff',
                  color: statusFilter === 'active' ? '#2563eb' : '#64748b',
                  fontWeight: statusFilter === 'active' ? '700' : 'normal',
                  cursor: 'pointer'
                }}
              >
                Active ({activeInSlotCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('met')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  border: statusFilter === 'met' ? '1px solid #059669' : '1px solid #cbd5e1',
                  background: statusFilter === 'met' ? '#ecfdf5' : '#ffffff',
                  color: statusFilter === 'met' ? '#059669' : '#64748b',
                  fontWeight: statusFilter === 'met' ? '700' : 'normal',
                  cursor: 'pointer'
                }}
              >
                Target Met ({targetMetCount})
              </button>
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={13} style={{ position: 'absolute', left: '9px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search employee by name, ID, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  fontSize: '11px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Full Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 2 }}>
                    <th style={{ padding: '10px 14px' }}>Employee</th>
                    <th style={{ padding: '10px 14px' }}>Department & Role</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>2-Hr Completed</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>QC Approved</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Window Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '13px' }}>
                        {activeSlotData.isFuture 
                          ? '⏳ No production in this upcoming window yet (Starts at 3:30 PM).' 
                          : 'No employees match your search or filter for this 2-hour window.'}
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const badge = getStatusBadgeStyle(emp.slotStatus);
                      return (
                        <tr 
                          key={emp.id} 
                          style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Employee Name */}
                          <td style={{ padding: '9px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                              <span style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: '#e0e7ff',
                                color: '#3730a3',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: '700'
                              }}>
                                {emp.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                              <div>
                                <div style={{ fontWeight: '600', color: '#0f172a' }}>{emp.employeeName}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{emp.employeeId}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td style={{ padding: '9px 14px', color: '#475569', fontSize: '11px' }}>
                            <div>{emp.role}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{emp.department}</div>
                          </td>

                          {/* 2-Hour Completed */}
                          <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                            <strong style={{ color: emp.slotCompleted > 0 ? '#2563eb' : '#94a3b8', fontSize: '14px' }}>
                              {emp.slotCompleted}
                            </strong>
                            <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>
                              / {emp.slotTarget} target
                            </span>
                          </td>

                          {/* QC Approved */}
                          <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                            <span style={{ color: emp.slotQcPassed > 0 ? '#059669' : '#94a3b8', fontWeight: '600', fontSize: '13px' }}>
                              {emp.slotQcPassed}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                            <span style={{
                              background: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              display: 'inline-block'
                            }}>
                              {emp.slotStatus}
                            </span>
                          </td>

                          {/* Action */}
                          <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => onSelectEmployee && onSelectEmployee(emp)}
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                color: '#334155',
                                padding: '4px 9px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                              title={`Inspect full docket for ${emp.employeeName}`}
                            >
                              <span>Details</span>
                              <ExternalLink size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <div>
            Showing <strong>{filteredEmployees.length}</strong> of <strong>{records.length}</strong> employees for <strong>{activeSlotData.timeWindow}</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleExportFullExcel}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Download size={13} />
              <span>Download Full 2-Hr Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
