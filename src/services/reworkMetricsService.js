/**
 * =============================================================================
 * METRICS CALCULATION SERVICE & DEMO DATASET
 * =============================================================================
 */

export const employeeProfiles = [];

export function getEmployeeInfo(name) {
  if (!name) {
    return {
      name: "",
      role: "",
      dept: "",
      color: "bg-slate-100 text-slate-700",
      border: "border-slate-200"
    };
  }
  const found = employeeProfiles.find(e => e.name.toUpperCase() === (name || '').toUpperCase());
  if (found) return found;
  return {
    name: name,
    role: "",
    dept: "",
    color: "bg-slate-100 text-slate-700",
    border: "border-slate-200"
  };
}

export function parseDate(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  return new Date(dateStr);
}

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getPeriodDisplayInfo(dateStr, period) {
  const dt = parseDate(dateStr);
  const d = dt.getDate();
  const m = dt.getMonth();
  const y = dt.getFullYear();
  const monthName = MONTH_NAMES[m];
  const monthShort = MONTH_SHORT[m];

  if (period === 'month') {
    return {
      pillText: `${monthName} ${y}`,
      longLabel: `Monthly Report - ${monthName} ${y}`,
      filterLabel: 'Month',
      trendTitle: `Weekly Trend (${monthShort} ${y})`,
      comparisonTitle: `Employee Comparison (${monthShort} ${y})`,
      scopeNotice: `Monthly scope for ${monthName} ${y}`
    };
  } else if (period === 'week') {
    const dayOfWeek = dt.getDay();
    const diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const mon = new Date(dt);
    mon.setDate(dt.getDate() + diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const monStr = `${String(mon.getDate()).padStart(2, '0')} ${MONTH_SHORT[mon.getMonth()]}`;
    const sunStr = `${String(sun.getDate()).padStart(2, '0')} ${MONTH_SHORT[sun.getMonth()]}`;
    const weekRange = `${monStr} - ${sunStr} ${sun.getFullYear()}`;

    return {
      pillText: `Week (${monStr} - ${sunStr})`,
      longLabel: `Weekly Report (${weekRange})`,
      filterLabel: 'Week',
      trendTitle: `Daily Trend (Week: ${monStr} - ${sunStr})`,
      comparisonTitle: `Employee Comparison (Weekly: ${monStr} - ${sunStr})`,
      scopeNotice: `Weekly scope (${weekRange})`
    };
  } else {
    const dStr = `${String(d).padStart(2, '0')} ${monthShort} ${y}`;
    return {
      pillText: dateStr || dStr,
      longLabel: `Daily Report (${dStr})`,
      filterLabel: 'Date',
      trendTitle: `Daily Trend (Last 7 Days)`,
      comparisonTitle: `Employee Comparison (Today: ${dStr})`,
      scopeNotice: `Daily scope (${dStr})`
    };
  }
}

export function calculateDashboardMetrics(employeeName, dateStr, period = 'day', filters = {}, persistentResolutions = {}) {
  const empName = employeeName || '';
  const info = getEmployeeInfo(empName);

  const dt = parseDate(dateStr);
  const d = dt.getDate();
  const m = dt.getMonth();
  const y = dt.getFullYear();
  const dayOfWeek = dt.getDay();

  const isBaseDay = (d === 5 && m === 8 && y === 2026);
  const dayId = Math.floor(dt.getTime() / (24 * 3600 * 1000));

  const diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const mon = new Date(dt);
  mon.setDate(dt.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);
  const weekId = Math.floor(mon.getTime() / (7 * 24 * 3600 * 1000));
  const isBaseWeek = (mon.getFullYear() === 2026 && mon.getMonth() === 7 && mon.getDate() === 31);

  const monthId = y * 12 + m;
  const isBaseMonth = (y === 2026 && m === 8);

  let seed = 0;
  for (let i = 0; i < empName.length; i++) seed = (seed * 31 + empName.charCodeAt(i)) % 10007;
  for (let i = 0; i < (dateStr || '').length; i++) seed = (seed * 17 + dateStr.charCodeAt(i)) % 10007;

  let assignedRework = 0;
  let totalReject = 0;
  let baseRatePct = 0.80;

  if (false) {
    if (period === 'month') {
      if (isBaseMonth) {
        assignedRework = 780;
        totalReject = 196;
        baseRatePct = 0.80;
      } else {
        const monthHash = Math.abs((monthId * 2654435761) ^ (monthId >> 16));
        const monthDelta = ((monthHash % 151) - 75);
        assignedRework = Math.max(550, 780 + monthDelta);
        const rejRatio = 0.22 + ((monthHash % 6) * 0.01);
        totalReject = Math.max(120, Math.round(assignedRework * rejRatio));
        const rateDelta = (((monthHash >> 3) % 9) - 4) * 0.01;
        baseRatePct = Math.min(0.90, Math.max(0.72, 0.80 + rateDelta));
      }
    } else if (period === 'week') {
      if (isBaseWeek) {
        assignedRework = 185;
        totalReject = 48;
        baseRatePct = 0.80;
      } else {
        const weekHash = Math.abs((weekId * 2654435761) ^ (weekId >> 16));
        const weekDelta = ((weekHash % 49) - 24);
        assignedRework = Math.max(110, 185 + weekDelta);
        const rejRatio = 0.22 + ((weekHash % 7) * 0.01);
        totalReject = Math.max(20, Math.round(assignedRework * rejRatio));
        const rateDelta = (((weekHash >> 3) % 11) - 5) * 0.01;
        baseRatePct = Math.min(0.92, Math.max(0.70, 0.80 + rateDelta));
      }
    } else {
      if (isBaseDay) {
        assignedRework = 30;
        totalReject = 8;
        baseRatePct = 0.80;
      } else {
        const dayHash = Math.abs((dayId * 2654435761) ^ (dayId >> 16));
        const dayDelta = ((dayHash % 25) - 11);
        assignedRework = Math.max(12, 30 + dayDelta);
        const rejRatio = 0.20 + ((dayHash % 7) * 0.012);
        totalReject = Math.max(2, Math.round(assignedRework * rejRatio));
        const rateDelta = (((dayHash >> 3) % 15) - 6) * 0.01;
        baseRatePct = Math.min(0.95, Math.max(0.68, 0.80 + rateDelta));
      }
    }
  } else {
    const empBase = 18 + (seed % 15);
    const empRej = 4 + (seed % 6);
    let eMult = 1;
    if (period === 'month') {
      const mHash = Math.abs((monthId * 2654435761) ^ (monthId >> 16));
      eMult = 26.0 + (((mHash % 9) - 4) * 0.5);
    } else if (period === 'week') {
      const wHash = Math.abs((weekId * 2654435761) ^ (weekId >> 16));
      eMult = 6.16 + (((wHash % 7) - 3) * 0.2);
    } else {
      const dHash = Math.abs((dayId * 2654435761) ^ (dayId >> 16));
      eMult = 1.0 + (((dHash % 7) - 3) * 0.08);
    }
    assignedRework = Math.max(5, Math.round(empBase * eMult));
    totalReject = Math.max(2, Math.round(empRej * eMult));
    baseRatePct = Math.min(0.95, Math.max(0.65, 0.78 + (((seed + dayId) % 15) - 7) * 0.01));
  }

  const userFixedCount = Object.keys(persistentResolutions).filter(k => k.startsWith(empName + '_')).length;
  
  const baseCorrected = Math.round(assignedRework * baseRatePct);
  let correctedCount = Math.min(assignedRework, baseCorrected + userFixedCount);
  let pendingCount = Math.max(0, assignedRework - correctedCount);
  let recoveryRate = assignedRework > 0 ? ((correctedCount / assignedRework) * 100).toFixed(2) : "100.00";

  let scanIssues = 0, qcIssues = 0, qagIssues = 0;
  if (info.dept === 'Scanning') {
    scanIssues = Math.max(1, Math.round((assignedRework + totalReject) * 0.65));
    qcIssues = Math.max(1, Math.round((assignedRework + totalReject) * 0.25));
    qagIssues = Math.max(1, (assignedRework + totalReject) - scanIssues - qcIssues);
  } else if (info.dept === 'QC') {
    scanIssues = Math.max(1, Math.round((assignedRework + totalReject) * 0.25));
    qcIssues = Math.max(1, Math.round((assignedRework + totalReject) * 0.60));
    qagIssues = Math.max(1, (assignedRework + totalReject) - scanIssues - qcIssues);
  } else {
    scanIssues = Math.max(1, Math.round((assignedRework + totalReject) * 0.20));
    qcIssues = Math.max(1, Math.round((assignedRework + totalReject) * 0.30));
    qagIssues = Math.max(1, (assignedRework + totalReject) - scanIssues - qcIssues);
  }

  const totalComp = Math.round((assignedRework * 3.8) + (seed % 20));
  const rewPct = totalComp > 0 ? ((assignedRework / totalComp) * 100).toFixed(2) : "7.80";
  const rejPct = totalComp > 0 ? ((totalReject / totalComp) * 100).toFixed(2) : "2.10";

  const bookTitles = [
    "Tamil Classical Poetry Vol 1",
    "Modern Indian History (1857-1947)",
    "Advanced Physics & Mechanics",
    "Higher Secondary Mathematics XII",
    "World Geography & Cartography",
    "Organic Chemistry Digest",
    "Botanical Survey & Plant Atlas",
    "Zoological Classification Pt 2",
    "Archaeological Treasures of South India",
    "English Linguistics & Phonetics",
    "Sanskrit Epics Compilation",
    "Economics & Trade Statistics",
    "Environmental Science Digest",
    "Microbiology Laboratory Manual",
    "Indian Constitutional Law",
    "Ancient Tamil Inscriptions",
    "Digital Image Processing Fundamentals",
    "Archival Documentation Standards"
  ];

  const allFiles = [];
  const reviewers = ['RAHUL', 'ARUN', 'PRIYA', 'MANOJ', 'BHAVANI', 'RAGU', 'DHARSHANA'];
  const reworkReasonPool = ['Image Quality', 'Cropping Issue', 'Alignment Issue', 'Missing Content', 'Skewed Pages'];
  const rejectReasonPool = ['Missing Page', 'Wrong Scan', 'Poor Quality', 'Incorrect File'];

  let fileIdBase = 101;
  let bookOffset = 0;
  let timeOffset = 0;

  if (period === 'month') {
    fileIdBase = isBaseMonth ? 101 : 100 + ((monthId * 37) % 750);
    bookOffset = isBaseMonth ? 0 : (monthId % bookTitles.length);
    timeOffset = monthId;
  } else if (period === 'week') {
    fileIdBase = isBaseWeek ? 101 : 100 + ((weekId * 23) % 750);
    bookOffset = isBaseWeek ? 0 : (weekId % bookTitles.length);
    timeOffset = weekId;
  } else {
    fileIdBase = isBaseDay ? 101 : 100 + ((dayId * 19) % 750);
    bookOffset = isBaseDay ? 0 : (dayId % bookTitles.length);
    timeOffset = dayId;
  }

  const numReject = Math.min(3, Math.max(1, Math.round(15 * (totalReject / (assignedRework + totalReject || 1)))));
  const numCleared = 2;
  const numRework = 15 - numReject - numCleared;
  const numReworkCorrected = Math.min(numRework, Math.max(2, Math.round(numRework * baseRatePct)));

  for (let i = 0; i < 15; i++) {
    const fileId = `BK-${String(fileIdBase + i)}`;
    const bookName = bookTitles[(i + bookOffset) % bookTitles.length];
    
    let stg = info.role || 'BOOK SCAN';
    if (i % 4 === 1 && (info.role === 'BOOK SCAN' || info.role === 'All')) stg = 'COVER SCAN';
    else if (i % 5 === 2) stg = 'QC';
    else if (i % 6 === 3) stg = 'QAG';

    let stat = 'REWORK';
    let reason = reworkReasonPool[(i + seed + timeOffset) % reworkReasonPool.length];
    let corrState = 'PENDING';
    let corrPct = 0;

    if (i >= (15 - numReject)) {
      stat = 'REJECT';
      reason = rejectReasonPool[(i + seed + timeOffset) % rejectReasonPool.length];
      corrState = 'REJECTED';
      corrPct = 0;
    } else if (i >= (15 - numReject - numCleared)) {
      stat = 'COMPLETED';
      reason = '-';
      corrState = 'CLEARED';
      corrPct = 100;
    } else {
      stat = 'REWORK';
      if (i < numReworkCorrected) {
        corrState = 'CORRECTED';
        corrPct = 100;
      } else {
        corrState = 'PENDING';
        corrPct = 0;
      }
    }

    if (persistentResolutions && persistentResolutions[`${empName}_${fileId}`]) {
      corrState = 'CORRECTED';
      corrPct = 100;
    }

    const rev = reviewers[(i + seed + timeOffset) % reviewers.length];
    const revStg = stg === 'BOOK SCAN' || stg === 'COVER SCAN' ? 'QC' : (stg === 'QC' ? 'QAG' : 'Admin');
    const hour = 9 + ((i + (timeOffset % 5)) % 8);
    const min = ((i * 19) + ((timeOffset * 7) % 59)) % 60;
    const ampm = (hour < 12) ? 'AM' : 'PM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const timeStr = `${String(displayHour).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;

    allFiles.push({
      file_id: fileId,
      book_name: bookName,
      work_stage: stg,
      completed_time: timeStr,
      checked_by: stat === 'COMPLETED' ? (i % 2 === 0 ? rev : '-') : rev,
      checked_stage: stat === 'COMPLETED' ? (i % 2 === 0 ? revStg : '-') : revStg,
      status: stat,
      reason: reason,
      correction_status: corrState,
      correction_pct: corrPct
    });
  }

  const roleFilter = filters.role || 'All';
  const statusFilter = filters.status || 'All';

  const filteredFiles = allFiles.filter(f => {
    if (roleFilter !== 'All' && f.work_stage !== roleFilter) return false;
    if (statusFilter !== 'All') {
      if (statusFilter === 'Completed' && (f.status !== 'COMPLETED' && f.correction_status !== 'CORRECTED')) return false;
      if (statusFilter === 'Rework' && f.status !== 'REWORK') return false;
      if (statusFilter === 'Rejected' && f.status !== 'REJECT') return false;
    }
    return true;
  });

  let activeRework = assignedRework;
  let activeReject = totalReject;
  let activeCorrected = correctedCount;
  let activePending = pendingCount;

  if (statusFilter === 'Rework') {
    activeReject = 0;
  } else if (statusFilter === 'Rejected') {
    activeRework = 0;
    activeCorrected = 0;
    activePending = 0;
  } else if (statusFilter === 'Completed') {
    activePending = 0;
    activeReject = 0;
  }

  let reworkReasons = [];
  if (statusFilter !== 'Rejected' && activeRework > 0) {
    reworkReasons = [
      { reason: 'Image Quality', count: Math.max(1, Math.round(activeRework * 0.38)), percentage: 38.0 },
      { reason: 'Cropping Issue', count: Math.max(1, Math.round(activeRework * 0.26)), percentage: 26.0 },
      { reason: 'Alignment Issue', count: Math.max(1, Math.round(activeRework * 0.18)), percentage: 18.0 },
      { reason: 'Missing Content', count: Math.max(1, Math.round(activeRework * 0.12)), percentage: 12.0 },
      { reason: 'Skewed Pages', count: Math.max(1, Math.round(activeRework * 0.06)), percentage: 6.0 }
    ];
  }

  let rejectReasons = [];
  if (statusFilter !== 'Rework' && activeReject > 0) {
    rejectReasons = [
      { reason: 'Missing Page', count: Math.max(1, Math.round(activeReject * 0.44)), percentage: 44.0 },
      { reason: 'Wrong Scan', count: Math.max(1, Math.round(activeReject * 0.25)), percentage: 25.0 },
      { reason: 'Poor Quality', count: Math.max(1, Math.round(activeReject * 0.19)), percentage: 19.0 },
      { reason: 'Incorrect File', count: Math.max(1, Math.round(activeReject * 0.12)), percentage: 12.0 }
    ];
  }

  const potentialReviewers = [
    { name: 'RAHUL', stage: 'QC', shareRew: 0.32, shareRej: 0.32 },
    { name: 'ARUN', stage: 'QAG', shareRew: 0.22, shareRej: 0.24 },
    { name: 'PRIYA', stage: 'QC', shareRew: 0.16, shareRej: 0.16 },
    { name: 'MANOJ', stage: 'QAG', shareRew: 0.12, shareRej: 0.12 },
    { name: 'BHAVANI', stage: 'QC', shareRew: 0.08, shareRej: 0.07 },
    { name: 'RAGU', stage: 'QAG', shareRew: 0.06, shareRej: 0.05 },
    { name: 'DHARSHANA', stage: 'QC', shareRew: 0.04, shareRej: 0.04 }
  ];

  const reviewerList = potentialReviewers.map(r => {
    const empInf = getEmployeeInfo(r.name);
    return {
      reviewer: r.name,
      stage: r.stage,
      role: empInf.role,
      rework: Math.max(0, Math.round(activeRework * r.shareRew)),
      reject: Math.max(0, Math.round(activeReject * r.shareRej))
    };
  });

  let trendDays = [];
  if (period === 'month') {
    const mShort = MONTH_SHORT[m];
    trendDays = [
      { date: `${mShort} W1`, rework: Math.round(activeRework * 0.23), reject: Math.round(activeReject * 0.22), completed: Math.round(activeCorrected * 0.22), rework_rate: (parseFloat(rewPct) * 1.05).toFixed(2) },
      { date: `${mShort} W2`, rework: Math.round(activeRework * 0.26), reject: Math.round(activeReject * 0.25), completed: Math.round(activeCorrected * 0.25), rework_rate: (parseFloat(rewPct) * 1.02).toFixed(2) },
      { date: `${mShort} W3`, rework: Math.round(activeRework * 0.24), reject: Math.round(activeReject * 0.26), completed: Math.round(activeCorrected * 0.26), rework_rate: (parseFloat(rewPct) * 0.95).toFixed(2) },
      { date: `${mShort} W4`, rework: Math.round(activeRework * 0.27), reject: Math.round(activeReject * 0.27), completed: Math.round(activeCorrected * 0.27), rework_rate: (parseFloat(rewPct) * 0.98).toFixed(2) }
    ];
  } else if (period === 'week') {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    trendDays = dayNames.map((dName, idx) => {
      const wDay = new Date(mon);
      wDay.setDate(mon.getDate() + idx);
      const dNum = String(wDay.getDate()).padStart(2, '0');
      const mNum = String(wDay.getMonth() + 1).padStart(2, '0');
      return {
        date: `${dName} (${dNum}/${mNum})`,
        rework: Math.max(0, Math.round((activeRework / 7) + (((idx + weekId) % 5) - 2))),
        reject: Math.max(0, Math.round((activeReject / 7) + (((idx + weekId) % 3) - 1))),
        completed: Math.max(1, Math.round((activeCorrected / 7) + (((idx + weekId) % 4) - 1.5))),
        rework_rate: (parseFloat(rewPct) + (((idx + weekId) % 3 - 1) * 0.4)).toFixed(2)
      };
    });
  } else {
    trendDays = [];
    for (let offset = -6; offset <= 0; offset++) {
      const pDay = new Date(dt);
      pDay.setDate(dt.getDate() + offset);
      const pDayNum = String(pDay.getDate()).padStart(2, '0');
      const pMonStr = MONTH_SHORT[pDay.getMonth()];
      const idx = offset + 6;
      trendDays.push({
        date: `${pDayNum} ${pMonStr}`,
        rework: Math.max(0, Math.round(activeRework * (0.65 + (idx * 0.06) + (((dayId + idx) % 5) * 0.02)))),
        reject: Math.max(0, Math.round(activeReject * (0.55 + (idx * 0.08) + (((dayId + idx) % 3) * 0.03)))),
        completed: Math.max(1, Math.round(activeCorrected * (0.70 + (idx * 0.05) + (((dayId + idx) % 4) * 0.02)))),
        rework_rate: (parseFloat(rewPct) + (((idx + dayId) % 2 === 0 ? -0.3 : 0.4))).toFixed(2)
      });
    }
  }

  let compEmployees = employeeProfiles.map(e => e.name);
  if (roleFilter !== 'All') {
    const matchingEmps = employeeProfiles.filter(e => e.role === roleFilter).map(e => e.name);
    if (matchingEmps.length > 0) {
      compEmployees = matchingEmps.slice(0, 8);
      if (info.role === roleFilter && !compEmployees.includes(empName.toUpperCase())) {
        compEmployees.unshift(empName.toUpperCase());
      }
    }
  }
  const periodSeed = period === 'month' ? monthId : (period === 'week' ? weekId : dayId);
  const compList = compEmployees.map((name, idx) => {
    const empInfo = getEmployeeInfo(name);
    const isCurrent = name.toUpperCase() === empName.toUpperCase();
    if (isCurrent) {
      return {
        employee: name,
        role: empInfo.role,
        rework: activeRework,
        corrected: activeCorrected,
        pending: activePending,
        clearance_rate: `${recoveryRate}%`,
        reject: activeReject
      };
    }
    const empSeed = (seed + idx * 77 + periodSeed) % 50;
    const eRew = Math.round(activeRework * (0.8 + (empSeed * 0.008)));
    const eCorr = Math.round(eRew * (0.75 + (idx * 0.03)));
    const ePend = Math.max(0, eRew - eCorr);
    const eRej = Math.round(activeReject * (0.7 + (idx * 0.1)));
    return {
      employee: name,
      role: empInfo.role,
      rework: eRew,
      corrected: eCorr,
      pending: ePend,
      clearance_rate: `${((eCorr / eRew) * 100).toFixed(1)}%`,
      reject: eRej
    };
  });

  let filterDesc = [];
  if (roleFilter !== 'All') filterDesc.push(`Role: ${roleFilter}`);
  if (statusFilter !== 'All') filterDesc.push(`Status: ${statusFilter}`);
  const filterSuffix = filterDesc.length > 0 ? ` [${filterDesc.join(' • ')}]` : '';

  const displayInfo = getPeriodDisplayInfo(dateStr, period);

  return {
    period: period,
    displayInfo: displayInfo,
    periodLabel: displayInfo.longLabel + filterSuffix,
    employee: empName,
    date: dateStr,
    filters: filters,
    kpis: {
      total_completed: totalComp,
      rework: activeRework,
      reject: activeReject,
      total_defects: activeRework + activeReject,
      corrected_count: activeCorrected,
      pending_count: activePending,
      recovery_rate: recoveryRate,
      scan_issues: scanIssues,
      qc_issues: qcIssues,
      qag_issues: qagIssues,
      rework_rate: `${rewPct}%`,
      reject_rate: `${rejPct}%`,
      rework_events: Math.round(activeRework * 1.2),
      reject_events: Math.round(activeReject * 1.1)
    },
    distribution: {
      total: activeRework + activeReject,
      corrected: activeCorrected,
      pending: activePending,
      reject: activeReject,
      recovery_rate: recoveryRate,
      pending_pct: activeRework > 0 ? ((activePending / activeRework) * 100).toFixed(1) : "0.0"
    },
    stage_wise: {
      scan: { rework: scanIssues, corrected: Math.round(scanIssues * 0.82), reject: Math.round(activeReject * 0.45) },
      qc: { rework: qcIssues, corrected: Math.round(qcIssues * 0.78), reject: Math.round(activeReject * 0.35) },
      qag: { rework: qagIssues, corrected: Math.round(qagIssues * 0.74), reject: Math.round(activeReject * 0.20) }
    },
    daily_trend: trendDays,
    files: filteredFiles,
    rework_reasons: reworkReasons,
    reject_reasons: rejectReasons,
    reviewers: reviewerList,
    comparison: compList
  };
}


// Local storage resolution persistence
const RESOLUTION_STORAGE_KEY = 'fms_rework_resolutions';

export function getLocalResolutions() {
  try {
    const data = localStorage.getItem(RESOLUTION_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

export function saveLocalResolution(employee, fileId, metadata = {}) {
  const resolutions = getLocalResolutions();
  const key = employee.toUpperCase() + '::' + fileId;
  resolutions[key] = {
    employee,
    fileId,
    resolvedAt: new Date().toISOString(),
    status: 'Corrected',
    ...metadata
  };
  try {
    localStorage.setItem(RESOLUTION_STORAGE_KEY, JSON.stringify(resolutions));
  } catch (e) {
    console.warn('Could not save to localStorage', e);
  }
  return resolutions[key];
}

export function resetLocalResolutions() {
  try {
    localStorage.removeItem(RESOLUTION_STORAGE_KEY);
  } catch (e) {}
}

export async function fetchReworkHealth() {
  try {
    const res = await fetch('/api/health');
    if (res.ok) return await res.json();
  } catch (e) {}
  return { status: 'ok', mode: 'offline-interactive' };
}

export async function fetchReworkEmployees() {
  try {
    const res = await fetch('/api/employees');
    if (res.ok) return await res.json();
  } catch (e) {}
  return [];
}

export async function fetchReworkDashboard(employee, date, period = 'day', filters = {}) {
  try {
    const params = new URLSearchParams({
      employee: employee || '',
      date: date || '',
      period: period || 'day',
      role: filters.role || 'All',
      status: filters.status || 'All'
    });
    const res = await fetch('/api/dashboard?' + params.toString());
    if (res.ok) return await res.json();
  } catch (e) {}
  // When no backend data exists, return empty dashboard state
  const displayInfo = getPeriodDisplayInfo(date, period);
  return {
    period: period,
    displayInfo: displayInfo,
    periodLabel: displayInfo.longLabel,
    employee: employee || '',
    date: date,
    filters: filters,
    kpis: {
      total_completed: 0,
      rework: 0,
      reject: 0,
      total_defects: 0,
      corrected_count: 0,
      pending_count: 0,
      recovery_rate: "0.00",
      scan_issues: 0,
      qc_issues: 0,
      qag_issues: 0,
      rework_rate: "0.00%",
      reject_rate: "0.00%",
      rework_events: 0,
      reject_events: 0
    },
    distribution: {
      total: 0,
      corrected: 0,
      pending: 0,
      reject: 0,
      recovery_rate: "0.00",
      pending_pct: "0.0"
    },
    stage_wise: {
      scan: { rework: 0, corrected: 0, reject: 0 },
      qc: { rework: 0, corrected: 0, reject: 0 },
      qag: { rework: 0, corrected: 0, reject: 0 }
    },
    daily_trend: [],
    files: [],
    rework_reasons: [],
    reject_reasons: [],
    reviewers: [],
    comparison: []
  };
}

export async function resolveReworkFile(employee, fileId, metadata = {}) {
  try {
    const res = await fetch('/api/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee, fileId, metadata })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const saved = saveLocalResolution(employee, fileId, metadata);
  return { success: true, ...saved };
}
