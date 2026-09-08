import React, { useEffect, useState } from 'react';
import api from '../../lib/delivery/api';
import { Project, EventRow, Milestone, PROJECT_STATUSES, WORKFLOW_STAGES, PRIORITIES } from '../../lib/delivery/types';
import { useAuth } from '../../context/AuthContext';
import HealthGauge from './HealthGauge';
import WorkflowTracker from './WorkflowTracker';
import Timeline from './Timeline';
import { PriorityBadge, StatusBadge } from './Badges';

export default function ProjectDetailModal({ projectId, onClose, onUpdated }: { projectId: number; onClose: () => void; onUpdated: () => void }) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [timeline, setTimeline] = useState<EventRow[]>([]);
  const [tab, setTab] = useState<'overview' | 'milestones' | 'timeline'>('overview');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Project>>({});

  const canEditFull = user?.role === 'Admin' || user?.role === 'Manager';
  const canEditOwn = user?.role === 'Employee';

  const load = () => {
    api.get(`/projects/${projectId}`).then((res: any) => {
      setProject(res.data?.project || null);
      setTimeline(res.data?.timeline || []);
      setForm(res.data?.project || {});
    });
  };

  useEffect(() => { load(); }, [projectId]);

  if (!project) return null;

  const h = project.health || {
    score: (project as any).health_score ?? 85,
    category: (project as any).health_category ?? 'Healthy',
    risk: (project as any).health_risk ?? 'Low Risk',
    daysRemaining: {
      label: (project as any).due_label || (project.due_date ? `Due ${project.due_date}` : 'On track'),
      color: (project as any).due_color || '#16a34a'
    }
  };
  const recs = Array.isArray(project.recommendations) && project.recommendations.length > 0
    ? project.recommendations
    : ['Ensure quality assurance validation is conducted on current milestone.'];

  const save = async () => {
    setSaving(true);
    try {
      const payload = canEditFull
        ? form
        : { completion_percentage: form.completion_percentage, remarks: form.remarks, workflow_stage: form.workflow_stage, status: form.status };
      await api.patch(`/projects/${projectId}`, payload);
      load();
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const completeMilestone = async (m: Milestone) => {
    const date = new Date().toISOString().slice(0, 10);
    await api.patch(`/projects/${projectId}/milestones/${m.id}/complete`, { actual_completed_date: date });
    load();
    onUpdated();
  };

  const canEdit = canEditFull || canEditOwn;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{project.book_title}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>#{project.project_number} · {project.client_name || 'No client'}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <PriorityBadge value={project.priority || 'Normal'} />
              <StatusBadge value={project.status || 'In Progress'} />
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm">Close</button>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <HealthGauge score={h.score} category={h.category} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{h.category} · {h.risk}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.daysRemaining?.label}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <ul className="rec-list" style={{ maxWidth: 320 }}>
              {recs.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>

        <WorkflowTracker currentStage={project.workflow_stage || 'Scanning'} />

        <div className="tabs" style={{ marginTop: 20 }}>
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button>
          <button className={tab === 'milestones' ? 'active' : ''} onClick={() => setTab('milestones')}>Milestones</button>
          <button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>Timeline</button>
        </div>

        {tab === 'overview' && (
          <div className="form-grid">
            <div className="form-field"><label>Department</label><div>{project.department || '—'}</div></div>
            <div className="form-field"><label>Type</label><div>{project.project_type || '—'}</div></div>
            <div className="form-field"><label>Employee</label><div>{project.assignedEmployee?.name || '—'}</div></div>
            <div className="form-field"><label>Manager</label><div>{project.managerUser?.name || '—'}</div></div>
            <div className="form-field"><label>Start Date</label><div>{project.start_date || '—'}</div></div>
            <div className="form-field"><label>Due Date</label><div>{project.due_date || '—'}</div></div>
            <div className="form-field">
              <label>Workflow Stage</label>
              {canEdit ? (
                <select value={form.workflow_stage || 'Scanning'} onChange={(e) => setForm({ ...form, workflow_stage: e.target.value })}>
                  {WORKFLOW_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : <div>{project.workflow_stage || 'Scanning'}</div>}
            </div>
            <div className="form-field">
              <label>Status</label>
              {canEdit ? (
                <select value={form.status || 'In Progress'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : <div>{project.status || 'In Progress'}</div>}
            </div>
            {canEditFull && (
              <div className="form-field">
                <label>Priority</label>
                <select value={form.priority || 'Normal'} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
            {canEditFull && (
              <div className="form-field">
                <label>Due Date</label>
                <input type="date" value={form.due_date || ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            )}
            <div className="form-field">
              <label>Completion %</label>
              {canEdit ? (
                <input type="number" min={0} max={100} value={form.completion_percentage ?? 0} onChange={(e) => setForm({ ...form, completion_percentage: parseInt(e.target.value) || 0 })} />
              ) : <div>{project.completion_percentage ?? 0}%</div>}
            </div>
            {canEditFull && (
              <div className="form-field">
                <label>Actual Delivery</label>
                <input type="date" value={form.actual_delivery || ''} onChange={(e) => setForm({ ...form, actual_delivery: e.target.value })} />
              </div>
            )}
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label>Remarks</label>
              {canEdit ? (
                <textarea rows={2} value={form.remarks || ''} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
              ) : <div>{project.remarks || '—'}</div>}
            </div>
            {canEdit && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            )}
          </div>
        )}

        {tab === 'milestones' && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Stage</th><th>Expected</th><th>Completed</th><th>Status</th>{canEdit && <th></th>}</tr></thead>
              <tbody>
                {(project.milestones || []).map((m) => {
                  const missed = m.expected_date && (!m.actual_completed_date ? new Date() > new Date(m.expected_date) : new Date(m.actual_completed_date) > new Date(m.expected_date));
                  return (
                    <tr key={m.id}>
                      <td>{m.stage}</td>
                      <td>{m.expected_date || '—'}</td>
                      <td>{m.actual_completed_date || '—'}</td>
                      <td style={{ color: missed ? '#ef4444' : m.actual_completed_date ? '#16a34a' : 'var(--text-muted)', fontWeight: 600 }}>
                        {m.actual_completed_date ? (missed ? 'Missed' : 'On Time') : missed ? 'Overdue' : 'Pending'}
                      </td>
                      {canEdit && <td>{!m.actual_completed_date && <button className="btn btn-sm" onClick={() => completeMilestone(m)}>Mark Complete</button>}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'timeline' && <Timeline events={timeline} />}
      </div>
    </div>
  );
}
