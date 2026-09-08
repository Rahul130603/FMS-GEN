// Comprehensive Realistic Dummy Data for E-Publishing Daily Allotment Status Report

export const CURRENT_REPORT_DATE = "2026-09-05";
export const DISPLAY_REPORT_DATE = "05 Sep 2026";
export const SIMULATED_CURRENT_TIME = "17:00"; // 05:00 PM reference time

export const ROLES = [
  "POD Developer",
  "Cover Developer",
  "QC",
  "QAG"
];

export const PROJECTS = [
  "Peterlang",
  "ABC Publishing",
  "XYZ Publishing",
  "Springer Production",
  "Oxford Batch",
  "Cambridge Books"
];

export const DEPARTMENTS = [
  "Production",
  "Quality",
  "Design"
];

export const TEAMS = [
  "Team A",
  "Team B",
  "Team C",
  "Team D"
];

export const PRIORITY_LEVELS = [
  "Critical",
  "High",
  "Medium",
  "Low"
];

export const WORKLOAD_LEVELS = [
  "Low",
  "Normal",
  "High",
  "Very High"
];

export const DEADLINE_STATUSES = [
  "Safe",
  "Due Soon",
  "Delayed",
  "Overdue",
  "Completed"
];

export const STATUS_TYPES = [
  "Overdue",
  "Delayed",
  "No Activity",
  "Rework",
  "WIP",
  "Allocated",
  "Downloaded",
  "Uploaded",
  "QC",
  "QAG",
  "On Track",
  "Completed"
];

export const WORKFLOW_STAGES = [
  "Allocated",
  "Downloaded",
  "WIP",
  "Uploaded",
  "QC",
  "QAG",
  "Completed"
];

export const REWORK_REASONS = [
  "Text Formatting Issue",
  "Cover Alignment Issue",
  "Missing Font",
  "Image Quality Below 300 DPI",
  "PDF Preflight Error",
  "Incorrect File Naming",
  "Layout Margin Mismatch",
  "Metadata XML Error",
  "Missing Embedded Graphic",
  "QC Style Guide Correction"
];

export const QC_ERROR_TYPES = [
  "Naming Error",
  "Layout Issue",
  "Missing File",
  "Font Error",
  "Image DPI Issue",
  "XML Tagging Error"
];

// Helper to generate rich file history objects with ISBNs, QC errors, rework reasons
const generateDetailedFiles = (baseNumber, count, completedCount, wipCount, reworkCount, pendingCount, project, priority) => {
  const files = [];
  let remainingCompleted = completedCount;
  let remainingWip = wipCount;
  let remainingRework = reworkCount;
  let remainingPending = pendingCount;

  const sampleBookTitles = [
    "Digital Typography & Grid Systems",
    "Advances in Applied Linguistics",
    "Principles of Bioinorganic Chemistry",
    "European Economic History Vol. 4",
    "Contemporary Architectural Theory",
    "Neural Network Optimization Methods",
    "Handbook of Comparative Philosophy",
    "Clinical Immunology & Therapeutics",
    "Microeconomic Analysis 7th Ed.",
    "Urban Sociology in Global Context",
    "Statistical Foundations of Robotics",
    "Medieval Literature & Manuscript Studies",
    "Modern Cognitive Neuroscience",
    "Stochastic Processes in Finance",
    "Photonic Crystals & Waveguides"
  ];

  for (let i = 0; i < count; i++) {
    const rawNumber = baseNumber + (i * 137);
    const isbn13 = `9781394${String(rawNumber).padStart(6, '0')}`;
    let fileStatus = "Pending";
    let fileStage = "Allocated";
    let fileReworkCount = 0;
    let fileReworkReason = null;
    let fileQcErrors = [];
    let downloadTime = "09:15 AM";
    let uploadTime = null;
    const timeWindows = [
      "8.30 AM to 10.30 AM",
      "10.30 AM to 12.45 PM",
      "12.45 PM to 3.30 PM",
      "3.30 PM to 5.30 PM"
    ];
    let assignedWindow = timeWindows[i % 4];

    if (remainingCompleted > 0) {
      fileStatus = "Completed";
      fileStage = "Completed";
      const pastOrCurrentWindows = [
        "8.30 AM to 10.30 AM",
        "10.30 AM to 12.45 PM",
        "12.45 PM to 3.30 PM"
      ];
      assignedWindow = pastOrCurrentWindows[i % pastOrCurrentWindows.length];
      uploadTime = `0${1 + (i % 4)}:${20 + (i * 7) % 35} PM`;
      remainingCompleted--;
    } else if (remainingWip > 0) {
      fileStatus = "WIP";
      fileStage = "WIP";
      assignedWindow = (i % 2 === 0) ? "12.45 PM to 3.30 PM" : "3.30 PM to 5.30 PM";
      downloadTime = `09:${10 + (i * 3) % 45} AM`;
      remainingWip--;
    } else if (remainingRework > 0) {
      fileStatus = "Rework";
      fileStage = "QC";
      assignedWindow = "12.45 PM to 3.30 PM";
      fileReworkCount = 1;
      fileReworkReason = REWORK_REASONS[i % REWORK_REASONS.length];
      fileQcErrors.push({
        type: QC_ERROR_TYPES[i % QC_ERROR_TYPES.length],
        message: `${fileReworkReason} flagged during review`
      });
      uploadTime = "02:15 PM";
      remainingRework--;
    } else if (remainingPending > 0) {
      fileStatus = "Pending";
      fileStage = "Allocated";
      assignedWindow = "3.30 PM to 5.30 PM";
      downloadTime = "--";
      remainingPending--;
    }

    // Add extra random QC warning if in QC stage
    if (fileStage === "QC" && fileQcErrors.length === 0 && i % 2 === 0) {
      fileQcErrors.push({
        type: "Layout Issue",
        message: "Header baseline alignment discrepancy"
      });
    }

    files.push({
      isbn: isbn13,
      title: sampleBookTitles[i % sampleBookTitles.length],
      project: project,
      stage: fileStage,
      priority: (i === 0 && priority === "Critical") ? "Critical" : (i % 3 === 0) ? "High" : (i % 3 === 1) ? "Medium" : "Low",
      downloadTime: downloadTime,
      uploadTime: uploadTime || "--",
      timeWindow: assignedWindow,
      status: fileStatus,
      reworkCount: fileReworkCount,
      reworkReason: fileReworkReason,
      qcErrors: fileQcErrors,
      fileSize: `${(2.4 + (i * 1.3) % 18).toFixed(1)} MB`,
      format: (i % 3 === 0) ? "EPUB3 + Mobi" : (i % 3 === 1) ? "Print PDF + XML" : "Interactive PDF",
      totalPages: 180 + (i * 45) % 450
    });
  }

  return files;
};

// 40 Realistic Employee Records
export const INITIAL_EMPLOYEE_RECORDS = [];

// 2-Hour Report Tracking Windows for Employee Files Management
// Real-time status at ~2:18 PM: Slots 1 & 2 completed, Slot 3 active in progress, Slot 4 upcoming (empty)
export const TWO_HOUR_TRACKING_DATA = [
  { 
    slot: "Slot 1",
    timeWindow: "8.30 AM to 10.30 AM",
    shortTime: "8.30 - 10.30 AM",
    completed: 78, 
    target: 70, 
    qcPassed: 74,
    wip: 0,
    efficiency: 111,
    session: "Morning First Session",
    status: "Completed",
    isCurrent: false,
    isFuture: false
  },
  { 
    slot: "Slot 2",
    timeWindow: "10.30 AM to 12.45 PM",
    shortTime: "10.30 AM - 12.45 PM",
    completed: 142, 
    target: 130, 
    qcPassed: 136,
    wip: 0,
    efficiency: 109,
    session: "Pre-Lunch Session",
    status: "Completed",
    isCurrent: false,
    isFuture: false
  },
  { 
    slot: "Slot 3",
    timeWindow: "12.45 PM to 3.30 PM",
    shortTime: "12.45 - 3.30 PM",
    completed: 98, 
    target: 150, 
    qcPassed: 94,
    wip: 36,
    efficiency: 65,
    session: "Post-Lunch Session",
    status: "In Progress (Live)",
    isCurrent: true,
    isFuture: false
  },
  { 
    slot: "Slot 4",
    timeWindow: "3.30 PM to 5.30 PM",
    shortTime: "3.30 - 5.30 PM",
    completed: 0, 
    target: 105, 
    qcPassed: 0,
    wip: 0,
    efficiency: 0,
    session: "Evening Closing Session",
    status: "Upcoming (Empty)",
    isCurrent: false,
    isFuture: true
  }
];

// Historical full-day 2-hour report data (for past date selection)
export const HISTORICAL_TWO_HOUR_TRACKING_DATA = [
  { 
    slot: "Slot 1",
    timeWindow: "8.30 AM to 10.30 AM",
    shortTime: "8.30 - 10.30 AM",
    completed: 78, 
    target: 70, 
    qcPassed: 74,
    wip: 0,
    efficiency: 111,
    session: "Morning First Session",
    status: "Completed",
    isCurrent: false,
    isFuture: false
  },
  { 
    slot: "Slot 2",
    timeWindow: "10.30 AM to 12.45 PM",
    shortTime: "10.30 AM - 12.45 PM",
    completed: 142, 
    target: 130, 
    qcPassed: 136,
    wip: 0,
    efficiency: 109,
    session: "Pre-Lunch Session",
    status: "Completed",
    isCurrent: false,
    isFuture: false
  },
  { 
    slot: "Slot 3",
    timeWindow: "12.45 PM to 3.30 PM",
    shortTime: "12.45 - 3.30 PM",
    completed: 165, 
    target: 150, 
    qcPassed: 158,
    wip: 0,
    efficiency: 110,
    session: "Post-Lunch Session",
    status: "Completed",
    isCurrent: false,
    isFuture: false
  },
  { 
    slot: "Slot 4",
    timeWindow: "3.30 PM to 5.30 PM",
    shortTime: "3.30 - 5.30 PM",
    completed: 112, 
    target: 105, 
    qcPassed: 107,
    wip: 0,
    efficiency: 106,
    session: "Evening Closing Session",
    status: "Completed",
    isCurrent: false,
    isFuture: false
  }
];

export const getTwoHourTrackingData = (dateStr) => {
  return [
    { slot: 'Slot 1', timeWindow: '8.30 AM to 10.30 AM', completed: 0, qcPassed: 0, target: 0, session: 'Morning 1', shortTime: '8:30-10:30', isCurrent: false, isFuture: false },
    { slot: 'Slot 2', timeWindow: '10.30 AM to 12.45 PM', completed: 0, qcPassed: 0, target: 0, session: 'Morning 2', shortTime: '10:30-12:45', isCurrent: false, isFuture: false },
    { slot: 'Slot 3', timeWindow: '12.45 PM to 3.30 PM', completed: 0, qcPassed: 0, target: 0, session: 'Afternoon 1', shortTime: '12:45-3:30', isCurrent: false, isFuture: false },
    { slot: 'Slot 4', timeWindow: '3.30 PM to 5.30 PM', completed: 0, qcPassed: 0, target: 0, session: 'Evening Wrap', shortTime: '3:30-5:30', isCurrent: false, isFuture: false }
  ];
};

// Backwards-compatible HOURLY_PRODUCTIVITY_DATA pointing to 2-hour report slots
export const HOURLY_PRODUCTIVITY_DATA = TWO_HOUR_TRACKING_DATA.map(d => ({
  hour: d.shortTime,
  timeWindow: d.timeWindow,
  completed: d.completed,
  target: d.target,
  qcPassed: d.qcPassed,
  wip: d.wip,
  efficiency: d.efficiency,
  session: d.session
}));

// Expanded Recent Activities with Category Tags
export const RECENT_ACTIVITIES = [];

// Default Saved Preset Views
export const DEFAULT_SAVED_PRESETS = [
  {
    id: "preset-1",
    name: "QC Specialist",
    filters: { role: "QC", status: "" }
  },
  {
    id: "preset-2",
    name: "POD Developers",
    filters: { role: "POD Developer", status: "" }
  },
  {
    id: "preset-3",
    name: "No Activity",
    filters: { status: "No Activity", role: "" }
  },
  {
    id: "preset-4",
    name: "Work In Progress",
    filters: { status: "WIP", role: "" }
  },
  {
    id: "preset-5",
    name: "Completed",
    filters: { status: "Completed", role: "" }
  }
];

// Table Column Definitions
export const ALL_COLUMNS = [
  { key: 'employeeName', label: 'Employee Name', required: true },
  { key: 'employeeId', label: 'Emp ID', required: true },
  { key: 'role', label: 'Role', required: false },
  { key: 'allocated', label: 'Allocated', required: false },
  { key: 'dailyTarget', label: 'Target', required: false },
  { key: 'completed', label: 'Completed', required: false },
  { key: 'pending', label: 'Pending', required: false },
  { key: 'rework', label: 'Rework', required: false },
  { key: 'productivityScore', label: 'Productivity', required: false },
  { key: 'status', label: 'Status', required: true },
  { key: 'action', label: 'Action', required: true }
];

export const DEFAULT_VISIBLE_COLUMNS = {
  employeeName: true,
  employeeId: true,
  role: true,
  allocated: true,
  dailyTarget: true,
  completed: true,
  pending: true,
  rework: true,
  productivityScore: true,
  status: true,
  action: true
};

/**
 * Formats YYYY-MM-DD date into "05 Sep 2026"
 */
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(month, 10) - 1] || month;
    return `${day} ${monthName} ${year}`;
  } catch {
    return dateStr;
  }
};

/**
 * Returns deterministic past report employee records for any selected date
 */
export const getEmployeeRecordsForDate = (dateStr) => {
  return [];
};


