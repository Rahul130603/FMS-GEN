export function calendarDate(value) {
  if (value === undefined || value === null || value === "") return "";
  const text = String(value);
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T| )/);
  if (iso) {
    const [, year, month, day] = iso;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.getFullYear() === Number(year) && date.getMonth() + 1 === Number(month) && date.getDate() === Number(day) ? `${year}-${month}-${day}` : "";
  }
  const numeric = Number(value);
  // Older records use Unix seconds; allocated=1 is a file count, not a date.
  if (Number.isFinite(numeric) && numeric < 1000000000) return "";
  const date = new Date(Number.isFinite(numeric) ? numeric < 100000000000 ? numeric * 1000 : numeric : value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function recordDate(record) {
  for (const value of [record.allocationDate, record.date, record.allocatedAt, record.allocated_at, record.createdAt, record.uploadedAt, record.uploadDate, record.allocated]) {
    const date = calendarDate(value);
    if (date) return date;
  }
  return "";
}

export function matchesFileDate(value, { date = "", month = "", year = "" }) {
  if (!date && !month && !year) return true;
  if (!value) return false;
  return (!date || value === date) && (!month || value.slice(5, 7) === month) && (!year || value.slice(0, 4) === year);
}
