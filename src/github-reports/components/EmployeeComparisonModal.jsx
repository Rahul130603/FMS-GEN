import React from 'react';
import { X, Scale, CheckCircle2, AlertTriangle, Layers, BarChart2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { 
  calculateCompletionRate, 
  calculateProductivityScore 
} from '../utils/statusCalculations';
import StatusBadge from './StatusBadge';

export default function EmployeeComparisonModal({ 
  selectedEmployees, 
  isOpen, 
  onClose,
  onClearSelection 
}) {
  if (!isOpen || !selectedEmployees || selectedEmployees.length === 0) return null;

  // Chart data comparing the selected employees
  const chartData = selectedEmployees.map(emp => {
    const prod = calculateProductivityScore(emp);
    const completion = calculateCompletionRate(emp.completed, emp.allocated);

    return {
      name: emp.employeeName.split(' ')[0],
      fullName: emp.employeeName,
      completionRate: completion,
      productivityScore: prod.score
    };
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-dialog" 
        style={{ width: '920px', maxWidth: '95vw' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="attention-header-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Scale size={18} />
            </div>
            <div>
              <h2 className="modal-title">Employee Performance Comparison</h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                Comparing {selectedEmployees.length} production specialists across allocation, throughput and productivity
              </p>
            </div>
          </div>

          <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Comparative Metrics Chart */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                Score Comparison (% Scale)
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Completion Rate vs Productivity
              </span>
            </div>

            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '6px' }} />
                  <Bar dataKey="completionRate" name="Completion Rate %" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="productivityScore" name="Productivity Score" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Side-by-Side Comparison Table */}
          <div className="table-responsive-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table className="allotment-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ minWidth: '130px' }}>Metric</th>
                  {selectedEmployees.map(emp => (
                    <th key={emp.id} style={{ minWidth: '150px' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{emp.employeeName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>
                        {emp.employeeId} • {emp.role}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600', color: '#475569' }}>Department</td>
                  {selectedEmployees.map(emp => (
                    <td key={emp.id}>{emp.department}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: '600', color: '#475569' }}>Allocated Files</td>
                  {selectedEmployees.map(emp => (
                    <td key={emp.id}><strong>{emp.allocated}</strong></td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: '600', color: '#475569' }}>Daily Target</td>
                  {selectedEmployees.map(emp => (
                    <td key={emp.id}>{emp.dailyTarget || emp.allocated} files</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: '600', color: '#475569' }}>Completed</td>
                  {selectedEmployees.map(emp => (
                    <td key={emp.id} style={{ color: '#059669', fontWeight: '700' }}>
                      {emp.completed} files
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: '600', color: '#475569' }}>WIP / Pending</td>
                  {selectedEmployees.map(emp => (
                    <td key={emp.id}>{emp.wip} WIP • {emp.pending} Pending</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: '600', color: '#475569' }}>Rework Flagged</td>
                  {selectedEmployees.map(emp => (
                    <td key={emp.id} style={{ color: emp.rework > 0 ? '#dc2626' : 'inherit' }}>
                      {emp.rework} Rework ({emp.qcErrors || 0} errors)
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: '600', color: '#475569' }}>Completion Rate</td>
                  {selectedEmployees.map(emp => {
                    const comp = calculateCompletionRate(emp.completed, emp.allocated);
                    return (
                      <td key={emp.id}>
                        <strong style={{ color: comp >= 80 ? '#059669' : comp >= 50 ? '#2563eb' : '#dc2626' }}>
                          {comp}%
                        </strong>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td style={{ fontWeight: '600', color: '#475569' }}>Productivity Score</td>
                  {selectedEmployees.map(emp => {
                    const prod = calculateProductivityScore(emp);
                    return (
                      <td key={emp.id}>
                        <span style={{ fontWeight: '700', color: prod.color }}>
                          {prod.score}/100 ({prod.tier})
                        </span>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td style={{ fontWeight: '600', color: '#475569' }}>Overall Status</td>
                  {selectedEmployees.map(emp => (
                    <td key={emp.id}>
                      <StatusBadge status={emp.status} size="small" />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              onClearSelection();
              onClose();
            }}
          >
            Clear Selection
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
