"use client";
import React, { useState, useEffect, useMemo } from "react";
import "./query.css";
import "./reports.css";
import "./allocation.css";
import "./allocation-project.css";
import "./project-details.css";
import "./interaction.css";
import "./requirements.css";
import "./employees.css";
import "./notification-readable.css";
import "./readability.css";
import "./responsive.css";
import "./projects-font.css";
import MailCorrections from "./MailCorrections";
import { MailCorrectionProvider } from "./mailCorrectionContext";
import DashboardMail from "./DashboardMail";
import MailCorrectionReport from "./MailCorrectionReport";
import AdminNotifications from "./AdminNotifications";
import NotificationCenter from "./NotificationCenter";
import FeedbackModule from "./FeedbackModule";
import Pagination from "./Pagination";
import CustomerSupport from "./CustomerSupport";
import ProductivityGraph from "./ProductivityGraph";
import ProductionDashboard from "./ProductionDashboard";
import EmployeeDetailProfile from "./EmployeeDetailProfile";
import EmployeeDirectory from "./EmployeeDirectory";
import EmployeeLiveWorkspace from "./EmployeeLiveWorkspace";
import BulkFileAllocation from "./BulkFileAllocation";
import ClientsModule from "./ClientsModule";
import IntegratedReportSuite, {
  INTEGRATED_REPORTS,
} from "./IntegratedReportSuite";
import Files from "./Files";
import appLogo from "./assets/logo.png";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  Eye,
  FileArchive,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareHeart,
  MessageSquareText,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import ClientProjects from "./ClientProjects.jsx";

const raw = [
  [
    "PRJ001",
    "9781394415106",
    "Exploring Management 2E",
    "John Wiley",
    "Artwork 1",
    "Graphics",
    "High",
    "In Progress",
    68,
    "14 Sep",
  ],
  [
    "PRJ002",
    "9781394472567",
    "Key Concepts in Economics U3",
    "John Wiley",
    "Artwork Correction 1",
    "Art",
    "Urgent",
    "QC Pending",
    44,
    "03 Sep",
  ],
  [
    "PRJ003",
    "9781119983412",
    "Financial Accounting 12E",
    "Cengage Learning",
    "Typesetting",
    "Composition",
    "Medium",
    "In Progress",
    57,
    "18 Sep",
  ],
  [
    "PRJ004",
    "9780137654218",
    "Introduction to Psychology 8E",
    "Pearson",
    "Proofreading",
    "Editorial",
    "Low",
    "Yet to Start",
    10,
    "24 Sep",
  ],
  [
    "PRJ005",
    "9780198876542",
    "Digital Marketing 4E",
    "Oxford University Press",
    "EPUB Creation",
    "Digital",
    "High",
    "Rework",
    73,
    "08 Sep",
  ],
  [
    "PRJ006",
    "9781108845127",
    "Modern Business Analytics 3E",
    "Cambridge University Press",
    "Printer File",
    "Prepress",
    "Medium",
    "Completed",
    100,
    "28 Aug",
  ],
  [
    "PRJ007",
    "9783031452789",
    "Applied Data Science",
    "Springer Nature",
    "XML Extraction",
    "Digital",
    "High",
    "In Progress",
    62,
    "21 Sep",
  ],
  [
    "PRJ008",
    "9780323991148",
    "Clinical Research Methods",
    "Elsevier",
    "Art QC",
    "Quality",
    "Urgent",
    "QC Pending",
    81,
    "06 Sep",
  ],
  [
    "PRJ009",
    "9781032419876",
    "Sustainable Engineering",
    "Taylor & Francis",
    "Content Proof Reading",
    "Editorial",
    "Medium",
    "Pending",
    28,
    "27 Sep",
  ],
  [
    "PRJ010",
    "9781394198764",
    "Leadership in Practice",
    "John Wiley",
    "Combined PDF",
    "Prepress",
    "Low",
    "Completed",
    100,
    "25 Aug",
  ],
];
const initialProjects = [];
const initialTasks =
  []; /* Operational tasks are created only from real records. */
export const INITIAL_200_ISBNS = [];

export const generateInitial200Files = () => [];

const initialFiles = [];
const initialTodayTasks = [];
const nav = [
  ["Dashboard", LayoutDashboard],
  ["Notifications", Bell],
  ["Projects", FolderKanban],
  ["Production", Activity],
  ["Files", FileArchive],
  ["Mail Corrections", MessageSquareText],
  ["Clients", BriefcaseBusiness],
  ["Reports", BarChart3],
  ["File Allocation", ClipboardCheck],
  ["Customer Support", MessageSquareText],
  ["Feedback", MessageSquareHeart],
  ["Employees & Admin", Users],
  ["Settings", Settings],
];
const badge = (s) => `badge b-${s.toLowerCase().replaceAll(" ", "-")}`;

export default function App() {
  return (
    <MailCorrectionProvider>
      <AppShell />
    </MailCorrectionProvider>
  );
}
const notificationSection = (item) =>
  item?.section || item?.navSection || item?.targetSection || "Notifications";
function AppShell() {
  const [user, setUser] = useState(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("fileflow") || "{}");
        const token =
          localStorage.getItem("fileflow_access_token") || saved.user?.token;
        return saved.user && token ? { ...saved.user, token } : null;
      } catch {
        return null;
      }
    }),
    [active, setActive] = useState(() =>
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/reports/")
        ? "Reports"
        : "Dashboard",
    ),
    [projects, setProjects] = useState(initialProjects),
    [tasks, setTasks] = useState(initialTasks),
    [files, setFiles] = useState(initialFiles),
    [todayTasks, setTodayTasks] = useState(initialTodayTasks),
    [search, setSearch] = useState(""),
    [open, setOpen] = useState(
      () => typeof window === "undefined" || window.innerWidth > 800,
    ),
    [selected, setSelected] = useState(null),
    [toast, setToast] = useState(""),
    [notificationCounts, setNotificationCounts] = useState({});
  const reportIdFromPath = () => {
    const id =
      typeof window !== "undefined"
        ? window.location.pathname.match(/\/reports\/([^/]+)/)?.[1]
        : null;
    return INTEGRATED_REPORTS.some(([reportId]) => reportId === id)
      ? id
      : "my-report";
  };
  const [activeReport, setActiveReport] = useState(reportIdFromPath),
    [reportsOpen, setReportsOpen] = useState(
      () =>
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/reports/"),
    );
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fileflow");
      if (!saved)
        localStorage.setItem(
          "fileflow",
          JSON.stringify({
            user: null,
            projects: [],
            tasks: [],
            files: [],
            todayTasks: [],
          }),
        );
    } catch {}
  }, []);
  useEffect(() => {
    const syncReportRoute = () => {
      if (window.location.pathname.startsWith("/reports/")) {
        setActive("Reports");
        setActiveReport(reportIdFromPath());
        setReportsOpen(true);
      }
    };
    window.addEventListener("popstate", syncReportRoute);
    return () => window.removeEventListener("popstate", syncReportRoute);
  }, []);
  useEffect(() => {
    const currentToken =
      user?.token || localStorage.getItem("fileflow_access_token");
    localStorage.setItem(
      "fileflow",
      JSON.stringify({
        projects,
        tasks,
        files,
        todayTasks,
        user: user ? { ...user, token: currentToken } : null,
      }),
    );
    if (currentToken)
      localStorage.setItem("fileflow_access_token", currentToken);
    else localStorage.removeItem("fileflow_access_token");
  }, [projects, tasks, files, todayTasks, user]);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const loadNotificationCount = async () => {
      try {
        const isEmployee =
          user.role === "Employee" || user.role === "Art Employee";
        const designation = String(user.designation || "").toLowerCase();
        const workflowRole =
          designation.includes("cover") ||
          designation.includes("graphic") ||
          designation.includes("art")
            ? "cover"
            : "book";
        const query = isEmployee
          ? `?employeeId=${encodeURIComponent(user.empId || user.username || user.id || "")}&role=${workflowRole}`
          : "";
        let notificationItems = [];
        try {
          let response = await fetch(`/notifications${query}`);
          if (!response.ok)
            response = await fetch(`/api/notifications${query}`);
          if (response.ok) {
            const payload = await response.json();
            notificationItems = payload.notifications || payload.items || [];
          }
        } catch {}
        if (!notificationItems.length) {
          try {
            notificationItems = JSON.parse(
              localStorage.getItem("fileflow_notifications") || "[]",
            );
          } catch {}
        }
        if (alive && Array.isArray(notificationItems)) {
          const counts = notificationItems.reduce((result, item) => {
            if (!item.read) {
              const section = notificationSection(item);
              result[section] = (result[section] || 0) + 1;
            }
            return result;
          }, {});
          setNotificationCounts(counts);
        }
      } catch {}
    };
    loadNotificationCount();
    const timer = setInterval(loadNotificationCount, 5000);
    window.addEventListener(
      "fileflowNotificationsUpdated",
      loadNotificationCount,
    );
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener(
        "fileflowNotificationsUpdated",
        loadNotificationCount,
      );
    };
  }, [user]);
  const note = (x) => {
    setToast(x);
    setTimeout(() => setToast(""), 2200);
  };
  if (!user) return <Login done={setUser} />;
  const employee = user.role === "Employee" || user.role === "Art Employee";
  const shownNav = employee
    ? [
        ["Dashboard", LayoutDashboard],
        ["File Allocation", ClipboardCheck],
        ["Production Tracker", Activity],
        ["Production Report", BarChart3],
        ["Notifications", Bell],
        ["Network Copy", Share2],
        ["Mail Corrections", MessageSquareText],
        ["Customer Support", MessageSquareText],
        ["Feedback", MessageSquareHeart],
        ["Profile", Users],
      ]
    : user.role === "Quality Analyst"
      ? [
          ["Dashboard", LayoutDashboard],
          ["Correction QC", ShieldCheck],
          ["Files", FileArchive],
          ["Customer Support", MessageSquareText],
          ["Feedback", MessageSquareHeart],
          ["Profile", Users],
        ]
      : nav;

  let page =
    employee &&
    [
      "Dashboard",
      "Files",
      "File Allocation",
      "Production Tracker",
      "Production Report",
      "Reports",
      "Notifications",
      "Network Copy",
    ].includes(active) ? (
      <EmployeeLiveWorkspace
        user={user}
        note={note}
        todayTasks={todayTasks}
        activePage={
          active === "Dashboard" || active === "Files"
            ? "files"
            : active === "File Allocation"
              ? "alloc"
              : active === "Production Tracker"
                ? "tracker"
                : active === "Production Report" || active === "Reports"
                  ? "reports"
                  : active === "Notifications"
                    ? "notifications"
                    : active === "Network Copy"
                      ? "network"
                      : "files"
        }
        setActiveNav={setActive}
      />
    ) : employee && active === "Mail Corrections" ? (
      <MailCorrections user={user} note={note} />
    ) : employee && active === "Customer Support" ? (
      <CustomerSupport user={user} note={note} />
    ) : employee && active === "Feedback" ? (
      <FeedbackModule user={user} note={note} />
    ) : employee && active === "Profile" ? (
      <EmployeeDetailProfile employee={user} selfView note={note} />
    ) : active === "Dashboard" ? (
      <ProductionDashboard
        {...{ projects, tasks, setActive, todayTasks, setTodayTasks }}
        HeadComponent={Head}
      />
    ) : active === "Notifications" ? (
      <NotificationCenter note={note} />
    ) : active === "Mail Corrections" ||
      active === "My Corrections" ||
      active === "Correction QC" ? (
      <MailCorrections {...{ user, note }} />
    ) : active === "Projects" ? (
      <ClientProjects note={note} onOpenClients={() => setActive("Clients")} />
    ) : active === "Production" ? (
      <Production {...{ tasks, setTasks, user, note }} />
    ) : active === "Files" ? (
      <Files {...{ files, setFiles, search, setSearch, note, user }} />
    ) : active === "Reports" ? (
      <IntegratedReportSuite user={user} activeReport={activeReport} />
    ) : active === "File Allocation" ? (
      <BulkFileAllocation
        note={note}
        user={user}
        files={files}
        setFiles={setFiles}
        tasks={tasks}
        setTasks={setTasks}
      />
    ) : active === "Clients" ? (
      <ClientsModule projects={projects} note={note} />
    ) : active === "Employees & Admin" ? (
      <EmployeeDirectory note={note} />
    ) : active === "Completed Work" ? (
      <CompletedWork tasks={tasks} user={user} />
    ) : active === "Profile" ? (
      <EmployeeProfile user={user} note={note} />
    ) : active === "Customer Support" ? (
      <CustomerSupport {...{ user, note }} />
    ) : active === "Feedback" ? (
      <FeedbackModule user={user} note={note} />
    ) : active === "Settings" ? (
      <SettingsPage
        reset={() => {
          setProjects(initialProjects);
          setTasks(initialTasks);
          setFiles(initialFiles);
          setTodayTasks(initialTodayTasks);
          note("Data reset");
        }}
      />
    ) : (
      <Placeholder name={active} />
    );

  return (
    <div className="shell">
      <aside className={`side ${open ? "" : "closed"}`}>
        <div className="brand">
          <img src={appLogo} alt="Gentize Logo" className="brand-logo-img" />
          <div>
            <b>File Control Hub</b>
            <span>{employee ? "Employee Portal" : "Gentize Innovations"}</span>
          </div>
        </div>
        <div className="workspace">
          <small>{employee ? "EMPLOYEE WORKSPACE" : "WORKSPACE"}</small>
          <b>{employee ? "My Production Desk" : "Publishing Operations"}</b>
        </div>
        <nav>
          {shownNav.map(([item, Icon]) => {
            const count = notificationCounts[item] || 0;
            if (item !== "Reports") {
              return (
                <button
                  className={active === item ? "on" : ""}
                  onClick={() => {
                    setActive(item);
                    setSelected(null);
                    if (window.innerWidth <= 800) setOpen(false);
                  }}
                  key={item}
                >
                  <Icon />
                  <span>{item}</span>
                  {count > 0 && <b className="nav-notification-badge">{count > 99 ? "99+" : count}</b>}
                </button>
              );
            }
            return (
              <React.Fragment key="Reports">
                <button className={active === "Reports" ? "on" : ""} onClick={() => {
                  if (active === "Reports") { setReportsOpen(value => !value); return; }
                  const reportId = activeReport || "my-report";
                  history.pushState({}, "", `/reports/${reportId}`);
                  setActive("Reports");
                  setActiveReport(reportId);
                  setReportsOpen(true);
                  setSelected(null);
                }} aria-expanded={reportsOpen}>
                  <Icon />
                  <span>Reports</span>
                  {reportsOpen ? <ChevronDown className="report-section-chevron" /> : <ChevronRight className="report-section-chevron" />}
                </button>
                {reportsOpen && <div className="report-children">
                  {INTEGRATED_REPORTS.map(([reportId, reportName, ReportIcon]) => (
                    <button key={reportId} className={active === "Reports" && activeReport === reportId ? "on" : ""} onClick={() => {
                      history.pushState({}, "", `/reports/${reportId}`);
                      setActive("Reports");
                      setActiveReport(reportId);
                      setReportsOpen(true);
                      setSelected(null);
                      if (window.innerWidth <= 800) setOpen(false);
                    }}>
                      <ReportIcon />
                      <span>{reportName}</span>
                    </button>
                  ))}
                </div>}
              </React.Fragment>
            );
          })}
        </nav>
        <footer>
          <button onClick={() => setUser(null)}>
            <LogOut />
            <span>Logout</span>
          </button>
        </footer>
      </aside>
      {open && (
        <div
          className="side-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <main className="main">
        {active !== "Reports" && <header>
          <button
            className="hamb"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
          >
            <Menu />
          </button>
          <div className="global">
            <Search />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                employee
                  ? "Search my files, tasks or chapters..."
                  : "Search project, ISBN, chapter or file..."
              }
            />
            <kbd>⌘ K</kbd>
          </div>
          <div className="top">
            <div className="avatar">
              {user.name
                .split(" ")
                .map((x) => x[0])
                .slice(0, 2)}
            </div>
            <div>
              <b>{user.name}</b>
              <span>{user.designation || user.role}</span>
            </div>
          </div>
        </header>}
        <div className={active === "Reports" ? "content reports-content" : "content"}>{page}</div>
      </main>
      {toast && (
        <div className="toast">
          <CheckCircle2 />
          {toast}
        </div>
      )}
    </div>
  );
}

function Login({ done }) {
  const [u, su] = useState(""),
    [p, sp] = useState(""),
    [show, ss] = useState(false),
    [err, se] = useState(""),
    [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault();
    setBusy(true);
    se("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: u, password: p }),
      });
      const x = await r.json();
      if (!r.ok) throw Error(x.error || "Incorrect employee ID or password");
      done({ ...x.user, token: x.token });
    } catch (x) {
      se(x.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login">
      <section>
        <div className="logo">
          <img src={appLogo} alt="Gentize Logo" className="login-logo-img" />
          <b>File Control Hub</b>
          <span>Gentize Innovations</span>
        </div>
        <div className="pitch">
          <small>BUILT FOR PUBLISHING TEAMS</small>
          <h1>
            Every project.
            <br />
            Every chapter.
            <br />
            <em>Perfectly on track.</em>
          </h1>
          <p>
            Manage production, allocation, quality and delivery from one
            connected workspace.
          </p>
        </div>
        <div className="flow">
          <span>
            <FolderKanban />
            Projects
          </span>
          <i />
          <span>
            <FileText />
            Chapters
          </span>
          <i />
          <span>
            <Users />
            Teams
          </span>
          <i />
          <span>
            <ClipboardCheck />
            Quality
          </span>
        </div>
      </section>
      <form onSubmit={go}>
        <small>SECURE WORKSPACE</small>
        <h2>Welcome back</h2>
        <p>Sign in with your employee ID.</p>
        <label>
          Employee ID
          <input
            value={u}
            onChange={(e) => su(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <div>
            <input
              type={show ? "text" : "password"}
              value={p}
              onChange={(e) => sp(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button type="button" onClick={() => ss(!show)}>
              <Eye />
            </button>
          </div>
        </label>
        {err && <strong className="error">{err}</strong>}
        <button className="sign" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"} <ChevronRight />
        </button>
      </form>
    </div>
  );
}
const Head = ({ over, title, text, action }) => (
  <>
    <TopAccountDetails />
    <div className="head">
      <div>
        <small>{over}</small>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action}
    </div>
    {over === "PRODUCTION OVERVIEW" && <ProductivityGraph />}
    {title === "Project allocation" && <ClientRequirements />}
  </>
);
function Dashboard({ projects, tasks, files, user, openProject }) {
  const cards = [
    ["Total Projects", projects.length, FolderKanban],
    [
      "Active Projects",
      projects.filter((x) => x.status === "In Progress").length,
      Activity,
    ],
    [
      "QC Pending",
      projects.filter((x) => x.status === "QC Pending").length,
      ShieldCheck,
    ],
    [
      "Completed",
      projects.filter((x) => x.status === "Completed").length,
      CheckCircle2,
    ],
    ["Files Processed", files.length, FileText],
    ["Rework", tasks.filter((x) => x.status === "Rework").length, RefreshCcw],
  ];
  return (
    <>
      <Head
        over="PRODUCTION OVERVIEW"
        title={`Good morning, ${user.name.split(" ")[0]}`}
        text="Here’s what is moving across your publishing workflow today."
        action={
          <span className="date">
            <Clock3 />
            29 August 2026
          </span>
        }
      />
      <div className="cards">
        {cards.map(([x, n, I], i) => (
          <article key={x}>
            <i className={`c${i}`}>
              <I />
            </i>
            <div>
              <span>{x}</span>
              <b>{n}</b>
              <small>+12% from last month</small>
            </div>
          </article>
        ))}
      </div>
      <div className="dash">
        <section className="panel chart">
          <Title
            title="Production throughput"
            sub="Files completed this week"
          />
          <div className="bars">
            {[48, 72, 55, 88, 64, 92, 74].map((n, i) => (
              <i key={i}>
                <b style={{ height: n + "%" }} />
                <span>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                </span>
              </i>
            ))}
          </div>
        </section>
        <section className="panel workload">
          <Title title="Department workload" sub="Capacity in use" />
          {[
            ["Art & Graphics", 82],
            ["Typesetting", 68],
            ["Editorial", 54],
            ["Digital / EPUB", 71],
            ["Quality Control", 63],
          ].map((x) => (
            <div key={x[0]}>
              <p>
                <span>{x[0]}</span>
                <b>{x[1]}%</b>
              </p>
              <i>
                <b style={{ width: x[1] + "%" }} />
              </i>
            </div>
          ))}
        </section>
      </div>
      <section className="panel table-panel">
        <Title title="Priority projects" sub="Projects requiring attention" />
        <Table rows={projects.slice(0, 5)} onRow={openProject} />
      </section>
    </>
  );
}
const Title = ({ title, sub }) => (
  <div className="title">
    <div>
      <h3>{title}</h3>
      <p>{sub}</p>
    </div>
    <MoreHorizontal />
  </div>
);
function Table({ rows, onRow }) {
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            <th>Project</th>
            <th>Customer</th>
            <th>Stage</th>
            <th>Due date</th>
            <th>Progress</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} onClick={() => onRow?.(p)}>
              <td>
                <b>{p.name}</b>
                <small>
                  {p.id} · {p.isbn}
                </small>
              </td>
              <td>{p.customer}</td>
              <td>{p.stage}</td>
              <td>{p.due}</td>
              <td>
                <div className="progress">
                  <i>
                    <b style={{ width: p.progress + "%" }} />
                  </i>
                  <span>{p.progress}%</span>
                </div>
              </td>
              <td>
                <span className={badge(p.status)}>{p.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Projects({
  projects,
  setProjects,
  search,
  setSearch,
  selected,
  setSelected,
  note,
}) {
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    projectNumber: "",
    projectName: "",
    clientName: "",
    process: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const rows = projects.filter(
    (x) =>
      (filter === "All" || x.status === filter) &&
      Object.values(x).join(" ").toLowerCase().includes(search.toLowerCase()),
  );
  const paginatedRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize],
  );

  if (selected) return <Details p={selected} back={() => setSelected(null)} />;
  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !form.projectNumber ||
      !form.projectName ||
      !form.clientName ||
      !form.process
    ) {
      note("Please fill all project fields");
      return;
    }
    const nextId = form.projectNumber.trim();
    const newProject = {
      id: nextId,
      projectId: Date.now(),
      isbn: `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
      name: form.projectName.trim(),
      customer: form.clientName.trim(),
      unit: "DTPM",
      stage: form.process.trim(),
      department: "Production",
      priority: "Medium",
      status: "Yet to Start",
      progress: 0,
      due: "TBD",
      manager: "Sundharesan T",
    };
    setProjects((prev) => [newProject, ...prev]);
    setForm({
      projectNumber: "",
      projectName: "",
      clientName: "",
      process: "",
    });
    setShowForm(false);
    note("Project added successfully");
  };
  return (
    <>
      <Head
        over="PROJECT MANAGEMENT"
        title="Projects"
        text="Track every title from incoming files through final delivery."
        action={
          <button className="primary" onClick={() => setShowForm(true)}>
            <Plus />
            Add project
          </button>
        }
      />
      {showForm && (
        <section className="panel project-form-panel">
          <div className="project-form-header">
            <h3>Add Project</h3>
            <button
              type="button"
              className="secondary"
              onClick={() => setShowForm(false)}
            >
              Close
            </button>
          </div>
          <form className="project-form" onSubmit={handleSubmit}>
            <div className="project-form-grid">
              <label>
                Project Number
                <input
                  name="projectNumber"
                  value={form.projectNumber}
                  onChange={handleChange}
                  placeholder="PRJ011"
                />
              </label>
              <label>
                Project Name
                <input
                  name="projectName"
                  value={form.projectName}
                  onChange={handleChange}
                  placeholder="Project name"
                />
              </label>
              <label>
                Client Name
                <input
                  name="clientName"
                  value={form.clientName}
                  onChange={handleChange}
                  placeholder="Client name"
                />
              </label>
              <label>
                Process
                <input
                  name="process"
                  value={form.process}
                  onChange={handleChange}
                  placeholder="Artwork / Typesetting / Proofreading"
                />
              </label>
            </div>
            <div className="project-form-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary">
                Save project
              </button>
            </div>
          </form>
        </section>
      )}
      <div className="tools">
        <div>
          <Search />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project, ISBN or customer"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {[
            "All",
            "In Progress",
            "QC Pending",
            "Yet to Start",
            "Rework",
            "Completed",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select>
          <option>All departments</option>
          <option>Graphics</option>
          <option>Editorial</option>
        </select>
      </div>
      <section className="panel table-panel">
        <p className="count">{rows.length} projects</p>
        <Table rows={paginatedRows} onRow={setSelected} />
        <Pagination
          currentPage={page}
          totalItems={rows.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          itemName="projects"
        />
      </section>
    </>
  );
}
function Details({ p, back }) {
  const [tab, setTab] = useState("Workflow");
  const stages = [
    "Logistics",
    "JS Art",
    "Artwork",
    "Artwork Correction 1",
    "Word Formatting",
    "Typesetting",
    "Content Proof Reading",
    "EPUB Creation",
    "Combined PDF",
    "Printer File",
  ];
  return (
    <>
      <button className="back" onClick={back}>
        <ChevronLeft />
        Back to projects
      </button>
      <div className="detail">
        <div>
          <small>{p.id}</small>
          <h1>{p.name}</h1>
          <p>
            {p.customer} · ISBN {p.isbn}
          </p>
        </div>
        <span className={badge(p.status)}>{p.status}</span>
      </div>
      <div className="facts">
        {[
          ["Delivery unit", p.unit],
          ["Department", p.department],
          ["Manager", p.manager],
          ["Priority", p.priority],
          ["Due date", p.due],
          ["Progress", p.progress + "%"],
        ].map((x) => (
          <div key={x[0]}>
            <small>{x[0]}</small>
            <b>{x[1]}</b>
          </div>
        ))}
      </div>
      <div className="tabs">
        {["Workflow", "Chapters", "Files", "Communication", "Art & QC"].map(
          (x) => (
            <button
              className={x === tab ? "on" : ""}
              onClick={() => setTab(x)}
              key={x}
            >
              {x}
            </button>
          ),
        )}
      </div>
      {tab === "Workflow" ? (
        <section className="panel stages">
          <Title
            title="Project workflow"
            sub={`${stages.length} production stages`}
          />
          {stages.map((x, i) => (
            <div key={x}>
              <i className={i < 3 ? "done" : i === 3 ? "live" : ""}>
                {i < 3 ? <CheckCircle2 /> : i + 1}
              </i>
              <p>
                <b>{x}</b>
                <span>
                  {
                    [
                      "Logistics",
                      "Art",
                      "Graphics",
                      "Art",
                      "DTP",
                      "Composition",
                      "Editorial",
                      "Digital",
                      "Prepress",
                      "Prepress",
                    ][i]
                  }
                </span>
              </p>
              <small>
                {i < 4
                  ? [
                      "Sundharesan T",
                      "Inbakumar R",
                      "Jaisrinivas P K",
                      "Santhosh Kumar A",
                    ][i]
                  : "Unallocated"}
              </small>
              <span
                className={badge(
                  i < 3
                    ? "Finished"
                    : i === 3
                      ? "Work In Progress"
                      : "Yet to Start",
                )}
              >
                {i < 3
                  ? "Finished"
                  : i === 3
                    ? "Work In Progress"
                    : "Yet to Start"}
              </span>
            </div>
          ))}
        </section>
      ) : (
        <Placeholder name={tab} />
      )}
    </>
  );
}

function Production({ tasks, setTasks, user, note }) {
  const [filter, setFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const isEmployee = user?.role === "Employee" || user?.role === "Art Employee";

  // Fetch /api/allocations on mount and merge with tasks state
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch("/api/allocations");
        const json = await res.json();
        if (json.ok && Array.isArray(json.items) && json.items.length) {
          if (!isMounted) return;
          setTasks((prev) => {
            const taskMap = new Map((prev || []).map((t) => [t.id, t]));
            json.items.forEach((item) => {
              const prevItem = taskMap.get(item.id);
              taskMap.set(item.id, {
                ...item,
                project: item.project || item.projectName || "Peter Lang Batch",
                process: item.process || item.workflowStage || "POD",
                due: item.due || item.dueDate || "05 Sep 2026",
                postedBy: item.postedBy || "Administrator",
                postedTo: item.postedTo || item.employee || "Unassigned",
                remark:
                  item.remark ||
                  (item.employee
                    ? `Allocated to ${item.employee}`
                    : "Allocated file"),
                status: prevItem?.status || item.status || "Allocated",
              });
            });
            const merged = [...taskMap.values()];
            try {
              const currentData = JSON.parse(
                localStorage.getItem("fileflow") || "{}",
              );
              currentData.tasks = merged;
              localStorage.setItem("fileflow", JSON.stringify(currentData));
            } catch (e) {}
            return merged;
          });
        }
      } catch (err) {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Format all rows with uniform fields
  const allRows = useMemo(() => {
    return (tasks || []).map((t) => ({
      ...t,
      isbn:
        t.isbn || (t.id?.includes("-") ? t.id.split("-").slice(-1)[0] : "—"),
      project: t.project || t.projectName || "Peter Lang Batch",
      process: t.process || t.workflowStage || "POD",
      postedBy: t.postedBy || "Administrator",
      postedTo: t.postedTo || t.employee || "Unassigned",
      due: t.due || t.dueDate || "05 Sep 2026",
      status: t.status || "Allocated",
      remark:
        t.remark ||
        (t.employee ? `Allocated to ${t.employee}` : "Allocated file"),
    }));
  }, [tasks]);

  // If Employee, only show their own files
  const userFiltered = useMemo(() => {
    if (!isEmployee) return allRows;
    const name = (user?.name || "").toLowerCase();
    const empId = (user?.empId || "").toLowerCase();
    const giEmpId = (user?.giEmpId || "").toLowerCase();
    return allRows.filter((t) => {
      const assigned = (t.postedTo || t.employee || "").toLowerCase();
      const ids = [
        t.employeeId,
        t.employeeCode,
        ...(Array.isArray(t.employeeAltIds) ? t.employeeAltIds : []),
      ].map((v) => String(v || "").toLowerCase());
      return (
        assigned === name ||
        (name && assigned.includes(name)) ||
        ids.includes(empId) ||
        (giEmpId && ids.includes(giEmpId))
      );
    });
  }, [allRows, isEmployee, user]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return userFiltered.filter((t) => {
      const matchFilter =
        filter === "All"
          ? true
          : filter === "Completed"
            ? ["Completed", "Finished", "Complete"].includes(t.status)
            : filter === "Rework"
              ? ["Rework", "Reject"].includes(t.status)
              : t.status === filter;
      const matchEmp =
        employeeFilter === "All"
          ? true
          : t.postedTo === employeeFilter || t.employee === employeeFilter;
      const matchSearch =
        !q ||
        String(t.isbn || "")
          .toLowerCase()
          .includes(q) ||
        String(t.project || "")
          .toLowerCase()
          .includes(q) ||
        String(t.process || "")
          .toLowerCase()
          .includes(q) ||
        String(t.postedBy || "")
          .toLowerCase()
          .includes(q) ||
        String(t.postedTo || "")
          .toLowerCase()
          .includes(q) ||
        String(t.status || "")
          .toLowerCase()
          .includes(q) ||
        String(t.remark || "")
          .toLowerCase()
          .includes(q) ||
        String(t.id || "")
          .toLowerCase()
          .includes(q);
      return matchFilter && matchEmp && matchSearch;
    });
  }, [userFiltered, filter, employeeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const changeStatus = async (id, newStatus) => {
    setTasks((prev) => {
      const updated = (prev || []).map((x) =>
        x.id === id ? { ...x, status: newStatus } : x,
      );
      try {
        const currentData = JSON.parse(
          localStorage.getItem("fileflow") || "{}",
        );
        currentData.tasks = updated;
        localStorage.setItem("fileflow", JSON.stringify(currentData));
      } catch (e) {}
      return updated;
    });
    try {
      await fetch("/api/allocations/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch (e) {}
    note(`Task updated to ${newStatus}`);
  };

  const uniqueEmployees = useMemo(() => {
    const s = new Set();
    userFiltered.forEach((t) => {
      const emp = t.postedTo || t.employee;
      if (emp && emp !== "Unassigned") s.add(emp);
    });
    return Array.from(s).sort();
  }, [userFiltered]);

  return (
    <>
      <Head
        over="PRODUCTION CONTROL"
        title={isEmployee ? "My Production Tasks" : "Production Control"}
        text="Review allocated ISBN files, assigned personnel, deadlines, workflow stages and live status."
      />
      <div className="taskcards prod-taskcards">
        <article key="Total">
          <span className="badge b-allocated">Total</span>
          <b>{userFiltered.length}</b>
        </article>
        <article key="Allocated">
          <span className="badge b-allocated">Allocated</span>
          <b>{userFiltered.filter((t) => t.status === "Allocated").length}</b>
        </article>
        <article key="WIP">
          <span className="badge b-work-in-progress">Work In Progress</span>
          <b>
            {userFiltered.filter((t) => t.status === "Work In Progress").length}
          </b>
        </article>
        <article key="QC">
          <span className="badge b-qc-pending">QC Pending</span>
          <b>{userFiltered.filter((t) => t.status === "QC Pending").length}</b>
        </article>
        <article key="Completed">
          <span className="badge b-completed">Completed</span>
          <b>
            {
              userFiltered.filter((t) =>
                ["Completed", "Finished", "Complete"].includes(t.status),
              ).length
            }
          </b>
        </article>
        <article key="Rework">
          <span className="badge b-rework">Rework / Hold</span>
          <b>
            {
              userFiltered.filter((t) =>
                ["Rework", "Hold", "Reject"].includes(t.status),
              ).length
            }
          </b>
        </article>
      </div>

      <div className="tools production-control-tools">
        <div>
          <Search />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by ISBN, Posted By, Posted To, Status or Remark..."
          />
        </div>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="All">All Statuses</option>
          <option value="Allocated">Allocated</option>
          <option value="Work In Progress">Work In Progress</option>
          <option value="QC Pending">QC Pending</option>
          <option value="Completed">Completed</option>
          <option value="Rework">Rework</option>
          <option value="Hold">Hold</option>
        </select>
        {!isEmployee && uniqueEmployees.length > 0 && (
          <select
            value={employeeFilter}
            onChange={(e) => {
              setEmployeeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Employees</option>
            {uniqueEmployees.map((emp) => (
              <option key={emp} value={emp}>
                {emp}
              </option>
            ))}
          </select>
        )}
      </div>

      <section className="panel table-panel production-control-table-panel">
        <div className="scroll">
          <table className="production-control-table">
            <thead>
              <tr>
                <th>ISBN</th>
                <th>Project / Batch</th>
                <th>Process / Stage</th>
                <th>Posted By</th>
                <th>Posted To</th>
                <th>Due Date</th>
                <th>Status</th>
                <th style={{ maxWidth: 220 }}>Remark</th>
                <th style={{ minWidth: 160, textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length > 0 ? (
                paginatedRows.map((t) => (
                  <tr key={t.id}>
                    <td data-label="ISBN">
                      <b style={{ fontFamily: "monospace", color: "#1e3a8a" }}>
                        {t.isbn}
                      </b>
                      <small style={{ display: "block", color: "#64748b" }}>
                        {t.id}
                      </small>
                    </td>
                    <td data-label="Project / Batch">
                      <b>{t.project}</b>
                    </td>
                    <td data-label="Process / Stage">{t.process}</td>
                    <td data-label="Posted By">
                      <span style={{ fontWeight: 500 }}>{t.postedBy}</span>
                    </td>
                    <td data-label="Posted To">
                      <b>{t.postedTo}</b>
                    </td>
                    <td data-label="Due Date">{t.due}</td>
                    <td data-label="Status">
                      <span className={badge(t.status)}>{t.status}</span>
                    </td>
                    <td
                      data-label="Remark"
                      style={{
                        maxWidth: 220,
                        whiteSpace: "normal",
                        fontSize: "0.82rem",
                        color: "#475569",
                        lineHeight: 1.4,
                      }}
                    >
                      {t.remark}
                    </td>
                    <td
                      data-label="Action"
                      style={{ minWidth: 160, textAlign: "center" }}
                    >
                      <div className="prod-table-actions">
                        {t.status === "Allocated" && (
                          <button
                            type="button"
                            className="btn-prod-action btn-start"
                            title="Start Work"
                            onClick={() =>
                              changeStatus(t.id, "Work In Progress")
                            }
                          >
                            <Play size={13} fill="currentColor" /> Start
                          </button>
                        )}
                        {t.status === "Work In Progress" && (
                          <>
                            <button
                              type="button"
                              className="btn-prod-action btn-hold"
                              title="Pause / Hold"
                              onClick={() => changeStatus(t.id, "Hold")}
                            >
                              <Pause size={13} /> Hold
                            </button>
                            <button
                              type="button"
                              className="btn-prod-action btn-qc"
                              title="Send to QC"
                              onClick={() => changeStatus(t.id, "QC Pending")}
                            >
                              <ShieldCheck size={13} /> Send QC
                            </button>
                          </>
                        )}
                        {t.status === "QC Pending" && (
                          <>
                            <button
                              type="button"
                              className="btn-prod-action btn-complete"
                              title="Approve & Complete"
                              onClick={() => changeStatus(t.id, "Completed")}
                            >
                              <CheckCircle2 size={13} /> Complete
                            </button>
                            <button
                              type="button"
                              className="btn-prod-action btn-rework"
                              title="Send for Rework"
                              onClick={() => changeStatus(t.id, "Rework")}
                            >
                              <RefreshCcw size={13} /> Rework
                            </button>
                          </>
                        )}
                        {["Completed", "Finished", "Complete"].includes(
                          t.status,
                        ) && (
                          <span className="prod-finished-badge">
                            <CheckCircle2 size={13} /> Finished
                          </span>
                        )}
                        {["Rework", "Hold"].includes(t.status) && (
                          <button
                            type="button"
                            className="btn-prod-action btn-resume"
                            title="Resume Work"
                            onClick={() =>
                              changeStatus(t.id, "Work In Progress")
                            }
                          >
                            <Play size={13} fill="currentColor" /> Resume
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      color: "#64748b",
                    }}
                  >
                    No production tasks found. Go to <b>File Allocation</b> to
                    allocate files.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredRows.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredRows.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            itemName="tasks"
          />
        )}
      </section>
    </>
  );
}

function EmployeeDashboard({ projects, tasks, files, user, setActive, note }) {
  const isMine = (t) =>
    t.postedTo === user?.name ||
    t.employee === user?.name ||
    t.employeeId === user?.empId ||
    t.employeeCode === user?.giEmpId ||
    (user?.name &&
      t.employee &&
      t.employee.toLowerCase().includes(user.name.toLowerCase()));
  const isMyFile = (f) =>
    f.owner === user?.name ||
    f.postedTo === user?.name ||
    (user?.name &&
      f.owner &&
      f.owner.toLowerCase().includes(user.name.toLowerCase()));
  const mine = tasks.filter(isMine);
  const myFiles = files.filter(isMyFile);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const paginatedMine = mine.slice((page - 1) * pageSize, page * pageSize);
  const stats = [
    ["Assigned Files", myFiles.length, FileArchive],
    ["Due Today", mine.filter((x) => x.due?.includes("Today")).length, Clock3],
    [
      "In Progress",
      mine.filter((x) => x.status === "Work In Progress").length,
      Activity,
    ],
    [
      "Completed Today",
      mine.filter((x) =>
        ["Finished", "Completed", "Complete"].includes(x.status),
      ).length,
      CheckCircle2,
    ],
    [
      "Waiting for Query",
      mine.filter((x) => x.status === "Waiting for Query").length,
      MessageSquareText,
    ],
    [
      "Rework",
      mine.filter((x) => ["Rework", "Hold", "Reject"].includes(x.status))
        .length,
      RefreshCcw,
    ],
  ];
  return (
    <>
      <Head
        over="MY PRODUCTION DESK"
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        text="Your allocated files, deadlines and current work in one place."
        action={
          <span className="employee-shift">
            <i />
            Shift active · 08:32:14
          </span>
        }
      />
      <div className="cards employee-cards">
        {stats.map(([x, n, I], i) => (
          <article key={x}>
            <i className={`c${i}`}>
              <I />
            </i>
            <div>
              <span>{x}</span>
              <b>{n}</b>
              <small>
                {x === "Due Today" ? "Needs attention" : "My workload"}
              </small>
            </div>
          </article>
        ))}
      </div>
      <div className="employee-focus">
        <section className="panel current-work">
          <div className="current-label">
            <span>WORKING NOW</span>
            <i>High priority</i>
          </div>
          <h2>Exploring Management 2E</h2>
          <p>PRJ001 · C11 · Art QC</p>
          <div className="timer">00:05:29</div>
          <div className="current-actions">
            <button className="secondary" onClick={() => note("Task paused")}>
              <Pause />
              Pause
            </button>
            <button className="primary" onClick={() => note("Task sent to QC")}>
              <CheckCircle2 />
              Complete & send to QC
            </button>
          </div>
        </section>
        <section className="panel day-plan">
          <Title title="Today’s plan" sub="2 items due today" />
          <div>
            <i className="done">
              <CheckCircle2 />
            </i>
            <p>
              <b>Download source file</b>
              <span>PRJ001 · C11</span>
            </p>
            <small>Done</small>
          </div>
          <div>
            <i>
              <Activity />
            </i>
            <p>
              <b>Complete Art QC</b>
              <span>Due at 6:00 PM</span>
            </p>
            <small>In progress</small>
          </div>
          <div>
            <i>
              <Clock3 />
            </i>
            <p>
              <b>Review returned query</b>
              <span>PRJ007 · BackMatter</span>
            </p>
            <small>Pending</small>
          </div>
        </section>
      </div>
      <section className="panel table-panel">
        <div className="employee-table-head">
          <Title
            title="My allocated work"
            sub="Only tasks assigned to your account"
          />
          <button onClick={() => setActive("Production")}>
            View all tasks <ChevronRight />
          </button>
        </div>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>ISBN / Chapter</th>
                <th>Process</th>
                <th>Due</th>
                <th>Time spent</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMine.map((t) => {
                let p = projects.find((x) => x.id === t.project);
                return (
                  <tr key={t.id}>
                    <td>
                      <b>{p?.name || t.project}</b>
                      <small>{t.id}</small>
                    </td>
                    <td>
                      <b>{t.isbn || p?.isbn || "—"}</b>
                      <small>{t.chapter}</small>
                    </td>
                    <td>{t.process}</td>
                    <td>{t.due}</td>
                    <td>
                      <code>{t.time || "00:00:00"}</code>
                    </td>
                    <td>
                      <span className={badge(t.status)}>{t.status}</span>
                    </td>
                    <td>
                      <button
                        className="work-link"
                        onClick={() => setActive("Production")}
                      >
                        Open work <ChevronRight />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalItems={mine.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          itemName="tasks"
        />
      </section>
    </>
  );
}

function CompletedWork({ tasks, user }) {
  const isDone = (x) =>
    ["Finished", "Completed", "Complete", "QC Pending"].includes(x.status);
  const isMine = (x) =>
    !user || user.role === "Admin"
      ? isDone(x)
      : (x.employee === user.name ||
          x.postedTo === user.name ||
          x.employeeId === user.empId) &&
        isDone(x);
  const rows = tasks.filter(isMine);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize);
  return (
    <>
      <Head
        over="MY WORK HISTORY"
        title="Completed work"
        text="Files submitted by you for QC or final delivery."
      />
      <section className="panel table-panel">
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Project</th>
                <th>Chapter</th>
                <th>Process</th>
                <th>Time spent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length ? (
                paginatedRows.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <b>{t.id}</b>
                    </td>
                    <td>{t.project}</td>
                    <td>{t.chapter}</td>
                    <td>{t.process}</td>
                    <td>
                      <code>{t.time || "00:00:00"}</code>
                    </td>
                    <td>
                      <span className={badge(t.status)}>{t.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    Completed items will appear here after you send work to QC.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalItems={rows.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          itemName="records"
        />
      </section>
    </>
  );
}

function EmployeeQueries({ note }) {
  const stages = [
    "Logistics",
    "JS Art",
    "JS Type",
    "Artwork",
    "Artwork 1",
    "Artwork Correction 1",
    "Artwork Correction 2",
    "Artwork Correction 3",
    "Word Formatting",
    "Tagging",
    "Typesetting",
    "Content Proof Reading",
    "Typesetting EPUB",
    "1st Revises",
    "1st Revises EPUB",
    "2nd Revises",
    "2nd Revises EPUB",
    "3rd Revises",
    "3rd Revises EPUB",
    "4th Revises",
    "5th Revises",
    "Para ID",
    "Indexing",
    "eBook PDF",
    "eBook PDF 1st Revises",
    "Word Archive",
    "EPUB Creation",
    "1st Archive",
    "BPA Metadata Creation",
    "BPA Web Optimised PDF",
    "BPA Archive",
    "WCS PDF",
    "Combined PDF",
    "Printer File",
    "2nd Printer File",
    "2nd Archive",
    "Alt Text",
    "XML Extraction",
    "HTML5",
    "Illustration Inventory",
    "Video Edit",
    "Video Edit 1st Revises",
    "Keying",
    "Cleanup",
  ];
  const stageStatus = (i) => (i < 5 ? "FIN" : i === 5 ? "ACT" : "NON-ACT");
  const legend = [
    ["Yet to Allot", "#277fc0"],
    ["Yet to Start", "#35b9bd"],
    ["Work In Progress", "#6674de"],
    ["Waiting for Query", "#687386"],
    ["Break", "#f28b16"],
    ["Pending", "#83127d"],
    ["Finished", "#48a23d"],
    ["NA", "#e2787d"],
    ["Working on Another Project", "#6e9a82"],
    ["Posted", "#72e62e"],
    ["Approved", "#ee2867"],
    ["Rejected", "#e24fad"],
    ["Replied", "#f3eb00"],
    ["Closed", "#ffc412"],
    ["Re-Opened", "#639ad8"],
    ["No Query Posted", "#bfc4c2"],
  ];
  const [selectedStage, setSelectedStage] = useState("Artwork 1"),
    [filter, setFilter] = useState(""),
    [presses, setPresses] = useState([]);
  const togglePress = (x) =>
    setPresses((p) => (p.includes(x) ? p.filter((v) => v !== x) : [...p, x]));
  const visible = stages.filter((x) =>
    x.toLowerCase().includes(filter.toLowerCase()),
  );
  return (
    <>
      <Head
        over="PROJECT MANAGEMENT"
        title="Project details"
        text="Complete project, customer, schedule and production information in one workspace."
        action={
          <span className="query-due">
            <Clock3 />
            <span>
              <small>Due date</small>
              <b>14 Aug 2026 · 20:00</b>
            </span>
          </span>
        }
      />
      <ProjectInformation />
      <section className="panel query-workspace">
        <div className="query-summary">
          <div className="query-legend">
            {legend.map(([x, c]) => (
              <span key={x}>
                <i style={{ background: c }} />
                {x}
              </span>
            ))}
          </div>
          <div className="query-dept">
            <small>Stage department</small>
            <b>Graphics (DTPM)</b>
          </div>
        </div>
        <div className="workflow-tabs">
          {visible.map((x) => (
            <button
              key={x}
              className={selectedStage === x ? "active" : ""}
              onClick={() => setSelectedStage(x)}
            >
              {x} <small>({stageStatus(stages.indexOf(x))})</small>
            </button>
          ))}
        </div>
        <div className="query-toolbar">
          <label>
            <Search />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter workflow stages"
            />
          </label>
          <div>
            <button onClick={() => setFilter("")}>Clear filters</button>
            <span>
              Total records: <b>1</b>
            </span>
            <span>
              Total time: <b>00:05:29</b>
            </span>
          </div>
        </div>
        <div className="press-filters">
          {[
            "Job Tracking Sheet",
            "Checklist Collections",
            "PSU Press",
            "John Wiley",
            "Cengage Learning",
            "Indexing",
            "IOS Press",
            "Wiley",
          ].map((x) => (
            <label key={x}>
              <input
                type="checkbox"
                checked={presses.includes(x)}
                onChange={() => togglePress(x)}
              />
              {x}
            </label>
          ))}
        </div>
        <div className="query-grid">
          <table>
            <thead>
              <tr>
                <th>Chapter</th>
                <th>Query status</th>
                <th>CE query</th>
                <th>MS count</th>
                <th>Castoff</th>
                <th>Art development</th>
                <th>Art QC</th>
                <th>Created date</th>
                <th>Due date</th>
                <th>Actual date</th>
                <th>Time</th>
                <th>Time required</th>
              </tr>
            </thead>
            <tbody>
              <tr className="metric-row">
                <td>Process norms</td>
                <td />
                <td />
                <td />
                <td />
                <td>0</td>
                <td>0</td>
                <td colSpan="5" />
              </tr>
              <tr className="metric-row">
                <td>Time required</td>
                <td />
                <td />
                <td />
                <td />
                <td>00:00:00</td>
                <td>00:00:00</td>
                <td colSpan="4" />
                <td>00:00:00</td>
              </tr>
              <tr className="metric-row total">
                <td>Total time</td>
                <td />
                <td />
                <td>1</td>
                <td>0</td>
                <td>00:01:03</td>
                <td>00:04:26</td>
                <td colSpan="3" />
                <td>00:05:29</td>
                <td />
              </tr>
              <tr className="column-filters">
                {Array.from({ length: 12 }, (_, i) => (
                  <td key={i}>
                    {i < 11 && <input aria-label={`Filter column ${i + 1}`} />}
                  </td>
                ))}
              </tr>
              <tr className="chapter-row">
                <td colSpan="12">
                  <b>C11</b>
                </td>
              </tr>
              <tr>
                <td>
                  <button
                    className="chapter-link"
                    onClick={() => note("Chapter C11 opened")}
                  >
                    9781394415106_c11f02
                  </button>
                </td>
                <td>
                  <span className="query-code">NQP</span>
                </td>
                <td>
                  <span className="query-code">NQP</span>
                </td>
                <td>1</td>
                <td>0</td>
                <td>
                  <span className="query-finished">FIN (1)</span>
                </td>
                <td>
                  <span className="query-finished">FIN (1)</span>
                </td>
                <td>13 Aug 2026 · 16:17</td>
                <td>14 Aug 2026 · 20:00</td>
                <td>14 Aug 2026 · 12:25</td>
                <td>00:05:29</td>
                <td>00:00:00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ProjectInformation() {
  const managers = [
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
  ];
  const departments = [
    "Editorial Services (DTPC)",
    "Digital Engineering (DTPC)",
    "Creation2 (DTPC)",
    "QAG (DTPC)",
    "Graphics (DTPC)",
    "TS2_XEditPro (DTPM)",
    "Graphics (DTPM)",
    "Editorial Services (DTPK)",
    "Content Development (DTPK)",
    "QAG (DTPM)",
    "Project Analytics (DTPM)",
    "Conversion (DTPM)",
    "Conversion_XML_EDU (DTPM)",
    "EPUB_Education (DTPC)",
  ];
  const details = [
    ["Vertical", "Education"],
    ["Delivery unit", "DTPM"],
    ["Customer", "John Wiley"],
    ["Location", "Australia"],
    ["iConnect project ID", "BO-COWAST-0006"],
    ["Project ID", "114595"],
    ["Billing entity", "LDL"],
    ["C&A representative", "Ayyappankannan"],
    ["Type", "Typesetting Services"],
    ["Platform", "No Need"],
    ["Complexity", "Medium"],
    ["Schedule", "Crash"],
    ["Added by", "Sundharesan T"],
    ["Added on", "16 Jan 2026 · 12:12:15"],
    ["Delivery head", "Tarun Mitra"],
    ["Work duration", "863:26:34"],
  ];
  return (
    <section className="panel project-information">
      <div className="project-info-top">
        <div className="project-mark">
          <FolderKanban />
          <span>
            <small>Project ID 114595</small>
            <b>Exploring Management 2E</b>
            <em>
              FY27_JW_HE_EXPLORING_MANAGEMENT_2E_BY_SCHERMERHORN_9781394415106
            </em>
          </span>
        </div>
        <span className="project-health">
          <i />
          Active project
        </span>
      </div>
      <div className="project-detail-grid">
        {details.map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <b>{value}</b>
          </div>
        ))}
      </div>
      <div className="project-wide-detail">
        <div>
          <small>Internal customer / Project managers</small>
          <p>
            {managers.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </p>
        </div>
        <div>
          <small>Departments involved</small>
          <p>
            {departments.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}

function EmployeeProfile({ user, note }) {
  const [changing, setChanging] = useState(false),
    [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState("");
  const initials = (user.name || "Employee")
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const fields = [
    ["Employee ID", user.empId],
    ["GI Employee ID", user.giEmpId],
    ["Designation", user.designation || user.role],
    ["Department", user.department],
    ["Office email", user.officeEmail],
    ["Personal email", user.personalEmail],
    ["Phone", user.phone],
    ["Date of joining", user.doj],
    ["Qualification", user.qualification],
    ["Experience", user.experience],
    ["Gender", user.gender],
    ["Blood group", user.bloodGroup],
    ["Emergency contact", user.emergencyContact],
    ["Current address", user.address],
    ["Permanent address", user.permanentAddress],
  ].filter((x) => x[1]);
  const changePassword = async (e) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError("New passwords do not match");
      return;
    }
    try {
      const r = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: user.empId,
          currentPassword: current,
          newPassword: next,
        }),
      });
      const x = await r.json();
      if (!r.ok) throw Error(x.error || "Password change failed");
      setCurrent("");
      setNext("");
      setConfirm("");
      setChanging(false);
      note?.("Password changed successfully");
    } catch (x) {
      setError(x.message);
    }
  };
  return (
    <>
      <Head
        over="EMPLOYEE ACCOUNT"
        title="My profile"
        text="Your employee master details."
      />
      <div className="profile-grid">
        <section className="panel profile-card">
          <div className="profile-avatar">{initials}</div>
          <h2>{user.name}</h2>
          <p>
            {user.empId}
            {user.department ? ` · ${user.department}` : ""}
          </p>
          <span className="badge b-completed">Active</span>
        </section>
        <section className="panel profile-details">
          <Title
            title="Employment details"
            sub="Information provided by the administrator"
          />
          {fields.map((x) => (
            <div key={x[0]}>
              <span>{x[0]}</span>
              <b>{x[1]}</b>
            </div>
          ))}
          <button className="secondary" onClick={() => setChanging((x) => !x)}>
            Change password
          </button>
          {changing && (
            <form onSubmit={changePassword} className="profile-password-form">
              <label>
                Current password
                <input
                  type="password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  required
                />
              </label>
              <label>
                New password
                <input
                  type="password"
                  minLength="8"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  required
                />
              </label>
              <label>
                Confirm new password
                <input
                  type="password"
                  minLength="8"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </label>
              {error && <strong className="error">{error}</strong>}
              <button className="primary" type="submit">
                Save new password
              </button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
function ClientRequirements() {
  const [items, setItems] = useState([
      {
        id: "REQ-2401",
        client: "John Wiley",
        isbn: "9781394415106",
        title: "Exploring Management 2E",
        outputs: ["POD", "ePDF"],
        due: "05 Sep",
        status: "Assigned",
      },
      {
        id: "REQ-2402",
        client: "Cengage Learning",
        isbn: "9781119983412",
        title: "Financial Accounting 12E",
        outputs: ["ePDF"],
        due: "08 Sep",
        status: "Waiting allocation",
      },
    ]),
    [selected, setSelected] = useState("REQ-2401"),
    [form, setForm] = useState({
      client: "John Wiley",
      isbn: "",
      title: "",
      outputs: ["POD"],
      due: "2026-09-05",
    });
  const toggle = (x) =>
    setForm((f) => ({
      ...f,
      outputs: f.outputs.includes(x)
        ? f.outputs.filter((v) => v !== x)
        : [...f.outputs, x],
    }));
  const add = (e) => {
    e.preventDefault();
    if (!/^\d{10,13}$/.test(form.isbn) || !form.title || !form.outputs.length)
      return;
    const id = `REQ-${2401 + items.length}`;
    setItems((x) => [
      { ...form, id, status: "Waiting allocation", due: form.due.slice(5) },
      ...x,
    ]);
    setSelected(id);
    setForm((f) => ({ ...f, isbn: "", title: "" }));
  };
  return (
    <section className="requirement-layout">
      <form className="panel requirement-form" onSubmit={add}>
        <div className="requirement-heading">
          <i>
            <BriefcaseBusiness />
          </i>
          <div>
            <h3>1. Client requirement</h3>
            <p>Enter the ISBN and every output requested by the client.</p>
          </div>
        </div>
        <div className="requirement-fields">
          <label>
            Client
            <select
              value={form.client}
              onChange={(e) =>
                setForm((f) => ({ ...f, client: e.target.value }))
              }
            >
              <option>John Wiley</option>
              <option>Cengage Learning</option>
              <option>Pearson</option>
              <option>Oxford University Press</option>
            </select>
          </label>
          <label>
            ISBN number
            <input
              inputMode="numeric"
              maxLength="13"
              value={form.isbn}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  isbn: e.target.value.replace(/\D/g, ""),
                }))
              }
              placeholder="9781394415106"
            />
          </label>
          <label className="requirement-title">
            Book / project title
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Enter title"
            />
          </label>
          <label>
            Due date
            <input
              type="date"
              value={form.due}
              onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))}
            />
          </label>
        </div>
        <div className="deliverable-picker">
          <span>Required outputs</span>
          {["POD", "ePDF", "Print PDF", "eBook", "XML"].map((x) => (
            <label
              className={form.outputs.includes(x) ? "selected" : ""}
              key={x}
            >
              <input
                type="checkbox"
                checked={form.outputs.includes(x)}
                onChange={() => toggle(x)}
              />
              {x}
            </label>
          ))}
        </div>
        <button className="primary" type="submit">
          <Plus />
          Add requirement
        </button>
      </form>
      <section className="panel requirement-queue">
        <div className="requirement-heading">
          <i>
            <ClipboardCheck />
          </i>
          <div>
            <h3>Requirement queue</h3>
            <p>Select an ISBN before allocating its files below.</p>
          </div>
        </div>
        <div className="requirement-list">
          {items.map((x) => (
            <button
              className={selected === x.id ? "active" : ""}
              onClick={() => setSelected(x.id)}
              key={x.id}
            >
              <span>
                <small>
                  {x.id} · {x.client}
                </small>
                <b>{x.isbn}</b>
                <em>{x.title}</em>
              </span>
              <span className="requirement-meta">
                <i>{x.outputs.join(" + ")}</i>
                <strong className={x.status === "Assigned" ? "assigned" : ""}>
                  {x.status}
                </strong>
              </span>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}

function TopAccountDetails() {
  const [show, setShow] = useState(false),
    [account, setAccount] = useState(null);
  useEffect(() => {
    try {
      setAccount(JSON.parse(localStorage.getItem("fileflow") || "null")?.user);
    } catch {}
    const top = document.querySelector(".top");
    if (!top) return;
    const click = () => setShow((x) => !x);
    top.addEventListener("click", click);
    top.setAttribute("role", "button");
    top.setAttribute("tabindex", "0");
    return () => top.removeEventListener("click", click);
  }, []);
  if (!show || !account) return null;
  return (
    <div className="account-popover">
      <div className="account-popover-head">
        <div className="avatar">
          {account.name
            .split(" ")
            .map((x) => x[0])
            .slice(0, 2)}
        </div>
        <div>
          <b>{account.name}</b>
          <span>{account.designation || account.role}</span>
        </div>
        <button onClick={() => setShow(false)}>×</button>
      </div>
      <dl>
        <div>
          <dt>Username</dt>
          <dd>{account.username}</dd>
        </div>
        <div>
          <dt>Designation</dt>
          <dd>{account.designation || account.role}</dd>
        </div>
        <div>
          <dt>Department</dt>
          <dd>
            {account.department ||
              (account.role === "Admin" ? "Administration" : "Production")}
          </dd>
        </div>
        <div>
          <dt>Account status</dt>
          <dd className="account-active">Active</dd>
        </div>
      </dl>
    </div>
  );
}

function FileAllocation({ note }) {
  const people = [
    ["Sundharesan T", "Design & Art"],
    ["Inbakumar R", "Quality & Testing"],
    ["Jaisrinivas P K", "Technology & Composition"],
    ["Santhosh Kumar A", "Content & Editorial"],
    ["Sivakumar G", "Graphic Design"],
  ];
  const chapters = [
    "Incoming_20260803_ASFMPrelims",
    "C01_Introduction",
    "C02_Core Concepts",
    "C03_Case Studies",
    "Back Matter",
  ];
  const [requirements, setRequirements] = useState([
    {
      id: "REQ-2401",
      client: "John Wiley",
      isbn: "9781394415106",
      title: "Exploring Management 2E",
      outputs: ["POD", "ePDF"],
      due: "2026-09-05",
      priority: "High",
      status: "Assigned",
    },
    {
      id: "REQ-2402",
      client: "Cengage Learning",
      isbn: "9781119983412",
      title: "Financial Accounting 12E",
      outputs: ["ePDF"],
      due: "2026-09-08",
      priority: "Medium",
      status: "Waiting allocation",
    },
  ]);
  const [activeRequirement, setActiveRequirement] = useState("REQ-2401");
  const [allocations, setAllocations] = useState([
    {
      id: "ALC-1001",
      requirementId: "REQ-2401",
      isbn: "9781394415106",
      outputs: ["POD", "ePDF"],
      employee: "Sundharesan T",
      department: "Design & Art",
      allocated: 100,
      completed: 50,
      rejected: 10,
      hold: 5,
      date: "29 Aug 2026",
    },
    {
      id: "ALC-1002",
      requirementId: "REQ-2402",
      isbn: "9781119983412",
      outputs: ["ePDF"],
      employee: "Inbakumar R",
      department: "Quality & Testing",
      allocated: 75,
      completed: 38,
      rejected: 4,
      hold: 8,
      date: "29 Aug 2026",
    },
    {
      id: "ALC-1003",
      requirementId: "REQ-2401",
      isbn: "9781394415106",
      outputs: ["POD"],
      employee: "Jaisrinivas P K",
      department: "Technology & Composition",
      allocated: 60,
      completed: 52,
      rejected: 2,
      hold: 1,
      date: "28 Aug 2026",
    },
  ]);
  const [employee, setEmployee] = useState(people[0][0]),
    [count, setCount] = useState(100),
    [selectedChapters, setSelectedChapters] = useState([chapters[0]]),
    [memberSearch, setMemberSearch] = useState(""),
    [chapterSearch, setChapterSearch] = useState(""),
    [memberState, setMemberState] = useState("Idle"),
    [startPage, setStartPage] = useState(1),
    [endPage, setEndPage] = useState(100),
    [multi, setMulti] = useState(false),
    [readyOnly, setReadyOnly] = useState(false);
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10);
  const paginatedAllocations = allocations.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const toggleChapter = (x) =>
    setSelectedChapters((s) =>
      s.includes(x) ? s.filter((v) => v !== x) : [...s, x],
    );
  const allocate = (e) => {
    e.preventDefault();
    const amount = Math.max(0, Math.min(100, Number(count) || 0)),
      req = requirements.find((x) => x.id === activeRequirement);
    if (!req) {
      note("Select a client requirement first");
      return;
    }
    if (amount < 1) {
      note("Enter a file count between 1 and 100");
      return;
    }
    if (!selectedChapters.length) {
      note("Select at least one chapter");
      return;
    }
    if (Number(endPage) < Number(startPage)) {
      note("End page must be after start page");
      return;
    }
    const person = people.find((x) => x[0] === employee);
    setAllocations((a) => [
      {
        id: `ALC-${1001 + a.length}`,
        requirementId: req.id,
        isbn: req.isbn,
        outputs: req.outputs,
        employee,
        department: person[1],
        allocated: amount,
        completed: 0,
        rejected: 0,
        hold: 0,
        date: "29 Aug 2026",
      },
      ...a,
    ]);
    setRequirements((r) =>
      r.map((x) => (x.id === req.id ? { ...x, status: "Assigned" } : x)),
    );
    note(
      `${req.outputs.join(" + ")} for ISBN ${req.isbn} allocated to ${employee}`,
    );
  };
  const update = (id, field, change) =>
    setAllocations((a) =>
      a.map((x) => {
        if (x.id !== id) return x;
        const next = Math.max(
          0,
          Math.min(
            field === "completed"
              ? x.allocated
              : Math.max(0, x.allocated - x.completed),
            x[field] + change,
          ),
        );
        return { ...x, [field]: next };
      }),
    );
  const total = allocations.reduce((n, x) => n + x.allocated, 0),
    completed = allocations.reduce((n, x) => n + x.completed, 0),
    rejected = allocations.reduce((n, x) => n + x.rejected, 0),
    hold = allocations.reduce((n, x) => n + x.hold, 0);
  return (
    <>
      <Head
        over="WORKLOAD CONTROL"
        title="Project allocation"
        text="Select project chapters and pages, allot them to employees, and track every file through completion."
      />
      <section className="panel project-allocation">
        <div className="project-context">
          <span>
            <small>Customer name</small>
            <b>John Wiley</b>
          </span>
          <span>
            <small>Project name</small>
            <b>FY27_Key_Concepts_in_VCE_Economics_U3_and_4_12E_9781394472567</b>
          </span>
          <span>
            <small>Stage name</small>
            <b>Artwork Correction 1</b>
          </span>
        </div>
        <div className="allocation-notice">
          <CheckCircle2 />
          <span>
            <b>Chapter allocation is ready</b>
            <small>
              Chapters are enabled after the project plan is completed for each
              chapter.
            </small>
          </span>
        </div>
        <form onSubmit={allocate}>
          <div className="chapter-options">
            <label>
              <input
                type="checkbox"
                checked={readyOnly}
                onChange={(e) => setReadyOnly(e.target.checked)}
              />
              Ready to start chapters only
            </label>
            <label>
              <input
                type="checkbox"
                checked={multi}
                onChange={(e) => setMulti(e.target.checked)}
              />
              Select for multiple allotment with separate production entry
            </label>
          </div>
          <div className="allocation-selector">
            <section>
              <header>
                <span>Process name</span>
                <b>1 selected</b>
              </header>
              <div className="selection-list">
                <label className="selected">
                  <input type="radio" checked readOnly />
                  Art QC
                </label>
                <label>
                  <input type="radio" readOnly />
                  Artwork Correction
                </label>
                <label>
                  <input type="radio" readOnly />
                  Image Cleanup
                </label>
              </div>
            </section>
            <section>
              <header>
                <span>Chapter name ({selectedChapters.length})</span>
                <label>
                  <Search />
                  <input
                    value={chapterSearch}
                    onChange={(e) => setChapterSearch(e.target.value)}
                    placeholder="Search chapter"
                  />
                </label>
              </header>
              <div className="selection-list">
                {chapters
                  .filter((x) =>
                    x.toLowerCase().includes(chapterSearch.toLowerCase()),
                  )
                  .map((x) => (
                    <label
                      className={selectedChapters.includes(x) ? "selected" : ""}
                      key={x}
                    >
                      <input
                        type="checkbox"
                        checked={selectedChapters.includes(x)}
                        onChange={() => toggleChapter(x)}
                      />
                      {x}
                    </label>
                  ))}
              </div>
            </section>
            <i className="selector-arrow">
              <ChevronRight />
            </i>
            <section>
              <header>
                <span>Chapterwise pages</span>
                <b>{selectedChapters.length} chapters</b>
              </header>
              <div className="selection-list selected-pages">
                {selectedChapters.length ? (
                  selectedChapters.map((x) => (
                    <div key={x}>
                      <b>{x}</b>
                      <span>
                        Pages {startPage}–{endPage} · YTA
                      </span>
                    </div>
                  ))
                ) : (
                  <p>No chapters selected</p>
                )}
              </div>
            </section>
          </div>
          <div className="member-allocation">
            <div className="member-head">
              <div>
                <button
                  type="button"
                  className={memberState === "Busy" ? "on busy" : ""}
                  onClick={() => setMemberState("Busy")}
                >
                  Busy users
                </button>
                <button
                  type="button"
                  className={memberState === "Idle" ? "on" : ""}
                  onClick={() => setMemberState("Idle")}
                >
                  Idle users
                </button>
              </div>
              <span>{memberState} employee list</span>
            </div>
            <div className="member-grid">
              <section>
                <label>
                  Available members
                  <div>
                    <Search />
                    <input
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search employee"
                    />
                  </div>
                </label>
                <div className="member-list">
                  {people
                    .filter((x) =>
                      x[0].toLowerCase().includes(memberSearch.toLowerCase()),
                    )
                    .map((x) => (
                      <button
                        type="button"
                        className={employee === x[0] ? "selected" : ""}
                        onClick={() => setEmployee(x[0])}
                        key={x[0]}
                      >
                        <span>
                          <b>{x[0]}</b>
                          <small>{x[1]}</small>
                        </span>
                        <i>{memberState}</i>
                      </button>
                    ))}
                </div>
              </section>
              <i className="member-arrow">
                <ChevronRight />
              </i>
              <section>
                <label>Allotted members</label>
                <div className="allotted-member">
                  <div className="avatar">
                    {employee
                      .split(" ")
                      .map((x) => x[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <span>
                    <b>{employee}</b>
                    <small>
                      {people.find((x) => x[0] === employee)?.[1]} department
                    </small>
                  </span>
                  <CheckCircle2 />
                </div>
              </section>
              <section className="page-fields">
                <label>
                  Start page
                  <input
                    type="number"
                    min="1"
                    value={startPage}
                    onChange={(e) => setStartPage(e.target.value)}
                  />
                </label>
                <label>
                  End page
                  <input
                    type="number"
                    min="1"
                    value={endPage}
                    onChange={(e) => setEndPage(e.target.value)}
                  />
                </label>
                <label>
                  Number of files
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                  />
                  <small>Maximum 100</small>
                </label>
              </section>
            </div>
          </div>
          <div className="allocation-submit">
            <span>
              {selectedChapters.length} chapter(s) · Pages {startPage}–{endPage}{" "}
              · {count || 0} files
            </span>
            <button className="primary" type="submit">
              <ClipboardCheck />
              Submit allocation
            </button>
          </div>
        </form>
      </section>
      <div className="allocation-kpis">
        <article>
          <i>
            <FileArchive />
          </i>
          <div>
            <span>Total allocated</span>
            <b>{total}</b>
            <small>Across {allocations.length} allocations</small>
          </div>
        </article>
        <article>
          <i className="complete">
            <CheckCircle2 />
          </i>
          <div>
            <span>Completed</span>
            <b>{completed}</b>
            <small>
              {Math.round((completed / total) * 100) || 0}% of allocated files
            </small>
          </div>
        </article>
        <article>
          <i className="remaining">
            <Clock3 />
          </i>
          <div>
            <span>Remaining</span>
            <b>{Math.max(0, total - completed)}</b>
            <small>Still to be completed</small>
          </div>
        </article>
        <article>
          <i className="rejected">
            <RefreshCcw />
          </i>
          <div>
            <span>Rejected</span>
            <b>{rejected}</b>
            <small>Returned for correction</small>
          </div>
        </article>
        <article>
          <i className="hold">
            <Pause />
          </i>
          <div>
            <span>On hold</span>
            <b>{hold}</b>
            <small>Temporarily paused</small>
          </div>
        </article>
      </div>
      <section className="panel allocation-table">
        <div className="allocation-title">
          <div>
            <h3>Employee allocations</h3>
            <p>
              Live completion and exception status for every assigned batch.
            </p>
          </div>
          <span>{allocations.length} active batches</span>
        </div>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Allocation</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Allocated</th>
                <th>Completed</th>
                <th>Remaining</th>
                <th>Rejected</th>
                <th>On hold</th>
                <th>Progress</th>
                <th>Update status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAllocations.map((x) => (
                <tr key={x.id}>
                  <td>
                    <b>{x.id}</b>
                    <small>{x.date}</small>
                  </td>
                  <td>
                    <b>{x.employee}</b>
                  </td>
                  <td>{x.department}</td>
                  <td>{x.allocated}</td>
                  <td>
                    <span className="allocation-number done">
                      {x.completed}
                    </span>
                  </td>
                  <td>
                    <span className="allocation-number remain">
                      {Math.max(0, x.allocated - x.completed)}
                    </span>
                  </td>
                  <td>
                    <span className="allocation-number reject">
                      {x.rejected}
                    </span>
                  </td>
                  <td>
                    <span className="allocation-number paused">{x.hold}</span>
                  </td>
                  <td>
                    <div className="allocation-progress">
                      <i>
                        <b
                          style={{
                            width: `${(x.completed / x.allocated) * 100}%`,
                          }}
                        />
                      </i>
                      <span>
                        {Math.round((x.completed / x.allocated) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="allocation-actions">
                      <button
                        title="Mark one file completed"
                        onClick={() => update(x.id, "completed", 1)}
                      >
                        <CheckCircle2 />
                        Complete
                      </button>
                      <button
                        title="Mark one file rejected"
                        onClick={() => update(x.id, "rejected", 1)}
                      >
                        <RefreshCcw />
                        Reject
                      </button>
                      <button
                        title="Put one file on hold"
                        onClick={() => update(x.id, "hold", 1)}
                      >
                        <Pause />
                        Hold
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalItems={allocations.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          itemName="batches"
        />
      </section>
    </>
  );
}

function People({ tasks, note }) {
  const seed = [
    {
      id: "GEN0019",
      name: "Sundharesan T",
      email: "sundharesan.t@gentize.com",
      designation: "JOB ANALYSIS",
      department: "Job Analysis & Planning",
      phone: "+91 98765 43210",
      status: "Available",
    },
    {
      id: "20016",
      name: "Inbakumar R",
      email: "inbakumar.r@gentize.com",
      designation: "QAG",
      department: "Quality Assurance Group",
      phone: "+91 98765 43211",
      status: "Available",
    },
    {
      id: "GEN0001",
      name: "Jaisrinivas P K",
      email: "jaisrinivas.pk@gentize.com",
      designation: "DEVELOPER",
      department: "Development",
      phone: "+91 98765 43212",
      status: "Available",
    },
    {
      id: "GEN0032",
      name: "Santhosh Kumar A",
      email: "santhoshkumar.a@gentize.com",
      designation: "QC",
      department: "Quality Control",
      phone: "+91 98765 43213",
      status: "Available",
    },
    {
      id: "GEN0008",
      name: "Sivakumar G",
      email: "sivakumar.g@gentize.com",
      designation: "DEVELOPER",
      department: "Development",
      phone: "+91 98765 43214",
      status: "Busy",
    },
    {
      id: "GEN0007",
      name: "Vandhana T",
      email: "vandhana.t@gentize.com",
      designation: "HR",
      department: "Human Resources",
      phone: "+91 98765 43215",
      status: "Available",
    },
    {
      id: "GEN0006",
      name: "Arul Yosuva",
      email: "arul.yosuva@gentize.com",
      designation: "ADMIN",
      department: "Administration",
      phone: "+91 98765 43216",
      status: "Available",
    },
    {
      id: "GEN0014",
      name: "Monica R",
      email: "monica.r@gentize.com",
      designation: "DEVELOPER",
      department: "Development",
      phone: "+91 98765 43217",
      status: "Available",
    },
    {
      id: "GEN0015",
      name: "Saranya V",
      email: "saranya.v@gentize.com",
      designation: "DEVELOPER",
      department: "Development",
      phone: "+91 98765 43218",
      status: "Busy",
    },
    {
      id: "GEN0023",
      name: "B.Vignesh",
      email: "b.vignesh@gentize.com",
      designation: "MANAGER",
      department: "Management",
      phone: "+91 98765 43219",
      status: "Available",
    },
    {
      id: "GEN0018",
      name: "Sheeba S",
      email: "sheeba.s@gentize.com",
      designation: "DEVELOPER",
      department: "Development",
      phone: "+91 98765 43220",
      status: "Available",
    },
    {
      id: "GEN0021",
      name: "Jayasurya J",
      email: "jayasurya.j@gentize.com",
      designation: "DEVELOPER",
      department: "Development",
      phone: "+91 98765 43221",
      status: "Available",
    },
  ];
  const [people, setPeople] = useState(seed),
    [openForm, setOpenForm] = useState(false),
    [view, setView] = useState(null),
    [search, setSearch] = useState(""),
    [form, setForm] = useState({
      name: "",
      email: "",
      phone: "",
      designation: "Employee",
      department: "Production",
    });
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10);
  const change = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const add = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      note("Enter employee name and email");
      return;
    }
    const person = {
      ...form,
      id: `EMP${String(people.length + 1).padStart(3, "0")}`,
      status: "Available",
    };
    setPeople((p) => [person, ...p]);
    setOpenForm(false);
    setForm({
      name: "",
      email: "",
      phone: "",
      designation: "Employee",
      department: "Production",
    });
    note("Employee added successfully");
  };

  if (view)
    return (
      <EmployeeDetailProfile
        employee={view}
        onBack={() => setView(null)}
        note={note}
      />
    );

  const filtered = people.filter(
    (p) =>
      !search ||
      Object.values(p).join(" ").toLowerCase().includes(search.toLowerCase()),
  );
  const paginatedPeople = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  return (
    <>
      <Head
        over="TEAM ADMINISTRATION"
        title="Employees & Admin"
        text="Manage employee and administrator details, roles, departments and workload."
        action={
          <button className="primary" onClick={() => setOpenForm((x) => !x)}>
            <Plus />
            Add employee
          </button>
        }
      />
      {openForm && (
        <section className="panel employee-create">
          <div>
            <h3>Employee details</h3>
            <p>Complete the information below, then add the employee.</p>
          </div>
          <form onSubmit={add}>
            <label>
              Full name
              <input
                name="name"
                value={form.name}
                onChange={change}
                placeholder="Employee name"
              />
            </label>
            <label>
              Email address
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={change}
                placeholder="employee@company.com"
              />
            </label>
            <label>
              Phone number
              <input
                name="phone"
                value={form.phone}
                onChange={change}
                placeholder="+91 98765 43210"
              />
            </label>
            <label>
              Designation
              <select
                name="designation"
                value={form.designation}
                onChange={change}
              >
                <option>Employee</option>
                <option>Admin</option>
                <option>Project Admin</option>
                <option>Team Lead</option>
                <option>Quality Analyst</option>
                <option>Art QC</option>
              </select>
            </label>
            <label>
              Department
              <select
                name="department"
                value={form.department}
                onChange={change}
              >
                {[
                  "Production",
                  "Art",
                  "Graphics",
                  "Quality",
                  "Editorial",
                  "Digital",
                  "Administration",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <div className="employee-form-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setOpenForm(false)}
              >
                Cancel
              </button>
              <button className="primary" type="submit">
                <Plus />
                Add employee
              </button>
            </div>
          </form>
        </section>
      )}
      <section className="panel table-panel">
        <div className="employee-list-title">
          <div>
            <b>Admin / employees</b>
            <span>
              {filtered.length} active accounts · Click any row to view full
              profile
            </span>
          </div>
          <div>
            <Search
              style={{ width: 14, color: "var(--muted)", marginRight: 6 }}
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search employee or admin..."
              style={{
                border: "1px solid var(--line)",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 11,
              }}
            />
          </div>
        </div>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Contact</th>
                <th>Active work</th>
                <th>Workload</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPeople.map((p, i) => (
                <tr
                  key={p.id}
                  onClick={() => setView(p)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <b>{p.name}</b>
                    <small>{p.id}</small>
                  </td>
                  <td>{p.designation}</td>
                  <td>{p.department}</td>
                  <td>
                    <b>{p.email}</b>
                    <small>{p.phone || "Not provided"}</small>
                  </td>
                  <td>
                    {tasks.filter((t) => t.employee === p.name).length} tasks
                  </td>
                  <td>
                    <div className="progress">
                      <i>
                        <b style={{ width: 35 + ((i * 7) % 60) + "%" }} />
                      </i>
                      <span>{35 + ((i * 7) % 60)}%</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={badge(
                        p.status === "Available" ? "Completed" : "Pending",
                      )}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="employee-view"
                      onClick={(e) => {
                        e.stopPropagation();
                        setView(p);
                      }}
                    >
                      <Eye />
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          itemName="accounts"
        />
      </section>
    </>
  );
}
function SettingsPage({ reset }) {
  return (
    <>
      <Head
        over="SYSTEM CONFIGURATION"
        title="Settings"
        text="Manage preferences and working-model data."
      />
      <div className="settings">
        <article className="panel">
          <Users />
          <div>
            <h3>Profile & account</h3>
            <p>Update name, email and password.</p>
          </div>
          <button className="secondary">Manage</button>
        </article>
        <article className="panel">
          <Bell />
          <div>
            <h3>Notifications</h3>
            <p>Configure deadline and QC alerts.</p>
          </div>
          <button className="secondary">Configure</button>
        </article>
        <article className="panel">
          <RefreshCcw />
          <div>
            <h3>Reset demo data</h3>
            <p>Restore all original projects and files.</p>
          </div>
          <button className="danger" onClick={reset}>
            Reset demo
          </button>
        </article>
      </div>
    </>
  );
}
function Placeholder({ name }) {
  return (
    <>
      <Head
        over="CONNECTED MODULE"
        title={name}
        text={`${name} shares the same project, chapter and employee records.`}
      />
      <section className="panel placeholder">
        <ShieldCheck />
        <h3>{name} workspace</h3>
        <p>Create, review and update linked production records here.</p>
        <button className="primary">
          <Plus />
          Create record
        </button>
      </section>
    </>
  );
}
