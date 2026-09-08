import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Pagination from "./Pagination";
import { getMasterIsbnRecords } from "./services/masterIsbnStore";
import { buildFileWorkflow } from "./services/fileWorkflow";
import "./files.css";
import { matchesFileDate } from "./services/fileDateFilter.js";

const readList = key => {
  try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
};
const snapshot = () => ({ masters: getMasterIsbnRecords(), allocations: readList("fileflow_admin_allocations"), uploaded: readList("fileflow_uploaded_isbns") });
const productionAssignees = row => ["developer", "graphics"].filter(role => row.assignees[role]).map(role => [role, row.assignees[role]]);
const Status = ({ value }) => <span className={`file-stage file-stage-${value.toLowerCase()}`}>{value}</span>;

export default function Files({ files, search, setSearch }) {
  const [data, setData] = useState(snapshot);
  const [remote, setRemote] = useState([]);
  const [unavailable, setUnavailable] = useState(false);
  const [filter, setFilter] = useState("All");
  const [date, setDate] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const sync = () => setData(snapshot());
    const refresh = async () => {
      sync();
      try {
        const response = await fetch("/api/allocations", { signal: controller.signal });
        if (!response.ok) throw new Error("Allocations unavailable");
        const result = await response.json();
        if (!Array.isArray(result.items)) throw new Error("Invalid allocations");
        if (alive) { setRemote(result.items); setUnavailable(false); }
      } catch { if (alive) setUnavailable(true); }
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    const events = ["storage", "masterIsbnStoreUpdated", "fileflowUploadedIsbnsUpdated", "focus"];
    events.forEach(event => window.addEventListener(event, sync));
    return () => { alive = false; controller.abort(); clearInterval(timer); events.forEach(event => window.removeEventListener(event, sync)); };
  }, []);
  const rows = useMemo(() => buildFileWorkflow(files, data.masters, [...remote, ...data.allocations], data.uploaded), [files, data, remote]);
  const years = [...new Set(rows.map(row => row.filterDate?.slice(0, 4)).filter(Boolean))].sort().reverse();
  const filtered = rows.filter(row => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [row.isbn, ...productionAssignees(row).map(([, name]) => name)].some(value => String(value || "").toLowerCase().includes(q));
    const matchesStatus = filter === "All" || (filter === "Uploaded" ? row.fileUpload === "Uploaded" : filter === "YTA" ? row.development === "YTA" : filter === "Development" ? row.development === "Start" : filter === "QC" ? row.qc === "Start" : filter === "QAG" ? row.qag === "Start" : row.fileUpload === "Start");
    return matchesSearch && matchesStatus && matchesFileDate(row.filterDate, { date, month, year });
  });
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const offset = (currentPage - 1) * pageSize;
  return <div className="files-workflow">
    <header className="head"><div><span className="files-eyebrow">DOCUMENT CONTROL</span><h1>Files</h1><p>Track allocated files through development, QC, QAG and final upload.</p></div></header>
    <div className="tools"><div><Search/><input aria-label="Search files" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search by ISBN or allocated employee..."/></div><select aria-label="Filter workflow status" value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}><option value="All">All statuses</option><option value="YTA">YTA</option><option value="Development">Development started</option><option value="QC">QC started</option><option value="QAG">QAG started</option><option value="Upload">Awaiting file upload</option><option value="Uploaded">Uploaded</option></select></div>
    <div className="files-date-filters" aria-label="File date filters">
      <label>Date<input type="date" value={date} onChange={event => { setDate(event.target.value); setMonth(""); setYear(""); setPage(1); }} /></label>
      <label>Month<select value={month} onChange={event => { setMonth(event.target.value); setDate(""); setPage(1); }}><option value="">All months</option>{Array.from({ length: 12 }, (_, index) => <option key={index} value={String(index + 1).padStart(2, "0")}>{new Date(2024, index, 1).toLocaleString("en", { month: "long" })}</option>)}</select></label>
      <label>Year<select value={year} onChange={event => { setYear(event.target.value); setDate(""); setPage(1); }}><option value="">All years</option>{years.map(value => <option key={value}>{value}</option>)}</select></label>
      <button type="button" onClick={() => { setDate(""); setMonth(""); setYear(""); setFilter("All"); setSearch(""); setPage(1); }}>Clear filters</button>
      <small>By latest allocation date; file date is used for unallocated files.</small>
    </div>
    {unavailable && <p role="status">Live updates unavailable. Showing saved workflow data.</p>}
    <p className="files-legend">{filtered.length} of {rows.length} files · YTA = Yet to start · Start = In progress</p>
    <section className="panel table-panel"><div className="scroll"><table><thead><tr><th>S.No</th><th>ISBN 13 digit</th><th>Allocation / file date</th><th>File allocated to</th><th>Status<small>Development</small></th><th>QC</th><th>QAG</th><th>File upload</th></tr></thead><tbody>
      {filtered.slice(offset, offset + pageSize).map((row, index) => <tr key={row.isbn}><td>{offset + index + 1}</td><td><code>{row.isbn}</code></td><td>{row.filterDate || "?"}</td><td><div className="files-assignees">{productionAssignees(row).length ? productionAssignees(row).map(([role, name]) => <div key={role}><span>{({ developer: "Book", graphics: "Cover" })[role]}</span><b>{name}</b></div>) : <b>Unassigned</b>}</div></td><td><Status value={row.development}/></td><td><Status value={row.qc}/></td><td><Status value={row.qag}/></td><td><Status value={row.fileUpload}/></td></tr>)}
      {!filtered.length && <tr><td colSpan={8} className="files-empty">No files found.</td></tr>}
    </tbody></table></div><Pagination currentPage={currentPage} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} pageSizeOptions={[10, 25, 50, 100]} itemName="files"/></section>
  </div>;
}
