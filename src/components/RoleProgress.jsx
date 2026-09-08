import React from 'react';
import { Layers } from 'lucide-react';
import { calculateRoleProgress } from '../utils/statusCalculations';

export default function RoleProgress({ records }) {
  const roleMetrics = calculateRoleProgress(records);

  const getBarColor = (perc) => {
    if (perc >= 80) return '#10b981'; // emerald
    if (perc >= 65) return '#3b82f6'; // blue
    if (perc >= 50) return '#f59e0b'; // amber
    return '#ef4444'; // rose/red
  };

  return (
    <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="dashboard-card-header">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={17} className="text-blue-600" />
          Role Progress
        </h3>
        <span className="card-badge-info">Live Production Completion</span>
      </div>

      <div className="role-progress-list" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
        {(!records || records.length === 0) ? (
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>No role data available</span>
        ) : (
          roleMetrics.map((role) => (
            <div key={role.roleKey} className="role-progress-item" style={{ width: '100%', marginBottom: '12px' }}>
              <div className="role-progress-meta">
                <span className="role-label">{role.label}</span>
                <div className="role-ratio-perc">
                  <span className="role-counts">{role.completed} / {role.allocated} files</span>
                  <span className="role-percent" style={{ color: getBarColor(role.percentage) }}>
                    {role.percentage}%
                  </span>
                </div>
              </div>

              <div className="progress-track" title={`${role.completed} of ${role.allocated} files completed (${role.percentage}%)`}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(100, role.percentage)}%`,
                    backgroundColor: getBarColor(role.percentage)
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
