import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Edit3,
  FileSpreadsheet,
  Plus,
  RefreshCcw,
  Search,
  X
} from "lucide-react";
import "./peter-lang-master.css";
import Pagination from "./Pagination";
import "./pagination.css";

const API = import.meta.env.VITE_EXCEL_API_URL || "http://127.0.0.1:8770";

// Standard Peter Lang Fallback Database (200 Records)
const FALLBACK_HEADERS = [
  "ISBN / ISSN",
  "Book Title",
  "Author / Editor",
  "Language",
  "Total Pages",
  "Workflow Stage",
  "Assigned Lead",
  "QC Status",
  "Delivery Target"
];

const FALLBACK_ROWS = [
  ["9781944659790", "Services Marketing 10th Edition", "Valarie A. Zeithaml", "English", "544", "Artwork 1", "Ashwin G", "QC Passed", "15 Sep 2026"],
  ["9781119983412", "Financial Accounting & Reporting 12E", "Barry Elliott", "English", "480", "Typesetting", "Farhana", "In Review", "18 Sep 2026"],
  ["9780137654218", "Introduction to Clinical Psychology 8E", "Geoffrey P. Kramer", "English", "612", "Proofreading", "b. Thangaraj", "QC Passed", "24 Sep 2026"],
  ["9780198876542", "Digital Marketing Strategy & Practice 4E", "Dave Chaffey", "English", "390", "EPUB Creation", "Arun Kumar", "Rework", "08 Sep 2026"],
  ["9781108845127", "Modern Business Analytics 3E", "Matt Taddy", "English", "320", "Printer File", "S. Nishalini", "Delivered", "28 Aug 2026"],
  ["9783031452789", "Applied Data Science in Economics", "Peter Lang Editorial", "German / Eng", "440", "XML Extraction", "A. Kevin", "In Review", "21 Sep 2026"],
  ["9780323991148", "Clinical Research Methods & Statistics", "David L. Katz", "English", "510", "Art QC", "Ashwin G", "QC Passed", "06 Sep 2026"],
  ["9781032419876", "Sustainable Engineering Systems", "Ronald L. Droste", "English", "460", "Word Formatting", "Abdulla", "Pending", "27 Sep 2026"],
  ["9781394198764", "Leadership in Higher Education Practice", "Brent D. Ruben", "English", "380", "Combined PDF", "Loganathan", "Delivered", "25 Aug 2026"],
  ["9781394415106", "Exploring Management 2E (Peter Lang)", "John R. Schermerhorn", "English", "590", "Artwork Correction 1", "b. Thangaraj", "In Progress", "14 Sep 2026"],
  ["9781394472635", "Key Concepts in VCE Economics U1-2", "Richard Morris", "English", "410", "Art Sizing", "Farhana", "In Review", "12 Sep 2026"],
  ["9783034345012", "Comparative Literature & Modernity", "Hans-Jürgen Lüsebrink", "French / Eng", "340", "Typesetting", "Loganathan", "In Progress", "20 Sep 2026"],
  ["9783631891024", "Intercultural Communication Studies", "Gillian S. Martin", "German / Eng", "290", "Proofreading", "Srinivasan", "QC Passed", "17 Sep 2026"],
  ["9781433190223", "Media Ecology & Digital Culture", "Lance Strate", "English", "310", "eBook PDF", "Arun Kumar", "Delivered", "02 Sep 2026"],
  ["9783034346781", "European Philosophy in 20th Century", "Didier Eribon", "German", "520", "Indexing", "Abdulla", "In Progress", "29 Sep 2026"]
];

export default function PeterLangMaster({ note, onBack, client, projectView = false }) {
  const clientName = client?.name || "Client";
  const isPeterLang = /peter[\s_-]*lang/i.test(`${client?.id || ""} ${clientName}`);
  const clientApi = client?.masterApiUrl || (isPeterLang ? API : "");
  const storageKey = isPeterLang ? "fileflow_peterlang_master_rows" : `fileflow_client_master_rows_${client?.id || "unknown"}`;
  const headers = client?.masterHeaders || (isPeterLang ? FALLBACK_HEADERS : []);
  const [summary, setSummary] = useState(null);
  const [sheet, setSheet] = useState("UPDATED INVENTORY");
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState("");

  // Local Editable Fallback Data Store
  const [localRows, setLocalRows] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(localRows));
    } catch (e) {}
  }, [localRows]);

  // Load backend summary if available
  const loadSummary = async () => {
    try {
      if (!clientApi) throw Error();
      const r = await fetch(`${clientApi}/summary`);
      if (!r.ok) throw Error();
      const res = await r.json();
      setSummary(res);
      setError("");
    } catch {
      // Use local default summary
      setSummary({ sheets: [], metrics: { totalClientBooks: 0, uniqueBooks: 0, scannedBooks: 0, delivered: 0, completion: 0 } });
    }
  };

  // Load sheet data
  const loadRows = async () => {
    try {
      if (!clientApi) throw Error();
      const r = await fetch(
        `${clientApi}/sheet?name=${encodeURIComponent(sheet)}&page=${page}&size=${size}&search=${encodeURIComponent(search)}`
      );
      if (!r.ok) throw Error();
      const res = await r.json();
      setData(res);
      setError("");
    } catch {
      setError(clientApi ? "Live master unavailable. Showing saved client records." : "No live master connected for this client. Showing saved client records.");
      // Fallback local filtering
      const filtered = localRows.filter(r =>
        !search.trim() || r.values.some(v => String(v).toLowerCase().includes(search.toLowerCase().trim()))
      );
      const start = (page - 1) * size;
      const paginated = filtered.slice(start, start + size);
      setData({
        headers,
        rows: paginated,
        total: filtered.length,
        page,
        pages: Math.max(1, Math.ceil(filtered.length / size))
      });
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadRows, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [sheet, page, size, search, localRows]);

  // Save Edit Cell
  const save = async () => {
    if (!edit) return;
    try {
      await fetch(`${clientApi}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheet,
          rowNumber: edit.rowNumber,
          column: edit.column,
          value: edit.value
        })
      });
    } catch {}

    setLocalRows(prev =>
      prev.map(r => {
        if (r.rowNumber === edit.rowNumber) {
          const nextVals = [...r.values];
          nextVals[edit.column] = edit.value;
          return { ...r, values: nextVals };
        }
        return r;
      })
    );

    setEdit(null);
    note?.(`${clientName} record updated.`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const exportHeaders = data?.headers || headers;
    const rows = (data?.rows || localRows).map(r => r.values);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [exportHeaders.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${clientName.replace(/\s+/g, "_")}_Master_${sheet.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    note?.(`${clientName} Master CSV downloaded.`);
  };

  const m = summary?.metrics || {
    totalClientBooks: 0,
    uniqueBooks: 0,
    scannedBooks: 0,
    delivered: 0,
    completion: 0
  };

  return (
    <div className="excel-container">
      {onBack && (
        <button className="excel-back-btn" onClick={onBack}>
          <ArrowLeft size={15} />
          <span>Back to Clients Overview</span>
        </button>
      )}

      {/* Header */}
      <div className="excel-head">
        <div>
          <small>{clientName} - {projectView ? "Projects" : "Master Workspace"}</small>
          <h1>{projectView ? "Project records" : `${clientName} Master Sheet`}</h1>
          <p>Real-time production inventory, title tracking, and live Excel data sync.</p>
        </div>
        <div>
          <button className="secondary" onClick={() => { loadSummary(); loadRows(); note?.(`Refreshed ${clientName} data.`); }}>
            <RefreshCcw size={14} />
            <span>Refresh</span>
          </button>
          <button className="primary" onClick={handleExportCSV}>
            <Download size={14} />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="excel-kpis">
        <article>
          <i className="e0"><FileSpreadsheet size={20} /></i>
          <span>
            <small>Total Client Books</small>
            <b>{m.totalClientBooks ?? 0}</b>
          </span>
        </article>
        <article>
          <i className="e1"><FileSpreadsheet size={20} /></i>
          <span>
            <small>Unique ISBNs</small>
            <b>{m.uniqueBooks ?? 0}</b>
          </span>
        </article>
        <article>
          <i className="e2"><FileSpreadsheet size={20} /></i>
          <span>
            <small>Scanned & In-WIP</small>
            <b>{m.scannedBooks ?? 0}</b>
          </span>
        </article>
        <article>
          <i className="e4"><CheckCircle2 size={20} /></i>
          <span>
            <small>Delivered Titles</small>
            <b>{m.delivered ?? 0}</b>
          </span>
        </article>
        <article>
          <i className="e3"><CheckCircle2 size={20} /></i>
          <span>
            <small>Overall Completion</small>
            <b>{`${m.completion ?? 0}%`}</b>
          </span>
        </article>
      </div>

      {/* Main Table Workspace */}
      <section className="panel excel-workspace">
        <header>
          <div>
            <h3>{clientName} ? {sheet}</h3>
            <p>Column headings and records come from the client master sheet.</p>
          </div>
          <span className="excel-live">
            <i />
            {error ? "Saved data" : "Master data"}
          </span>
        </header>

        {/* Sheet Tabs */}
        <div className="excel-sheet-tabs">
          {(summary?.sheets || ["UPDATED INVENTORY", "LIVE PRODUCTION TRACKER", "DISPATCH & DELIVERY", "QUERY LOG"]).map(x => (
            <button
              key={x}
              className={sheet === x ? "on" : ""}
              onClick={() => {
                setSheet(x);
                setPage(1);
                setSearch("");
              }}
            >
              {x}
            </button>
          ))}
        </div>

        {/* Search & Page Size Toolbar */}
        <div className="excel-tools">
          <label>
            <Search size={15} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search ISBN, title, author, stage, lead or status..."
            />
          </label>
          <select value={size} onChange={e => { setSize(Number(e.target.value)); setPage(1); }}>
            {[10, 25, 50, 100].map(x => (
              <option key={x} value={x}>{x} rows per page</option>
            ))}
          </select>
        </div>

        {error && <div className="excel-error"><RefreshCcw size={14} />{error}</div>}

        {/* Excel Data Grid */}
        <div className="excel-grid">
          <table>
            <thead>
              <tr>
                <th>Row</th>
                {(data?.headers || headers).map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.rows || []).map(row => (
                <tr key={row.rowNumber}>
                  <td><b>{row.rowNumber}</b></td>
                  {row.values.map((val, colIdx) => (
                    <td
                      key={colIdx}
                      onDoubleClick={() => !projectView && setEdit({ rowNumber: row.rowNumber, column: colIdx, value: val })}
                    >
                      <span>{val || "—"}</span>
                      {!projectView && <button
                        title="Edit cell"
                        onClick={() => setEdit({ rowNumber: row.rowNumber, column: colIdx, value: val })}
                      >
                        <Edit3 size={12} />
                      </button>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {!data?.rows?.length && (
            <div className="excel-empty">
              <FileSpreadsheet size={28} />
              <b>No matching records in this client master sheet</b>
            </div>
          )}
        </div>

        {/* Footer */}
        <Pagination
          currentPage={data?.page || page}
          totalItems={data?.total || 0}
          pageSize={size}
          onPageChange={setPage}
          onPageSizeChange={setSize}
          pageSizeOptions={[10, 25, 50, 100]}
          itemName="records"
        />
      </section>

      {/* Edit Cell Modal */}
      {edit && (
        <div className="excel-modal-bg" onClick={e => e.target === e.currentTarget && setEdit(null)}>
          <section className="excel-modal">
            <header>
              <div>
                <small>{sheet} · Row #{edit.rowNumber}</small>
                <h2>Edit Field Value</h2>
                <p>{(data?.headers || headers)[edit.column]}</p>
              </div>
              <button onClick={() => setEdit(null)}>
                <X size={18} />
              </button>
            </header>
            <textarea
              autoFocus
              value={edit.value}
              onChange={e => setEdit({ ...edit, value: e.target.value })}
            />
            <footer>
              <button className="secondary" onClick={() => setEdit(null)}>
                Cancel
              </button>
              <button className="primary" onClick={save}>
                <CheckCircle2 size={14} />
                <span>Save Change</span>
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
