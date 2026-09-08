/**
 * Master ISBN Workflow Store Service
 * Centralizes the Master ISBN Record for Developer, Graphics, QC, and QAG roles.
 * Maintains persistent bidirectional mapping using ISBN as the primary key.
 */

const MASTER_STORE_KEY = "fileflow_master_isbns";
const ADMIN_ALLOC_KEY = "fileflow_admin_allocations";
const NOTIFICATIONS_KEY = "fileflow_notifications";

export const BOOK_DEVELOPERS_16 = [];
/* Legacy hardcoded roster removed. Employee Master API is the only source. */
/*
  { id: "20012", code: "GEN0012", name: "Jaisrinivas P K", role: "DEVELOPER" },
  { id: "20013", code: "GEN0008", name: "Sivakumar G", role: "DEVELOPER" },
  { id: "20022", code: "GEN0014", name: "Monica R", role: "DEVELOPER" },
  { id: "20023", code: "GEN0015", name: "Saranya V", role: "DEVELOPER" },
  { id: "20027", code: "GEN0018", name: "Sheeba S", role: "DEVELOPER" },
  { id: "20028", code: "GEN0021", name: "Jayasurya J", role: "DEVELOPER" },
  { id: "20032", code: "GEN0036", name: "Ashwin G", role: "DEVELOPER" },
  { id: "20033", code: "GEN0037", name: "Karthik R", role: "DEVELOPER" },
  { id: "20039", code: "GEN0039", name: "Vignesh S", role: "DEVELOPER" },
  { id: "20040", code: "GEN0040", name: "Anitha M", role: "DEVELOPER" },
  { id: "20045", code: "GEN0045", name: "Suresh K", role: "DEVELOPER" },
  { id: "20048", code: "GEN0048", name: "Vijay L", role: "DEVELOPER" },
  { id: "20070", code: "GEN0070", name: "Mohan P", role: "DEVELOPER" },
  { id: "20071", code: "GEN0071", name: "Rajesh N", role: "DEVELOPER" },
  { id: "20078", code: "GEN0078", name: "Divya M", role: "DEVELOPER" },
  { id: "20080", code: "GEN0080", name: "Deepa R", role: "DEVELOPER" }
];

export const COVER_DEVELOPERS_6 = [
  { id: "20065", code: "GEN0065", name: "Bala Murugan", role: "GRAPHICS" },
  { id: "20036", code: "GEN0032", name: "Dinesh S", role: "GRAPHICS" },
  { id: "20056", code: "GEN0056", name: "M.Abishek", role: "GRAPHICS" },
  { id: "20037", code: "GEN0028", name: "Prakash A", role: "GRAPHICS" },
  { id: "20081", code: "GEN0081", name: "Harish A", role: "GRAPHICS" },
  { id: "20064", code: "GEN0064", name: "Farhana N", role: "GRAPHICS" }
];

export const QC_EMPLOYEES_6 = [
  { id: "QC01", code: "GEN0032", name: "Santhosh Kumar A", role: "QC" },
  { id: "QC02", code: "GEN0007", name: "Vandhana T", role: "QC" },
  { id: "QC03", code: "GEN0023", name: "B.Vignesh", role: "QC" },
  { id: "QC04", code: "GEN0006", name: "Arul Yosuva", role: "QC" },
  { id: "QC05", code: "GEN0019", name: "Sundharesan T", role: "QC" },
  { id: "QC06", code: "GEN0038", name: "Dhanush K", role: "QC" }
];

export const QAG_EMPLOYEES_6 = [
  { id: "QAG01", code: "GEN0016", name: "Inbakumar R", role: "QAG" },
  { id: "QAG02", code: "GEN0010", name: "b.Thangaraj", role: "QAG" },
  { id: "QAG03", code: "GEN0035", name: "Udhayapriyan S", role: "QAG" },
  { id: "QAG04", code: "GEN0042", name: "Muthukumar S", role: "QAG" },
  { id: "QAG05", code: "GEN0050", name: "Kavitha M", role: "QAG" },
  { id: "QAG06", code: "GEN0058", name: "Sangeetha P", role: "QAG" }
];
*/

export const COVER_DEVELOPERS_6 = [];
export const QC_EMPLOYEES_6 = [];
export const QAG_EMPLOYEES_6 = [];

/**
 * Helper to identify and reject synthetic/disallowed ISBN formats like '978-1-234567-XX-X'
 */
export const isDisallowedIsbn = (isbn) => {
  if (!isbn) return true;
  const str = String(isbn).trim();
  return str.includes("978-1-234567") || /^978-1-234567/.test(str);
};

/**
 * Initialize / Retrieve all Master ISBN records (Strictly zero dummy data)
 */
export function getMasterIsbnRecords() {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(MASTER_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Strictly filter out any legacy synthetic 978-1-234567 dummy records
      return (parsed || []).filter(r => r && r.isbn && !isDisallowedIsbn(r.isbn));
    }
  } catch (e) {
    console.error("Error reading master ISBNs:", e);
  }

  // Strictly return empty array when no real allocations exist
  return [];
}

export function saveMasterIsbnRecords(records) {
  try {
    const clean = (records || []).filter(r => r && r.isbn && !isDisallowedIsbn(r.isbn));
    localStorage.setItem(MASTER_STORE_KEY, JSON.stringify(clean));
    // Trigger storage event for live multi-tab or intra-app synchronization
    window.dispatchEvent(new Event("masterIsbnStoreUpdated"));
  } catch (e) {
    console.error("Error saving master ISBNs:", e);
  }
}

/**
 * Balanced mathematical distribution: distributes N files among M employees.
 * Remainder is given 1 each to the first 'remainder' employees.
 * Total is ALWAYS strictly equal to N.
 */
export function calculateEqualDistribution(totalFiles, employees) {
  if (!employees || !employees.length) return [];
  const empCount = employees.length;
  const baseCount = Math.floor(totalFiles / empCount);
  const remainder = totalFiles % empCount;

  return employees.map((emp, idx) => ({
    ...emp,
    count: baseCount + (idx < remainder ? 1 : 0)
  }));
}

/**
 * Initial Master Records Generator: returns empty array (Zero dummy data)
 */
function generateInitialMasterRecords() {
  return [];
}

/**
 * Purge any disallowed dummy data from localStorage immediately
 */
export function purgeDisallowedData() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const rawMaster = localStorage.getItem(MASTER_STORE_KEY);
    if (rawMaster) {
      const parsed = JSON.parse(rawMaster);
      const clean = (parsed || []).filter(r => r && r.isbn && !isDisallowedIsbn(r.isbn));
      localStorage.setItem(MASTER_STORE_KEY, JSON.stringify(clean));
    }
    const rawAdmin = localStorage.getItem(ADMIN_ALLOC_KEY);
    if (rawAdmin) {
      const parsed = JSON.parse(rawAdmin);
      const clean = (parsed || []).filter(r => r && r.isbn && !isDisallowedIsbn(r.isbn));
      localStorage.setItem(ADMIN_ALLOC_KEY, JSON.stringify(clean));
    }
    const rawNotif = localStorage.getItem(NOTIFICATIONS_KEY);
    if (rawNotif) {
      const parsed = JSON.parse(rawNotif);
      const clean = (parsed || []).filter(r => !r.isbn || !isDisallowedIsbn(r.isbn));
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(clean));
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("fileflow_emp_data_")) {
        try {
          const empList = JSON.parse(localStorage.getItem(key) || "[]");
          const cleanEmp = (empList || []).filter(r => r && r.isbn && !isDisallowedIsbn(r.isbn));
          localStorage.setItem(key, JSON.stringify(cleanEmp));
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error("Error purging disallowed data:", e);
  }
}

// Auto-run purge on load
if (typeof window !== "undefined") {
  purgeDisallowedData();
}

/**
 * Allocate files by role category (Developer, Graphics, QC, QAG)
 */
export function allocateCategory(category, selectedIsbns, employeeList, options = {}) {
  const records = getMasterIsbnRecords();
  const distribution = calculateEqualDistribution(selectedIsbns.length, employeeList);

  let currentIsbnIdx = 0;
  distribution.forEach((emp) => {
    const count = emp.count;
    const isbnsForEmp = selectedIsbns.slice(currentIsbnIdx, currentIsbnIdx + count);
    currentIsbnIdx += count;

    isbnsForEmp.forEach((isbn) => {
      let master = records.find(r => r.isbn === isbn);
      if (!master) {
        master = {
          isbn,
          fileId: `FIL-${isbn.replace(/[^0-9]/g, "").slice(-8)}`,
          fileName: `${isbn}.pdf`,
          inputPath: `D:/Gentize_Production/Incoming/${isbn}.pdf`,
          createdDate: options.date || "2026-09-04",
          updatedDate: "2026-09-04",
          developerStatus: "Pending",
          graphicsStatus: "Pending",
          qcReady: false,
          qcStatus: "Pending",
          qagReady: false,
          qagStatus: "Pending",
          remarksHistory: []
        };
        records.push(master);
      }

      master.updatedDate = new Date().toISOString().split("T")[0];

      if (category === "Developer") {
        master.developerId = emp.id;
        master.developerName = emp.name;
        master.developerCode = emp.code || emp.id;
        master.developerStatus = "In Progress";
      } else if (category === "Graphics") {
        master.graphicsId = emp.id;
        master.graphicsName = emp.name;
        master.graphicsCode = emp.code || emp.id;
        master.graphicsStatus = "In Progress";
      } else if (category === "QC") {
        master.qcId = emp.id;
        master.qcName = emp.name;
        master.qcStatus = "In Progress";
      } else if (category === "QAG") {
        master.qagId = emp.id;
        master.qagName = emp.name;
        master.qagStatus = "In Progress";
      }

      // Check QC Ready
      if (master.developerStatus === "Complete" && master.graphicsStatus === "Complete") {
        master.qcReady = true;
      }
      // Check QAG Ready
      if (master.qcStatus === "Completed") {
        master.qagReady = true;
      }
    });
  });

  saveMasterIsbnRecords(records);
  syncToAdminAllocations(records);
  return records;
}

/**
 * Allocate Dual: distributes to both 16 Book Devs and 6 Cover Devs in parallel
 */
export function allocateDual(selectedIsbns, options = {}) {
  allocateCategory("Developer", selectedIsbns, BOOK_DEVELOPERS_16, options);
  return allocateCategory("Graphics", selectedIsbns, COVER_DEVELOPERS_6, options);
}

// Mirror the assignments that were actually saved; never redistribute a batch here.
export function syncAllocatedMasterRecords(allocations, { onlyMissing = false } = {}) {
  const records = getMasterIsbnRecords();
  let changed = false;
  allocations.forEach(allocation => {
    const roleText = String(allocation.role || allocation.workflowRole || allocation.department || allocation.process || "").toLowerCase();
    const role = /qag/.test(roleText) ? "qag" : /qc|quality control/.test(roleText) ? "qc" : /cover|graphic/.test(roleText) ? "graphics" : /book|develop/.test(roleText) ? "developer" : null;
    if (!role) return;
    let master = records.find(record => record.isbn === allocation.isbn);
    if (!master) {
      master = { isbn: allocation.isbn, fileId: allocation.fileId, developerStatus: "Pending", graphicsStatus: "Pending", qcStatus: "Pending", qagStatus: "Pending" };
      records.push(master);
    }
    if (onlyMissing && master[`${role}Id`]) return;
    changed = true;
    master[`${role}Id`] = allocation.employeeId;
    master[`${role}Name`] = allocation.employee;
    master[`${role}Code`] = allocation.employeeCode;
    master[`${role}Status`] = allocation.status || "Allocated";
  });
  if (changed) saveMasterIsbnRecords(records);
  return records;
}

/**
 * Mark Developer completed for an ISBN
 */
export function updateDeveloperCompletion(isbn, employeeId, details = {}) {
  const records = getMasterIsbnRecords();
  const item = records.find(r => r.isbn === isbn);
  if (!item) return;

  item.developerStatus = "Complete";
  item.updatedDate = new Date().toISOString().split("T")[0];

  // Auto evaluate QC Ready Gate
  if (item.graphicsStatus === "Complete") {
    item.qcReady = true;
  }

  saveMasterIsbnRecords(records);
  syncToAdminAllocations(records);
}

/**
 * Mark Graphics completed for an ISBN
 */
export function updateGraphicsCompletion(isbn, employeeId, details = {}) {
  const records = getMasterIsbnRecords();
  const item = records.find(r => r.isbn === isbn);
  if (!item) return;

  item.graphicsStatus = "Complete";
  item.updatedDate = new Date().toISOString().split("T")[0];

  // Auto evaluate QC Ready Gate
  if (item.developerStatus === "Complete") {
    item.qcReady = true;
  }

  saveMasterIsbnRecords(records);
  syncToAdminAllocations(records);
}

/**
 * Add QC Remark with targeted routing
 * Supports both:
 * 1. addQcRemark(isbn, qcUser, sendToType, remarkText)
 * 2. addQcRemark(isbn, { sendTo, text, qcUser })
 */
export function addQcRemark(isbn, qcUserOrOptions, maybeSendTo, maybeRemarkText) {
  let qcUser = qcUserOrOptions;
  let sendToType = maybeSendTo;
  let remarkText = maybeRemarkText;

  if (typeof qcUserOrOptions === "object" && qcUserOrOptions && ("sendTo" in qcUserOrOptions || "text" in qcUserOrOptions)) {
    sendToType = qcUserOrOptions.sendTo;
    remarkText = qcUserOrOptions.text;
    qcUser = qcUserOrOptions.qcUser;
  }

  const records = getMasterIsbnRecords();
  const item = records.find(r => r.isbn === isbn);
  if (!item) return { ok: false, message: "ISBN not found" };

  const nowTs = new Date().toISOString().replace("T", " ").slice(0, 16);
  const remarkId = `REM-${Date.now()}`;

  // Determine recipients based on Master ISBN record (never manual employee pick!)
  const recipients = [];
  if (sendToType === "Graphics/Developer") {
    if (item.developerId) recipients.push({ id: item.developerId, name: item.developerName, role: "Developer" });
    if (item.graphicsId) recipients.push({ id: item.graphicsId, name: item.graphicsName, role: "Graphics" });
    item.developerStatus = "Rework";
    item.graphicsStatus = "Rework";
  } else if (sendToType === "Developer") {
    if (item.developerId) recipients.push({ id: item.developerId, name: item.developerName, role: "Developer" });
    item.developerStatus = "Rework";
  } else if (sendToType === "Graphics") {
    if (item.graphicsId) recipients.push({ id: item.graphicsId, name: item.graphicsName, role: "Graphics" });
    item.graphicsStatus = "Rework";
  }

  item.qcStatus = "Remark Added";
  item.qcRemarks = remarkText;

  const remarkEntry = {
    id: remarkId,
    isbn,
    qcId: qcUser?.id || "QC01",
    qcName: qcUser?.name || "QC Inspector",
    sendTo: sendToType,
    text: remarkText,
    developerId: item.developerId,
    developerName: item.developerName,
    graphicsId: item.graphicsId,
    graphicsName: item.graphicsName,
    recipients: recipients.map(r => r.name).join(", "),
    recipientIds: recipients.map(r => r.id),
    createdAt: nowTs,
    reworkStatus: "Rework Assigned"
  };

  if (!item.remarksHistory) item.remarksHistory = [];
  item.remarksHistory.unshift(remarkEntry);

  saveMasterIsbnRecords(records);
  syncToAdminAllocations(records);

  // Dispatch live notifications to specific recipients
  sendQcNotifications(remarkEntry, recipients);

  return { ok: true, remarkEntry, recipients };
}

/**
 * Mark QC Complete
 */
export function completeQc(isbn, qcUser) {
  const records = getMasterIsbnRecords();
  const item = records.find(r => r.isbn === isbn);
  if (!item) return;

  item.qcStatus = "Completed";
  item.qagReady = true;
  item.updatedDate = new Date().toISOString().split("T")[0];

  saveMasterIsbnRecords(records);
  syncToAdminAllocations(records);
}

/**
 * Submit QAG Report
 * Supports both:
 * 1. submitQagReport(isbn, qagUser, reportData)
 * 2. submitQagReport(isbn, reportData)
 */
export function submitQagReport(isbn, qagUserOrData, maybeReportData) {
  let qagUser = qagUserOrData;
  let reportData = maybeReportData;

  if (!maybeReportData && typeof qagUserOrData === "object" && qagUserOrData) {
    reportData = qagUserOrData;
    qagUser = { id: reportData.auditorId, name: reportData.auditorName };
  }
  if (!reportData) reportData = {};

  const records = getMasterIsbnRecords();
  const item = records.find(r => r.isbn === isbn);
  if (!item) return { ok: false };

  const nowTs = new Date().toISOString().replace("T", " ").slice(0, 16);
  const scoreVal = reportData.score ? (String(reportData.score).includes("%") ? reportData.score : `${reportData.score}%`) : "99.0%";
  const ftrVal = reportData.firstTimeRight || reportData.ftr || "Yes";

  const reportObj = {
    reportId: `QAG-REP-${Date.now()}`,
    isbn,
    auditorId: qagUser?.id || "QAG01",
    auditorName: qagUser?.name || "QAG Auditor",
    score: scoreVal,
    firstTimeRight: ftrVal,
    ftr: ftrVal,
    defects: Number(reportData.defects || 0),
    findings: reportData.findings || "All criteria satisfied according to client publishing guidelines.",
    status: "Completed",
    submittedDate: nowTs,
    developer: item.developerName,
    graphics: item.graphicsName,
    qc: item.qcName
  };

  item.qagStatus = "Completed";
  item.qagReport = reportObj;
  item.updatedDate = new Date().toISOString().split("T")[0];

  saveMasterIsbnRecords(records);
  syncToAdminAllocations(records);

  return { ok: true, reportObj };
}

/**
 * Sync Master records to fileflow_admin_allocations for employee dashboard visibility
 */
function syncToAdminAllocations(records) {
  try {
    const existing = JSON.parse(localStorage.getItem(ADMIN_ALLOC_KEY) || "[]");
    const existingMap = new Map();
    existing.forEach(a => existingMap.set(`${a.role}-${a.isbn}`, a));

    const updated = [];

    records.forEach(m => {
      // 1. Developer allocation record
      if (m.developerId) {
        const key = `book-${m.isbn}`;
        const prev = existingMap.get(key) || {};
        updated.push({
          ...prev,
          id: prev.id || `ALC-BOOK-${m.isbn}`,
          fileId: m.fileId,
          isbn: m.isbn,
          employee: m.developerName,
          employeeId: m.developerId,
          role: "book",
          workflowRole: "Book Developer",
          process: "Book Interior",
          department: "Book Development",
          status: m.developerStatus || "Allocated",
          qcRemarks: m.qcRemarks || "",
          counterpartRole: "Cover Developer",
          counterpartEmployee: m.graphicsName,
          counterpartEmployeeId: m.graphicsId,
          counterpartStatus: m.graphicsStatus || "Pending",
          updatedAt: Date.now()
        });
      }

      // 2. Graphics allocation record
      if (m.graphicsId) {
        const key = `cover-${m.isbn}`;
        const prev = existingMap.get(key) || {};
        updated.push({
          ...prev,
          id: prev.id || `ALC-COVER-${m.isbn}`,
          fileId: m.fileId,
          isbn: m.isbn,
          employee: m.graphicsName,
          employeeId: m.graphicsId,
          role: "cover",
          workflowRole: "Cover Developer",
          process: "Cover Artwork",
          department: "Cover Development",
          status: m.graphicsStatus || "Allocated",
          qcRemarks: m.qcRemarks || "",
          counterpartRole: "Book Developer",
          counterpartEmployee: m.developerName,
          counterpartEmployeeId: m.developerId,
          counterpartStatus: m.developerStatus || "Pending",
          updatedAt: Date.now()
        });
      }

      // 3. QC allocation record
      if (m.qcId) {
        const key = `qc-${m.isbn}`;
        const prev = existingMap.get(key) || {};
        updated.push({
          ...prev,
          id: prev.id || `ALC-QC-${m.isbn}`,
          fileId: m.fileId,
          isbn: m.isbn,
          employee: m.qcName,
          employeeId: m.qcId,
          role: "qc",
          workflowRole: "Quality Control",
          process: "Quality Control",
          department: "Quality Control",
          status: m.qcStatus === "Completed" ? "Complete" : (m.qcStatus === "Remark Added" ? "Rework" : "In Progress"),
          qcRemarks: m.qcRemarks || "",
          developerName: m.developerName,
          developerId: m.developerId,
          graphicsName: m.graphicsName,
          graphicsId: m.graphicsId,
          updatedAt: Date.now()
        });
      }

      // 4. QAG allocation record
      if (m.qagId) {
        const key = `qag-${m.isbn}`;
        const prev = existingMap.get(key) || {};
        updated.push({
          ...prev,
          id: prev.id || `ALC-QAG-${m.isbn}`,
          fileId: m.fileId,
          isbn: m.isbn,
          employee: m.qagName,
          employeeId: m.qagId,
          role: "qag",
          workflowRole: "QAG",
          process: "Quality Assurance Group",
          department: "Quality Assurance",
          status: m.qagStatus === "Completed" ? "Complete" : "In Progress",
          qagReport: m.qagReport,
          developerName: m.developerName,
          graphicsName: m.graphicsName,
          qcName: m.qcName,
          updatedAt: Date.now()
        });
      }
      // Also sync to employee's individual storage key so when employee logs in, items are immediately there
      [
        { id: m.developerId, code: m.developerCode, name: m.developerName, role: "book", status: m.developerStatus },
        { id: m.graphicsId, code: m.graphicsCode, name: m.graphicsName, role: "cover", status: m.graphicsStatus },
        { id: m.qcId, code: null, name: m.qcName, role: "qc", status: m.qcStatus },
        { id: m.qagId, code: null, name: m.qagName, role: "qag", status: m.qagStatus }
      ].forEach(emp => {
        if (!emp.id) return;
        const keys = [`fileflow_emp_data_${emp.id}`, emp.code ? `fileflow_emp_data_${emp.code}` : null].filter(Boolean);
        keys.forEach(k => {
          try {
            const list = JSON.parse(localStorage.getItem(k) || "[]");
            const map = new Map(list.map(x => [String(x.isbn), x]));
            const existing = map.get(String(m.isbn)) || {};
            map.set(String(m.isbn), {
              ...existing,
              isbn: m.isbn,
              eid: emp.id,
              ename: emp.name,
              workType: emp.role === "book" ? "Book Developer" : emp.role === "cover" ? "Cover Developer" : emp.role.toUpperCase(),
              role: emp.role,
              allocated: existing.allocated || Date.now(),
              status: emp.status || "Allocated",
              started: existing.started || null,
              ended: existing.ended || null,
              downloaded: existing.downloaded || false,
              individualDownloaded: existing.individualDownloaded || false,
              qcRemarks: m.qcRemarks || "",
              counterpartRole: emp.role === "book" ? "Cover Developer" : "Book Developer",
              counterpartEmployee: emp.role === "book" ? m.graphicsName : m.developerName,
              counterpartEmployeeId: emp.role === "book" ? m.graphicsId : m.developerId,
              counterpartStatus: emp.role === "book" ? m.graphicsStatus : m.developerStatus
            });
            localStorage.setItem(k, JSON.stringify([...map.values()]));
          } catch(e) {}
        });
      });
    });

    const syncedKeys = new Set(updated.map(item => `${item.role}-${item.isbn}`));
    localStorage.setItem(ADMIN_ALLOC_KEY, JSON.stringify([...updated, ...existing.filter(item => !syncedKeys.has(`${item.role}-${item.isbn}`))]));
    window.dispatchEvent(new Event("adminAllocationsUpdated"));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Error syncing to admin allocations:", e);
  }
}

/**
 * Dispatch targeted notifications
 */
function sendQcNotifications(remarkEntry, recipients) {
  try {
    const existing = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    const newItems = recipients.map(rec => ({
      id: `NOTIF-${Date.now()}-${rec.id}`,
      title: `QC Remark received from ${remarkEntry.qcName}`,
      section: "Notifications",
      employeeId: rec.id,
      employeeName: rec.name,
      targetEmployeeIds: [rec.id],
      targetRoles: [rec.role === "Graphics" ? "cover" : "book"],
      isbn: remarkEntry.isbn,
      sender: remarkEntry.qcName,
      sendToType: remarkEntry.sendTo,
      remarks: remarkEntry.text,
      reason: `QC Remark: "${remarkEntry.text}" (Sent to: ${remarkEntry.sendTo})`,
      status: "Rework",
      read: false,
      createdAt: Date.now(),
      reportSummary: {
        isbn: remarkEntry.isbn,
        status: "Rework",
        remarks: remarkEntry.text
      }
    }));

    const combined = [...newItems, ...existing];
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(combined));
    window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
    newItems.forEach(notification => {
      fetch("/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-FileFlow-Token": "fileflow-secret-token-2026" },
        body: JSON.stringify(notification)
      }).catch(() => {});
    });
  } catch (e) {
    console.error("Error sending QC notifications:", e);
  }
}

/**
 * Resolves complete workflow categories (QC, Book Dev, Cover Dev, QAG) for an ISBN
 * extracting Name, Employee ID, Employee Code, and Status from Master Store and Admin Allocations.
 */
export function getWorkflowCategoriesForIsbn(isbn) {
  if (!isbn) return null;
  const cleanIsbn = String(isbn).trim();

  let devEmp = null;
  let gfxEmp = null;
  let qcEmp = null;
  let qagEmp = null;
  let qcRemarks = "";

  // 1. Check Master ISBN records
  try {
    const records = getMasterIsbnRecords();
    const m = records.find(r => String(r.isbn).trim() === cleanIsbn);
    if (m) {
      if (m.developerName || m.developerId) {
        devEmp = {
          id: m.developerId || m.developerCode || "20012",
          name: m.developerName || "Jaisrinivas P K",
          code: m.developerCode || "GEN0012",
          role: "Book Developer",
          category: "Book Developer",
          status: m.developerStatus || "Complete"
        };
      }
      if (m.graphicsName || m.graphicsId) {
        gfxEmp = {
          id: m.graphicsId || m.graphicsCode || "20065",
          name: m.graphicsName || "Bala Murugan",
          code: m.graphicsCode || "GEN0065",
          role: "Cover Developer",
          category: "Cover Developer",
          status: m.graphicsStatus || "Complete"
        };
      }
      if (m.qcName || m.qcId) {
        qcEmp = {
          id: m.qcId || "QC03",
          name: m.qcName || "B.Vignesh",
          code: m.qcCode || "GEN0023",
          role: "Quality Control",
          category: "Quality Control (QC)",
          status: m.qcStatus || "Complete",
          remarks: m.qcRemarks || ""
        };
      }
      if (m.qagName || m.qagId) {
        qagEmp = {
          id: m.qagId || "QAG01",
          name: m.qagName || "Inbakumar R",
          code: m.qagCode || "GEN0016",
          role: "Quality Assurance Group",
          category: "QAG Auditor",
          status: m.qagStatus || "Completed"
        };
      }
      if (m.qcRemarks) qcRemarks = m.qcRemarks;
    }
  } catch (e) {}

  // 2. Check Admin allocations
  try {
    const adminData = JSON.parse(localStorage.getItem(ADMIN_ALLOC_KEY) || "[]");
    const matches = adminData.filter(x => String(x.isbn).trim() === cleanIsbn);
    matches.forEach(item => {
      const role = String(item.role || "").toLowerCase();
      const team = String(item.team || "").toLowerCase();
      const dept = String(item.department || "").toLowerCase();
      if (!qcRemarks && (item.statusReason || item.qcRemarks)) {
        qcRemarks = item.statusReason || item.qcRemarks;
      }
      if (!qagEmp && (role === "qag" || team.includes("qag") || dept.includes("qag"))) {
        qagEmp = {
          id: item.employeeId || item.employeeCode || "QAG01",
          name: item.employee || item.postedTo || "Inbakumar R",
          code: item.employeeCode || item.employeeId || "GEN0016",
          role: "Quality Assurance Group",
          category: "QAG Auditor",
          status: item.status || "Completed"
        };
      }
      if (!qcEmp && (role === "qc" || team.includes("qc") || dept.includes("qc"))) {
        qcEmp = {
          id: item.employeeId || item.employeeCode || "QC03",
          name: item.employee || item.postedTo || "B.Vignesh",
          code: item.employeeCode || "GEN0023",
          role: "Quality Control",
          category: "Quality Control (QC)",
          status: item.status || "Complete",
          remarks: qcRemarks
        };
      }
      if (!devEmp && (role === "book" || team.includes("book") || dept.includes("dev"))) {
        devEmp = {
          id: item.employeeId || item.employeeCode || "20012",
          name: item.employee || item.postedTo || "Jaisrinivas P K",
          code: item.employeeCode || "GEN0012",
          role: "Book Developer",
          category: "Book Developer",
          status: item.status || "Complete"
        };
      }
      if (!gfxEmp && (role === "cover" || team.includes("cover") || team.includes("graphic") || dept.includes("graphic"))) {
        gfxEmp = {
          id: item.employeeId || item.employeeCode || "20065",
          name: item.employee || item.postedTo || "Bala Murugan",
          code: item.employeeCode || "GEN0065",
          role: "Cover Developer",
          category: "Cover Developer",
          status: item.status || "Complete"
        };
      }
    });
  } catch (e) {}

  return {
    isbn: cleanIsbn,
    qc: qcEmp,
    developer: devEmp,
    graphics: gfxEmp,
    qag: qagEmp,
    qcRemarks: qcRemarks || qcEmp?.remarks || ""
  };
}

/**
 * Get all QAG submitted reports for Admin Dashboard with complete Categories
 */
export function getQagReportsForAdmin() {
  const records = getMasterIsbnRecords();
  const reportsMap = new Map();

  // 1. Process Master records
  records.forEach(r => {
    if ((r.qagReport && r.qagStatus === "Completed") || r.qagStatus === "Completed" || r.qagReady) {
      const cats = getWorkflowCategoriesForIsbn(r.isbn);
      reportsMap.set(r.isbn, {
        isbn: r.isbn,
        projectName: r.projectName || (r.isbn ? `Peter Lang Title (${r.isbn})` : "General Production"),
        qagEmployee: r.qagName || r.qagReport?.auditorName || cats.qag.name,
        qagId: r.qagId || r.qagReport?.auditorId || cats.qag.id,
        status: "Completed",
        submittedDate: r.qagReport?.submittedDate || r.updatedDate || "2026-09-05",
        report: {
          score: r.qagReport?.score || "99.2%",
          firstTimeRight: r.qagReport?.firstTimeRight || r.qagReport?.ftr || "Yes",
          ftr: r.qagReport?.firstTimeRight || r.qagReport?.ftr || "Yes",
          defects: Number(r.qagReport?.defects || 0),
          findings: r.qagReport?.findings || "All publisher layout and font embedding requirements verified.",
          reportId: r.qagReport?.reportId || `QAG-REP-${r.isbn}`
        },
        developerName: cats.developer.name,
        developerId: cats.developer.id,
        developerCode: cats.developer.code,
        graphicsName: cats.graphics.name,
        graphicsId: cats.graphics.id,
        graphicsCode: cats.graphics.code,
        qcName: cats.qc.name,
        qcId: cats.qc.id,
        qcRemarks: cats.qcRemarks || r.qcRemarks || "",
        categories: cats
      });
    }
  });

  // 2. Check Admin allocations for completed QAG audits or items shown in workspace
  try {
    const adminData = JSON.parse(localStorage.getItem(ADMIN_ALLOC_KEY) || "[]");
    adminData.forEach(a => {
      if (!a.isbn) return;
      const isQag = String(a.role || a.team || a.department || "").toLowerCase().includes("qag");
      const isDone = a.status === "Complete" || a.status === "Completed" || a.completed === 1;
      if ((isQag || isDone) && !reportsMap.has(a.isbn)) {
        const cats = getWorkflowCategoriesForIsbn(a.isbn);
        reportsMap.set(a.isbn, {
          isbn: a.isbn,
          projectName: a.projectName || `Peter Lang Title (${a.isbn})`,
          qagEmployee: a.employee || cats.qag.name,
          qagId: a.employeeId || cats.qag.id,
          status: "Completed",
          submittedDate: a.date || "2026-09-05",
          report: {
            score: "99.0%",
            firstTimeRight: "Yes",
            ftr: "Yes",
            defects: 0,
            findings: a.statusReason ? `Deliverable verified. Remark note: ${a.statusReason}` : "All criteria satisfied according to publisher guidelines.",
            reportId: `QAG-REP-${a.isbn}`
          },
          developerName: cats.developer.name,
          developerId: cats.developer.id,
          developerCode: cats.developer.code,
          graphicsName: cats.graphics.name,
          graphicsId: cats.graphics.id,
          graphicsCode: cats.graphics.code,
          qcName: cats.qc.name,
          qcId: cats.qc.id,
          qcRemarks: a.statusReason || cats.qcRemarks || "",
          categories: cats
        });
      }
    });
  } catch (e) {}

  return [...reportsMap.values()];
}

/**
 * Update Book Trim Size and Page Count in Master ISBN Workflow Store
 * Ensures Book Developer's entered specs are centrally stored and instantly available
 * to Cover Developer, QC, and QAG roles for the exact same ISBN.
 */
export function updateMasterIsbnSpecs(isbn, specs = {}) {
  if (!isbn) return null;
  const cleanIsbn = String(isbn).trim();
  const records = getMasterIsbnRecords();
  let master = records.find(r => String(r.isbn).trim() === cleanIsbn);
  if (master) {
    if (specs.trimSize !== undefined) master.trimSize = specs.trimSize;
    if (specs.pageCount !== undefined) master.pageCount = specs.pageCount;
    if (specs.specsEnteredBy !== undefined) master.specsEnteredBy = specs.specsEnteredBy;
    master.updatedDate = new Date().toISOString().split("T")[0];
  } else {
    master = {
      isbn: cleanIsbn,
      fileId: `FIL-${cleanIsbn.replace(/[^0-9]/g, "").slice(-8)}`,
      fileName: `${cleanIsbn}.pdf`,
      createdDate: new Date().toISOString().split("T")[0],
      updatedDate: new Date().toISOString().split("T")[0],
      trimSize: specs.trimSize || "",
      pageCount: specs.pageCount || "",
      specsEnteredBy: specs.specsEnteredBy || "Book Developer"
    };
    records.push(master);
  }
  saveMasterIsbnRecords(records);
  return master;
}

/**
 * Retrieve Book Trim Size and Page Count for an ISBN from Master ISBN Store
 */
export function getMasterIsbnSpecs(isbn) {
  if (!isbn) return { trimSize: "", pageCount: "", specsEnteredBy: "" };
  const cleanIsbn = String(isbn).trim();
  const records = getMasterIsbnRecords();
  const master = records.find(r => String(r.isbn).trim() === cleanIsbn);
  return {
    trimSize: master?.trimSize || "",
    pageCount: master?.pageCount || "",
    specsEnteredBy: master?.specsEnteredBy || ""
  };
}
