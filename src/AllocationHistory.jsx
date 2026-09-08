import { useEffect, useMemo, useState } from "react";
import Pagination from "./Pagination";
import { buildAllocationHistory, importHistoryKey } from "./services/allocationHistory.js";
import { calendarDate, matchesFileDate } from "./services/fileDateFilter.js";

const read = key => { try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } };
export default function AllocationHistory({ history }) {
  const [snapshot] = useState(() => ({ imports: read(importHistoryKey), allocations: read("fileflow_admin_allocations") }));
  const [remote, setRemote] = useState([]), [error, setError] = useState("");
  const [search, setSearch] = useState(""), [type, setType] = useState(""), [status, setStatus] = useState("");
  const [date, setDate] = useState(""), [month, setMonth] = useState(""), [year, setYear] = useState("");
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/allocations", { signal: controller.signal }).then(async response => {
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload.items)) throw new Error();
      setRemote(payload.items);
    }).catch(() => { if (!controller.signal.aborted) setError("Live history unavailable. Showing history saved in this browser."); });
    return () => controller.abort();
  }, []);
  const rows = useMemo(() => buildAllocationHistory(history, [...snapshot.allocations, ...remote], snapshot.imports), [history, snapshot, remote]);
  const years = [...new Set(rows.map(row => calendarDate(row.createdAt).slice(0, 4)).filter(Boolean))].sort().reverse();
  const filtered = rows.filter(row => (!type || row.sourceType === type) && (!status || row.status === status)
    && matchesFileDate(calendarDate(row.createdAt), { date, month, year })
    && [row.id, row.fileName, row.mode, ...(row.isbns || [])].join(" ").toLowerCase().includes(search.toLowerCase().trim()));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const change = setter => event => { setter(event.target.value); setPage(1); };
  return <>
    <div className="bulk-history-filters">
      <label>Search<input placeholder="ISBN, source file or batch ID" value={search} onChange={change(setSearch)} /></label>
      <label>Source<select value={type} onChange={change(setType)}><option value="">All sources</option>{["Excel", "Manual", "CSV", "TXT", "Mixed", "Unknown"].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Status<select value={status} onChange={change(setStatus)}><option value="">All events</option><option>Uploaded</option><option>Allocated</option></select></label>
      <label>Date<input type="date" value={date} onChange={event => { change(setDate)(event); setMonth(""); setYear(""); }} /></label>
      <label>Month<select value={month} onChange={event => { change(setMonth)(event); setDate(""); }}><option value="">All months</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, "0")}>{new Date(2024, i, 1).toLocaleString("en", { month: "long" })}</option>)}</select></label>
      <label>Year<select value={year} onChange={event => { change(setYear)(event); setDate(""); }}><option value="">All years</option>{years.map(value => <option key={value}>{value}</option>)}</select></label>
      <button type="button" className="bulk-btn-draft" onClick={() => { setSearch(""); setType(""); setStatus(""); setDate(""); setMonth(""); setYear(""); setPage(1); }}>Clear filters</button>
    </div>
    <p>{filtered.length} of {rows.length} events. Uploads and completed allocations are listed separately. File count means unique ISBNs.</p>
    {error && <p role="status">{error}</p>}
    <div style={{ overflowX: "auto" }}><table className="bulk-selection-table"><thead><tr><th>Batch / Upload ID</th><th>Date & time</th><th>Source</th><th>Files</th><th>Mode</th><th>Status</th></tr></thead><tbody>
      {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(row => <tr key={row.id}>
        <td>{row.id}</td><td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : row.date || "Unknown"}</td>
        <td>{row.fileName}<small style={{ display: "block" }}>{row.sourceType}</small></td>
        <td><b>{row.totalFiles}</b>{row.assignments > row.totalFiles && <small style={{ display: "block" }}>{row.assignments} assignments</small>}{row.isbns?.length > 0 && <details><summary>View ISBNs</summary><textarea readOnly aria-label={`ISBNs in ${row.id}`} value={row.isbns.join("\n")} rows={5} /></details>}</td>
        <td>{row.mode}</td><td>{row.status}</td>
      </tr>)}
      {!filtered.length && <tr><td colSpan={6}>No history matches these filters.</td></tr>}
    </tbody></table></div>
    <Pagination currentPage={currentPage} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={value => { setPageSize(value); setPage(1); }} pageSizeOptions={[10, 25, 50]} itemName="events" />
  </>;
}
