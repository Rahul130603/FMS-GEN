
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  Clock3,
  MessageSquareText,
  RefreshCcw,
  Search,
  Mail,
  FileText,
  Trash2,
  Check,
  CheckSquare
} from "lucide-react";
import "./notification-center.css";

const getApiBase = () => {
  const configured = import.meta.env.VITE_NOTIFICATION_API_URL?.replace(/\/$/, "");
  return configured || "";
};

const apiHeaders = (extra = {}) => ({
  ...extra,
  "X-FileFlow-Token": import.meta.env.VITE_NOTIFICATION_API_TOKEN || "fileflow-secret-token-2026"
});

const created = (value) => {
  const timeNum = Number(value);
  const date = Number.isNaN(timeNum) ? new Date(value) : new Date(timeNum);
  return Number.isNaN(date.getTime()) ? "Just now" : date.toLocaleString();
};

const getItemStatus = (item) => {
  if (item.status && item.status !== "Update") return item.status;
  if (item.reportSummary?.status) return item.reportSummary.status;
  const text = `${item.title || ""} ${item.type || ""} ${item.category || ""}`.toLowerCase();
  if (text.includes("reject")) return "Reject";
  if (text.includes("rework")) return "Rework";
  if (text.includes("hold")) return "Hold";
  if (text.includes("complete") || text.includes("qc") || text.includes("submitted")) return "Complete";
  if (text.includes("query") || text.includes("clarification")) return "Query";
  if (text.includes("mail")) return "Mail";
  if (text.includes("alert")) return "Alert";
  return item.status || "Update";
};

const getItemIsbn = (item) => {
  return (
    item.isbn ||
    item.reportSummary?.isbn ||
    item.fileName ||
    item.reason?.match(/\b978\d{10}\b/)?.[0] ||
    item.title?.match(/\b978\d{10}\b/)?.[0] ||
    "—"
  );
};

const getItemEmployee = (item) => {
  const id = item.employeeId || item.reportSummary?.employeeId || item.senderId || "—";
  const name = item.employeeName || item.reportSummary?.employeeName || item.senderName || item.sender || "Unknown";
  return { id, name };
};

const getItemProject = (item) => {
  const isbn = getItemIsbn(item);
  const id = item.projectId || item.reportSummary?.projectId || (isbn !== "—" ? "PRJ-PETERLANG" : "PRJ");
  const name =
    item.projectName ||
    item.project ||
    item.reportSummary?.projectName ||
    (isbn !== "—" ? `Peter Lang Title (${isbn})` : "General Production");
  return { id, name };
};

const getItemReason = (item) => {
  return (
    item.reason ||
    item.remarks ||
    item.description ||
    item.reportSummary?.reason ||
    item.reportSummary?.remarks ||
    item.message ||
    "No reason or remarks provided."
  );
};

const isQuery = (item) => {
  const text = `${item.type || ""} ${item.category || ""} ${item.title || ""} ${item.status || ""} ${item.reason || ""} ${item.remarks || ""} ${item.subject || ""} ${item.description || ""}`.toLowerCase();
  return /query|clarification|client|support|customer/i.test(text);
};

const statusClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("reject")) return "rejected";
  if (s.includes("rework")) return "rework";
  if (s.includes("complete") || s.includes("qc approved") || s.includes("ready")) return "complete";
  if (s.includes("hold")) return "hold";
  if (s.includes("query")) return "query";
  if (s.includes("mail")) return "mail";
  return "";
};

export default function NotificationCenter({ note }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("");
  const [tab, setTab] = useState("Unread"); // Default view: Unread so reading clears items
  const base = useMemo(getApiBase, []);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    let success = false;

    // Prioritize relative endpoint on the active host, with fallback endpoints
    const endpoints = [
      `${base}/notifications`,
      `${base}/api/notifications`,
      "/notifications",
      "/api/notifications"
    ].filter((v, i, a) => a.indexOf(v) === i && Boolean(v));

    let fetchedList = null;
    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(ep, {
          signal: controller.signal,
          headers: apiHeaders({ Accept: "application/json" })
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data.items)
            ? data.items
            : Array.isArray(data.notifications)
            ? data.notifications
            : [];
          if (Array.isArray(list)) {
            fetchedList = list;
            break;
          }
        }
      } catch (e) {}
    }

    if (fetchedList !== null) {
      // Merge with any unique local records that might exist
      let merged = [...fetchedList];
      try {
        const cached = JSON.parse(localStorage.getItem("fileflow_notifications") || "[]");
        if (Array.isArray(cached) && cached.length > 0) {
          const knownIds = new Set(merged.map((x) => x.id));
          const extra = cached.filter((x) => x && x.id && !knownIds.has(x.id));
          if (extra.length > 0) {
            merged = [...merged, ...extra];
          }
        }
      } catch {}

      setItems(merged);
      setUnread(merged.filter((x) => !x.read).length);
      setError("");
      localStorage.setItem("fileflow_notifications", JSON.stringify(merged));
      success = true;
    } else {
      // Resilient fallback to localStorage
      try {
        const cached = JSON.parse(localStorage.getItem("fileflow_notifications") || "[]");
        if (Array.isArray(cached) && cached.length > 0) {
          setItems(cached);
          setUnread(cached.filter((x) => !x.read).length);
          setError("");
          success = true;
        } else {
          setError("Connecting to notification service. Live updates will resume automatically.");
        }
      } catch {
        setError("Connecting to notification service. Live updates will resume automatically.");
      }
    }

    setLoading(false);
    if (!silent && success) {
      note?.("Notifications refreshed successfully");
    }
  };

  useEffect(() => {
    load(true);
    const timer = setInterval(() => load(true), 5000);
    const handleUpdate = () => load(true);
    window.addEventListener("fileflowNotificationsUpdated", handleUpdate);
    return () => {
      clearInterval(timer);
      window.removeEventListener("fileflowNotificationsUpdated", handleUpdate);
    };
  }, [base]);

  // Mark single notification as read (In "Unread" tab, it immediately clears out of the visible list)
  const read = async (item) => {
    if (item.read) return;
    const updated = items.map((n) => (n.id === item.id ? { ...n, read: true } : n));
    setItems(updated);
    setUnread(updated.filter((x) => !x.read).length);
    localStorage.setItem("fileflow_notifications", JSON.stringify(updated));

    try {
      await fetch(`${base || ""}/notifications/read`, {
        method: "POST",
        headers: apiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ id: item.id })
      }).catch(() => {
        return fetch("/api/notifications/read", {
          method: "POST",
          headers: apiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ id: item.id })
        });
      });
    } catch {}

    window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
    if (tab === "Unread") {
      note?.("Notification marked as read and cleared from unread view");
    } else {
      note?.("Notification marked as read");
    }
  };

  // Delete/clear an individual notification permanently
  const deleteNotification = async (item, e) => {
    if (e) e.stopPropagation();
    const updated = items.filter((n) => n.id !== item.id);
    setItems(updated);
    setUnread(updated.filter((x) => !x.read).length);
    localStorage.setItem("fileflow_notifications", JSON.stringify(updated));

    try {
      await fetch(`${base || ""}/notifications/delete`, {
        method: "POST",
        headers: apiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ id: item.id })
      }).catch(() => {
        return fetch("/api/notifications/delete", {
          method: "POST",
          headers: apiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ id: item.id })
        });
      });
    } catch {}

    window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
    note?.("Notification cleared");
  };

  // Mark all unread notifications as read
  const markAllRead = async () => {
    if (!items.some((x) => !x.read)) return;
    const updated = items.map((n) => ({ ...n, read: true }));
    setItems(updated);
    setUnread(0);
    localStorage.setItem("fileflow_notifications", JSON.stringify(updated));

    try {
      await fetch(`${base || ""}/notifications/read-all`, {
        method: "POST",
        headers: apiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({})
      }).catch(() => {
        return fetch("/api/notifications/read-all", {
          method: "POST",
          headers: apiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({})
        });
      });
    } catch {}

    window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
    note?.("All notifications marked as read");
  };

  // Clear all read notifications
  const clearRead = async () => {
    const updated = items.filter((n) => !n.read);
    setItems(updated);
    localStorage.setItem("fileflow_notifications", JSON.stringify(updated));

    try {
      await fetch(`${base || ""}/notifications/clear-read`, {
        method: "POST",
        headers: apiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({})
      }).catch(() => {
        return fetch("/api/notifications/clear-read", {
          method: "POST",
          headers: apiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({})
        });
      });
    } catch {}

    window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
    note?.("All read notifications cleared");
  };

  // Clear all notifications
  const clearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    setItems([]);
    setUnread(0);
    localStorage.setItem("fileflow_notifications", JSON.stringify([]));

    try {
      await fetch(`${base || ""}/notifications/clear`, {
        method: "POST",
        headers: apiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({})
      }).catch(() => {
        return fetch("/api/notifications/clear", {
          method: "POST",
          headers: apiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({})
        });
      });
    } catch {}

    window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
    note?.("All notifications cleared");
  };

  // Distinct statuses for filtering
  const distinctStatuses = useMemo(() => {
    const set = new Set(items.map(getItemStatus).filter(Boolean));
    return [...set].sort();
  }, [items]);

  // Read count
  const readCount = useMemo(() => items.filter((x) => x.read).length, [items]);

  // Filtered rows
  const filtered = useMemo(() => {
    return items
      .filter((x) => {
        if (tab === "Unread") return !x.read;
        if (tab === "Read") return Boolean(x.read);
        return true;
      })
      .filter((x) => {
        if (type === "Queries") return isQuery(x);
        if (type === "File updates") return !isQuery(x);
        return true;
      })
      .filter((x) => {
        if (!status) return true;
        return getItemStatus(x).toLowerCase() === status.toLowerCase();
      })
      .filter((x) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const emp = getItemEmployee(x);
        const prj = getItemProject(x);
        const isbn = getItemIsbn(x);
        const st = getItemStatus(x);
        const rsn = getItemReason(x);
        const title = x.title || "";
        const combined = `${isbn} ${emp.id} ${emp.name} ${prj.id} ${prj.name} ${st} ${rsn} ${title}`.toLowerCase();
        return combined.includes(q);
      });
  }, [items, tab, type, status, search]);

  const fileUpdatesCount = useMemo(() => items.filter((x) => !isQuery(x)).length, [items]);
  const clientQueriesCount = useMemo(() => items.filter(isQuery).length, [items]);

  return (
    <>
      <div className="notification-page-head">
        <div>
          <small>ADMIN ACTIVITY CENTRE</small>
          <h1>Notifications</h1>
          <p>Track employee file changes, rework, rejection and client query requests.</p>
        </div>
        <div className="notification-page-head-actions">
          {unread > 0 && (
            <button
              className="notification-action-btn"
              onClick={markAllRead}
              title="Mark all unread notifications as read"
            >
              <CheckCheck size={14} />
              Mark all as read
            </button>
          )}
          {readCount > 0 && (
            <button
              className="notification-action-btn"
              onClick={clearRead}
              title="Clear all read notifications"
            >
              <Trash2 size={14} />
              Clear read ({readCount})
            </button>
          )}
          {items.length > 0 && (
            <button
              className="notification-action-btn danger"
              onClick={clearAll}
              title="Clear all notifications"
            >
              <Trash2 size={14} />
              Clear all
            </button>
          )}
          <button
            className="notification-action-btn primary"
            onClick={() => load(false)}
            disabled={loading}
          >
            <RefreshCcw size={14} className={loading ? "spin" : ""} />
            {loading ? "Refreshing..." : "Refresh now"}
          </button>
        </div>
      </div>

      <div className="notification-stats">
        <article
          className={tab === "All" && type === "All" ? "active-stat" : ""}
          onClick={() => {
            setTab("All");
            setType("All");
          }}
          title="Click to view all notifications"
        >
          <i>
            <Bell />
          </i>
          <div>
            <span>All notifications</span>
            <b>{items.length}</b>
          </div>
        </article>
        <article
          className={tab === "Unread" ? "active-stat" : ""}
          onClick={() => {
            setTab("Unread");
            setType("All");
          }}
          title="Click to view unread notifications"
        >
          <i className="unread">
            <Clock3 />
          </i>
          <div>
            <span>Unread</span>
            <b>{unread}</b>
          </div>
        </article>
        <article
          className={type === "File updates" ? "active-stat" : ""}
          onClick={() => {
            setType("File updates");
          }}
          title="Click to filter by file status updates"
        >
          <i className="file">
            <FileText />
          </i>
          <div>
            <span>File status updates</span>
            <b>{fileUpdatesCount}</b>
          </div>
        </article>
        <article
          className={type === "Queries" ? "active-stat" : ""}
          onClick={() => {
            setType("Queries");
          }}
          title="Click to filter by client queries"
        >
          <i className="query">
            <MessageSquareText />
          </i>
          <div>
            <span>Client queries</span>
            <b>{clientQueriesCount}</b>
          </div>
        </article>
      </div>

      <section className="panel notification-centre">
        <div className="notification-view-tabs">
          <button
            className={`view-tab unread-tab ${tab === "Unread" ? "active" : ""}`}
            onClick={() => setTab("Unread")}
          >
            Unread
            <span className="tab-pill">{unread}</span>
          </button>
          <button
            className={`view-tab ${tab === "All" ? "active" : ""}`}
            onClick={() => setTab("All")}
          >
            All
            <span className="tab-pill">{items.length}</span>
          </button>
          <button
            className={`view-tab ${tab === "Read" ? "active" : ""}`}
            onClick={() => setTab("Read")}
          >
            Read
            <span className="tab-pill">{readCount}</span>
          </button>
        </div>

        <div className="notification-centre-filters">
          <label>
            <Search />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ISBN, employee, project, status or reason"
            />
          </label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="All">All types ({items.length})</option>
            <option value="File updates">File updates ({fileUpdatesCount})</option>
            <option value="Queries">Queries ({clientQueriesCount})</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {distinctStatuses.map((s) => (
              <option key={s} value={s}>
                {s} ({items.filter((x) => getItemStatus(x).toLowerCase() === s.toLowerCase()).length})
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="notification-centre-error">
            <RefreshCcw />
            {error}
          </div>
        )}

        <div className="notification-centre-list">
          {loading && !items.length ? (
            <div className="notification-centre-empty">
              <RefreshCcw className="spin" size={24} />
              <b>Loading notifications…</b>
            </div>
          ) : filtered.length ? (
            filtered.map((item) => {
              const currentStatus = getItemStatus(item);
              const isbnVal = getItemIsbn(item);
              const employee = getItemEmployee(item);
              const project = getItemProject(item);
              const reasonText = getItemReason(item);
              const queryItem = isQuery(item);

              return (
                <div
                  key={item.id}
                  className={item.read ? "notification-row" : "notification-row unread"}
                  onClick={() => read(item)}
                  style={{ cursor: item.read ? "default" : "pointer" }}
                  title={item.read ? "Notification read" : "Click to mark as read and clear from unread list"}
                >
                  <i className={queryItem ? "query" : "file"}>
                    {queryItem ? <MessageSquareText /> : item.type === "mail" ? <Mail /> : <RefreshCcw />}
                  </i>
                  <div className="notification-row-main">
                    <div>
                      <strong>
                        {item.title || (queryItem ? "Client query request" : `File status changed to ${currentStatus}`)}
                      </strong>
                      <time>{created(item.createdAt)}</time>
                    </div>
                    <p>{reasonText}</p>
                    <div className="notification-row-details">
                      <span>
                        <small>ISBN / File</small>
                        <b>{isbnVal}</b>
                      </span>
                      <span>
                        <small>Employee</small>
                        <b>
                          {employee.id} · {employee.name}
                        </b>
                      </span>
                      <span>
                        <small>Project</small>
                        <b>
                          {project.id} · {project.name}
                        </b>
                      </span>
                      <span>
                        <small>Status</small>
                        <b className={`notification-row-status ${statusClass(currentStatus)}`}>
                          {currentStatus}
                        </b>
                      </span>
                    </div>
                  </div>
                  <div className="notification-row-actions">
                    <span className="notification-read-state">
                      {item.read ? (
                        <>
                          <CheckCircle2 />
                          Read
                        </>
                      ) : (
                        "Unread"
                      )}
                    </span>
                    <div className="notification-row-btn-group">
                      {!item.read && (
                        <button
                          className="notification-mark-read-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            read(item);
                          }}
                          title="Mark as read (clears from unread list)"
                        >
                          <Check size={12} />
                          Read
                        </button>
                      )}
                      <button
                        className="notification-delete-btn"
                        onClick={(e) => deleteNotification(item, e)}
                        title="Dismiss / Clear this notification"
                      >
                        <Trash2 size={13} />
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="notification-centre-empty">
              {tab === "Unread" && items.length > 0 ? (
                <>
                  <CheckCircle2 size={32} style={{ color: "var(--green)" }} />
                  <b>All caught up! No unread notifications</b>
                  <span>All notifications have been read. Click "All" tab to view history.</span>
                  <button
                    className="notification-action-btn"
                    style={{ marginTop: 8 }}
                    onClick={() => setTab("All")}
                  >
                    View all notifications ({items.length})
                  </button>
                </>
              ) : (
                <>
                  <Bell />
                  <b>No notifications found</b>
                  <span>Employee updates, rework, rejections, and client queries will appear here.</span>
                </>
              )}
            </div>
          )}
        </div>

        <footer>
          <span>
            Showing {filtered.length} of {items.length} notifications ({tab} view)
          </span>
          <small>Auto-refreshing every 5 seconds · Click any unread notification to clear it</small>
        </footer>
      </section>
    </>
  );
}

