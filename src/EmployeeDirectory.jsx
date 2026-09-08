import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Award,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  Download,
  Edit3,
  Eye,
  FileText,
  GraduationCap,
  Heart,
  Home,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  Users,
  X
} from "lucide-react";
import "./employee-directory.css";
import "./employee-directory-advanced.css";
import Pagination from "./Pagination";
import "./pagination.css";

const blank = {
  empId: "",
  giEmpId: "",
  name: "",
  address: "",
  permanentAddress: "",
  phone: "",
  personalEmail: "",
  officeEmail: "",
  designation: "",
  department: "Production Technology",
  panCard: "",
  aadhaarNumber: "",
  emergencyContact: "",
  bloodGroup: "",
  dob: "",
  doj: "",
  qualification: "",
  experience: "",
  gender: "",
  deviceNumber: "",
  mainDoorAccess: "No",
  leftDoorAccess: "No"
};

const ATTACHED_DESIGNATIONS = {
  "praveen b": "FMS",
  "navin j": "TPS",
  "rahul r": "TPS",
  "bala murugan": "GRAPHICS",
  "dinesh s": "GRAPHICS",
  "m.abishek": "GRAPHICS",
  "prakash a": "GRAPHICS",
  "harish a": "GRAPHICS",
  "ayyanthan.p": "GRAPHICS",
  "santhosh kumar": "QC",
  "santhosh kumar a": "QC",
  "praveenthan s": "QC",
  "raghu": "QC",
  "devi k": "QC",
  "muruga bhavani": "QC",
  "swetha.p": "QC",
  "vimal raj": "QC",
  "mohanapriya t": "QC",
  "monica r": "DEVELOPER",
  "saranya v": "DEVELOPER",
  "sheeba s": "DEVELOPER",
  "jayasurya j": "DEVELOPER",
  "elambharathi k": "DEVELOPER",
  "muthukumar g": "DEVELOPER",
  "sivakumar g": "DEVELOPER",
  "rajesh kannan": "DEVELOPER",
  "jisleena": "DEVELOPER",
  "dharshana priya": "DEVELOPER",
  "preethi babudos": "DEVELOPER",
  "suriyaprakash t": "DEVELOPER",
  "dharshini": "DEVELOPER",
  "sudhinraj a": "DEVELOPER",
  "pradhap": "DEVELOPER",
  "kabilesh": "DEVELOPER",
  "g mano": "DEVELOPER",
  "inbakumar r": "QAG",
  "udhayapriyan s": "QAG",
  "udhayapriyans": "QAG",
  "santhosh vikran": "QAG",
  "lakshmi": "QAG",
  "arul yosuva": "ADMIN",
  "sundharesan t": "JOB ANALYSIS",
  "abdul razack m": "PJM",
  "vandhana t": "HR",
  "vignesh b": "MANAGER",
  "ganesh k": "DIRECTORS",
  "ramandeep poonnuram": "DIRECTORS",
  "parthiban baskaran": "DIRECTORS"
};

const designationFor = employee => {
  const name = String(employee.name || "").trim().toLowerCase().replace(/\s+/g, " ");
  return ATTACHED_DESIGNATIONS[name] || employee.designation || "";
};

export default function EmployeeDirectory({ note }) {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const r = await fetch("/api/employees");
      const x = await r.json();
      if (!r.ok) throw Error();
      setEmployees((x.items || []).map(employee => ({ ...employee, designation: designationFor(employee) })));
      setError("");
    } catch {
      setError("Gentize Attendance Excel could not be loaded. Restart Vite.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(
    () =>
      employees.filter(
        x =>
          !search ||
          Object.values(x)
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [employees, search]
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const paginatedRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);

  const save = async data => {
    try {
      await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      setForm(null);
      await load();
      if (selected && (selected.empId === data.empId || selected.empId === data.originalEmpId)) {
        setSelected(data);
      }
      note?.("Employee saved");
    } catch (e) {
      note?.("Failed to save employee");
    }
  };

  const remove = async x => {
    if (!confirm(`Delete ${x.name}?`)) return;
    try {
      await fetch("/api/employees/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empId: x.empId })
      });
      await load();
      if (selected?.empId === x.empId) setSelected(null);
      note?.("Employee deleted");
    } catch (e) {
      note?.("Failed to delete employee");
    }
  };

  if (selected) {
    return (
      <Profile
        x={selected}
        back={() => setSelected(null)}
        edit={() => setForm({ ...selected, originalEmpId: selected.empId })}
        note={note}
      />
    );
  }

  return (
    <>
      <div className="ed-head">
        <div>
          <small>EMPLOYEE MASTER</small>
          <h1>Employees & Admin</h1>
          <p>Employee records from Gentize Attendance.xlsx.</p>
        </div>
        <button className="ed-add" onClick={() => setForm({ ...blank })}>
          <Plus size={16} /> Add Employee
        </button>
      </div>
      <div className="ed-kpis">
        <article>
          <Users size={24} />
          <span>
            <small>Total employees</small>
            <b>{employees.length}</b>
          </span>
        </article>
        <article>
          <span>
            <small>With GI Employee ID</small>
            <b>{employees.filter(x => x.giEmpId).length}</b>
          </span>
        </article>
        <article>
          <span>
            <small>Designations</small>
            <b>{new Set(employees.map(x => x.designation).filter(Boolean)).size}</b>
          </span>
        </article>
      </div>
      <section className="panel ed-table">
        <header>
          <div>
            <b>Employee_Master</b>
            <span>{rows.length} records</span>
          </div>
          <label>
            <Search size={14} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search employee..."
            />
          </label>
        </header>
        {error && <div className="ed-error">{error}</div>}
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>GI Employee ID</th>
                <th>Designation</th>
                <th>Contact</th>
                <th>Qualification</th>
                <th>DOJ</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map(x => (
                <tr key={`${x.empId}-${x.name}`}>
                  <td onClick={() => setSelected(x)}>
                    <b>{x.name}</b>
                    <small>Emp ID: {x.empId || "—"}</small>
                  </td>
                  <td>{x.giEmpId || "—"}</td>
                  <td>{x.designation || "—"}</td>
                  <td>
                    <b>{x.officeEmail || x.personalEmail || "—"}</b>
                    <small>{x.phone || "—"}</small>
                  </td>
                  <td>{x.qualification || "—"}</td>
                  <td>{x.doj || "—"}</td>
                  <td>
                    <div className="ed-actions">
                      <button onClick={() => setSelected(x)}>
                        <Eye size={13} /> View
                      </button>
                      <button onClick={() => setForm({ ...x, originalEmpId: x.empId })}>
                        <Edit3 size={13} /> Edit
                      </button>
                      <button className="delete" onClick={() => remove(x)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 0 && (
          <Pagination
            currentPage={page}
            totalItems={rows.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            itemName="employees"
          />
        )}
      </section>
      {form && <EmployeeForm value={form} close={() => setForm(null)} save={save} />}
    </>
  );
}

function EmployeeForm({ value, close, save }) {
  const [f, setF] = useState(value);
  const change = e => setF(x => ({ ...x, [e.target.name]: e.target.value }));
  const fields = [
    ["empId", "Employee ID"],
    ["giEmpId", "GI Employee ID"],
    ["name", "Employee Name"],
    ["designation", "Designation"],
    ["department", "Department"],
    ["phone", "Phone Number"],
    ["personalEmail", "Personal Email"],
    ["officeEmail", "Office Email"],
    ["emergencyContact", "Emergency Contact"],
    ["bloodGroup", "Blood Group"],
    ["dob", "Date of Birth"],
    ["doj", "Date of Joining"],
    ["qualification", "Qualification"],
    ["experience", "Experience"],
    ["gender", "Gender"],
    ["panCard", "PAN Card"],
    ["aadhaarNumber", "Aadhaar Number"],
    ["deviceNumber", "Device Number"],
    ["address", "Current Address"],
    ["permanentAddress", "Permanent Address"]
  ];

  return (
    <div className="ed-modal-bg">
      <form
        className="ed-form"
        onSubmit={e => {
          e.preventDefault();
          save(f);
        }}
      >
        <header>
          <h2>{f.originalEmpId ? "Edit Employee" : "Add Employee"}</h2>
          <button type="button" onClick={close}>
            <X size={18} />
          </button>
        </header>
        <div>
          {fields.map(([name, label]) => (
            <label className={name.toLowerCase().includes("address") ? "wide" : ""} key={name}>
              {label}
              {name.toLowerCase().includes("address") ? (
                <textarea name={name} value={f[name] || ""} onChange={change} />
              ) : (
                <input
                  name={name}
                  value={f[name] || ""}
                  onChange={change}
                  required={["empId", "name", "designation"].includes(name)}
                />
              )}
            </label>
          ))}
          {["mainDoorAccess", "leftDoorAccess"].map((name, i) => (
            <label key={name}>
              {i ? "Left Door Access" : "Main Door Access"}
              <select name={name} value={f[name] || "No"} onChange={change}>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
          ))}
        </div>
        <footer>
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button type="submit">Save Employee</button>
        </footer>
      </form>
    </div>
  );
}

// Production and activity values are populated from real backend records.
/*
const performanceChartData = [
  { month: "Jun '24", completed: 22, allocated: 45, quality: 88 },
  { month: "Jul '24", completed: 25, allocated: 50, quality: 90 },
  { month: "Aug '24", completed: 30, allocated: 55, quality: 91 },
  { month: "Sep '24", completed: 28, allocated: 52, quality: 89 },
  { month: "Oct '24", completed: 32, allocated: 50, quality: 93 },
  { month: "Nov '24", completed: 30, allocated: 53, quality: 92 },
  { month: "Dec '24", completed: 28, allocated: 48, quality: 90 },
  { month: "Jan '25", completed: 31, allocated: 54, quality: 89 },
  { month: "Feb '25", completed: 27, allocated: 48, quality: 92 },
  { month: "Mar '25", completed: 33, allocated: 55, quality: 93 },
  { month: "Apr '25", completed: 35, allocated: 58, quality: 94 },
  { month: "May '25", completed: 38, allocated: 62, quality: 96 }
];

const defaultAllocations = [
  {
    isbn: "978-93-12345-01-2",
    project: "Data Structures in C",
    stage: "Typesetting",
    priority: "Medium",
    dueDate: "22-05-2025",
    status: "In Progress"
  },
  {
    isbn: "978-93-12345-02-9",
    project: "Operating Systems Concepts",
    stage: "Proofreading",
    priority: "High",
    dueDate: "25-05-2025",
    status: "In Progress"
  },
  {
    isbn: "978-93-12345-03-6",
    project: "Database Management Systems",
    stage: "QC Check",
    priority: "Medium",
    dueDate: "28-05-2025",
    status: "In Progress"
  },
  {
    isbn: "978-93-12345-04-3",
    project: "Computer Networks",
    stage: "Indexing",
    priority: "Low",
    dueDate: "30-05-2025",
    status: "Not Started"
  },
  {
    isbn: "978-93-12345-05-0",
    project: "Software Engineering",
    stage: "Typesetting",
    priority: "High",
    dueDate: "03-06-2025",
    status: "Not Started"
  }
];

const defaultRecentActivities = [
  {
    id: 1,
    icon: "file",
    title: 'Downloaded file "Data Structures in C"',
    time: "Today, 10:15 AM"
  },
  {
    id: 2,
    icon: "refresh",
    title: 'Updated status to "In Progress" for ISBN 978-93-12345-01-2',
    time: "Today, 09:42 AM"
  },
  {
    id: 3,
    icon: "upload",
    title: 'Uploaded file "Operating Systems Concepts - V1"',
    time: "Yesterday, 06:30 PM"
  },
  {
    id: 4,
    icon: "check",
    title: 'QC completed for "Database Management Systems"',
    time: "Yesterday, 04:18 PM"
  },
  {
    id: 5,
    icon: "file",
    title: 'Downloaded file "Computer Networks"',
    time: "14-05-2025, 11:05 AM"
  }
];
*/

const performanceChartData = [];
const defaultAllocations = [];
const defaultRecentActivities = [];

export function Profile({ x, back, edit, note, selfView = false, onChangePassword }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [timeRange, setTimeRange] = useState("Last 12 Months");
  const [attendanceMonth, setAttendanceMonth] = useState("May 2025");

  const initials = (x.name || "Employee")
    .split(/\s+/)
    .map(v => v[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const providedDetails = [
    ["Employee ID", x.empId], ["GI Employee ID", x.giEmpId], ["Designation", x.designation],
    ["Department", x.department], ["Phone", x.phone], ["Personal Email", x.personalEmail],
    ["Office Email", x.officeEmail], ["Date of Birth", x.dob], ["Date of Joining", x.doj],
    ["Gender", x.gender], ["Blood Group", x.bloodGroup], ["Qualification", x.qualification],
    ["Experience", x.experience], ["Emergency Contact", x.emergencyContact], ["PAN Card", x.panCard],
    ["Aadhaar Number", x.aadhaarNumber], ["Device Number", x.deviceNumber],
    ["Main Door Access", x.mainDoorAccess], ["Left Door Access", x.leftDoorAccess],
    ["Current Address", x.address], ["Permanent Address", x.permanentAddress]
  ].filter(([, value]) => String(value || "").trim());

  const [allocPage, setAllocPage] = useState(1);
  const [allocPageSize, setAllocPageSize] = useState(5);
  const paginatedAllocations = defaultAllocations.slice((allocPage - 1) * allocPageSize, allocPage * allocPageSize);

  // Chart Dimensions & Scales
  const svgWidth = 740;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 25;
  const padBottom = 35;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const count = performanceChartData.length;
  const stepX = plotWidth / count;

  // Grid levels (100, 75, 50, 25, 0)
  const gridLevels = [100, 75, 50, 25, 0];

  const getYFiles = val => padTop + plotHeight - (val / 100) * plotHeight;
  const getYQuality = val => padTop + plotHeight - (val / 100) * plotHeight;

  // Generate Quality line points
  const linePoints = performanceChartData.map((d, i) => {
    const cx = padLeft + i * stepX + stepX / 2;
    const cy = getYQuality(d.quality);
    return { cx, cy, d, i };
  });

  const linePathD = linePoints
    .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.cx.toFixed(1)} ${pt.cy.toFixed(1)}`)
    .join(" ");

  // Donut Gauge Specs (Radius = 36)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const attendancePct = 92;
  const strokeDashoffset = circumference - (attendancePct / 100) * circumference;

  return (
    <div className="emp-details-view-container">
      {/* Top Header & Breadcrumb Bar */}
      <div className="emp-page-header">
        <div className="emp-header-left">
          <div className="emp-breadcrumb">
            <span className="emp-bc-root">{selfView ? "Employee Account" : "Employees & Admin"}</span>
            <span className="emp-bc-sep">/</span>
            <span className="emp-bc-active">{selfView ? "My Profile" : "Employee Details"}</span>
          </div>
          <h1 className="emp-page-title">{selfView ? "My Profile" : "Employee Details"}</h1>
          {!selfView && <button className="emp-btn-back" onClick={back}>
            <ChevronLeft size={16} />
            <span>Back to Employees</span>
          </button>}
        </div>
        <div className="emp-header-right-actions">
          {selfView ? <button className="emp-btn-outline-edit" onClick={onChangePassword}>
            <ShieldCheck size={15} />
            <span>Change Password</span>
          </button> : <><button className="emp-btn-outline-edit" onClick={edit}>
            <Edit3 size={15} />
            <span>Edit Employee</span>
          </button>
          <button
            className="emp-btn-outline-more"
            onClick={() => note?.("More actions menu opened")}
          >
            <MoreVertical size={15} />
            <span>More Actions</span>
          </button>
          </>}
        </div>
      </div>

      {/* Hero Profile Info Card */}
      <div className="emp-hero-profile-card">
        <div className="emp-hero-avatar-box">
          <div className="emp-hero-avatar-circle">{initials}</div>
        </div>
        <div className="emp-hero-details-box">
          <div className="emp-hero-name-row">
            <h2 className="emp-hero-name">{x.name}</h2>
            <span className="emp-status-badge-active">Active</span>
          </div>
          <div className="emp-hero-meta-grid">
            <div className="emp-meta-cell">
              <span className="emp-meta-label">
                <User size={13} className="emp-meta-icon" />
                Employee ID
              </span>
              <strong className="emp-meta-val">{x.empId || "—"}</strong>
            </div>
            <div className="emp-meta-cell">
              <span className="emp-meta-label">
                <ShieldCheck size={13} className="emp-meta-icon" />
                GI Employee ID
              </span>
              <strong className="emp-meta-val">{x.giEmpId || "—"}</strong>
            </div>
            <div className="emp-meta-cell">
              <span className="emp-meta-label">
                <Briefcase size={13} className="emp-meta-icon" />
                Designation
              </span>
              <strong className="emp-meta-val">{x.designation || "—"}</strong>
            </div>
            <div className="emp-meta-cell">
              <span className="emp-meta-label">
                <Building2 size={13} className="emp-meta-icon" />
                Department
              </span>
              <strong className="emp-meta-val">
                {x.department || "Production Technology"}
              </strong>
            </div>
            <div className="emp-meta-cell">
              <span className="emp-meta-label">
                <Calendar size={13} className="emp-meta-icon" />
                Joining Date
              </span>
              <strong className="emp-meta-val">{x.doj || "—"}</strong>
            </div>
            <div className="emp-meta-cell">
              <span className="emp-meta-label">
                <Mail size={13} className="emp-meta-icon" />
                Email
              </span>
              <strong className="emp-meta-val">
                {x.officeEmail || x.personalEmail || "—"}
              </strong>
            </div>
            <div className="emp-meta-cell">
              <span className="emp-meta-label">
                <Phone size={13} className="emp-meta-icon" />
                Phone
              </span>
              <strong className="emp-meta-val">{x.phone || "—"}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Top KPI Stat Cards */}
      <div className="emp-metrics-four-grid">
        {/* 1. Files Allocated */}
        <div className="emp-metric-stat-card">
          <div className="emp-metric-icon-wrap blue-bg">
            <FileText size={20} color="#0284c7" />
          </div>
          <div className="emp-metric-text-wrap">
            <span className="emp-metric-card-title">Files Allocated</span>
            <div className="emp-metric-main-val">148</div>
            <div className="emp-metric-trend positive">
              <ArrowUp size={12} />
              <span>12% from last month</span>
            </div>
          </div>
        </div>

        {/* 2. Completed */}
        <div className="emp-metric-stat-card">
          <div className="emp-metric-icon-wrap blue-bg">
            <CheckCircle2 size={20} color="#0284c7" />
          </div>
          <div className="emp-metric-text-wrap">
            <span className="emp-metric-card-title">Completed</span>
            <div className="emp-metric-main-val">132</div>
            <div className="emp-metric-trend positive">
              <ArrowUp size={12} />
              <span>15% from last month</span>
            </div>
          </div>
        </div>

        {/* 3. In Progress */}
        <div className="emp-metric-stat-card">
          <div className="emp-metric-icon-wrap blue-bg">
            <Clock3 size={20} color="#0284c7" />
          </div>
          <div className="emp-metric-text-wrap">
            <span className="emp-metric-card-title">In Progress</span>
            <div className="emp-metric-main-val">10</div>
            <div className="emp-metric-trend negative">
              <ArrowDown size={12} />
              <span>9% from last month</span>
            </div>
          </div>
        </div>

        {/* 4. Quality Score */}
        <div className="emp-metric-stat-card">
          <div className="emp-metric-icon-wrap blue-bg">
            <Award size={20} color="#0284c7" />
          </div>
          <div className="emp-metric-text-wrap">
            <span className="emp-metric-card-title">Quality Score</span>
            <div className="emp-metric-main-val">96%</div>
            <div className="emp-metric-trend positive">
              <ArrowUp size={12} />
              <span>4% from last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="emp-content-split-layout">
        {/* Left Column (Chart + Current Allocations) */}
        <div className="emp-left-main-col">
          {/* Work Performance Chart Card */}
          <div className="emp-panel-card emp-chart-panel">
            <div className="emp-panel-header">
              <h3 className="emp-panel-heading">Work Performance</h3>
              <div className="emp-chart-legend-wrap">
                <span className="emp-legend-item">
                  <span className="emp-legend-box completed-box" />
                  Files Completed
                </span>
                <span className="emp-legend-item">
                  <span className="emp-legend-box allocated-box" />
                  Files Allocated
                </span>
                <span className="emp-legend-item">
                  <span className="emp-legend-line-dot" />
                  Quality Score (%)
                </span>
              </div>
              <div className="emp-chart-dropdown-pill">
                <Calendar size={13} />
                <span>{timeRange}</span>
                <ChevronDown size={13} />
              </div>
            </div>

            {/* SVG Combo Chart */}
            <div className="emp-svg-chart-container">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="emp-combo-chart-svg"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Horizontal Grid lines */}
                {gridLevels.map(level => {
                  const y = getYFiles(level);
                  return (
                    <g key={level} className="emp-chart-grid-row">
                      <line
                        x1={padLeft}
                        x2={svgWidth - padRight}
                        y1={y}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      {/* Left Y-axis text (Files) */}
                      <text
                        x={padLeft - 10}
                        y={y + 3.5}
                        textAnchor="end"
                        fontSize="10"
                        fill="#94a3b8"
                        fontFamily="inherit"
                      >
                        {level}
                      </text>
                      {/* Right Y-axis text (Quality Score %) */}
                      <text
                        x={svgWidth - padRight + 10}
                        y={y + 3.5}
                        textAnchor="start"
                        fontSize="10"
                        fill="#94a3b8"
                        fontFamily="inherit"
                      >
                        {level}%
                      </text>
                    </g>
                  );
                })}

                {/* Left Axis Title */}
                <text
                  x="14"
                  y={padTop + plotHeight / 2}
                  transform={`rotate(-90 14 ${padTop + plotHeight / 2})`}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="#94a3b8"
                  fontWeight="600"
                >
                  Files
                </text>

                {/* Right Axis Title */}
                <text
                  x={svgWidth - 10}
                  y={padTop + plotHeight / 2}
                  transform={`rotate(90 ${svgWidth - 10} ${padTop + plotHeight / 2})`}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="#94a3b8"
                  fontWeight="600"
                >
                  Quality Score (%)
                </text>

                {/* Grouped Bars */}
                {performanceChartData.map((d, i) => {
                  const centerX = padLeft + i * stepX + stepX / 2;
                  const barWidth = 9.5;
                  const gap = 2;

                  const hCompleted = (d.completed / 100) * plotHeight;
                  const yCompleted = padTop + plotHeight - hCompleted;

                  const hAllocated = (d.allocated / 100) * plotHeight;
                  const yAllocated = padTop + plotHeight - hAllocated;

                  const isHovered = hoveredIndex === i;

                  return (
                    <g
                      key={d.month}
                      className="emp-chart-month-group"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Hover Highlight column background */}
                      {isHovered && (
                        <rect
                          x={padLeft + i * stepX}
                          y={padTop}
                          width={stepX}
                          height={plotHeight}
                          fill="#f8fafc"
                          opacity="0.8"
                        />
                      )}

                      {/* Bar 1: Files Completed (Solid Vibrant Blue) */}
                      <rect
                        x={centerX - barWidth - gap / 2}
                        y={yCompleted}
                        width={barWidth}
                        height={Math.max(2, hCompleted)}
                        fill="#0284c7"
                        rx="1.5"
                      />

                      {/* Bar 2: Files Allocated (Light Sky Blue) */}
                      <rect
                        x={centerX + gap / 2}
                        y={yAllocated}
                        width={barWidth}
                        height={Math.max(2, hAllocated)}
                        fill="#bae6fd"
                        rx="1.5"
                      />

                      {/* X-axis Month Label */}
                      <text
                        x={centerX}
                        y={svgHeight - 12}
                        textAnchor="middle"
                        fontSize="10"
                        fill={isHovered ? "#0284c7" : "#64748b"}
                        fontWeight={isHovered ? "600" : "400"}
                      >
                        {d.month}
                      </text>
                    </g>
                  );
                })}

                {/* Quality Score Overlay Polyline */}
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#0369a1"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Quality Score Dot Nodes */}
                {linePoints.map(pt => {
                  const isHovered = hoveredIndex === pt.i;
                  return (
                    <g key={pt.i}>
                      {isHovered && (
                        <circle
                          cx={pt.cx}
                          cy={pt.cy}
                          r="7"
                          fill="#0284c7"
                          opacity="0.25"
                        />
                      )}
                      <circle
                        cx={pt.cx}
                        cy={pt.cy}
                        r={isHovered ? "4.5" : "3.2"}
                        fill="#ffffff"
                        stroke="#0369a1"
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip on Hover */}
              {hoveredIndex !== null && (
                <div
                  className="emp-chart-floating-tooltip"
                  style={{
                    left: `${Math.min(
                      85,
                      Math.max(
                        10,
                        ((padLeft + hoveredIndex * stepX + stepX / 2) / svgWidth) * 100
                      )
                    )}%`
                  }}
                >
                  <div className="emp-tt-head">
                    {performanceChartData[hoveredIndex].month}
                  </div>
                  <div className="emp-tt-row">
                    <span className="emp-tt-dot dark-blue" />
                    <span>Completed:</span>
                    <strong>{performanceChartData[hoveredIndex].completed}</strong>
                  </div>
                  <div className="emp-tt-row">
                    <span className="emp-tt-dot light-blue" />
                    <span>Allocated:</span>
                    <strong>{performanceChartData[hoveredIndex].allocated}</strong>
                  </div>
                  <div className="emp-tt-row">
                    <span className="emp-tt-dot line-blue" />
                    <span>Quality Score:</span>
                    <strong>{performanceChartData[hoveredIndex].quality}%</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Allocations Table Card */}
          <div className="emp-panel-card emp-allocations-panel">
            <div className="emp-panel-header">
              <h3 className="emp-panel-heading">Current Allocations</h3>
            </div>
            <div className="emp-table-wrapper">
              <table className="emp-allocations-table">
                <thead>
                  <tr>
                    <th>ISBN / File ID</th>
                    <th>Project</th>
                    <th>Stage</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAllocations.map(row => (
                    <tr key={row.isbn}>
                      <td className="emp-cell-isbn">{row.isbn}</td>
                      <td className="emp-cell-project">{row.project}</td>
                      <td className="emp-cell-stage">{row.stage}</td>
                      <td className="emp-cell-priority">
                        <span
                          className={`emp-priority-dot ${row.priority.toLowerCase()}`}
                        />
                        <span className="emp-priority-text">{row.priority}</span>
                      </td>
                      <td className="emp-cell-date">{row.dueDate}</td>
                      <td className="emp-cell-status">
                        <span
                          className={`emp-status-pill ${row.status
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {defaultAllocations.length > 0 && (
              <Pagination
                currentPage={allocPage}
                totalItems={defaultAllocations.length}
                pageSize={allocPageSize}
                onPageChange={setAllocPage}
                onPageSizeChange={setAllocPageSize}
                pageSizeOptions={[5, 10, 20]}
                itemName="allocations"
              />
            )}
            <div className="emp-panel-bottom-link-row">
              <button
                className="emp-link-btn"
                onClick={() => note?.("View all allocations clicked")}
              >
                <span>View all allocations</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (Personal Info + Attendance + Recent Activity) */}
        <div className="emp-right-sidebar-col">
          {/* Card 1: Personal Information */}
          <div className="emp-panel-card emp-personal-panel">
            <div className="emp-panel-header">
              <h3 className="emp-panel-heading">Personal Information</h3>
            </div>
            <div className="emp-personal-info-list">
              <div className="emp-personal-row">
                <span className="emp-pi-label">
                  <Calendar size={13} className="emp-pi-icon" />
                  Date of Birth
                </span>
                <span className="emp-pi-val">{x.dob || "15-07-1996"}</span>
              </div>
              <div className="emp-personal-row">
                <span className="emp-pi-label">
                  <User size={13} className="emp-pi-icon" />
                  Gender
                </span>
                <span className="emp-pi-val">{x.gender || "Male"}</span>
              </div>
              <div className="emp-personal-row">
                <span className="emp-pi-label">
                  <Heart size={13} className="emp-pi-icon" />
                  Blood Group
                </span>
                <span className="emp-pi-val">{x.bloodGroup || "O+"}</span>
              </div>
              <div className="emp-personal-row">
                <span className="emp-pi-label">
                  <GraduationCap size={13} className="emp-pi-icon" />
                  Qualification
                </span>
                <span className="emp-pi-val">{x.qualification || "BE ECE"}</span>
              </div>
              <div className="emp-personal-row">
                <span className="emp-pi-label">
                  <Home size={13} className="emp-pi-icon" />
                  Address
                </span>
                <span className="emp-pi-val">
                  {x.address ||
                    x.permanentAddress ||
                    "Door No. 12-3-456, Sai Nagar, Guntur, Andhra Pradesh - 522006"}
                </span>
              </div>
              <div className="emp-personal-row">
                <span className="emp-pi-label">
                  <Phone size={13} className="emp-pi-icon" />
                  Emergency Contact
                </span>
                <span className="emp-pi-val">
                  {x.emergencyContact || "S. Prasad (Father) - 9440123456"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Attendance Summary */}
          <div className="emp-panel-card emp-attendance-panel">
            <div className="emp-panel-header">
              <h3 className="emp-panel-heading">Attendance Summary</h3>
              <div className="emp-attendance-month-pill">
                <span>{attendanceMonth}</span>
                <ChevronDown size={12} />
              </div>
            </div>
            <div className="emp-attendance-body-grid">
              {/* 3 mini stat cards */}
              <div className="emp-attend-stat-boxes">
                <div className="emp-attend-box present">
                  <Calendar size={16} className="emp-attend-box-icon" />
                  <div className="emp-attend-box-val">24</div>
                  <div className="emp-attend-box-lbl">Days</div>
                  <div className="emp-attend-box-tag">Present</div>
                </div>
                <div className="emp-attend-box leave">
                  <Coffee size={16} className="emp-attend-box-icon" />
                  <div className="emp-attend-box-val">2</div>
                  <div className="emp-attend-box-lbl">Days</div>
                  <div className="emp-attend-box-tag">Leave</div>
                </div>
                <div className="emp-attend-box late">
                  <Clock3 size={16} className="emp-attend-box-icon" />
                  <div className="emp-attend-box-val">1</div>
                  <div className="emp-attend-box-lbl">Day</div>
                  <div className="emp-attend-box-tag">Late</div>
                </div>
              </div>

              {/* Circular Gauge */}
              <div className="emp-attendance-radial-donut">
                <svg width="86" height="86" viewBox="0 0 86 86">
                  <circle
                    cx="43"
                    cy="43"
                    r={radius}
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="6.5"
                  />
                  <circle
                    cx="43"
                    cy="43"
                    r={radius}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="6.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 43 43)"
                  />
                  <text
                    x="43"
                    y="40"
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="700"
                    fill="#0f172a"
                  >
                    92%
                  </text>
                  <text
                    x="43"
                    y="53"
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="#64748b"
                    fontWeight="500"
                  >
                    Attendance
                  </text>
                </svg>
              </div>
            </div>

            {/* Attendance Summary Legend Bar */}
            <div className="emp-attendance-bottom-bar">
              <span className="emp-att-leg-item">
                Working Days: <strong>27</strong>
              </span>
              <span className="emp-att-leg-item">
                <span className="emp-dot present" /> Present: <strong>24</strong>
              </span>
              <span className="emp-att-leg-item">
                <span className="emp-dot leave" /> Leave: <strong>2</strong>
              </span>
              <span className="emp-att-leg-item">
                <span className="emp-dot late" /> Late: <strong>1</strong>
              </span>
            </div>
          </div>

          {/* Card 3: Recent Activity */}
          <div className="emp-panel-card emp-activity-panel">
            <div className="emp-panel-header">
              <h3 className="emp-panel-heading">Recent Activity</h3>
            </div>
            <div className="emp-recent-activity-timeline">
              {defaultRecentActivities.map(item => (
                <div key={item.id} className="emp-activity-item">
                  <div className="emp-activity-node-col">
                    <div className="emp-activity-node-icon">
                      {item.icon === "file" && <FileText size={12} />}
                      {item.icon === "refresh" && <RefreshCw size={12} />}
                      {item.icon === "upload" && <Upload size={12} />}
                      {item.icon === "check" && <CheckCircle2 size={12} />}
                    </div>
                    <div className="emp-activity-line" />
                  </div>
                  <div className="emp-activity-content">
                    <div className="emp-activity-title">{item.title}</div>
                    <div className="emp-activity-time">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="emp-panel-bottom-link-row">
              <button
                className="emp-link-btn"
                onClick={() => note?.("View all activity clicked")}
              >
                <span>View all activity</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
