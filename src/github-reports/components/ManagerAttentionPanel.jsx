import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  AlertOctagon,
  RefreshCw,
  UserX
} from 'lucide-react';
import { getManagerAttentionList } from '../utils/statusCalculations';

export default function ManagerAttentionPanel({ records, onSelectEmployee }) {
  const [showAll, setShowAll] = useState(false);
  const attentionList = getManagerAttentionList(records);

  const displayedList = showAll ? attentionList : attentionList.slice(0, 5);

  const getRiskBadge = (level) => {
    switch (level) {
      case 'Critical':
        return {
          icon: AlertOctagon,
          className: 'risk-badge-critical',
          label: 'Critical Attention'
        };
      case 'High':
        return {
          icon: AlertTriangle,
          className: 'risk-badge-high',
          label: 'Action Required'
        };
      default:
        return {
          icon: Clock,
          className: 'risk-badge-medium',
          label: 'Attention'
        };
    }
  };

  return (
    <section className="manager-attention-section" aria-label="Manager Attention">
      <div className="section-header-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="attention-header-icon">
              <AlertTriangle size={18} />
            </div>
            <h2 className="section-title" style={{ margin: 0 }}>Manager Attention</h2>
            <span className="attention-count-badge">{attentionList.length} Flagged</span>
          </div>
          <p className="section-subtitle">Employees requiring immediate production intervention</p>
        </div>

        {attentionList.length > 5 && (
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <span>Show Top 5 Only</span>
                <ChevronUp size={13} />
              </>
            ) : (
              <>
                <span>View All ({attentionList.length})</span>
                <ChevronDown size={13} />
              </>
            )}
          </button>
        )}
      </div>

      {(!records || records.length === 0) ? (
        <div className="attention-empty-card" style={{ color: '#64748b' }}>
          <div className="attention-empty-text">
            <strong>No data available</strong>
            <span>No employee records found for this date.</span>
          </div>
        </div>
      ) : attentionList.length === 0 ? (
        <div className="attention-empty-card">
          <CheckCircle2 size={24} className="text-emerald-500" />
          <div className="attention-empty-text">
            <strong>Great! No employees currently require immediate attention.</strong>
            <span>All allocations are progressing smoothly without production bottlenecks.</span>
          </div>
        </div>
      ) : (
        <div className="attention-cards-grid">
          {displayedList.map((emp) => {
            const risk = getRiskBadge(emp.riskLevel);
            const RiskIcon = risk.icon;

            return (
              <div key={emp.id} className="attention-card">
                <div className="attention-card-top">
                  <div className="attention-user-details">
                    <span className="attention-emp-avatar">
                      {emp.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                    <div>
                      <div className="attention-emp-name">{emp.employeeName}</div>
                      <div className="attention-emp-meta">
                        <span>{emp.employeeId}</span>
                        <span>•</span>
                        <span>{emp.role}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`risk-pill ${risk.className}`}>
                    <RiskIcon size={12} />
                    {risk.label}
                  </span>
                </div>

                <div className="attention-reason-box">
                  <span className="attention-reason-label">Issue / Trigger:</span>
                  <span className="attention-reason-text">{emp.reason}</span>
                </div>

                <div className="attention-card-stats">
                  <div className="attention-stat-col">
                    <span className="stat-label">Allocated</span>
                    <span className="stat-val">{emp.allocated} Files</span>
                  </div>
                  <div className="attention-stat-col">
                    <span className="stat-label">Completed</span>
                    <span className="stat-val" style={{ color: emp.completed > 0 ? '#10b981' : '#64748b' }}>
                      {emp.completed} ({emp.completionRate}%)
                    </span>
                  </div>
                  <div className="attention-stat-col">
                    <span className="stat-label">Pending</span>
                    <span className="stat-val" style={{ color: '#d97706' }}>
                      {Math.max(0, emp.allocated - emp.completed)} Files
                    </span>
                  </div>
                </div>

                <div className="attention-card-footer">
                  <div className="attention-tag-group">
                    <span className="badge-tag">{emp.department || 'Production'}</span>
                    {emp.rework > 0 && (
                      <span className="badge-tag tag-rework">
                        <RefreshCw size={10} />
                        {emp.rework} Rework
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-view-attention"
                    onClick={() => onSelectEmployee(emp)}
                    title={`Open full drawer for ${emp.employeeName}`}
                  >
                    <span>View Employee</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
