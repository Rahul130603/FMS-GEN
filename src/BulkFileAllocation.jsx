import AllocationHistory from "./AllocationHistory.jsx";
import { importHistoryKey, sourceType } from "./services/allocationHistory.js";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Info,
  Layers,
  Plus,
  Scale,
  Search,
  Sliders,
  Upload,
  User,
  Users,
  X,
  Activity,
  AlertCircle,
  Eye,
  BookOpen,
  ArrowUpDown
} from "lucide-react";
import * as XLSX from "xlsx";
import "./bulk-file-allocation.css";
import Pagination from "./Pagination";
import { distributeFiles, editManualCount } from "./services/allocationDistribution.js";
import { saveAllocationBatch } from "./services/allocationRequest.js";
import "./pagination.css";
import {
  BOOK_DEVELOPERS_16,
  COVER_DEVELOPERS_6,
  QC_EMPLOYEES_6,
  QAG_EMPLOYEES_6,
  getMasterIsbnRecords,
  saveMasterIsbnRecords,
  syncAllocatedMasterRecords
} from "./services/masterIsbnStore";

export { BOOK_DEVELOPERS_16, COVER_DEVELOPERS_6, QC_EMPLOYEES_6, QAG_EMPLOYEES_6 };

// Real Employees mapped across Production Teams matching Gentize Attendance Master
const TEAMS_DATA = [];
/* Employee groups are loaded from the central Employee Master API. */
/*
  {
    id: "team-dev",
    name: "Team Developer (Development & Engineering)",
    lead: "Monica R",
    leadId: "20022",
    workload: 42,
    members: [
      { id: "20013", code: "GEN0008", name: "Sivakumar G", role: "DEVELOPER", workload: 35 },
      { id: "20022", code: "GEN0014", name: "Monica R", role: "DEVELOPER", workload: 42 },
      { id: "20023", code: "GEN0015", name: "Saranya V", role: "DEVELOPER", workload: 38 },
      { id: "20027", code: "GEN0018", name: "Sheeba S", role: "DEVELOPER", workload: 32 },
      { id: "20028", code: "GEN0021", name: "Jayasurya J", role: "DEVELOPER", workload: 36 }
    ]
  },
  {
    id: "team-qc",
    name: "Team QC (Quality Control)",
    lead: "Santhosh Kumar A",
    leadId: "20038",
    workload: 38,
    members: [
      { id: "20038", code: "GEN0024", name: "Santhosh Kumar A", role: "QC", workload: 48 },
      { id: "20053", code: "GEN0053", name: "Praveenthan S", role: "QC", workload: 40 },
      { id: "20069", code: "GEN0069", name: "Ragu R", role: "QC", workload: 36 },
      { id: "20055", code: "GEN0055", name: "Devi K", role: "QC", workload: 42 },
      { id: "20042", code: "GEN0042", name: "Muruga Bhavani M", role: "QC", workload: 38 }
    ]
  },
  {
    id: "team-graphics",
    name: "Team Graphics (Design & Visuals)",
    lead: "Bala Murugan",
    leadId: "20065",
    workload: 45,
    members: [
      { id: "20065", code: "GEN0065", name: "Bala Murugan", role: "GRAPHICS", workload: 45 },
      { id: "20036", code: "GEN0032", name: "Dinesh S", role: "GRAPHICS", workload: 46 },
      { id: "20056", code: "GEN0056", name: "M.Abishek", role: "GRAPHICS", workload: 44 },
      { id: "20037", code: "GEN0028", name: "Prakash A", role: "GRAPHICS", workload: 44 },
      { id: "20081", code: "GEN0081", name: "Harish A", role: "GRAPHICS", workload: 40 }
    ]
  },
  {
    id: "team-qag-ops",
    name: "Team QAG & Operations (FMS / TPS / Analysis)",
    lead: "Inbakumar R",
    leadId: "20016",
    workload: 46,
    members: [
      { id: "20016", code: "GEN0016", name: "Inbakumar R", role: "QAG", workload: 36 },
      { id: "20031", code: "GEN0035", name: "Udhayapriyan S", role: "QAG", workload: 27 },
      { id: "20047", code: "GEN0019", name: "Sundharesan T", role: "JOB ANALYSIS", workload: 42 },
      { id: "20058", code: "GEN0058", name: "Praveen B", role: "FMS", workload: 46 },
      { id: "20035", code: "GEN0030", name: "Navin J", role: "TPS", workload: 44 }
    ]
  }
];
*/

// Flat list of all real employees
const ALL_EMPLOYEES = TEAMS_DATA.flatMap(t =>
  t.members.map(m => ({ ...m, team: t.name, teamId: t.id }))
);
const PRODUCTION_ROLES = new Set(["GRAPHICS", "QC", "DEVELOPER", "QAG"]);
const ATTACHED_PRODUCTION_ROLES = {
  graphics: ["bala murugan", "dinesh s", "m.abishek", "prakash a", "harish a", "ayyanthan.p"],
  qc: ["santhosh kumar", "santhosh kumar a", "praveenthan s", "raghu", "devi k", "muruga bhavani", "swetha.p", "vimal raj", "mohanapriya t"],
  developer: ["monica r", "saranya v", "sheeba s", "jayasurya j", "elambharathi k", "muthukumar g", "sivakumar g", "rajesh kannan", "jisleena", "dharshana priya", "preethi babudos", "suriyaprakash t", "dharshini", "sudhinraj a", "pradhap", "kabilesh", "g mano"],
  qag: ["inbakumar r", "udhayapriyan s", "udhayapriyans", "santhosh vikran", "lakshmi"]
};
const productionRoleFor = employee => {
  const name = String(employee.name || "").trim().toLowerCase().replace(/\s+/g, " ");
  const match = Object.entries(ATTACHED_PRODUCTION_ROLES).find(([, names]) => names.includes(name));
  return match ? match[0].toUpperCase() : String(employee.designation || "").trim().toUpperCase();
};

export default function BulkFileAllocation({ note, user, files = [], setFiles = () => {}, tasks = [], setTasks = () => {} }) {
  const [teamsData, setTeamsData] = useState(TEAMS_DATA);
  const allEmployees = useMemo(() => teamsData.flatMap(team => team.members.map(member => ({ ...member, team: team.name, teamId: team.id }))), [teamsData]);
  const bookDevelopers = useMemo(() => allEmployees.filter(employee => employee.role === "DEVELOPER"), [allEmployees]);
  const coverDevelopers = useMemo(() => allEmployees.filter(employee => employee.role === "GRAPHICS"), [allEmployees]);
  const qcEmployees = useMemo(() => allEmployees.filter(employee => employee.role === "QC"), [allEmployees]);
  const qagEmployees = useMemo(() => allEmployees.filter(employee => employee.role === "QAG"), [allEmployees]);
  const fileInputRef = useRef(null);

  // Tab State: 'studio' | 'matrix'
  const [allocationTab, setAllocationTab] = useState("studio");
  const [matrixSearch, setMatrixSearch] = useState("");
  const [matrixStatusFilter, setMatrixStatusFilter] = useState("All");
  const [matrixQcFilter, setMatrixQcFilter] = useState("All");
  const [matrixPage, setMatrixPage] = useState(1);
  const [matrixPageSize, setMatrixPageSize] = useState(25);

  // State for ISBNs & Upload - starts completely empty by default
  const [isbns, setIsbns] = useState([]);
  const [selectedIsbns, setSelectedIsbns] = useState([]);
  const [fileName, setFileName] = useState("");
  const [isbnSources, setIsbnSources] = useState({});
  const [uploadDate, setUploadDate] = useState("");
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [isbnSearch, setIsbnSearch] = useState("");
  const [manualIsbns, setManualIsbns] = useState("");

  // State for Allocation Mode & Distribution
  const [selectedCategory, setSelectedCategory] = useState("Developer"); // 'Developer' | 'Graphics' | 'QC' | 'QAG' | 'Dual' | 'Custom'
  const [mode, setMode] = useState("Category Allocation"); // 'Category Allocation' | 'Dual Allocation (Book + Cover)' | 'Individual Allocation' | 'Team Allocation' | 'Role-based Allocation'
  const [distribution, setDistribution] = useState("Equal Split"); // 'Equal Split' | 'Custom Count' | 'Workload Balanced'

  // Master ISBN store state & modals
  const [masterRecords, setMasterRecords] = useState(() => getMasterIsbnRecords());
  const [matrixModalReport, setMatrixModalReport] = useState(null);
  const [matrixModalRemarks, setMatrixModalRemarks] = useState(null);

  useEffect(() => {
    const handleMasterUpdate = () => {
      setMasterRecords(getMasterIsbnRecords());
    };
    window.addEventListener("masterIsbnStoreUpdated", handleMasterUpdate);
    window.addEventListener("adminAllocationsUpdated", handleMasterUpdate);
    window.addEventListener("storage", handleMasterUpdate);
    return () => {
      window.removeEventListener("masterIsbnStoreUpdated", handleMasterUpdate);
      window.removeEventListener("adminAllocationsUpdated", handleMasterUpdate);
      window.removeEventListener("storage", handleMasterUpdate);
    };
  }, []);

  // Selected entities
  const [selectedTeams, setSelectedTeams] = useState(TEAMS_DATA.map(t => t.id));
  const [selectedEmployees, setSelectedEmployees] = useState(ALL_EMPLOYEES.map(e => e.id));
  const [selectedRoles, setSelectedRoles] = useState(["DEVELOPER", "QC", "GRAPHICS", "QAG"]);

  // Custom allocation count overrides
  const [teamCounts, setTeamCounts] = useState({});
  const [employeeCounts, setEmployeeCounts] = useState({});
  const [roleCounts, setRoleCounts] = useState({});

  // Form Fields
  const [allocationDate, setAllocationDate] = useState("2026-09-02");
  const [priority, setPriority] = useState("Normal");
  const [dueDate, setDueDate] = useState("2026-09-05");
  const [workflowStage, setWorkflowStage] = useState("Based on Employee Role");
  const [notify, setNotify] = useState(true);

  // Bottom Preview Controls
  const [groupByTeam, setGroupByTeam] = useState(true);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState(10);

  // Modals & UI States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [allocationHistory, setAllocationHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fileflow_allocation_history") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetch("/api/employees").then(response => response.json()).then(payload => {
      if (!payload?.ok || !payload.items?.length) return;
      const allItems = payload.items
        .map(employee => ({ ...employee, designation: productionRoleFor(employee) }))
        .filter(employee => PRODUCTION_ROLES.has(employee.designation));

      const teamDefs = [
        { id: "team-dev", name: "Team Developer (Development & Engineering)", filter: e => ["DEVELOPER", "Developer"].includes(e.designation) },
        { id: "team-qc", name: "Team QC (Quality Control)", filter: e => ["QC", "Quality Control"].includes(e.designation) },
        { id: "team-graphics", name: "Team Graphics (Design & Visuals)", filter: e => ["GRAPHICS", "Graphics", "Graphic Designer"].includes(e.designation) },
        { id: "team-qag", name: "Team QAG", filter: e => String(e.designation || "").trim().toUpperCase() === "QAG" }
      ];

      const liveTeams = teamDefs.map((td, tIdx) => {
        let members = allItems.filter(td.filter).map((employee, mIdx) => ({
          id: String(employee.empId || employee.giEmpId).trim(),
          code: String(employee.giEmpId || employee.empId || "").trim(),
          alternateId: String(employee.empId || "").trim(),
          name: employee.name,
          role: employee.designation || "DEVELOPER",
          workload: 28 + ((mIdx + tIdx * 3) % 6) * 7
        }));
        const lead = members[0]?.name || "Team Lead";
        const leadId = members[0]?.id || "";
        const avgWorkload = Math.round(members.reduce((sum, m) => sum + m.workload, 0) / Math.max(1, members.length));
        return { id: td.id, name: td.name, lead, leadId, workload: avgWorkload, members };
      });

      setTeamsData(liveTeams);
      setSelectedTeams(liveTeams.map(team => team.id));
      setSelectedEmployees(liveTeams.flatMap(team => team.members.map(member => member.id)));
      setSelectedRoles([...new Set(liveTeams.flatMap(team => team.members.map(member => member.role)))].filter(role => PRODUCTION_ROLES.has(String(role).toUpperCase())));
    }).catch(() => {});
  }, []);

  // Calculate file counts per team/employee based on mode & distribution method
  const totalSelectedIsbns = selectedIsbns.length;

  // Active teams list
  const activeTeams = useMemo(() => teamsData.filter(t => selectedTeams.includes(t.id)), [teamsData, selectedTeams]);

  // Active employees list
  const activeEmployees = useMemo(() => {
    if (mode === "Team Allocation") {
      return allEmployees.filter(e => selectedTeams.includes(e.teamId));
    }
    if (mode === "Role-based Allocation") {
      return allEmployees.filter(e => selectedRoles.includes(e.role));
    }
    return allEmployees.filter(e => selectedEmployees.includes(e.id));
  }, [mode, selectedTeams, selectedRoles, selectedEmployees, allEmployees]);

  // Dynamic calculated team counts
  const calculatedTeamCounts = useMemo(() => {
    return Object.fromEntries(distributeFiles(totalSelectedIsbns, activeTeams, teamCounts, distribution).map(team => [team.id, team.count]));
  }, [activeTeams, distribution, teamCounts, totalSelectedIsbns]);

  // Dynamic calculated employee assignments
  const employeeAllocations = useMemo(() => {
    const list = [];
    if (!activeEmployees.length) return list;

    if (mode === "Team Allocation") {
      activeTeams.forEach(team => {
        const teamTotal = calculatedTeamCounts[team.id] || 0;
        const members = team.members;
        const perMember = members.length ? Math.floor(teamTotal / members.length) : 0;
        const rem = members.length ? teamTotal % members.length : 0;

        members.forEach((m, idx) => {
          const count = perMember + (idx < rem ? 1 : 0);
          list.push({
            ...m,
            team: team.name,
            teamId: team.id,
            count,
            existingWorkload: m.workload,
            totalAfter: Math.min(100, Math.round(m.workload + count * 1.0))
          });
        });
      });
      return list;
    }

    if (mode === "Individual Allocation") {
      distributeFiles(totalSelectedIsbns, activeEmployees, employeeCounts, distribution).forEach(emp => {
        const count = emp.count;

        list.push({
          ...emp,
          count,
          existingWorkload: emp.workload,
          totalAfter: Math.min(100, Math.round(emp.workload + count * 1.0))
        });
      });
      return list;
    }

    // Role-based Category equal distribution (Developer, Graphics, QC, QAG)
    if (selectedCategory === "Developer" || mode === "Developer") {
      const bookDist = distributeFiles(totalSelectedIsbns, bookDevelopers, employeeCounts, distribution);
      return bookDist.map((dev, idx) => ({
        ...dev,
        team: "Team Developer (Development & Engineering)",
        teamId: "team-dev",
        department: "Book Development",
        workflowRole: "Book Developer",
        existingWorkload: 35 + (idx % 10),
        totalAfter: Math.min(100, 35 + (idx % 10) + dev.count)
      }));
    }

    if (selectedCategory === "Graphics" || mode === "Graphics") {
      const coverDist = distributeFiles(totalSelectedIsbns, coverDevelopers, employeeCounts, distribution);
      return coverDist.map((dev, idx) => ({
        ...dev,
        team: "Team Graphics (Design & Visuals)",
        teamId: "team-graphics",
        department: "Cover Development",
        workflowRole: "Cover Developer",
        existingWorkload: 40 + (idx % 6),
        totalAfter: Math.min(100, 40 + (idx % 6) + dev.count)
      }));
    }

    if (selectedCategory === "QC" || mode === "QC") {
      const qcDist = distributeFiles(totalSelectedIsbns, qcEmployees, employeeCounts, distribution);
      return qcDist.map((dev, idx) => ({
        ...dev,
        team: "Team QC (Quality Control)",
        teamId: "team-qc",
        department: "Quality Control",
        workflowRole: "Quality Control",
        existingWorkload: 38 + (idx % 8),
        totalAfter: Math.min(100, 38 + (idx % 8) + dev.count)
      }));
    }

    if (selectedCategory === "QAG" || mode === "QAG") {
      const qagDist = distributeFiles(totalSelectedIsbns, qagEmployees, employeeCounts, distribution);
      return qagDist.map((dev, idx) => ({
        ...dev,
        team: "Team QAG (Quality Assurance Group)",
        teamId: "team-qag-ops",
        department: "Quality Assurance",
        workflowRole: "QAG",
        existingWorkload: 32 + (idx % 6),
        totalAfter: Math.min(100, 32 + (idx % 6) + dev.count)
      }));
    }

    if (selectedCategory === "Dual" || mode === "Dual Allocation (Book + Cover)") {
      distributeFiles(totalSelectedIsbns, bookDevelopers, employeeCounts, distribution).forEach((dev, idx) => {
        const count = dev.count;
        list.push({
          ...dev,
          team: "Team Developer (Development & Engineering)",
          teamId: "team-dev",
          department: "Book Development",
          workflowRole: "Book Developer",
          count,
          existingWorkload: 35 + (idx % 10),
          totalAfter: Math.min(100, 35 + (idx % 10) + count)
        });
      });

      distributeFiles(totalSelectedIsbns, coverDevelopers, employeeCounts, distribution).forEach((dev, idx) => {
        const count = dev.count;
        list.push({
          ...dev,
          team: "Team Graphics (Design & Visuals)",
          teamId: "team-graphics",
          department: "Cover Development",
          workflowRole: "Cover Developer",
          count,
          existingWorkload: 40 + (idx % 6),
          totalAfter: Math.min(100, 40 + (idx % 6) + count)
        });
      });

      return list;
    }

    // Role-based Allocation
    const activeRolesList = [...new Set(activeEmployees.map(e => e.role))];
    const roles = distributeFiles(totalSelectedIsbns, activeRolesList.map(id => ({ id })), roleCounts, distribution);
    roles.forEach(role => {
      distributeFiles(role.count, activeEmployees.filter(emp => emp.role === role.id)).forEach(emp => {
        list.push({ ...emp, existingWorkload: emp.workload, totalAfter: Math.min(100, emp.workload + emp.count) });
      });
    });

    return list;
  }, [mode, selectedCategory, activeTeams, activeEmployees, bookDevelopers, coverDevelopers, qcEmployees, qagEmployees, calculatedTeamCounts, distribution, employeeCounts, roleCounts, totalSelectedIsbns]);

  // Total allocated files across all members
  const totalAllocatedFiles = useMemo(() => {
    return employeeAllocations.reduce((sum, e) => sum + (e.count || 0), 0);
  }, [employeeAllocations]);

  // Check if count matches
  const targetTotalAlloc = (selectedCategory === "Dual" || mode === "Dual Allocation (Book + Cover)") ? totalSelectedIsbns * 2 : totalSelectedIsbns;
  const isCountMatched = totalAllocatedFiles === targetTotalAlloc && totalSelectedIsbns > 0;

  // QC Ready and QAG Ready ISBNs across Master records
  const qcReadyIsbns = useMemo(() => {
    return (masterRecords || []).filter(r => r.developerStatus === "Complete" && r.graphicsStatus === "Complete").map(r => r.isbn);
  }, [masterRecords]);

  const qagReadyIsbns = useMemo(() => {
    return (masterRecords || []).filter(r => r.qcStatus === "Completed").map(r => r.isbn);
  }, [masterRecords]);

  // Live Consolidated 4-Role Master Matrix Data
  const masterMatrixData = useMemo(() => {
    return (masterRecords || []).map((m) => {
      let qcReadiness = "Pending Work";
      if (m.developerStatus === "Complete" && m.graphicsStatus === "Complete") {
        qcReadiness = "Ready for QC";
      } else if (m.developerStatus === "Rework" || m.graphicsStatus === "Rework" || m.qcStatus === "Remark Added") {
        qcReadiness = "Action Needed";
      } else if (m.developerStatus === "In Progress" || m.graphicsStatus === "In Progress" || m.developerStatus === "Complete" || m.graphicsStatus === "Complete") {
        qcReadiness = "In Progress";
      }

      let pipelineStage = "Book/Cover WIP";
      if (m.qagStatus === "Completed") {
        pipelineStage = "QAG Completed";
      } else if (m.qagReady) {
        pipelineStage = "QAG Ready";
      } else if (m.qcStatus === "Completed") {
        pipelineStage = "QC Completed";
      } else if (m.qcStatus === "Remark Added" || m.developerStatus === "Rework" || m.graphicsStatus === "Rework") {
        pipelineStage = "Rework";
      } else if (m.qcReady) {
        pipelineStage = "QC Ready";
      } else if (m.developerStatus === "Complete" && m.graphicsStatus !== "Complete") {
        pipelineStage = "Awaiting Cover";
      } else if (m.graphicsStatus === "Complete" && m.developerStatus !== "Complete") {
        pipelineStage = "Awaiting Book";
      }

      return {
        ...m,
        bookDev: m.developerName || "Unassigned",
        bookDevId: m.developerCode || m.developerId || "",
        bookStatus: m.developerStatus || "Pending",
        coverDev: m.graphicsName || "Unassigned",
        coverDevId: m.graphicsCode || m.graphicsId || "",
        coverStatus: m.graphicsStatus || "Pending",
        qcReadiness,
        pipelineStage
      };
    });
  }, [masterRecords]);

  const dualMatrixData = masterMatrixData;

  const matrixStats = useMemo(() => {
    const total = masterMatrixData.length;
    const readyForQc = masterMatrixData.filter((x) => x.qcReady).length;
    const readyForQag = masterMatrixData.filter((x) => x.qagReady).length;
    const completedQag = masterMatrixData.filter((x) => x.qagStatus === "Completed").length;
    const actionNeeded = masterMatrixData.filter((x) => x.qcReadiness === "Action Needed" || x.pipelineStage === "Rework").length;
    const inProgress = masterMatrixData.filter((x) => x.qcReadiness === "In Progress").length;
    const pending = masterMatrixData.filter((x) => x.qcReadiness === "Pending Work").length;
    return { total, readyForQc, readyForQag, completedQag, actionNeeded, inProgress, pending };
  }, [masterMatrixData]);

  const filteredMatrix = useMemo(() => {
    return masterMatrixData.filter((item) => {
      if (matrixSearch) {
        const q = matrixSearch.toLowerCase();
        const matchIsbn = item.isbn.toLowerCase().includes(q);
        const matchFile = (item.fileId || "").toLowerCase().includes(q);
        const matchProj = (item.projectName || "").toLowerCase().includes(q);
        const matchBook = (item.bookDev || "").toLowerCase().includes(q) || (item.bookDevId || "").toLowerCase().includes(q);
        const matchCover = (item.coverDev || "").toLowerCase().includes(q) || (item.coverDevId || "").toLowerCase().includes(q);
        const matchQc = (item.qcName || "").toLowerCase().includes(q);
        const matchQag = (item.qagName || "").toLowerCase().includes(q);
        if (!matchIsbn && !matchFile && !matchProj && !matchBook && !matchCover && !matchQc && !matchQag) return false;
      }
      if (matrixStatusFilter !== "All") {
        if (matrixStatusFilter === "QC Ready" && !item.qcReady) return false;
        if (matrixStatusFilter === "QC Completed" && item.qcStatus !== "Completed") return false;
        if (matrixStatusFilter === "QAG Ready" && !item.qagReady) return false;
        if (matrixStatusFilter === "QAG Completed" && item.qagStatus !== "Completed") return false;
        if (matrixStatusFilter === "Rework" && item.pipelineStage !== "Rework") return false;
        if (matrixStatusFilter === "Developer Complete" && item.bookStatus !== "Complete") return false;
        if (matrixStatusFilter === "Graphics Complete" && item.coverStatus !== "Complete") return false;
      }
      if (matrixQcFilter !== "All") {
        if (item.qcReadiness !== matrixQcFilter) return false;
      }
      return true;
    });
  }, [masterMatrixData, matrixSearch, matrixStatusFilter, matrixQcFilter]);

  const matrixTotalPages = Math.max(1, Math.ceil(filteredMatrix.length / matrixPageSize));
  const matrixCurrentRows = filteredMatrix.slice((matrixPage - 1) * matrixPageSize, matrixPage * matrixPageSize);

  const recordImport = (values, name) => {
    if (!values.length) return null;
    const item = { id: `IMPORT-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, createdAt: Date.now(), fileName: name, sourceType: sourceType(name), isbns: values };
    try {
      const saved = JSON.parse(localStorage.getItem(importHistoryKey) || "[]");
      localStorage.setItem(importHistoryKey, JSON.stringify([item, ...(Array.isArray(saved) ? saved : [])]));
    } catch { note?.("Could not save upload history in this browser."); }
    return { sourceId: item.id, sourceName: name, sourceType: item.sourceType };
  };

  const addIsbnValues = (value) => {
    const candidates = String(value || "").match(/\b\d+\b/g) || [];
    const validValues = candidates.filter(candidate => /^\d{13}$/.test(candidate));
    const invalidValues = candidates.filter(candidate => !/^\d{13}$/.test(candidate));
    const existing = new Set(isbns);
    const uniqueValidValues = [...new Set(validValues)];
    const newValues = uniqueValidValues.filter(candidate => !existing.has(candidate));
    const duplicateValues = validValues.length - uniqueValidValues.length + (validValues.length - newValues.length);

    if (!newValues.length && !validValues.length) {
      setInvalidCount(prev => prev + invalidValues.length);
      note?.("Only 13-digit ISBN numbers are allowed. Example: 9783906763279");
      return;
    }

    const source = recordImport(newValues, "Manual ISBN entry");
    if (source) setIsbnSources(prev => ({ ...prev, ...Object.fromEntries(newValues.map(isbn => [isbn, source])) }));
    setIsbns(prev => [...prev, ...newValues]);
    setSelectedIsbns(prev => [...new Set([...prev, ...newValues])]);
    setDuplicatesCount(prev => prev + duplicateValues);
    setInvalidCount(prev => prev + invalidValues.length);
    note?.(`${newValues.length} ISBN${newValues.length === 1 ? "" : "s"} added. Only 13-digit ISBNs are accepted.`);
  };

  const handleManualIsbnAdd = () => {
    if (!manualIsbns.trim()) {
      note?.("Enter or paste one or more 13-digit ISBNs.");
      return;
    }
    addIsbnValues(manualIsbns);
    setManualIsbns("");
  };

  // File upload reader
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }) + ", " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setUploadDate(dateStr);

    const reader = new FileReader();
    reader.onload = () => {
      let textContent = "";
      if (/\.xlsx?$/i.test(file.name)) {
        try {
          const workbook = XLSX.read(reader.result, { type: "array" });
          textContent = workbook.SheetNames.flatMap(name =>
            XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, raw: false }).flat()
          ).join(" ");
        } catch {
          note?.("Error reading Excel sheet.");
          return;
        }
      } else {
        textContent = String(reader.result || "");
      }

      const allMatches = String(textContent).match(/\b\d+\b/g) || [];
      const isbnMatches = allMatches.filter(candidate => /^\d{13}$/.test(candidate));
      const validList = [...new Set(isbnMatches)];
      const invalidValues = allMatches.filter(candidate => !/^\d{13}$/.test(candidate));
      const duplicates = Math.max(0, isbnMatches.length - validList.length);

      if (!validList.length) {
        setInvalidCount(prev => prev + invalidValues.length);
        note?.("No valid 13-digit ISBNs found. 10-digit ISBNs are not allowed.");
        return;
      }

      setFileName(file.name);
      const source = recordImport(validList, file.name);
      setIsbnSources(Object.fromEntries(validList.map(isbn => [isbn, source])));
      setIsbns(validList);
      setSelectedIsbns(validList);
      setDuplicatesCount(duplicates);
      setInvalidCount(invalidValues.length);
      note?.(`${validList.length} ISBNs loaded successfully.`);

      // Sync these uploaded files to the Files module so all 200 files (or batch count) show in Files
      const uploadedFileItems = validList.map((isbn, idx) => ({
        id: `FIL-${String(isbn).replace(/[^a-zA-Z0-9]/g, "").slice(-8) || 1000 + idx}`,
        isbn: isbn,
        name: `${isbn}.pdf`,
        project: "Peter Lang Batch",
        chapter: `Chapter ${String((idx % 24) + 1).padStart(2, "0")}`,
        type: "PDF",
        size: `${(12 + (idx % 15) * 1.3).toFixed(1)} MB`,
        owner: "Unassigned",
        status: "Ready for Allocation",
        uploadedAt: dateStr,
        sourceBatch: file.name
      }));

      setFiles(uploadedFileItems);
      try {
        localStorage.setItem("fileflow_uploaded_files", JSON.stringify(uploadedFileItems));
        const currentData = JSON.parse(localStorage.getItem("fileflow") || "{}");
        currentData.files = uploadedFileItems;
        localStorage.setItem("fileflow", JSON.stringify(currentData));
        window.dispatchEvent(new Event("storage"));
      } catch (err) {}
    };

    if (/\.xlsx?$/i.test(file.name)) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Toggle selection functions
  const toggleSelectAllIsbns = () => {
    if (selectedIsbns.length === isbns.length) {
      setSelectedIsbns([]);
    } else {
      setSelectedIsbns([...isbns]);
    }
  };

  const toggleSingleIsbn = (isbn) => {
    setSelectedIsbns(prev =>
      prev.includes(isbn) ? prev.filter(x => x !== isbn) : [...prev, isbn]
    );
  };

  const toggleTeam = (teamId) => {
    setSelectedTeams(prev =>
      prev.includes(teamId) ? prev.filter(x => x !== teamId) : [...prev, teamId]
    );
  };

  const toggleEmployee = (empId) => {
    setSelectedEmployees(prev =>
      prev.includes(empId) ? prev.filter(x => x !== empId) : [...prev, empId]
    );
  };

  // Save Draft to LocalStorage
  const handleSaveDraft = () => {
    const draft = {
      isbns,
      selectedIsbns,
      fileName,
      mode,
      distribution,
      selectedTeams,
      selectedEmployees,
      teamCounts,
      employeeCounts,
      allocationDate,
      priority,
      dueDate,
      workflowStage,
      savedAt: Date.now()
    };
    localStorage.setItem("fileflow_allocation_draft", JSON.stringify(draft));
    note?.("Draft allocation saved successfully.");
  };

  // Perform Allocation Execution
  const handleConfirmAllocation = async () => {
    if (submittingRef.current) return;
    if (!selectedIsbns.length) {
      note?.("Please select at least one ISBN file.");
      return;
    }
    if (!employeeAllocations.length) {
      note?.("Please select at least one employee or team.");
      return;
    }
    if (!isCountMatched) {
      note?.(`Total files (${totalAllocatedFiles}) must match required assignments (${targetTotalAlloc}).`);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    let cursor = 0;
    const allAllocations = [];
    const pendingCacheWrites = new Map();
    const batchId = `BATCH-${Date.now()}`;

    try {
      if (mode === "Dual Allocation (Book + Cover)") {
        // Use exactly the employee order and counts shown in the review preview.
        const sortedBookDevs = employeeAllocations.filter(emp => bookDevelopers.some(dev => dev.id === emp.id));
        const sortedCoverDevs = employeeAllocations.filter(emp => coverDevelopers.some(dev => dev.id === emp.id));
        if (!sortedBookDevs.length || !sortedCoverDevs.length) throw new Error("Both Book and Cover teams need employees.");
        // Map ISBNs to Book Devs
        const bookIsbnMap = new Map();
        let bCur = 0;
        sortedBookDevs.forEach((dev, idx) => {
          const count = dev.count;
          const assigned = selectedIsbns.slice(bCur, bCur + count);
          bCur += count;
          assigned.forEach(isbn => bookIsbnMap.set(isbn, dev));
        });

        // Map ISBNs to Cover Devs independently
        const coverIsbnMap = new Map();
        let cCur = 0;
        sortedCoverDevs.forEach((dev, idx) => {
          const count = dev.count;
          const assigned = selectedIsbns.slice(cCur, cCur + count);
          cCur += count;
          assigned.forEach(isbn => coverIsbnMap.set(isbn, dev));
        });

        // Build dual allocation pairs
        selectedIsbns.forEach(isbn => {
          const bookDev = bookIsbnMap.get(isbn) || sortedBookDevs[0];
          const coverDev = coverIsbnMap.get(isbn) || sortedCoverDevs[0];

          // 1. Book Allocation Record
          allAllocations.push({
            id: `ALC-BOOK-${batchId}-${bookDev.id}-${isbn}`,
            fileId: `FIL-${isbn}`,
            isbn,
            employee: bookDev.name,
            employeeId: bookDev.id,
            employeeCode: bookDev.code,
            employeeAltIds: [bookDev.id, bookDev.code, bookDev.name],
            team: "Team Developer (Development & Engineering)",
            department: "Book Development",
            role: "book",
            process: "Book Interior",
            workflowStage: "Book Interior",
            allocated: 1,
            completed: 0,
            rejected: 0,
            hold: 0,
            status: "Allocated",
            date: allocationDate,
            createdAt: Date.now(),
            projectId: "PRJ-PETERLANG",
            projectName: `Peter Lang Title (${isbn})`,
            project: "Peter Lang Batch",
            chapter: "Full Title",
            priority,
            dueDate,
            due: dueDate,
            allocationMode: mode,
            batchId,
            batchFile: fileName,
            counterpartRole: "Cover Developer",
            counterpartEmployee: coverDev.name,
            counterpartEmployeeId: coverDev.id,
            counterpartStatus: "Allocated",
            notifyEmployee: notify,
            postedBy: user?.name || "Administrator",
            postedTo: bookDev.name,
            remark: `Dual Allocation · Book assigned to ${bookDev.name} · Cover to ${coverDev.name}`
          });

          // 2. Cover Allocation Record
          allAllocations.push({
            id: `ALC-COVER-${batchId}-${coverDev.id}-${isbn}`,
            fileId: `FIL-${isbn}`,
            isbn,
            employee: coverDev.name,
            employeeId: coverDev.id,
            employeeCode: coverDev.code,
            employeeAltIds: [coverDev.id, coverDev.code, coverDev.name],
            team: "Team Graphics (Design & Visuals)",
            department: "Cover Development",
            role: "cover",
            process: "Cover Design",
            workflowStage: "Cover Design",
            allocated: 1,
            completed: 0,
            rejected: 0,
            hold: 0,
            status: "Allocated",
            date: allocationDate,
            createdAt: Date.now(),
            projectId: "PRJ-PETERLANG",
            projectName: `Peter Lang Title (${isbn})`,
            project: "Peter Lang Batch",
            chapter: "Cover Artwork",
            priority,
            dueDate,
            due: dueDate,
            allocationMode: mode,
            batchId,
            batchFile: fileName,
            counterpartRole: "Book Developer",
            counterpartEmployee: bookDev.name,
            counterpartEmployeeId: bookDev.id,
            counterpartStatus: "Allocated",
            notifyEmployee: notify,
            postedBy: user?.name || "Administrator",
            postedTo: coverDev.name,
            remark: `Dual Allocation · Cover assigned to ${coverDev.name} · Book to ${bookDev.name}`
          });
        });

        // Sync to individual employee local storages for instant login view
        sortedBookDevs.forEach(dev => {
          const myIsbns = selectedIsbns.filter(isbn => bookIsbnMap.get(isbn)?.id === dev.id);
          if (!myIsbns.length) return;
          try {
            const empPersistKey = `fileflow_emp_data_${dev.id}`;
            const existing = JSON.parse(localStorage.getItem(empPersistKey) || "[]");
            const newItems = myIsbns.map(isbn => ({
              isbn,
              allocationId: allAllocations.find(a => a.isbn === isbn && a.employeeId === dev.id)?.id,
              batchId,
              eid: dev.id,
              ename: dev.name,
              workType: "Book Developer",
              role: "book",
              allocated: Date.now(),
              status: "Allocated",
              started: null,
              ended: null,
              sessions: [],
              downloaded: false,
              individualDownloaded: false,
              priority,
              dueDate,
              projectId: "PRJ-PETERLANG",
              projectName: `Peter Lang Title (${isbn})`,
              counterpartRole: "Cover Developer",
              counterpartEmployee: coverIsbnMap.get(isbn)?.name || "Farhana N",
              counterpartStatus: "Allocated"
            }));
            const byIsbn = new Map(existing.map(x => [String(x.isbn), x]));
            newItems.forEach(item => byIsbn.set(String(item.isbn), item));
            pendingCacheWrites.set(empPersistKey, JSON.stringify([...byIsbn.values()]));
          } catch (e) {}
        });

        sortedCoverDevs.forEach(dev => {
          const myIsbns = selectedIsbns.filter(isbn => coverIsbnMap.get(isbn)?.id === dev.id);
          if (!myIsbns.length) return;
          try {
            const empPersistKey = `fileflow_emp_data_${dev.id}`;
            const existing = JSON.parse(localStorage.getItem(empPersistKey) || "[]");
            const newItems = myIsbns.map(isbn => ({
              isbn,
              allocationId: allAllocations.find(a => a.isbn === isbn && a.employeeId === dev.id)?.id,
              batchId,
              eid: dev.id,
              ename: dev.name,
              workType: "Cover Developer",
              role: "cover",
              allocated: Date.now(),
              status: "Allocated",
              started: null,
              ended: null,
              sessions: [],
              downloaded: false,
              individualDownloaded: false,
              priority,
              dueDate,
              projectId: "PRJ-PETERLANG",
              projectName: `Peter Lang Title (${isbn})`,
              counterpartRole: "Book Developer",
              counterpartEmployee: bookIsbnMap.get(isbn)?.name || "Ashwin G",
              counterpartStatus: "Allocated"
            }));
            const byIsbn = new Map(existing.map(x => [String(x.isbn), x]));
            newItems.forEach(item => byIsbn.set(String(item.isbn), item));
            pendingCacheWrites.set(empPersistKey, JSON.stringify([...byIsbn.values()]));
          } catch (e) {}
        });
      } else {
        const employeeGroups = employeeAllocations.map(emp => {
          const assignedIsbns = selectedIsbns.slice(cursor, cursor + emp.count);
          cursor += emp.count;
          return { emp, assignedIsbns };
        });

        for (const { emp, assignedIsbns } of employeeGroups) {
          for (const isbn of assignedIsbns) {
            const isCover = String(emp.team || emp.teamId || emp.role || "").toLowerCase().includes("graphic") ||
                            String(emp.team || emp.teamId || emp.role || "").toLowerCase().includes("cover");
            const itemProcess = isCover ? "Cover Development" : workflowStage;

            const allocationRecord = {
              id: `ALC-${Date.now()}-${emp.id}-${isbn}`,
              isbn,
              employee: emp.name,
              employeeId: emp.id,
              employeeCode: emp.code,
              employeeAltIds: [emp.id, emp.code, emp.alternateId, emp.name].filter(Boolean),
              team: emp.team,
              department: emp.role,
              allocated: 1,
              completed: 0,
              rejected: 0,
              hold: 0,
              status: "Allocated",
              date: allocationDate,
              createdAt: Date.now(),
              projectId: "PRJ-PETERLANG",
              projectName: `Peter Lang Title (${isbn})`,
              project: "Peter Lang Batch",
              process: itemProcess,
              chapter: "Full Title",
              priority,
              dueDate,
              due: dueDate,
              allocationMode: mode,
              workflowStage: itemProcess,
              batchId,
              batchFile: fileName,
              notifyEmployee: notify,
              postedBy: user?.name || "Administrator",
              postedTo: emp.name,
              remark: `Allocated to ${emp.name} · ${itemProcess} · Priority: ${priority}`
            };

            allAllocations.push(allocationRecord);
          }

          // Also update employee's localStorage directly for instant seamless login view
          try {
            const empPersistKey = `fileflow_emp_data_${emp.id}`;
            const empAltKey = `fileflow_emp_data_${emp.code}`;
            const existingEmpData = JSON.parse(localStorage.getItem(empPersistKey) || localStorage.getItem(empAltKey) || "[]");

            const newItems = assignedIsbns.map(isbn => ({
              isbn,
              eid: emp.id,
              ename: emp.name,
              allocated: Date.now(),
              status: "Allocated",
              started: null,
              ended: null,
              sessions: [],
              downloaded: false,
              individualDownloaded: false,
              priority,
              dueDate,
              projectId: "Ptlng0007",
              projectName: "Peterlang Batch",
              statusReason: "",
              statusAction: "Allocated",
              statusUpdatedAt: Date.now(),
              uploaded: "",
              savedPath: "",
              versions: []
            }));

            // Merge without duplicates
            const byIsbn = new Map(existingEmpData.map(x => [String(x.isbn), x]));
            newItems.forEach(item => byIsbn.set(String(item.isbn), item));
            const updatedEmpList = [...byIsbn.values()];

            pendingCacheWrites.set(empPersistKey, JSON.stringify(updatedEmpList));
            pendingCacheWrites.set(empAltKey, JSON.stringify(updatedEmpList));
          } catch (e) {}
        }
    }

      allAllocations.forEach(item => {
        Object.assign(item, isbnSources[item.isbn] || { sourceName: fileName || "Manual ISBN entry", sourceType: sourceType(fileName || "Manual ISBN entry") });
        item.batchFile = item.sourceName;
      });
      await saveAllocationBatch(allAllocations);
      pendingCacheWrites.forEach((value, key) => {
        try { localStorage.setItem(key, value); } catch (error) { console.warn("Employee cache could not be updated", error); }
      });

      // Save to admin overall allocations store
      const adminStoreKey = "fileflow_admin_allocations";
      const currentAdminData = JSON.parse(localStorage.getItem(adminStoreKey) || "[]");
      const updatedAdminData = [...allAllocations, ...currentAdminData];
      localStorage.setItem(adminStoreKey, JSON.stringify(updatedAdminData));

      // Sync to Master ISBN Store for 4-role pipeline persistence
      try {
        syncAllocatedMasterRecords(allAllocations);
        setMasterRecords(getMasterIsbnRecords());
      } catch (e) {
        console.error("Error updating master ISBN store:", e);
      }

      // Sync tasks state and localStorage so allocated files immediately show in Production
      setTasks(prev => {
        const existingMap = new Map((prev || []).map(t => [t.id, t]));
        allAllocations.forEach(a => existingMap.set(a.id, a));
        const mergedTasks = [...existingMap.values()];
        try {
          const currentData = JSON.parse(localStorage.getItem("fileflow") || "{}");
          currentData.tasks = mergedTasks;
          localStorage.setItem("fileflow", JSON.stringify(currentData));
        } catch (e) {}
        return mergedTasks;
      });

      // Sync files state and localStorage so allocated files update status and owner in Files
      const allocatedMap = new Map(allAllocations.map(a => [a.isbn, a]));
      setFiles(prev => {
        const updated = (prev || []).map(f => {
          const alloc = allocatedMap.get(f.isbn);
          if (alloc) {
            return {
              ...f,
              status: "Allocated",
              owner: alloc.employee,
              postedBy: alloc.postedBy,
              postedTo: alloc.postedTo,
              remark: alloc.remark
            };
          }
          return f;
        });
        try {
          const currentData = JSON.parse(localStorage.getItem("fileflow") || "{}");
          currentData.files = updated;
          localStorage.setItem("fileflow", JSON.stringify(currentData));
          localStorage.setItem("fileflow_uploaded_files", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      // Save to batch history
      const newHistoryBatch = {
        id: batchId,
        createdAt: Date.now(),
        date: new Date().toLocaleString(),
        fileName: [...new Set(allAllocations.map(item => item.sourceName))].join(", "),
        sourceType: new Set(allAllocations.map(item => item.sourceType)).size > 1 ? "Mixed" : allAllocations[0]?.sourceType,
        isbns: [...selectedIsbns],
        totalFiles: selectedIsbns.length,
        assignments: allAllocations.length,
        mode,
        teamsCount: activeTeams.length,
        employeesCount: employeeAllocations.length,
        priority,
        dueDate
      };
      const updatedHistory = [newHistoryBatch, ...allocationHistory];
      setAllocationHistory(updatedHistory);
      localStorage.setItem("fileflow_allocation_history", JSON.stringify(updatedHistory));

      // Trigger custom storage event for live sync
      window.dispatchEvent(new Event("storage"));

      // Clear Source ISBN Files area immediately after allocation
      setIsbns([]);
      setSelectedIsbns([]);
      setFileName("");
      setIsbnSources({});
      setUploadDate("");
      setDuplicatesCount(0);
      setInvalidCount(0);
      setIsbnSearch("");
      setTeamCounts({});
      setEmployeeCounts({});
      setRoleCounts({});
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setShowReviewModal(false);
      note?.(`Success! ${allAllocations.length} ISBN files allocated. Source batch cleared.`);
    } catch (err) {
      note?.(`Allocation failed: ${err.message}`);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Export Preview CSV
  const handleExportPreview = () => {
    const headers = [
      "TEAM",
      "EMPLOYEE ID",
      "EMPLOYEE NAME",
      "ROLE",
      "EXISTING WORKLOAD",
      "NEW FILES ALLOCATED",
      "TOTAL WORKLOAD AFTER",
      "STATUS"
    ];

    const rows = employeeAllocations.map(e => [
      e.team,
      e.code || e.id,
      e.name,
      e.role,
      `${e.existingWorkload}%`,
      e.count,
      `${e.totalAfter}%`,
      "Ready"
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Allocation_Distribution_Preview_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    note?.("Distribution preview exported to CSV.");
  };

  // Filtered ISBN list for search box
  const filteredIsbns = useMemo(() => {
    if (!isbnSearch.trim()) return isbns;
    return isbns.filter(isbn => isbn.toLowerCase().includes(isbnSearch.trim().toLowerCase()));
  }, [isbns, isbnSearch]);

  // Average per employee
  const avgPerEmployee = activeEmployees.length ? Math.round(totalSelectedIsbns / activeEmployees.length) : 0;
  const filesPerTeam = activeTeams.length ? Math.round(totalSelectedIsbns / activeTeams.length) : 0;

  const totalMatrixPages = Math.max(1, Math.ceil(filteredMatrix.length / matrixPageSize));
  const paginatedMatrix = useMemo(() => {
    const start = (matrixPage - 1) * matrixPageSize;
    return filteredMatrix.slice(start, start + matrixPageSize);
  }, [filteredMatrix, matrixPage, matrixPageSize]);

  const handleExportMatrix = () => {
    if (!filteredMatrix.length) {
      note?.("No matrix records to export.");
      return;
    }
    const headers = [
      "Master ISBN",
      "File ID",
      "Book Developer ID",
      "Book Developer Name",
      "Book Status",
      "Cover Developer ID",
      "Cover Developer Name",
      "Cover Status",
      "QC Ready",
      "QC Inspector",
      "QC Status",
      "QC Remarks",
      "QAG Ready",
      "QAG Auditor",
      "QAG Status",
      "Pipeline Stage"
    ];
    const rows = filteredMatrix.map((r) => [
      r.isbn,
      r.fileId || "",
      r.bookDevId || "",
      r.bookDev || "",
      r.bookStatus || "",
      r.coverDevId || "",
      r.coverDev || "",
      r.coverStatus || "",
      r.qcReady ? "Yes" : "No",
      r.qcName || "",
      r.qcStatus || "",
      r.qcRemarks || "",
      r.qagReady ? "Yes" : "No",
      r.qagName || "",
      r.qagStatus || "",
      r.pipelineStage || ""
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Master_ISBN_Workflow_Matrix_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    note?.("Master ISBN Workflow Matrix exported to CSV.");
  };

  return (
    <div className="bulk-allocation-container">
      {/* 1. Header & Actions */}
      <div className="bulk-header-bar">
        <div>
          <small>Publishing Operations / File Allocation</small>
          <h1>File Allocation</h1>
          <p>Distribute ISBN files across employees, teams or production roles.</p>
        </div>
        <div className="bulk-header-actions">
          <button className="bulk-btn-history" onClick={() => setShowHistoryModal(true)}>
            <History size={15} />
            <span>Allocation History</span>
          </button>
          <button className="bulk-btn-new" onClick={() => document.getElementById("isbn-file-input")?.click()}>
            <Plus size={16} />
            <span>New Allocation</span>
          </button>
        </div>
      </div>

      {/* Top Nav Tabs: Bulk Allocate Studio vs Dual Allocation Matrix */}
      <div className="bulk-top-nav-tabs">
        <button
          type="button"
          className={`bulk-nav-tab-btn ${allocationTab === "studio" ? "active" : ""}`}
          onClick={() => setAllocationTab("studio")}
        >
          <FileSpreadsheet size={16} />
          <span>Bulk Allocate Studio</span>
        </button>
        <button
          type="button"
          className={`bulk-nav-tab-btn ${allocationTab === "matrix" ? "active" : ""}`}
          onClick={() => setAllocationTab("matrix")}
        >
          <Layers size={16} />
          <span>Dual Allocation Matrix (Book + Cover)</span>
          <span className="bulk-nav-tab-badge">{dualMatrixData.length}</span>
        </button>
      </div>

      {allocationTab === "studio" && (
        <>
      {/* 2. Top 4 KPI Cards */}
      <div className="bulk-kpi-grid">
        <div className="bulk-kpi-card">
          <div className="bulk-kpi-icon green">
            <FileSpreadsheet size={22} />
          </div>
          <div className="bulk-kpi-content">
            <span>Total ISBN Files</span>
            <b>{isbns.length}</b>
          </div>
        </div>

        <div className="bulk-kpi-card">
          <div className="bulk-kpi-icon orange">
            <FileText size={22} />
          </div>
          <div className="bulk-kpi-content">
            <span>Unallocated</span>
            <b>{Math.max(0, isbns.length - totalAllocatedFiles)}</b>
          </div>
        </div>

        <div className="bulk-kpi-card">
          <div className="bulk-kpi-icon blue">
            <User size={22} />
          </div>
          <div className="bulk-kpi-content">
            <span>Selected Employees</span>
            <b>{activeEmployees.length}</b>
          </div>
        </div>

        <div className="bulk-kpi-card">
          <div className="bulk-kpi-icon purple">
            <Users size={22} />
          </div>
          <div className="bulk-kpi-content">
            <span>Selected Teams</span>
            <b>{activeTeams.length}</b>
          </div>
        </div>
      </div>

      {/* 3. 4-Step Progress Bar */}
      <div className="bulk-steps-bar">
        <div className="bulk-step-item done">
          <div className="bulk-step-circle">1</div>
          <div className="bulk-step-text">
            <strong>Upload ISBN List</strong>
            <small>Upload and validate files</small>
          </div>
        </div>

        <div className="bulk-step-item done">
          <div className="bulk-step-circle">2</div>
          <div className="bulk-step-text">
            <strong>Choose Allocation Mode</strong>
            <small>Select how to distribute</small>
          </div>
        </div>

        <div className="bulk-step-item active">
          <div className="bulk-step-circle">3</div>
          <div className="bulk-step-text">
            <strong>Configure Distribution</strong>
            <small>Set rules and assignments</small>
          </div>
        </div>

        <div className="bulk-step-item">
          <div className="bulk-step-circle">4</div>
          <div className="bulk-step-text">
            <strong>Review & Allocate</strong>
            <small>Confirm and allocate files</small>
          </div>
        </div>
      </div>

      {/* 4. Main 3-Column Configuration Grid */}
      <div className="bulk-main-layout">
        {/* ================= COLUMN 1: SOURCE ISBN FILES ================= */}
        <div className="bulk-column-card">
          <h3>Source ISBN Files</h3>

          {/* Upload Drop Zone */}
          <label className="bulk-upload-dropzone">
            <Upload size={22} />
            <b>Upload Excel / CSV / TXT</b>
            <span>Drag and drop file here or click to browse</span>
            <input
              ref={fileInputRef}
              id="isbn-file-input"
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              onChange={handleFileUpload}
            />
          </label>

          <div className="bulk-manual-isbn-entry">
            <div className="bulk-manual-isbn-heading">
              <b>Or enter ISBNs manually</b>
              <span>13 digits only</span>
            </div>
            <textarea
              value={manualIsbns}
              onChange={e => setManualIsbns(e.target.value)}
              placeholder="Paste one or more ISBNs, one per line\nExample: 9783906763279"
              rows={3}
              inputMode="numeric"
            />
            <button type="button" className="bulk-manual-isbn-button" onClick={handleManualIsbnAdd}>
              <Plus size={14} /> Add ISBNs
            </button>
            <small>Only exactly 13 numeric digits are accepted. 10-digit ISBNs will be rejected.</small>
          </div>

          {fileName && (
            <>
              <h4>Selected Batch</h4>
              <div className="bulk-batch-box">
                <FileSpreadsheet size={24} className="file-icon" />
                <div className="bulk-batch-info">
                  <b>{fileName}</b>
                  <small>Uploaded on {uploadDate}</small>
                </div>
                <CheckCircle2 size={18} className="bulk-batch-check" />
              </div>
            </>
          )}

          <h4>Validation Result</h4>
          <div className="bulk-validation-grid">
            <div className="bulk-val-pill valid">
              <b>{isbns.length}</b>
              <span>Valid ISBNs</span>
            </div>
            <div className="bulk-val-pill dups">
              <b>{duplicatesCount}</b>
              <span>Duplicates</span>
            </div>
            <div className="bulk-val-pill invalid">
              <b>{invalidCount}</b>
              <span>Invalid</span>
            </div>
          </div>

          <div className="bulk-isbn-search">
            <Search size={14} />
            <input
              value={isbnSearch}
              onChange={(e) => setIsbnSearch(e.target.value)}
              placeholder="Search ISBN..."
              disabled={!isbns.length}
            />
          </div>

          <label className="bulk-select-all-row" style={!isbns.length ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
            <input
              type="checkbox"
              checked={selectedIsbns.length === isbns.length && isbns.length > 0}
              onChange={toggleSelectAllIsbns}
              disabled={!isbns.length}
            />
            <span>Select All ({selectedIsbns.length})</span>
          </label>

          <div className="bulk-isbn-scroll-list">
            {filteredIsbns.map((isbn) => (
              <label key={isbn} className="bulk-isbn-item">
                <input
                  type="checkbox"
                  checked={selectedIsbns.includes(isbn)}
                  onChange={() => toggleSingleIsbn(isbn)}
                />
                <span>{isbn}</span>
              </label>
            ))}
            {!filteredIsbns.length && (
              <div style={{ padding: "28px 16px", textAlign: "center", color: "#94a3b8", fontSize: "11.5px", lineHeight: "1.6" }}>
                {isbns.length === 0 ? (
                  <>
                    <FileSpreadsheet size={26} style={{ display: "block", margin: "0 auto 8px", opacity: 0.4 }} />
                    <strong style={{ color: "#64748b" }}>No ISBN files loaded</strong>
                    <div style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "4px" }}>
                      Upload a file or enter 13-digit ISBNs manually above to allocate files.
                    </div>
                  </>
                ) : (
                  "No ISBN matches found"
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================= COLUMN 2: CHOOSE ALLOCATION MODE & CONFIG ================= */}
        <div className="bulk-column-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0 }}>Role & Category Allocation</h3>
            <span className="bulk-mode-badge" style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700 }}>
              {selectedCategory}
            </span>
          </div>

          <div className="bulk-category-pills">
            <button
              type="button"
              className={`bulk-category-pill ${selectedCategory === "Developer" ? "active" : ""}`}
              onClick={() => { setSelectedCategory("Developer"); setMode("Category Allocation"); }}
            >
              <BookOpen size={15} />
              <div className="bulk-cat-text">
                <b>Developer</b>
                <small>{bookDevelopers.length} Devs</small>
              </div>
            </button>
            <button
              type="button"
              className={`bulk-category-pill ${selectedCategory === "Graphics" ? "active" : ""}`}
              onClick={() => { setSelectedCategory("Graphics"); setMode("Category Allocation"); }}
            >
              <Layers size={15} />
              <div className="bulk-cat-text">
                <b>Graphics</b>
                <small>{coverDevelopers.length} Devs</small>
              </div>
            </button>
            <button
              type="button"
              className={`bulk-category-pill ${selectedCategory === "QC" ? "active" : ""}`}
              onClick={() => { setSelectedCategory("QC"); setMode("Category Allocation"); }}
            >
              <CheckCircle2 size={15} />
              <div className="bulk-cat-text">
                <b>QC</b>
                <small className="bulk-gate-tag">{qcReadyIsbns.length} Ready</small>
              </div>
            </button>
            <button
              type="button"
              className={`bulk-category-pill ${selectedCategory === "QAG" ? "active" : ""}`}
              onClick={() => { setSelectedCategory("QAG"); setMode("Category Allocation"); }}
            >
              <Scale size={15} />
              <div className="bulk-cat-text">
                <b>QAG</b>
                <small className="bulk-gate-tag">{qagReadyIsbns.length} Ready</small>
              </div>
            </button>
            <button
              type="button"
              className={`bulk-category-pill ${selectedCategory === "Dual" ? "active" : ""}`}
              onClick={() => { setSelectedCategory("Dual"); setMode("Dual Allocation (Book + Cover)"); }}
            >
              <ArrowUpDown size={15} />
              <div className="bulk-cat-text">
                <b>Dual Team</b>
                <small>16 Dev + 6 Gfx</small>
              </div>
            </button>
          </div>

          {/* QC Gate Callout Banner */}
          {selectedCategory === "QC" && (
            <div className="bulk-gate-banner qc">
              <div className="bulk-gate-info">
                <CheckCircle2 size={18} color="#059669" />
                <div>
                  <strong>QC Ready Gate Enforced</strong>
                  <p>QC files must be completed by both Developer and Graphics before allocation. Currently <b>{qcReadyIsbns.length}</b> files are QC Ready.</p>
                </div>
              </div>
              {qcReadyIsbns.length > 0 && (
                <button
                  type="button"
                  className="bulk-btn-auto-filter"
                  onClick={() => {
                    setSelectedIsbns(qcReadyIsbns);
                    note?.(`Selected ${qcReadyIsbns.length} QC-ready files.`);
                  }}
                >
                  Select QC-Ready Files ({qcReadyIsbns.length})
                </button>
              )}
            </div>
          )}

          {/* QAG Gate Callout Banner */}
          {selectedCategory === "QAG" && (
            <div className="bulk-gate-banner qag">
              <div className="bulk-gate-info">
                <Scale size={18} color="#7c3aed" />
                <div>
                  <strong>QAG Ready Gate Enforced</strong>
                  <p>QAG audits can only be allocated after QC status is Completed. Currently <b>{qagReadyIsbns.length}</b> files are QAG Ready.</p>
                </div>
              </div>
              {qagReadyIsbns.length > 0 && (
                <button
                  type="button"
                  className="bulk-btn-auto-filter"
                  onClick={() => {
                    setSelectedIsbns(qagReadyIsbns);
                    note?.(`Selected ${qagReadyIsbns.length} QAG-ready files.`);
                  }}
                >
                  Select QAG-Ready Files ({qagReadyIsbns.length})
                </button>
              )}
            </div>
          )}

          {/* Category Roster Preview Box */}
          {["Developer", "Graphics", "QC", "QAG"].includes(selectedCategory) && (
            <div className="bulk-category-roster-box">
              <div className="bulk-roster-head">
                <span><b>{selectedCategory} Equal Allocation</b> ({employeeAllocations.length} Active Employees)</span>
                <small>
                  {totalSelectedIsbns > 0 ? (
                    <>Base: {Math.floor(totalSelectedIsbns / employeeAllocations.length)} {totalSelectedIsbns % employeeAllocations.length > 0 ? `+ 1 remainder (${totalSelectedIsbns % employeeAllocations.length} employees)` : ""} (Total: {totalSelectedIsbns} files)</>
                  ) : "Select ISBN files on left to allocate"}
                </small>
              </div>
              <div className="bulk-roster-grid">
                {employeeAllocations.map((emp, idx) => (
                  <div key={emp.id} className="bulk-roster-item">
                    <span className="bulk-roster-num">{idx + 1}.</span>
                    <div className="bulk-roster-body">
                      <b>{emp.name}</b>
                      <small>{emp.code || emp.id}</small>
                    </div>
                    <span className="bulk-roster-count">{emp.count} files</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ margin: "14px 0 6px", borderTop: "1px dashed #e2e8f0", paddingTop: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Or Switch to Advanced Production Modes
            </span>
          </div>

          <div className="bulk-modes-grid">
            {/* Mode 1: Individual */}
            <button
              type="button"
              className={`bulk-mode-btn ${mode === "Individual Allocation" ? "active" : ""}`}
              onClick={() => { setMode("Individual Allocation"); setSelectedCategory("Custom"); }}
            >
              <div className="bulk-mode-top">
                <User size={16} />
                <b>Individual Allocation</b>
              </div>
              <span className="bulk-mode-desc">Assign files directly to selected employees</span>
              <span className="bulk-mode-badge">{activeEmployees.length} employees × {avgPerEmployee} files</span>
            </button>

            {/* Mode 2: Team */}
            <button
              type="button"
              className={`bulk-mode-btn ${mode === "Team Allocation" ? "active" : ""}`}
              onClick={() => { setMode("Team Allocation"); setSelectedCategory("Custom"); }}
            >
              <div className="bulk-mode-top">
                <Users size={16} />
                <b>Team Allocation</b>
              </div>
              <span className="bulk-mode-desc">Split files equally across production teams</span>
              <span className="bulk-mode-badge">{activeTeams.length} teams × {filesPerTeam} files</span>
            </button>

            {/* Mode 3: Role-based */}
            <button
              type="button"
              className={`bulk-mode-btn ${mode === "Role-based Allocation" ? "active" : ""}`}
              onClick={() => { setMode("Role-based Allocation"); setSelectedCategory("Custom"); }}
            >
              <div className="bulk-mode-top">
                <Layers size={16} />
                <b>Role-based Allocation</b>
              </div>
              <span className="bulk-mode-desc">Route files by workflow role and capacity</span>
              <span className="bulk-mode-badge">DEVELOPER, QC, GRAPHICS, QAG, FMS, TPS</span>
            </button>

            {/* Mode 4: Dual Allocation (Book + Cover) */}
            <button
              type="button"
              className={`bulk-mode-btn ${mode === "Dual Allocation (Book + Cover)" ? "active" : ""}`}
              onClick={() => { setMode("Dual Allocation (Book + Cover)"); setSelectedCategory("Dual"); }}
            >
              <div className="bulk-mode-top">
                <Layers size={16} />
                <b>Dual Allocation (Book + Cover)</b>
              </div>
              <span className="bulk-mode-desc">Assign same ISBNs to 16 Book Devs + 6 Cover Devs in parallel</span>
              <span className="bulk-mode-badge">16 Book Devs + 6 Cover Devs (Dual Pipeline)</span>
            </button>
          </div>

          <h4>Distribution Method</h4>
          <div className="bulk-dist-methods-row">
            <div className="bulk-segmented-bar">
              {["Equal Split", "Custom Count", "Workload Balanced"].map((dist) => (
                <button
                  key={dist}
                  type="button"
                  className={distribution === dist ? "active" : ""}
                  onClick={() => setDistribution(dist)}
                >
                  {dist}
                </button>
              ))}
            </div>
            <button className="bulk-info-icon-btn" title="Workload balanced automatically optimizes distribution based on employee capacity">
              <Info size={15} />
            </button>
          </div>

          {distribution === "Custom Count" && <p>Edit one count; the remaining files are split equally among the others in that group. The latest edit sets the fixed count.</p>}
          {distribution === "Custom Count" && (mode === "Category Allocation" || mode === "Dual Allocation (Book + Cover)") && (
            <div className="bulk-selection-shell" style={{ maxHeight: "260px", overflowY: "auto" }}>
              <table className="bulk-selection-table">
                <thead><tr><th>EMPLOYEE</th><th>ROLE</th><th>ALLOCATE (FILES)</th></tr></thead>
                <tbody>{employeeAllocations.map(emp => (
                  <tr key={emp.id}><td>{emp.name}</td><td>{emp.workflowRole || emp.role}</td><td>
                    <input type="number" min="0" max={totalSelectedIsbns} step="1" className="bulk-count-input" aria-label={`Files for ${emp.name}`} value={emp.count}
                      onChange={event => setEmployeeCounts(prev => editManualCount(prev, emp.id, event.target.value, employeeAllocations.filter(member => member.teamId === emp.teamId), totalSelectedIsbns))} />
                  </td></tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* Dynamic Table: Team Selection or Employee Selection */}
          {mode === "Team Allocation" && (
            <>
              <h4>Team Selection ({activeTeams.length} teams selected)</h4>
              <div className="bulk-selection-shell">
                <table className="bulk-selection-table">
                  <thead>
                    <tr>
                      <th style={{ width: "32px" }}>
                        <input
                          type="checkbox"
                          checked={selectedTeams.length === teamsData.length}
                          onChange={(e) => setSelectedTeams(e.target.checked ? teamsData.map(t => t.id) : [])}
                        />
                      </th>
                      <th>TEAM</th>
                      <th>TEAM LEAD</th>
                      <th>MEMBERS</th>
                      <th>CURRENT WORKLOAD</th>
                      <th style={{ width: "110px" }}>ALLOCATE (FILES)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamsData.map((team) => {
                      const isChecked = selectedTeams.includes(team.id);
                      const countVal = calculatedTeamCounts[team.id] ?? 0;
                      return (
                        <tr key={team.id} className={isChecked ? "selected" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTeam(team.id)}
                            />
                          </td>
                          <td><b>{team.name}</b></td>
                          <td>{team.lead}</td>
                          <td>{team.members.length}</td>
                          <td>
                            <div className="bulk-workload-bar-wrap">
                              <div className="bulk-workload-bar">
                                <div
                                  className="bulk-workload-bar-fill"
                                  style={{ width: `${team.workload}%` }}
                                />
                              </div>
                              <span>{team.workload}%</span>
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="bulk-count-input"
                              disabled={!isChecked || distribution !== "Custom Count"}
                              value={countVal}
                              onChange={(e) => setTeamCounts(prev => editManualCount(prev, team.id, e.target.value, activeTeams, totalSelectedIsbns))}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {mode === "Individual Allocation" && (
            <>
              <h4>Employee Selection ({activeEmployees.length} employees selected)</h4>
              <div className="bulk-selection-shell" style={{ maxHeight: "210px", overflowY: "auto" }}>
                <table className="bulk-selection-table">
                  <thead>
                    <tr>
                      <th style={{ width: "32px" }}>
                        <input
                          type="checkbox"
                          checked={selectedEmployees.length === allEmployees.length}
                          onChange={(e) => setSelectedEmployees(e.target.checked ? allEmployees.map(x => x.id) : [])}
                        />
                      </th>
                      <th>EMPLOYEE</th>
                      <th>TEAM</th>
                      <th>ROLE</th>
                      <th>CURRENT WORKLOAD</th>
                      <th style={{ width: "90px" }}>ALLOCATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allEmployees.map((emp) => {
                      const isChecked = selectedEmployees.includes(emp.id);
                      const currentAlloc = employeeAllocations.find(x => x.id === emp.id)?.count ?? 0;
                      return (
                        <tr key={emp.id} className={isChecked ? "selected" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleEmployee(emp.id)}
                            />
                          </td>
                          <td>
                            <b>{emp.name}</b>
                            <small style={{ display: "block", color: "#64748b" }}>{emp.code || emp.id}</small>
                          </td>
                          <td>{emp.team}</td>
                          <td>{emp.role}</td>
                          <td>
                            <div className="bulk-workload-bar-wrap">
                              <div className="bulk-workload-bar">
                                <div
                                  className="bulk-workload-bar-fill"
                                  style={{ width: `${emp.workload}%` }}
                                />
                              </div>
                              <span>{emp.workload}%</span>
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="bulk-count-input"
                              disabled={!isChecked || distribution !== "Custom Count"}
                              value={currentAlloc}
                              onChange={(e) => setEmployeeCounts(prev => editManualCount(prev, emp.id, e.target.value, activeEmployees, totalSelectedIsbns))}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {mode === "Role-based Allocation" && (
            <>
              <h4>Role Selection ({selectedRoles.length} roles selected)</h4>
              <div className="bulk-selection-shell">
                <table className="bulk-selection-table">
                  <thead>
                    <tr>
                      <th>ROLE</th>
                      <th>ACTIVE MEMBERS</th>
                      <th>AVERAGE WORKLOAD</th>
                      <th style={{ width: "110px" }}>ALLOCATE (FILES)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...new Set(allEmployees.map(employee => employee.role))].map((roleName) => {
                      const roleEmps = allEmployees.filter(e => e.role === roleName);
                      const avgWk = roleEmps.length ? Math.round(roleEmps.reduce((s, e) => s + e.workload, 0) / roleEmps.length) : 0;
                      const roleTotal = employeeAllocations.filter(emp => emp.role === roleName).reduce((sum, emp) => sum + emp.count, 0);
                      return (
                        <tr key={roleName}>
                          <td><b>{roleName}</b></td>
                          <td>{roleEmps.length} members</td>
                          <td>
                            <div className="bulk-workload-bar-wrap">
                              <div className="bulk-workload-bar">
                                <div className="bulk-workload-bar-fill" style={{ width: `${avgWk}%` }} />
                              </div>
                              <span>{avgWk}%</span>
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="bulk-count-input"
                              min="0" max={totalSelectedIsbns} step="1"
                              disabled={distribution !== "Custom Count" || !selectedRoles.includes(roleName)}
                              onChange={event => setRoleCounts(prev => editManualCount(prev, roleName, event.target.value, selectedRoles.map(id => ({ id })), totalSelectedIsbns))}
                              value={roleTotal}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {mode === "Dual Allocation (Book + Cover)" && (
            <>
              <div className="bulk-dual-summary-banner">
                <Layers size={18} color="#0284c7" />
                <div>
                  <strong>Dual Team Parallel Assignment</strong>
                  <p>Every uploaded ISBN is split into Book Interior Work and Cover Artwork and assigned independently.</p>
                </div>
              </div>
              <div className="bulk-dual-teams-grid">
                <div className="bulk-dual-team-card">
                  <div className="bulk-dual-team-head">
                    <BookOpen size={16} color="#0284c7" />
                    <span>Book Interior Developers ({bookDevelopers.length})</span>
                  </div>
                  <div className="bulk-dual-team-scroll">
                    {bookDevelopers.map((dev, idx) => {
                      const count = employeeAllocations.find(x => x.id === dev.id)?.count || 0;
                      return (
                        <div key={dev.id} className="bulk-dual-emp-row">
                          <span className="bulk-emp-num">{idx + 1}.</span>
                          <span className="bulk-emp-name">{dev.name}</span>
                          <span className="bulk-emp-count">{count} files</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bulk-dual-team-card">
                  <div className="bulk-dual-team-head">
                    <Layers size={16} color="#7c3aed" />
                    <span>Cover Artwork Developers ({coverDevelopers.length})</span>
                  </div>
                  <div className="bulk-dual-team-scroll">
                    {coverDevelopers.map((dev, idx) => {
                      const count = employeeAllocations.find(x => x.id === dev.id)?.count || 0;
                      return (
                        <div key={dev.id} className="bulk-dual-emp-row">
                          <span className="bulk-emp-num">{idx + 1}.</span>
                          <span className="bulk-emp-name">{dev.name}</span>
                          <span className="bulk-emp-count">{count} files</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Validation Count Bar */}
          <div className="bulk-total-allocate-bar">
            <span>Total Files to Allocate</span>
            <strong className={isCountMatched ? "match" : "mismatch"}>
              {totalAllocatedFiles} / {mode === "Dual Allocation (Book + Cover)" ? `${totalSelectedIsbns * 2} (${totalSelectedIsbns} × 2 teams)` : totalSelectedIsbns}
            </strong>
          </div>

          {/* Bottom 4 Form Fields */}
          <div className="bulk-form-inputs-grid">
            <div className="bulk-form-field">
              <label>Allocation Date</label>
              <input
                type="date"
                value={allocationDate}
                onChange={(e) => setAllocationDate(e.target.value)}
              />
            </div>

            <div className="bulk-form-field">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="bulk-form-field">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="bulk-form-field">
              <label>
                Workflow Stage
                <Info size={11} color="#94a3b8" />
              </label>
              <select value={workflowStage} onChange={(e) => setWorkflowStage(e.target.value)}>
                <option value="Based on Employee Role">Based on Employee Role</option>
                <option value="Artwork Correction 1">Artwork Correction 1</option>
                <option value="Art QC">Art QC</option>
                <option value="Text QC">Text QC</option>
                <option value="Typesetting">Typesetting</option>
                <option value="EPUB Creation">EPUB Creation</option>
              </select>
            </div>
          </div>
        </div>

        {/* ================= COLUMN 3: ALLOCATION SUMMARY ================= */}
        <div className="bulk-column-card">
          <h3>Allocation Summary</h3>

          {/* Donut Progress Gauge */}
          <div className="bulk-donut-container">
            <div className="bulk-donut-circle">
              <b>{totalSelectedIsbns}</b>
              <span>Files Ready</span>
            </div>
          </div>

          {/* Summary Metadata List */}
          <ul className="bulk-summary-list">
            <li>
              <div className="label-wrap">
                <Sliders size={13} />
                <span>Mode</span>
              </div>
              <b>{mode}</b>
            </li>
            <li>
              <div className="label-wrap">
                <Users size={13} />
                <span>Teams</span>
              </div>
              <b>{activeTeams.length}</b>
            </li>
            <li>
              <div className="label-wrap">
                <User size={13} />
                <span>Employees</span>
              </div>
              <b>{activeEmployees.length}</b>
            </li>
            <li>
              <div className="label-wrap">
                <FileSpreadsheet size={13} />
                <span>Files per Team</span>
              </div>
              <b>{filesPerTeam}</b>
            </li>
            <li>
              <div className="label-wrap">
                <Clock size={13} />
                <span>Average per Employee</span>
              </div>
              <b>{avgPerEmployee}</b>
            </li>
            <li>
              <div className="label-wrap">
                <Scale size={13} />
                <span>Workload Balance</span>
              </div>
              <b className="balance-tag">Balanced</b>
            </li>
          </ul>

          {/* Info Callout */}
          <div className="bulk-notice-callout">
            <Info size={16} />
            <span>Files will be distributed inside each team based on employee role and current workload.</span>
          </div>

          {/* Notify Checkbox */}
          <label className="bulk-notify-checkbox">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
            />
            <span>Notify employees after allocation</span>
          </label>

          {/* Action Buttons */}
          <div className="bulk-summary-actions">
            <button
              type="button"
              className="bulk-btn-draft"
              disabled={selectedIsbns.length === 0}
              style={selectedIsbns.length === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
              onClick={handleSaveDraft}
            >
              Save as Draft
            </button>
            <button
              type="button"
              className="bulk-btn-review"
              disabled={selectedIsbns.length === 0}
              style={selectedIsbns.length === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
              onClick={() => {
                if (selectedIsbns.length === 0) {
                  note?.("Please upload or select at least one ISBN file first.");
                  return;
                }
                setShowReviewModal(true);
              }}
            >
              Review Allocation
            </button>
          </div>
        </div>
      </div>

      {/* ================= 5. BOTTOM SECTION: DISTRIBUTION PREVIEW ================= */}
      <div className="bulk-preview-card">
        <div className="bulk-preview-head-bar">
          <h3>Distribution Preview</h3>
          <div className="bulk-preview-controls">
            <label className="bulk-group-toggle">
              <span>Group by Team</span>
              <div className="bulk-switch">
                <input
                  type="checkbox"
                  checked={groupByTeam}
                  onChange={(e) => setGroupByTeam(e.target.checked)}
                />
                <span className="bulk-slider"></span>
              </div>
            </label>
            <button type="button" className="bulk-btn-export" onClick={handleExportPreview}>
              <Download size={14} />
              <span>Export Preview</span>
            </button>
          </div>
        </div>

        <div className="bulk-preview-table-wrap">
          <table className="bulk-preview-table">
            <thead>
              <tr>
                <th>TEAM</th>
                <th>EMPLOYEE</th>
                <th>ROLE</th>
                <th>EXISTING WORKLOAD</th>
                <th>NEW FILES</th>
                <th>TOTAL AFTER ALLOCATION</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {employeeAllocations.slice((previewPage - 1) * previewPageSize, previewPage * previewPageSize).map((emp) => (
                <tr key={emp.id}>
                  <td><b>{emp.team}</b></td>
                  <td>
                    <b>{emp.name}</b>
                    <small style={{ display: "block", color: "#64748b" }}>{emp.code || emp.id.toUpperCase()}</small>
                  </td>
                  <td>
                    <span className="bulk-role-badge">{emp.role}</span>
                  </td>
                  <td>
                    <div className="bulk-workload-bar-wrap">
                      <div className="bulk-workload-bar">
                        <div
                          className="bulk-workload-bar-fill"
                          style={{ width: `${emp.existingWorkload}%` }}
                        />
                      </div>
                      <span>{emp.existingWorkload}%</span>
                    </div>
                  </td>
                  <td><b>{emp.count}</b></td>
                  <td><b>{emp.totalAfter}%</b></td>
                  <td>
                    <span className="bulk-ready-badge">
                      <Check size={12} />
                      Ready
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {employeeAllocations.length > 0 && (
          <Pagination
            currentPage={previewPage}
            totalItems={employeeAllocations.length}
            pageSize={previewPageSize}
            onPageChange={setPreviewPage}
            onPageSizeChange={setPreviewPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            itemName="employees"
          />
        )}
      </div>
        </>
      )}

      {/* ================= CONSOLIDATED DUAL ALLOCATION MATRIX VIEW ================= */}
      {allocationTab === "matrix" && (
        <div className="bulk-matrix-container">
          {/* Matrix KPI Cards */}
          <div className="bulk-kpi-grid" style={{ marginBottom: "18px" }}>
            <div className="bulk-kpi-card">
              <div className="bulk-kpi-icon green">
                <FileSpreadsheet size={22} />
              </div>
              <div className="bulk-kpi-content">
                <span>Total Master ISBNs</span>
                <b>{matrixStats.total}</b>
              </div>
            </div>

            <div className="bulk-kpi-card">
              <div className="bulk-kpi-icon blue">
                <CheckCircle2 size={22} />
              </div>
              <div className="bulk-kpi-content">
                <span>Ready for QC</span>
                <b>{matrixStats.readyForQc}</b>
              </div>
            </div>

            <div className="bulk-kpi-card">
              <div className="bulk-kpi-icon purple">
                <Activity size={22} />
              </div>
              <div className="bulk-kpi-content">
                <span>In Progress (WIP)</span>
                <b>{matrixStats.inProgress}</b>
              </div>
            </div>

            <div className="bulk-kpi-card">
              <div className="bulk-kpi-icon orange">
                <AlertCircle size={22} />
              </div>
              <div className="bulk-kpi-content">
                <span>Action Needed (Rework/Reject)</span>
                <b>{matrixStats.actionNeeded}</b>
              </div>
            </div>
          </div>

          {/* Matrix Filter Toolbar */}
          <div className="bulk-matrix-toolbar">
            <div className="bulk-matrix-search">
              <Search size={15} />
              <input
                type="text"
                value={matrixSearch}
                onChange={(e) => {
                  setMatrixSearch(e.target.value);
                  setMatrixPage(1);
                }}
                placeholder="Search ISBN or Developer name..."
              />
            </div>

            <div className="bulk-matrix-filter">
              <label>Filter Status:</label>
              <select
                value={matrixStatusFilter}
                onChange={(e) => {
                  setMatrixStatusFilter(e.target.value);
                  setMatrixPage(1);
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Allocated">Allocated</option>
                <option value="WIP">WIP</option>
                <option value="Complete">Complete</option>
                <option value="Rework">Rework</option>
                <option value="Reject">Reject</option>
              </select>
            </div>

            <div className="bulk-matrix-filter">
              <label>QC Readiness:</label>
              <select
                value={matrixQcFilter}
                onChange={(e) => {
                  setMatrixQcFilter(e.target.value);
                  setMatrixPage(1);
                }}
              >
                <option value="All">All Readiness</option>
                <option value="Ready for QC">Ready for QC</option>
                <option value="In Progress">In Progress</option>
                <option value="Action Needed">Action Needed</option>
                <option value="Pending Allocation">Pending Allocation</option>
              </select>
            </div>

            <button
              type="button"
              className="bulk-btn-export"
              onClick={handleExportMatrix}
              title="Export Matrix to CSV"
            >
              <Download size={14} />
              <span>Export Matrix</span>
            </button>
          </div>

          {/* Matrix Table */}
          <div className="bulk-matrix-table-wrap">
            <table className="bulk-matrix-table">
              <thead>
                <tr>
                  <th style={{ width: "4%" }}>#</th>
                  <th style={{ width: "17%" }}>MASTER ISBN & FILE</th>
                  <th style={{ width: "18%" }}>BOOK DEVELOPER</th>
                  <th style={{ width: "18%" }}>COVER DEVELOPER</th>
                  <th style={{ width: "17%" }}>QC GATE & REVIEW</th>
                  <th style={{ width: "16%" }}>QAG AUDIT</th>
                  <th style={{ width: "10%" }}>STAGE</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMatrix.map((row, idx) => {
                  const itemIndex = (matrixPage - 1) * matrixPageSize + idx + 1;
                  const bookStatusLower = (row.bookStatus || "allocated").toLowerCase();
                  const coverStatusLower = (row.coverStatus || "allocated").toLowerCase();

                  return (
                    <tr key={row.isbn}>
                      <td>{itemIndex}</td>
                      <td>
                        <div className="bulk-matrix-isbn-box">
                          <b>{row.isbn}</b>
                          <small>{row.fileId || row.projectName || "Master File"}</small>
                        </div>
                      </td>
                      <td>
                        <div className="bulk-matrix-dev-box">
                          <div className="bulk-dev-avatar book">B</div>
                          <div className="bulk-dev-info">
                            <b>{typeof row.bookDev === "object" ? row.bookDev?.name : row.bookDev}</b>
                            <small>{row.bookDevId} · Interior</small>
                          </div>
                          <span
                            className={`emp-status-pill emp-status-${bookStatusLower}`}
                            style={{
                              display: "inline-block",
                              padding: "2px 7px",
                              borderRadius: "10px",
                              fontSize: "10.5px",
                              fontWeight: 700,
                              marginLeft: "auto"
                            }}
                          >
                            {row.bookStatus}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="bulk-matrix-dev-box">
                          <div className="bulk-dev-avatar cover">C</div>
                          <div className="bulk-dev-info">
                            <b>{typeof row.coverDev === "object" ? row.coverDev?.name : row.coverDev}</b>
                            <small>{row.coverDevId} · Cover Artwork</small>
                          </div>
                          <span
                            className={`emp-status-pill emp-status-${coverStatusLower}`}
                            style={{
                              display: "inline-block",
                              padding: "2px 7px",
                              borderRadius: "10px",
                              fontSize: "10.5px",
                              fontWeight: 700,
                              marginLeft: "auto"
                            }}
                          >
                            {row.coverStatus}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className={`bulk-readiness-pill ${row.qcReady ? "ready" : "pending"}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                              {row.qcReady ? <CheckCircle2 size={10} /> : null}
                              {row.qcReady ? "QC Ready" : "Pending Dev"}
                            </span>
                            {row.qcStatus && (
                              <span className={`emp-status-pill emp-status-${(row.qcStatus || "").toLowerCase()}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                                {row.qcStatus}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "11.5px", color: "#334155" }}>
                            {row.qcName ? <b>{row.qcName}</b> : <span style={{ color: "#94a3b8" }}>Unassigned</span>}
                          </div>
                          {(row.qcRemarks || (row.remarksHistory && row.remarksHistory.length > 0)) && (
                            <button
                              type="button"
                              className="bulk-matrix-sub-btn"
                              onClick={() => setMatrixModalRemarks(row)}
                              title="View QC Remarks"
                            >
                              Remarks
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className={`bulk-readiness-pill ${row.qagReady ? "ready" : "pending"}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                              {row.qagReady ? <CheckCircle2 size={10} /> : null}
                              {row.qagReady ? "QAG Ready" : "Pending QC"}
                            </span>
                            {row.qagStatus && (
                              <span className={`emp-status-pill emp-status-${(row.qagStatus || "").toLowerCase()}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                                {row.qagStatus}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "11.5px", color: "#334155" }}>
                            {row.qagName ? <b>{row.qagName}</b> : <span style={{ color: "#94a3b8" }}>Unassigned</span>}
                          </div>
                          {row.qagReport && (
                            <button
                              type="button"
                              className="bulk-matrix-sub-btn report"
                              onClick={() => setMatrixModalReport(row.qagReport)}
                              title="View QAG Audit Report"
                            >
                              View Report ({row.qagReport.score})
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`bulk-readiness-pill ${
                            row.pipelineStage === "QAG Completed" ? "ready" :
                            row.pipelineStage === "Rework" ? "action" :
                            row.pipelineStage === "QC Ready" ? "ready" : "wip"
                          }`}
                          style={{ fontSize: "10.5px", padding: "3px 7px" }}
                        >
                          {row.pipelineStage}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!paginatedMatrix.length && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      No matrix records found matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredMatrix.length > 0 && (
            <Pagination
              currentPage={matrixPage}
              totalItems={filteredMatrix.length}
              pageSize={matrixPageSize}
              onPageChange={setMatrixPage}
              onPageSizeChange={setMatrixPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              itemName="Master ISBNs"
            />
          )}
        </div>
      )}

      {/* ================= MODAL: ALLOCATION HISTORY ================= */}
      {showHistoryModal && (
        <div className="bulk-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowHistoryModal(false)}>
          <div className="bulk-modal-card" style={{ width: "min(1180px, 96vw)", maxWidth: "96vw" }}>
            <div className="bulk-modal-head">
              <h2>Allocation History</h2>
              <button className="bulk-modal-close" onClick={() => setShowHistoryModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="bulk-modal-body">
              <AllocationHistory history={allocationHistory} />
            </div>
            <div className="bulk-modal-foot">
              <button className="bulk-btn-draft" onClick={() => setShowHistoryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REVIEW & CONFIRM ALLOCATION ================= */}
      {showReviewModal && (
        <div className="bulk-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowReviewModal(false)}>
          <div className="bulk-modal-card">
            <div className="bulk-modal-head">
              <h2>Confirm & Allocate Files</h2>
              <button className="bulk-modal-close" onClick={() => setShowReviewModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="bulk-modal-body">
              <p style={{ color: "#334155", margin: "0 0 14px", lineHeight: "1.5" }}>
                {mode === "Dual Allocation (Book + Cover)" ? (
                  <>
                    You are about to distribute <b>{totalSelectedIsbns} Master ISBNs</b> into <b>{totalAllocatedFiles} assignments</b> across <b>{bookDevelopers.length} Book Developers</b> and <b>{coverDevelopers.length} Cover Developers</b> in parallel.
                  </>
                ) : (
                  <>
                    You are about to distribute <b>{totalAllocatedFiles} ISBN files</b> across <b>{employeeAllocations.length} employees</b> in <b>{activeTeams.length} production teams</b>.
                  </>
                )}
              </p>

              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11.5px" }}>
                  <div><b>Allocation Mode:</b> {mode}</div>
                  <div><b>Distribution:</b> {distribution}</div>
                  <div><b>Allocation Date:</b> {allocationDate}</div>
                  <div><b>Priority:</b> {priority}</div>
                  <div><b>Due Date:</b> {dueDate}</div>
                  <div><b>Workflow Stage:</b> {workflowStage}</div>
                </div>
              </div>

              <div className="bulk-notice-callout">
                <Info size={16} />
                <span>
                  Once submitted, the assigned ISBNs will automatically sync and appear in each employee's <b>Network Copy</b> ISBN list and live workspace.
                </span>
              </div>
            </div>
            <div className="bulk-modal-foot">
              <button
                type="button"
                className="bulk-btn-draft"
                disabled={isSubmitting}
                onClick={() => setShowReviewModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bulk-btn-review"
                disabled={isSubmitting}
                onClick={handleConfirmAllocation}
              >
                {isSubmitting ? "Allocating Files..." : "Confirm & Allocate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW QAG REPORT ================= */}
      {matrixModalReport && (
        <div className="bulk-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setMatrixModalReport(null)}>
          <div className="bulk-modal-card" style={{ maxWidth: "620px", width: "100%" }}>
            <div className="bulk-modal-head">
              <h2>QAG Audit Report · {matrixModalReport.isbn}</h2>
              <button className="bulk-modal-close" onClick={() => setMatrixModalReport(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="bulk-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "14px" }}>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <small style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 700 }}>AUDIT SCORE</small>
                  <b style={{ fontSize: "20px", color: "#16a34a" }}>{matrixModalReport.score}</b>
                </div>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <small style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 700 }}>FIRST TIME RIGHT (FTR)</small>
                  <b style={{ fontSize: "20px", color: matrixModalReport.firstTimeRight === "Yes" ? "#16a34a" : "#dc2626" }}>
                    {matrixModalReport.firstTimeRight}
                  </b>
                </div>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <small style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 700 }}>DEFECT COUNT</small>
                  <b style={{ fontSize: "20px", color: matrixModalReport.defects > 0 ? "#dc2626" : "#0284c7" }}>
                    {matrixModalReport.defects}
                  </b>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "14px", fontSize: "12px", lineHeight: "1.7" }}>
                <div><b>Auditor:</b> {matrixModalReport.auditorName} ({matrixModalReport.auditorId})</div>
                <div><b>Submitted Date:</b> {matrixModalReport.submittedDate}</div>
                {matrixModalReport.developer && <div><b>Book Developer:</b> {matrixModalReport.developer}</div>}
                {matrixModalReport.graphics && <div><b>Cover Developer:</b> {matrixModalReport.graphics}</div>}
                {matrixModalReport.qc && <div><b>QC Inspector:</b> {matrixModalReport.qc}</div>}
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Audit Findings & Notes:
                </label>
                <div style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12.5px", lineHeight: "1.6", color: "#1e293b" }}>
                  {matrixModalReport.findings || "All requirements verified according to publisher specifications."}
                </div>
              </div>
            </div>
            <div className="bulk-modal-foot">
              <button className="bulk-btn-draft" onClick={() => setMatrixModalReport(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW QC REMARKS ================= */}
      {matrixModalRemarks && (
        <div className="bulk-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setMatrixModalRemarks(null)}>
          <div className="bulk-modal-card" style={{ maxWidth: "580px", width: "100%" }}>
            <div className="bulk-modal-head">
              <h2>QC Remarks & History · {matrixModalRemarks.isbn}</h2>
              <button className="bulk-modal-close" onClick={() => setMatrixModalRemarks(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="bulk-modal-body">
              {matrixModalRemarks.remarksHistory && matrixModalRemarks.remarksHistory.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {matrixModalRemarks.remarksHistory.map((rem) => (
                    <div key={rem.id} style={{ background: "#fef3c7", padding: "12px", borderRadius: "8px", border: "1px solid #fde68a" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "11.5px" }}>
                        <b style={{ color: "#92400e" }}>By {rem.qcName} · Sent to: {rem.sendTo}</b>
                        <span style={{ color: "#78350f" }}>{rem.createdAt}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "12.5px", color: "#451a03" }}>{rem.text}</p>
                      {rem.recipients && (
                        <div style={{ marginTop: "6px", fontSize: "11px", color: "#92400e" }}>
                          Recipient: <b>{rem.recipients}</b>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: "#fef3c7", padding: "14px", borderRadius: "8px", border: "1px solid #fde68a" }}>
                  <b style={{ display: "block", color: "#92400e", marginBottom: "4px" }}>QC Remark:</b>
                  <p style={{ margin: 0, color: "#451a03", fontSize: "13px" }}>{matrixModalRemarks.qcRemarks || "No remark text available."}</p>
                </div>
              )}
            </div>
            <div className="bulk-modal-foot">
              <button className="bulk-btn-draft" onClick={() => setMatrixModalRemarks(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
