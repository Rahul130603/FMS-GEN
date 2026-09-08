export const CATEGORIES = [
  { code: 'isbn_mismatch', label: 'ISBN Mismatch' },
  { code: 'download_issue', label: 'Download Issue' },
  { code: 'upload_issue', label: 'Upload Issue' },
  { code: 'missing_file', label: 'Missing File' },
  { code: 'software_bug', label: 'Software Bug' },
  { code: 'access_issue', label: 'Access Issue' },
  { code: 'server_issue', label: 'Server Issue' },
  { code: 'network_issue', label: 'Network Issue' },
  { code: 'performance_issue', label: 'Performance Issue' },
  { code: 'other', label: 'Other' },
];

export const PRIORITIES = [
  { code: 'low', label: 'Low' },
  { code: 'normal', label: 'Normal' },
  { code: 'high', label: 'High' },
  { code: 'urgent', label: 'Urgent' },
];

export const STATUSES = [
  { code: 'open', label: 'Open', color: 'blue' },
  { code: 'in_review', label: 'In Review', color: 'indigo' },
  { code: 'in_progress', label: 'In Progress', color: 'amber' },
  { code: 'resolved', label: 'Resolved', color: 'green' },
  { code: 'closed', label: 'Closed', color: 'gray' },
  { code: 'reopened', label: 'Reopened', color: 'red' },
  { code: 'archived', label: 'Archived', color: 'slate' },
];

export const STATUS_COLOR_CLASSES = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300 ring-1 ring-inset ring-indigo-600/20',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 ring-1 ring-inset ring-amber-600/20',
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20',
  gray: 'bg-gray-100 text-gray-700 dark:bg-slate-500/15 dark:text-slate-300 ring-1 ring-inset ring-gray-500/20',
  red: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300 ring-1 ring-inset ring-red-600/20',
  slate: 'bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300 ring-1 ring-inset ring-slate-500/20',
};

export const PRIORITY_COLOR_CLASSES = {
  low: 'bg-gray-100 text-gray-700 dark:bg-slate-700/40 dark:text-slate-300',
  normal: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300 font-semibold',
};

export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.code, c.label]));
export const STATUS_LABELS = Object.fromEntries(STATUSES.map((s) => [s.code, s.label]));
export const STATUS_META = Object.fromEntries(STATUSES.map((s) => [s.code, s]));
export const PRIORITY_LABELS = Object.fromEntries(PRIORITIES.map((p) => [p.code, p.label]));

export const CHART_PALETTE = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777', '#65a30d', '#4338ca'];

export const ACCEPTED_FILE_TYPES = '.png,.jpg,.jpeg,.pdf,.docx,.zip';
export const MAX_FILE_SIZE_MB = 15;
