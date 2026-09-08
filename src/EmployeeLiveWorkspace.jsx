import { runCopyPool } from "./services/networkCopy.js";
"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileArchive,
  ClipboardCheck,
  Activity,
  BarChart3,
  Share2,
  Bell,
  Download,
  Upload,
  CheckCircle2,
  Clock3,
  Search,
  Filter,
  ArrowUpDown,
  Folder,
  FileText,
  AlertCircle,
  Eye,
  FileSpreadsheet,
  RefreshCw,
  MessageSquareText,
  User,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  Square,
  Send,
  RotateCcw,
  XCircle,
  BookOpen,
  Scale,
  Trash2,
  BellOff,
  SlidersHorizontal,
  Coffee,
  LogOut,
  Utensils,
  CupSoda
} from "lucide-react";
import "./employee-live-workspace.css";
import Pagination from "./Pagination";
import { matchesEmployee, assignedRole, mergeEmployeeAllocations } from "./services/employeeAllocation";
import "./pagination.css";
import {
  getMasterIsbnRecords,
  syncAllocatedMasterRecords,
  updateMasterIsbnSpecs,
  getMasterIsbnSpecs,
  updateDeveloperCompletion,
  updateGraphicsCompletion,
  addQcRemark,
  completeQc,
  submitQagReport,
  isDisallowedIsbn
} from "./services/masterIsbnStore";

const notificationMatchesRecipient = (notification, employeeId, workflowRole) => {
  const currentId = String(employeeId || "").trim().toLowerCase();
  const targetIds = Array.isArray(notification?.targetEmployeeIds)
    ? notification.targetEmployeeIds.map(value => String(value || "").trim().toLowerCase()).filter(Boolean)
    : [];
  const notificationEmployeeId = String(notification?.employeeId || notification?.recipientId || "").trim().toLowerCase();
  const targetRoles = Array.isArray(notification?.targetRoles)
    ? notification.targetRoles.map(value => String(value || "").trim().toLowerCase()).filter(Boolean)
    : [];
  if (targetIds.length && !targetIds.includes(currentId)) return false;
  if (!targetIds.length && notificationEmployeeId && notificationEmployeeId !== currentId) return false;
  if (targetRoles.length && !targetRoles.includes(String(workflowRole || "").toLowerCase())) return false;
  return true;
};

const uploadedIsbnStorageKey = "fileflow_uploaded_isbns";
const readUploadedIsbns = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(uploadedIsbnStorageKey) || "[]");
    return new Set(Array.isArray(saved) ? saved.map(value => String(value).trim()).filter(Boolean) : []);
  } catch {
    return new Set();
  }
};

// Initial data generation for employee (Zero dummy data: strictly Admin allocations)
function generateInitialAllocations(empId, empName) {
  return [];
}

export default function EmployeeLiveWorkspace({ user, note, activePage = "files", setActiveNav, todayTasks = [] }) {
  const empId = user?.empId || user?.username || user?.id || "";
  const empName = user?.name || "";
  const persistKey = `fileflow_emp_data_${empId}`;
  const assignedTodayTasks = (todayTasks || []).filter((task) => {
    const target = (task.employee || "").toLowerCase();
    const employeeName = (empName || "").toLowerCase();
    const shortName = employeeName.split(" ")[0];
    return target === employeeName || (shortName && target.includes(shortName)) || target.includes(employeeName) || target.includes((empName || "").replace(/\s+/g, ""));
  });

  // Core Data State: User requested strictly zero dummy data.
  // Only Admin-allocated files will be stored or displayed.
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(persistKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const dummyIsbns = new Set([
          "9781394472567", "9781119983412", "9780198876542", "9783631363164", "9783906763682",
          "9781433100011", "9781433100028", "9781433100035", "9781433100042", "9781433100059",
          "9781433100066", "9781433100073", "9781433100080", "9781433100097", "9781433100103",
          "9781433100110", "9781433100127", "9781433100134", "9781433100141", "9781433100158",
          "9781433100165", "9781433100172", "9781433100189", "9781433100196", "9781433100202",
          "9781433100219", "9781433100226", "9781433100233", "9781433100240", "9781433100257",
          "9781433200001", "9781433200002", "9781433200003", "9781433200004", "9781433200005",
          "9781433200006", "9781433200007", "9781433200008", "9781433200009", "9781433200010",
          "9781433200011", "9781433200012", "9781433200013", "9781433200014", "9781433200015",
          "9781433200016", "9781433200017", "9781433200018", "9781433200019", "9781433200020"
        ]);
        const realAllocations = parsed.filter(r => r && (r.allocationId || r.batchId) && !dummyIsbns.has(String(r.isbn)) && !isDisallowedIsbn(r.isbn));
        return realAllocations.map((r) => {
          if (!r.workflowVersion || r.workflowVersion < 4) {
            if (r.status === "WIP" && !r.downloaded) {
              r.status = "Allocated";
            }
            r.workflowVersion = 4;
          }
          return r;
        });
      }
    } catch (e) {}
    return [];
  });

  // Four-Role Switcher State: book, cover, qc, qag
  const [selectedRole, setSelectedRole] = useState(() => {
    const role = String(user?.designation || user?.role || "").toLowerCase();
    if (role.includes("cover") || role.includes("graphic") || role.includes("art")) return "cover";
    if (role.includes("qag")) return "qag";
    if (role.includes("qc")) return "qc";
    return "book";
  });

  const isMyAllocationItem = item => matchesEmployee(item, user || {});

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Temp Staging & Quarantine States
  const [tempStatus, setTempStatus] = useState({ total_bytes: 0, count: 0, max_bytes: 7 * 1024 * 1024 * 1024 });
  const [tempFiles, setTempFiles] = useState([]);
  const [recentsBatches, setRecentsBatches] = useState([]);
  const [showRecentsModal, setShowRecentsModal] = useState(false);
  const [recentFilter, setRecentFilter] = useState("Daily");
  const [recentDate, setRecentDate] = useState(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });
  const [uploadModalItem, setUploadModalItem] = useState(null);

  // Navigation synced directly with left sidebar
  const subPage = activePage;
  const setSubPage = (newPage) => {
    const navMap = {
      files: "Dashboard",
      alloc: "File Allocation",
      tracker: "Production Tracker",
      reports: "Production Report",
      notifications: "Notifications",
      network: "Network Copy"
    };
    if (setActiveNav && navMap[newPage]) {
      setActiveNav(navMap[newPage]);
    }
  };

  const [q, setQ] = useState("");
  const [mailSummary, setMailSummary] = useState({ total: 0, unread: 0 });
  const [allocPage, setAllocPage] = useState(1);
  const [allocStatusFilter, setAllocStatusFilter] = useState("All");
  const [allocSort, setAllocSort] = useState("allocatedDesc");

  // Timer Tick
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Daily Work Timer & Shift Attendance State
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const timerStorageKey = `fileflow_attendance_timer_${empId || "default"}_${todayDateStr}`;

  const [workTimerState, setWorkTimerState] = useState(() => {
    try {
      const raw = localStorage.getItem(timerStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === todayDateStr) {
          return parsed;
        }
      }
    } catch (e) {}

    return {
      date: todayDateStr,
      status: "idle", // "idle" | "working" | "break" | "checked_out"
      checkInTime: null,
      checkOutTime: null,
      activeBreakType: null,
      activeBreakStart: null,
      workSessions: [],
      breakSessions: [],
      finalProductionSecs: 0
    };
  });

  const [showBreakOptions, setShowBreakOptions] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(timerStorageKey, JSON.stringify(workTimerState));
    } catch (e) {}
  }, [workTimerState, timerStorageKey]);

  // Auto-refresh and reset timers to 00:00:00 at 12:00:00 AM (midnight / new calendar day)
  useEffect(() => {
    const checkMidnight = () => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const currentDateStr = `${year}-${month}-${day}`;

      if (workTimerState.date && workTimerState.date !== currentDateStr) {
        const resetState = {
          date: currentDateStr,
          status: "idle",
          checkInTime: null,
          checkOutTime: null,
          activeBreakType: null,
          activeBreakStart: null,
          workSessions: [],
          breakSessions: [],
          finalProductionSecs: 0
        };
        setWorkTimerState(resetState);
        try {
          const newKey = `fileflow_attendance_timer_${empId || "default"}_${currentDateStr}`;
          localStorage.setItem(newKey, JSON.stringify(resetState));
        } catch (e) {}
      }
    };

    const midnightTimer = setInterval(checkMidnight, 1000);
    return () => clearInterval(midnightTimer);
  }, [workTimerState.date, empId]);


  useEffect(() => {
    let active = true;
    const aliases = [user?.username, user?.empId, user?.giEmpId, user?.id].filter(Boolean).join(",");
    const loadMailSummary = async () => {
      try {
        const response = await fetch(`/api/mail?user=${encodeURIComponent(empId)}&aliases=${encodeURIComponent(aliases)}`);
        const payload = await response.json();
        if (!active || !response.ok || !payload.ok) return;
        const inbox = (payload.items || []).filter(item => item.folder !== "Trash" && item.folder !== "Drafts");
        setMailSummary({ total: inbox.length, unread: inbox.filter(item => item.read === false).length });
      } catch {}
    };
    loadMailSummary();
    const timer = setInterval(loadMailSummary, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [empId, user]);

  // Save State
  useEffect(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify(data));
    } catch (e) {}
  }, [data, persistKey]);

  useEffect(() => {
    data.filter(x => x.allocationId).forEach(x => {
      fetch("/api/allocations/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        id: x.allocationId,
        status: x.status,
        statusReason: x.statusReason || "",
        started: x.started || null,
        ended: x.ended || null,
        uploaded: x.uploaded || "",
        savedPath: x.savedPath || "",
        downloadSavedPath: x.downloadSavedPath || ""
      }) }).catch(() => {});
    });
  }, [data]);

  // Modal States
  const [detailItem, setDetailItem] = useState(null);
  const [statusModal, setStatusModal] = useState(null); // { isbn, status }
  const [transferMessage, setTransferMessage] = useState("");
  const [modalComment, setModalComment] = useState("");
  const [commentError, setCommentError] = useState("");

  // QC Remark Modal State (Send To: 'Graphics/Developer' | 'Developer' | 'Graphics')
  const [qcRemarkModalItem, setQcRemarkModalItem] = useState(null);
  const [qcSendTo, setQcSendTo] = useState("Graphics/Developer");
  const [qcRemarkText, setQcRemarkText] = useState("");

  // QAG Report Modal State
  const [qagModalItem, setQagModalItem] = useState(null);
  const [qagScore, setQagScore] = useState("99.2%");
  const [qagFtr, setQagFtr] = useState("Yes");
  const [qagDefects, setQagDefects] = useState(0);
  const [qagFindings, setQagFindings] = useState("Verified all publisher specifications, spine wrapping, barcode margins, and internal fonts cleanly.");

  const handleQuickCompleteQc = (isbn) => {
    completeQc(isbn, user);
    setData(prev => prev.map(x => x.isbn === isbn ? { ...x, status: "Complete" } : x));
    note?.(`QC Approved & Completed for ${isbn}. Now QAG-Ready.`);
  };

  const handleOpenQcRemarkModal = (item) => {
    setQcRemarkModalItem(item);
    setQcSendTo("Graphics/Developer");
    setQcRemarkText(item.qcRemarks || "");
  };

  const handleSaveQcRemark = () => {
    if (!qcRemarkModalItem) return;
    if (!qcRemarkText.trim()) {
      alert("Please enter QC remarks / correction notes.");
      return;
    }
    const currentIsbn = qcRemarkModalItem.isbn;
    addQcRemark(currentIsbn, {
      sendTo: qcSendTo,
      text: qcRemarkText.trim(),
      qcUser: user || { id: empId, name: empName }
    });
    // Mark this item as Rework locally
    handleStatusChange(currentIsbn, "Rework");
    setQcRemarkModalItem(null);
    setQcRemarkText("");
    note?.(`QC Remark sent to ${qcSendTo} for ${currentIsbn}. Recipient(s) marked for Rework.`);
  };

  const handleOpenQagModal = (item) => {
    setQagModalItem(item);
    setQagScore("99.2%");
    setQagFtr("Yes");
    setQagDefects(0);
    setQagFindings("Verified all publisher specifications, spine wrapping, barcode margins, and internal fonts cleanly.");
  };

  const handleSubmitQag = () => {
    if (!qagModalItem) return;
    const currentIsbn = qagModalItem.isbn;
    submitQagReport(currentIsbn, {
      auditorId: empId,
      auditorName: empName,
      score: qagScore,
      ftr: qagFtr,
      defects: Number(qagDefects) || 0,
      findings: qagFindings,
      status: "Completed",
      submittedDate: new Date().toISOString()
    });
    handleStatusChange(currentIsbn, "Complete");
    setQagModalItem(null);
    note?.(`QAG Audit Report submitted successfully for ${currentIsbn}. Admin Dashboard updated.`);
  };

  // Notifications State - fetched from central API
  const [notifications, setNotifications] = useState([]);

  const handleMarkAllAsRead = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId })
      });
    } catch (e) {}
    window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
    note?.("All notifications marked as read");
  };

  const handleClearNotifications = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    setNotifications([]);
    try {
      await fetch("/api/notifications/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId })
      });
    } catch (e) {}
    window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
    note?.("All notifications cleared");
  };

  useEffect(() => {
    const handleNotifsUpdate = async () => {
      try {
        const res = await fetch(`/api/notifications?employeeId=${encodeURIComponent(empId)}&role=${encodeURIComponent(selectedRole)}`);
        const d = await res.json();
        if (d.ok && Array.isArray(d.notifications)) {
          setNotifications(d.notifications);
        }
      } catch (e) {}
    };
    window.addEventListener("fileflowNotificationsUpdated", handleNotifsUpdate);
    return () => {
      window.removeEventListener("fileflowNotificationsUpdated", handleNotifsUpdate);
    };
  }, [empId, selectedRole]);

  // Network Copy State
  const [networkSource, setNetworkSource] = useState("");
  const [networkDest, setNetworkDest] = useState("");
  const [networkBatch, setNetworkBatch] = useState("");
  const [networkIsbns, setNetworkIsbns] = useState("");
  const [networkFound, setNetworkFound] = useState([]);
  const [networkMissing, setNetworkMissing] = useState([]);
  const [networkBusy, setNetworkBusy] = useState(false);
  const networkOperationRef = useRef(false);
  const [networkMessage, setNetworkMessage] = useState("Ready");
  const [uploadedIsbns, setUploadedIsbns] = useState(() => readUploadedIsbns());
  const networkUploadInputRef = useRef(null);

  const isIsbnUploaded = (isbn, item) => uploadedIsbns.has(String(isbn || "").trim()) || Boolean(item?.uploaded);

  const markIsbnUploaded = (isbn) => {
    const cleanIsbn = String(isbn || "").trim();
    if (!/^\d{13}$/.test(cleanIsbn)) return;
    setUploadedIsbns(prev => {
      const next = new Set([...prev, cleanIsbn]);
      localStorage.setItem(uploadedIsbnStorageKey, JSON.stringify([...next]));
      window.dispatchEvent(new Event("fileflowUploadedIsbnsUpdated"));
      return next;
    });
  };

  useEffect(() => {
    const refreshUploadedIsbns = () => setUploadedIsbns(readUploadedIsbns());
    window.addEventListener("storage", refreshUploadedIsbns);
    window.addEventListener("fileflowUploadedIsbnsUpdated", refreshUploadedIsbns);
    return () => {
      window.removeEventListener("storage", refreshUploadedIsbns);
      window.removeEventListener("fileflowUploadedIsbnsUpdated", refreshUploadedIsbns);
    };
  }, []);

  const hasAutoLoadedRef = useRef(false);

  // Admin allocations are shared through the app server and localStorage.
  // Polling & storage event listener makes newly allocated ISBNs appear instantly in Network Copy and File Allocation.
  useEffect(() => {
    let alive = true;
    let loading = false;
    const load = async () => {
      if (loading) return;
      loading = true;
      try {
        let incoming = [];
        let serverConfirmed = false;

        // 1. Try fetching from backend API
        try {
          const aliases = [user?.username, user?.empId, user?.giEmpId, user?.id].filter(Boolean).join(",");
          const response = await fetch(`/api/allocations?employee=${encodeURIComponent(empId)}&name=${encodeURIComponent(empName)}&aliases=${encodeURIComponent(aliases)}`);
          const payload = await response.json();
          if (response.ok && payload.ok && payload.items) {
            incoming = payload.items;
            serverConfirmed = true;
          }
        } catch (e) {}

        // 2. Also check local admin allocations store for immediate local sync
        try {
          const localAdminAllocations = JSON.parse(localStorage.getItem("fileflow_admin_allocations") || "[]");
          const localMatches = localAdminAllocations.filter(item => matchesEmployee(item, user || {}));
          incoming = mergeEmployeeAllocations([...incoming, ...localMatches]).filter(item => !isDisallowedIsbn(item.isbn));
        } catch (e) {}

        if (!alive) return;

        // User requested: Zero dummy data. ONLY Admin allocated files and copied files should be visible.
        // If Admin has not allocated any files and none were copied, show 0 items (empty table).
        if (!incoming.length) {
          if (!serverConfirmed) return;
          setData(previous => {
            const copiedInSession = (previous || []).filter(x => x && (x.downloaded || x.individualDownloaded) && !isDisallowedIsbn(x.isbn));
            return copiedInSession;
          });
          return;
        }

        const roles = [...new Set(incoming.map(assignedRole).filter(Boolean))];
        if (roles.length === 1) setSelectedRole(roles[0]);
        // Recover missing local master mappings from the persisted dual batch.
        const masterAssignments = incoming.flatMap(item => [item, ...(item.counterpartEmployeeId ? [{
          isbn: item.isbn,
          role: item.counterpartRole,
          employeeId: item.counterpartEmployeeId,
          employee: item.counterpartEmployee,
          status: item.counterpartStatus || "Allocated"
        }] : [])]);
        syncAllocatedMasterRecords(masterAssignments, { onlyMissing: true });
        setData(previous => {
          const prevMap = new Map((previous || []).map(x => [String(x.isbn).trim(), x]));
          // Strictly map ONLY incoming admin allocations, preserving user work progress
          const mapped = incoming.filter(x => x && x.isbn && !isDisallowedIsbn(x.isbn)).map(x => {
            const cleanIsbn = String(x.isbn || "").trim();
            const old = prevMap.get(cleanIsbn);
            return {
              ...(old || {}),
              allocationId: x.id || old?.allocationId,
              batchId: x.batchId || old?.batchId,
              role: assignedRole(x) || old?.role,
              workType: assignedRole(x) === "book" ? "Book Developer" : assignedRole(x) === "cover" ? "Cover Developer" : x.workflowRole || old?.workType,
              counterpartRole: x.counterpartRole || old?.counterpartRole,
              counterpartEmployee: x.counterpartEmployee || old?.counterpartEmployee,
              counterpartEmployeeId: x.counterpartEmployeeId || old?.counterpartEmployeeId,
              counterpartStatus: x.counterpartStatus || old?.counterpartStatus,
              isbn: cleanIsbn,
              eid: x.employeeId || empId,
              ename: x.employee || empName,
              allocated: x.createdAt || old?.allocated || Date.now(),
              status: old?.status || x.status || "Allocated",
              started: old?.started || x.started || null,
              ended: old?.ended || x.ended || null,
              sessions: old?.sessions || [],
              downloaded: old?.downloaded || x.downloaded || false,
              individualDownloaded: old?.individualDownloaded || x.individualDownloaded || false,
              priority: x.priority || old?.priority || "Normal",
              dueDate: x.dueDate || old?.dueDate || "",
              projectId: x.projectId || x.requirementId || old?.projectId || "PRJ-PETERLANG",
              trimSize: old?.trimSize || x.trimSize || getMasterIsbnSpecs(cleanIsbn).trimSize || "",
              pageCount: (old?.pageCount !== undefined && old?.pageCount !== "")
                ? old.pageCount
                : ((x.pageCount !== undefined && x.pageCount !== "") ? x.pageCount : (getMasterIsbnSpecs(cleanIsbn).pageCount || "")),
              specsEnteredBy: old?.specsEnteredBy || x.specsEnteredBy || getMasterIsbnSpecs(cleanIsbn).specsEnteredBy || "",
              chapters: x.chapters || old?.chapters || [],
              fileCopies: old?.fileCopies || [],
              downloadSavedPath: old?.downloadSavedPath || x.downloadSavedPath || ""
            };
          });

          // Also retain any items copied in this session
          const mappedIsbns = new Set(mapped.map(x => String(x.isbn).trim()));
          const copiedInSession = (previous || []).filter(x => x && (x.downloaded || x.individualDownloaded) && !isDisallowedIsbn(x.isbn) && !mappedIsbns.has(String(x.isbn).trim()));
          return [...mapped, ...copiedInSession];
        });

        // On initial mount only, if the employee has uncopied pending allocations and networkIsbns is empty,
        // pre-fill the pending uncopied ISBNs once so employee can easily start copying.
        // DO NOT overwrite or continuously re-populate on every 3-second poll!
        if (!hasAutoLoadedRef.current) {
          hasAutoLoadedRef.current = true;
          const copiedKey = `fileflow_copied_isbns_${empId}`;
          const copiedSet = new Set(JSON.parse(localStorage.getItem(copiedKey) || "[]"));

          const pendingAllocated = incoming.filter(x => {
            const cleanIsbn = String(x.isbn || "").trim();
            return !isDisallowedIsbn(cleanIsbn) && !copiedSet.has(cleanIsbn) && !(x.downloaded || x.individualDownloaded);
          });
          const pendingIsbns = [...new Set(pendingAllocated.map(x => String(x.isbn || "").trim()).filter(Boolean))];

          setNetworkIsbns(prev => {
            if (!prev || !prev.trim()) {
              return pendingIsbns.join("\n");
            }
            return prev;
          });
        }
      } catch (err) {
        if (alive) setNetworkMessage("Allocation sync unavailable; showing saved assignments.");
      } finally {
        loading = false;
      }
    };

    load();
    const timer = setInterval(load, 3000);
    window.addEventListener("storage", load);
    window.addEventListener("masterIsbnStoreUpdated", load);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("storage", load);
      window.removeEventListener("masterIsbnStoreUpdated", load);
    };
  }, [empId, empName, user]);

  // Helper Functions
  const fmt = (t) => (t ? new Date(t).toLocaleString() : "-");
  const shortDateTime = (t) => {
    if (!t) return "-";
    const d = new Date(t);
    return `${d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })} ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  };
  const dateParts = (t) => {
    if (!t) return { date: "-", time: "-" };
    const d = new Date(t);
    return {
      date: d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    };
  };
  const secs = (x) => {
    if (!x) return 0;
    if (x.sessions && x.sessions.length > 0) {
      return x.sessions.reduce((tot, s) => tot + ((s.end || now) - s.start) / 1000, 0);
    }
    if (x.started) {
      return ((x.ended || now) - x.started) / 1000;
    }
    return 0;
  };
  const dur = (totalSecs) => {
    const n = Math.floor(Math.max(0, totalSecs || 0));
    const h = String(Math.floor(n / 3600)).padStart(2, "0");
    const m = String(Math.floor((n % 3600) / 60)).padStart(2, "0");
    const s = String(n % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const workflowRole = selectedRole;
  const roleLabel =
    selectedRole === "book"
      ? "Book Developer"
      : selectedRole === "cover"
      ? "Cover Developer"
      : selectedRole === "qc"
      ? "Quality Control"
      : "QAG";

  const roleDeliverableDesc =
    selectedRole === "book"
      ? "<isbn>_txt.pdf"
      : selectedRole === "cover"
      ? "<isbn>_cvr_eu.pdf, <isbn>_cvr_int.pdf"
      : "All 3 Deliverables (<isbn>_txt.pdf, <isbn>_cvr_eu.pdf, <isbn>_cvr_int.pdf)";

  const isDeliverableAllowed = (isbn, filename, role = workflowRole) => {
    const fn = (filename || "").toLowerCase();
    const cleanIsbn = String(isbn || "").toLowerCase();
    if (role === "book") return fn === `${cleanIsbn}_txt.pdf` || fn.endsWith(`/${cleanIsbn}_txt.pdf`);
    if (role === "cover") {
      return (
        fn === `${cleanIsbn}_cvr_eu.pdf` ||
        fn === `${cleanIsbn}_cvr_int.pdf` ||
        fn.endsWith(`/${cleanIsbn}_cvr_eu.pdf`) ||
        fn.endsWith(`/${cleanIsbn}_cvr_int.pdf`)
      );
    }
    return (
      fn.includes(`${cleanIsbn}_txt.pdf`) ||
      fn.includes(`${cleanIsbn}_cvr_eu.pdf`) ||
      fn.includes(`${cleanIsbn}_cvr_int.pdf`)
    );
  };

  const proceedToNetwork = () => {
    const pendingToCopy = data
      .filter((x) => !x.downloaded && !x.individualDownloaded && !(x.fileCopies && x.fileCopies.length > 0) && x.status !== "Complete")
      .map((x) => String(x.isbn).trim())
      .filter(Boolean);
    if (pendingToCopy.length) {
      setNetworkIsbns(pendingToCopy.join("\n"));
      note?.(`Proceeded to Network Copy with ${pendingToCopy.length} pending ISBNs.`);
    } else {
      setNetworkIsbns("");
      note?.("All allocated files are already downloaded/copied. ISBN list is clear.");
    }
    setSubPage("network");
  };

  const refreshTempStatus = async () => {
    try {
      const res = await fetch(`/temp-status?ownerId=${encodeURIComponent(empId)}`, {
        headers: { "X-FileFlow-Token": "fileflow-secret-token-2026" }
      });
      const d = await res.json();
      if (d.ok && d.status) setTempStatus(d.status);
    } catch (e) {}
  };

  const refreshTempFiles = async () => {
    try {
      const res = await fetch(
        `/temp-files?ownerId=${encodeURIComponent(empId)}&role=${encodeURIComponent(workflowRole)}`,
        { headers: { "X-FileFlow-Token": "fileflow-secret-token-2026" } }
      );
      const d = await res.json();
      if (d.ok && Array.isArray(d.files)) setTempFiles(d.files);
    } catch (e) {}
  };

  const loadRecentsBatches = async () => {
    try {
      const res = await fetch(`/recents?ownerId=${encodeURIComponent(empId)}`, {
        headers: { "X-FileFlow-Token": "fileflow-secret-token-2026" }
      });
      const d = await res.json();
      if (d.ok && Array.isArray(d.batches)) setRecentsBatches(d.batches);
    } catch (e) {}
  };

  const recentActivityRows = useMemo(() => {
    const selectedDate = recentDate ? new Date(`${recentDate}T00:00:00`) : new Date();
    const rangeStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    let rangeEnd;
    if (recentFilter === "Weekly") {
      const mondayOffset = (rangeStart.getDay() + 6) % 7;
      rangeStart.setDate(rangeStart.getDate() - mondayOffset);
      rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeEnd.getDate() + 7);
    } else if (recentFilter === "Monthly") {
      rangeStart.setDate(1);
      rangeEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + 1, 1);
    } else {
      rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeEnd.getDate() + 1);
    }

    return (recentsBatches || [])
      .flatMap(batch => (batch.rows || []).map(row => ({
        ...row,
        deletedAt: batch.deletedAt,
        batchId: batch.id
      })))
      .filter(row => {
        const deletedTime = Number(row.deletedAt || 0) * 1000;
        return deletedTime >= rangeStart.getTime() && deletedTime < rangeEnd.getTime();
      })
      .sort((a, b) => Number(b.deletedAt || 0) - Number(a.deletedAt || 0));
  }, [recentsBatches, recentFilter, recentDate]);

  useEffect(() => {
    refreshTempStatus();
    refreshTempFiles();
  }, [empId, workflowRole, subPage]);

  // 10-second notifications polling
  useEffect(() => {
    let alive = true;
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`/api/notifications?employeeId=${encodeURIComponent(empId)}&role=${encodeURIComponent(workflowRole)}`);
        const d = await res.json();
        if (alive && d.ok && Array.isArray(d.notifications)) {
          setNotifications(d.notifications);
        }
      } catch (e) {}
    };
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 10000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [empId, workflowRole]);

  // 2-Hour Continuous Tracking Alert
  useEffect(() => {
    const checkTwoHours = () => {
      const nowMs = Date.now();
      data.forEach((r) => {
        if (r.status === "WIP" && r.started && !r.notifiedTwoHours) {
          const diffHours = (nowMs - r.started) / (1000 * 3600);
          if (diffHours >= 2) {
            r.notifiedTwoHours = true;
            fetch("/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-FileFlow-Token": "fileflow-secret-token-2026" },
              body: JSON.stringify({
                role: workflowRole,
                isbn: r.isbn,
                title: "Two Hours Continuous Tracking Alert",
                message: `Continuous 2-Hour tracking alert for ${r.isbn}. Please take a mandatory break!`,
                reason: `Item ${r.isbn} has been in WIP for over 2 hours without a break.`,
                type: "alert",
                sender: "System",
                createdAt: Date.now()
              })
            }).catch(() => {});
          }
        }
      });
    };
    const timer = setInterval(checkTwoHours, 30000);
    return () => clearInterval(timer);
  }, [data, workflowRole]);

  const breakSecs = (item) => (item.holdSessions || []).reduce((total, session) => total + ((session.end || now) - session.start) / 1000, 0);
  const breakDetails = (item) => (item.holdSessions || []).map(session =>
    `${session.type || "Break time"}: ${shortDateTime(session.start)} to ${session.end ? shortDateTime(session.end) : "Running"} (${dur(((session.end || now) - session.start) / 1000)})`
  ).join("; ") || "-";
  const pill = (s) => (
    <span className={`pill-badge pill-${(s || "").toLowerCase().replace(/\s+/g, "-")}`}>{s}</span>
  );

  // Helper to fetch Counterpart Allocation info (Book Dev or Cover Dev) based on ISBN
  const getCoverAllocation = (isbn) => {
    const isCoverUser = workflowRole === "cover";
    if (!isbn) return { name: "Unassigned", status: "Allocated", role: isCoverUser ? "Book Developer" : "Cover Developer" };
    const cleanIsbn = String(isbn).trim();

    // The API joins the current opposite-role assignment across allocation batches.
    const liveAssignment = data.find(item => String(item.isbn).trim() === cleanIsbn);
    if (["book", "cover"].includes(workflowRole) && liveAssignment?.counterpartEmployee) return {
      name: liveAssignment.counterpartEmployee,
      status: liveAssignment.counterpartStatus || "Allocated",
      role: liveAssignment.counterpartRole || (isCoverUser ? "Book Developer" : "Cover Developer")
    };

    // 1. Check Master ISBN Workflow Record (Single Source of Truth)
    try {
      const masterList = getMasterIsbnRecords();
      const master = masterList.find(r => r.isbn === cleanIsbn);
      if (master) {
        if (workflowRole === "book" && master.graphicsName) {
          return {
            name: master.graphicsName || "",
            id: master.graphicsCode || master.graphicsId || "",
            status: master.graphicsStatus || "Allocated",
            role: "Cover Developer",
            master
          };
        }
        if (workflowRole === "cover" && master.developerName) {
          return {
            name: master.developerName || "",
            id: master.developerCode || master.developerId || "",
            status: master.developerStatus || "Allocated",
            role: "Book Developer",
            master
          };
        }
        if (workflowRole === "qc") {
          return {
            name: [master.developerName, master.graphicsName].filter(Boolean).join(" & "),
            developer: master.developerName,
            graphics: master.graphicsName,
            status: master.qcStatus || "In Progress",
            role: "Book & Cover Devs",
            master
          };
        }
        if (workflowRole === "qag") {
          return {
            name: master.qcName ? `QC: ${master.qcName}` : "",
            developer: master.developerName,
            graphics: master.graphicsName,
            status: master.qagStatus || "In Progress",
            role: "Quality Control",
            master
          };
        }
      }
    } catch (e) {}

    // 2. Check fileflow_admin_allocations from localStorage (created by Admin in BulkFileAllocation)
    try {
      const adminStoreKey = "fileflow_admin_allocations";
      const adminData = JSON.parse(localStorage.getItem(adminStoreKey) || "[]");

      // Match counterpart by same ISBN where team/dept/stage/role corresponds to the counterpart
      const counterpartMatch = adminData.find((item) => {
        if (String(item.isbn).trim() !== cleanIsbn) return false;
        const itemEmpId = String(item.employeeId || "").toLowerCase().trim();
        const itemRole = String(item.role || "").toLowerCase().trim();
        const itemTeam = String(item.team || "").toLowerCase().trim();
        const itemDept = String(item.department || "").toLowerCase().trim();
        const itemStage = String(item.workflowStage || item.process || "").toLowerCase().trim();

        if (isCoverUser) {
          if (itemRole === "book" || itemStage.includes("book") || itemStage.includes("interior") || itemStage.includes("text")) return true;
          if (itemEmpId !== String(empId).toLowerCase().trim() && (itemDept.includes("dev") || itemTeam.includes("book"))) return true;
        } else {
          if (itemRole === "cover" || itemStage.includes("cover") || itemStage.includes("art")) return true;
          if (itemTeam.includes("graphic") || itemDept.includes("graphic") || itemTeam.includes("cover")) return true;
        }
        return false;
      });

      if (counterpartMatch) {
        return {
          name: counterpartMatch.employee || counterpartMatch.postedTo || "",
          status: counterpartMatch.status || "Allocated",
          role: counterpartMatch.role === "book" ? "Book Developer" : counterpartMatch.role === "cover" ? "Cover Developer" : (isCoverUser ? "Book Developer" : "Cover Developer")
        };
      }

      // Check counterpartEmployee field on current employee's record
      const myMatch = adminData.find((item) =>
        String(item.isbn).trim() === cleanIsbn && isMyAllocationItem(item)
      );
      if (myMatch && myMatch.counterpartEmployee) {
        return {
          name: myMatch.counterpartEmployee,
          status: "Allocated",
          role: isCoverUser ? "Book Developer" : "Cover Developer"
        };
      }

      // Alt match: any other employee assigned to this ISBN
      const altMatch = adminData.find((item) =>
        String(item.isbn).trim() === cleanIsbn && !isMyAllocationItem(item)
      );
      if (altMatch) {
        return {
          name: altMatch.employee || altMatch.postedTo,
          status: altMatch.status || "Allocated",
          role: isCoverUser ? "Book Developer" : "Cover Developer"
        };
      }
    } catch (e) {}

    const assigned = data.find(item => String(item.isbn).trim() === cleanIsbn);
    if (assigned?.counterpartEmployee) return {
      name: assigned.counterpartEmployee,
      status: assigned.counterpartStatus || "Allocated",
      role: assigned.counterpartRole || (isCoverUser ? "Book Developer" : "Cover Developer")
    };
    return { name: "Unassigned", status: "Unassigned", role: "" };
  };

  // Helper to fetch shared specs (Book Trim Size & Page Count) entered by Book Developer or any role for this ISBN
  const getSharedIsbnSpecs = (isbn) => {
    if (!isbn) return { trimSize: "", pageCount: "", enteredBy: "" };
    const cleanIsbn = String(isbn).trim();

    // 1. Check local state data first (if it has specs)
    const currentItem = data.find(x => String(x.isbn).trim() === cleanIsbn && (x.trimSize || (x.pageCount !== undefined && x.pageCount !== "")));
    const localTrim = currentItem?.trimSize || "";
    const localPages = (currentItem?.pageCount !== undefined && currentItem?.pageCount !== "") ? currentItem.pageCount : "";
    const localEnteredBy = currentItem?.specsEnteredBy || "";

    // 2. Check Master ISBN records (Single Source of Truth across all roles)
    let masterTrim = "";
    let masterPages = "";
    let masterEnteredBy = "";
    try {
      const masterSpecs = getMasterIsbnSpecs(cleanIsbn);
      masterTrim = masterSpecs.trimSize || "";
      masterPages = (masterSpecs.pageCount !== undefined && masterSpecs.pageCount !== "") ? masterSpecs.pageCount : "";
      masterEnteredBy = masterSpecs.specsEnteredBy || "";
    } catch (e) {}

    // 3. Check fileflow_admin_allocations in localStorage for ANY employee's allocation of this same ISBN
    let adminTrim = "";
    let adminPages = "";
    let adminEnteredBy = "";
    try {
      const adminStoreKey = "fileflow_admin_allocations";
      const adminData = JSON.parse(localStorage.getItem(adminStoreKey) || "[]");
      const matchingAlloc = adminData.find(item =>
        String(item.isbn).trim() === cleanIsbn && (item.trimSize || (item.pageCount !== undefined && item.pageCount !== ""))
      );
      if (matchingAlloc) {
        adminTrim = matchingAlloc.trimSize || "";
        adminPages = (matchingAlloc.pageCount !== undefined && matchingAlloc.pageCount !== "") ? matchingAlloc.pageCount : "";
        adminEnteredBy = matchingAlloc.specsEnteredBy || matchingAlloc.employee || "Book Developer";
      }
    } catch (e) {}

    const resolvedTrim = localTrim || masterTrim || adminTrim || "";
    const resolvedPages = localPages || masterPages || adminPages || "";
    const resolvedEnteredBy = localEnteredBy || masterEnteredBy || adminEnteredBy || "Book Developer";

    return {
      trimSize: resolvedTrim,
      pageCount: resolvedPages,
      enteredBy: resolvedEnteredBy
    };
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 17) return "Good afternoon";
    if (hours < 21) return "Good evening";
    return "Good night";
  };

  // Two Hours Tracking Logic
  const getTwoHourWindowLabel = (t = Date.now()) => {
    const d = new Date(t);
    const startHour = Math.floor(d.getHours() / 2) * 2;
    const s = new Date(d);
    s.setHours(startHour, 0, 0, 0);
    const e = new Date(s);
    e.setHours(startHour + 2, 0, 0, 0);
    return `${s.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} - ${e.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  };

  const getTwoHourNextDue = () => {
    const d = new Date();
    const nextHour = Math.floor(d.getHours() / 2) * 2 + 2;
    const n = new Date(d);
    n.setHours(nextHour, 0, 0, 0);
    return shortDateTime(n);
  };

  const sendTwoHourReport = (force = false) => {
    const windowLabel = getTwoHourWindowLabel();
    const summary = {
      total: data.length,
      wip: data.filter((x) => x.status === "WIP").length,
      complete: data.filter((x) => x.status === "Complete").length,
      hold: data.filter((x) => x.status === "Hold").length,
      rework: data.filter((x) => x.status === "Rework").length,
      reject: data.filter((x) => x.status === "Reject").length
    };

    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      title: "Two Hours Tracking",
      employeeId: empId,
      employeeName: empName,
      createdAt: Date.now(),
      read: false,
      reportWindow: windowLabel,
      reason: `Two Hours Tracking report for ${windowLabel}. Total: ${summary.total}, WIP: ${summary.wip}, Complete: ${summary.complete}, Hold: ${summary.hold}, Rework: ${summary.rework}, Reject: ${summary.reject}.`,
      reportSummary: summary
    };

    setNotifications((prev) => [newNotif, ...prev]);
    fetch("/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-FileFlow-Token": "fileflow-secret-token-2026" },
      body: JSON.stringify(newNotif)
    }).catch(() => {});
    note?.(`Two Hours Tracking report submitted for ${windowLabel}`);
  };

  // Download Single ISBN (Materialize on-demand to INPUT_ROOT)
  const handleDownloadISBN = async (isbn) => {
    try {
      await fetch("/prepare-temp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-FileFlow-Token": "fileflow-secret-token-2026" },
        body: JSON.stringify({ isbn, ownerId: empId, role: workflowRole })
      });
    } catch (e) {}

    setData((prev) =>
      prev.map((x) => {
        if (x.isbn === isbn) {
          return {
            ...x,
            downloaded: true,
            individualDownloaded: true,
            status: x.status || "Allocated",
            uploadState: "Downloaded",
            downloadSavedPath: `C:\\QC_Testing\\${isbn}`
          };
        }
        return x;
      })
    );
    setNetworkIsbns((prev) => {
      const remaining = prev
        .split(/[\n, ]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((x) => x !== String(isbn).trim());
      return remaining.join("\n");
    });
    setTransferMessage("Files Downloaded & Materialized Successfully");
    note?.(`Files downloaded for ${isbn} into C:\\QC_Testing\\${isbn}`);
  };

  // Download All Files
  const handleDownloadAll = async () => {
    const allocated = data.filter((x) => x.status === "Allocated" || !x.downloaded);
    if (!allocated.length) {
      alert("No pending files available to download.");
      return;
    }
    for (const item of allocated) {
      try {
        await fetch("/prepare-temp", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-FileFlow-Token": "fileflow-secret-token-2026" },
          body: JSON.stringify({ isbn: item.isbn, ownerId: empId, role: workflowRole })
        });
      } catch (e) {}
    }
    setData((prev) =>
      prev.map((x) => {
        if (x.status === "Allocated" || !x.downloaded) {
          return {
            ...x,
            downloaded: true,
            individualDownloaded: true,
            status: x.status || "Allocated",
            uploadState: "Downloaded",
            downloadSavedPath: `C:\\QC_Testing\\${x.isbn}`
          };
        }
        return x;
      })
    );
    // All pending files are now downloaded - clear networkIsbns completely
    setNetworkIsbns("");
    setNetworkFound([]);
    setNetworkMissing([]);
    note?.(`Download All completed. ${allocated.length} ISBN folders downloaded into C:\\QC_Testing. ISBN list cleared.`);
  };

  // Delete All Allocated and Staged Files
  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete all allocated files?")) return;
    try {
      await fetch("/temp-delete-all", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-FileFlow-Token": "fileflow-secret-token-2026" },
        body: JSON.stringify({ ownerId: empId, deletedRows: data })
      });
      await fetch("/api/allocations/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId, employeeName: empName })
      });
      refreshTempStatus();
      refreshTempFiles();
      loadRecentsBatches();
    } catch (e) {}

    // 1. Clear local state
    setData([]);

    // 2. Persist empty list in localStorage
    localStorage.setItem(persistKey, JSON.stringify([]));
    if (user?.id) localStorage.setItem(`fileflow_emp_data_${user.id}`, JSON.stringify([]));
    if (user?.username) localStorage.setItem(`fileflow_emp_data_${user.username}`, JSON.stringify([]));
    if (user?.code) localStorage.setItem(`fileflow_emp_data_${user.code}`, JSON.stringify([]));

    // 3. Remove employee's allocations from fileflow_admin_allocations
    try {
      const adminStoreKey = "fileflow_admin_allocations";
      const currentAdminData = JSON.parse(localStorage.getItem(adminStoreKey) || "[]");
      const myId = String(empId).toLowerCase().trim();
      const myName = String(empName).toLowerCase().trim();
      const remaining = currentAdminData.filter(item => {
        const itemEmpId = String(item.employeeId || "").toLowerCase().trim();
        const itemEmpCode = String(item.employeeCode || "").toLowerCase().trim();
        const itemEmpName = String(item.employee || "").toLowerCase().trim();
        return itemEmpId !== myId && itemEmpCode !== myId && itemEmpName !== myName;
      });
      localStorage.setItem(adminStoreKey, JSON.stringify(remaining));
    } catch (e) {}

    note?.("All allocated files have been deleted.");
  };

  // Upload Single ISBN Deliverable
  const handleUploadISBN = async (isbn, fileList) => {
    const files = [...(fileList || [])];
    if (!files.length) {
      alert("Select the completed deliverable PDF file.");
      return;
    }

    const file = files[0];
    const fn = file.name;
    if (!isDeliverableAllowed(isbn, fn, workflowRole)) {
      alert(`Invalid deliverable filename for ${roleLabel}!\nRequired: ${roleDeliverableDesc}`);
      return;
    }

    try {
      const res = await fetch(`/upload-completed?isbn=${encodeURIComponent(isbn)}&filename=${encodeURIComponent(fn)}`, {
        method: "POST",
        headers: {
          "X-FileFlow-Token": "fileflow-secret-token-2026",
          "X-FileFlow-Role": workflowRole,
          "X-FileFlow-Employee": empId
        },
        body: file
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "Upload failed");

      setData((prev) =>
        prev.map((x) =>
          x.isbn === isbn
            ? {
                ...x,
                uploaded: fn,
                savedPath: d.savedPath,
                status: "Complete",
                ended: Date.now(),
                statusUpdatedAt: Date.now()
              }
            : x
        )
      );
      markIsbnUploaded(isbn);
      fetch("/api/allocations/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isbn, uploaded: fn, savedPath: d.savedPath })
      }).catch(() => {});
      setUploadModalItem(null);
      note?.(`Deliverable ${fn} uploaded successfully for ${isbn}.`);
    } catch (e) {
      alert("Upload error: " + e.message);
    }
  };

  // Upload local deliverables to the server. The ISBN must be present in the filename.
  const handleNetworkFileUpload = async (fileList) => {
    const files = [...(fileList || [])];
    if (!files.length) return;

    setNetworkBusy(true);
    let uploaded = 0;
    let skipped = 0;
    for (const file of files) {
      const isbnMatch = file.name.match(/\b\d{13}\b/);
      if (!isbnMatch) {
        skipped += 1;
        continue;
      }
      const isbn = isbnMatch[0];
      try {
        const response = await fetch(`/upload-completed?isbn=${encodeURIComponent(isbn)}&filename=${encodeURIComponent(file.name)}`, {
          method: "POST",
          headers: {
            "X-FileFlow-Token": "fileflow-secret-token-2026",
            "X-FileFlow-Role": workflowRole,
            "X-FileFlow-Employee": empId
          },
          body: file
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || "Upload failed");
        uploaded += 1;
        markIsbnUploaded(isbn);
        setData(prev => prev.map(item => String(item.isbn).trim() === isbn ? {
          ...item,
          uploaded: file.name,
          savedPath: result.savedPath || item.savedPath,
          statusUpdatedAt: Date.now()
        } : item));
        fetch("/api/allocations/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isbn, uploaded: file.name, savedPath: result.savedPath || "" })
        }).catch(() => {});
      } catch (error) {
        skipped += 1;
      }
    }
    setNetworkBusy(false);
    if (networkUploadInputRef.current) networkUploadInputRef.current.value = "";
    setNetworkMessage(`Uploaded ${uploaded} file(s) to server${skipped ? ` | Skipped ${skipped}` : ""}`);
    note?.(`Uploaded ${uploaded} file(s) to server${skipped ? `. ${skipped} file(s) skipped: filename must contain a 13-digit ISBN.` : "."}`);
  };

  const handlePathUpload = async () => {
    if (!networkSource.trim() || !networkDest.trim()) {
      note?.("Enter both source path and destination path.");
      return;
    }
    setNetworkBusy(true);
    setNetworkMessage("Uploading files from source path to destination...");
    try {
      // Path upload stays in Network Copy; only START ISBN COPY switches to File Allocation.
      setSubPage("network");
      const response = await fetch("/api/network/upload-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: networkSource.trim(),
          destination: networkDest.trim(),
          batch: networkBatch.trim(),
          isbns: networkIsbns.split(/[\n, ]+/).map(value => value.trim()).filter(Boolean)
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Path upload failed");
      (result.uploadedIsbns || []).forEach(markIsbnUploaded);
      setNetworkMessage(`Uploaded ${result.fileCount} file(s) to ${result.destinationPath}`);
      note?.(`Uploaded ${result.fileCount} file(s) to ${result.destinationPath}. ${result.uploadedIsbns?.length || 0} ISBN status(es) updated.`);
    } catch (error) {
      setNetworkMessage(`Upload failed: ${error.message}`);
      note?.(`Upload failed: ${error.message}`);
    } finally {
      setNetworkBusy(false);
    }
  };

  // Status Change Handler with Synced Multi-Role Status
  const handleStatusChange = (isbn, newStatus) => {
    if (newStatus === "Rework" || newStatus === "Reject") {
      const item = data.find((x) => x.isbn === isbn);
      setStatusModal({ isbn, status: newStatus, item });
      return;
    }

    setData((prev) =>
      prev.map((item) => {
        if (item.isbn === isbn) {
          let updatedSessions = [...item.sessions];
          let started = item.started;
          let ended = item.ended;

          if (newStatus === "Complete" || newStatus === "Hold") {
            updatedSessions = updatedSessions.map((s) => (s.end ? s : { ...s, end: Date.now() }));
            if (newStatus === "Complete") ended = Date.now();
          } else if (newStatus === "WIP") {
            const isRunning = updatedSessions.some((s) => !s.end);
            if (!isRunning) updatedSessions.push({ start: Date.now(), end: null });
            if (!started) started = Date.now();
            ended = null;
          }

          let holdSessions = [...(item.holdSessions || [])];
          if (newStatus === "Hold" && !holdSessions.some(session => !session.end)) holdSessions.push({ start: Date.now(), end: null, type: "Break time" });
          if (newStatus === "WIP") holdSessions = holdSessions.map(session => session.end ? session : { ...session, end: Date.now() });
          return {
            ...item,
            status: newStatus,
            started,
            ended,
            sessions: updatedSessions,
            holdSessions,
            statusAction: newStatus,
            statusUpdatedAt: Date.now()
          };
        }
        return item;
      })
    );

    // Sync status change to fileflow_admin_allocations
    try {
      const adminStoreKey = "fileflow_admin_allocations";
      const adminData = JSON.parse(localStorage.getItem(adminStoreKey) || "[]");
      const updated = adminData.map(item => {
        if (String(item.isbn).trim() === String(isbn).trim() && isMyAllocationItem(item)) {
          return { ...item, status: newStatus, statusUpdatedAt: Date.now() };
        }
        return item;
      });
      localStorage.setItem(adminStoreKey, JSON.stringify(updated));
    } catch (e) {}

    note?.(`Status for ${isbn} updated to ${newStatus}`);
  };

  // Save Rework / Reject Modal
  const handleSaveStatusModal = (formData) => {
    if (!formData.projectId || !formData.projectName || !formData.reason) {
      alert("Project ID, Project Name, and Reason are required.");
      return;
    }

    setData((prev) =>
      prev.map((item) => {
        if (item.isbn === statusModal.isbn) {
          let updatedSessions = [...item.sessions];
          let ended = item.ended;

          if (statusModal.status === "Reject") {
            updatedSessions = updatedSessions.map((s) => (s.end ? s : { ...s, end: Date.now() }));
            ended = Date.now();
          } else if (statusModal.status === "Rework") {
            const isRunning = updatedSessions.some((s) => !s.end);
            if (!isRunning) updatedSessions.push({ start: Date.now(), end: null });
            ended = null;
          }

          return {
            ...item,
            status: statusModal.status,
            projectId: formData.projectId,
            projectName: formData.projectName,
            priority: formData.priority,
            dueDate: formData.dueDate,
            statusReason: formData.reason,
            reworkReason: statusModal.status === "Rework" ? formData.reason : item.reworkReason,
            statusAction: statusModal.status,
            statusUpdatedAt: Date.now(),
            ended,
            sessions: updatedSessions
          };
        }
        return item;
      })
    );

    // Add Notification
    const notifTitle = statusModal.status === "Reject" ? "File Rejected" : statusModal.status === "Rework" ? "Rework Request" : `File ${statusModal.status}`;
    const newNotifItem = {
      id: `NOTIF-${Date.now()}`,
      title: notifTitle,
      section: "Notifications",
      employeeId: empId,
      employeeName: empName,
      isbn: statusModal.isbn,
      status: statusModal.status,
      projectId: formData.projectId || "PRJ-PETERLANG",
      projectName: formData.projectName || `Peter Lang Title (${statusModal.isbn})`,
      createdAt: Date.now(),
      read: false,
      reason: `${statusModal.status} marked for ${statusModal.isbn} (${formData.projectName || statusModal.isbn}). Reason: ${formData.reason}`,
      remarks: formData.reason,
      reportSummary: {
        isbn: statusModal.isbn,
        status: statusModal.status,
        remarks: formData.reason,
        reason: formData.reason,
        projectName: formData.projectName,
        projectId: formData.projectId
      }
    };
    setNotifications((prev) => [newNotifItem, ...prev]);
    try {
      const savedNotifs = JSON.parse(localStorage.getItem("fileflow_notifications") || "[]");
      localStorage.setItem("fileflow_notifications", JSON.stringify([newNotifItem, ...savedNotifs]));
      window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
      fetch("/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-FileFlow-Token": "fileflow-secret-token-2026" },
        body: JSON.stringify(newNotifItem)
      }).catch(() => {});
    } catch {}

    note?.(`${statusModal.status} saved for ${statusModal.isbn}`);
    setStatusModal(null);
  };

  const pauseWork = (isbn) => setData(prev => prev.map(item => item.isbn !== isbn ? item : {
    ...item,
    status: "Hold",
    sessions: item.sessions.map(session => session.end ? session : { ...session, end: Date.now() }),
    holdSessions: [...(item.holdSessions || []), { start: Date.now(), end: null, type: "Break time" }],
    statusReason: "Break time",
    statusUpdatedAt: Date.now()
  }));

  const resumeWork = (isbn) => setData(prev => prev.map(item => item.isbn !== isbn ? item : {
    ...item,
    status: "WIP",
    sessions: [...item.sessions, { start: Date.now(), end: null }],
    holdSessions: (item.holdSessions || []).map(session => session.end ? session : { ...session, end: Date.now() }),
    statusReason: "",
    statusUpdatedAt: Date.now()
  }));

  const stopWork = (isbn) => setData(prev => prev.map(item => item.isbn !== isbn ? item : {
    ...item,
    status: "Hold",
    sessions: item.sessions.map(session => session.end ? session : { ...session, end: Date.now() }),
    holdSessions: [...(item.holdSessions || []).map(session => session.end ? session : { ...session, end: Date.now() }), { start: Date.now(), end: null, type: "Work stopped" }],
    statusReason: "Work stopped from dashboard",
    statusUpdatedAt: Date.now()
  }));

  // Daily Work Timer Handlers (Check In, Break toggle, Check Out)
  const handleCheckIn = () => {
    if (workTimerState.status === "working") {
      note?.("Already checked in! Production work timer is active.");
      return;
    }

    const nowTs = Date.now();
    setWorkTimerState((prev) => {
      let updatedBreaks = [...(prev.breakSessions || [])];
      if (prev.status === "break" && prev.activeBreakStart) {
        updatedBreaks.push({
          type: prev.activeBreakType || "Break",
          start: prev.activeBreakStart,
          end: nowTs
        });
      }

      return {
        ...prev,
        status: "working",
        checkInTime: prev.checkInTime || nowTs,
        checkOutTime: null,
        activeBreakType: null,
        activeBreakStart: null,
        breakSessions: updatedBreaks,
        workSessions: [...(prev.workSessions || []), { start: nowTs, end: null }]
      };
    });

    setShowBreakOptions(false);
    if (focusItem && focusItem.status === "Hold") {
      resumeWork(focusItem.isbn);
    }
    note?.("Checked In! Production work timer running.");
  };

  const handleToggleBreak = (breakType = "Break") => {
    const nowTs = Date.now();
    if (workTimerState.status === "break") {
      // Currently in break -> Stop break and resume work
      setWorkTimerState((prev) => {
        const updatedBreaks = [...(prev.breakSessions || [])];
        if (prev.activeBreakStart) {
          updatedBreaks.push({
            type: prev.activeBreakType || "Break",
            start: prev.activeBreakStart,
            end: nowTs
          });
        }
        return {
          ...prev,
          status: "working",
          activeBreakType: null,
          activeBreakStart: null,
          breakSessions: updatedBreaks,
          workSessions: [...(prev.workSessions || []), { start: nowTs, end: null }]
        };
      });
      setShowBreakOptions(false);
      if (focusItem && focusItem.status === "Hold") {
        resumeWork(focusItem.isbn);
      }
      note?.("Break stopped! Production timer resumed.");
    } else {
      // Start break -> button becomes "In Break", overall break time starts running!
      setWorkTimerState((prev) => {
        const updatedWorkSessions = (prev.workSessions || []).map((s) =>
          s.end ? s : { ...s, end: nowTs }
        );
        return {
          ...prev,
          status: "break",
          activeBreakType: typeof breakType === "string" ? breakType : "Break",
          activeBreakStart: nowTs,
          workSessions: updatedWorkSessions
        };
      });
      setShowBreakOptions(false);
      if (focusItem && focusItem.status === "WIP") {
        pauseWork(focusItem.isbn);
      }
      note?.("In Break: Overall break timer running.");
    }
  };

  const handleCheckOut = () => {
    const nowTs = Date.now();
    // Compute total production time worked today
    const completedWork = (workTimerState.workSessions || []).reduce((acc, s) => {
      if (s.start && s.end) return acc + (s.end - s.start) / 1000;
      return acc;
    }, 0);
    const activeSession = (workTimerState.workSessions || []).find((s) => !s.end);
    const activeWork = (workTimerState.status === "working" && activeSession)
      ? Math.max(0, (nowTs - activeSession.start) / 1000)
      : 0;
    const dailySecs = completedWork + activeWork;
    const fileSecs = (data || []).reduce((tot, x) => tot + secs(x), 0);
    const finalProductionSecs = Math.max(Math.floor(dailySecs), Math.floor(fileSecs));

    setWorkTimerState((prev) => {
      const updatedWork = (prev.workSessions || []).map((s) =>
        s.end ? s : { ...s, end: nowTs }
      );
      const updatedBreaks = [...(prev.breakSessions || [])];
      if (prev.status === "break" && prev.activeBreakStart) {
        updatedBreaks.push({
          type: prev.activeBreakType || "Break",
          start: prev.activeBreakStart,
          end: nowTs
        });
      }

      return {
        ...prev,
        status: "checked_out",
        checkOutTime: nowTs,
        activeBreakType: null,
        activeBreakStart: null,
        workSessions: updatedWork,
        breakSessions: updatedBreaks,
        finalProductionSecs
      };
    });

    setShowBreakOptions(false);
    if (focusItem && focusItem.status === "WIP") {
      stopWork(focusItem.isbn);
    }
    note?.("Checked Out! Main timer reset to 00:00:00 and Total Production Time recorded.");
  };

  // Detail Modal Handlers & Live Item
  const liveDetailItem = useMemo(() => {
    if (!detailItem) return null;
    return data.find((x) => x.isbn === detailItem.isbn) || detailItem;
  }, [detailItem, data]);

  const isModalTimerRunning = Boolean(
    liveDetailItem?.sessions && liveDetailItem.sessions.some((s) => !s.end)
  );

  const handleOpenDetailModal = (item) => {
    setDetailItem(item);
    setModalComment(item.statusReason || "");
    setCommentError("");
  };

  const openNotificationWork = (notification) => {
    const isbn = String(notification.isbn || notification.reportSummary?.isbn || "").trim();
    if (!isbn) {
      note?.("This notification has no ISBN linked to production work.");
      return;
    }
    const item = data.find(row => String(row.isbn || "").trim() === isbn);
    setSubPage("alloc");
    if (item) {
      handleOpenDetailModal(item);
    } else {
      note?.(`${isbn} is not currently allocated to your workspace.`);
    }
  };

  const handleUpdateSpec = (field, value) => {
    if (!liveDetailItem) return;
    const currentIsbn = String(liveDetailItem.isbn).trim();
    const enteredByTitle = workflowRole === "book" ? "Book Developer" : roleLabel;

    // 1. Update current local data state
    setData((prev) =>
      prev.map((item) =>
        String(item.isbn).trim() === currentIsbn ? { ...item, [field]: value, specsEnteredBy: enteredByTitle } : item
      )
    );

    // Also update detailItem immediately
    setDetailItem((prev) =>
      prev && String(prev.isbn).trim() === currentIsbn ? { ...prev, [field]: value, specsEnteredBy: enteredByTitle } : prev
    );

    // 2. Centralized Master ISBN store update (shared single source of truth across Book, Cover, QC, QAG)
    try {
      updateMasterIsbnSpecs(currentIsbn, { [field]: value, specsEnteredBy: enteredByTitle });
    } catch (e) {}

    // 3. Sync to ALL allocations in fileflow_admin_allocations with this ISBN (Book, Cover, QC, QAG)
    try {
      const adminStoreKey = "fileflow_admin_allocations";
      const adminData = JSON.parse(localStorage.getItem(adminStoreKey) || "[]");
      const updated = adminData.map((it) =>
        String(it.isbn).trim() === currentIsbn
          ? { ...it, [field]: value, specsEnteredBy: enteredByTitle }
          : it
      );
      localStorage.setItem(adminStoreKey, JSON.stringify(updated));
    } catch (e) {}

    // 4. Sync across all other employee stores in localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("fileflow_emp_data_")) {
          const empList = JSON.parse(localStorage.getItem(k) || "[]");
          let changed = false;
          const nextList = empList.map((item) => {
            if (String(item.isbn).trim() === currentIsbn) {
              changed = true;
              return { ...item, [field]: value, specsEnteredBy: enteredByTitle };
            }
            return item;
          });
          if (changed) {
            localStorage.setItem(k, JSON.stringify(nextList));
          }
        }
      }
    } catch (e) {}

    // 5. Sync to backend /api/allocations/status
    fetch("/api/allocations/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isbn: currentIsbn,
        id: liveDetailItem.allocationId || liveDetailItem.id,
        [field]: value,
        specsEnteredBy: enteredByTitle
      })
    }).catch(() => {});

    // 6. Broadcast storage and master update events so all components and windows update immediately
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("masterIsbnStoreUpdated"));
  };

  const handleStartTimerModal = () => {
    if (!liveDetailItem) return;
    const currentIsbn = liveDetailItem.isbn;
    const nowTs = Date.now();
    setData((prev) =>
      prev.map((item) => {
        if (item.isbn === currentIsbn) {
          const sessions = item.sessions || [];
          const isRunning = sessions.some((s) => !s.end);
          const updatedSessions = isRunning ? sessions : [...sessions, { start: nowTs, end: null }];
          const holdSessions = (item.holdSessions || []).map(hs => hs.end ? hs : { ...hs, end: nowTs });
          return {
            ...item,
            status: "WIP",
            started: item.started || nowTs,
            ended: null,
            downloaded: true,
            individualDownloaded: true,
            sessions: updatedSessions,
            holdSessions,
            statusAction: "WIP",
            statusUpdatedAt: nowTs
          };
        }
        return item;
      })
    );

    // Sync to fileflow_admin_allocations
    try {
      const adminStoreKey = "fileflow_admin_allocations";
      const adminData = JSON.parse(localStorage.getItem(adminStoreKey) || "[]");
      const updated = adminData.map((it) =>
        String(it.isbn).trim() === String(currentIsbn).trim() && isMyAllocationItem(it)
          ? { ...it, status: "WIP", started: it.started || nowTs, statusUpdatedAt: nowTs }
          : it
      );
      localStorage.setItem(adminStoreKey, JSON.stringify(updated));
    } catch (e) {}

    fetch("/api/allocations/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isbn: currentIsbn,
        status: "WIP",
        started: nowTs
      })
    }).catch(() => {});

    note?.(`Timer started for ${currentIsbn} (Status: WIP)`);
  };

  const handleEndTimerModal = () => {
    if (!liveDetailItem) return;
    const currentIsbn = liveDetailItem.isbn;
    const nowTs = Date.now();
    setData((prev) =>
      prev.map((item) => {
        if (item.isbn === currentIsbn) {
          const sessions = item.sessions || [];
          const updatedSessions = sessions.map((s) => (s.end ? s : { ...s, end: nowTs }));
          return {
            ...item,
            ended: nowTs,
            downloaded: true,
            individualDownloaded: true,
            sessions: updatedSessions,
            statusUpdatedAt: nowTs
          };
        }
        return item;
      })
    );

    // Sync to fileflow_admin_allocations
    try {
      const adminStoreKey = "fileflow_admin_allocations";
      const adminData = JSON.parse(localStorage.getItem(adminStoreKey) || "[]");
      const updated = adminData.map((it) =>
        String(it.isbn).trim() === String(currentIsbn).trim() && isMyAllocationItem(it)
          ? {
              ...it,
              ended: nowTs,
              statusUpdatedAt: nowTs
            }
          : it
      );
      localStorage.setItem(adminStoreKey, JSON.stringify(updated));
    } catch (e) {}

    fetch("/api/allocations/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isbn: currentIsbn,
        ended: nowTs
      })
    }).catch(() => {});

    note?.(`Timer stopped for ${currentIsbn}. Elapsed duration calculated.`);
  };

  const handleModalSelectStatus = (newStatus) => {
    if (!liveDetailItem) return;
    const currentIsbn = liveDetailItem.isbn;
    const nowTs = Date.now();
    const currentReason = modalComment || liveDetailItem.statusReason || liveDetailItem.rejectReason || liveDetailItem.reworkReason || "";

    setData((prev) =>
      prev.map((item) => {
        if (item.isbn === currentIsbn) {
          let updatedSessions = [...(item.sessions || [])];
          let started = item.started;
          let ended = item.ended;

          if (newStatus === "Complete" || newStatus === "Reject" || newStatus === "Hold") {
            updatedSessions = updatedSessions.map((s) => (s.end ? s : { ...s, end: nowTs }));
            if (newStatus === "Complete" || newStatus === "Reject") ended = nowTs;
          } else if (newStatus === "WIP") {
            const isRunning = updatedSessions.some((s) => !s.end);
            if (!isRunning) updatedSessions.push({ start: nowTs, end: null });
            if (!started) started = nowTs;
            ended = null;
          }

          let holdSessions = [...(item.holdSessions || [])];
          if (newStatus === "Hold" && !holdSessions.some(session => !session.end)) {
            holdSessions.push({ start: nowTs, end: null, type: currentReason || "Hold" });
          } else if (newStatus === "WIP") {
            holdSessions = holdSessions.map(session => session.end ? session : { ...session, end: nowTs });
          }

          return {
            ...item,
            status: newStatus,
            started,
            ended,
            sessions: updatedSessions,
            holdSessions,
            downloaded: true,
            individualDownloaded: true,
            statusAction: newStatus,
            statusUpdatedAt: nowTs,
            statusReason: currentReason,
            rejectReason: newStatus === "Reject" ? currentReason : item.rejectReason,
            reworkReason: newStatus === "Rework" ? currentReason : item.reworkReason,
            reason: currentReason
          };
        }
        return item;
      })
    );

    // Sync to fileflow_admin_allocations
    try {
      const adminStoreKey = "fileflow_admin_allocations";
      const adminData = JSON.parse(localStorage.getItem(adminStoreKey) || "[]");
      const updated = adminData.map((it) =>
        String(it.isbn).trim() === String(currentIsbn).trim() && isMyAllocationItem(it)
          ? {
              ...it,
              status: newStatus,
              statusUpdatedAt: nowTs,
              statusReason: currentReason,
              rejectReason: newStatus === "Reject" ? currentReason : it.rejectReason,
              reworkReason: newStatus === "Rework" ? currentReason : it.reworkReason,
              reason: currentReason
            }
          : it
      );
      localStorage.setItem(adminStoreKey, JSON.stringify(updated));
    } catch (e) {}

    fetch("/api/allocations/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isbn: currentIsbn,
        status: newStatus,
        statusReason: currentReason
      })
    }).catch(() => {});

    // Sync to Master ISBN workflow store
    if (newStatus === "Complete") {
      if (workflowRole === "book") {
        updateDeveloperCompletion(currentIsbn, empId);
      } else if (workflowRole === "cover") {
        updateGraphicsCompletion(currentIsbn, empId);
      } else if (workflowRole === "qc") {
        completeQc(currentIsbn, user);
      }
    }

    note?.(`Status for ${currentIsbn} updated to ${newStatus}`);
  };

  const handleModalActionSubmit = (actionType) => {
    if (!liveDetailItem) return;
    if (!modalComment || !modalComment.trim()) {
      const fieldName = actionType === "reject" ? "Reject reason" : actionType === "rework" ? "Rework reason" : actionType === "hold" ? "Hold reason" : "Comments";
      setCommentError(`${fieldName} is mandatory. Please enter the reason before proceeding.`);
      return;
    }
    setCommentError("");
    const currentIsbn = liveDetailItem.isbn;
    const comments = modalComment.trim();
    const nowTs = Date.now();

    let targetStatus = "Complete";
    let notifTitle = "File Submitted";
    let notifMsg = `File ${currentIsbn} submitted. Remarks: ${comments}`;

    if (actionType === "qc") {
      targetStatus = "Complete";
      notifTitle = "File Submitted";
      notifMsg = `File ${currentIsbn} submitted. Remarks: ${comments}`;
    } else if (actionType === "hold") {
      targetStatus = "Hold";
      notifTitle = "File Put On Hold";
      notifMsg = `File ${currentIsbn} placed on hold. Reason: ${comments}`;
    } else if (actionType === "rework") {
      targetStatus = "Rework";
      notifTitle = "Rework Request";
      notifMsg = `Rework requested for ${currentIsbn}. Reason: ${comments}`;
    } else if (actionType === "reject") {
      targetStatus = "Reject";
      notifTitle = "File Rejected";
      notifMsg = `File ${currentIsbn} rejected. Reason: ${comments}`;
    }

    setNetworkIsbns((prev) => {
      const remaining = prev
        .split(/[\n, ]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((x) => x !== String(currentIsbn).trim());
      return remaining.join("\n");
    });

    setData((prev) =>
      prev.map((item) => {
        if (item.isbn === currentIsbn) {
          const sessions = item.sessions || [];
          const updatedSessions = sessions.map((s) => (s.end ? s : { ...s, end: nowTs }));
          let holdSessions = [...(item.holdSessions || [])];
          if (targetStatus === "Hold" && !holdSessions.some(session => !session.end)) {
            holdSessions.push({ start: nowTs, end: null, type: comments || "On Hold" });
          } else if (targetStatus !== "Hold") {
            holdSessions = holdSessions.map(session => session.end ? session : { ...session, end: nowTs });
          }
          return {
            ...item,
            status: targetStatus,
            statusReason: comments,
            holdReason: actionType === "hold" ? comments : item.holdReason,
            rejectReason: actionType === "reject" ? comments : item.rejectReason,
            reworkReason: actionType === "rework" ? comments : item.reworkReason,
            reason: comments,
            qcRemarks: actionType === "qc" ? comments : item.qcRemarks,
            ended: targetStatus === "Hold" ? item.ended : (item.ended || nowTs),
            sessions: updatedSessions,
            holdSessions,
            downloaded: true,
            individualDownloaded: true,
            statusAction: targetStatus,
            statusUpdatedAt: nowTs
          };
        }
        return item;
      })
    );

    const matchingRow = data.find((r) => String(r.isbn).trim() === String(currentIsbn).trim());
    const prjId = matchingRow?.projectId || "PRJ-PETERLANG";
    const prjName = matchingRow?.projectName || `Peter Lang Title (${currentIsbn})`;

    // Add Notification
    const newNotif = {
      id: `NOTIF-${nowTs}`,
      title: notifTitle,
      section: "Notifications",
      employeeId: empId,
      employeeName: empName,
      isbn: currentIsbn,
      status: targetStatus,
      projectId: prjId,
      projectName: prjName,
      remarks: comments,
      targetRoles: targetStatus === "Rework" ? ["book", "cover"] : [workflowRole],
      createdAt: nowTs,
      read: false,
      reason: notifMsg,
      reportSummary: { isbn: currentIsbn, status: targetStatus, remarks: comments, reason: comments, projectId: prjId, projectName: prjName }
    };
    setNotifications((prev) => [newNotif, ...prev]);

    try {
      const savedNotifs = JSON.parse(localStorage.getItem("fileflow_notifications") || "[]");
      localStorage.setItem("fileflow_notifications", JSON.stringify([newNotif, ...savedNotifs]));
      window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
      fetch("/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-FileFlow-Token": "fileflow-secret-token-2026" },
        body: JSON.stringify(newNotif)
      }).catch(() => {});
    } catch {}

    // Sync to fileflow_admin_allocations
    try {
      const adminStoreKey = "fileflow_admin_allocations";
      const adminData = JSON.parse(localStorage.getItem(adminStoreKey) || "[]");
      const updated = adminData.map((it) =>
        String(it.isbn).trim() === String(currentIsbn).trim() && isMyAllocationItem(it)
          ? {
              ...it,
              status: targetStatus,
              statusReason: comments,
              holdReason: actionType === "hold" ? comments : it.holdReason,
              rejectReason: actionType === "reject" ? comments : it.rejectReason,
              reworkReason: actionType === "rework" ? comments : it.reworkReason,
              reason: comments,
              qcRemarks: actionType === "qc" ? comments : it.qcRemarks,
              ended: targetStatus === "Hold" ? it.ended : (it.ended || nowTs),
              statusUpdatedAt: nowTs
            }
          : it
      );
      localStorage.setItem(adminStoreKey, JSON.stringify(updated));
    } catch (e) {}

    fetch("/api/allocations/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isbn: currentIsbn,
        status: targetStatus,
        statusReason: comments,
        ended: targetStatus === "Hold" ? null : nowTs
      })
    }).catch(() => {});

    // Sync to Master ISBN workflow store
    if (actionType === "qc" || targetStatus === "Complete") {
      if (workflowRole === "book") {
        updateDeveloperCompletion(currentIsbn, empId);
      } else if (workflowRole === "cover") {
        updateGraphicsCompletion(currentIsbn, empId);
      } else if (workflowRole === "qc") {
        completeQc(currentIsbn, user);
      }
    }

    // Sync to fileflow task store
    try {
      const ffData = JSON.parse(localStorage.getItem("fileflow") || "{}");
      if (ffData.tasks) {
        ffData.tasks = ffData.tasks.map((t) =>
          String(t.isbn || t.project || "").includes(currentIsbn)
            ? { ...t, status: targetStatus, remarks: comments, reason: comments, statusUpdatedAt: nowTs }
            : t
        );
        localStorage.setItem("fileflow", JSON.stringify(ffData));
      }
    } catch (e) {}

    note?.(`File ${currentIsbn} updated to ${targetStatus}`);
    setDetailItem(null);
  };

  // Filtered Rows for File Allocation
  const filteredAllocRows = useMemo(() => {
    let rows = data;
    const term = q.trim().toLowerCase();
    if (term) {
      rows = rows.filter((x) =>
        (x.isbn + " " + x.status + " " + (x.projectId || "") + " " + (x.projectName || "")).toLowerCase().includes(term)
      );
    }
    if (allocStatusFilter !== "All") {
      rows = rows.filter((x) => x.status === allocStatusFilter);
    }
    return [...rows].sort((a, b) => {
      if (allocSort === "allocatedAsc") return a.allocated - b.allocated;
      if (allocSort === "isbnAsc") return String(a.isbn).localeCompare(String(b.isbn));
      if (allocSort === "statusAsc") return String(a.status).localeCompare(String(b.status));
      return b.allocated - a.allocated;
    });
  }, [data, q, allocStatusFilter, allocSort]);

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(filteredAllocRows.length / pageSize));
  const currentPageRows = filteredAllocRows.slice((allocPage - 1) * pageSize, allocPage * pageSize);
  // Tracked Rows (Downloaded, timed, or worked items)
  const trackedRows = useMemo(
    () =>
      data.filter(
        (x) =>
          x.individualDownloaded ||
          x.downloaded ||
          x.started ||
          (x.sessions && x.sessions.length > 0) ||
          ["WIP", "Complete", "Rework", "Reject"].includes(x.status)
      ),
    [data]
  );

  const [trackerPage, setTrackerPage] = useState(1);
  const [trackerPageSize, setTrackerPageSize] = useState(10);
  const paginatedTrackedRows = useMemo(() => trackedRows.slice((trackerPage - 1) * trackerPageSize, trackerPage * trackerPageSize), [trackedRows, trackerPage, trackerPageSize]);

  const [reportPage, setReportPage] = useState(1);
  const [reportPageSize, setReportPageSize] = useState(10);
  const paginatedReportRows = useMemo(() => trackedRows.slice((reportPage - 1) * reportPageSize, reportPage * reportPageSize), [trackedRows, reportPage, reportPageSize]);
  const dashboardRows = data.filter(item => item.downloaded || item.individualDownloaded).length ? data.filter(item => item.downloaded || item.individualDownloaded) : data;
  const focusItem = dashboardRows.find(item => item.status === "WIP") || dashboardRows.find(item => item.status === "Hold") || dashboardRows[0];
  const overallBreak = dashboardRows.reduce((total, item) => total + breakSecs(item), 0);

  // Daily Production & Break Timer calculations
  const totalProductionSecs = useMemo(() => {
    if (workTimerState.status === "checked_out") {
      return workTimerState.finalProductionSecs || 0;
    }
    if (workTimerState.status === "idle") {
      return 0;
    }
    const completedWork = (workTimerState.workSessions || []).reduce((acc, s) => {
      if (s.start && s.end) return acc + (s.end - s.start) / 1000;
      return acc;
    }, 0);
    const activeSession = (workTimerState.workSessions || []).find((s) => !s.end);
    const activeWork = (workTimerState.status === "working" && activeSession)
      ? Math.max(0, (now - activeSession.start) / 1000)
      : 0;
    const dailySecs = completedWork + activeWork;
    const fileSecs = (data || []).reduce((tot, x) => tot + secs(x), 0);
    return Math.max(Math.floor(dailySecs), Math.floor(fileSecs));
  }, [workTimerState, now, data]);

  // Active file on hold detection
  const activeHoldItem = useMemo(() => {
    return (data || []).find(item => item.status === "Hold" && (item.holdSessions || []).some(s => !s.end));
  }, [data]);

  const activeHoldSession = useMemo(() => {
    if (!activeHoldItem) return null;
    return (activeHoldItem.holdSessions || []).find(s => !s.end);
  }, [activeHoldItem]);

  // File break time starts fresh from 00:00:00 when file is on hold!
  const fileBreakSecs = useMemo(() => {
    if (!activeHoldSession) return 0;
    return Math.max(0, Math.floor((now - activeHoldSession.start) / 1000));
  }, [activeHoldSession, now]);

  // Overall break time continues from where it was paused!
  const overallBreakSecs = useMemo(() => {
    // 1. Completed manual breaks
    const completedManualBreaks = (workTimerState.breakSessions || []).reduce((acc, s) => {
      if (s.start && s.end) return acc + (s.end - s.start) / 1000;
      return acc;
    }, 0);

    // 2. Active manual break session (when "In Break" is active)
    const activeManualBreak = (workTimerState.status === "break" && workTimerState.activeBreakStart)
      ? Math.max(0, (now - workTimerState.activeBreakStart) / 1000)
      : 0;

    // 3. Completed file holds across all files
    const completedFileHolds = (data || []).reduce((acc, item) => {
      const holdTot = (item.holdSessions || []).filter(s => s.end).reduce((sum, s) => sum + (s.end - s.start) / 1000, 0);
      return acc + holdTot;
    }, 0);

    // 4. Active file hold
    const activeFileHold = activeHoldSession
      ? Math.max(0, (now - activeHoldSession.start) / 1000)
      : 0;

    return Math.floor(completedManualBreaks + activeManualBreak + completedFileHolds + activeFileHold);
  }, [workTimerState, activeHoldSession, now, data]);

  const liveActiveBreakSecs = useMemo(() => {
    if (workTimerState.status !== "break" || !workTimerState.activeBreakStart) return 0;
    return Math.max(0, Math.floor((now - workTimerState.activeBreakStart) / 1000));
  }, [workTimerState, now]);

  const statusBreakdown = ["Allocated", "WIP", "Complete", "Hold", "Rework", "Reject"].map(status => ({ status, count: dashboardRows.filter(item => item.status === status).length }));
  const recentActivity = [...dashboardRows].sort((a, b) => (b.statusUpdatedAt || b.allocated || 0) - (a.statusUpdatedAt || a.allocated || 0)).slice(0, 5);

  const [matchPage, setMatchPage] = useState(1);
  const [matchPageSize, setMatchPageSize] = useState(10);
  const allNetworkMatches = useMemo(() => [
    ...networkFound.map(x => ({ ...x, isFound: true })),
    ...networkMissing.map(isbn => ({ isbn, isFound: false }))
  ], [networkFound, networkMissing]);
  const paginatedNetworkMatches = useMemo(() => {
    const start = (matchPage - 1) * matchPageSize;
    return allNetworkMatches.slice(start, start + matchPageSize);
  }, [allNetworkMatches, matchPage, matchPageSize]);

  // Export Full 19-Column Production Report (.xlsx with CSV fallback)
  const exportFullExcel = async () => {
    try {
      const rowsForExcel = (trackedRows.length ? trackedRows : data).map((x, i) => {
        const workSec = secs(x);
        const brkSec = breakSecs(x);
        const totalSec = workSec + brkSec;
        return {
          slNo: i + 1,
          date: new Date(x.allocated || Date.now()).toLocaleDateString(),
          employeeId: x.eid || empId,
          employeeName: x.ename || empName,
          isbn: x.isbn,
          role: x.workType || roleLabel,
          status: x.status,
          reason: x.statusReason || x.rejectReason || x.reworkReason || x.reason || "-",
          startTime: x.started ? shortDateTime(x.started) : "-",
          endTime: x.ended ? shortDateTime(x.ended) : "-",
          totalTime: dur(totalSec),
          breakDuration: dur(brkSec),
          netWorkTime: dur(workSec),
          deliverablesStatus: isIsbnUploaded(x.isbn, x) ? "Uploaded" : "Not Uploaded",
          uploadedFiles: x.uploaded || "-",
          statusReason: x.statusReason || "-",
          qcRemarks: x.qcRemarks || "-",
          qagRemarks: x.qagRemarks || "-",
          savedPath: x.savedPath || x.downloadSavedPath || `C:\\QC_Testing\\${x.isbn}`,
          completionDate: x.ended ? new Date(x.ended).toLocaleDateString() : "-"
        };
      });

      const response = await fetch("/export-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-FileFlow-Token": "fileflow-secret-token-2026" },
        body: JSON.stringify({ employeeId: empId, rows: rowsForExcel })
      });

      if (!response.ok) throw new Error("Export endpoint failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${empId}_Production_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      note?.("Production Report (.xlsx) downloaded successfully");
    } catch (err) {
      // Graceful fallback to 20-column CSV
      const headers = [
        "Sl.No", "Date", "Employee ID", "Employee Name", "ISBN", "Role", "Status", "Reason",
        "Start Time", "End Time", "Total Time", "Break Duration", "Net Work Time",
        "Deliverables Status", "Uploaded Files", "Status Reason", "QC Remarks", "QAG Remarks", "Saved Path", "Completion Date"
      ];
      const rows = (trackedRows.length ? trackedRows : data).map((x, i) => [
        i + 1,
        new Date(x.allocated || Date.now()).toLocaleDateString(),
        x.eid || empId,
        x.ename || empName,
        x.isbn,
        x.workType || roleLabel,
        x.status,
        x.statusReason || x.rejectReason || x.reworkReason || x.reason || "-",
        shortDateTime(x.started),
        shortDateTime(x.ended),
        dur(secs(x) + breakSecs(x)),
        dur(breakSecs(x)),
        dur(secs(x)),
        isIsbnUploaded(x.isbn, x) ? "Uploaded" : "Not Uploaded",
        x.uploaded || "-",
        x.statusReason || "-",
        x.qcRemarks || "-",
        x.qagRemarks || "-",
        x.savedPath || `C:\\QC_Testing\\${x.isbn}`,
        x.ended ? new Date(x.ended).toLocaleDateString() : "-"
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${empId}_Production_Report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      note?.("Production Report (.csv) downloaded successfully");
    }
  };


  // Export Single File Excel / Text
  const exportSingleFileExcel = (x) => {
    const fields = [
      ["Field", "Value"],
      ["ISBN", x.isbn],
      ["Employee ID", x.eid],
      ["Employee Name", x.ename],
      ["Project ID", x.projectId || "Ptlng0007"],
      ["Project Name", x.projectName || "Peterlang"],
      ["Priority", x.priority || "Normal"],
      ["Due Date", x.dueDate || "-"],
      ["Allocated At", fmt(x.allocated)],
      ["Started At", fmt(x.started)],
      ["Ended At", fmt(x.ended)],
      ["Working Time", dur(secs(x))],
      ["Status", x.status],
      ["Status Detail Type", x.statusAction || "-"],
      ["Reason / Remarks", x.statusReason || "-"],
      ["Uploaded Files", x.uploaded || "-"],
      ["Saved Path", x.savedPath || "-"]
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      fields.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${x.isbn}_File_Details.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Helper to load pending uncopied allocated ISBNs into the input box
  const handleLoadAllocatedIsbns = () => {
    const copiedKey = `fileflow_copied_isbns_${empId}`;
    const copiedSet = new Set(JSON.parse(localStorage.getItem(copiedKey) || "[]"));
    const uncopied = (data || []).filter(x => {
      const clean = String(x.isbn || "").trim();
      return !copiedSet.has(clean) && !(x.downloaded || x.individualDownloaded || (x.fileCopies && x.fileCopies.length > 0));
    });
    const isbns = [...new Set(uncopied.map(x => String(x.isbn || "").trim()).filter(Boolean))];
    if (!isbns.length) {
      note?.("All allocated files have already been copied or no pending allocations exist.");
      return;
    }
    setNetworkIsbns(isbns.join("\n"));
    note?.(`Loaded ${isbns.length} pending allocated ISBN(s).`);
  };

  // Network Search & Copy Engine
  const handleNetworkFind = async (autoCopy = false) => {
    if (networkOperationRef.current) return;
    if (!networkSource.trim() || (autoCopy && !networkDest.trim())) {
      setNetworkMessage("Enter the source and destination folder paths before copying.");
      return;
    }
    networkOperationRef.current = true;
    setNetworkBusy(true);
    setNetworkMessage("Searching network path...");
    setNetworkFound([]);
    setNetworkMissing([]);
    setMatchPage(1);
    try {
      const isbns = [...new Set(networkIsbns.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean))];

      if (!isbns.length) {
        setNetworkBusy(false);
        setNetworkMessage("Please enter at least one ISBN in the box.");
        note?.("Please enter at least one ISBN in the box.");
        return;
      }

      const disallowed = isbns.filter(isbn => !/^\d{13}$/.test(isbn) || isDisallowedIsbn(isbn));
      if (disallowed.length > 0) {
        setNetworkBusy(false);
        const msg = `Invalid ISBN format: Format '978-1-234567-XX-X' (${disallowed.slice(0, 2).join(", ")}) is not allowed. Please enter standard 13-digit ISBNs.`;
        setNetworkMessage(msg);
        alert(msg);
        return;
      }

      const response = await fetch("/api/network/find", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: networkSource, isbns }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Network search failed");
      const { found, missing } = result;
      setNetworkFound(found);
      setNetworkMissing(missing);
      setNetworkMessage(`Found ${found.length} | Not found ${missing.length} | Checked ${isbns.length} folders`);

      if (autoCopy && found.length) await handleNetworkCopy(found, { missing, source: networkSource.trim(), destination: networkDest.trim(), batch: networkBatch.trim() });
    } catch (error) {
      setNetworkMessage(`Search failed: ${error.message}`);
    } finally { networkOperationRef.current = false; setNetworkBusy(false); }
  };

  const handleNetworkCopy = async (itemsToCopy = networkFound, options = {}) => {
    const validItems = (itemsToCopy || []).filter(item => item && !isDisallowedIsbn(item.isbn));
    if (!validItems.length) {
      alert("Find matching ISBN folders/files first (or entered ISBNs are disallowed).");
      return;
    }
    setNetworkBusy(true);
    setNetworkMessage("Copying found ISBN folders/files from server...");

    const destination = options.destination ?? networkDest.trim();
    const batch = options.batch ?? networkBatch.trim();
    const missingIsbns = options.missing ?? networkMissing;
    let copied = 0, failed = 0;
    const copiedIsbnsList = [];
    await runCopyPool(validItems, async item => {
      setNetworkMessage(`Copying ${copied + failed + 1}/${itemsToCopy.length}: ${item.isbn}`);
      const cleanIsbn = String(item.isbn).trim();
      try {
        const response = await fetch("/api/network/copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item, destination, batch })
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || "Copy failed");
        copied += 1;
        copiedIsbnsList.push(cleanIsbn);

        // Update data state so copied files are visible in File Allocation without auto-starting timer
        setData(prev => {
          const current = prev || [];
          const exists = current.some(x => String(x.isbn).trim() === cleanIsbn);
          if (exists) {
            return current.map(x =>
              String(x.isbn).trim() === cleanIsbn
                ? {
                    ...x,
                    downloaded: true,
                    individualDownloaded: true,
                    status: x.status || "Allocated",
                    downloadSavedPath: result.destinationPath,
                    fileCopies: [...(x.fileCopies || []), result]
                  }
                : x
            );
          } else {
            return [
              {
                isbn: cleanIsbn,
                eid: empId,
                ename: empName,
                allocated: Date.now(),
                status: "Allocated",
                started: null,
                sessions: [],
                downloaded: true,
                individualDownloaded: true,
                priority: "Normal",
                dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
                projectId: "PRJ-PETERLANG",
                projectName: `Peter Lang Title (${cleanIsbn})`,
                downloadSavedPath: result.destinationPath,
                fileCopies: [result]
              },
              ...current
            ];
          }
        });

        try {
          const adminStore = JSON.parse(localStorage.getItem("fileflow_admin_allocations") || "[]");
          const existingIdx = adminStore.findIndex(a => String(a.isbn).trim() === cleanIsbn && (
            String(a.employeeId || "").toLowerCase().trim() === String(empId).toLowerCase().trim() ||
            String(a.employee || "").toLowerCase().trim() === String(empName).toLowerCase().trim()
          ));
          let allocationRecord = null;
          if (existingIdx >= 0) {
            adminStore[existingIdx] = {
              ...adminStore[existingIdx],
              status: adminStore[existingIdx].status || "Allocated",
              downloaded: true,
              individualDownloaded: true,
              downloadSavedPath: result.destinationPath
            };
            allocationRecord = adminStore[existingIdx];
          } else {
            allocationRecord = {
              id: `ALC-${Date.now()}-${empId}-${cleanIsbn}`,
              fileId: `FIL-${cleanIsbn}`,
              isbn: cleanIsbn,
              employee: empName,
              employeeId: empId,
              employeeCode: user?.code || user?.empId || empId,
              employeeAltIds: [empId, user?.code, empName].filter(Boolean),
              role: selectedRole || "book",
              process: "Book Interior",
              workflowStage: "Book Interior",
              status: "Allocated",
              downloaded: true,
              individualDownloaded: true,
              started: null,
              downloadSavedPath: result.destinationPath,
              createdAt: Date.now(),
              date: new Date().toISOString().split("T")[0],
              projectId: "PRJ-PETERLANG",
              projectName: `Peter Lang Title (${cleanIsbn})`
            };
            adminStore.unshift(allocationRecord);
          }
          localStorage.setItem("fileflow_admin_allocations", JSON.stringify(adminStore));

          if (allocationRecord) {
            fetch("/api/allocations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(allocationRecord)
            }).catch(() => {});
          }
        } catch (e) {}

        setNetworkFound(prev =>
          prev.map(x =>
            String(x.isbn).trim() === cleanIsbn
              ? { ...x, copyStatus: "Copied", destinationPath: result.destinationPath }
              : x
          )
        );
      } catch (error) {
        failed += 1;
        setNetworkFound(prev =>
          prev.map(x =>
            String(x.isbn).trim() === cleanIsbn
              ? { ...x, copyStatus: "Failed", copyError: error.message }
              : x
          )
        );
      }
    });

    // Immediately clear copied ISBNs from the Network Copy ISBN list and search results
    if (copied > 0) {
      // Remember copied ISBNs persistently
      try {
        const copiedKey = `fileflow_copied_isbns_${empId}`;
        const existingCopied = JSON.parse(localStorage.getItem(copiedKey) || "[]");
        const nextCopied = [...new Set([...existingCopied, ...copiedIsbnsList])];
        localStorage.setItem(copiedKey, JSON.stringify(nextCopied));
      } catch (e) {}

      const copiedSet = new Set(copiedIsbnsList);
      setNetworkIsbns(prev => prev.split(/[\s,;]+/).filter(isbn => isbn && !copiedSet.has(isbn)).join("\n"));
      setNetworkFound(prev => prev.filter(item => !copiedSet.has(item.isbn)));
      if (!failed && !missingIsbns.length) {
        setNetworkMissing([]);
        setSubPage?.("alloc");
      }
      note?.(`Copied ${copied} ISBN(s). ${failed} failed, ${missingIsbns.length} not found. Uncopied ISBNs remain for retry.`);
    }

    setNetworkBusy(false);
    setNetworkMessage(`Copied ${copied} ISBN(s) to ${destination}${batch ? "\\" + batch : ""} | Failed: ${failed} | Not found: ${missingIsbns.length}`);
  };

  return (
    <div className="emp-workspace-container">
      {/* =========================================================
          VIEW 1: DASHBOARD (Greeting & KPI Cards)
          ========================================================= */}
      {subPage === "files" && (
        <div className="emp-view-section">
          {/* Top Greeting Header */}
          <div className="emp-dash-hero-card">
            <div className="emp-dash-hero-text">
              <span className="emp-eyebrow">EMPLOYEE PRODUCTION DESK · {roleLabel}</span>
              <h1>{getGreeting()}, {(empName || "Employee").split(" ")[0]}!</h1>
              <p>Here is your current workload and publishing production summary for today.</p>
            </div>
            <div className="emp-dash-date-badge">
              <Clock3 size={15} />
              <span>
                {new Date().toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })}
              </span>
            </div>
          </div>

          {/* PROCEED BANNER TO NETWORK COPY */}
          <div className="emp-proceed-banner">
            <div className="emp-proceed-text">
              <b>Ready to begin copying files?</b>
              <span>Click Proceed to transfer your pending allocated ISBNs directly into Network Copy staging.</span>
            </div>
            <button type="button" className="emp-btn-proceed-act" onClick={proceedToNetwork}>
              <span>Proceed to Network Copy</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* KPI Summary Cards Grid */}
          <div className="emp-kpi-cards-grid">

            {/* 1. Total Allocated */}
            <div className="emp-kpi-card emp-kpi-total" onClick={() => setSubPage("alloc")}>
              <div className="emp-kpi-icon emp-icon-total">
                <FileArchive size={24} />
              </div>
              <div className="emp-kpi-content">
                <span>Total Files Allocated</span>
                <b>{data.length}</b>
                <small>Assigned ISBN folders</small>
              </div>
            </div>

            {/* 2. In Progress (WIP) */}
            <div className="emp-kpi-card emp-kpi-wip" onClick={() => setSubPage("tracker")}>
              <div className="emp-kpi-icon emp-icon-wip">
                <Activity size={24} />
              </div>
              <div className="emp-kpi-content">
                <span>In Progress (WIP)</span>
                <b>{data.filter((x) => x.status === "WIP").length}</b>
                <small>Currently working</small>
              </div>
            </div>

            {/* 3. Completed */}
            <div className="emp-kpi-card emp-kpi-completed" onClick={() => setSubPage("reports")}>
              <div className="emp-kpi-icon emp-icon-completed">
                <CheckCircle2 size={24} />
              </div>
              <div className="emp-kpi-content">
                <span>Completed Files</span>
                <b>{data.filter((x) => x.status === "Complete").length}</b>
                <small>Finished & uploaded</small>
              </div>
            </div>

            {/* 4. Pending / Yet to Start */}
            <div className="emp-kpi-card emp-kpi-pending" onClick={() => setSubPage("alloc")}>
              <div className="emp-kpi-icon emp-icon-pending">
                <ClipboardCheck size={24} />
              </div>
              <div className="emp-kpi-content">
                <span>Pending to Start</span>
                <b>{data.filter((x) => x.status === "Allocated").length}</b>
                <small>Ready for download</small>
              </div>
            </div>

            {/* 5. QC Pending */}
            <div className="emp-kpi-card emp-kpi-qc" onClick={() => setSubPage("alloc")}>
              <div className="emp-kpi-icon emp-icon-qc">
                <AlertCircle size={24} />
              </div>
              <div className="emp-kpi-content">
                <span>QC Pending</span>
                <b>{data.filter((x) => x.status === "QC Pending" || x.status === "Pending").length}</b>
                <small>Awaiting review</small>
              </div>
            </div>

            {/* 6. Rework */}
            <div className="emp-kpi-card emp-kpi-rework" onClick={() => setSubPage("alloc")}>
              <div className="emp-kpi-icon emp-icon-rework">
                <RefreshCw size={24} />
              </div>
              <div className="emp-kpi-content">
                <span>Rework Required</span>
                <b>{data.filter((x) => x.status === "Rework").length}</b>
                <small>Corrections needed</small>
              </div>
            </div>

            {/* 7. On Hold */}
            <div className="emp-kpi-card emp-kpi-hold" onClick={() => setSubPage("alloc")}>
              <div className="emp-kpi-icon emp-icon-hold">
                <Clock3 size={24} />
              </div>
              <div className="emp-kpi-content">
                <span>On Hold</span>
                <b>{data.filter((x) => x.status === "Hold").length}</b>
                <small>Waiting for queries</small>
              </div>
            </div>

            {/* 8. Mail Corrections */}
            <div className="emp-kpi-card emp-kpi-mail" style={{ cursor: "pointer" }} onClick={() => setActiveNav?.("Mail Corrections")}>
              <div className="emp-kpi-icon emp-icon-mail" style={{ background: "#eff6fc", color: "#2874b2" }}>
                <MessageSquareText size={24} />
              </div>
              <div className="emp-kpi-content">
                <span>Mail Corrections</span>
                <b>{mailSummary.unread || mailSummary.total}</b>
                <small>{mailSummary.unread ? `${mailSummary.unread} unread correction${mailSummary.unread === 1 ? "" : "s"}` : "Open correction inbox"}</small>
              </div>
            </div>
          </div>

          <section className="emp-card emp-today-task-panel">
            <div className="emp-insight-head"><h2>Today Task</h2><span>{assignedTodayTasks.length} assigned</span></div>
            {assignedTodayTasks.length ? (
              <div className="emp-today-task-list">
                {assignedTodayTasks.map(task => (
                  <div key={task.id} className="emp-today-task-item">
                    <div className={`emp-task-priority ${String(task.priority || "Normal").toLowerCase()}`}>
                      {task.priority || "Normal"}
                    </div>
                    <div className="emp-today-task-copy">
                      <b>{task.title}</b>
                      <small>{task.description || "Manager assigned daily work"}</small>
                    </div>
                    <div className="emp-today-task-meta">
                      <span>{task.due || "Today"}</span>
                      <em>{task.status || "Open"}</em>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="emp-empty-state">No manager-posted tasks for today yet.</p>
            )}
          </section>

          <div className="emp-dashboard-insights">
            <section className="emp-card emp-focus-timer">
              {/* Card Header (No Complete Status shown!) */}
              <div className="emp-insight-head">
                <h2>Work Timer</h2>
                <span className={`emp-shift-status-pill ${workTimerState.status}`}>
                  {workTimerState.status === "working"
                    ? "Working"
                    : workTimerState.status === "break"
                    ? "In Break"
                    : workTimerState.status === "checked_out"
                    ? "Checked Out"
                    : "Not Checked In"}
                </span>
              </div>

              {/* Big Timer Clock (Resets to 00:00:00 on Check Out) */}
              <div className={`emp-focus-clock ${workTimerState.status === "break" ? "on-break" : workTimerState.status === "checked_out" ? "checked-out" : ""}`}>
                {workTimerState.status === "checked_out" ? "00:00:00" : workTimerState.status === "idle" ? "00:00:00" : dur(totalProductionSecs)}
              </div>
              <small className="emp-timer-subtext">
                {workTimerState.status === "working"
                  ? `Current working time · ${roleLabel}`
                  : workTimerState.status === "break"
                  ? `In Break · Working paused (${workTimerState.activeBreakType || "Break"})`
                  : workTimerState.status === "checked_out"
                  ? "Shift ended · Checked Out for today"
                  : "Ready to start · Click Check In"}
              </small>

              {/* 3 Main Buttons: Check In | Break / In Break | Check Out */}
              <div className="emp-timer-actions-3btn">
                <button
                  type="button"
                  className={`emp-btn-shift check-in ${workTimerState.status === "working" ? "active" : ""}`}
                  onClick={handleCheckIn}
                  title="Check in and start/resume production timer"
                >
                  <Play size={13} />
                  <span>Check In</span>
                </button>

                <button
                  type="button"
                  className={`emp-btn-shift break ${workTimerState.status === "break" ? "in-break" : ""}`}
                  onClick={() => handleToggleBreak(workTimerState.activeBreakType || "Break")}
                  title={workTimerState.status === "break" ? "Click to stop break and resume work" : "Click to start break"}
                >
                  <Coffee size={13} className={workTimerState.status === "break" ? "emp-break-pulsing" : ""} />
                  <span>{workTimerState.status === "break" ? "In Break" : "Break"}</span>
                </button>

                <button
                  type="button"
                  className={`emp-btn-shift check-out ${workTimerState.status === "checked_out" ? "disabled" : ""}`}
                  onClick={handleCheckOut}
                  disabled={workTimerState.status === "checked_out"}
                  title="Check Out, stop timer and record Total Production Time"
                >
                  <LogOut size={13} />
                  <span>Check Out</span>
                </button>
              </div>

              {/* Active Break Bar when on break */}
              {workTimerState.status === "break" && (
                <div className="emp-active-break-notice">
                  <div className="emp-active-break-details">
                    <Coffee size={14} className="emp-break-pulsing" />
                    <div>
                      <b>In Break ({workTimerState.activeBreakType || "Break"})</b>
                      <small>Overall break running: {dur(overallBreakSecs)}</small>
                    </div>
                  </div>
                  <div className="emp-break-chips-quick">
                    <button
                      type="button"
                      className={`emp-chip-type ${workTimerState.activeBreakType === "Morning Break" ? "selected" : ""}`}
                      onClick={() => setWorkTimerState(p => ({ ...p, activeBreakType: "Morning Break" }))}
                    >
                      Morning
                    </button>
                    <button
                      type="button"
                      className={`emp-chip-type ${workTimerState.activeBreakType === "Lunch" ? "selected" : ""}`}
                      onClick={() => setWorkTimerState(p => ({ ...p, activeBreakType: "Lunch" }))}
                    >
                      Lunch
                    </button>
                    <button
                      type="button"
                      className={`emp-chip-type ${workTimerState.activeBreakType === "Evening Break" ? "selected" : ""}`}
                      onClick={() => setWorkTimerState(p => ({ ...p, activeBreakType: "Evening Break" }))}
                    >
                      Evening
                    </button>
                    <button
                      type="button"
                      className="emp-btn-stop-break-chip"
                      onClick={() => handleToggleBreak()}
                      title="Stop break and resume working"
                    >
                      <Square size={10} />
                      <span>Stop Break</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3 Metrics: Total Production Time, File Break Time, Overall Break Time (Target line removed) */}
              <div className="emp-timer-meta-3col">
                {/* 1. Total Production Time */}
                <div className={`emp-timer-metric-card ${totalProductionSecs >= 8 * 3600 ? "green" : "red"}`}>
                  <span className="emp-metric-label">Total Production Time</span>
                  <b className="emp-metric-time" style={{ color: totalProductionSecs >= 8 * 3600 ? "#16a34a" : "#dc2626" }}>
                    {dur(totalProductionSecs)}
                  </b>
                </div>

                {/* 2. File Break Time */}
                <div className="emp-timer-metric-card neutral">
                  <span className="emp-metric-label">File Break Time</span>
                  <b className="emp-metric-time" style={{ color: "#0f172a" }}>
                    {dur(fileBreakSecs)}
                  </b>
                </div>

                {/* 3. Overall Break Time */}
                <div className={`emp-timer-metric-card ${overallBreakSecs >= 1 * 3600 ? "green" : "red"}`}>
                  <span className="emp-metric-label">Overall Break Time</span>
                  <b className="emp-metric-time" style={{ color: overallBreakSecs >= 1 * 3600 ? "#16a34a" : "#dc2626" }}>
                    {dur(overallBreakSecs)}
                  </b>
                </div>
              </div>
            </section>

            <section className="emp-card emp-breakdown-card">
              <div className="emp-insight-head"><h2>Work Breakdown</h2><span>{dashboardRows.length} files</span></div>
              <div className="emp-breakdown-list">{statusBreakdown.filter(item => item.count).map(item => (
                <div key={item.status}><span>{pill(item.status)}<b>{item.count}</b></span><i><b style={{width:`${dashboardRows.length ? item.count / dashboardRows.length * 100 : 0}%`}} /></i></div>
              ))}</div>
            </section>

            <section className="emp-card emp-activity-card">
              <div className="emp-insight-head"><h2>Recent Activity</h2><button onClick={() => setSubPage("tracker")}>View tracker</button></div>
              <div className="emp-activity-list">{recentActivity.map(item => (
                <div key={item.isbn}><i /><span><b>{item.isbn}</b><small>{item.status} · {shortDateTime(item.statusUpdatedAt || item.allocated)}</small></span></div>
              ))}</div>
            </section>
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW 2: FILE ALLOCATION
          ========================================================= */}
      {subPage === "alloc" && (
        <div className="emp-view-section">
          <div className="emp-alloc-hero-bar">
            <div>
              <h1>{workflowRole === "cover" ? "My Cover Works" : workflowRole === "book" ? "My Book Works" : "File Allocated"}</h1>
              <div className="emp-crumb-trail">
                Dashboard › File Allocation › {workflowRole === "cover" ? "My Cover Works" : workflowRole === "book" ? "My Book Works" : "File Allocated"} · Role: <b>{roleLabel}</b> ({roleDeliverableDesc})
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button type="button" className="emp-btn-download-all" onClick={handleDownloadAll}>
                <Download size={16} />
                <span>Download All Files</span>
              </button>
              <button
                type="button"
                className="emp-btn-secondary"
                style={{
                  padding: "9px 14px",
                  borderRadius: "8px",
                  background: "#fee2e2",
                  color: "#b91c1c",
                  border: "1px solid #fca5a5",
                  fontWeight: 700,
                  fontSize: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer"
                }}
                onClick={handleDeleteAll}
              >
                <X size={15} />
                <span>Delete All</span>
              </button>
            </div>
          </div>

          <div className="emp-production-shell">
            {/* Toolbar */}
            <div className="emp-alloc-toolbar">
              <div className="emp-search-box">
                <Search size={15} />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setAllocPage(1);
                  }}
                  placeholder="Search by ISBN / Folder..."
                />
              </div>

              <div className="emp-filter-field">
                <span className="emp-field-label">Status</span>
                <select
                  value={allocStatusFilter}
                  onChange={(e) => {
                    setAllocStatusFilter(e.target.value);
                    setAllocPage(1);
                  }}
                >
                  {["All", "Allocated", "WIP", "Hold", "Rework", "Complete", "Reject"].map((st) => (
                    <option key={st} value={st}>
                      {st === "All" ? "All Status" : st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="emp-filter-field">
                <span className="emp-field-label">Sort by</span>
                <select
                  value={allocSort}
                  onChange={(e) => {
                    setAllocSort(e.target.value);
                    setAllocPage(1);
                  }}
                >
                  <option value="allocatedDesc">Allocated At (Newest)</option>
                  <option value="allocatedAsc">Allocated At (Oldest)</option>
                  <option value="isbnAsc">ISBN (Ascending)</option>
                  <option value="statusAsc">Status</option>
                </select>
              </div>

              <button className="emp-icon-btn" title="Refresh">
                <RefreshCw size={15} />
              </button>
            </div>

            {/* Allocation Table */}
            <table className="emp-data-table emp-alloc-table">
              <thead>
                <tr>
                  <th style={{ width: "4%" }}>S.NO</th>
                  <th style={{ width: "22%" }}>ISBN FOLDER</th>
                  <th style={{ width: "16%" }}>SPECS (TRIM / PAGES)</th>
                  <th style={{ width: "12%" }}>ALLOCATED AT</th>
                  <th style={{ width: "12%" }}>STATUS</th>
                  <th style={{ width: "12%" }}>UPLOAD STATUS</th>
                  <th style={{ width: "18%" }}>
                    {workflowRole === "cover"
                      ? "DEVELOPER ALLOCATED TO"
                      : workflowRole === "book"
                      ? "GRAPHICS ALLOCATED TO"
                      : workflowRole === "qc"
                      ? "BOOK & COVER DEVELOPERS"
                      : "QC & DEVELOPERS"}
                  </th>
                  <th style={{ width: "16%" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {currentPageRows.map((x, i) => {
                  const dt = dateParts(x.allocated);
                  const cover = getCoverAllocation(x.isbn);
                  const sharedSpec = getSharedIsbnSpecs(x.isbn);
                  const displayTrim = x.trimSize || sharedSpec.trimSize || "";
                  const displayPages = (x.pageCount !== undefined && x.pageCount !== "") ? x.pageCount : (sharedSpec.pageCount || "");
                  return (
                    <tr key={x.isbn}>
                      <td>{(allocPage - 1) * pageSize + i + 1}</td>
                      <td>
                        <span className="emp-isbn-cell">
                          <b>□ {x.isbn}</b>
                          <small>{x.downloadSavedPath ? `Path: ${x.downloadSavedPath}` : (x.projectName || "Peterlang")}</small>
                          {(displayTrim || displayPages) && (
                            <small className="emp-isbn-spec-tag">
                              {displayTrim ? `Trim: ${displayTrim}` : ""}
                              {displayTrim && displayPages ? " • " : ""}
                              {displayPages ? `${displayPages} pages` : ""}
                            </small>
                          )}
                          {x.qcRemarks && (
                            <span style={{ fontSize: "11px", color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", padding: "2px 6px", borderRadius: "4px", marginTop: "3px", display: "inline-block", fontWeight: 600 }}>
                              QC Remark: {x.qcRemarks}
                            </span>
                          )}
                        </span>
                      </td>
                      <td>
                        <div className="emp-specs-cell">
                          {displayTrim ? (
                            <span className="emp-spec-badge-trim" title="Book Trim Size">
                              {displayTrim}
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "12px" }}>—</span>
                          )}
                          {displayPages ? (
                            <span className="emp-spec-badge-pages" title="Page Count">
                              {displayPages} pgs
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "12px" }}>—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="emp-date-stacked">
                          <span>{dt.date}</span>
                          <small>{dt.time}</small>
                        </div>
                      </td>
                      <td>
                        <select
                          className={`emp-status-select emp-status-${x.status.toLowerCase()}`}
                          value={x.status}
                          onChange={(e) => handleStatusChange(x.isbn, e.target.value)}
                        >
                          {["Allocated", "WIP", "Hold", "Rework", "Complete", "Reject"].map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {isIsbnUploaded(x.isbn, x) ? (
                          <span className="emp-upload-status uploaded">Uploaded</span>
                        ) : (
                          <span className="emp-upload-status pending">Not Uploaded</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>
                            {cover.name}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {pill(cover.status)}
                            {cover.role && (
                              <span style={{ fontSize: "11px", color: "#64748b" }}>
                                ({cover.role})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>
                          <button
                            className="emp-btn-detail"
                            onClick={() => handleOpenDetailModal(x)}
                            title="View Details"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>

                          {workflowRole === "qc" && (
                            <>
                              <button
                                className="emp-btn-detail"
                                style={{ background: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" }}
                                onClick={() => handleOpenQcRemarkModal(x)}
                                title="Add QC Remark & Route Rework"
                              >
                                <AlertCircle size={13} />
                                <span>Remark</span>
                              </button>
                              <button
                                className="emp-btn-detail"
                                style={{ background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }}
                                onClick={() => handleQuickCompleteQc(x.isbn)}
                                title="Approve QC and advance to QAG Ready"
                              >
                                <CheckCircle2 size={13} />
                                <span>Approve</span>
                              </button>
                            </>
                          )}

                          {workflowRole === "qag" && (
                            <button
                              className="emp-btn-detail"
                              style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}
                              onClick={() => handleOpenQagModal(x)}
                              title="Audit Deliverables and Submit Report"
                            >
                              <ClipboardCheck size={13} />
                              <span>Audit</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!currentPageRows.length && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                      No allocated files found. Click Refresh or wait for Admin to allocate files.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>


            {/* Pagination Footer */}
            {filteredAllocRows.length > 0 && (
              <Pagination
                currentPage={allocPage}
                totalItems={filteredAllocRows.length}
                pageSize={pageSize}
                onPageChange={setAllocPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                itemName="allocated files"
              />
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW 3: PRODUCTION TRACKER (Live Stopwatch Timers)
          ========================================================= */}
      {subPage === "tracker" && (
        <div className="emp-view-section">
          <div className="emp-view-header">
            <div>
              <span className="emp-eyebrow">LIVE PRODUCTION</span>
              <h1>Production tracker</h1>
              <p>Timer starts after each ISBN download and stops only after completed file upload.</p>
            </div>
            <div className="emp-quick-stats">
              <div>
                <small>Downloaded Files</small>
                <b>{trackedRows.length}</b>
              </div>
              <div>
                <small>Active Now</small>
                <b>{trackedRows.filter((x) => x.status === "WIP").length}</b>
              </div>
              <button
                type="button"
                className="emp-btn-secondary emp-recent-activity-btn"
                onClick={() => {
                  loadRecentsBatches();
                  setShowRecentsModal(true);
                }}
              >
                <Activity size={15} />
                <span>Recent Activity</span>
              </button>
            </div>
          </div>

          <div className="emp-card emp-table-card">
            <table className="emp-data-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>S.NO</th>
                  <th>ISBN</th>
                  <th>EMPLOYEE ID</th>
                  <th>EMPLOYEE NAME</th>
                  <th>STARTED AT</th>
                  <th>LIVE WORKING TIME</th>
                  <th>STATUS</th>
                  <th>UPLOAD STATUS</th>
                  <th style={{ minWidth: "160px" }}>REASON</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrackedRows.map((x, i) => {
                  const itemIdx = (trackerPage - 1) * trackerPageSize + i + 1;
                  return (
                  <tr key={x.isbn}>
                    <td>{itemIdx}</td>
                    <td><b>{x.isbn}</b></td>
                    <td><b>{x.eid}</b></td>
                    <td>{x.ename}</td>
                    <td>{fmt(x.started)}</td>
                    <td className="emp-timer-cell">
                      <Clock3 size={14} />
                      <span>{dur(secs(x))}</span>
                    </td>
                    <td>{pill(x.status)}</td>
                    <td>{isIsbnUploaded(x.isbn, x) ? <span className="emp-upload-status uploaded">Uploaded</span> : <span className="emp-upload-status pending">Not Uploaded</span>}</td>
                    <td>
                      {x.statusReason || x.rejectReason || x.reworkReason || x.reason ? (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 9px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            background: x.status === "Reject" ? "#fef2f2" : x.status === "Rework" ? "#fffbeb" : "#f1f5f9",
                            color: x.status === "Reject" ? "#b91c1c" : x.status === "Rework" ? "#b45309" : "#334155",
                            border: `1px solid ${x.status === "Reject" ? "#fecaca" : x.status === "Rework" ? "#fde68a" : "#e2e8f0"}`,
                            maxWidth: "240px",
                            wordBreak: "break-word",
                            whiteSpace: "normal"
                          }}
                        >
                          {x.statusReason || x.rejectReason || x.reworkReason || x.reason}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>-</span>
                      )}
                    </td>
                  </tr>
                );
                })}
                {!trackedRows.length && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                      No downloaded files yet. Go to File Allocation and download files to start tracking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {trackedRows.length > 0 && (
            <Pagination
              currentPage={trackerPage}
              totalItems={trackedRows.length}
              pageSize={trackerPageSize}
              onPageChange={setTrackerPage}
              onPageSizeChange={setTrackerPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
              itemName="tracked files"
            />
          )}
        </div>
      )}

      {/* =========================================================
          VIEW 4: PRODUCTION REPORTS (15 Columns + Export)
          ========================================================= */}
      {subPage === "reports" && (
        <div className="emp-view-section">
          <div className="emp-view-header">
            <div>
              <span className="emp-eyebrow">MANAGEMENT REPORT</span>
              <h1>Production report</h1>
              <p>Only individually downloaded ISBNs are shown. Upload completion stops timing and marks Complete.</p>
            </div>
            <button className="emp-btn-export" onClick={exportFullExcel}>
              <FileSpreadsheet size={16} />
              <span>Export Excel</span>
            </button>
          </div>

          <div className="emp-card emp-table-card emp-reports-card">
            <div className="emp-scroll-x">
              <table className="emp-data-table emp-reports-19col-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px", textAlign: "center" }}>Sl.No</th>
                    <th>Date</th>
                    <th>Emp ID</th>
                    <th>Emp Name</th>
                    <th>ISBN</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th style={{ minWidth: "160px" }}>Reason</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Total Time</th>
                    <th>Break Duration</th>
                    <th>Net Work Time</th>
                    <th>Deliverables Status</th>
                    <th>Uploaded Files</th>
                    <th>Remarks</th>
                    <th>QC Remarks</th>
                    <th>QAG Remarks</th>
                    <th>Saved Path</th>
                    <th>Completion Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReportRows.map((x, i) => {
                    const itemIdx = (reportPage - 1) * reportPageSize + i + 1;
                    const workSec = secs(x);
                    const brkSec = breakSecs(x);
                    const totalSec = workSec + brkSec;
                    return (
                      <tr key={x.isbn}>
                        <td style={{ textAlign: "center", fontWeight: "700", color: "#64748b" }}>{itemIdx}</td>
                        <td>{new Date(x.allocated || Date.now()).toLocaleDateString()}</td>
                        <td><b>{x.eid}</b></td>
                        <td>{x.ename}</td>
                        <td><b>{x.isbn}</b></td>
                        <td><span className="emp-role-tag">{x.workType || roleLabel}</span></td>
                        <td>{pill(x.status)}</td>
                        <td>
                          {x.statusReason || x.rejectReason || x.reworkReason || x.reason ? (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 9px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                background: x.status === "Reject" ? "#fef2f2" : x.status === "Rework" ? "#fffbeb" : "#f1f5f9",
                                color: x.status === "Reject" ? "#b91c1c" : x.status === "Rework" ? "#b45309" : "#334155",
                                border: `1px solid ${x.status === "Reject" ? "#fecaca" : x.status === "Rework" ? "#fde68a" : "#e2e8f0"}`,
                                maxWidth: "260px",
                                wordBreak: "break-word",
                                whiteSpace: "normal"
                              }}
                            >
                              {x.statusReason || x.rejectReason || x.reworkReason || x.reason}
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>-</span>
                          )}
                        </td>
                        <td>{x.started ? shortDateTime(x.started) : "-"}</td>
                        <td>{x.ended ? shortDateTime(x.ended) : "-"}</td>
                        <td><b>{dur(totalSec)}</b></td>
                        <td style={{ color: "#f59e0b" }}>{dur(brkSec)}</td>
                        <td style={{ color: "#10b981", fontWeight: 700 }}>{dur(workSec)}</td>
                        <td>
                          {isIsbnUploaded(x.isbn, x) ? (
                            <span className="emp-upload-status uploaded">Uploaded</span>
                          ) : (
                            <span className="emp-upload-status pending">Not Uploaded</span>
                          )}
                        </td>
                        <td><code style={{ fontSize: "11px" }}>{x.uploaded || "-"}</code></td>
                        <td>{x.statusReason || "-"}</td>
                        <td>{x.qcRemarks || "-"}</td>
                        <td>{x.qagRemarks || "-"}</td>
                        <td><code style={{ fontSize: "11px" }}>{x.savedPath || x.downloadSavedPath || `C:\\QC_Testing\\${x.isbn}`}</code></td>
                        <td>{x.ended ? new Date(x.ended).toLocaleDateString() : "-"}</td>
                      </tr>
                    );
                  })}
                  {!trackedRows.length && (
                    <tr>
                      <td colSpan={20} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                        No records for production report yet. Download and work on ISBNs to generate reports.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="emp-reports-footer-total">
                    <td colSpan={10} style={{ textAlign: "right", paddingRight: "16px" }}>
                      All Files Break & Production Totals:
                    </td>
                    <td><b>{dur(trackedRows.reduce((tot, x) => tot + secs(x) + breakSecs(x), 0))}</b></td>
                    <td style={{ color: "#f59e0b" }}><b>{dur(trackedRows.reduce((tot, x) => tot + breakSecs(x), 0))}</b></td>
                    <td style={{ color: "#10b981" }}><b>{dur(trackedRows.reduce((tot, x) => tot + secs(x), 0))}</b></td>
                    <td colSpan={7}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {trackedRows.length > 0 && (
              <Pagination
                currentPage={reportPage}
                totalItems={trackedRows.length}
                pageSize={reportPageSize}
                onPageChange={setReportPage}
                onPageSizeChange={setReportPageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                itemName="report rows"
              />
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW 5: NOTIFICATIONS (Two Hours Tracking)
          ========================================================= */}
      {subPage === "notifications" && (
        <div className="emp-view-section">
          <div className="emp-view-header">
            <div>
              <span className="emp-eyebrow">NOTIFICATIONS</span>
              <h1>Tracking notifications</h1>
              <p>Two Hours Tracking reports and status remarks are collected here.</p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                type="button"
                className="emp-btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer"
                }}
                onClick={handleMarkAllAsRead}
                disabled={!notifications.length || notifications.every(n => n.read)}
              >
                <CheckCircle2 size={15} />
                <span>Mark All as Read</span>
              </button>
              <button
                type="button"
                className="emp-btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer"
                }}
                onClick={handleClearNotifications}
                disabled={!notifications.length}
              >
                <Trash2 size={15} />
                <span>Clear Notifications</span>
              </button>
            </div>
          </div>

          <div className="emp-notif-list">
            {notifications.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "48px 24px",
                background: "#ffffff",
                border: "1px dashed #cbd5e1",
                borderRadius: "12px",
                color: "#64748b"
              }}>
                <BellOff size={36} style={{ marginBottom: "12px", opacity: 0.5, color: "#94a3b8" }} />
                <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#334155" }}>No notifications</h3>
                <p style={{ margin: 0, fontSize: "13px" }}>All notifications have been cleared or read.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`emp-notif-card ${n.read ? "read" : "unread"}`}>
                  <div className="emp-notif-head">
                    <div>
                      <b>{n.title}</b>
                      <small>
                        {n.employeeId} - {n.employeeName} | {shortDateTime(n.createdAt)} {n.reportWindow && `| ${n.reportWindow}`}
                      </small>
                    </div>
                    <button
                      className="emp-btn-detail"
                      onClick={() => {
                        const updated = notifications.map((item) =>
                          item.id === n.id ? { ...item, read: !item.read } : item
                        );
                        setNotifications(updated);
                        try {
                          localStorage.setItem("fileflow_notifications", JSON.stringify(updated));
                        } catch (e) {}
                        window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
                      }}
                    >
                      {n.read ? "Read" : "Mark Read"}
                    </button>
                  </div>
                  {(n.isbn || n.reportSummary?.isbn) && (
                    <div className="emp-notif-isbn-row">
                      <span>ISBN: <b>{n.isbn || n.reportSummary.isbn}</b></span>
                      <button type="button" onClick={() => openNotificationWork(n)}>
                        Open ISBN Work
                      </button>
                    </div>
                  )}
                  <p className="emp-notif-reason">{n.reason}</p>
                  {n.reportSummary?.total && (
                    <div className="emp-notif-chips">
                      <span>Total: <b>{n.reportSummary.total}</b></span>
                      <span>WIP: <b>{n.reportSummary.wip || 0}</b></span>
                      <span>Complete: <b>{n.reportSummary.complete || 0}</b></span>
                      <span>Hold: <b>{n.reportSummary.hold || 0}</b></span>
                      <span>Rework: <b>{n.reportSummary.rework || 0}</b></span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW 6: NETWORK COPY TOOL
          ========================================================= */}
      {subPage === "network" && (
        <div className="emp-view-section">
          <div className="emp-view-header">
            <div>
              <span className="emp-eyebrow">NETWORK COPY</span>
              <h1>ISBN Batch Copy</h1>
              <p>Copy ISBN files and folders from the source to your chosen destination.</p>
            </div>
            <button
              type="button"
              className="emp-btn-secondary"
              style={{ padding: "8px 14px", borderRadius: "8px", background: "#f0f5fc", color: "#0b3c6d", border: "1px solid #c7ddf2", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
              onClick={() => {
                loadRecentsBatches();
                setShowRecentsModal(true);
              }}
            >
              View Recents Archive
            </button>
          </div>

          <div className="emp-quarantine-banner">
            <b>Copy to your destination folder</b>
            <p>Enter source, destination and ISBNs, then click START ISBN COPY. Proceed is optional. Files copy directly to the destination, inside the batch subfolder if provided.</p>
          </div>

          <p className="emp-network-status">Copy destination: {networkDest.trim() ? `${networkDest.trim().replace(/[\\/]+$/, "")}${networkBatch.trim() ? "\\" + networkBatch.trim() : ""}` : "Enter a destination folder below"}</p>

          <div className="emp-network-grid">
            <div className="emp-card emp-network-panel">
              <h3>Source server folder</h3>
              <small>Example: \\192.168.0.198\Share\ISBN_Folder or C:\QC_Testing\Source</small>
              <input
                disabled={networkBusy}
                value={networkSource}
                onChange={(e) => setNetworkSource(e.target.value)}
                placeholder="\\192.168.0.198\Share\ISBN_Folder"
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "6px" }}>
                <h3>ISBN list</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    className="emp-btn-secondary"
                    style={{ fontSize: "11px", padding: "3px 8px", height: "auto", minHeight: "24px" }}
                    disabled={networkBusy}
                    onClick={handleLoadAllocatedIsbns}
                    title="Load pending uncopied ISBNs allocated to you by Admin"
                  >
                    Load Allocated ISBNs
                  </button>
                  {networkIsbns.split(/[\n, ]+/).filter(Boolean).length > 0 ? (
                    <span style={{ background: "#e6f4f1", color: "#00594C", fontWeight: "700", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", border: "1px solid #bfe3db" }}>
                      ✓ {networkIsbns.split(/[\n, ]+/).filter(Boolean).length} Allocated ISBNs Loaded
                    </span>
                  ) : (
                    <span style={{ background: "#f1f5f9", color: "#64748b", fontWeight: "600", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", border: "1px solid #e2e8f0" }}>
                      ✓ Cleared / Ready
                    </span>
                  )}
                </div>
              </div>
              <small>Enter ISBNs or load your allocations. START ISBN COPY copies directly; only successful ISBNs are cleared.</small>
              <textarea
                disabled={networkBusy}
                value={networkIsbns}
                onChange={(e) => setNetworkIsbns(e.target.value)}
                placeholder="No pending ISBNs to copy. (Enter ISBNs here or allocate files from Admin)"
                rows={6}
              />
            </div>

            <div className="emp-card emp-network-panel">
              <h3>Destination folder</h3>
              <small>Files are copied here directly, or inside the batch subfolder if specified.</small>
              <input
                disabled={networkBusy}
                value={networkDest}
                onChange={(e) => setNetworkDest(e.target.value)}
                placeholder="C:\Destination\Batch_01"
              />

              <h3 style={{ marginTop: "16px" }}>Batch folder name</h3>
              <small>Optional subfolder, e.g. Batch_August. Leave empty to copy directly to destination.</small>
              <input
                disabled={networkBusy}
                value={networkBatch}
                onChange={(e) => setNetworkBatch(e.target.value)}
                placeholder="Batch_August"
              />
            </div>
          </div>

          <div className="emp-card emp-network-upload-panel">
            <div className="emp-network-upload-copy">
              <div className="emp-network-upload-icon"><Upload size={20} /></div>
              <div>
                <h3>Upload Files (Local to Server)</h3>
                <p>Select one or more local files. The filename must contain the matching 13-digit ISBN.</p>
                <small>Example: <b>9781433100028_txt.pdf</b> updates ISBN 9781433100028 to Uploaded.</small>
              </div>
            </div>
            <label className="emp-network-file-picker">
              <Upload size={16} />
              <span>Choose Local Files</span>
              <input
                ref={networkUploadInputRef}
                type="file"
                multiple
                onChange={e => handleNetworkFileUpload(e.target.files)}
              />
            </label>
          </div>

          <div className="emp-network-actions" style={{ flexWrap: "wrap", gap: "8px" }}>
            <button
              className="emp-btn-primary"
              disabled={networkBusy}
              onClick={() => handleNetworkFind(true)}
            >
              START ISBN COPY
            </button>
            <button
              type="button"
              className="emp-btn-primary emp-path-upload-button"
              disabled={networkBusy || !networkSource.trim() || !networkDest.trim()}
              onClick={handlePathUpload}
            >
              <Upload size={15} /> Upload Files
            </button>
            <button
              className="emp-btn-secondary"
              disabled={networkBusy}
              onClick={() => {
                setNetworkIsbns("");
                setNetworkFound([]);
                setNetworkMissing([]);
                setNetworkMessage("Ready");
                note?.("ISBN list cleared.");
              }}
            >
              Clear
            </button>
            <span className="emp-network-status">{networkMessage}</span>
          </div>

          <div className="emp-card emp-table-card">
            <div className="emp-insight-head" style={{ padding: "14px 18px", borderBottom: "1px solid #dce7f3" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>Search Matches</h2>
            </div>
            <table className="emp-data-table">
              <thead>
                <tr>
                  <th style={{ width: "100px" }}>STATUS</th>
                  <th>ISBN</th>
                  <th>TYPE</th>
                  <th>FOUND PATH</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNetworkMatches.map((x) => (
                  <tr key={x.isbn}>
                    <td>
                      {x.isFound
                        ? pill(x.copyStatus === "Copied" ? "Complete" : x.copyStatus === "Failed" ? "Reject" : "Allocated")
                        : pill("Reject")}
                    </td>
                    <td><b>{x.isbn}</b></td>
                    <td>{x.isFound ? x.kind : "Missing"}</td>
                    <td className="emp-path-cell">{x.isFound ? (x.destinationPath || (x.paths || [x.path]).join(", ")) : "-"}{x.copyError && <small role="alert" style={{ display: "block", color: "#b91c1c" }}>{x.copyError}</small>}</td>
                  </tr>
                ))}
                {!allNetworkMatches.length && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "28px", color: "#64748b" }}>
                      No search results yet. Enter ISBNs above and click Find Only or START ISBN COPY.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {allNetworkMatches.length > 0 && (
              <Pagination
                currentPage={matchPage}
                totalItems={allNetworkMatches.length}
                pageSize={matchPageSize}
                onPageChange={setMatchPage}
                onPageSizeChange={setMatchPageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                itemName="matches"
              />
            )}
          </div>
        </div>
      )}


      {/* =========================================================
          MODAL 1: FILE ALLOCATION - PRODUCTION DETAILS MODAL
          ========================================================= */}
      {liveDetailItem && (
        <div className="emp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setDetailItem(null)}>
          <div className="emp-modal-card emp-work-modal" style={{ maxWidth: "660px", width: "100%" }}>
            {/* Header */}
            <div className="emp-work-modal-head">
              <div>
                <h2>File Allocated Details</h2>
                <small>Dashboard › File Allocation › {liveDetailItem.isbn}</small>
              </div>
              <button className="emp-close-btn" onClick={() => setDetailItem(null)} title="Close">
                <X size={18} />
              </button>
            </div>

            {/* Info Strip */}
            <div className="emp-work-info-strip">
              <span><b>Customer Name:</b> AHLE</span>
              <span><b>Project Name:</b> {liveDetailItem.projectName || "Peterlang"}</span>
              <span><b>Stage Name:</b> Artwork</span>
              <span><b>Process Name:</b> Art QC</span>
            </div>

            <div className="emp-modal-body">
              {/* 1. Status Selection Pills: Complete, WIP, Hold, Rework, Reject */}
              <div className="emp-modal-section-label">SELECT STATUS</div>
              <div className="emp-status-pill-group">
                {[
                  { key: "Complete", label: "Complete", icon: CheckCircle2, cls: "complete" },
                  { key: "WIP", label: "WIP", icon: Activity, cls: "wip" },
                  { key: "Hold", label: "Hold", icon: Clock3, cls: "hold" },
                  { key: "Rework", label: "Rework", icon: RotateCcw, cls: "rework" },
                  { key: "Reject", label: "Reject", icon: XCircle, cls: "reject" }
                ].map(({ key, label, icon: Icon, cls }) => (
                  <button
                    key={key}
                    type="button"
                    className={`emp-status-pill-opt ${cls} ${liveDetailItem.status === key ? "active" : ""}`}
                    onClick={() => handleModalSelectStatus(key)}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* 2. ISBN Details and Live Timer on the SAME LINE */}
              <div className="emp-modal-section-label">ISBN & LIVE TIMER</div>
              <div className="emp-isbn-timer-card">
                <div className="emp-isbn-top-row">
                  <div className="emp-isbn-left">
                    <div className="emp-isbn-title-row">
                      <BookOpen size={17} color="#0284c7" />
                      <b>{liveDetailItem.isbn}</b>
                    </div>
                    <div className="emp-isbn-sub">
                      {liveDetailItem.projectName || "Peterlang"} • {liveDetailItem.priority || "Normal"} • {liveDetailItem.status}
                    </div>
                  </div>

                  <div className="emp-isbn-right">
                    {/* Digital Live Stopwatch */}
                    <div className="emp-digital-stopwatch" title="Live Elapsed Duration">
                      <span className={`emp-stopwatch-indicator ${isModalTimerRunning ? "pulsing" : ""}`} />
                      <span>{dur(secs(liveDetailItem))}</span>
                    </div>

                    {/* Start & End Buttons */}
                    <div className="emp-timer-btn-row">
                      <button
                        type="button"
                        className="emp-btn-timer-start"
                        onClick={handleStartTimerModal}
                        disabled={isModalTimerRunning}
                        title="Start Timer (Status becomes WIP)"
                      >
                        <Play size={13} fill="currentColor" />
                        <span>Start</span>
                      </button>
                      <button
                        type="button"
                        className="emp-btn-timer-end"
                        onClick={handleEndTimerModal}
                        disabled={!isModalTimerRunning}
                        title="End Timer (Calculates Elapsed Duration)"
                      >
                        <Square size={13} fill="currentColor" />
                        <span>End</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Book Trim Size & Page Count Row (Synchronized across all roles for this ISBN) */}
                {(() => {
                  const sharedSpec = getSharedIsbnSpecs(liveDetailItem.isbn);
                  const currentTrim = liveDetailItem.trimSize || sharedSpec.trimSize || "";
                  const currentPages = (liveDetailItem.pageCount !== undefined && liveDetailItem.pageCount !== "")
                    ? liveDetailItem.pageCount
                    : (sharedSpec.pageCount || "");
                  const currentSource = liveDetailItem.specsEnteredBy || sharedSpec.enteredBy || "";

                  return (
                    <div className="emp-specs-control-row">
                      <div className="emp-spec-input-group">
                        <label htmlFor="bookTrimSizeSelect">
                          <SlidersHorizontal size={13} />
                          <span>Book Trim Size</span>
                          {currentSource && (
                            <span className="emp-spec-source-tag" title={`Entered by ${currentSource}`}>
                              ({currentSource})
                            </span>
                          )}
                        </label>
                        <select
                          id="bookTrimSizeSelect"
                          className="emp-spec-select"
                          value={currentTrim}
                          onChange={(e) => handleUpdateSpec("trimSize", e.target.value)}
                        >
                          <option value="">Select Trim Size...</option>
                          <option value="148 x 210">148 x 210</option>
                          <option value="152 x 229">152 x 229</option>
                          <option value="156 x 234">156 x 234</option>
                          <option value="170 x 244">170 x 244</option>
                          <option value="178 x 254">178 x 254</option>
                          <option value="210 x 297">210 x 297</option>
                        </select>
                      </div>

                      <div className="emp-spec-input-group">
                        <label htmlFor="pageCountInput">
                          <FileText size={13} />
                          <span>Page Count</span>
                          {currentSource && (
                            <span className="emp-spec-source-tag" title={`Entered by ${currentSource}`}>
                              ({currentSource})
                            </span>
                          )}
                        </label>
                        <input
                          id="pageCountInput"
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Enter page count (e.g. 240)"
                          className="emp-spec-input"
                          value={currentPages}
                          onChange={(e) => handleUpdateSpec("pageCount", e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 3. Mandatory Comments Section */}
              <div className="emp-modal-comments-card">
                <div className="emp-comments-header">
                  <label htmlFor="modalComments">
                    <MessageSquareText size={14} />
                    <span style={{ color: liveDetailItem.status === "Reject" ? "#dc2626" : liveDetailItem.status === "Rework" ? "#d97706" : liveDetailItem.status === "Hold" ? "#8b5cf6" : "inherit" }}>
                      {liveDetailItem.status === "Reject"
                        ? "Reject Reason"
                        : liveDetailItem.status === "Rework"
                        ? "Rework Reason"
                        : liveDetailItem.status === "Hold"
                        ? "Hold Reason"
                        : liveDetailItem.status === "Complete"
                        ? "Completion Remarks"
                        : "Comments / Remarks"}
                    </span>
                    <span className="emp-mandatory-badge">* Required</span>
                  </label>
                  <small>
                    {liveDetailItem.status === "Reject"
                      ? "Enter reason for rejecting this file"
                      : liveDetailItem.status === "Rework"
                      ? "Enter reason for rework request"
                      : liveDetailItem.status === "Hold"
                      ? "Enter reason for putting file on hold"
                      : "Must enter comments before submitting"}
                  </small>
                </div>
                <textarea
                  id="modalComments"
                  className={`emp-comments-input ${commentError ? "has-error" : ""}`}
                  placeholder={
                    liveDetailItem.status === "Reject"
                      ? "Enter reason for rejecting this file (Required)..."
                      : liveDetailItem.status === "Rework"
                      ? "Enter reason for rework (Required)..."
                      : liveDetailItem.status === "Hold"
                      ? "Enter reason for hold (Required)..."
                      : "Enter comments / remarks for this file (Required)..."
                  }
                  value={modalComment}
                  onChange={(e) => {
                    const val = e.target.value;
                    setModalComment(val);
                    if (commentError) setCommentError("");
                    setData((prev) =>
                      prev.map((item) =>
                        item.isbn === liveDetailItem.isbn
                          ? {
                              ...item,
                              statusReason: val,
                              holdReason: liveDetailItem.status === "Hold" ? val : item.holdReason,
                              rejectReason: liveDetailItem.status === "Reject" ? val : item.rejectReason,
                              reworkReason: liveDetailItem.status === "Rework" ? val : item.reworkReason,
                              reason: val
                            }
                          : item
                      )
                    );
                  }}
                  rows={3}
                />
                {commentError && (
                  <div className="emp-comment-error-alert">
                    <AlertCircle size={14} />
                    <span>{commentError}</span>
                  </div>
                )}
              </div>

              {/* 4. Action Buttons: Submit, Hold, Rework, Reject */}
              <div className="emp-modal-section-label">ACTIONS</div>
              <div className="emp-modal-actions-grid">
                <button
                  type="button"
                  className="emp-btn-action-qc"
                  onClick={() => handleModalActionSubmit("qc")}
                  title="Submit completed file"
                >
                  <CheckCircle2 size={15} />
                  <span>Submit</span>
                </button>

                <button
                  type="button"
                  className="emp-btn-action-hold"
                  onClick={() => handleModalActionSubmit("hold")}
                  title="Put file On Hold with remarks"
                >
                  <Clock3 size={15} />
                  <span>Hold</span>
                </button>

                <button
                  type="button"
                  className="emp-btn-action-rework"
                  onClick={() => handleModalActionSubmit("rework")}
                  title="Mark file for Rework with comments"
                >
                  <RotateCcw size={15} />
                  <span>Rework</span>
                </button>

                <button
                  type="button"
                  className="emp-btn-action-reject"
                  onClick={() => handleModalActionSubmit("reject")}
                  title="Reject file with remarks"
                >
                  <XCircle size={15} />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: REWORK / REJECT REASON MODAL
          ========================================================= */}
      {statusModal && (
        <div className="emp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setStatusModal(null)}>
          <div className="emp-modal-card emp-status-modal">
            <div className="emp-work-modal-head">
              <div>
                <span className="emp-eyebrow">{statusModal.status.toUpperCase()} DETAILS</span>
                <h2>{statusModal.isbn}</h2>
              </div>
              <button className="emp-close-btn" onClick={() => setStatusModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                handleSaveStatusModal({
                  projectId: form.statusProjectId.value.trim(),
                  projectName: form.statusProjectName.value.trim(),
                  priority: form.statusPriority.value,
                  dueDate: form.statusDue.value,
                  reason: form.statusReason.value.trim()
                });
              }}
            >
              <div className="emp-form-grid">
                <label>
                  Project ID
                  <input
                    name="statusProjectId"
                    defaultValue={statusModal.item?.projectId || "Ptlng0007"}
                    placeholder="Example: Ptlng0007"
                    required
                  />
                </label>
                <label>
                  Project Name
                  <input
                    name="statusProjectName"
                    defaultValue={statusModal.item?.projectName || "Peterlang"}
                    placeholder="Example: Peterlang"
                    required
                  />
                </label>
                <label>
                  Priority
                  <select name="statusPriority" defaultValue={statusModal.item?.priority || "Normal"}>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </label>
                <label>
                  Due Date
                  <input
                    type="date"
                    name="statusDue"
                    defaultValue={statusModal.item?.dueDate || ""}
                  />
                </label>
                <label className="full-width">
                  {statusModal.status} Reason / Remarks
                  <textarea
                    name="statusReason"
                    defaultValue={statusModal.item?.statusReason || ""}
                    placeholder={`Enter ${statusModal.status.toLowerCase()} reason / remarks...`}
                    rows={4}
                    required
                  />
                </label>
              </div>

              <div className="emp-modal-actions-row">
                <button type="submit" className="emp-btn-primary">
                  Save {statusModal.status}
                </button>
                <button
                  type="button"
                  className="emp-btn-secondary"
                  onClick={() => setStatusModal(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: UPLOAD DELIVERABLE MODAL
          ========================================================= */}
      {uploadModalItem && (
        <div
          className="emp-modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setUploadModalItem(null)}
        >
          <div className="emp-modal-card emp-status-modal" style={{ maxWidth: "520px" }}>
            <div className="emp-work-modal-head">
              <div>
                <span className="emp-eyebrow">UPLOAD DELIVERABLE ({roleLabel.toUpperCase()})</span>
                <h2>{uploadModalItem.isbn}</h2>
              </div>
              <button className="emp-close-btn" onClick={() => setUploadModalItem(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "16px 20px" }}>
              <div
                style={{
                  background: "#f0f5fc",
                  border: "1px solid #c7ddf2",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginBottom: "16px"
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#0b3c6d", marginBottom: "4px" }}>
                  Allowed Deliverable Pattern:
                </div>
                <code style={{ fontSize: "12px", color: "#0284c7", fontWeight: 700 }}>
                  {roleDeliverableDesc}
                </code>
              </div>

              <div className="emp-form-grid" style={{ gridTemplateColumns: "1fr" }}>
                <label>
                  Select PDF Deliverable File
                  <input
                    type="file"
                    accept=".pdf"
                    id="deliverableFileInput"
                    style={{
                      marginTop: "6px",
                      padding: "8px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      width: "100%"
                    }}
                  />
                </label>
              </div>

              <div className="emp-modal-actions-row" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="emp-btn-primary"
                  onClick={() => {
                    const input = document.getElementById("deliverableFileInput");
                    if (!input || !input.files || !input.files[0]) {
                      alert("Please select a PDF file.");
                      return;
                    }
                    handleUploadISBN(uploadModalItem.isbn, [input.files[0]]);
                    setUploadModalItem(null);
                  }}
                >
                  Upload & Mark Complete
                </button>
                <button
                  type="button"
                  className="emp-btn-secondary"
                  onClick={() => setUploadModalItem(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: RECENTS DELETED ARCHIVE MODAL
          ========================================================= */}
      {showRecentsModal && (
        <div
          className="emp-modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setShowRecentsModal(false)}
        >
          <div className="emp-modal-card emp-status-modal emp-recent-activity-modal" style={{ maxWidth: "1080px" }}>
            <div className="emp-work-modal-head">
              <div>
                <span className="emp-eyebrow">RECENTS</span>
                <h2>Deleted Production Records</h2>
              </div>
              <button className="emp-close-btn" onClick={() => setShowRecentsModal(false)}>
                Close
              </button>
            </div>

            <div className="emp-recent-activity-content">
              <div className="emp-recent-activity-toolbar">
                <div className="emp-recent-filter-tabs">
                  {["Daily", "Weekly", "Monthly"].map(option => (
                    <button
                      key={option}
                      type="button"
                      className={recentFilter === option ? "active" : ""}
                      onClick={() => setRecentFilter(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <label className="emp-recent-date-picker">
                  <span>Date</span>
                  <input
                    type="date"
                    value={recentDate}
                    onChange={(event) => setRecentDate(event.target.value)}
                    aria-label="Choose recent activity date"
                  />
                </label>
                <span className="emp-recent-result-count">{recentActivityRows.length} records</span>
              </div>

              <div className="emp-recent-activity-table-wrap">
                <table className="emp-recent-activity-table emp-recent-records-table">
                  <thead>
                    <tr>
                      <th>S.NO</th>
                      <th>ISBN</th>
                      <th>EMPLOYEE</th>
                      <th>DELETED AT</th>
                      <th>STARTED</th>
                      <th>ENDED</th>
                      <th>WORKING TIME</th>
                      <th>STATUS</th>
                      <th>REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivityRows.map((r, index) => {
                      const endTime = r.ended || (Number(r.deletedAt || 0) * 1000);
                      const workingTime = r.started ? dur(secs({ ...r, ended: endTime })) : "00:00:00";
                      const statusClass = String(r.status || "").toLowerCase().replaceAll(" ", "-");
                      return (
                        <tr key={`${r.batchId}-${r.allocationId || r.isbn}-${index}`}>
                          <td>{index + 1}</td>
                          <td><b>{r.isbn || "-"}</b></td>
                          <td>{r.eid || r.employeeId || "-"} - {r.ename || r.employee || "-"}</td>
                          <td>{fmt(Number(r.deletedAt || 0) * 1000)}</td>
                          <td>{fmt(r.started)}</td>
                          <td>{fmt(r.ended)}</td>
                          <td><b className="emp-recent-working-time">{workingTime}</b></td>
                          <td><span className={`emp-recent-status ${statusClass}`}>{r.status || "-"}</span></td>
                          <td>{r.statusReason || r.rejectReason || r.reworkReason || r.reason || r.remarks || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!recentActivityRows.length && (
                  <p className="emp-recent-empty">No deleted production records found for {recentFilter.toLowerCase()} view.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: QC REMARK & REWORK ROUTING MODAL
          ========================================================= */}
      {qcRemarkModalItem && (
        <div className="emp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setQcRemarkModalItem(null)}>
          <div className="emp-modal-card emp-work-modal" style={{ maxWidth: "560px", width: "100%" }}>
            <div className="emp-work-modal-head">
              <div>
                <h2>QC Remark &amp; Rework Routing</h2>
                <small>ISBN: <b>{qcRemarkModalItem.isbn}</b> · Quality Control Inspection</small>
              </div>
              <button className="emp-close-btn" onClick={() => setQcRemarkModalItem(null)} title="Close">
                <X size={18} />
              </button>
            </div>

            <div className="emp-modal-body" style={{ padding: "20px 24px" }}>
              {/* Dropdown for Recipient Routing: Graphics/Developer, Developer, Graphics */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  SEND QC REMARK TO <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select
                  value={qcSendTo}
                  onChange={(e) => setQcSendTo(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1.5px solid #2563eb",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#0f172a",
                    background: "#f8fafc"
                  }}
                >
                  <option value="Graphics/Developer">Graphics / Developer (Both Teams)</option>
                  <option value="Developer">Developer (Book Interior Only)</option>
                  <option value="Graphics">Graphics (Cover Design Only)</option>
                </select>
                <small style={{ display: "block", color: "#64748b", marginTop: "4px", fontSize: "11px" }}>
                  The system automatically resolves the assigned employee(s) from the Master ISBN record. No manual employee picking.
                </small>
              </div>

              {/* Recipient Auto-Lookup Preview Card */}
              {(() => {
                const coverInfo = getCoverAllocation(qcRemarkModalItem.isbn);
                const master = coverInfo?.master || {};
                const devName = master.developerName || "Book Developer";
                const devId = master.developerId || master.developerCode || "DEV";
                const gfxName = master.graphicsName || "Cover Developer";
                const gfxId = master.graphicsId || master.graphicsCode || "GFX";

                return (
                  <div style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "16px"
                  }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "6px" }}>
                      Target Recipient(s) Identified from Master ISBN:
                    </div>
                    {(qcSendTo === "Graphics/Developer" || qcSendTo === "Developer") && (
                      <div style={{ fontSize: "13px", color: "#0f172a", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 700, color: "#0284c7" }}>• Book Developer:</span>
                        <span>{devName} (ID: {devId})</span>
                        <span style={{ fontSize: "11px", background: "#fee2e2", color: "#b91c1c", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>Set to Rework</span>
                      </div>
                    )}
                    {(qcSendTo === "Graphics/Developer" || qcSendTo === "Graphics") && (
                      <div style={{ fontSize: "13px", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 700, color: "#7c3aed" }}>• Cover Developer:</span>
                        <span>{gfxName} (ID: {gfxId})</span>
                        <span style={{ fontSize: "11px", background: "#fee2e2", color: "#b91c1c", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>Set to Rework</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Remark Input Textarea */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  QC CORRECTION NOTES / REMARKS <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <textarea
                  rows={4}
                  value={qcRemarkText}
                  onChange={(e) => setQcRemarkText(e.target.value)}
                  placeholder="Enter detailed correction notes (e.g. Spine width error, heading hierarchy mismatch, font embed missing)..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            <div className="emp-modal-actions-row" style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="emp-btn-secondary"
                onClick={() => setQcRemarkModalItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="emp-btn-primary"
                style={{ background: "#dc2626", borderColor: "#b91c1c" }}
                onClick={handleSaveQcRemark}
              >
                Submit Remark &amp; Mark Rework
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: QAG QUALITY AUDIT REPORT SUBMISSION
          ========================================================= */}
      {qagModalItem && (
        <div className="emp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setQagModalItem(null)}>
          <div className="emp-modal-card emp-work-modal" style={{ maxWidth: "600px", width: "100%" }}>
            <div className="emp-work-modal-head">
              <div>
                <h2>Submit QAG Quality Audit Report</h2>
                <small>ISBN: <b>{qagModalItem.isbn}</b> · Final Quality Assurance Audit</small>
              </div>
              <button className="emp-close-btn" onClick={() => setQagModalItem(null)} title="Close">
                <X size={18} />
              </button>
            </div>

            <div className="emp-modal-body" style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    QUALITY AUDIT SCORE (%)
                  </label>
                  <input
                    type="text"
                    value={qagScore}
                    onChange={(e) => setQagScore(e.target.value)}
                    placeholder="e.g. 98.5%"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    FTR (FIRST TIME RIGHT)
                  </label>
                  <select
                    value={qagFtr}
                    onChange={(e) => setQagFtr(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                  >
                    <option value="Yes">Yes (Passed First Pass)</option>
                    <option value="No">No (Rework Occurred)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  DEFECTS COUNT
                </label>
                <input
                  type="number"
                  min="0"
                  value={qagDefects}
                  onChange={(e) => setQagDefects(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  AUDIT FINDINGS &amp; OBSERVATIONS
                </label>
                <textarea
                  rows={4}
                  value={qagFindings}
                  onChange={(e) => setQagFindings(e.target.value)}
                  placeholder="Enter QAG audit observations, typography checks, color gamut validation, etc..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", lineHeight: "1.5", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px", fontSize: "12px", color: "#166534" }}>
                <b>Publish Notice:</b> Submitting this QAG report marks the ISBN stage as Completed and immediately publishes the report to the Admin Dashboard.
              </div>
            </div>

            <div className="emp-modal-actions-row" style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="emp-btn-secondary"
                onClick={() => setQagModalItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="emp-btn-primary"
                style={{ background: "#2563eb", borderColor: "#1d4ed8" }}
                onClick={handleSubmitQag}
              >
                Submit QAG Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
