import { recordDate } from "./fileDateFilter.js";
export const normalizeIsbn = value => String(value || "").replace(/[\s-]/g, "");
const complete = value => /^(complete|completed)$/i.test(String(value || ""));
const started = value => /^(start|in progress|wip|work in progress|complete|completed|rework|reject|hold)$/i.test(String(value || ""));

function allocationRole(item) {
  const role = [item.role, item.workflowRole, item.workflowStage, item.process, item.department, item.team].filter(Boolean).join(" ").toLowerCase();
  if (/qag|quality assurance/.test(role)) return "qag";
  if (/\bqc\b|quality control/.test(role)) return "qc";
  if (/cover|graphic/.test(role)) return "graphics";
  if (/book|develop|interior/.test(role)) return "developer";
  return null;
}

export function buildFileWorkflow(files = [], masters = [], allocations = [], uploadedIsbns = []) {
  const rows = new Map();
  const getRow = value => {
    const isbn = normalizeIsbn(value);
    if (!/^\d{13}$/.test(isbn)) return null;
    if (!rows.has(isbn)) rows.set(isbn, { isbn, assignees: {}, roles: {}, uploaded: false });
    return rows.get(isbn);
  };
  files.forEach(file => {
    const row = getRow(file.isbn);
    if (row) { row.owner = file.owner || file.postedTo; row.fileDate = recordDate(file); }
  });
  // Newer role allocations replace older assignments for the same ISBN.
  [...allocations].sort((a, b) => Number(a.statusUpdatedAt || a.updatedAt || a.createdAt || 0) - Number(b.statusUpdatedAt || b.updatedAt || b.createdAt || 0)).forEach(item => {
    const row = getRow(item.isbn);
    if (!row) return;
    const date = recordDate(item);
    if (date && (!row.allocationDate || date > row.allocationDate)) row.allocationDate = date;
    const role = allocationRole(item);
    if (role) {
      row.assignees[role] = item.employee || item.postedTo || item.employeeId;
      row.roles[role] = item.status;
    }
    if (item.uploaded || item.status === "Uploaded") row.uploaded = true;
  });
  masters.forEach(master => {
    const row = getRow(master.isbn);
    if (!row) return;
    for (const role of ["developer", "graphics", "qc", "qag"]) {
      if (master[`${role}Name`]) row.assignees[role] = master[`${role}Name`];
      if (master[`${role}Status`]) row.roles[role] = master[`${role}Status`];
    }
  });
  const uploaded = new Set(uploadedIsbns.map(normalizeIsbn));
  return [...rows.values()].map(row => {
    const developmentComplete = complete(row.roles.developer) && complete(row.roles.graphics);
    const qcComplete = developmentComplete && complete(row.roles.qc);
    const qagComplete = qcComplete && complete(row.roles.qag);
    return {
      ...row,
      filterDate: row.allocationDate || row.fileDate || "",
      development: developmentComplete ? "Complete" : [row.roles.developer, row.roles.graphics].some(started) ? "Start" : "YTA",
      qc: developmentComplete ? qcComplete ? "Complete" : "Start" : "YTA",
      qag: qcComplete ? qagComplete ? "Complete" : "Start" : "YTA",
      fileUpload: qagComplete ? row.uploaded || uploaded.has(row.isbn) ? "Uploaded" : "Start" : "YTA"
    };
  });
}
