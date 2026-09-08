const normalized = value => String(value || "").trim().toLowerCase();
export function matchesEmployee(item, user) {
  const ids = new Set([user.empId, user.giEmpId, user.username, user.id].map(normalized).filter(Boolean));
  const itemIds = [item.employeeId, item.employeeCode, ...(Array.isArray(item.employeeAltIds) ? item.employeeAltIds : [])].map(normalized).filter(Boolean);
  return itemIds.some(id => ids.has(id)) || Boolean(normalized(user.name) && normalized(item.employee || item.postedTo) === normalized(user.name));
}
export function assignedRole(item) {
  const value = [item.role, item.workflowRole, item.workType, item.process, item.workflowStage, item.department].map(normalized).join(" ");
  if (/qag|quality assurance/.test(value)) return "qag";
  if (/\bqc\b|quality control/.test(value)) return "qc";
  if (/book|interior/.test(value)) return "book";
  if (/cover|graphic/.test(value)) return "cover";
  if (/develop/.test(value)) return "book";
  return null;
}
export function mergeEmployeeAllocations(items) {
  const byIsbn = new Map();
  const timestamp = item => Number(item.statusUpdatedAt || item.updatedAt || item.createdAt || 0);
  items.forEach(item => {
    if (!item?.isbn) return;
    const key = String(item.isbn).trim();
    const previous = byIsbn.get(key);
    if (!previous || timestamp(item) > timestamp(previous)) byIsbn.set(key, item);
  });
  return [...byIsbn.values()];
}

// Resolve the opposite role from persisted assignments, including separate batches.
export function withCounterpartAssignments(items) {
  const assignments = new Map();
  const timestamp = item => Number(item.createdAt || item.allocated || 0);
  for (const item of items) {
    const role = assignedRole(item);
    if (!item.isbn || !["book", "cover"].includes(role)) continue;
    const key = `${String(item.isbn).trim()}:${role}`;
    const previous = assignments.get(key);
    if (!previous || timestamp(item) > timestamp(previous) || (timestamp(item) === timestamp(previous) && Number(item.statusUpdatedAt || 0) > Number(previous.statusUpdatedAt || 0))) assignments.set(key, item);
  }
  return items.map(item => {
    const role = assignedRole(item);
    if (!["book", "cover"].includes(role)) return item;
    const counterpart = assignments.get(`${String(item.isbn).trim()}:${role === "book" ? "cover" : "book"}`);
    if (!counterpart) return item;
    return { ...item, counterpartRole: role === "book" ? "Cover Developer" : "Book Developer", counterpartEmployee: counterpart.employee || counterpart.postedTo || "", counterpartEmployeeId: counterpart.employeeId, counterpartStatus: counterpart.status || "Allocated" };
  });
}
