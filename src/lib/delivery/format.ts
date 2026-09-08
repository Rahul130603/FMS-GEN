export function fmtDate(d?: string) {
  if (!d) return '—';
  return d;
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#64748b',
  Normal: '#2563eb',
  High: '#f59e0b',
  Urgent: '#ea580c',
  Critical: '#dc2626',
};
export function priorityColor(p: string) {
  return PRIORITY_COLORS[p] || '#6b7280';
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  Completed: { bg: '#dcfce7', fg: '#15803d' },
  'In Progress': { bg: '#dbeafe', fg: '#1d4ed8' },
  Delayed: { bg: '#fef3c7', fg: '#b45309' },
  Overdue: { bg: '#fee2e2', fg: '#b91c1c' },
  'On Hold': { bg: '#f1f5f9', fg: '#475569' },
  Cancelled: { bg: '#f1f5f9', fg: '#64748b' },
};
export function statusColor(s: string) {
  return STATUS_COLORS[s] || { bg: '#e0f2fe', fg: '#0369a1' };
}

const HEALTH_COLORS: Record<string, string> = {
  Excellent: '#16a34a',
  Healthy: '#22c55e',
  'Needs Attention': '#eab308',
  'At Risk': '#f97316',
  Critical: '#ef4444',
};
export function healthColor(category?: string) {
  return HEALTH_COLORS[category || ''] || '#6b7280';
}

const RISK_COLORS: Record<string, string> = {
  'Low Risk': '#16a34a',
  'Medium Risk': '#eab308',
  'High Risk': '#f97316',
  'Critical Risk': '#ef4444',
};
export function riskColor(risk?: string) {
  return RISK_COLORS[risk || ''] || '#6b7280';
}
