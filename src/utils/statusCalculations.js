// Comprehensive Calculation Engine for Daily Allotment Status Report

export const STATUS_PRIORITY_MAP = {
  "Overdue": 1,
  "Delayed": 2,
  "No Activity": 3,
  "Rework": 4,
  "WIP": 5,
  "In Progress": 5,
  "Allocated": 6,
  "Downloaded": 7,
  "Uploaded": 8,
  "QC": 9,
  "QAG": 10,
  "On Track": 11,
  "Completed": 12
};

export const getStatusPriority = (status) => {
  return STATUS_PRIORITY_MAP[status] || 99;
};

export const PRIORITY_WEIGHT_MAP = {
  "Critical": 4,
  "High": 3,
  "Medium": 2,
  "Low": 1
};

export const getPriorityWeight = (priority) => {
  return PRIORITY_WEIGHT_MAP[priority] || 0;
};

/**
 * Calculates pending files safely (Allocated - Completed - WIP, never negative)
 */
export const calculatePending = (allocated, completed, wip) => {
  return Math.max(0, (allocated || 0) - (completed || 0) - (wip || 0));
};

/**
 * Calculates completion rate percentage
 */
export const calculateCompletionRate = (completed, allocated) => {
  if (!allocated || allocated <= 0) return 0;
  return Math.round((completed / allocated) * 100);
};

/**
 * Automatic Workload detection from allocated count
 * 0-10 Files: Low
 * 11-20 Files: Normal
 * 21-30 Files: High
 * 31+ Files: Very High
 */
export const getWorkloadLevel = (allocated) => {
  const count = allocated || 0;
  if (count <= 10) return "Low";
  if (count <= 20) return "Normal";
  if (count <= 30) return "High";
  return "Very High";
};

export const WORKLOAD_WEIGHT_MAP = {
  "Low": 1,
  "Normal": 2,
  "High": 3,
  "Very High": 4
};

/**
 * Daily Target achievement calculation
 */
export const calculateTargetAchievement = (completed, target) => {
  if (!target || target <= 0) return { percent: 0, label: "Behind Target", color: "#ef4444" };
  const percent = Math.round((completed / target) * 100);

  if (percent >= 100) return { percent, label: "Target Achieved", color: "#10b981" };
  if (percent >= 80) return { percent, label: "On Track", color: "#3b82f6" };
  if (percent >= 50) return { percent, label: "Needs Attention", color: "#f59e0b" };
  return { percent, label: "Behind Target", color: "#ef4444" };
};

/**
 * Deadline tracking calculation based on reference time 17:00 (5:00 PM)
 * Returns { deadlineStatus: Safe | Due Soon | Delayed | Overdue | Completed, remainingText }
 */
export const getDeadlineInfo = (dueTimeStr, status, completed, allocated) => {
  if (status === "Completed" || (allocated > 0 && completed >= allocated)) {
    return {
      deadlineStatus: "Completed",
      remainingText: "Completed Before Deadline",
      badgeColor: "#10b981",
      bgColor: "#ecfdf5",
      isLate: false
    };
  }

  if (!dueTimeStr || dueTimeStr === "--") {
    return {
      deadlineStatus: "Safe",
      remainingText: "No strict deadline",
      badgeColor: "#64748b",
      bgColor: "#f1f5f9",
      isLate: false
    };
  }

  // Parse dueTime HH:MM (24h)
  const parts = dueTimeStr.split(":");
  const dueHour = parseInt(parts[0], 10) || 17;
  const dueMinute = parseInt(parts[1], 10) || 0;
  const dueTotalMinutes = dueHour * 60 + dueMinute;

  // Reference simulated time: 17:00
  const refTotalMinutes = 17 * 60 + 0;
  const diffMinutes = dueTotalMinutes - refTotalMinutes;

  if (diffMinutes < 0) {
    const overdueMins = Math.abs(diffMinutes);
    const hrs = Math.floor(overdueMins / 60);
    const mins = overdueMins % 60;
    const text = hrs > 0 ? `Overdue by ${hrs}h ${mins}m` : `Overdue by ${mins}m`;

    if (status === "Delayed" || (completed / allocated >= 0.7)) {
      return {
        deadlineStatus: "Delayed",
        remainingText: text,
        badgeColor: "#f97316",
        bgColor: "#fff7ed",
        isLate: true
      };
    }

    return {
      deadlineStatus: "Overdue",
      remainingText: text,
      badgeColor: "#dc2626",
      bgColor: "#fef2f2",
      isLate: true
    };
  }

  // Remaining time
  const hrs = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  const text = hrs > 0 ? `Due in ${hrs}h ${mins > 0 ? mins + 'm' : ''}` : `Due in ${mins}m`;

  if (diffMinutes <= 120) { // <= 2 hours
    return {
      deadlineStatus: "Due Soon",
      remainingText: text,
      badgeColor: "#d97706",
      bgColor: "#fffbeb",
      isLate: false
    };
  }

  return {
    deadlineStatus: "Safe",
    remainingText: text,
    badgeColor: "#059669",
    bgColor: "#ecfdf5",
    isLate: false
  };
};

/**
 * Transparent Productivity Score Formula (0-100)
 * Completion Score (75%) + Activity Score (25%)
 */
export const calculateProductivityScore = (rec) => {
  const completionRate = calculateCompletionRate(rec.completed, rec.allocated);

  // Work activity score
  let activityScore = 75;
  if (rec.activityStatus === "Completed" || rec.status === "Completed") activityScore = 100;
  else if (rec.activityStatus === "Active") activityScore = 95;
  else if (rec.activityStatus === "Idle") activityScore = 50;
  else if (rec.activityStatus === "No Activity" || rec.status === "No Activity") activityScore = 0;

  const rawScore = (completionRate * 0.75) + (activityScore * 0.25);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let tier = "Needs Attention";
  let color = "#ef4444";
  if (score >= 90) {
    tier = "Excellent";
    color = "#10b981";
  } else if (score >= 75) {
    tier = "Good";
    color = "#3b82f6";
  } else if (score >= 60) {
    tier = "Average";
    color = "#f59e0b";
  }

  return { score, tier, color };
};

/**
 * Quality Score Formula (0-100)
 * qualityScore = ((completed - rework) / completed) * 100
 */
export const calculateQualityScore = (completed, rework) => {
  if (!completed || completed <= 0) {
    return { score: 0, tier: "No Completed Files", color: "#64748b" };
  }

  const raw = ((completed - (rework || 0)) / completed) * 100;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  let tier = "High Rework";
  let color = "#ef4444";
  if (score >= 95) {
    tier = "Excellent";
    color = "#10b981";
  } else if (score >= 85) {
    tier = "Good";
    color = "#3b82f6";
  } else if (score >= 70) {
    tier = "Needs Improvement";
    color = "#f59e0b";
  }

  return { score, tier, color };
};

/**
 * Manager Attention Identification
 * Evaluates which employees need urgent manager intervention for production bottlenecks
 */
export const getManagerAttentionList = (records) => {
  const flagged = [];

  records.forEach((rec) => {
    const completionRate = calculateCompletionRate(rec.completed, rec.allocated);
    const reworkCount = rec.rework || 0;
    const pendingSafe = calculatePending(rec.allocated, rec.completed, rec.wip);

    let riskLevel = null;
    let reason = "";
    let priorityWeight = 0;

    if (rec.status === "No Activity" || rec.activityStatus === "No Activity") {
      riskLevel = "High";
      reason = "No work activity detected";
      priorityWeight = 90;
    } else if (reworkCount >= 2) {
      riskLevel = "High";
      reason = `${pendingSafe} Pending • ${reworkCount} Rework Flagged`;
      priorityWeight = 85;
    } else if (completionRate < 45 && rec.allocated > 15) {
      riskLevel = "Medium";
      reason = `Low progress: only ${rec.completed} of ${rec.allocated} done (${completionRate}%)`;
      priorityWeight = 60;
    }

    if (riskLevel) {
      flagged.push({
        ...rec,
        riskLevel,
        reason,
        priorityWeight,
        completionRate
      });
    }
  });

  // Sort by urgency priority weight descending
  flagged.sort((a, b) => b.priorityWeight - a.priorityWeight);

  return flagged;
};

/**
 * Aggregates Team Performance
 */
export const calculateTeamPerformance = (records) => {
  const teams = ["Team A", "Team B", "Team C", "Team D"];

  return teams.map((teamName) => {
    const teamRecords = records.filter(r => r.team === teamName);
    const employees = teamRecords.length;
    const allocated = teamRecords.reduce((sum, r) => sum + (r.allocated || 0), 0);
    const completed = teamRecords.reduce((sum, r) => sum + (r.completed || 0), 0);
    const rework = teamRecords.reduce((sum, r) => sum + (r.rework || 0), 0);
    const wip = teamRecords.reduce((sum, r) => sum + (r.wip || 0), 0);
    const pending = Math.max(0, allocated - completed - wip);
    const completionRate = calculateCompletionRate(completed, allocated);

    return {
      teamName,
      employees,
      allocated,
      completed,
      pending,
      rework,
      completionRate
    };
  });
};

/**
 * Aggregates Project Progress for top projects
 */
export const calculateProjectProgress = (records) => {
  const projects = [
    "Peterlang",
    "ABC Publishing",
    "XYZ Publishing",
    "Springer Production",
    "Oxford Batch",
    "Cambridge Books"
  ];

  return projects.map((projectName) => {
    const projectRecords = records.filter(r => r.project === projectName);
    const allocated = projectRecords.reduce((sum, r) => sum + (r.allocated || 0), 0);
    const completed = projectRecords.reduce((sum, r) => sum + (r.completed || 0), 0);
    const rework = projectRecords.reduce((sum, r) => sum + (r.rework || 0), 0);
    const wip = projectRecords.reduce((sum, r) => sum + (r.wip || 0), 0);
    const pending = Math.max(0, allocated - completed - wip);
    const completionRate = calculateCompletionRate(completed, allocated);

    return {
      projectName,
      allocated,
      completed,
      pending,
      rework,
      completionRate,
      employeeCount: projectRecords.length
    };
  });
};

/**
 * Computes Dynamic Summary KPI Card Metrics with Yesterday Comparisons
 */
export const calculateKpiSummary = (records) => {
  let totalAllocated = 0;
  let totalWip = 0;
  let totalCompleted = 0;
  let totalPending = 0;
  let totalRework = 0;
  let totalOverdue = 0;
  const assignedEmployeesSet = new Set();

  let prevAllocated = 0;
  let prevCompleted = 0;
  let prevPending = 0;
  let prevRework = 0;
  let prevOverdue = 0;

  records.forEach((rec) => {
    totalAllocated += (rec.allocated || 0);
    totalWip += (rec.wip || 0);
    totalCompleted += (rec.completed || 0);
    totalRework += (rec.rework || 0);

    const pending = calculatePending(rec.allocated, rec.completed, rec.wip);
    totalPending += pending;

    const deadline = getDeadlineInfo(rec.dueTime, rec.status, rec.completed, rec.allocated);
    if (rec.status === "Overdue" || deadline.deadlineStatus === "Overdue") {
      totalOverdue++;
    }

    if (rec.allocated > 0) {
      assignedEmployeesSet.add(rec.employeeId || rec.employeeName);
    }

    // Previous day data
    prevAllocated += (rec.previousDayAllocated || rec.allocated || 0);
    prevCompleted += (rec.previousDayCompleted || Math.round((rec.completed || 0) * 0.88));
    prevPending += (rec.previousDayPending || Math.round((pending || 0) * 1.1));
    prevRework += (rec.previousDayRework || 0);
    prevOverdue += (rec.previousDayOverdue || 0);
  });

  const completionRate = calculateCompletionRate(totalCompleted, totalAllocated);
  const prevCompletionRate = calculateCompletionRate(prevCompleted, prevAllocated);

  // Dynamic comparison strings
  const completedDeltaPercent = prevCompleted > 0 
    ? Math.round(((totalCompleted - prevCompleted) / prevCompleted) * 100) 
    : 0;
  const pendingDeltaPercent = prevPending > 0 
    ? Math.round(((totalPending - prevPending) / prevPending) * 100) 
    : 0;
  const reworkDelta = totalRework - prevRework;
  const overdueDelta = totalOverdue - prevOverdue;

  return {
    totalAllocated,
    employeesAssigned: assignedEmployeesSet.size,
    totalWip,
    totalCompleted,
    totalPending,
    totalRework,
    totalOverdue,
    completionRate,
    comparisons: {
      allocated: `${totalAllocated >= prevAllocated ? '↑' : '↓'} ${Math.abs(totalAllocated - prevAllocated)} files vs yesterday`,
      completed: `${completedDeltaPercent >= 0 ? '↑ ' + completedDeltaPercent : '↓ ' + Math.abs(completedDeltaPercent)}% vs yesterday`,
      completedTrendClass: completedDeltaPercent >= 0 ? 'trend-up' : 'trend-warn',
      pending: `${pendingDeltaPercent <= 0 ? '↓ ' + Math.abs(pendingDeltaPercent) : '↑ ' + pendingDeltaPercent}% vs yesterday`,
      pendingTrendClass: pendingDeltaPercent <= 0 ? 'trend-up' : 'trend-warn',
      rework: `${reworkDelta <= 0 ? '↓ ' + Math.abs(reworkDelta) : '↑ ' + reworkDelta} vs yesterday`,
      reworkTrendClass: reworkDelta <= 0 ? 'trend-up' : 'trend-warn',
      overdue: `${overdueDelta <= 0 ? '↓ ' + Math.abs(overdueDelta) : '↑ ' + overdueDelta} vs yesterday`,
      overdueTrendClass: overdueDelta <= 0 ? 'trend-up' : 'trend-warn',
      rate: `${completionRate >= prevCompletionRate ? '↑' : '↓'} ${Math.abs(completionRate - prevCompletionRate)}% vs yesterday`
    }
  };
};

/**
 * Computes quick status breakdown counts (by employee count)
 */
export const calculateStatusBreakdown = (records) => {
  const breakdown = {
    "On Track": 0,
    "In Progress": 0,
    "Delayed": 0,
    "No Activity": 0,
    "Completed": 0,
    "Overdue": 0,
    "Rework": 0
  };

  records.forEach((rec) => {
    let s = rec.status;
    if (s === "WIP") s = "In Progress";
    if (breakdown[s] !== undefined) {
      breakdown[s]++;
    } else {
      breakdown[s] = (breakdown[s] || 0) + 1;
    }
  });

  return breakdown;
};

/**
 * Computes role-wise progress (allocated, completed, percentage)
 */
export const calculateRoleProgress = (records) => {
  const roles = [
    { key: "POD Developer", label: "POD Development" },
    { key: "Cover Developer", label: "Cover Development" },
    { key: "QC", label: "QC (Quality Control)" },
    { key: "QAG", label: "QAG (Quality Assurance)" }
  ];

  return roles.map(({ key, label }) => {
    const roleRecords = records.filter((r) => r.role === key);
    const allocated = roleRecords.reduce((sum, r) => sum + (r.allocated || 0), 0);
    const completed = roleRecords.reduce((sum, r) => sum + (r.completed || 0), 0);
    const percentage = allocated > 0 ? Math.round((completed / allocated) * 100) : 0;

    return {
      roleKey: key,
      label,
      allocated,
      completed,
      percentage,
      employeeCount: roleRecords.length
    };
  });
};

/**
 * Calculates individual employee file counts and status for a 2-hour reporting window
 */
export const getEmployeeTwoHourStats = (employee, slotTimeWindow, isToday = true) => {
  const isSlot4 = slotTimeWindow === '3.30 PM to 5.30 PM';

  // If viewing today's date and it's Slot 4 (3.30 PM to 5.30 PM), it is in the future (Empty / 0 files)
  if (isToday && isSlot4) {
    const slotTarget = Math.max(1, Math.round((employee.dailyTarget || employee.allocated) * 0.18));
    return {
      slotCompleted: 0,
      slotQcPassed: 0,
      slotTarget,
      slotStatus: 'Upcoming',
      isFuture: true
    };
  }

  let slotCompleted = 0;
  let slotQcPassed = 0;

  const files = employee.files || [];
  const matchingFiles = files.filter(f => f.timeWindow === slotTimeWindow);

  if (matchingFiles.length > 0) {
    matchingFiles.forEach(f => {
      if (f.status === 'Completed') {
        slotCompleted++;
        if (f.reworkCount === 0 && (!f.qcErrors || f.qcErrors.length === 0)) {
          slotQcPassed++;
        }
      }
    });
  }

  // Consistent fallback distribution using employee ID seed so numbers sum to total completed
  if (slotCompleted === 0 && employee.completed > 0) {
    const c = employee.completed;
    const seed = (employee.id || 1) % 4;

    if (isToday) {
      // For today, completed files are only distributed across Slot 1, Slot 2, and Slot 3 (Slot 4 is 0)
      let p1 = 0.25, p2 = 0.45, p3 = 0.30;
      if (seed === 1) { p1 = 0.30; p2 = 0.40; p3 = 0.30; }
      else if (seed === 2) { p1 = 0.22; p2 = 0.48; p3 = 0.30; }
      else if (seed === 3) { p1 = 0.28; p2 = 0.42; p3 = 0.30; }

      const s1 = Math.max(0, Math.round(c * p1));
      const s2 = Math.max(0, Math.round(c * p2));
      const s3 = Math.max(0, c - s1 - s2);

      if (slotTimeWindow === '8.30 AM to 10.30 AM') slotCompleted = s1;
      else if (slotTimeWindow === '10.30 AM to 12.45 PM') slotCompleted = s2;
      else if (slotTimeWindow === '12.45 PM to 3.30 PM') slotCompleted = s3;
    } else {
      // Historical past day distribution
      let p1 = 0.20, p2 = 0.35, p3 = 0.30, p4 = 0.15;
      if (seed === 1) { p1 = 0.25; p2 = 0.30; p3 = 0.30; p4 = 0.15; }
      else if (seed === 2) { p1 = 0.18; p2 = 0.38; p3 = 0.28; p4 = 0.16; }
      else if (seed === 3) { p1 = 0.22; p2 = 0.32; p3 = 0.32; p4 = 0.14; }

      const s1 = Math.max(0, Math.round(c * p1));
      const s2 = Math.max(0, Math.round(c * p2));
      const s3 = Math.max(0, Math.round(c * p3));
      const s4 = Math.max(0, c - s1 - s2 - s3);

      if (slotTimeWindow === '8.30 AM to 10.30 AM') slotCompleted = s1;
      else if (slotTimeWindow === '10.30 AM to 12.45 PM') slotCompleted = s2;
      else if (slotTimeWindow === '12.45 PM to 3.30 PM') slotCompleted = s3;
      else if (slotTimeWindow === '3.30 PM to 5.30 PM') slotCompleted = s4;
    }

    slotQcPassed = Math.max(0, slotCompleted - (employee.rework > 0 && seed === 0 ? 1 : 0));
  }

  const targetRatio = (slotTimeWindow === '10.30 AM to 12.45 PM' || slotTimeWindow === '12.45 PM to 3.30 PM') ? 0.32 : 0.18;
  const slotTarget = Math.max(1, Math.round((employee.dailyTarget || employee.allocated) * targetRatio));

  let slotStatus = 'On Track';
  if (slotCompleted >= slotTarget) slotStatus = 'Target Met';
  else if (slotCompleted === 0) slotStatus = employee.status === 'No Activity' ? 'No Activity' : 'In Progress';
  else slotStatus = 'Behind Pace';

  return {
    slotCompleted,
    slotQcPassed,
    slotTarget,
    slotStatus,
    isFuture: false
  };
};

