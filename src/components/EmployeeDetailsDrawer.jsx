import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  BookOpen,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Award
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { 
  calculatePending, 
  calculateCompletionRate, 
  calculateProductivityScore, 
  calculateTargetAchievement
} from '../utils/statusCalculations';
import { WORKFLOW_STAGES } from '../data/dailyAllotmentDummyData';

export default function EmployeeDetailsDrawer({
  employee,
  isOpen,
  onClose,
  onOpenReportModal
}) {
  const [expandedIsbn, setExpandedIsbn] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null;

  const pendingSafe = calculatePending(employee.allocated, employee.completed, employee.wip);
  const completionPercent = calculateCompletionRate(employee.completed, employee.allocated);
  const targetAch = calculateTargetAchievement(employee.completed, employee.dailyTarget || employee.allocated);
  const productivity = calculateProductivityScore(employee);

  // Workflow stages logic
  const currentStageIndex = WORKFLOW_STAGES.indexOf(employee.currentStage || 'WIP');

  // Collect all QC errors from files
  const qcErrorsList = [];
  const reworkFilesList = [];
  (employee.files || []).forEach(f => {
    if (f.reworkCount > 0 || f.status === 'Rework') {
      reworkFilesList.push(f);
    }
    if (f.qcErrors && f.qcErrors.length > 0) {
      f.qcErrors.forEach(err => {
        qcErrorsList.push({ ...err, isbn: f.isbn, title: f.title });
      });
    }
  });

  // Group QC error types for mini bars
  const qcErrorCounts = {};
  qcErrorsList.forEach(err => {
    qcErrorCounts[err.type] = (qcErrorCounts[err.type] || 0) + 1;
  });

  // Calculate 2-hour report file tracking breakdown
  const twoHourSlots = [
    { label: "8.30 AM to 10.30 AM", short: "8.30 - 10.30 AM", slot: "Slot 1" },
    { label: "10.30 AM to 12.45 PM", short: "10.30 AM - 12.45 PM", slot: "Slot 2" },
    { label: "12.45 PM to 3.30 PM", short: "12.45 - 3.30 PM", slot: "Slot 3" },
    { label: "3.30 PM to 5.30 PM", short: "3.30 - 5.30 PM", slot: "Slot 4" }
  ];

  const twoHourCounts = {
    "8.30 AM to 10.30 AM": 0,
    "10.30 AM to 12.45 PM": 0,
    "12.45 PM to 3.30 PM": 0,
    "3.30 PM to 5.30 PM": 0
  };

  (employee.files || []).forEach(f => {
    if (f.status === 'Completed' && f.timeWindow && twoHourCounts[f.timeWindow] !== undefined) {
      twoHourCounts[f.timeWindow]++;
    }
  });

  const sumRecorded = Object.values(twoHourCounts).reduce((a, b) => a + b, 0);
  if (sumRecorded === 0 && employee.completed > 0) {
    const c = employee.completed;
    twoHourCounts["8.30 AM to 10.30 AM"] = Math.round(c * 0.28);
    twoHourCounts["10.30 AM to 12.45 PM"] = Math.round(c * 0.44);
    twoHourCounts["12.45 PM to 3.30 PM"] = Math.max(0, c - twoHourCounts["8.30 AM to 10.30 AM"] - twoHourCounts["10.30 AM to 12.45 PM"]);
    twoHourCounts["3.30 PM to 5.30 PM"] = 0; // Empty / Future window
  }

  const toggleExpandIsbn = (isbn) => {
    setExpandedIsbn(expandedIsbn === isbn ? null : isbn);
  };

  return (
    <>
      <div 
        className="drawer-backdrop" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div 
        className="details-drawer" 
        role="dialog" 
        aria-modal="true" 
        aria-label={`Details for ${employee.employeeName}`}
      >
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-user-info">
            <div className="drawer-avatar-lg">
              {employee.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="drawer-name-role">
              <h2 className="drawer-emp-name">{employee.employeeName}</h2>
              <div className="drawer-emp-meta">
                <span className="emp-id-badge">{employee.employeeId}</span>
                <span>•</span>
                <span>{employee.role}</span>
                <span>•</span>
                <StatusBadge status={employee.status} size="small" />
              </div>
            </div>
          </div>

          <button 
            type="button" 
            className="drawer-close-btn" 
            onClick={onClose}
            aria-label="Close details panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="drawer-body">
          {/* Metadata Grid */}
          <div>
            <div className="drawer-section-title">Assignment Information</div>
            <div className="info-cards-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="info-card-item">
                <span className="item-label">Department</span>
                <span className="item-value">{employee.department}</span>
              </div>
              <div className="info-card-item">
                <span className="item-label">Role</span>
                <span className="item-value">{employee.role}</span>
              </div>
            </div>
          </div>

          {/* Workflow Stage Tracking Stepper */}
          <div>
            <div className="drawer-section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Current Production Workflow</span>
              <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>
                Stage: {employee.currentStage || 'WIP'}
              </span>
            </div>

            <div className="workflow-stepper-box">
              <div className="workflow-steps-track">
                {WORKFLOW_STAGES.map((stage, idx) => {
                  const isCompleted = idx < currentStageIndex || employee.status === 'Completed';
                  const isCurrent = idx === currentStageIndex && employee.status !== 'Completed';

                  return (
                    <div key={stage} className={`workflow-step-node ${isCompleted ? 'step-completed' : ''} ${isCurrent ? 'step-current' : ''}`}>
                      <div className="step-circle">
                        {isCompleted ? <CheckCircle2 size={12} /> : idx + 1}
                      </div>
                      <span className="step-label">{stage}</span>
                    </div>
                  );
                })}
              </div>

              {employee.rework > 0 && (
                <div className="rework-loop-callout">
                  <RefreshCw size={13} className="text-purple-600" />
                  <span>
                    <strong>QC Rework Loop:</strong> {employee.rework} file(s) returned from QC back to WIP revision.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Productivity Score */}
          <div>
            <div className="score-summary-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>
                  Productivity Score
                </span>
                <Award size={16} className="text-blue-600" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: productivity.color, margin: '6px 0 2px' }}>
                {employee.status === 'No Activity' ? 0 : productivity.score} <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}>/ 100</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Rating: <strong style={{ color: productivity.color }}>{employee.status === 'No Activity' ? 'No Activity' : productivity.tier}</strong>
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', borderTop: '1px dashed #e2e8f0', paddingTop: '4px' }}>
                Formula: 75% Completion Rate + 25% Work Activity
              </div>
            </div>
          </div>

          {/* Today's Work Summary Grid */}
          <div>
            <div className="drawer-section-title">Today's Production Allocation</div>
            <div className="summary-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat-metric-box">
                <div className="metric-num" style={{ color: '#0f172a' }}>{employee.allocated}</div>
                <div className="metric-label">Allocated</div>
              </div>
              <div className="stat-metric-box">
                <div className="metric-num" style={{ color: '#2563eb' }}>{employee.dailyTarget || employee.allocated}</div>
                <div className="metric-label">Daily Target</div>
              </div>
              <div className="stat-metric-box">
                <div className="metric-num" style={{ color: '#059669' }}>{employee.completed}</div>
                <div className="metric-label">Completed</div>
              </div>
              <div className="stat-metric-box">
                <div className="metric-num" style={{ color: '#0284c7' }}>{employee.wip}</div>
                <div className="metric-label">In Progress</div>
              </div>
              <div className="stat-metric-box">
                <div className="metric-num" style={{ color: '#d97706' }}>{pendingSafe}</div>
                <div className="metric-label">Pending</div>
              </div>
              <div className="stat-metric-box">
                <div className="metric-num" style={{ color: '#dc2626' }}>{employee.rework}</div>
                <div className="metric-label">Rework Flagged</div>
              </div>
            </div>
          </div>

          {/* Target & Completion Progress Bars */}
          <div className="drawer-progress-box">
            <div className="drawer-progress-header">
              <span>Daily Target vs Completed</span>
              <span style={{ color: targetAch.color, fontWeight: '700' }}>
                {employee.completed} / {employee.dailyTarget || employee.allocated} ({targetAch.percent}% • {targetAch.label})
              </span>
            </div>
            <div className="progress-track" style={{ height: '8px', marginBottom: '14px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, targetAch.percent)}%`,
                  backgroundColor: targetAch.color
                }}
              />
            </div>

            <div className="drawer-progress-header">
              <span>Overall Allocation Progress</span>
              <span style={{ color: completionPercent === 100 ? '#059669' : '#2563eb', fontWeight: '700' }}>
                {completionPercent}% ({employee.completed} of {employee.allocated} files)
              </span>
            </div>
            <div className="progress-track" style={{ height: '8px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, completionPercent)}%`,
                  backgroundColor: completionPercent === 100 ? '#10b981' : completionPercent > 50 ? '#3b82f6' : '#f59e0b'
                }}
              />
            </div>
          </div>

          {/* Production Activity Timestamps */}
          <div>
            <div className="drawer-section-title">Production Activity Timestamps</div>
            <div className="timestamps-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="timestamp-item">
                <span className="timestamp-label">First Access</span>
                <span className="timestamp-val">{employee.firstDownload || '--'}</span>
              </div>
              <div className="timestamp-item">
                <span className="timestamp-label">Last Upload</span>
                <span className="timestamp-val">{employee.lastUpload || '--'}</span>
              </div>
            </div>
          </div>

          {/* 2 Hours Report Tracking - Employee Files Management */}
          <div>
            <div className="drawer-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>2 Hours Report Tracking (Files Completed)</span>
              <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>
                Total: {employee.completed} files
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {twoHourSlots.map(s => {
                const count = twoHourCounts[s.label] || 0;
                const isSlot4 = s.slot === "Slot 4";
                const isSlot3 = s.slot === "Slot 3";
                return (
                  <div key={s.label} style={{ background: isSlot4 ? '#f8fafc' : '#ffffff', border: isSlot4 ? '1px dashed #cbd5e1' : '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                        {s.slot} ({s.short})
                      </span>
                      {isSlot4 && (
                        <span style={{ fontSize: '9px', background: '#e2e8f0', color: '#475569', padding: '1px 5px', borderRadius: '3px', fontWeight: '600' }}>
                          ⏳ UPCOMING
                        </span>
                      )}
                      {isSlot3 && (
                        <span style={{ fontSize: '9px', background: '#eff6ff', color: '#2563eb', padding: '1px 5px', borderRadius: '3px', fontWeight: '600' }}>
                          ⚡ LIVE
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '3px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: count > 0 ? '#2563eb' : '#94a3b8' }}>
                        {count} files
                      </span>
                      <span style={{ fontSize: '10px', color: count > 0 ? '#10b981' : isSlot4 ? '#64748b' : '#94a3b8' }}>
                        {count > 0 ? '✓ Completed' : isSlot4 ? 'Empty (Future)' : '--'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rework & QC Errors Details */}
          {(reworkFilesList.length > 0 || qcErrorsList.length > 0) && (
            <div>
              <div className="drawer-section-title" style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} />
                <span>Rework Defects ({employee.rework} Rework • {qcErrorsList.length} QC Flags)</span>
              </div>

              {/* QC Error Type Distribution */}
              {Object.keys(qcErrorCounts).length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#991b1b', marginBottom: '8px' }}>
                    QC Error Categories:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(qcErrorCounts).map(([type, cnt]) => (
                      <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#7f1d1d' }}>
                        <span>{type}</span>
                        <strong>{cnt} issue(s)</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specific Rework Reasons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {reworkFilesList.map((rf, i) => (
                  <div key={i} style={{ background: '#ffffff', border: '1px solid #fca5a5', borderRadius: '6px', padding: '8px 12px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', color: '#991b1b' }}>
                      <span>ISBN {rf.isbn}</span>
                      <span style={{ fontSize: '11px', background: '#fee2e2', padding: '1px 6px', borderRadius: '4px' }}>Rework</span>
                    </div>
                    <div style={{ color: '#475569', marginTop: '3px' }}>
                      Reason: <em>{rf.reworkReason || 'Quality discrepancy detected during QC inspection'}</em>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Allocated File / ISBN List (Expandable Rows) */}
          <div>
            <div className="drawer-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Allocated Docket Files ({employee.files?.length || 0} ISBNs)</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Click row for file history</span>
            </div>

            <div className="isbn-files-list">
              {employee.files && employee.files.length > 0 ? (
                employee.files.map((file, idx) => {
                  const isExpanded = expandedIsbn === file.isbn;

                  return (
                    <div key={`${file.isbn}-${idx}`} className="isbn-file-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <div 
                        onClick={() => toggleExpandIsbn(file.isbn)} 
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', width: '100%' }}
                      >
                        <div className="file-info-group">
                          <div className="file-isbn-code">
                            <BookOpen size={13} className="text-blue-500" />
                            <span>{file.isbn}</span>
                          </div>
                          <div className="file-title-sub">
                            {file.title} • {file.totalPages} pages
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <StatusBadge status={file.status} size="small" />
                          {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                        </div>
                      </div>

                      {/* Expanded File History Details */}
                      {isExpanded && (
                        <div className="file-expanded-details" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', fontSize: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', color: '#475569', marginBottom: '8px' }}>
                            <div>Stage: <strong>{file.stage}</strong></div>
                            <div>Downloaded: <strong>{file.downloadTime}</strong></div>
                            <div>Uploaded: <strong>{file.uploadTime}</strong></div>
                            <div>Format: <strong>{file.format}</strong></div>
                            <div>Size: <strong>{file.fileSize}</strong></div>
                            <div>Reworks: <strong style={{ color: file.reworkCount > 0 ? '#dc2626' : 'inherit' }}>{file.reworkCount}</strong></div>
                            <div style={{ gridColumn: 'span 3', background: '#eff6ff', border: '1px solid #dbeafe', padding: '4px 8px', borderRadius: '4px', marginTop: '2px' }}>
                              2-Hour Report Window: <strong style={{ color: '#2563eb' }}>{file.timeWindow || '8.30 AM to 10.30 AM'}</strong>
                            </div>
                          </div>

                          {file.reworkReason && (
                            <div style={{ background: '#fef2f2', padding: '6px 8px', borderRadius: '4px', color: '#991b1b', marginBottom: '6px' }}>
                              <strong>Rework Reason:</strong> {file.reworkReason}
                            </div>
                          )}

                          {file.qcErrors && file.qcErrors.length > 0 && (
                            <div style={{ background: '#fffbeb', padding: '6px 8px', borderRadius: '4px', color: '#92400e' }}>
                              <strong>QC Flags:</strong> {file.qcErrors.map(e => `${e.type}: ${e.message}`).join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '12px', padding: '12px 0' }}>
                  No individual files registered for this allotment.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => onOpenReportModal(employee)}
          >
            <ExternalLink size={14} />
            <span>Full Docket Report</span>
          </button>
        </div>
      </div>
    </>
  );
}
