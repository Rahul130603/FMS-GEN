import React from 'react';
import { PROJECT_TYPES, WORKFLOW_STAGES, PROJECT_STATUSES, PRIORITIES, UserOption } from '../../lib/delivery/types';

export interface Filters {
  q?: string;
  status?: string;
  priority?: string;
  project_type?: string;
  workflow_stage?: string;
  department?: string;
  assigned_to?: string;
  manager?: string;
  risk?: string;
  health_category?: string;
  due_from?: string;
  due_to?: string;
  min_completion?: string;
  max_completion?: string;
  remaining_days?: string;
}

const HEALTH_CATEGORIES = ['Excellent', 'Healthy', 'Needs Attention', 'At Risk', 'Critical'];
const RISK_LEVELS = ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'];

export default function FilterBar({
  filters,
  onChange,
  users = [],
  showAssignment = true,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  users?: UserOption[];
  showAssignment?: boolean;
}) {
  const employees = users.filter((u) => u.role === 'Employee');
  const managers = users.filter((u) => u.role === 'Manager');
  const set = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ [k]: e.target.value } as any);

  return (
    <div className="toolbar">
      <input placeholder="Search title, project #, ISBN, client..." style={{ flex: '1 1 240px' }} value={filters.q || ''} onChange={set('q')} />
      <select value={filters.status || ''} onChange={set('status')}>
        <option value="">All Statuses</option>
        {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={filters.priority || ''} onChange={set('priority')}>
        <option value="">All Priorities</option>
        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <select value={filters.project_type || ''} onChange={set('project_type')}>
        <option value="">All Types</option>
        {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={filters.workflow_stage || ''} onChange={set('workflow_stage')}>
        <option value="">All Stages</option>
        {WORKFLOW_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={filters.remaining_days || ''} onChange={set('remaining_days')}>
        <option value="">Any Due Date</option>
        <option value="today">Due Today</option>
        <option value="tomorrow">Due Tomorrow</option>
        <option value="3">Next 3 Days</option>
        <option value="7">Next 7 Days</option>
        <option value="15">Next 15 Days</option>
        <option value="30">Next 30 Days</option>
        <option value="overdue">Overdue</option>
      </select>
      <select value={filters.health_category || ''} onChange={set('health_category')}>
        <option value="">Any Health</option>
        {HEALTH_CATEGORIES.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
      <select value={filters.risk || ''} onChange={set('risk')}>
        <option value="">Any Risk</option>
        {RISK_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      {showAssignment && employees.length > 0 && (
        <select value={filters.assigned_to || ''} onChange={set('assigned_to')}>
          <option value="">All Employees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      )}
      {showAssignment && managers.length > 0 && (
        <select value={filters.manager || ''} onChange={set('manager')}>
          <option value="">All Managers</option>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      )}
      <input type="date" title="Due from" value={filters.due_from || ''} onChange={set('due_from')} />
      <input type="date" title="Due to" value={filters.due_to || ''} onChange={set('due_to')} />
      <button className="btn btn-sm" onClick={() => onChange({ q: '', status: '', priority: '', project_type: '', workflow_stage: '', department: '', assigned_to: '', manager: '', risk: '', health_category: '', due_from: '', due_to: '', remaining_days: '' })}>
        Clear Filters
      </button>
    </div>
  );
}
