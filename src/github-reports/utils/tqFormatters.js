import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const formatDate = (value) => (value ? dayjs(value).format('DD MMM YYYY, hh:mm A') : '—');
export const formatDateShort = (value) => (value ? dayjs(value).format('DD MMM YYYY') : '—');
export const formatRelative = (value) => (value ? dayjs(value).fromNow() : '—');

export function formatHours(hours) {
  if (hours === null || hours === undefined || Number.isNaN(Number(hours))) return '—';
  const h = Number(hours);
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} hrs`;
  return `${(h / 24).toFixed(1)} days`;
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = Number(bytes);
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i += 1;
  }
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function titleCase(str) {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1));
}
