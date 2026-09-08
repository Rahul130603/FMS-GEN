/**
 * Centralized utility to calculate dynamic summary metrics for My Report.
 *
 * Metrics:
 * 1. Total Files: Total number of files/projects in the current dataset
 * 2. In Progress: Records with active / in-progress production status
 * 3. Completed: Records with Completed status
 * 4. Pending: Records that are pending / not started / in review / on hold (not completed & not in progress)
 * 5. Overdue: Records whose due date < today AND status is not Completed
 * 6. Due Today: Records whose due date == today AND status is not Completed
 */
export function calculateMyReportMetrics(projects = [], todayStr = '2026-09-04') {
  const safeProjects = Array.isArray(projects) ? projects : [];

  const total = safeProjects.length;
  const inProgress = safeProjects.filter(p => p.status === 'In Progress').length;
  const completed = safeProjects.filter(p => p.status === 'Completed').length;
  const pending = safeProjects.filter(p => p.status !== 'Completed' && p.status !== 'In Progress').length;
  const overdue = safeProjects.filter(p => p.dueDate && p.dueDate < todayStr && p.status !== 'Completed').length;
  const dueToday = safeProjects.filter(p => p.dueDate && p.dueDate === todayStr && p.status !== 'Completed').length;

  return {
    total,
    inProgress,
    completed,
    pending,
    overdue,
    dueToday
  };
}


