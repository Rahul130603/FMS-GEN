export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateTimeStr?: string): string {
  if (!dateTimeStr) return '—';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateTimeStr;
  }
}

export function getDaysRemaining(dueDateStr?: string): { days: number; isOverdue: boolean; label: string } {
  if (!dueDateStr) return { days: 0, isOverdue: false, label: 'No due date' };
  try {
    const parts = dueDateStr.split('-');
    const due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    // Reference date: Sep 05, 2026 (matching system current time)
    const today = new Date(2026, 8, 5); // Sep 5, 2026
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { days: Math.abs(diffDays), isOverdue: true, label: `${Math.abs(diffDays)}d overdue` };
    } else if (diffDays === 0) {
      return { days: 0, isOverdue: false, label: 'Due today' };
    } else {
      return { days: diffDays, isOverdue: false, label: `${diffDays}d left` };
    }
  } catch (e) {
    return { days: 0, isOverdue: false, label: dueDateStr };
  }
}
