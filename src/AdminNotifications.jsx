import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, RefreshCcw, X } from "lucide-react";
import "./admin-notifications.css";

const getApiBase = () => {
  const configured = import.meta.env.VITE_NOTIFICATION_API_URL?.replace(/\/$/, "");
  return configured || "";
};

const apiHeaders = (extra = {}) => ({
  ...extra,
  "X-FileFlow-Token": import.meta.env.VITE_NOTIFICATION_API_TOKEN || "fileflow-secret-token-2026"
});

const timeAgo = (value) => {
  const timeNum = Number(value);
  const time = Number.isNaN(timeNum) ? new Date(value).getTime() : timeNum;
  if (Number.isNaN(time)) return "Just now";
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return new Date(time).toLocaleDateString();
};

const getItemStatus = (item) => {
  if (item.status && item.status !== "Update") return item.status;
  if (item.reportSummary?.status) return item.reportSummary.status;
  const text = `${item.title || ""} ${item.type || ""}`.toLowerCase();
  if (text.includes("reject")) return "Reject";
  if (text.includes("rework")) return "Rework";
  if (text.includes("hold")) return "Hold";
  if (text.includes("complete") || text.includes("qc") || text.includes("submitted")) return "Complete";
  if (text.includes("query") || text.includes("clarification")) return "Query";
  if (text.includes("mail")) return "Mail";
  return item.status || "Update";
};

const getItemIsbn = (item) => {
  return (
    item.isbn ||
    item.reportSummary?.isbn ||
    item.fileName ||
    item.reason?.match(/\b978\d{10}\b/)?.[0] ||
    "—"
  );
};

export default function AdminNotifications() {
  const [portal, setPortal] = useState(null);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const alive = useRef(true);
  const apiBase = useMemo(getApiBase, []);

  useEffect(() => {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("fileflow") || "null")?.user;
    } catch {}
    if (!["Admin", "Project Admin"].includes(user?.role)) return;
    const top = document.querySelector(".top");
    setPortal(top);
    return () => setPortal(null);
  }, []);

  const fetchNotifications = async (silent = false) => {
    if (!portal) return;
    if (!silent) setLoading(true);
    try {
      let res = await fetch(`${apiBase}/notifications`, {
        headers: apiHeaders({ Accept: "application/json" })
      });
      if (!res.ok) {
        res = await fetch(`${apiBase}/api/notifications`, {
          headers: apiHeaders({ Accept: "application/json" })
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (!alive.current) return;
        const list = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.notifications)
          ? data.notifications
          : [];
        setItems(list);
        setUnread(list.filter((x) => !x.read).length);
        setError("");
        localStorage.setItem("fileflow_notifications", JSON.stringify(list));
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      if (alive.current) {
        try {
          const cached = JSON.parse(localStorage.getItem("fileflow_notifications") || "[]");
          if (Array.isArray(cached) && cached.length > 0) {
            setItems(cached);
            setUnread(cached.filter((x) => !x.read).length);
            setError("");
            return;
          }
        } catch {}
        setError("Notifications temporarily reconnecting...");
      }
    } finally {
      if (alive.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!portal) return;
    alive.current = true;
    fetchNotifications();
    const timer = setInterval(() => fetchNotifications(true), 5000);
    const sync = () => fetchNotifications(true);
    window.addEventListener("fileflowNotificationsUpdated", sync);
    return () => {
      alive.current = false;
      clearInterval(timer);
      window.removeEventListener("fileflowNotificationsUpdated", sync);
    };
  }, [portal, apiBase]);

  const markRead = async (item) => {
    if (item.read) return;
    const updated = items.map((n) => (n.id === item.id ? { ...n, read: true } : n));
    setItems(updated);
    setUnread((x) => Math.max(0, x - 1));
    localStorage.setItem("fileflow_notifications", JSON.stringify(updated));

    try {
      await fetch(`${apiBase}/notifications/read`, {
        method: "POST",
        headers: apiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ id: item.id })
      }).catch(() => {
        return fetch(`${apiBase}/api/notifications/read`, {
          method: "POST",
          headers: apiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ id: item.id })
        });
      });
      window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
    } catch {
      fetchNotifications(true);
    }
  };

  if (!portal) return null;

  return createPortal(
    <div className="admin-notifications" onClick={(e) => e.stopPropagation()}>
      <button
        className="notification-bell"
        type="button"
        onClick={() => setOpen((x) => !x)}
        aria-label={`Notifications, ${unread} unread`}
      >
        <Bell />
        {unread > 0 && <span>{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <section className="notification-panel">
          <header>
            <div>
              <b>Notifications</b>
              <span>{unread} unread · Auto-refresh every 5 seconds</span>
            </div>
            <button type="button" onClick={() => setOpen(false)}>
              <X />
            </button>
          </header>

          {error && (
            <div className="notification-error">
              <RefreshCcw />
              {error}
            </div>
          )}

          <div className="notification-items">
            {loading && !items.length ? (
              <p className="notification-empty">Loading notifications…</p>
            ) : items.length ? (
              items.map((item) => {
                const status = getItemStatus(item);
                const isbn = getItemIsbn(item);
                const empId = item.employeeId || item.reportSummary?.employeeId || "—";
                const empName = item.employeeName || item.reportSummary?.employeeName || "Unknown";
                const prjId = item.projectId || item.reportSummary?.projectId || "PRJ";
                const prjName = item.projectName || item.reportSummary?.projectName || item.project || "Project";
                const reason = item.reason || item.remarks || item.description || "No reason provided.";

                return (
                  <button
                    type="button"
                    className={item.read ? "notification-item" : "notification-item unread"}
                    key={item.id}
                    onClick={() => markRead(item)}
                  >
                    <div className="notification-item-top">
                      <strong
                        className={`notification-status ${
                          String(status).toLowerCase().includes("reject")
                            ? "rejected"
                            : ""
                        }`}
                      >
                        {status}
                      </strong>
                      <time>{timeAgo(item.createdAt)}</time>
                    </div>
                    <b>ISBN {isbn}</b>
                    <span>
                      <strong>{empId}</strong> · {empName}
                    </span>
                    <span>
                      <strong>{prjId}</strong> · {prjName}
                    </span>
                    <p>{reason}</p>
                    {!item.read && <small>Click to mark as read</small>}
                  </button>
                );
              })
            ) : (
              <p className="notification-empty">No notifications available.</p>
            )}
          </div>

          <footer>
            <span>{items.length} total notifications</span>
            <button type="button" onClick={() => fetchNotifications()}>
              <RefreshCcw />
              Refresh
            </button>
          </footer>
        </section>
      )}
    </div>,
    portal
  );
}

