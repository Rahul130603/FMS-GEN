import React from 'react';
import { Project } from '../../lib/delivery/types';
import { PriorityBadge, StatusBadge, HealthBadge, DueBadge } from './Badges';

export default function ProjectTable({
  projects,
  loading,
  onOpen,
  columns = 'full',
}: {
  projects: Project[];
  loading?: boolean;
  onOpen: (p: Project) => void;
  columns?: 'full' | 'compact';
}) {
  if (loading) {
    return (
      <div className="table-wrap">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 40, margin: '8px 16px' }} />
        ))}
      </div>
    );
  }

  const projectList = Array.isArray(projects) ? projects : [];



  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Project # / Title</th>
            <th>ISBN</th>
            <th>Client</th>
            <th>Type</th>
            <th>Department</th>
            <th>Employee</th>
            <th>Manager</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Stage</th>
            <th>Completion</th>
            <th>Health</th>
            <th>Risk</th>
            <th>Due Date</th>
            {columns === 'full' && <th>Actual Delivery</th>}
            <th>Delay</th>
            <th>Missed Milestones</th>
            {columns === 'full' && <th>Smart Recommendation</th>}
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {projectList.length === 0 ? (
            <tr>
              <td colSpan={19} className="empty-state" style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
                No records found
              </td>
            </tr>
          ) : (
            projectList.map((p) => {
            const health = p.health || {
              score: (p as any).health_score ?? 85,
              category: (p as any).health_category ?? 'Healthy',
              risk: (p as any).health_risk ?? 'Low Risk',
              daysRemaining: {
                label: (p as any).due_label || (p.due_date ? `Due ${p.due_date}` : 'On track'),
                color: (p as any).due_color || '#16a34a'
              },
              missedMilestones: { count: 0 }
            };
            const recs = Array.isArray(p.recommendations) && p.recommendations.length > 0
              ? p.recommendations
              : ['Milestones progressing on schedule.'];
            const stage = p.workflow_stage || (p as any).current_stage || 'In Progress';
            const delayDays = p.delay_days ?? 0;
            const missedCount = health.missedMilestones?.count ?? 0;

            return (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.book_title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{p.project_number}</div>
                </td>
                <td>{p.isbn || '—'}</td>
                <td>{p.client_name || '—'}</td>
                <td>{p.project_type || '—'}</td>
                <td>{p.department || '—'}</td>
                <td>{p.assignedEmployee?.name || '—'}</td>
                <td>{p.managerUser?.name || '—'}</td>
                <td><PriorityBadge value={p.priority || 'Normal'} /></td>
                <td><StatusBadge value={p.status || 'In Progress'} /></td>
                <td>{stage}</td>
                <td style={{ minWidth: 120 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div style={{ width: `${Math.min(100, Math.max(0, p.completion_percentage ?? 0))}%` }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>{p.completion_percentage ?? 0}%</span>
                  </div>
                </td>
                <td>
                  <HealthBadge category={health.category || 'Healthy'} />{' '}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{health.score}</span>
                </td>
                <td>{health.risk || 'Low Risk'}</td>
                <td>
                  <div>{p.due_date || '—'}</div>
                  <DueBadge label={health.daysRemaining?.label || '—'} color={health.daysRemaining?.color || '#16a34a'} />
                </td>
                {columns === 'full' && <td>{p.actual_delivery || '—'}</td>}
                <td>{delayDays > 0 ? `${delayDays}d` : '—'}</td>
                <td>{missedCount > 0 ? <span style={{ color: '#ef4444', fontWeight: 600 }}>{missedCount}</span> : '—'}</td>
                {columns === 'full' && <td style={{ whiteSpace: 'normal', maxWidth: 220 }}>{recs[0]}</td>}
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm" onClick={() => onOpen(p)}>View</button>
                </td>
              </tr>
            );
          }))}
        </tbody>
      </table>
    </div>
  );
}
