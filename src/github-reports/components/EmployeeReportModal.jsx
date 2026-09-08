import React from 'react';
import { X, FileText, CheckCircle, Clock, AlertTriangle, Printer, Download } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { calculatePending, calculateCompletionRate } from '../utils/statusCalculations';

export default function EmployeeReportModal({ employee, isOpen, onClose }) {
  if (!isOpen || !employee) return null;

  const pendingSafe = calculatePending(employee.allocated, employee.completed, employee.wip);
  const completionPercent = calculateCompletionRate(employee.completed, employee.allocated);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Employee Production Docket</h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
              Detailed Allotment & Quality Report for {employee.employeeName} ({employee.employeeId})
            </p>
          </div>
          <button type="button" className="drawer-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Header Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{employee.employeeName}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
                {employee.role} • {employee.department}
              </div>
            </div>
            <StatusBadge status={employee.status} />
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Allocated Files</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{employee.allocated}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Completed</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#059669' }}>{employee.completed}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>WIP / In Progress</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>{employee.wip}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Completion %</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: completionPercent === 100 ? '#059669' : '#2563eb' }}>
                {completionPercent}%
              </div>
            </div>
          </div>

          {/* Production Timings & Notes */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
              Production Timings & Throughput
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <div>First Access: <strong>{employee.firstDownload || '--'}</strong></div>
              <div>Latest Batch Upload: <strong>{employee.lastUpload || '--'}</strong></div>
              <div>Rework Count: <strong style={{ color: employee.rework > 0 ? '#dc2626' : 'inherit' }}>{employee.rework}</strong></div>
              <div>Queue Status: <strong>{pendingSafe === 0 ? 'Clear' : `${pendingSafe} pending`}</strong></div>
            </div>
          </div>

          {/* Sample Table of ISBNs */}
          <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
            Allotted ISBN Docket
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '8px 10px' }}>ISBN</th>
                <th style={{ padding: '8px 10px' }}>Title</th>
                <th style={{ padding: '8px 10px' }}>Pages</th>
                <th style={{ padding: '8px 10px' }}>Format</th>
                <th style={{ padding: '8px 10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {employee.files?.slice(0, 5).map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: '600' }}>{f.isbn}</td>
                  <td style={{ padding: '8px 10px' }}>{f.title}</td>
                  <td style={{ padding: '8px 10px' }}>{f.totalPages}</td>
                  <td style={{ padding: '8px 10px' }}>{f.format}</td>
                  <td style={{ padding: '8px 10px' }}><StatusBadge status={f.status} size="small" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {employee.files && employee.files.length > 5 && (
            <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '8px' }}>
              + {employee.files.length - 5} more allocated files in this docket
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => window.print()}
          >
            <Printer size={14} />
            <span>Print Docket</span>
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
