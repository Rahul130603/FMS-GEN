import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldCheck,
  Clock,
  Clock3,
  Users,
  UserCheck,
  FolderKanban,
  FileText,
  Calendar,
  Truck,
  Award,
  BarChart3,
  HelpCircle,
  MessageSquare,
  DollarSign,
  Activity,
  AlertTriangle,
  RefreshCcw,
  Timer,
  AlertCircle,
  ClipboardList,
  Repeat,
  CheckCircle2,
  TrendingUp,
  Target,
  Layers,
  Coins,
  Receipt,
  Sparkles,
  Download,
  Search,
  ChevronRight,
  Filter,
  RotateCcw,
  FileSpreadsheet
} from "lucide-react";
import Pagination from "./Pagination";
import "./pagination.css";

// The reports integrated from the legacy reporting workspace.  This stays
// inside the FileFlow shell; it is not a second application/sidebar.
export const REPORT_LIST = [
  { id: "my-report", title: "My Report", icon: ClipboardList, category: "Performance" },
  { id: "incoming-project-report", title: "Incoming Project Report", icon: FolderKanban, category: "Incoming" },
  { id: "daily-allotment-status", title: "Daily Allotment Status", icon: ClipboardList, category: "Production" },
  { id: "rework-analysis", title: "Rework Analysis", icon: RefreshCcw, category: "Quality" },
  { id: "due-date-delivery", title: "Due Date Delivery", icon: Calendar, category: "Delivery" },
  { id: "customer-feedback", title: "Customer Feedback", icon: MessageSquare, category: "Client" },
  { id: "error-reports", title: "Error Reports", icon: AlertCircle, category: "Quality" },
  { id: "internal-feedback", title: "Internal Feedback", icon: MessageSquare, category: "Quality" },
  { id: "technical-query-reports", title: "Technical Query Reports", icon: HelpCircle, category: "Support" },
  { id: "delivery-production-count", title: "Delivery Production Count", icon: Layers, category: "Delivery" },
  { id: "production-pipeline", title: "Production Pipeline", icon: Activity, category: "Production" },
];

const EMPLOYEES = [
  "b.Thangaraj",
  "Sundharesan T",
  "Inbakumar R",
  "Jaisrinivas P K",
  "Santhosh Kumar A",
  "Sivakumar G",
  "Vandhana T",
  "Arul Yosuva",
  "Monica R",
  "Saranya V",
  "B.Vignesh",
  "Sheeba S",
  "Jayasurya J"
];

const DEPARTMENTS = [
  "All Departments",
  "Quality Assurance",
  "Composition & DTP",
  "Art & Graphics",
  "Editorial",
  "Prepress",
  "Digital / EPUB",
  "Management"
];

const UNITS = ["All Units", "DTPC", "DTPM", "BOOKS"];

// Helper to generate dynamic mock rows based on real projects & employees
function getReportConfig(reportId, projects, tasks) {
  // Legacy source module used shorter route keys. Keep that business logic,
  // while exposing the clean FileFlow report URLs requested by the product.
  const legacyReportId = {
    "incoming-project-report": "incoming-project",
    "daily-allotment-status": "daily-allotment",
    "rework-analysis": "rework-round-analysis",
    "error-reports": "error-report",
    "technical-query-reports": "technical-query"
  }[reportId] || reportId;
  reportId = legacyReportId;
  if (!projects?.length && !tasks?.length) {
    return { title: REPORT_LIST.find(report => report.id === reportId)?.title || "Report", sub: "No report data available.", kpis: () => [], columns: [], rows: [] };
  }
  const sampleProjects = projects?.length ? projects : [
    { id: "PRJ001", isbn: "9781394415106", name: "Exploring Management 2E", customer: "John Wiley", unit: "DTPC", stage: "Artwork 1", department: "Graphics" },
    { id: "PRJ002", isbn: "9781394472567", name: "Key Concepts in Economics U3", customer: "John Wiley", unit: "DTPM", stage: "Artwork Correction 1", department: "Art" },
    { id: "PRJ003", isbn: "9781119983412", name: "Financial Accounting 12E", customer: "Cengage Learning", unit: "DTPC", stage: "Typesetting", department: "Composition" },
    { id: "PRJ004", isbn: "9780137654218", name: "Introduction to Psychology 8E", customer: "Pearson", unit: "DTPM", stage: "Proofreading", department: "Editorial" },
    { id: "PRJ005", isbn: "9780198876542", name: "Digital Marketing 4E", customer: "Oxford University Press", unit: "DTPC", stage: "EPUB Creation", department: "Digital" },
    { id: "PRJ006", isbn: "9781108845127", name: "Modern Business Analytics 3E", customer: "Cambridge University Press", unit: "DTPM", stage: "Printer File", department: "Prepress" },
    { id: "PRJ007", isbn: "9783031452789", name: "Applied Data Science", customer: "Springer Nature", unit: "DTPC", stage: "XML Extraction", department: "Digital" },
    { id: "PRJ008", isbn: "9780323991148", name: "Clinical Research Methods", customer: "Elsevier", unit: "DTPM", stage: "Art QC", department: "Quality" },
    { id: "PRJ009", isbn: "9781032419876", name: "Sustainable Engineering", customer: "Taylor & Francis", unit: "DTPC", stage: "Content Proof Reading", department: "Editorial" },
    { id: "PRJ010", isbn: "9781394198764", name: "Leadership in Practice", customer: "John Wiley", unit: "DTPM", stage: "Combined PDF", department: "Prepress" },
  ];

  switch (reportId) {
    case "qag-report":
      return {
        title: "QAG Report",
        sub: "Quality Assurance Group audit summaries, first-time pass rates, and defect counts",
        kpis: (rows) => [
          { label: "Audited Batches", value: rows.length, sub: "Total QC checks completed" },
          { label: "Passed Clean", value: rows.filter(r => r.status === "Approved" || r.status === "Pass").length, sub: "Zero critical defects", status: "good" },
          { label: "Audit Pass Rate", value: `${Math.round((rows.filter(r => r.status === "Approved" || r.status === "Pass").length / (rows.length || 1)) * 100)}%`, sub: "SLA target: 95%", status: "good" },
          { label: "Minor Defects Caught", value: rows.reduce((acc, r) => acc + (r.defects || 0), 0), sub: "Caught before delivery", status: "short" },
        ],
        columns: [
          { key: "auditId", label: "Audit ID" },
          { key: "project", label: "Project & ISBN" },
          { key: "chapter", label: "Chapter / Batch" },
          { key: "auditor", label: "QAG Auditor" },
          { key: "developer", label: "Developer" },
          { key: "unit", label: "Unit" },
          { key: "defects", label: "Defects" },
          { key: "score", label: "Score" },
          { key: "status", label: "Status" },
          { key: "auditDate", label: "Audit Date" },
        ],
        rows: sampleProjects.map((p, i) => ({
          id: i + 1,
          auditId: `QAG-89${20 + i}`,
          project: `${p.name} (${p.isbn})`,
          chapter: `Chapter ${String(i + 1).padStart(2, "0")}`,
          auditor: EMPLOYEES[i % 3 === 0 ? 0 : 2],
          developer: EMPLOYEES[(i + 3) % EMPLOYEES.length],
          unit: p.unit || (i % 2 === 0 ? "DTPC" : "DTPM"),
          defects: i % 3 === 0 ? 0 : (i % 2),
          score: i % 3 === 0 ? "100%" : i % 2 === 0 ? "96%" : "91%",
          status: i % 4 === 0 ? "Flagged" : "Approved",
          auditDate: "2026-08-28 14:30",
        }))
      };

    case "schedule-adherence":
      return {
        title: "Schedule Adherence",
        sub: "Comparison of planned delivery timelines vs actual completion across publishing stages",
        kpis: (rows) => [
          { label: "Schedule Adherence", value: "96.4%", sub: "Overall on-time rate", status: "good" },
          { label: "On-Time Batches", value: rows.filter(r => r.adherence === "On Time").length, sub: "Delivered strictly within SLA" },
          { label: "Minor Slippages (<2h)", value: rows.filter(r => r.adherence === "Minor Delay").length, sub: "Mitigated internally" },
          { label: "Critical Variance", value: rows.filter(r => r.adherence === "Delayed").length, sub: "Escalations active", status: "short" },
        ],
        columns: [
          { key: "id", label: "Project ID" },
          { key: "title", label: "Book Title" },
          { key: "customer", label: "Client" },
          { key: "unit", label: "Unit" },
          { key: "planned", label: "Planned Delivery" },
          { key: "actual", label: "Actual Delivery" },
          { key: "variance", label: "Variance" },
          { key: "lead", label: "Responsible Lead" },
          { key: "adherence", label: "Adherence" },
        ],
        rows: sampleProjects.map((p, i) => ({
          id: p.id,
          title: p.name,
          customer: p.customer,
          unit: p.unit || "DTPC",
          planned: "28-08-2026 17:00",
          actual: i % 4 === 0 ? "28-08-2026 18:15" : "28-08-2026 16:45",
          variance: i % 4 === 0 ? "+1h 15m" : "-15m",
          lead: EMPLOYEES[(i + 1) % EMPLOYEES.length],
          adherence: i % 4 === 0 ? "Minor Delay" : "On Time",
        }))
      };

    case "project-participants":
      return {
        title: "Project Participants Report",
        sub: "List of developers, quality inspectors, and project leads assigned to every active project",
        kpis: (rows) => [
          { label: "Active Projects", value: rows.length, sub: "In production queue" },
          { label: "Book Developers", value: "16 Active", sub: "Interior layout & formatting" },
          { label: "Cover Developers", value: "6 Active", sub: "Cover artwork & spine prep" },
          { label: "Quality Auditors", value: "4 Assigned", sub: "QAG and peer review" },
        ],
        columns: [
          { key: "id", label: "Project Ref" },
          { key: "isbn", label: "ISBN" },
          { key: "title", label: "Book Title" },
          { key: "bookDev", label: "Book Developer" },
          { key: "coverDev", label: "Cover Developer" },
          { key: "lead", label: "Project Lead" },
          { key: "unit", label: "Unit" },
          { key: "progress", label: "Progress" },
          { key: "status", label: "Status" },
        ],
        rows: sampleProjects.map((p, i) => ({
          id: p.id,
          isbn: p.isbn,
          title: p.name,
          bookDev: EMPLOYEES[(i * 2) % EMPLOYEES.length],
          coverDev: EMPLOYEES[(i * 3 + 1) % EMPLOYEES.length],
          lead: EMPLOYEES[1],
          unit: p.unit || "DTPC",
          progress: `${40 + (i * 7) % 55}%`,
          status: "In Progress"
        }))
      };

    case "individual-report":
      return {
        title: "Individual Report",
        sub: "Granular individual developer productivity, target versus actual files, and logged hours",
        kpis: (rows) => [
          { label: "Tracked Members", value: rows.length, sub: "Full active shift" },
          { label: "Avg Efficiency", value: "97.8%", sub: "Above 95% target benchmark", status: "good" },
          { label: "Completed Files", value: rows.reduce((acc, r) => acc + (r.completed || 0), 0), sub: "Files finished today" },
          { label: "Avg Hours Logged", value: "7.8 hrs", sub: "Standard 8.0 hr shift" },
        ],
        columns: [
          { key: "empId", label: "Emp ID" },
          { key: "name", label: "Employee Name" },
          { key: "department", label: "Department" },
          { key: "unit", label: "Unit" },
          { key: "target", label: "Target Files" },
          { key: "completed", label: "Completed" },
          { key: "loggedHours", label: "Logged Hrs" },
          { key: "efficiency", label: "Efficiency" },
          { key: "rating", label: "Rating" },
        ],
        rows: EMPLOYEES.map((name, i) => ({
          id: i + 1,
          empId: `GEN00${String(i + 1).padStart(2, "0")}`,
          name: name,
          department: DEPARTMENTS[(i % (DEPARTMENTS.length - 1)) + 1],
          unit: i % 2 === 0 ? "DTPC" : "DTPM",
          target: 25,
          completed: 23 + (i % 4),
          loggedHours: `${(7.4 + (i % 5) * 0.2).toFixed(1)} hrs`,
          efficiency: `${Math.min(100, Math.round(((23 + (i % 4)) / 25) * 100))}%`,
          rating: i % 3 === 0 ? "Outstanding" : "Satisfactory"
        }))
      };

    case "my-report":
      return {
        title: "My Report",
        sub: "Personal daily log summary, allotted chapters, completed milestones, and rework tracking",
        kpis: (rows) => [
          { label: "My Allocation", value: "24 Files", sub: "Assigned today" },
          { label: "Completed", value: "21 Files", sub: "Sent to QC", status: "good" },
          { label: "QC Accepted", value: "19 Files", sub: "Pass on first audit", status: "good" },
          { label: "Pending Today", value: "3 Files", sub: "Currently in progress" },
        ],
        columns: [
          { key: "jobId", label: "Job Ref" },
          { key: "isbn", label: "ISBN" },
          { key: "chapter", label: "Chapter" },
          { key: "process", label: "Process Stage" },
          { key: "timeSpent", label: "Time Spent" },
          { key: "qcStatus", label: "QC Result" },
          { key: "status", label: "Status" },
        ],
        rows: [
          { id: 1, jobId: "JOB-2041", isbn: "9781394415106", chapter: "C01_Introduction", process: "Book Formatting", timeSpent: "01:20:00", qcStatus: "Pass", status: "Completed" },
          { id: 2, jobId: "JOB-2042", isbn: "9781394415106", chapter: "C02_Core Concepts", process: "Book Formatting", timeSpent: "01:45:00", qcStatus: "Pass", status: "Completed" },
          { id: 3, jobId: "JOB-2043", isbn: "9781394472567", chapter: "C03_Economics", process: "Artwork Correction", timeSpent: "00:55:00", qcStatus: "Pass", status: "Completed" },
          { id: 4, jobId: "JOB-2044", isbn: "9781119983412", chapter: "FrontMatter", process: "Typesetting", timeSpent: "00:40:00", qcStatus: "Pending QC", status: "In QC" },
          { id: 5, jobId: "JOB-2045", isbn: "9780137654218", chapter: "Index", process: "Pagination", timeSpent: "00:30:00", qcStatus: "-", status: "Work In Progress" },
        ]
      };

    case "incoming-project":
      return {
        title: "Incoming Project Report",
        sub: "Overview of new incoming publishing titles received from international publishing clients",
        kpis: (rows) => [
          { label: "Received Titles", value: rows.length, sub: "This billing cycle" },
          { label: "Total Page Count", value: "6,420 pgs", sub: "Estimated interior volume" },
          { label: "High Priority", value: "3 Titles", sub: "SLA < 48 hours", status: "short" },
          { label: "Ready for Allocation", value: `${rows.length - 2} Titles`, sub: "Files pre-processed", status: "good" },
        ],
        columns: [
          { key: "inwardId", label: "Inward No" },
          { key: "client", label: "Publisher" },
          { key: "title", label: "Title" },
          { key: "isbn", label: "ISBN" },
          { key: "receivedDate", label: "Received Date" },
          { key: "targetDate", label: "Target SLA" },
          { key: "pages", label: "Pages" },
          { key: "unit", label: "Assigned Unit" },
          { key: "status", label: "Allocation State" },
        ],
        rows: sampleProjects.map((p, i) => ({
          id: p.id,
          inwardId: `INW-${202600 + i}`,
          client: p.customer,
          title: p.name,
          isbn: p.isbn,
          receivedDate: "27-08-2026 09:15",
          targetDate: "05-09-2026 18:00",
          pages: 320 + i * 45,
          unit: p.unit || (i % 2 === 0 ? "DTPC" : "DTPM"),
          status: i < 2 ? "Allocated" : "Ready to Allocate",
        }))
      };

    case "incoming-chapter":
      return {
        title: "Incoming Chapter Report",
        sub: "Chapter and page-level breakdown of incoming manuscripts with file format specs",
        kpis: (rows) => [
          { label: "Chapters Inwarded", value: "128 Chapters", sub: "Parsed from manuscripts" },
          { label: "Prelims / Frontmatter", value: "18 Files", sub: "Ready for styling" },
          { label: "Core Body Chapters", value: "98 Files", sub: "Sent to composition" },
          { label: "Backmatter / Index", value: "12 Files", sub: "Cross-ref pending" },
        ],
        columns: [
          { key: "isbn", label: "ISBN" },
          { key: "chapterCode", label: "Chapter Code" },
          { key: "chapterName", label: "Chapter Name" },
          { key: "pages", label: "Page Count" },
          { key: "sourceFormat", label: "Source Format" },
          { key: "targetFormat", label: "Target Deliverable" },
          { key: "inwardTime", label: "Inward Timestamp" },
          { key: "status", label: "Status" },
        ],
        rows: [
          { id: 1, isbn: "9781394415106", chapterCode: "FM01", chapterName: "Front Matter & Title", pages: 16, sourceFormat: ".docx / .indd", targetFormat: "POD + ePDF", inwardTime: "28-08-2026 08:30", status: "Extracted" },
          { id: 2, isbn: "9781394415106", chapterCode: "C01", chapterName: "Introduction to Org Design", pages: 42, sourceFormat: ".docx", targetFormat: "POD + ePDF", inwardTime: "28-08-2026 08:30", status: "Extracted" },
          { id: 3, isbn: "9781394415106", chapterCode: "C02", chapterName: "Strategic Leadership", pages: 56, sourceFormat: ".docx", targetFormat: "POD + ePDF", inwardTime: "28-08-2026 08:31", status: "Extracted" },
          { id: 4, isbn: "9781394472567", chapterCode: "C01", chapterName: "Macroeconomics Principles", pages: 38, sourceFormat: ".indd Package", targetFormat: "ePDF", inwardTime: "28-08-2026 09:10", status: "In Preflight" },
          { id: 5, isbn: "9781119983412", chapterCode: "BM01", chapterName: "Glossary and References", pages: 28, sourceFormat: ".docx", targetFormat: "POD", inwardTime: "28-08-2026 09:40", status: "Extracted" },
        ]
      };

    case "due-date-delivery":
      return {
        title: "Due Date Delivery Report",
        sub: "Comprehensive monitoring of titles nearing SLA dispatch deadlines within 24 to 72 hours",
        kpis: (rows) => [
          { label: "Due Today", value: "4 Titles", sub: "By 18:00 IST", status: "short" },
          { label: "Due Tomorrow", value: "8 Titles", sub: "In final QC approval" },
          { label: "Buffer Safe (>48h)", value: "22 Titles", sub: "On schedule", status: "good" },
          { label: "Zero Overdue", value: "100%", sub: "No SLA breach reported", status: "good" },
        ],
        columns: [
          { key: "id", label: "Project ID" },
          { key: "isbn", label: "ISBN" },
          { key: "customer", label: "Customer" },
          { key: "dueTime", label: "SLA Deadline" },
          { key: "hoursLeft", label: "Time Remaining" },
          { key: "stage", label: "Current Stage" },
          { key: "lead", label: "Lead In-Charge" },
          { key: "risk", label: "Risk Level" },
        ],
        rows: sampleProjects.map((p, i) => ({
          id: p.id,
          isbn: p.isbn,
          customer: p.customer,
          dueTime: i < 2 ? "Today 18:00" : i < 5 ? "Tomorrow 17:00" : "31-08-2026",
          hoursLeft: i < 2 ? "2h 45m" : i < 5 ? "26h" : "72h+",
          stage: p.stage,
          lead: EMPLOYEES[i % EMPLOYEES.length],
          risk: i === 0 ? "Urgent Attention" : i < 3 ? "Medium Priority" : "Low Risk",
        }))
      };

    case "delivery-report":
      return {
        title: "Delivery Report",
        sub: "Final dispatched books, chapter bundles, and printer files delivered to client repositories",
        kpis: (rows) => [
          { label: "Dispatched Titles", value: "112 Titles", sub: "Delivered to client FTP", status: "good" },
          { label: "Shipped Files", value: "1,450 Files", sub: "POD, ePDF, XML & ePUB" },
          { label: "Sign-offs Received", value: "108 Signed", sub: "96.4% acceptance rate" },
          { label: "Pending Ack", value: "4 Acknowledging", sub: "Sent today" },
        ],
        columns: [
          { key: "dispatchNo", label: "Dispatch No" },
          { key: "isbn", label: "ISBN" },
          { key: "title", label: "Title" },
          { key: "customer", label: "Customer" },
          { key: "format", label: "Deliverable Format" },
          { key: "dispatchedAt", label: "Dispatch Date & Time" },
          { key: "channel", label: "Channel" },
          { key: "approvedBy", label: "QC Sign-off By" },
          { key: "status", label: "Delivery Status" },
        ],
        rows: sampleProjects.map((p, i) => ({
          id: i + 1,
          dispatchNo: `DSP-90${10 + i}`,
          isbn: p.isbn,
          title: p.name,
          customer: p.customer,
          format: i % 2 === 0 ? "POD + ePDF" : "XML + ePub 3.0",
          dispatchedAt: "28-08-2026 15:20",
          channel: "Client Secure FTP",
          approvedBy: EMPLOYEES[0],
          status: "Delivered & Verified"
        }))
      };

    case "customer-appreciation":
      return {
        title: "Customer Appreciation",
        sub: "Formal client commendations, 5-star ratings, and congratulatory notes on delivered titles",
        kpis: (rows) => [
          { label: "Total Commendations", value: "32 Records", sub: "From Wiley, Pearson, OUP", status: "good" },
          { label: "5-Star Ratings", value: "28 Ratings", sub: "87.5% top tier" },
          { label: "Commended Staff", value: "16 Developers", sub: "Recognized by clients" },
          { label: "Repeat Client Index", value: "100%", sub: "High satisfaction benchmark" },
        ],
        columns: [
          { key: "date", label: "Date" },
          { key: "client", label: "Client" },
          { key: "title", label: "Project Title" },
          { key: "recognized", label: "Recognized Employee" },
          { key: "rating", label: "Rating" },
          { key: "remarks", label: "Client Commendation" },
        ],
        rows: [
          { id: 1, date: "28-08-2026", client: "John Wiley", title: "Exploring Management 2E", recognized: "Jaisrinivas P K", rating: "★★★★★", remarks: "Flawless turnaround on complex math matrices and charts." },
          { id: 2, date: "27-08-2026", client: "Cengage Learning", title: "Financial Accounting 12E", recognized: "Sivakumar G", rating: "★★★★★", remarks: "Excellent layout adherence, delivered 6 hours ahead of scheduled SLA." },
          { id: 3, date: "26-08-2026", client: "Oxford University Press", title: "Digital Marketing 4E", recognized: "b.Thangaraj", rating: "★★★★★", remarks: "Remarkable XML tagging precision and zero validation warnings." },
          { id: 4, date: "24-08-2026", client: "Springer Nature", title: "Applied Data Science", recognized: "Monica R", rating: "★★★★★", remarks: "Great communication and very quick resolution of author revisions." },
        ]
      };

    case "manpower-data":
      return {
        title: "Manpower Data Report",
        sub: "Staff deployment across production units, attendance, shift occupancy, and capacity utilization",
        kpis: (rows) => [
          { label: "Total Headcount", value: "28 Employees", sub: "Full roster" },
          { label: "Present & Active", value: "26 Active", sub: "92.8% workforce presence", status: "good" },
          { label: "On Planned Leave", value: "2 Staff", sub: "Covered by backup" },
          { label: "Avg Workload Cap", value: "86.4%", sub: "Optimal utilization" },
        ],
        columns: [
          { key: "empId", label: "Emp ID" },
          { key: "name", label: "Employee Name" },
          { key: "unit", label: "Unit" },
          { key: "dept", label: "Department" },
          { key: "shift", label: "Shift" },
          { key: "currentJob", label: "Current Assignment" },
          { key: "utilization", label: "Utilization" },
          { key: "status", label: "Attendance" },
        ],
        rows: EMPLOYEES.map((name, i) => ({
          id: i + 1,
          empId: `GEN00${String(i + 1).padStart(2, "0")}`,
          name: name,
          unit: i % 2 === 0 ? "DTPC" : "DTPM",
          dept: DEPARTMENTS[(i % (DEPARTMENTS.length - 1)) + 1],
          shift: "General (09:00 - 18:00)",
          currentJob: `Batch Allocation #20${10 + i}`,
          utilization: `${75 + (i * 5) % 25}%`,
          status: i === 5 ? "On Leave" : "Active"
        }))
      };

    case "technical-query":
      return {
        title: "Technical Query View",
        sub: "Queries raised with publishing clients regarding manuscript ambiguities, art defects, and font issues",
        kpis: (rows) => [
          { label: "Total Queries", value: "24 Queries", sub: "Raised this month" },
          { label: "Resolved", value: "19 Resolved", sub: "Client response documented", status: "good" },
          { label: "Pending Client", value: "5 Awaiting", sub: "Within 24h inquiry window" },
          { label: "Avg Turnaround", value: "3.2 Hours", sub: "Fast issue resolution" },
        ],
        columns: [
          { key: "queryId", label: "Query ID" },
          { key: "client", label: "Client" },
          { key: "isbn", label: "ISBN" },
          { key: "subject", label: "Query Subject" },
          { key: "raisedBy", label: "Raised By" },
          { key: "raisedDate", label: "Raised On" },
          { key: "clientReply", label: "Client Decision" },
          { key: "status", label: "Status" },
        ],
        rows: [
          { id: 1, queryId: "QRY-1041", client: "John Wiley", isbn: "9781394415106", subject: "Low resolution figure in Chapter 4 Figure 4.2", raisedBy: "Sundharesan T", raisedDate: "27-08-2026 11:20", clientReply: "High-res vector EPS provided on FTP", status: "Resolved" },
          { id: 2, queryId: "QRY-1042", client: "Cengage Learning", isbn: "9781119983412", subject: "Conflicting footnote numbering on page 142", raisedBy: "Sivakumar G", raisedDate: "27-08-2026 15:40", clientReply: "Renumber sequentially as per author note", status: "Resolved" },
          { id: 3, queryId: "QRY-1043", client: "Pearson", isbn: "9780137654218", subject: "Greek font glyph missing in formula 8.3", raisedBy: "Inbakumar R", raisedDate: "28-08-2026 10:15", clientReply: "Pending editorial review", status: "Pending Client Reply" },
          { id: 4, queryId: "QRY-1044", client: "Oxford University Press", isbn: "9780198876542", subject: "Missing bibliography entries B04-B09", raisedBy: "Vandhana T", raisedDate: "28-08-2026 13:00", clientReply: "Awaiting author update", status: "Pending Client Reply" },
        ]
      };

    case "customer-feedback":
      return {
        title: "Customer Feedback",
        sub: "Client feedback received after sample submission, first proof review, and final file verification",
        kpis: (rows) => [
          { label: "Reviews Logged", value: "42 Reviews", sub: "Across all active clients" },
          { label: "Positive / Excellent", value: "39 Positive", sub: "92.8% top satisfaction", status: "good" },
          { label: "Action Revisions", value: "3 Items", sub: "Incorporated in R1" },
          { label: "Avg Turnaround", value: "1.4 Days", sub: "Feedback turnaround" },
        ],
        columns: [
          { key: "feedbackId", label: "Feedback Ref" },
          { key: "customer", label: "Customer" },
          { key: "isbn", label: "ISBN / Title" },
          { key: "category", label: "Category" },
          { key: "rating", label: "Rating" },
          { key: "feedbackText", label: "Customer Comments" },
          { key: "actionTaken", label: "Action Taken" },
          { key: "status", label: "Status" },
        ],
        rows: [
          { id: 1, feedbackId: "FB-501", customer: "John Wiley", isbn: "9781394415106 (Exploring Management)", category: "Interior Design", rating: "5/5", feedbackText: "Layout matches our global template flawlessly.", actionTaken: "Proceeded to final POD generation", status: "Closed" },
          { id: 2, feedbackId: "FB-502", customer: "Cengage Learning", isbn: "9781119983412 (Accounting)", category: "Typesetting", rating: "4/5", feedbackText: "Please tighten line leading on table captions.", actionTaken: "Leading adjusted to 11.5pt across all tables", status: "Closed" },
          { id: 3, feedbackId: "FB-503", customer: "Elsevier", isbn: "9780323991148 (Clinical Research)", category: "Quality", rating: "5/5", feedbackText: "Very clean proofing, zero typo complaints.", actionTaken: "Sent to printer prepress", status: "Closed" },
        ]
      };

    case "billing-report":
      return {
        title: "Billing Report",
        sub: "Detailed breakdown of billable page counts, stages, hourly rates, and invoice-ready line items",
        kpis: (rows) => [
          { label: "Billable Projects", value: rows.length, sub: "Qualified for billing" },
          { label: "Total Billable Pages", value: "4,820 pgs", sub: "Completed & approved" },
          { label: "Unbilled WIP Value", value: "$34,250", sub: "Ready for monthly invoice", status: "good" },
          { label: "Avg Page Rate", value: "$4.80 / pg", sub: "Across all composition tiers" },
        ],
        columns: [
          { key: "id", label: "Project ID" },
          { key: "customer", label: "Client" },
          { key: "title", label: "Title" },
          { key: "isbn", label: "ISBN" },
          { key: "stage", label: "Billed Stage" },
          { key: "pages", label: "Pages" },
          { key: "unitRate", label: "Rate" },
          { key: "total", label: "Total Amount" },
          { key: "poNumber", label: "Client PO" },
          { key: "status", label: "Billing Status" },
        ],
        rows: sampleProjects.map((p, i) => ({
          id: p.id,
          customer: p.customer,
          title: p.name,
          isbn: p.isbn,
          stage: p.stage,
          pages: 280 + i * 35,
          unitRate: "$4.50",
          total: `$${((280 + i * 35) * 4.5).toLocaleString()}`,
          poNumber: `PO-WLY-2026-${100 + i}`,
          status: i % 3 === 0 ? "Billed" : "Ready to Bill"
        }))
      };

    case "ongoing-report":
      return {
        title: "OnGoing Report",
        sub: "Live active pipeline tracking of every project and chapter currently underway on production floor",
        kpis: (rows) => [
          { label: "Work In Progress", value: rows.length, sub: "Live production stages" },
          { label: "In Quality Check", value: "6 Batches", sub: "Awaiting QAG signoff" },
          { label: "Avg Completion", value: "64.5%", sub: "Across all running titles", status: "good" },
          { label: "Bottlenecks", value: "0 Severe", sub: "Production flow unimpeded", status: "good" },
        ],
        columns: [
          { key: "id", label: "Project ID" },
          { key: "title", label: "Project Name" },
          { key: "customer", label: "Customer" },
          { key: "unit", label: "Unit" },
          { key: "stage", label: "Current Stage" },
          { key: "lead", label: "Developer / Lead" },
          { key: "progress", label: "Progress" },
          { key: "dueDate", label: "Target Completion" },
          { key: "status", label: "Status" },
        ],
        rows: sampleProjects.map((p, i) => ({
          id: p.id,
          title: p.name,
          customer: p.customer,
          unit: p.unit || "DTPC",
          stage: p.stage,
          lead: EMPLOYEES[i % EMPLOYEES.length],
          progress: `${35 + (i * 6) % 60}%`,
          dueDate: "03-09-2026",
          status: p.status
        }))
      };

    case "internal-feedback":
      return {
        title: "Internal Feedback",
        sub: "Peer review, lead supervisor coaching notes, and technical guidance recorded during production",
        kpis: (rows) => [
          { label: "Internal Reviews", value: "38 Logged", sub: "Team quality coaching" },
          { label: "Guidance Passed", value: "34 Cleared", sub: "Developer implemented fixes", status: "good" },
          { label: "Action Pending", value: "4 In Review", sub: "Follow-up scheduled" },
          { label: "Compliance Score", value: "98.2%", sub: "Standardized guidelines", status: "good" },
        ],
        columns: [
          { key: "refId", label: "Review Ref" },
          { key: "reviewer", label: "Supervisor / Lead" },
          { key: "developer", label: "Developer" },
          { key: "project", label: "Project & ISBN" },
          { key: "chapter", label: "Chapter" },
          { key: "topic", label: "Focus Topic" },
          { key: "notes", label: "Reviewer Observations" },
          { key: "status", label: "Resolution" },
        ],
        rows: [
          { id: 1, refId: "INT-301", reviewer: "b.Thangaraj", developer: "Jaisrinivas P K", project: "Exploring Management (9781394415106)", chapter: "C02", topic: "Header Margin Consistency", notes: "Ensure 18pt header top clearance on rectos.", status: "Implemented" },
          { id: 2, refId: "INT-302", reviewer: "Inbakumar R", developer: "Sivakumar G", project: "Financial Accounting (9781119983412)", chapter: "C05", topic: "Table Border Strokes", notes: "Use 0.5pt subtle grey instead of pure black for nested cells.", status: "Implemented" },
          { id: 3, refId: "INT-303", reviewer: "Sundharesan T", developer: "Monica R", project: "Key Concepts in Economics (9781394472567)", chapter: "C01", topic: "Callout Box Padding", notes: "Increase inset to 6pt around equation callouts.", status: "In Progress" },
        ]
      };

    case "rework-report":
      return {
        title: "Rework Report",
        sub: "Log of all files returned from QC or Client with explicit rejection reasons and comments",
        kpis: (rows) => [
          { label: "Total Rework Files", value: rows.length, sub: "Returned for correction" },
          { label: "Round 1 (R1)", value: rows.filter(r => r.round === "R1").length, sub: "Standard first iteration", status: "good" },
          { label: "Repeated (R2+)", value: rows.filter(r => r.round !== "R1").length, sub: "Escalated to lead", status: "short" },
          { label: "Resolution Rate", value: "91.2%", sub: "Turnaround within 4 hours", status: "good" },
        ],
        columns: [
          { key: "taskId", label: "Task Ref" },
          { key: "isbn", label: "ISBN" },
          { key: "chapter", label: "Chapter" },
          { key: "developer", label: "Original Developer" },
          { key: "inspector", label: "QC Auditor" },
          { key: "reason", label: "Rejection Reason" },
          { key: "comments", label: "Comments & Instructions" },
          { key: "round", label: "Round" },
          { key: "status", label: "Status" },
        ],
        rows: [
          { id: 1, taskId: "RWK-401", isbn: "9781394415106", chapter: "Chapter 03", developer: "Jaisrinivas P K", inspector: "b.Thangaraj", reason: "Font hierarchy mismatch", comments: "Heading 2 font size was set to 14pt instead of mandatory 16pt client spec.", round: "R1", status: "Reassigned" },
          { id: 2, taskId: "RWK-402", isbn: "9781394472567", chapter: "Prelims", developer: "Sivakumar G", inspector: "Inbakumar R", reason: "Pagination overflow", comments: "Contents page ran into 2.5 pages, please balance spacing to keep it within 2 pages.", round: "R1", status: "In Progress" },
          { id: 3, taskId: "RWK-403", isbn: "9781119983412", chapter: "Chapter 08", developer: "Monica R", inspector: "Sundharesan T", reason: "Incorrect artwork DPI", comments: "Figure 8.4 resampled at 150 DPI; must be strictly 300 DPI vector / tiff.", round: "R2", status: "Critical Fix" },
        ]
      };

    case "two-hour-tracking":
      return {
        title: "Two hour Tracking Report",
        sub: "Intra-day hourly throughput logged every 2 hours (10:00, 12:00, 14:00, 16:00, 18:00)",
        kpis: (rows) => [
          { label: "Current Slot", value: "16:00 IST", sub: "Shift progression 80%" },
          { label: "Total Files Done", value: "184 Files", sub: "Cumulative across shifts", status: "good" },
          { label: "Pace vs Target", value: "+12 Files", sub: "Ahead of daily plan", status: "good" },
          { label: "Floor Velocity", value: "23 Files/hr", sub: "High throughput" },
        ],
        columns: [
          { key: "empId", label: "Emp ID" },
          { key: "name", label: "Employee Name" },
          { key: "unit", label: "Unit" },
          { key: "slot1", label: "10:00 AM" },
          { key: "slot2", label: "12:00 PM" },
          { key: "slot3", label: "02:00 PM" },
          { key: "slot4", label: "04:00 PM" },
          { key: "slot5", label: "06:00 PM" },
          { key: "total", label: "Total Output" },
          { key: "pace", label: "Pace" },
        ],
        rows: EMPLOYEES.map((name, i) => {
          const s1 = 4 + (i % 3);
          const s2 = 5 + ((i + 1) % 3);
          const s3 = 4 + ((i + 2) % 3);
          const s4 = 5 + (i % 2);
          const s5 = 3;
          const tot = s1 + s2 + s3 + s4 + s5;
          return {
            id: i + 1,
            empId: `GEN00${String(i + 1).padStart(2, "0")}`,
            name: name,
            unit: i % 2 === 0 ? "DTPC" : "DTPM",
            slot1: s1,
            slot2: s2,
            slot3: s3,
            slot4: s4,
            slot5: s5,
            total: tot,
            pace: tot >= 20 ? "On Target" : "Slightly Behind"
          };
        })
      };

    case "error-report":
      return {
        title: "Error Report",
        sub: "Categorized defect taxonomy: font issues, formatting, missing elements, and artwork flaws",
        kpis: (rows) => [
          { label: "Defects Logged", value: rows.length, sub: "Identified during audits" },
          { label: "Formatting & Layout", value: "9 Errors", sub: "Leading, margins, indent" },
          { label: "Font & Typography", value: "6 Errors", sub: "Missing glyphs or styles" },
          { label: "Artwork & Resolution", value: "4 Errors", sub: "DPI and colour profiles" },
        ],
        columns: [
          { key: "defectId", label: "Defect No" },
          { key: "isbn", label: "ISBN" },
          { key: "chapter", label: "Chapter & Page" },
          { key: "category", label: "Defect Type" },
          { key: "severity", label: "Severity" },
          { key: "description", label: "Error Detail" },
          { key: "detectedBy", label: "Detected By" },
          { key: "assignedFix", label: "Assigned Fixer" },
          { key: "status", label: "Status" },
        ],
        rows: [
          { id: 1, defectId: "ERR-901", isbn: "9781394415106", chapter: "C03, Page 54", category: "Typography", severity: "Medium", description: "Bullet indent misaligned by 4pt.", detectedBy: "b.Thangaraj", assignedFix: "Jaisrinivas P K", status: "Resolved" },
          { id: 2, defectId: "ERR-902", isbn: "9781394472567", chapter: "C01, Page 12", category: "Artwork", severity: "High", description: "Chart RGB color mode; must convert to CMYK.", detectedBy: "Inbakumar R", assignedFix: "Sivakumar G", status: "In Progress" },
          { id: 3, defectId: "ERR-903", isbn: "9781119983412", chapter: "C04, Page 88", category: "Content", severity: "Critical", description: "Subhead 4.3 omitted from draft run.", detectedBy: "Sundharesan T", assignedFix: "Monica R", status: "Resolved" },
          { id: 4, defectId: "ERR-904", isbn: "9780137654218", chapter: "Prelims, Page ii", category: "Layout", severity: "Low", description: "Running header missing italic styling.", detectedBy: "Santhosh Kumar A", assignedFix: "Arul Yosuva", status: "Resolved" },
        ]
      };

    case "daily-allotment":
      return {
        title: "Daily Allotment Status",
        sub: "Status of today's file and chapter allocations divided across Book and Cover teams",
        kpis: (rows) => [
          { label: "Today's Target", value: "100 ISBNs", sub: "Master batch assigned", status: "good" },
          { label: "Book Allocations", value: "100 Allotted", sub: "16 Book Developers active" },
          { label: "Cover Allocations", value: "100 Allotted", sub: "6 Cover Developers active" },
          { label: "Both Completed", value: "32 Books", sub: "Fully ready for combined QC", status: "good" },
        ],
        columns: [
          { key: "isbn", label: "ISBN" },
          { key: "title", label: "Title" },
          { key: "bookDev", label: "Book Dev (EMP)" },
          { key: "bookStatus", label: "Book Status" },
          { key: "coverDev", label: "Cover Dev (EMP)" },
          { key: "coverStatus", label: "Cover Status" },
          { key: "overall", label: "Combined Status" },
        ],
        rows: sampleProjects.map((p, i) => ({
          id: p.id,
          isbn: p.isbn,
          title: p.name,
          bookDev: `${EMPLOYEES[i % EMPLOYEES.length]} (GEN00${String((i % 12) + 1).padStart(2, "0")})`,
          bookStatus: i < 3 ? "Completed" : "In Progress",
          coverDev: `${EMPLOYEES[(i + 4) % EMPLOYEES.length]} (GEN00${String(((i + 4) % 12) + 1).padStart(2, "0")})`,
          coverStatus: i < 4 ? "Completed" : "In Progress",
          overall: i < 3 ? "Ready for Combined Export" : "Parallel WIP"
        }))
      };

    case "rework-round-analysis":
      return {
        title: "Rework Round Analysis",
        sub: "Analysis of rework iterations (R1, R2, R3+), recurring failure patterns, and closure times",
        kpis: (rows) => [
          { label: "Round 1 (R1)", value: "18 Cases", sub: "First rework iteration" },
          { label: "Round 2 (R2)", value: "3 Cases", sub: "Secondary rework iteration", status: "short" },
          { label: "Round 3+ (R3)", value: "0 Cases", sub: "Zero chronic re-works", status: "good" },
          { label: "R1 Fix Success", value: "85.7%", sub: "Resolved on first retry", status: "good" },
        ],
        columns: [
          { key: "isbn", label: "ISBN" },
          { key: "title", label: "Book Title" },
          { key: "developer", label: "Developer" },
          { key: "rounds", label: "Rework Rounds" },
          { key: "rootCause", label: "Root Cause" },
          { key: "r1Date", label: "R1 Return" },
          { key: "r2Date", label: "R2 Return" },
          { key: "finalApproval", label: "Approved On" },
          { key: "status", label: "Current Status" },
        ],
        rows: [
          { id: 1, isbn: "9781394415106", title: "Exploring Management", developer: "Jaisrinivas P K", rounds: "R1", rootCause: "Font substitution error", r1Date: "27-08-2026 14:00", r2Date: "-", finalApproval: "27-08-2026 16:30", status: "Approved" },
          { id: 2, isbn: "9781394472567", title: "Key Concepts Economics", developer: "Sivakumar G", rounds: "R1", rootCause: "Header margin spacing", r1Date: "28-08-2026 10:00", r2Date: "-", finalApproval: "28-08-2026 11:45", status: "Approved" },
          { id: 3, isbn: "9781119983412", title: "Financial Accounting", developer: "Monica R", rounds: "R2", rootCause: "Chart resolution & label clipping", r1Date: "26-08-2026 16:00", r2Date: "27-08-2026 09:30", finalApproval: "27-08-2026 14:00", status: "Approved" },
        ]
      };

    case "qc-r1-acceptance":
      return {
        title: "QC R1 Acceptance Report",
        sub: "First-Time-Right (FTR) quality index: percentage of submissions passing QC without a single rework",
        kpis: (rows) => [
          { label: "First Time Right (FTR)", value: "92.7%", sub: "Target SLA: >90%", status: "good" },
          { label: "R1 Submissions", value: "164 Batches", sub: "Total first submissions" },
          { label: "R1 Accepted", value: "152 Clean", sub: "Passed without rework", status: "good" },
          { label: "R1 Rejected", value: "12 Batches", sub: "Required minor correction", status: "short" },
        ],
        columns: [
          { key: "empId", label: "Emp ID" },
          { key: "name", label: "Developer Name" },
          { key: "department", label: "Department" },
          { key: "submissions", label: "R1 Submissions" },
          { key: "accepted", label: "R1 Accepted" },
          { key: "rejected", label: "R1 Rejected" },
          { key: "ftrScore", label: "FTR Score %" },
          { key: "benchmark", label: "Benchmark" },
        ],
        rows: EMPLOYEES.map((name, i) => {
          const sub = 14 + (i % 5);
          const rej = i % 4 === 0 ? 2 : i % 3 === 0 ? 1 : 0;
          const acc = sub - rej;
          const pct = Math.round((acc / sub) * 100);
          return {
            id: i + 1,
            empId: `GEN00${String(i + 1).padStart(2, "0")}`,
            name: name,
            department: DEPARTMENTS[(i % (DEPARTMENTS.length - 1)) + 1],
            submissions: sub,
            accepted: acc,
            rejected: rej,
            ftrScore: `${pct}%`,
            benchmark: pct >= 90 ? "Target Achieved" : "Needs Review"
          };
        })
      };

    case "mops-reports":
      return {
        title: "MOPS Reports",
        sub: "Monthly Operations Performance Summary across throughput volume, quality indices, and SLA delivery",
        kpis: (rows) => [
          { label: "Monthly Output", value: "2,840 Files", sub: "August 2026 production", status: "good" },
          { label: "Target Realization", value: "104.2%", sub: "Exceeded monthly quota", status: "good" },
          { label: "Overall Quality Pass", value: "98.8%", sub: "High client satisfaction" },
          { label: "Avg Turnaround", value: "1.8 Days", sub: "Standard delivery time" },
        ],
        columns: [
          { key: "month", label: "Month" },
          { key: "customer", label: "Customer" },
          { key: "titles", label: "Titles Completed" },
          { key: "pages", label: "Pages Produced" },
          { key: "onTime", label: "On-Time %" },
          { key: "quality", label: "Quality %" },
          { key: "hours", label: "Hours Logged" },
          { key: "efficiency", label: "Efficiency Index" },
        ],
        rows: [
          { id: 1, month: "August 2026", customer: "John Wiley", titles: 38, pages: 12450, onTime: "97.5%", quality: "99.1%", hours: 1420, efficiency: "103.2%" },
          { id: 2, month: "August 2026", customer: "Cengage Learning", titles: 24, pages: 8900, onTime: "96.2%", quality: "98.4%", hours: 980, efficiency: "101.8%" },
          { id: 3, month: "August 2026", customer: "Pearson", titles: 31, pages: 10200, onTime: "98.0%", quality: "99.4%", hours: 1150, efficiency: "105.0%" },
          { id: 4, month: "August 2026", customer: "Oxford University Press", titles: 18, pages: 5800, onTime: "95.8%", quality: "98.0%", hours: 670, efficiency: "99.4%" },
        ]
      };

    case "daily-planning":
      return {
        title: "Daily Planning Report",
        sub: "Capacity planning, expected input queues, allocated shifts, and projected delivery targets",
        kpis: (rows) => [
          { label: "Planned Output", value: "180 Files", sub: "Today's master target" },
          { label: "Available Staff", value: "24 Developers", sub: "Capacity at 96%" },
          { label: "Capacity Headroom", value: "20 Files", sub: "Contingency buffer", status: "good" },
          { label: "Shift Realization", value: "98.5%", sub: "Target on pace", status: "good" },
        ],
        columns: [
          { key: "unit", label: "Unit" },
          { key: "dept", label: "Department" },
          { key: "shift", label: "Shift" },
          { key: "scheduled", label: "Staff Scheduled" },
          { key: "targetFiles", label: "Target Files" },
          { key: "backlog", label: "Incoming Backlog" },
          { key: "estDelivery", label: "Target Delivery" },
          { key: "supervisor", label: "Shift Supervisor" },
        ],
        rows: [
          { id: 1, unit: "DTPC", dept: "Composition", shift: "Shift A (06:00 - 14:30)", scheduled: 8, targetFiles: 60, backlog: 4, estDelivery: "14:00", supervisor: "b.Thangaraj" },
          { id: 2, unit: "DTPC", dept: "Art & Graphics", shift: "Shift B (09:00 - 18:00)", scheduled: 10, targetFiles: 80, backlog: 6, estDelivery: "17:30", supervisor: "Sundharesan T" },
          { id: 3, unit: "DTPM", dept: "Quality & QC", shift: "Shift B (09:00 - 18:00)", scheduled: 6, targetFiles: 40, backlog: 2, estDelivery: "18:00", supervisor: "Inbakumar R" },
        ]
      };

    case "delivery-production-count":
      return {
        title: "Delivery Production Count",
        sub: "Consolidated volume tally of all books, covers, and chapters finished and delivered by unit",
        kpis: (rows) => [
          { label: "Total Delivered Units", value: "148 Titles", sub: "Across all clients", status: "good" },
          { label: "DTPC Units", value: "86 Titles", sub: "58.1% share" },
          { label: "DTPM Units", value: "62 Titles", sub: "41.9% share" },
          { label: "Page Count Total", value: "38,400 pgs", sub: "Delivered volume", status: "good" },
        ],
        columns: [
          { key: "date", label: "Delivery Date" },
          { key: "unit", label: "Unit" },
          { key: "customer", label: "Customer" },
          { key: "isbn", label: "ISBN" },
          { key: "title", label: "Title" },
          { key: "files", label: "Delivered Files" },
          { key: "pages", label: "Pages" },
          { key: "deliveredBy", label: "Shipped By" },
        ],
        rows: sampleProjects.map((p, i) => ({
          id: p.id,
          date: "28-08-2026",
          unit: p.unit || (i % 2 === 0 ? "DTPC" : "DTPM"),
          customer: p.customer,
          isbn: p.isbn,
          title: p.name,
          files: 12 + (i % 6),
          pages: 320 + i * 40,
          deliveredBy: EMPLOYEES[(i + 2) % EMPLOYEES.length]
        }))
      };

    case "production-pipeline": {
      const pipelineRows = (tasks.length ? tasks : sampleProjects).map((item, index) => ({
        id: item.id || `PIPE-${index + 1}`,
        isbn: item.isbn || "—",
        project: item.project || item.projectName || item.name || "Untitled project",
        department: item.department || item.process || item.stage || "Production",
        employee: item.employee || item.postedTo || "Unassigned",
        status: item.status || "Yet to Start",
        due: item.due || item.dueDate || "—"
      }));
      const completed = pipelineRows.filter(row => /complete|delivered/i.test(row.status)).length;
      const rework = pipelineRows.filter(row => /rework|reject/i.test(row.status)).length;
      return {
        title: "Production Pipeline",
        sub: "Live workflow queue from allocation through quality checks and final delivery",
        kpis: () => [
          { label: "Pipeline Files", value: pipelineRows.length, sub: "Allocated workflow records" },
          { label: "In Progress", value: pipelineRows.filter(row => /progress|wip|start/i.test(row.status)).length, sub: "Active production" },
          { label: "Completed", value: completed, sub: "Ready or delivered", status: "good" },
          { label: "Rework", value: rework, sub: "Needs attention", status: rework ? "short" : "good" }
        ],
        columns: [
          { key: "isbn", label: "ISBN" }, { key: "project", label: "Project" },
          { key: "department", label: "Stage / Department" }, { key: "employee", label: "Assigned To" },
          { key: "due", label: "Due Date" }, { key: "status", label: "Status" }
        ],
        rows: pipelineRows
      };
    }

    case "incentive":
      return {
        title: "Incentive",
        sub: "Calculated productivity incentives for production developers based on page output and quality metrics",
        kpis: (rows) => [
          { label: "Eligible Staff", value: "18 Developers", sub: "Achieved >100% quota", status: "good" },
          { label: "Incentive Pool", value: "$4,250", sub: "Earned this cycle", status: "good" },
          { label: "Top Earner", value: "Jaisrinivas P K", sub: "$480 incentive" },
          { label: "Avg Incentive", value: "$236 / dev", sub: "Above baseline target" },
        ],
        columns: [
          { key: "empId", label: "Emp ID" },
          { key: "name", label: "Employee Name" },
          { key: "dept", label: "Department" },
          { key: "baseTarget", label: "Base Target" },
          { key: "achieved", label: "Achieved Volume" },
          { key: "extra", label: "Surplus Units" },
          { key: "quality", label: "Quality Score" },
          { key: "payout", label: "Total Incentive" },
        ],
        rows: EMPLOYEES.map((name, i) => {
          const base = 400;
          const achieved = 420 + (i * 18) % 120;
          const extra = achieved - base;
          const quality = 95 + (i % 5);
          const payout = `$${Math.round(extra * 3.5 + (quality > 98 ? 50 : 20))}`;
          return {
            id: i + 1,
            empId: `GEN00${String(i + 1).padStart(2, "0")}`,
            name: name,
            dept: DEPARTMENTS[(i % (DEPARTMENTS.length - 1)) + 1],
            baseTarget: `${base} pgs`,
            achieved: `${achieved} pgs`,
            extra: `+${extra} pgs`,
            quality: `${quality}%`,
            payout: payout
          };
        })
      };

    case "billing":
      return {
        title: "Billing",
        sub: "Master invoice registers, client purchase orders, payment terms, and account receivable status",
        kpis: (rows) => [
          { label: "Invoiced Total", value: "$124,500", sub: "August 2026 accounts", status: "good" },
          { label: "Paid Receipts", value: "$98,200", sub: "Received into account" },
          { label: "Outstanding AR", value: "$26,300", sub: "Due within 30 days" },
          { label: "Overdue Invoices", value: "0 Invoices", sub: "Healthy payment cycle", status: "good" },
        ],
        columns: [
          { key: "invoiceNo", label: "Invoice No" },
          { key: "client", label: "Client Publisher" },
          { key: "project", label: "Project Title" },
          { key: "isbn", label: "ISBN" },
          { key: "invoiceDate", label: "Invoice Date" },
          { key: "dueDate", label: "Payment Due" },
          { key: "netAmount", label: "Net Amount" },
          { key: "tax", label: "Tax" },
          { key: "grossAmount", label: "Gross Total" },
          { key: "status", label: "Payment Status" },
        ],
        rows: sampleProjects.map((p, i) => ({
          id: p.id,
          invoiceNo: `INV-2026-${800 + i}`,
          client: p.customer,
          project: p.name,
          isbn: p.isbn,
          invoiceDate: "15-08-2026",
          dueDate: "15-09-2026",
          netAmount: `$${(8500 + i * 1100).toLocaleString()}`,
          tax: `$${Math.round((8500 + i * 1100) * 0.05).toLocaleString()}`,
          grossAmount: `$${Math.round((8500 + i * 1100) * 1.05).toLocaleString()}`,
          status: i < 5 ? "Paid" : "Pending Payment"
        }))
      };

    case "qa-qc-incentive":
      return {
        title: "QA And QC Incentive Report",
        sub: "Specialized incentive program for Quality Assurance analysts based on audit accuracy and defect leakage prevention",
        kpis: (rows) => [
          { label: "QC Auditors Eligible", value: "6 Analysts", sub: "100% team qualification", status: "good" },
          { label: "Defect Leakage", value: "0.02%", sub: "Near zero delivery defects", status: "good" },
          { label: "QC Incentive Fund", value: "$1,850", sub: "Awarded for high accuracy" },
          { label: "Avg Audit Score", value: "99.4%", sub: "Strict compliance maintained" },
        ],
        columns: [
          { key: "auditorId", label: "Auditor ID" },
          { key: "name", label: "QC Analyst" },
          { key: "dept", label: "QC Group" },
          { key: "auditedFiles", label: "Audited Files" },
          { key: "defectsCaught", label: "Defects Caught" },
          { key: "accuracy", label: "Accuracy %" },
          { key: "leakage", label: "Leakage %" },
          { key: "incentive", label: "Incentive Payout" },
        ],
        rows: [
          { id: 1, auditorId: "QAG-01", name: "b.Thangaraj", dept: "Quality Assurance", auditedFiles: 280, defectsCaught: 18, accuracy: "99.8%", leakage: "0.00%", incentive: "$420" },
          { id: 2, auditorId: "QAG-02", name: "Inbakumar R", dept: "Quality Assurance", auditedFiles: 260, defectsCaught: 15, accuracy: "99.6%", leakage: "0.01%", incentive: "$390" },
          { id: 3, auditorId: "QAG-03", name: "Santhosh Kumar A", dept: "Quality Control", auditedFiles: 245, defectsCaught: 14, accuracy: "99.4%", leakage: "0.02%", incentive: "$360" },
          { id: 4, auditorId: "QAG-04", name: "Sundharesan T", dept: "Job Analysis & QA", auditedFiles: 230, defectsCaught: 12, accuracy: "99.2%", leakage: "0.03%", incentive: "$340" },
          { id: 5, auditorId: "QAG-05", name: "Vandhana T", dept: "Pre-Flight Review", auditedFiles: 220, defectsCaught: 10, accuracy: "99.1%", leakage: "0.03%", incentive: "$340" },
        ]
      };

    default:
      return {
        title: "Report",
        sub: "Production analytics and operational data",
        kpis: () => [
          { label: "Total Records", value: "100", sub: "Active records" },
          { label: "Completed", value: "95", sub: "Ready" },
          { label: "Accuracy", value: "99%", sub: "SLA Met" },
          { label: "Variance", value: "0", sub: "Clean" },
        ],
        columns: [
          { key: "id", label: "ID" },
          { key: "title", label: "Item" },
          { key: "status", label: "Status" }
        ],
        rows: []
      };
  }
}

export default function ReportsModule({ projects = [], tasks = [] }) {
  const reportIdFromLocation = () => {
    const routeId = window.location.pathname.match(/\/reports\/([^/]+)/)?.[1];
    return REPORT_LIST.some(report => report.id === routeId) ? routeId : "my-report";
  };
  const [activeReportId, setActiveReportId] = useState(reportIdFromLocation);
  const [navSearch, setNavSearch] = useState("");
  const [unit, setUnit] = useState("All Units");
  const [department, setDepartment] = useState("All Departments");
  const [user, setUser] = useState("All Users");
  const [startDate, setStartDate] = useState("2026-08-27");
  const [endDate, setEndDate] = useState("2026-08-29");
  const [reportTypeMode, setReportTypeMode] = useState("all"); // 'individual' or 'all'
  const [tableSearch, setTableSearch] = useState("");
  const [individualPeriod, setIndividualPeriod] = useState("Daily");
  const [individualDate, setIndividualDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedIndividual, setSelectedIndividual] = useState(null);
  const [liveAllocations, setLiveAllocations] = useState([]);
  const [serverReportData, setServerReportData] = useState(null);
  const [liveEmployees, setLiveEmployees] = useState([]);

  const selectReport = (id) => {
    setActiveReportId(id);
    setPage(1);
    setTableSearch("");
    window.history.pushState({}, "", `/reports/${id}`);
  };

  useEffect(() => {
    const restoreRoute = () => setActiveReportId(reportIdFromLocation());
    window.addEventListener("popstate", restoreRoute);
    return () => window.removeEventListener("popstate", restoreRoute);
  }, []);

  useEffect(() => {
    fetch("/api/allocations")
      .then(response => response.json())
      .then(payload => {
        if (payload.ok && Array.isArray(payload.items)) setLiveAllocations(payload.items);
      })
      .catch(() => {});

    fetch("/api/employees")
      .then(response => response.json())
      .then(payload => {
        if (payload.ok && Array.isArray(payload.items)) setLiveEmployees(payload.items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setServerReportData(null);
    fetch(`/api/reports/${activeReportId}`)
      .then(res => res.json())
      .then(data => {
        if (alive && data && data.columns) {
          setServerReportData(data);
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [activeReportId]);

  // Filter the 28 reports list by user typing in the sidebar
  const filteredReportList = useMemo(() => {
    if (!navSearch.trim()) return REPORT_LIST;
    return REPORT_LIST.filter(r =>
      r.title.toLowerCase().includes(navSearch.toLowerCase()) ||
      r.category.toLowerCase().includes(navSearch.toLowerCase())
    );
  }, [navSearch]);

  // Current active report configuration
  const currentConfig = useMemo(() => {
    if (serverReportData && serverReportData.title) {
      return serverReportData;
    }
    return getReportConfig(activeReportId, projects, tasks);
  }, [serverReportData, activeReportId, projects, tasks]);

  const individualEmployees = useMemo(() => {
    if (liveEmployees.length > 0) {
      return liveEmployees.map(emp => ({
        id: emp.giEmpId || emp.empId || emp.id,
        name: emp.name,
        department: emp.department || "Production"
      }));
    }
    const source = liveAllocations.length ? liveAllocations : [];
    const map = new Map();
    source.forEach((row, index) => {
      const id = String(row.employeeId || row.employeeCode || row.empId || row.empIdValue || `EMP${String(index + 1).padStart(3, "0")}`).trim();
      const name = row.employee || row.employeeName || row.name || "Unassigned";
      const key = `${id}-${name}`;
      if (!map.has(key)) map.set(key, { id, name, department: row.department || row.dept || "Production" });
    });
    return [...map.values()];
  }, [liveEmployees, liveAllocations]);

  const individualRows = useMemo(() => {
    if (!selectedIndividual) return [];
    const selectedId = String(selectedIndividual.id).toLowerCase();
    const selectedName = String(selectedIndividual.name).toLowerCase();
    const source = liveAllocations.length ? liveAllocations : (tasks || []);
    const matched = source.filter(row => {
      const ids = [row.employeeId, row.employeeCode, row.empId].map(value => String(value || "").toLowerCase());
      const name = String(row.employee || row.employeeName || row.name || "").toLowerCase();
      return ids.includes(selectedId) || name === selectedName;
    });
    const rows = matched.length ? matched : (currentConfig.rows || []).filter(row => String(row.name || "").toLowerCase() === selectedName);
    const selected = individualDate ? new Date(`${individualDate}T00:00:00`) : new Date();
    const start = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
    let end;
    if (individualPeriod === "Weekly") {
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    } else if (individualPeriod === "Monthly") {
      start.setDate(1);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    } else {
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    }
    return rows.filter(row => {
      const timestamp = Number(row.statusUpdatedAt || row.ended || row.started || row.allocated || row.createdAt || 0);
      if (!timestamp) return true;
      return timestamp >= start.getTime() && timestamp < end.getTime();
    });
  }, [selectedIndividual, liveAllocations, tasks, currentConfig, individualDate, individualPeriod]);

  // Filter rows based on top dropdowns (Unit, Dept, User, and tableSearch)
  const displayedRows = useMemo(() => {
    let rows = currentConfig.rows || [];

    if (unit !== "All Units") {
      rows = rows.filter(r => !r.unit || r.unit === unit);
    }

    if (department !== "All Departments") {
      rows = rows.filter(r => !r.dept && !r.department ? true : (r.dept === department || r.department === department));
    }

    if (user !== "All Users") {
      rows = rows.filter(r => {
        const rowStr = JSON.stringify(r);
        return rowStr.includes(user);
      });
    }

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(val => String(val).toLowerCase().includes(q)));
    }

    return rows;
  }, [currentConfig, unit, department, user, tableSearch]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const paginatedRows = useMemo(() => {
    return displayedRows.slice((page - 1) * pageSize, page * pageSize);
  }, [displayedRows, page, pageSize]);

  const kpiData = useMemo(() => {
    return typeof currentConfig.kpis === "function" ? currentConfig.kpis(displayedRows) : (currentConfig.kpis || []);
  }, [currentConfig, displayedRows]);

  const handleResetFilters = () => {
    setUnit("All Units");
    setDepartment("All Departments");
    setUser("All Users");
    setStartDate("2026-08-27");
    setEndDate("2026-08-29");
    setTableSearch("");
    setReportTypeMode("all");
  };

  const handleExportCsv = () => {
    const headers = currentConfig.columns.map(c => c.label);
    const rows = displayedRows.map(r =>
      currentConfig.columns.map(c => {
        const val = r[c.key] !== undefined ? r[c.key] : "";
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",")
    );

    const csvContent = [headers.map(h => `"${h}"`).join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentConfig.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeReportObj = REPORT_LIST.find(r => r.id === activeReportId) || REPORT_LIST[0];
  const ActiveIcon = activeReportObj.icon;

  return (
    <div className="reports-suite-container">
      {/* Page Header */}
      <div className="reports-page-head">
        <div>
          <small>ANALYTICS & EXPORTS</small>
          <h1>Admin reports</h1>
          <p>Operational, quality, delivery and support reports integrated into FileFlow.</p>
        </div>
        <div className="reports-top-actions">
          <button className="primary" onClick={handleExportCsv}>
            <Download size={16} />
            Excel / CSV Export
          </button>
        </div>
      </div>

      <div className="reports admin-reports">
        {/* Report navigation stays inside the existing FMS content container. */}
        <aside className="panel reportnav">
          <div className="reportnav-header">
            <div className="reportnav-title-row">
              <h3>Report library</h3>
              <span className="reportnav-badge">{REPORT_LIST.length} Reports</span>
            </div>
            <div className="reportnav-search-box">
              <Search size={14} />
              <input
                type="text"
                value={navSearch}
                onChange={e => setNavSearch(e.target.value)}
                placeholder="Search 11 reports..."
              />
              {navSearch && (
                <button className="clear-search-btn" onClick={() => setNavSearch("")}>×</button>
              )}
            </div>
          </div>

          <div className="reportnav-list">
            {filteredReportList.map(item => {
              const Icon = item.icon;
              const isActive = activeReportId === item.id;
              return (
                <button
                  key={item.id}
                  className={`reportnav-item ${isActive ? "on" : ""}`}
                  onClick={() => selectReport(item.id)}
                  title={item.title}
                >
                  <span className="reportnav-icon-wrapper">
                    <Icon size={16} />
                  </span>
                  <span className="reportnav-text">{item.title}</span>
                  <ChevronRight size={14} className="reportnav-arrow" />
                </button>
              );
            })}
            {filteredReportList.length === 0 && (
              <div className="reportnav-empty">No reports matching "{navSearch}"</div>
            )}
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="panel report">
          {/* Active Report Header */}
          <div className="active-report-banner">
            <div className="active-report-title-group">
              <div className="active-report-icon-box">
                <ActiveIcon size={22} />
              </div>
              <div>
                <h2>{currentConfig.title}</h2>
                <p>{currentConfig.sub}</p>
              </div>
            </div>
            <div className="active-report-tag">
              <span>{activeReportObj.category}</span>
            </div>
          </div>

          {/* Legacy FMS Filter Toolbar: Unit Name, Dept, User Name, Dates, Radio, Reset */}
          <div className="report-toolbar-card">
            <div className="report-filters">
              <label>
                Unit Name
                <select value={unit} onChange={e => setUnit(e.target.value)}>
                  {UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </label>

              <label>
                Department Name
                <select value={department} onChange={e => setDepartment(e.target.value)}>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>

              <label>
                User Name
                <select value={user} onChange={e => setUser(e.target.value)}>
                  <option value="All Users">All Users</option>
                  {(liveEmployees.length ? liveEmployees.map(e => e.name) : EMPLOYEES).map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </label>

              <label>
                Start Date
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </label>

              <label>
                End Date
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </label>
            </div>

            {/* Filter Sub-row: Radio mode + Actions */}
            <div className="report-filter-bottom-bar">
              <div className="report-mode-radios">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="reportType"
                    checked={reportTypeMode === "all"}
                    onChange={() => setReportTypeMode("all")}
                  />
                  <span>All Batches / Units</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="reportType"
                    checked={reportTypeMode === "individual"}
                    onChange={() => setReportTypeMode("individual")}
                  />
                  <span>Individual Report</span>
                </label>
              </div>

              <div className="report-filter-actions">
                <button type="button" className="secondary reset-btn" onClick={handleResetFilters}>
                  <RotateCcw size={14} />
                  Reset
                </button>
                <button type="button" className="secondary export-btn" onClick={handleExportCsv}>
                  <FileSpreadsheet size={14} />
                  ExcelExport
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="report-kpis">
            {kpiData.map((kpi, idx) => (
              <article key={idx} className={kpi.status || ""}>
                <span>{kpi.label}</span>
                <b>{kpi.value}</b>
                <small>{kpi.sub}</small>
              </article>
            ))}
          </div>

          {activeReportId === "individual-report" && (
            <section className="individual-report-panel">
              <div className="individual-report-toolbar">
                <div>
                  <b>Employee Production Report</b>
                  <span>Select an employee ID or name to view complete production details.</span>
                </div>
                <div className="individual-period-controls">
                  {["Daily", "Weekly", "Monthly"].map(period => (
                    <button
                      key={period}
                      type="button"
                      className={individualPeriod === period ? "active" : ""}
                      onClick={() => setIndividualPeriod(period)}
                    >
                      {period}
                    </button>
                  ))}
                  <input type="date" value={individualDate} onChange={event => setIndividualDate(event.target.value)} />
                </div>
              </div>

              <div className="individual-employee-list">
                {individualEmployees.map(employee => (
                  <button
                    type="button"
                    key={`${employee.id}-${employee.name}`}
                    className={selectedIndividual?.id === employee.id && selectedIndividual?.name === employee.name ? "active" : ""}
                    onClick={() => setSelectedIndividual(employee)}
                  >
                    <UserCheck size={15} />
                    <span><b>{employee.id}</b><small>{employee.name}</small></span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>

              {selectedIndividual ? (
                <div className="individual-detail-table">
                  <div className="individual-detail-heading">
                    <div><b>{selectedIndividual.name}</b><span>{selectedIndividual.id} · {individualPeriod} report</span></div>
                    <strong>{individualRows.length} files</strong>
                  </div>
                  <div className="scroll">
                    <table>
                      <thead><tr><th>DATE</th><th>ISBN</th><th>PROJECT</th><th>PROCESS</th><th>STARTED</th><th>ENDED</th><th>WORKING TIME</th><th>STATUS</th><th>REMARKS</th></tr></thead>
                      <tbody>
                        {individualRows.length ? individualRows.map((row, index) => {
                          const started = Number(row.started || 0);
                          const ended = Number(row.ended || row.statusUpdatedAt || 0);
                          const workingSeconds = started && ended ? Math.max(0, Math.floor((ended - started) / 1000)) : 0;
                          const workingTime = `${String(Math.floor(workingSeconds / 3600)).padStart(2, "0")}:${String(Math.floor((workingSeconds % 3600) / 60)).padStart(2, "0")}:${String(workingSeconds % 60).padStart(2, "0")}`;
                          const formatDate = value => value ? new Date(Number(value)).toLocaleString() : "-";
                          return <tr key={row.id || row.allocationId || `${row.isbn}-${index}`}>
                            <td>{formatDate(row.statusUpdatedAt || row.allocated).split(",")[0]}</td>
                            <td><b>{row.isbn || "-"}</b></td>
                            <td>{row.projectName || row.project || row.projectId || "-"}</td>
                            <td>{row.process || row.workflowStage || row.workType || "-"}</td>
                            <td>{formatDate(row.started)}</td>
                            <td>{formatDate(row.ended)}</td>
                            <td><b className="individual-working-time">{workingTime}</b></td>
                            <td><span className="badge b-ready-for-allocation">{row.status || "Allocated"}</span></td>
                            <td>{row.statusReason || row.reason || row.remarks || row.reworkReason || "-"}</td>
                          </tr>;
                        }) : <tr><td colSpan="9" className="individual-empty">No production files found for this employee in the selected period.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : <div className="individual-empty">Click an employee ID or name above to open the production report.</div>}
            </section>
          )}

          {/* Table Container */}
          {activeReportId !== "individual-report" && <div className="report-table">
            <div className="report-table-title">
              <div className="table-title-left">
                <b>{currentConfig.title} Detailed Records</b>
                <span>Showing {displayedRows.length} active records</span>
              </div>
              <div className="table-search-box">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Filter within this report..."
                  value={tableSearch}
                  onChange={e => { setTableSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    {currentConfig.columns.map(col => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, rIdx) => (
                      <tr key={row.id || rIdx}>
                        {currentConfig.columns.map(col => {
                          const val = row[col.key];
                          // Status formatting
                          if (col.key === "status" || col.key === "overall" || col.key === "adherence") {
                            const isGood = ["Approved", "Pass", "Delivered & Verified", "Closed", "On Target", "Target Achieved", "Resolved", "Paid"].includes(val);
                            const isPending = ["In Progress", "Work In Progress", "Parallel WIP", "Pending Payment", "Pending Client Reply", "Ready to Bill", "In QC"].includes(val);
                            const isAlert = ["Delayed", "Critical Fix", "Minor Delay", "Flagged", "Reassigned"].includes(val);
                            return (
                              <td key={col.key}>
                                <span className={`badge ${isGood ? "b-completed" : isPending ? "b-work-in-progress" : isAlert ? "b-rework" : "b-ready-for-allocation"}`}>
                                  {val}
                                </span>
                              </td>
                            );
                          }
                          return (
                            <td key={col.key}>
                              {typeof val === "string" && val.includes("★") ? (
                                <span style={{ color: "#eab308", fontSize: "14px", letterSpacing: "1px" }}>{val}</span>
                              ) : (
                                <span>{val !== undefined ? val : "-"}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={currentConfig.columns.length} style={{ textAlign: "center", padding: "36px 14px", color: "var(--muted)" }}>
                        No records match the selected Unit, Department, User or date parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {displayedRows.length > 0 && (
              <Pagination
                currentPage={page}
                totalItems={displayedRows.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                itemName="records"
              />
            )}
          </div>}

          {/* Footer Info & Export */}
          <div className="reportbuttons report-download">
            <span>Period: {startDate} to {endDate} · Generated from active publishing pipeline</span>
            <button className="primary" onClick={handleExportCsv}>
              <Download size={15} />
              Export Visible Rows ({displayedRows.length}) as CSV
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
