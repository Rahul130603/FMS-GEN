import axios from 'axios';
import { Project, UserOption } from './types';

const client = axios.create({ baseURL: '/api' });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('fms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function isHtmlOrInvalid(res: any) {
  if (!res || !res.data) return true;
  if (typeof res.data === 'string') return true;
  if (res.headers && String(res.headers['content-type']).includes('text/html')) return true;
  return false;
}

export const MOCK_USERS: UserOption[] = [];

export function normalizeProject(p: any): Project {
  const stage = p.workflow_stage || p.current_stage || 'In Progress';
  const score = p.health_score ?? p.health?.score ?? 85;
  const category =
    p.health_category ??
    p.health?.category ??
    (score >= 90 ? 'Excellent' : score >= 75 ? 'Healthy' : score >= 60 ? 'Needs Attention' : 'Critical');
  const risk =
    p.health_risk ??
    p.health?.risk ??
    (score >= 80 ? 'Low Risk' : score >= 60 ? 'Medium Risk' : 'High Risk');
  const daysRem = p.remaining_days ?? p.days_remaining ?? 5;
  const dueLabel =
    p.due_label ??
    p.health?.daysRemaining?.label ??
    (daysRem < 0 ? `Overdue by ${Math.abs(daysRem)}d` : daysRem === 0 ? 'Due today' : `Due in ${daysRem}d`);
  const dueColor =
    p.due_color ??
    p.health?.daysRemaining?.color ??
    (daysRem < 0 ? '#ef4444' : daysRem <= 2 ? '#f59e0b' : '#16a34a');

  return {
    id: p.id,
    project_number: p.project_number,
    isbn: p.isbn || '',
    book_title: p.book_title,
    client_name: p.client_name || '',
    project_type: p.project_type || 'EPUB',
    department: p.department || 'EPUB',
    assigned_to: p.assigned_to,
    assignedEmployee:
      p.assignedEmployee ||
      (p.assigned_to ? { id: p.assigned_to, name: MOCK_USERS.find((u) => u.id === p.assigned_to)?.name || `User ${p.assigned_to}` } : undefined),
    manager: p.manager,
    managerUser:
      p.managerUser ||
      (p.manager ? { id: p.manager, name: MOCK_USERS.find((u) => u.id === p.manager)?.name || `Manager ${p.manager}` } : undefined),
    priority: p.priority || 'Normal',
    workflow_stage: stage,
    completion_percentage: p.completion_percentage ?? 50,
    start_date: p.start_date || '2026-09-01',
    expected_delivery: p.expected_delivery || p.due_date || '2026-09-15',
    due_date: p.due_date || '2026-09-15',
    actual_delivery: p.actual_delivery || p.actual_delivery_date,
    status: p.status || 'In Progress',
    remarks: p.remarks || '',
    created_at: p.created_at || '2026-09-01T08:00:00Z',
    updated_at: p.updated_at || '2026-09-07T08:00:00Z',
    delay_days: p.delay_days ?? (daysRem < 0 ? Math.abs(daysRem) : 0),
    remaining_days: daysRem,
    recommendations:
      Array.isArray(p.recommendations) && p.recommendations.length > 0
        ? p.recommendations
        : [
            score < 70
              ? 'Review high-risk timeline and expedite QC stage.'
              : 'On track with current stage deliverables. Maintain milestone rhythm.'
          ],
    milestones: p.milestones || [
      { id: 1, stage: 'Scanning', expected_date: '2026-09-02', actual_completed_date: '2026-09-02' },
      { id: 2, stage: 'EPDF', expected_date: '2026-09-06', actual_completed_date: score > 70 ? '2026-09-05' : undefined },
      { id: 3, stage: 'QC', expected_date: '2026-09-10' },
      { id: 4, stage: 'Ready for Delivery', expected_date: p.due_date || '2026-09-15' }
    ],
    health: p.health || {
      score,
      category,
      risk,
      completion: {
        score: Math.round((p.completion_percentage ?? 50) * 0.3),
        max: 30,
        percentage: p.completion_percentage ?? 50,
        status: { label: (p.completion_percentage ?? 50) >= 80 ? 'Advanced' : 'In Progress', color: '#16a34a' }
      },
      daysRemaining: {
        score: daysRem > 3 ? 30 : daysRem >= 0 ? 15 : 0,
        max: 30,
        remaining: daysRem,
        label: dueLabel,
        color: dueColor
      },
      workflow: {
        score: 20,
        max: 20,
        currentStage: stage,
        completedStages: ['Scanning'],
        remainingStages: ['EPDF', 'QC', 'Ready for Delivery']
      },
      priority: {
        score: 10,
        max: 10,
        level: p.priority || 'Normal'
      },
      missedMilestones: {
        score: 10,
        max: 10,
        count: daysRem < 0 ? 1 : 0,
        items: daysRem < 0 ? [{ stage, expected_date: p.due_date, delayDays: Math.abs(daysRem) }] : []
      }
    }
  };
}

const RAW_MOCK_PROJECTS: any[] = [];

export const MOCK_PROJECTS: Project[] = RAW_MOCK_PROJECTS.map(normalizeProject);

let localProjects: Project[] = [...MOCK_PROJECTS];

const api = {
  get: async (url: string, config?: any) => {
    try {
      const res = await client.get(url, config);
      if (isHtmlOrInvalid(res)) {
        throw new Error('API fallback to mock');
      }
      return res;
    } catch (e) {
            if (url === '/users') {
        return { data: [] };
      }
      if (url === '/delivery-status' || url === '/reports/delivery-status' || url.includes('delivery-status')) {
        return { data: { delivered: [], notDelivered: [] } };
      }
      if (url.startsWith('/projects/')) {
        return { data: { project: null, timeline: [] } };
      }
      if (url.startsWith('/projects') || url === '/projects') {
        return {
          data: {
            items: [],
            total: 0
          }
        };
      }
      return { data: {} };
    }
  },

  post: async (url: string, data?: any) => {
    try {
      const res = await client.post(url, data);
      if (isHtmlOrInvalid(res)) {
        throw new Error('API fallback to mock');
      }
      return res;
    } catch (e) {
      if (url === '/projects') {
        const raw = {
          id: Date.now(),
          project_number: data.project_number || `PRJ-2026-${Math.floor(100 + Math.random() * 900)}`,
          book_title: data.book_title || 'Untitled Project',
          isbn: data.isbn || '9780000000000',
          client_name: data.client_name || 'Standard Client',
          project_type: data.project_type || 'EPUB',
          department: data.department || 'EPUB',
          assigned_to: data.assigned_to ? Number(data.assigned_to) : undefined,
          manager: data.manager ? Number(data.manager) : undefined,
          priority: data.priority || 'Normal',
          status: 'In Progress',
          workflow_stage: data.workflow_stage || 'Scanning',
          completion_percentage: Number(data.completion_percentage) || 10,
          due_date: data.due_date || '2026-09-30',
          start_date: data.start_date || '2026-09-01',
          remarks: data.remarks || '',
          health_score: 90,
          health_category: 'Healthy',
          health_risk: 'Low Risk'
        };
        const newProj = normalizeProject(raw);
        localProjects.unshift(newProj);
        return { data: newProj };
      }
      return { data: {} };
    }
  },

  patch: async (url: string, data?: any) => {
    try {
      const res = await client.patch(url, data);
      if (isHtmlOrInvalid(res)) {
        throw new Error('API fallback to mock');
      }
      return res;
    } catch (e) {
      if (url.includes('/milestones/') && url.includes('/complete')) {
        const parts = url.split('/');
        const projId = Number(parts[2]);
        const mId = Number(parts[4]);
        const p = localProjects.find((x) => x.id === projId);
        if (p && p.milestones) {
          const m = p.milestones.find((x) => x.id === mId);
          if (m) m.actual_completed_date = data?.actual_completed_date || new Date().toISOString().slice(0, 10);
        }
        return { data: { success: true } };
      }
      if (url.startsWith('/projects/')) {
        const id = Number(url.split('/')[2]);
        const idx = localProjects.findIndex((p) => p.id === id);
        if (idx >= 0) {
          localProjects[idx] = normalizeProject({ ...localProjects[idx], ...data });
          return { data: localProjects[idx] };
        }
      }
      return { data: {} };
    }
  }
};

export default api;

export function downloadExport(path: string, params: Record<string, any>, filename: string) {
  const headers = ['Project Number', 'Book Title', 'ISBN', 'Department', 'Status', 'Due Date', 'Health Score'];
  const rows = localProjects.map((p) => [
    p.project_number,
    `"${p.book_title.replace(/"/g, '""')}"`,
    p.isbn || '',
    p.department || '',
    p.status,
    p.due_date,
    p.health?.score ?? 85
  ]);
  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
