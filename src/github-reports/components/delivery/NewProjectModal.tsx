import React, { useState } from 'react';
import api from '../../lib/delivery/api';
import { PROJECT_TYPES, WORKFLOW_STAGES, PRIORITIES, UserOption } from '../../lib/delivery/types';

const initial = {
  project_number: '',
  book_title: '',
  isbn: '',
  client_name: '',
  project_type: 'EPDF',
  department: '',
  assigned_to: '',
  manager: '',
  priority: 'Normal',
  workflow_stage: 'Scanning',
  completion_percentage: 0,
  start_date: '',
  due_date: '',
  remarks: '',
};

export default function NewProjectModal({ users, onClose, onCreated }: { users: UserOption[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const employees = users.filter((u) => u.role === 'Employee');
  const managers = users.filter((u) => u.role === 'Manager');

  const set = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/projects', { ...form, assigned_to: form.assigned_to || undefined, manager: form.manager || undefined });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Add Delivery Project</h2>
          <button className="btn btn-sm" onClick={onClose}>Close</button>
        </div>
        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: '0.85rem' }}>{error}</div>}
        <form onSubmit={submit} className="form-grid">
          <div className="form-field"><label>Project Number *</label><input required value={form.project_number} onChange={set('project_number')} placeholder="P-2026-0042" /></div>
          <div className="form-field"><label>ISBN</label><input value={form.isbn} onChange={set('isbn')} /></div>
          <div className="form-field" style={{ gridColumn: '1 / -1' }}><label>Book Title *</label><input required value={form.book_title} onChange={set('book_title')} /></div>
          <div className="form-field"><label>Client Name</label><input value={form.client_name} onChange={set('client_name')} /></div>
          <div className="form-field"><label>Department</label><input value={form.department} onChange={set('department')} /></div>
          <div className="form-field">
            <label>Project Type</label>
            <select value={form.project_type} onChange={set('project_type')}>{PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          </div>
          <div className="form-field">
            <label>Workflow Stage</label>
            <select value={form.workflow_stage} onChange={set('workflow_stage')}>{WORKFLOW_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div className="form-field">
            <label>Assigned Employee</label>
            <select value={form.assigned_to} onChange={set('assigned_to')}>
              <option value="">— Unassigned —</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Manager</label>
            <select value={form.manager} onChange={set('manager')}>
              <option value="">— Unassigned —</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Priority</label>
            <select value={form.priority} onChange={set('priority')}>{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select>
          </div>
          <div className="form-field"><label>Completion %</label><input type="number" min={0} max={100} value={form.completion_percentage} onChange={set('completion_percentage')} /></div>
          <div className="form-field"><label>Start Date</label><input type="date" value={form.start_date} onChange={set('start_date')} /></div>
          <div className="form-field"><label>Due Date</label><input type="date" value={form.due_date} onChange={set('due_date')} /></div>
          <div className="form-field" style={{ gridColumn: '1 / -1' }}><label>Remarks</label><textarea rows={2} value={form.remarks} onChange={set('remarks')} /></div>
          <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
