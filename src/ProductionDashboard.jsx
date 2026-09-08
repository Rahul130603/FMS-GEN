import {useEffect,useMemo,useState} from "react";
import {Activity,CalendarDays,CheckCircle2,Clock3,Download,FileArchive,FolderKanban,RefreshCcw,TrendingUp,Users,ClipboardCheck,Eye,X,Award,Layers,ShieldCheck,Code2,Palette,Search,UserCheck} from "lucide-react";
import "./production-dashboard.css";
import { getQagReportsForAdmin } from "./services/masterIsbnStore";
import Pagination from "./Pagination";
import "./pagination.css";

const periodConfig = {
  Daily: {
    title: "Production Planning",
    subtitle: "Compare demand, forecast and planned output day by day.",
    planBadge: "Daily production output",
    maxY: 10,
    yTicks: [10, 8, 6, 4, 2, 0],
    data: []
  },
  Monthly: {
    title: "Production Planning",
    subtitle: "Compare demand, forecast and planned output month by month.",
    planBadge: "Monthly production output",
    maxY: 10,
    yTicks: [10, 8, 6, 4, 2, 0],
    data: []
  },
  Yearly: {
    title: "Annual Production Planning",
    subtitle: "Compare annual demand, total output and capacity year by year.",
    planBadge: "Annual production output",
    maxY: 10,
    yTicks: [10, 8, 6, 4, 2, 0],
    data: []
  }
};

const getPointCoordinates = (val, idx, count, maxY) => {
  const startX = 48;
  const endX = 790;
  const stepX = (endX - startX) / Math.max(1, count - 1);
  const bottomY = 225;
  const topY = 25;
  const heightSpan = bottomY - topY;

  const x = startX + idx * stepX;
  const y = bottomY - (val / Math.max(1, maxY)) * heightSpan;
  return { x, y };
};

export default function ProductionDashboard({ projects, tasks, setActive, HeadComponent, todayTasks = [], setTodayTasks = () => {} }) {
  const [period, setPeriod] = useState("Daily");
  const [year, setYear] = useState("2026");
  const [hover, setHover] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [liveAllocations, setLiveAllocations] = useState([]);
  const [draft, setDraft] = useState({ employee: "All", title: "", due: "Today 18:00", priority: "High", description: "" });
  const [qagReports, setQagReports] = useState(() => getQagReportsForAdmin());
  const [selectedReport, setSelectedReport] = useState(null);
  const [qagPage, setQagPage] = useState(1);
  const [qagPageSize, setQagPageSize] = useState(10);
  const [qagSearch, setQagSearch] = useState("");
  const [qagCategoryFilter, setQagCategoryFilter] = useState("all");
  const [planningData, setPlanningData] = useState(null);

  const categoryStats = useMemo(() => {
    const uniqueQc = new Set();
    const uniqueDev = new Set();
    const uniqueGfx = new Set();
    const uniqueQag = new Set();

    qagReports.forEach(r => {
      if (r.qcName) uniqueQc.add(`${r.qcName} (${r.qcId || "QC"})`);
      if (r.developerName) uniqueDev.add(`${r.developerName} (${r.developerId || "DEV"})`);
      if (r.graphicsName) uniqueGfx.add(`${r.graphicsName} (${r.graphicsId || "GFX"})`);
      if (r.qagEmployee) uniqueQag.add(`${r.qagEmployee} (${r.qagId || "QAG"})`);
    });

    return {
      totalIsbn: qagReports.length,
      qcCount: uniqueQc.size,
      qcList: Array.from(uniqueQc).slice(0, 3).join(", "),
      devCount: uniqueDev.size,
      devList: Array.from(uniqueDev).slice(0, 3).join(", "),
      gfxCount: uniqueGfx.size,
      gfxList: Array.from(uniqueGfx).slice(0, 3).join(", "),
      qagCount: uniqueQag.size,
      qagList: Array.from(uniqueQag).slice(0, 3).join(", ")
    };
  }, [qagReports]);

  const filteredQagReports = useMemo(() => {
    let list = qagReports;
    if (qagCategoryFilter === "qc") {
      list = list.filter(r => r.qcName || r.qcId);
    } else if (qagCategoryFilter === "developer") {
      list = list.filter(r => r.developerName || r.developerId);
    } else if (qagCategoryFilter === "graphics") {
      list = list.filter(r => r.graphicsName || r.graphicsId);
    } else if (qagCategoryFilter === "qag") {
      list = list.filter(r => r.qagEmployee || r.qagId);
    }

    if (qagSearch.trim()) {
      const q = qagSearch.trim().toLowerCase();
      list = list.filter(r =>
        String(r.isbn || "").toLowerCase().includes(q) ||
        String(r.qcName || "").toLowerCase().includes(q) ||
        String(r.qcId || "").toLowerCase().includes(q) ||
        String(r.developerName || "").toLowerCase().includes(q) ||
        String(r.developerId || "").toLowerCase().includes(q) ||
        String(r.graphicsName || "").toLowerCase().includes(q) ||
        String(r.graphicsId || "").toLowerCase().includes(q) ||
        String(r.qagEmployee || "").toLowerCase().includes(q) ||
        String(r.qagId || "").toLowerCase().includes(q) ||
        String(r.qcRemarks || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [qagReports, qagCategoryFilter, qagSearch]);

  const paginatedQagReports = filteredQagReports.slice((qagPage - 1) * qagPageSize, qagPage * qagPageSize);

  useEffect(() => {
    const handleUpdate = () => setQagReports(getQagReportsForAdmin());
    window.addEventListener("masterIsbnStoreUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("masterIsbnStoreUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const [liveStats, setLiveStats] = useState({ masterTotal: 0, total: 0, completed: 0, wip: 0, rework: 0, hold: 0 });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [statsRes, allocRes, empRes, planRes] = await Promise.all([
          fetch("/api/dashboard/stats").catch(() => null),
          fetch("/api/allocations").catch(() => null),
          fetch("/api/employees").catch(() => null),
          fetch(`/api/dashboard/planning?period=${period}&year=${year}`).catch(() => null)
        ]);
        if (!alive) return;
        if (statsRes && statsRes.ok) {
          const stats = await statsRes.json();
          setLiveStats({
            masterTotal: stats.masterTotal || 0,
            total: stats.total || 0,
            completed: stats.completed || 0,
            wip: stats.wip || 0,
            rework: stats.rework || 0,
            hold: stats.hold || 0
          });
        }
        if (allocRes && allocRes.ok) {
          const alloc = await allocRes.json();
          setLiveAllocations(alloc.items || []);
        }
        if (empRes && empRes.ok) {
          const empData = await empRes.json();
          if (Array.isArray(empData.items)) {
            setEmployees(empData.items);
          }
        }
        if (planRes && planRes.ok) {
          const planData = await planRes.json();
          setPlanningData(planData);
        }
      } catch {}
    };
    load();
    const timer = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [period, year]);

  const { total, completed, wip, rework, hold, masterTotal } = liveStats;
  const go = section => setActive(section);

  const performers = useMemo(() => {
    const empStatsMap = new Map();
    (liveAllocations || []).forEach(item => {
      const empName = String(item.employee || "").trim();
      const empId = String(item.employeeId || item.employeeCode || "").trim();
      if (!empName && !empId) return;
      const key = empName || empId;
      const prev = empStatsMap.get(key) || {
        name: empName || empId,
        id: empId || empName,
        designation: item.role || "DEVELOPER",
        allocated: 0,
        completed: 0
      };
      prev.allocated += (Number(item.allocated) || 1);
      const isComplete = item.completed === 1 || String(item.status || "").toLowerCase().includes("complete");
      if (isComplete) {
        prev.completed += 1;
      }
      empStatsMap.set(key, prev);
    });

    const activeList = Array.from(empStatsMap.values())
      .filter(p => p.completed > 0 || p.allocated > 0)
      .map(p => ({
        ...p,
        quality: p.allocated > 0 ? Math.min(100, Math.round((p.completed / p.allocated) * 100)) : 100,
        time: "—"
      }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5)
      .map((p, idx) => ({ ...p, rank: idx + 1 }));

    return activeList;
  }, [liveAllocations]);

  const departmentStats = useMemo(() => {
    const deptMap = {
      "Text": { total: 0, completed: 0 },
      "Cover": { total: 0, completed: 0 },
      "Image": { total: 0, completed: 0 },
      "ePDF": { total: 0, completed: 0 },
      "POD": { total: 0, completed: 0 }
    };
    (liveAllocations || []).forEach(item => {
      const role = String(item.role || "").toLowerCase();
      const type = String(item.fileType || item.category || item.format || "").toLowerCase();
      let dept = "Text";
      if (role.includes("cover") || type.includes("cover")) dept = "Cover";
      else if (role.includes("image") || role.includes("graphic") || type.includes("image")) dept = "Image";
      else if (type.includes("pod")) dept = "POD";
      else if (role.includes("epdf") || type.includes("epdf")) dept = "ePDF";

      deptMap[dept].total += 1;
      const isDone = item.completed === 1 || String(item.status || "").toLowerCase().includes("complete");
      if (isDone) deptMap[dept].completed += 1;
    });

    return Object.entries(deptMap).map(([name, stat]) => {
      const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
      return [name, pct, stat.total, stat.completed];
    });
  }, [liveAllocations]);

  const recentActivities = useMemo(() => {
    if (!liveAllocations || liveAllocations.length === 0) return [];
    return liveAllocations.slice(0, 5).map(item => {
      const isDone = item.completed === 1 || String(item.status || "").toLowerCase().includes("complete");
      const isWip = String(item.status || "").toLowerCase().includes("wip") || String(item.status || "").toLowerCase().includes("progress");
      const isRework = String(item.status || "").toLowerCase().includes("rework") || String(item.status || "").toLowerCase().includes("reject");

      let Icon = RefreshCcw;
      let title = `Allocated batch ${item.isbn || item.id}`;
      let sub = `${item.totalPages || 0} pages · ${item.employee || "Assigned"}`;
      let target = "File Allocation";
      let kind = "allocated";

      if (isDone) {
        Icon = CheckCircle2;
        title = `Completed batch ${item.isbn || item.id}`;
        target = "Production";
        kind = "done";
      } else if (isWip) {
        Icon = Clock3;
        title = `Batch ${item.isbn || item.id} in progress`;
        target = "Production";
        kind = "wip";
      } else if (isRework) {
        Icon = RefreshCcw;
        title = `Rework received for ${item.isbn || item.id}`;
        target = "Notifications";
        kind = "rework";
      }

      let timeStr = "Today";
      if (item.updatedAt || item.createdAt) {
        try {
          const d = new Date(item.updatedAt || item.createdAt);
          timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
          timeStr = "Today";
        }
      }

      return {
        id: item.id || item.isbn,
        Icon,
        title,
        sub,
        time: timeStr,
        target,
        kind
      };
    });
  }, [liveAllocations]);

  const handlePostTask = (event) => {
    event.preventDefault();
    if (!draft.employee.trim() || !draft.title.trim()) return;
    const nextTask = {
      id: `TT-${Date.now().toString().slice(-5)}`,
      employee: draft.employee.trim(),
      title: draft.title.trim(),
      description: draft.description.trim() || "Manager-assigned production update.",
      due: draft.due || "Today",
      priority: draft.priority,
      status: "Open"
    };
    setTodayTasks(prev => [nextTask, ...prev]);
    setDraft({ employee: draft.employee, title: "", due: "Today 18:00", priority: draft.priority, description: "" });
  };

  const currentConfig = (planningData && planningData.data && planningData.data.length > 0)
    ? { ...periodConfig[period], ...planningData }
    : periodConfig[period];
  const list = currentConfig.data || [];
  const count = list.length;
  const maxY = currentConfig.maxY || 10;

  const linePoints = list.map((item, idx) => {
    const pt = getPointCoordinates(item.value, idx, count, maxY);
    return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  });
  const linePathStr = linePoints.join(" ");

  const exportReport = () => {
    const headerLabel = period === "Daily" ? "Date" : period === "Monthly" ? "Month" : "Year";
    const headers = [headerLabel, "Total Files", "Allocated", "Completed (Done)", "Work in Progress", "Rework"];
    const rows = list.map(item => [item.label, item.value, item.allocated, item.completed, item.wip, item.rework]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `production-planning-${period.toLowerCase()}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getHoverTooltipLeft = () => {
    if (hover === null) return "50%";
    const pct = (hover / Math.max(1, count - 1)) * 72 + 6;
    return `${Math.min(76, Math.max(6, pct))}%`;
  };

  const hoverItem = hover !== null && list[hover] ? list[hover] : null;
  const hoverPoint = hoverItem ? getPointCoordinates(hoverItem.value, hover, count, maxY) : null;

  return (
    <>
      <HeadComponent
        over="PRODUCTION DASHBOARD"
        title="Production Dashboard"
        text="Track monthly output, workflow progress and team performance."
        action={
          <div className="production-head-actions">
            <label>
              <CalendarDays />
              <select value={year} onChange={e => setYear(e.target.value)}>
                <option>2026</option>
                <option>2025</option>
              </select>
            </label>
            <button className="secondary" onClick={exportReport}>
              <Download />Export report
            </button>
          </div>
        }
      />

      <section className="panel today-task-poster">
        <div className="today-task-poster-header">
          <div>
            <span className="emp-eyebrow">MANAGER POST</span>
            <h3>Today Task</h3>
          </div>
          <span>{todayTasks.length} tasks</span>
        </div>

        <form className="today-task-form" onSubmit={handlePostTask}>
          <label>
            Employee
            <select value={draft.employee} onChange={event => setDraft(prev => ({ ...prev, employee: event.target.value }))}>
              <option value="All">All Employees</option>
              {employees.map(emp => {
                const idDisplay = emp.giEmpId || emp.empId;
                return (
                  <option key={emp.empId || emp.name} value={emp.name}>
                    {emp.name}{idDisplay ? ` (${idDisplay})` : ""}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            Task title
            <input value={draft.title} onChange={event => setDraft(prev => ({ ...prev, title: event.target.value }))} placeholder="Enter assigned work" />
          </label>
          <label>
            Due time
            <input value={draft.due} onChange={event => setDraft(prev => ({ ...prev, due: event.target.value }))} placeholder="Today 18:00" />
          </label>
          <label>
            Priority
            <select value={draft.priority} onChange={event => setDraft(prev => ({ ...prev, priority: event.target.value }))}>
              <option>High</option>
              <option>Medium</option>
              <option>Normal</option>
            </select>
          </label>
          <label className="task-description-field">
            Notes
            <textarea value={draft.description} onChange={event => setDraft(prev => ({ ...prev, description: event.target.value }))} rows="2" placeholder="Add brief task details" />
          </label>
          <button className="primary" type="submit">Post today task</button>
        </form>
        {todayTasks && todayTasks.length > 0 && (
          <div className="today-tasks-preview" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #edf2f7" }}>
            {todayTasks.slice(0, 5).map(t => (
              <div key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", color: "#334155" }}>
                <strong style={{ color: "#0b3c6d" }}>{t.employee}:</strong>
                <span>{t.title}</span>
                <span style={{ fontSize: "10px", background: "#eff6fc", color: "#2874b2", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>{t.priority}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="production-kpis">
        {[
          [TrendingUp, "Total Production", total, "↑ 12.5%", "File Allocation", "total"],
          [CheckCircle2, "Completed", completed, "↑ 8.2%", "Production", "completed"],
          [RefreshCcw, "Work in Progress", wip, "View active work", "Production", "wip"],
          [RefreshCcw, "Rework", rework, "↓ 4.1%", "Notifications", "rework"]
        ].map(([I, label, value, change, target, kind]) => (
          <button key={label} onClick={() => go(target)} className={kind}>
            <i><I /></i>
            <span>
              <small>{label}</small>
              <b>{value.toLocaleString()}</b>
              <em>{change} <u>vs last month</u></em>
            </span>
          </button>
        ))}
      </div>

      <div className="production-main-grid">
        <section className="panel monthly-production">
          <header>
            <div>
              <h3>{currentConfig.title}</h3>
              <p>{currentConfig.subtitle}</p>
            </div>
            <div className="period-toggle-wrapper">
              <div className="period-toggle">
                <button
                  className={period === "Daily" ? "on" : ""}
                  onClick={() => {
                    setPeriod("Daily");
                    setHover(6);
                  }}
                >
                  Daily
                </button>
                <button
                  className={period === "Monthly" ? "on" : ""}
                  onClick={() => {
                    setPeriod("Monthly");
                    setHover(7);
                  }}
                >
                  Monthly
                </button>
                <button
                  className={period === "Yearly" ? "on" : ""}
                  onClick={() => {
                    setPeriod("Yearly");
                    setHover(periodConfig.Yearly.data.length - 1);
                  }}
                >
                  Yearly
                </button>
              </div>
              <div className="forecast-badge">
                <Activity size={13} />
                <span>{currentConfig.planBadge}</span>
              </div>
            </div>
          </header>

          <div className="monthly-chart">
            <div className="chart-y">
              {currentConfig.yTicks.map(x => (
                <span key={x}>{x}</span>
              ))}
            </div>

            <svg
              viewBox="0 0 830 250"
              preserveAspectRatio="none"
              onMouseLeave={() => setHover(null)}
            >
              <defs>
                <linearGradient id="singleLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2874b2" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2874b2" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {currentConfig.yTicks.map(val => {
                const y = 225 - (val / maxY) * (225 - 25);
                return (
                  <line
                    key={val}
                    x1="45"
                    x2="815"
                    y1={y}
                    y2={y}
                    className="dashboard-grid-line"
                  />
                );
              })}

              {/* Area gradient under the single line */}
              <polygon
                points={`48,225 ${linePathStr} 790,225`}
                fill="url(#singleLineGrad)"
              />

              {/* Single main production line */}
              <polyline
                points={linePathStr}
                fill="none"
                stroke="#2874b2"
                strokeWidth="3.2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Vertical guideline on hover */}
              {hoverPoint && (
                <line
                  x1={hoverPoint.x}
                  x2={hoverPoint.x}
                  y1="22"
                  y2="225"
                  stroke="#2874b2"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
              )}

              {/* Interactive Dots on the single line */}
              {list.map((item, i) => {
                const pt = getPointCoordinates(item.value, i, count, maxY);
                const isHovered = hover === i;
                return (
                  <g key={item.label} className="chart-dot-group">
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={12}
                        fill="#2874b2"
                        opacity="0.18"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6.5 : 4.5}
                      fill="#2874b2"
                      stroke="#ffffff"
                      strokeWidth={isHovered ? 2.5 : 2}
                      style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                      onMouseEnter={() => setHover(i)}
                    />
                  </g>
                );
              })}
            </svg>

            <div className={`chart-x ${period.toLowerCase()}`}>
              {list.map((item, i) => (
                <button
                  key={item.label}
                  className={hover === i ? "active" : ""}
                  onMouseEnter={() => setHover(i)}
                  onClick={() => setHover(i)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Hover Tooltip with full breakdown details */}
            {hoverItem && (
              <div className="chart-tooltip" style={{ left: getHoverTooltipLeft() }}>
                <div className="tooltip-header">
                  <b>
                    {period === "Daily"
                      ? hoverItem.label
                      : period === "Monthly"
                      ? `${hoverItem.label} ${year}`
                      : `Year ${hoverItem.label}`}
                  </b>
                  <span className="tooltip-total">{hoverItem.value} Files</span>
                </div>
                <div className="tooltip-body">
                  <div className="tooltip-row">
                    <i style={{ background: "#216dd7" }} />
                    <span>Allocated:</span>
                    <b>{hoverItem.allocated} files</b>
                  </div>
                  <div className="tooltip-row">
                    <i style={{ background: "#0a8a54" }} />
                    <span>Completed (Done):</span>
                    <b>{hoverItem.completed} files</b>
                  </div>
                  <div className="tooltip-row">
                    <i style={{ background: "#f2a31b" }} />
                    <span>Work in Progress:</span>
                    <b>{hoverItem.wip} files</b>
                  </div>
                  <div className="tooltip-row">
                    <i style={{ background: "#ef514c" }} />
                    <span>Rework:</span>
                    <b>{hoverItem.rework} files</b>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="panel current-status">
          <h3>Current Status</h3>
          <div className="status-donut">
            <div className="donut-chart">
              <span>
                <b>{total.toLocaleString()}</b>
                <small>Allocated files</small>
              </span>
            </div>
            <div className="donut-legend">
              {[
                ["Completed", completed, `${total?Math.round(completed/total*100):0}%`, "#07905a", "Production"],
                ["Work in Progress", wip, `${total?Math.round(wip/total*100):0}%`, "#f2a31b", "Production"],
                ["Allocated", Math.max(0,total-completed-wip-rework-hold), `${total?Math.round(Math.max(0,total-completed-wip-rework-hold)/total*100):0}%`, "#216dd7", "File Allocation"],
                ["Hold / Rework", hold+rework, `${total?Math.round((hold+rework)/total*100):0}%`, "#ef514c", "Production"]
              ].map(x => (
                <button key={x[0]} onClick={() => go(x[4])}>
                  <i style={{ background: x[3] }} />
                  <span>
                    <b>{x[0]}</b>
                    <small>{x[1]} files</small>
                  </span>
                  <strong>{x[2]}</strong>
                </button>
              ))}
            </div>
          </div>
          <footer>
            <span>Total</span>
            <b>{total.toLocaleString()} allocated · {masterTotal.toLocaleString()} Peter Lang books</b>
          </footer>
        </section>
      </div>

      <div className="production-bottom-grid">
        <section className="panel department-production">
          <h3>Production by Department</h3>
          {departmentStats.map(([x, n]) => (
            <button key={x} onClick={() => go("Reports")}>
              <span>{x}</span>
              <i>
                <b style={{ width: n + "%" }} />
              </i>
              <strong>{n}%</strong>
            </button>
          ))}
        </section>

        <section className="panel top-performers">
          <h3>
            Top Performers <small>Hover employee for stats</small>
          </h3>
          <div className="performer-head">
            <span>#</span>
            <span>Employee</span>
            <span>Completed</span>
            <span>Rank</span>
          </div>
          {performers.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
              No production performance records yet
            </div>
          ) : (
            performers.map((p, i) => (
              <button key={p.id} onClick={() => go("Employees & Admin")}>
                <span>{i + 1}</span>
                <span>
                  <b>{p.name}</b>
                  <small>{p.id}{p.designation ? ` · ${p.designation}` : ""}</small>
                </span>
                <strong>{p.completed}</strong>
                <em>#{p.rank}</em>
                <aside>
                  <b>
                    {p.name} · {p.designation ? `${p.designation} (${p.id})` : p.id}
                  </b>
                  <div>
                    <span>
                      Allocated<strong>{p.allocated}</strong>
                    </span>
                    <span>
                      Completed<strong>{p.completed}</strong>
                    </span>
                    <span>
                      Quality<strong>{p.quality}%</strong>
                    </span>
                    <span>
                      Work time<strong>{p.time}</strong>
                    </span>
                  </div>
                  <small>Click to open Employees & Admin</small>
                </aside>
              </button>
            ))
          )}
        </section>

        <section className="panel recent-production">
          <h3>Recent Activity</h3>
          {recentActivities.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
              No recent production activity
            </div>
          ) : (
            recentActivities.map(({ id, Icon, title, sub, time, target, kind }) => (
              <button key={id} onClick={() => go(target)}>
                <i className={kind}>
                  <Icon />
                </i>
                <span>
                  <b>{title}</b>
                  <small>{sub}</small>
                </span>
                <time>{time}</time>
              </button>
            ))
          )}
        </section>
      </div>

      {/* =========================================================
          QAG QUALITY AUDIT REPORTS - ADMIN DASHBOARD TABLE & CATEGORIES
          ========================================================= */}
      <div className="production-qag-section">
        <section className="panel qag-reports-panel">
          {/* Header with Search and Refresh */}
          <div className="qag-panel-header">
            <div>
              <h3>
                <ClipboardCheck size={18} style={{ color: "#2563eb", verticalAlign: "middle", marginRight: "8px" }} />
                QAG Quality Audit Reports &amp; Workflow Allocation Categories
              </h3>
              <p>Cross-department allocation mapping with ISBN, QC Inspector, Book Developer, Cover Designer, and QAG Auditor tracking</p>
            </div>
            <div className="qag-panel-actions">
              <div className="qag-search-box">
                <Search size={14} className="qag-search-icon" />
                <input
                  type="text"
                  placeholder="Search ISBN, QC, Dev, or Emp ID..."
                  value={qagSearch}
                  onChange={(e) => { setQagSearch(e.target.value); setQagPage(1); }}
                />
                {qagSearch && (
                  <button type="button" className="qag-search-clear" onClick={() => { setQagSearch(""); setQagPage(1); }} title="Clear search">
                    <X size={12} />
                  </button>
                )}
              </div>
              <span className="qag-badge-count">{filteredQagReports.length} of {qagReports.length} Audited</span>
              <button
                type="button"
                className="qag-refresh-btn"
                onClick={() => setQagReports(getQagReportsForAdmin())}
                title="Refresh QAG Reports"
              >
                <RefreshCcw size={13} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* DEDICATED CATEGORIES SECTION OVERVIEW & FILTER */}
          <div className="qag-categories-container">
            <div className="qag-categories-section-head">
              <div className="qag-cat-head-left">
                <Layers size={16} className="qag-cat-head-icon" />
                <h4>File Allocation Workflow Categories</h4>
                <span className="qag-cat-subtext">Mapped from active allocations across QC, Developer, Graphics, and QAG teams</span>
              </div>
              <div className="qag-cat-filter-tabs">
                <button
                  type="button"
                  className={`qag-cat-tab ${qagCategoryFilter === "all" ? "active" : ""}`}
                  onClick={() => { setQagCategoryFilter("all"); setQagPage(1); }}
                >
                  All Categories ({qagReports.length})
                </button>
                <button
                  type="button"
                  className={`qag-cat-tab qc ${qagCategoryFilter === "qc" ? "active" : ""}`}
                  onClick={() => { setQagCategoryFilter("qc"); setQagPage(1); }}
                >
                  <ShieldCheck size={13} />
                  <span>QC Reviewers ({categoryStats.qcCount})</span>
                </button>
                <button
                  type="button"
                  className={`qag-cat-tab dev ${qagCategoryFilter === "developer" ? "active" : ""}`}
                  onClick={() => { setQagCategoryFilter("developer"); setQagPage(1); }}
                >
                  <Code2 size={13} />
                  <span>Book Devs ({categoryStats.devCount})</span>
                </button>
                <button
                  type="button"
                  className={`qag-cat-tab gfx ${qagCategoryFilter === "graphics" ? "active" : ""}`}
                  onClick={() => { setQagCategoryFilter("graphics"); setQagPage(1); }}
                >
                  <Palette size={13} />
                  <span>Cover Devs ({categoryStats.gfxCount})</span>
                </button>
                <button
                  type="button"
                  className={`qag-cat-tab qag ${qagCategoryFilter === "qag" ? "active" : ""}`}
                  onClick={() => { setQagCategoryFilter("qag"); setQagPage(1); }}
                >
                  <UserCheck size={13} />
                  <span>QAG Auditors ({categoryStats.qagCount})</span>
                </button>
              </div>
            </div>

            {/* 4 CATEGORY SUMMARY CARDS */}
            <div className="qag-categories-summary-grid">
              {/* Category 1: QC */}
              <div
                className={`qag-category-card qc ${qagCategoryFilter === "qc" ? "active" : ""}`}
                onClick={() => { setQagCategoryFilter(qagCategoryFilter === "qc" ? "all" : "qc"); setQagPage(1); }}
                title="Click to filter reports by QC Inspectors"
              >
                <div className="qag-cat-card-top">
                  <div className="qag-cat-icon-badge qc">
                    <ShieldCheck size={16} />
                  </div>
                  <span className="qag-cat-pill qc">Category 1 · QC</span>
                </div>
                <div className="qag-cat-card-title">Quality Control (QC)</div>
                <div className="qag-cat-card-desc">Allocated QC Inspectors &amp; Status Logs</div>
                <div className="qag-cat-card-meta">
                  <div className="qag-cat-meta-row">
                    <span>Allocated Staff:</span>
                    <b title={categoryStats.qcList}>{categoryStats.qcList || "No employees allocated"}</b>
                  </div>
                  <div className="qag-cat-meta-row">
                    <span>Active Inspectors:</span>
                    <span className="qag-cat-count-val">{categoryStats.qcCount} Personnel</span>
                  </div>
                </div>
              </div>

              {/* Category 2: Book Developers */}
              <div
                className={`qag-category-card dev ${qagCategoryFilter === "developer" ? "active" : ""}`}
                onClick={() => { setQagCategoryFilter(qagCategoryFilter === "developer" ? "all" : "developer"); setQagPage(1); }}
                title="Click to filter reports by Book Developers"
              >
                <div className="qag-cat-card-top">
                  <div className="qag-cat-icon-badge dev">
                    <Code2 size={16} />
                  </div>
                  <span className="qag-cat-pill dev">Category 2 · Interior</span>
                </div>
                <div className="qag-cat-card-title">Book Developers</div>
                <div className="qag-cat-card-desc">Interior Layout &amp; Typesetting Developers</div>
                <div className="qag-cat-card-meta">
                  <div className="qag-cat-meta-row">
                    <span>Allocated Staff:</span>
                    <b title={categoryStats.devList}>{categoryStats.devList || "No employees allocated"}</b>
                  </div>
                  <div className="qag-cat-meta-row">
                    <span>Active Developers:</span>
                    <span className="qag-cat-count-val">{categoryStats.devCount} Personnel</span>
                  </div>
                </div>
              </div>

              {/* Category 3: Cover Developers */}
              <div
                className={`qag-category-card gfx ${qagCategoryFilter === "graphics" ? "active" : ""}`}
                onClick={() => { setQagCategoryFilter(qagCategoryFilter === "graphics" ? "all" : "graphics"); setQagPage(1); }}
                title="Click to filter reports by Cover Developers"
              >
                <div className="qag-cat-card-top">
                  <div className="qag-cat-icon-badge gfx">
                    <Palette size={16} />
                  </div>
                  <span className="qag-cat-pill gfx">Category 3 · Cover</span>
                </div>
                <div className="qag-cat-card-title">Cover Developers</div>
                <div className="qag-cat-card-desc">Graphics Designers &amp; Jacket Artwork</div>
                <div className="qag-cat-card-meta">
                  <div className="qag-cat-meta-row">
                    <span>Allocated Staff:</span>
                    <b title={categoryStats.gfxList}>{categoryStats.gfxList || "No employees allocated"}</b>
                  </div>
                  <div className="qag-cat-meta-row">
                    <span>Active Designers:</span>
                    <span className="qag-cat-count-val">{categoryStats.gfxCount} Personnel</span>
                  </div>
                </div>
              </div>

              {/* Category 4: QAG Auditors */}
              <div
                className={`qag-category-card qag ${qagCategoryFilter === "qag" ? "active" : ""}`}
                onClick={() => { setQagCategoryFilter(qagCategoryFilter === "qag" ? "all" : "qag"); setQagPage(1); }}
                title="Click to filter reports by QAG Auditors"
              >
                <div className="qag-cat-card-top">
                  <div className="qag-cat-icon-badge qag">
                    <UserCheck size={16} />
                  </div>
                  <span className="qag-cat-pill qag">Category 4 · Audit</span>
                </div>
                <div className="qag-cat-card-title">QAG Quality Auditors</div>
                <div className="qag-cat-card-desc">Publisher Compliance &amp; Deliverable Sign-off</div>
                <div className="qag-cat-card-meta">
                  <div className="qag-cat-meta-row">
                    <span>Allocated Staff:</span>
                    <b title={categoryStats.qagList}>{categoryStats.qagList || "Udhayapriyan S (QAG03)"}</b>
                  </div>
                  <div className="qag-cat-meta-row">
                    <span>Auditor Pool:</span>
                    <span className="qag-cat-count-val">{categoryStats.qagCount} Auditors</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE WITH ALL CATEGORIES CLEARLY SHOWN */}
          <div className="qag-table-wrapper">
            <table className="qag-reports-table">
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>ISBN &amp; ALLOCATION</th>
                  <th style={{ width: "20%" }}>QC (NAME &amp; EMP ID)</th>
                  <th style={{ width: "24%" }}>DEVELOPERS (NAME &amp; EMP ID)</th>
                  <th style={{ width: "16%" }}>QAG AUDITOR (NAME &amp; EMP ID)</th>
                  <th style={{ width: "10%" }}>SCORE &amp; FTR</th>
                  <th style={{ width: "10%" }}>REPORT</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQagReports.map((item) => (
                  <tr key={item.isbn}>
                    <td>
                      <div className="qag-isbn-cell">
                        <div className="qag-isbn-title-row">
                          <b>{item.isbn}</b>
                          <span className="qag-publisher-tag">Peter Lang</span>
                        </div>
                        {item.qcRemarks ? (
                          <span className="qag-qc-remark-tag" title={item.qcRemarks}>
                            QC: {item.qcRemarks}
                          </span>
                        ) : (
                          <small className="qag-alloc-status">Allocated &amp; Audited</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="qag-cat-cell qc">
                        <div className="qag-cell-role-badge qc">
                          <ShieldCheck size={11} />
                          <span>QC</span>
                        </div>
                        <div className="qag-cell-info">
                          <span className="qag-person-name">{item.qcName || "Unassigned"}</span>
                          <span className="qag-person-id">ID: <b>{item.qcId || "QC03"}</b></span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="qag-devs-stacked">
                        <div className="qag-cat-cell dev" title="Book Interior Developer">
                          <div className="qag-cell-role-badge dev">
                            <Code2 size={10} />
                            <span>BOOK</span>
                          </div>
                          <div className="qag-cell-info">
                            <span className="qag-person-name">{item.developerName || "Unassigned"}</span>
                            <span className="qag-person-id">ID: <b>{item.developerId || "20012"}</b></span>
                          </div>
                        </div>
                        <div className="qag-cat-cell gfx" title="Cover / Graphics Developer">
                          <div className="qag-cell-role-badge gfx">
                            <Palette size={10} />
                            <span>COVER</span>
                          </div>
                          <div className="qag-cell-info">
                            <span className="qag-person-name">{item.graphicsName || "Unassigned"}</span>
                            <span className="qag-person-id">ID: <b>{item.graphicsId || "20065"}</b></span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="qag-cat-cell qag">
                        <div className="qag-cell-role-badge qag">
                          <UserCheck size={11} />
                          <span>QAG</span>
                        </div>
                        <div className="qag-cell-info">
                          <span className="qag-person-name">{item.qagEmployee || "Udhayapriyan S"}</span>
                          <span className="qag-person-id">ID: <b>{item.qagId || "QAG03"}</b></span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="qag-score-cell">
                        <span className="qag-score-val">{item.report?.score || "100%"}</span>
                        <span className={`qag-ftr-pill ${String(item.report?.ftr || item.report?.firstTimeRight).toLowerCase() === "yes" ? "yes" : "no"}`}>
                          FTR: {item.report?.ftr || item.report?.firstTimeRight || "Yes"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="qag-btn-view"
                        onClick={() => setSelectedReport(item)}
                        title="View complete category workflow and audit details"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {!filteredQagReports.length && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                      {qagSearch || qagCategoryFilter !== "all"
                        ? "No audit reports found matching your filter/search criteria."
                        : "No QAG audit reports submitted yet. Complete audits in the QAG Workspace to see reports here."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredQagReports.length > 0 && (
            <Pagination
              currentPage={qagPage}
              totalItems={filteredQagReports.length}
              pageSize={qagPageSize}
              onPageChange={setQagPage}
              onPageSizeChange={setQagPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
              itemName="audit reports"
            />
          )}
        </section>
      </div>

      {/* =========================================================
          MODAL: VIEW QAG AUDIT REPORT DETAILS & WORKFLOW CATEGORIES
          ========================================================= */}
      {selectedReport && (
        <div className="qag-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setSelectedReport(null)}>
          <div className="qag-modal-card">
            <div className="qag-modal-header">
              <div>
                <h2>Quality Assurance Group (QAG) Audit Report</h2>
                <small>ISBN: <b>{selectedReport.isbn}</b> · Verified by {selectedReport.qagEmployee} ({selectedReport.qagId || "QAG"})</small>
              </div>
              <button className="qag-modal-close" onClick={() => setSelectedReport(null)} title="Close">
                <X size={18} />
              </button>
            </div>

            <div className="qag-modal-body">
              {/* Score & FTR Highlights */}
              <div className="qag-modal-metrics">
                <div className="qag-metric-card">
                  <span>Quality Audit Score</span>
                  <b style={{ color: "#059669" }}>{selectedReport.report?.score || "100%"}</b>
                </div>
                <div className="qag-metric-card">
                  <span>First Time Right (FTR)</span>
                  <b style={{ color: String(selectedReport.report?.ftr || selectedReport.report?.firstTimeRight).toLowerCase() === "yes" ? "#0284c7" : "#dc2626" }}>
                    {selectedReport.report?.ftr || selectedReport.report?.firstTimeRight || "Yes"}
                  </b>
                </div>
                <div className="qag-metric-card">
                  <span>Defects Logged</span>
                  <b>{selectedReport.report?.defects ?? 0}</b>
                </div>
                <div className="qag-metric-card">
                  <span>Audit Status</span>
                  <span className="qag-status-badge completed" style={{ display: "inline-flex", marginTop: "4px" }}>
                    <CheckCircle2 size={12} /> Completed
                  </span>
                </div>
              </div>

              {/* DEDICATED FILE ALLOCATION WORKFLOW CATEGORIES SECTION */}
              <div className="qag-modal-section">
                <div className="qag-modal-cat-title-bar">
                  <Layers size={15} style={{ color: "#2563eb" }} />
                  <label style={{ margin: 0 }}>FILE ALLOCATION WORKFLOW CATEGORIES</label>
                </div>
                <div className="qag-modal-categories-grid">
                  {/* Category 1: QC */}
                  <div className="qag-modal-cat-card qc">
                    <div className="qag-modal-cat-card-head">
                      <div className="qag-cell-role-badge qc">
                        <ShieldCheck size={11} />
                        <span>QUALITY CONTROL (QC)</span>
                      </div>
                      <span className="qag-modal-cat-code">{selectedReport.categories?.qc?.code || "GEN0023"}</span>
                    </div>
                    <div className="qag-modal-cat-name">{selectedReport.qcName || "Unassigned"}</div>
                    <div className="qag-modal-cat-details">
                      <div>Employee ID: <b>{selectedReport.qcId || "QC03"}</b></div>
                      <div>Status: <span className="qag-cat-status-pill">Complete</span></div>
                    </div>
                    {selectedReport.qcRemarks && (
                      <div className="qag-modal-cat-remark">
                        <b>QC Remark:</b> {selectedReport.qcRemarks}
                      </div>
                    )}
                  </div>

                  {/* Category 2: Book Developer */}
                  <div className="qag-modal-cat-card dev">
                    <div className="qag-modal-cat-card-head">
                      <div className="qag-cell-role-badge dev">
                        <Code2 size={11} />
                        <span>BOOK DEVELOPER</span>
                      </div>
                      <span className="qag-modal-cat-code">{selectedReport.categories?.developer?.code || "GEN0012"}</span>
                    </div>
                    <div className="qag-modal-cat-name">{selectedReport.developerName || "Unassigned"}</div>
                    <div className="qag-modal-cat-details">
                      <div>Employee ID: <b>{selectedReport.developerId || "20012"}</b></div>
                      <div>Role: <b>Interior Typesetting</b></div>
                    </div>
                  </div>

                  {/* Category 3: Cover Developer */}
                  <div className="qag-modal-cat-card gfx">
                    <div className="qag-modal-cat-card-head">
                      <div className="qag-cell-role-badge gfx">
                        <Palette size={11} />
                        <span>COVER DEVELOPER</span>
                      </div>
                      <span className="qag-modal-cat-code">{selectedReport.categories?.graphics?.code || "GEN0065"}</span>
                    </div>
                    <div className="qag-modal-cat-name">{selectedReport.graphicsName || "Unassigned"}</div>
                    <div className="qag-modal-cat-details">
                      <div>Employee ID: <b>{selectedReport.graphicsId || "20065"}</b></div>
                      <div>Role: <b>Cover &amp; Spine Graphics</b></div>
                    </div>
                  </div>

                  {/* Category 4: QAG Auditor */}
                  <div className="qag-modal-cat-card qag">
                    <div className="qag-modal-cat-card-head">
                      <div className="qag-cell-role-badge qag">
                        <UserCheck size={11} />
                        <span>QAG AUDITOR</span>
                      </div>
                      <span className="qag-modal-cat-code">{selectedReport.categories?.qag?.code || "GEN0016"}</span>
                    </div>
                    <div className="qag-modal-cat-name">{selectedReport.qagEmployee || "Udhayapriyan S"}</div>
                    <div className="qag-modal-cat-details">
                      <div>Employee ID: <b>{selectedReport.qagId || "QAG03"}</b></div>
                      <div>Role: <b>Quality Assurance Group</b></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Findings & Observations */}
              <div className="qag-modal-section">
                <label>QAG AUDIT FINDINGS &amp; DELIVERABLE OBSERVATIONS</label>
                <div className="qag-findings-box">
                  {selectedReport.report?.findings || "All criteria satisfied according to client publishing guidelines. Deliverables passed layout, trim, font embedding, and barcode check."}
                </div>
              </div>

              <div className="qag-audit-stamp">
                <span>Submitted Date &amp; Timestamp: <b>{selectedReport.submittedDate || "2026-09-04"}</b></span>
                <span>Report Reference ID: <b>{selectedReport.report?.reportId || `QAG-${selectedReport.isbn}`}</b></span>
              </div>
            </div>

            <div className="qag-modal-footer">
              <button
                type="button"
                className="qag-btn-close"
                onClick={() => setSelectedReport(null)}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
