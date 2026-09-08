import React, { useState, useEffect, useMemo } from "react";
import {
  Archive,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  CornerUpLeft,
  CornerUpRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Inbox,
  Link,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Share2,
  Star,
  Tag,
  Trash2,
  User,
  UserCheck,
  Users,
  X
} from "lucide-react";
import "./mail-corrections.css";

export const CorrectionStatusBadge = ({ status }) => (
  <span className={`mc-tag-badge ${(status || "").toLowerCase().includes("approved") || (status || "").toLowerCase().includes("closed") ? "resolved" : (status || "").toLowerCase().includes("high") || (status || "").toLowerCase().includes("reject") ? "high" : "art"}`}>
    {status}
  </span>
);

const EMPLOYEES_ROSTER = [];
const INITIAL_MAILS = [];
const DEMO_MAIL_IDS = new Set();

export default function MailCorrections({ user, note }) {
  const currentUserId = String(user?.username || user?.empId || user?.id || "admin").trim().toLowerCase();
  const currentUserName = user?.name || "Praveen B";
  const isAdmin = user?.role === "Admin" || user?.role === "Project Admin";
  const currentUserAliases = useMemo(() => [user?.username, user?.empId, user?.giEmpId, user?.id]
    .map(value => String(value || "").trim().toLowerCase())
    .filter(Boolean), [user]);
  const [employeeRoster, setEmployeeRoster] = useState([]);

  // Mails State - purely synchronized from central server
  const [mails, setMails] = useState([]);

  // Navigation Filter States
  const [currentFolder, setCurrentFolder] = useState("Inbox");
  const [currentSmartView, setCurrentSmartView] = useState("");
  const [currentLabel, setCurrentLabel] = useState("");

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Selection & Selected Mail Detail
  const [selectedMailIds, setSelectedMailIds] = useState([]);
  const [activeMailId, setActiveMailId] = useState("");

  // Modals & Composer States
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [internalNoteText, setInternalNoteText] = useState("");

  // New Compose Form State
  const [composeForm, setComposeForm] = useState({
    recipientIds: [],
    subject: "",
    project: "Services Marketing 10th Edition",
    isbn: "9781944659790",
    chapter: "Chapter 01",
    category: "Art Correction",
    priority: "Normal",
    body: ""
  });

  // Load real employee roster from backend
  useEffect(() => {
    fetch("/api/employees")
      .then(response => response.json())
      .then(payload => {
        if (!payload?.ok || !Array.isArray(payload.items)) return;
        const liveRoster = payload.items.map(employee => ({
          id: String(employee.empId || employee.giEmpId || "").trim(),
          code: String(employee.empId || "").trim(),
          alternateId: String(employee.giEmpId || "").trim(),
          name: employee.name || "Unnamed employee",
          role: employee.designation || "Employee",
          team: employee.department || "Production"
        })).filter(employee => employee.id);
        if (liveRoster.length) setEmployeeRoster(liveRoster);
      })
      .catch(() => {});
  }, []);

  // Sync with central API Server
  useEffect(() => {
    let active = true;
    const syncWithServer = async () => {
      try {
        const response = await fetch(`/api/mail?user=${encodeURIComponent(currentUserId)}&aliases=${encodeURIComponent(currentUserAliases.join(","))}`);
        const payload = await response.json();
        if (active && response.ok && payload.ok && Array.isArray(payload.items)) {
          setMails(payload.items);
        }
      } catch (e) {}
    };
    syncWithServer();
    const timer = setInterval(syncWithServer, 3000);
    return () => { active = false; clearInterval(timer); };
  }, [currentUserId, currentUserAliases]);

  // Filtered Mails based on User Role, Targeted Recipient, Folder, Smart Views, Labels, Search
  const userVisibleMails = useMemo(() => {
    return mails.filter(m => {
      const fromMatch = String(m.fromId || "").toLowerCase();
      const sentByMe = currentUserAliases.includes(fromMatch);
      const deletedForMe = (m.deletedBy || []).map(x => String(x).toLowerCase()).some(id => currentUserAliases.includes(id));
      const lastEvent = (m.timeline || [])[m.timeline?.length - 1];
      const latestSenderId = String(m.lastSenderId || lastEvent?.senderId || "").toLowerCase();
      const latestSenderName = String(m.lastSenderName || lastEvent?.sender || "").toLowerCase();
      const latestSentByMe = currentUserAliases.includes(latestSenderId) || latestSenderName === currentUserName.toLowerCase();
      const employeeRepliedToMyMail = sentByMe && (lastEvent?.role === "Employee Reply" || (m.lastReply && !latestSentByMe));
      const inboxForMe = (!sentByMe && !latestSentByMe) || employeeRepliedToMyMail;
      const repliedByMe = (m.timeline || []).some(event => currentUserAliases.includes(String(event.senderId || "").toLowerCase()) || String(event.sender || "").toLowerCase() === currentUserName.toLowerCase());
      // Role-based visibility
      if (!isAdmin) {
        const toMatch = String(m.toId || "").toLowerCase();
        const assigneeMatch = String(m.assigneeId || "").toLowerCase();
        const empNameMatch = String(m.assignee || "").toLowerCase();
        const myName = currentUserName.toLowerCase();

        const isForMe =
          currentUserAliases.includes(toMatch) ||
          toMatch === "all" ||
          currentUserAliases.includes(assigneeMatch) ||
          currentUserAliases.includes(fromMatch) ||
          (empNameMatch && myName && (empNameMatch.includes(myName) || myName.includes(empNameMatch)));

        if (!isForMe) return false;
      }

      // Folder filtering
      if (currentFolder === "Inbox" && (m.folder !== "Inbox" || !inboxForMe || deletedForMe)) return false;
      if (currentFolder === "Sent Items" && (!(sentByMe || repliedByMe) || deletedForMe)) return false;
      if (currentFolder === "Drafts" && m.folder !== "Drafts") return false;
      if (currentFolder === "Starred" && !m.starred) return false;
      if (currentFolder === "Deleted Items" && !deletedForMe) return false;

      // Smart Views
      if (currentSmartView === "Unread" && m.read) return false;
      if (currentSmartView === "Awaiting Reply" && m.status !== "Awaiting Reply") return false;
      if (currentSmartView === "High Priority" && m.priority !== "High" && m.priority !== "Urgent") return false;
      if (currentSmartView === "With Attachments" && !m.hasAttachment) return false;

      // Labels
      if (currentLabel && m.category !== currentLabel) return false;

      // Dropdown filters
      if (statusFilter !== "All" && m.status !== statusFilter) return false;
      if (priorityFilter !== "All" && m.priority !== priorityFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${m.sender} ${m.subject} ${m.title} ${m.project} ${m.isbn} ${m.body}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [mails, isAdmin, currentUserAliases, currentUserName, currentFolder, currentSmartView, currentLabel, statusFilter, priorityFilter, searchQuery]);

  // Currently active mail item
  const activeMail = useMemo(() => {
    return userVisibleMails.find(m => m.id === activeMailId) || userVisibleMails[0] || null;
  }, [activeMailId, userVisibleMails]);

  const persistMailPatch = (id, patch) => fetch("/api/mail/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, patch })
  }).catch(() => {});

  // Star / Unstar
  const toggleStar = (mailId, e) => {
    e?.stopPropagation();
    const starred = !mails.find(mail => mail.id === mailId)?.starred;
    setMails(prev =>
      prev.map(m => (m.id === mailId ? { ...m, starred } : m))
    );
    persistMailPatch(mailId, { starred });
  };

  // Mark Read / Unread
  const toggleReadStatus = (mailId, isRead) => {
    setMails(prev =>
      prev.map(m => (m.id === mailId ? { ...m, read: isRead } : m))
    );
    persistMailPatch(mailId, { read: isRead });
  };

  // Delete Mail
  const handleDeleteMail = (mailId) => {
    const mail = mails.find(item => item.id === mailId);
    const deletedBy = [...new Set([...(mail?.deletedBy || []), currentUserId])];
    setMails(prev =>
      prev.map(m => (m.id === mailId ? { ...m, deletedBy } : m))
    );
    persistMailPatch(mailId, { deletedBy });
    note?.("Mail moved to Deleted Items.");
  };

  const handlePermanentDelete = async () => {
    const ids = selectedMailIds.length ? selectedMailIds : activeMail ? [activeMail.id] : [];
    if (!ids.length) return;
    if (!window.confirm(`Permanently delete ${ids.length} mail${ids.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    try {
      const response = await fetch("/api/mail/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Delete failed");
      setMails(prev => prev.filter(mail => !ids.includes(mail.id)));
      setSelectedMailIds([]);
      if (activeMailId && ids.includes(activeMailId)) setActiveMailId("");
      note?.(`${payload.deletedCount || ids.length} mail${ids.length > 1 ? "s" : ""} permanently deleted.`);
    } catch (error) {
      note?.(`Permanent delete failed: ${error.message}`);
    }
  };

  // Add Internal Note
  const handleAddInternalNote = () => {
    if (!internalNoteText.trim() || !activeMail) return;
    setMails(prev =>
      prev.map(m => {
        if (m.id === activeMail.id) {
          return {
            ...m,
            notes: [...(m.notes || []), internalNoteText.trim()]
          };
        }
        return m;
      })
    );
    persistMailPatch(activeMail.id, { notes: [...(activeMail.notes || []), internalNoteText.trim()] });
    setInternalNoteText("");
    note?.("Internal note added.");
  };

  // Send Reply
  const handleSendReply = () => {
    if (!replyText.trim() || !activeMail) return;

    const replyEvent = {
      sender: currentUserName,
      senderId: currentUserId,
      role: isAdmin ? "Admin Reply" : "Employee Reply",
      title: `Re: ${activeMail.title || activeMail.subject}`,
      body: replyText.trim(),
      time: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }) + ", " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };

    setMails(prev =>
      prev.map(m => {
        if (m.id === activeMail.id) {
          return {
            ...m,
            status: "Resolved",
            read: false,
            lastSenderId: currentUserId,
            lastSenderName: currentUserName,
            timeline: [...(m.timeline || []), replyEvent]
          };
        }
        return m;
      })
    );
    persistMailPatch(activeMail.id, { status: "Resolved", timeline: [...(activeMail.timeline || []), replyEvent], lastReply: replyText.trim(), lastSenderId: currentUserId, lastSenderName: currentUserName, repliedAt: Date.now(), read: false });

    setReplyText("");
    setShowReplyModal(false);
    note?.("Reply sent successfully.");
  };

  // Assign to targeted employee
  const handleAssignEmployee = (targetEmpId) => {
    const targetEmp = employeeRoster.find(e => e.id === targetEmpId);
    if (!targetEmp || !activeMail) return;

    setMails(prev =>
      prev.map(m => {
        if (m.id === activeMail.id) {
          return {
            ...m,
            assignee: targetEmp.name,
            assigneeId: targetEmp.id,
            toId: targetEmp.id,
            toName: targetEmp.name
          };
        }
        return m;
      })
    );
    persistMailPatch(activeMail.id, { assignee: targetEmp.name, assigneeId: targetEmp.id, toId: targetEmp.id, toName: targetEmp.name, toAlternateIds: [targetEmp.code, targetEmp.alternateId].filter(Boolean) });

    setShowAssignModal(false);
    note?.(`Assigned to ${targetEmp.name} (${targetEmp.code}). Message will appear in their inbox.`);
  };

  // Send New Composed Mail
  const handleSendCompose = async () => {
    if (!composeForm.recipientIds.length || !composeForm.subject || !composeForm.body) {
      note?.("Select at least one employee and fill in the subject and message body.");
      return;
    }

    const selectedRecipientIds = composeForm.recipientIds.includes("all") ? ["all"] : composeForm.recipientIds;
    const targetEmployees = selectedRecipientIds
      .map(recipientId => employeeRoster.find(employee => employee.id === recipientId))
      .filter(Boolean);
    if (selectedRecipientIds[0] !== "all" && targetEmployees.length !== selectedRecipientIds.length) {
      note?.("One or more selected employees are no longer available.");
      return;
    }
    const recipientName = selectedRecipientIds[0] === "all"
      ? "All Employees"
      : targetEmployees.map(employee => employee.name).join(", ");
    const dateFormatted = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }) + ", " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const newMails = selectedRecipientIds.map((recipientId, index) => {
      const targetEmp = employeeRoster.find(employee => employee.id === recipientId);
      const targetName = targetEmp ? targetEmp.name : "All Employees";
      return {
        id: `MAIL-${Date.now()}-${index}`,
        sender: currentUserName,
        senderEmail: `${currentUserId}@fileflow.internal`,
        fromId: currentUserId,
        lastSenderId: currentUserId,
        lastSenderName: currentUserName,
        avatarBg: "#2874b2",
        avatarChar: currentUserName.charAt(0).toUpperCase(),
        toId: recipientId,
        toAlternateIds: targetEmp ? [targetEmp.code, targetEmp.alternateId].filter(Boolean) : [],
        toName: targetName,
        assignee: targetName,
        assigneeId: recipientId,
        subject: `${composeForm.project} | ${composeForm.isbn} ${composeForm.chapter} | ${composeForm.subject}`,
        title: composeForm.subject,
        project: composeForm.project,
        isbn: composeForm.isbn,
        chapter: composeForm.chapter,
        category: composeForm.category,
        priority: composeForm.priority,
        folder: "Inbox",
        status: "Awaiting Reply",
        read: false,
        starred: false,
        hasAttachment: false,
        dateStr: dateFormatted,
        timestamp: Date.now(),
        body: composeForm.body,
        attachments: [],
        timeline: [
          { sender: currentUserName, role: "Original Mail", title: composeForm.subject, time: dateFormatted }
        ],
        notes: []
      };
    });

    const sentMails = [];
    try {
      for (const newMail of newMails) {
        const response = await fetch("/api/mail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMail)
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Mail could not be sent");
        sentMails.push(payload.item);
      }
      setMails(prev => [...sentMails, ...prev.filter(mail => !sentMails.some(sent => sent.id === mail.id))]);
      
      // Dispatch Mail Notification to Admin Activity Centre Notifications
      try {
        const mailNotif = {
          id: `NOTIF-${Date.now()}`,
          title: `Mail Correction: ${composeForm.subject || composeForm.category}`,
          type: "mail",
          category: composeForm.category || "Mail Correction",
          status: "Mail",
          isbn: composeForm.isbn || "",
          projectId: "PRJ",
          projectName: composeForm.project || `Project (${composeForm.isbn || ""})`,
          employeeId: currentUserId || "EMP",
          employeeName: currentUserName || "Employee",
          reason: `Mail sent from ${currentUserName} to ${recipientName}: "${composeForm.subject}". Category: ${composeForm.category}. Remarks: ${composeForm.body}`,
          remarks: composeForm.body || "",
          createdAt: Date.now(),
          read: false,
          section: "Notifications"
        };
        const savedNotifs = JSON.parse(localStorage.getItem("fileflow_notifications") || "[]");
        localStorage.setItem("fileflow_notifications", JSON.stringify([mailNotif, ...savedNotifs]));
        window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
        fetch("/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-FileFlow-Token": "fileflow-secret-token-2026" },
          body: JSON.stringify(mailNotif)
        }).catch(() => {});
      } catch {}
    } catch (error) {
      note?.(`Mail send failed: ${error.message}`);
      return;
    }

    setShowComposeModal(false);
    setCurrentFolder("Sent Items");
    setActiveMailId(sentMails[0].id);
    setComposeForm({
      recipientIds: [],
      subject: "",
      project: "Services Marketing 10th Edition",
      isbn: "9781944659790",
      chapter: "Chapter 01",
      category: "Art Correction",
      priority: "Normal",
      body: ""
    });

    note?.(`Mail sent to ${recipientName}.`);
  };

  // Dynamic counts for KPI cards & sidebar
  const metricMails = isAdmin ? mails : mails.filter(m => {
    const targets = [m.toId, m.assigneeId, m.fromId, ...(m.toAlternateIds || [])].map(x => String(x || "").toLowerCase());
    return targets.some(id => currentUserAliases.includes(id)) || m.toId === "all" || String(m.assignee || "").toLowerCase() === currentUserName.toLowerCase();
  });
  const isInboxMail = m => {
    const fromMe = currentUserAliases.includes(String(m.fromId || "").toLowerCase());
    const lastEvent = (m.timeline || [])[m.timeline?.length - 1];
    const latestId = String(m.lastSenderId || lastEvent?.senderId || "").toLowerCase();
    const latestName = String(m.lastSenderName || lastEvent?.sender || "").toLowerCase();
    const latestIsMe = currentUserAliases.includes(latestId) || latestName === currentUserName.toLowerCase();
    return m.folder === "Inbox" && ((!fromMe && !latestIsMe) || (fromMe && lastEvent?.role === "Employee Reply"));
  };
  const inboxCount = metricMails.filter(isInboxMail).length;
  const unreadCount = metricMails.filter(m => !m.read && isInboxMail(m)).length;
  const awaitingReplyCount = metricMails.filter(m => m.status === "Awaiting Reply").length;
  const resolvedCount = metricMails.filter(m => m.status === "Resolved").length;
  const sentCount = metricMails.filter(m => currentUserAliases.includes(String(m.fromId || "").toLowerCase()) || (m.timeline || []).some(event => String(event.sender || "").toLowerCase() === currentUserName.toLowerCase())).length;
  const deletedCount = metricMails.filter(m => (m.deletedBy || []).map(id => String(id).toLowerCase()).some(id => currentUserAliases.includes(id))).length;

  return (
    <div className="mail-corrections-container">
      {/* 1. Header Bar */}
      <div className="mc-header-bar">
        <div>
          <small>Publishing Operations / Mail Corrections</small>
          <h1>{isAdmin ? "Mail Corrections" : "My Corrections"}</h1>
          <p>Manage client corrections, production queries and project communication.</p>
        </div>
        <button className="mc-btn-compose-top" onClick={() => setShowComposeModal(true)}>
          <Plus size={16} />
          <span>Compose Mail</span>
        </button>
      </div>

      {/* Main email workspace */}
      <div className="mc-email-layout">
        {/* ================= COLUMN 1: FOLDER NAVIGATION ================= */}
        <aside className="mc-folder-sidebar">
          <button className="mc-btn-compose-main" onClick={() => setShowComposeModal(true)}>
            <Plus size={16} />
            <span>Compose Mail</span>
          </button>

          <div className="mc-nav-group-title">MAIL FOLDERS</div>
          <div className="mc-nav-list">
            {[
              { label: "Inbox", icon: Inbox, count: inboxCount },
              { label: "Sent Items", icon: Send, count: sentCount },
              { label: "Drafts", icon: FileText, count: metricMails.filter(m => m.folder === "Drafts").length },
              { label: "Starred", icon: Star, count: metricMails.filter(m => m.starred).length },
              { label: "Deleted Items", icon: Trash2, count: deletedCount }
            ].map(f => (
              <button
                key={f.label}
                className={`mc-nav-item ${currentFolder === f.label && !currentSmartView && !currentLabel ? "active" : ""}`}
                onClick={() => {
                  setCurrentFolder(f.label);
                  setCurrentSmartView("");
                  setCurrentLabel("");
                }}
              >
                <f.icon size={15} />
                <span>{f.label}</span>
                <span className="mc-nav-badge">{f.count}</span>
              </button>
            ))}
          </div>

          <div className="mc-nav-group-title">SMART VIEWS</div>
          <div className="mc-nav-list">
            {[
              { label: "Unread", icon: Mail, count: unreadCount },
              { label: "Awaiting Reply", icon: CornerUpLeft, count: awaitingReplyCount },
              { label: "High Priority", icon: Tag, count: metricMails.filter(m => m.priority === "High" || m.priority === "Urgent").length },
              { label: "With Attachments", icon: Paperclip, count: metricMails.filter(m => m.hasAttachment).length }
            ].map(sv => (
              <button
                key={sv.label}
                className={`mc-nav-item ${currentSmartView === sv.label ? "active" : ""}`}
                onClick={() => {
                  setCurrentSmartView(sv.label);
                  setCurrentLabel("");
                }}
              >
                <sv.icon size={15} />
                <span>{sv.label}</span>
                <span className="mc-nav-badge">{sv.count}</span>
              </button>
            ))}
          </div>

          <div className="mc-nav-group-title">LABELS</div>
          <div className="mc-nav-list">
            {[
              { label: "Art Correction", color: "blue", count: metricMails.filter(m => m.category === "Art Correction").length },
              { label: "Text Correction", color: "purple", count: metricMails.filter(m => m.category === "Text Correction").length },
              { label: "Client Query", color: "cyan", count: metricMails.filter(m => m.category === "Client Query").length },
              { label: "Urgent", color: "red", count: metricMails.filter(m => m.category === "Urgent").length }
            ].map(l => (
              <button
                key={l.label}
                className={`mc-nav-item ${currentLabel === l.label ? "active" : ""}`}
                onClick={() => {
                  setCurrentLabel(l.label);
                  setCurrentSmartView("");
                }}
              >
                <span className={`mc-label-dot ${l.color}`}></span>
                <span>{l.label}</span>
                <span className="mc-nav-badge">{l.count}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* ================= COLUMN 2: MAIL LIST ================= */}
        <section className="mc-mail-list-panel">
          <div className="mc-list-top-bar">
            <h3 className="mc-list-title">General Mail ({currentFolder})</h3>
            <div className="mc-list-actions">
              <button
                className="mc-action-btn"
                onClick={() => {
                  if (currentFolder === "Deleted Items") handlePermanentDelete();
                  else if (selectedMailIds.length) selectedMailIds.forEach(handleDeleteMail);
                  else if (activeMail) handleDeleteMail(activeMail.id);
                }}
              >
                <Trash2 size={13} />
                <span>{currentFolder === "Deleted Items" ? "Delete Permanently" : "Delete"}</span>
              </button>
              <button
                className="mc-action-btn"
                onClick={() => {
                  if (activeMail) toggleReadStatus(activeMail.id, true);
                }}
              >
                <Check size={13} />
                <span>Mark as Read</span>
              </button>
              <button
                className="mc-action-btn"
                onClick={() => {
                  if (activeMail) toggleReadStatus(activeMail.id, false);
                }}
              >
                <Mail size={13} />
                <span>Mark as Unread</span>
              </button>
              <button
                className="mc-action-btn"
                onClick={() => note?.("Mail inbox refreshed.")}
              >
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="mc-toolbar-filters">
            <div className="mc-search-input-wrap">
              <Search size={14} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sender, subject, ISBN or project..."
              />
            </div>

            <select className="mc-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">Status</option>
              <option value="Inbox">Inbox</option>
              <option value="Awaiting Reply">Awaiting Reply</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select className="mc-filter-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="All">Priority</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>

            <button
              className="mc-action-btn"
              title="Clear Filters"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
                setPriorityFilter("All");
              }}
            >
              <Filter size={13} />
            </button>
          </div>

          {/* Scrollable Mail Items */}
          <div className="mc-items-scroll">
            {userVisibleMails.map((mail) => {
              const isSelected = activeMail?.id === mail.id;
              return (
                <div
                  key={mail.id}
                  className={`mc-mail-row ${isSelected ? "selected" : ""} ${!mail.read ? "mc-unread-row" : ""}`}
                  onClick={() => {
                    setActiveMailId(mail.id);
                    toggleReadStatus(mail.id, true);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedMailIds.includes(mail.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSelectedMailIds(prev =>
                        prev.includes(mail.id) ? prev.filter(x => x !== mail.id) : [...prev, mail.id]
                      );
                    }}
                  />

                  <button
                    className={`mc-star-btn ${mail.starred ? "starred" : ""}`}
                    onClick={(e) => toggleStar(mail.id, e)}
                  >
                    <Star size={14} fill={mail.starred ? "#f59e0b" : "none"} />
                  </button>

                  <div className="mc-avatar-circle" style={{ backgroundColor: mail.avatarBg || "#2874b2" }}>
                    {mail.avatarChar || mail.sender?.charAt(0) || "U"}
                  </div>

                  <div className="mc-sender-name">{mail.sender}</div>

                  <div className="mc-subject-block">
                    <div className="mc-subject-line">{mail.subject}</div>
                    <div className="mc-tags-row">
                      {mail.project && <span className="mc-pill-badge">{mail.project}</span>}
                      {mail.isbn && <span className="mc-pill-badge">{mail.isbn}</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {mail.hasAttachment && <Paperclip size={13} color="#64748b" />}
                    <span className={`mc-priority-badge ${mail.priority?.toLowerCase()}`}>
                      {mail.priority}
                    </span>
                  </div>

                  <div className="mc-date-cell">
                    <div>{mail.dateStr?.split(",")[0]}</div>
                    <div style={{ color: "#94a3b8" }}>{mail.dateStr?.split(",")[1]}</div>
                  </div>
                </div>
              );
            })}

            {!userVisibleMails.length && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                <MessageSquare size={28} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                <b style={{ display: "block", fontSize: "12px", color: "#0f172a" }}>No mail items found</b>
                <span style={{ fontSize: "11px" }}>Check other folders or compose a new mail message.</span>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="mc-pagination-bar">
            <span>Showing 1 to {userVisibleMails.length} of {userVisibleMails.length} messages</span>
            <div className="mc-page-buttons">
              <button disabled>&lt;</button>
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <button>...</button>
              <button>&gt;</button>
            </div>
          </div>
        </section>

        {/* ================= COLUMN 3: MAIL DETAIL PANE ================= */}
        {activeMail ? (
          <aside className="mc-detail-pane">
            <div className="mc-detail-top-bar">
              <h3 className="mc-detail-subject">{activeMail.title || activeMail.subject}</h3>
              <div className="mc-detail-top-actions">
                <button className="mc-icon-btn-ghost" onClick={() => setShowAssignModal(true)} title="Assign to Employee">
                  <UserCheck size={16} />
                </button>
                <button className="mc-icon-btn-ghost" onClick={() => handleDeleteMail(activeMail.id)} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Badges Row */}
            <div className="mc-detail-badges-row">
              <span className="mc-tag-badge art">{activeMail.category}</span>
              <span className={`mc-tag-badge ${activeMail.priority === "High" ? "high" : "art"}`}>
                {activeMail.priority} Priority
              </span>
              <span className="mc-tag-badge awaiting">{activeMail.status}</span>
            </div>

            {/* Metadata 2x2 Box */}
            <div className="mc-metadata-box">
              <div className="mc-meta-col">
                <div>
                  <span>From:</span>
                  <b>{activeMail.sender}</b>
                  <small style={{ display: "block", color: "#64748b" }}>{activeMail.senderEmail}</small>
                </div>
                <div style={{ marginTop: "6px" }}>
                  <span>Project:</span>
                  <b>{activeMail.project}</b>
                </div>
                <div style={{ marginTop: "6px" }}>
                  <span>ISBN:</span>
                  <b>{activeMail.isbn || "N/A"}</b>
                </div>
              </div>
              <div className="mc-meta-col">
                <div>
                  <span>Raised:</span>
                  <b>{activeMail.dateStr}</b>
                </div>
                <div style={{ marginTop: "6px" }}>
                  <span>Assignee:</span>
                  <b className="assignee-name" style={{ color: "#16a34a" }}>{activeMail.assignee || "Unassigned"}</b>
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="mc-body-text">{activeMail.body}</div>

            {/* Attachments */}
            {activeMail.attachments?.length > 0 && (
              <div className="mc-attachments-section">
                <h4>Attachments ({activeMail.attachments.length})</h4>
                <div className="mc-attachment-cards-grid">
                  {activeMail.attachments.map((att, idx) => (
                    <div key={idx} className="mc-attachment-card">
                      {att.type === "pdf" ? (
                        <FileText size={18} className="pdf-icon" />
                      ) : (
                        <FileSpreadsheet size={18} className="xlsx-icon" />
                      )}
                      <div className="mc-att-info">
                        <b>{att.name}</b>
                        <small>{att.size}</small>
                      </div>
                      <div className="mc-att-actions">
                        <button title="Download" onClick={() => note?.(`Downloading ${att.name}`)}>
                          <Download size={13} />
                        </button>
                        <button title="Preview" onClick={() => note?.(`Previewing ${att.name}`)}>
                          <Eye size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mc-quick-actions-row">
              <button className="mc-btn-quick" onClick={() => setShowReplyModal(true)}>
                <CornerUpLeft size={14} />
                <span>Reply</span>
              </button>
              <button className="mc-btn-quick" onClick={() => setShowReplyModal(true)}>
                <CornerUpLeft size={14} />
                <span>Reply All</span>
              </button>
              <button className="mc-btn-quick" onClick={() => setShowComposeModal(true)}>
                <CornerUpRight size={14} />
                <span>Forward</span>
              </button>
            </div>

            {/* More Actions */}
            <div className="mc-more-actions-grid">
              <button
                className="mc-btn-more"
                onClick={() => {
                  setMails(prev =>
                    prev.map(m => (m.id === activeMail.id ? { ...m, status: "Resolved" } : m))
                  );
                  persistMailPatch(activeMail.id, { status: "Resolved" });
                  note?.("Marked as Resolved.");
                }}
              >
                <CheckCircle2 size={13} />
                <span>Mark Resolved</span>
              </button>
              <button className="mc-btn-more" onClick={() => setShowAssignModal(true)}>
                <UserCheck size={13} />
                <span>Assign Employee</span>
              </button>
              <button className="mc-btn-more" onClick={() => note?.("Linked to Project PRJ001.")}>
                <Link size={13} />
                <span>Link to Project</span>
              </button>
              <button className="mc-btn-more" onClick={() => note?.("Downloading all attachments.")}>
                <Download size={13} />
                <span>Download Attachments</span>
              </button>
            </div>

            {/* Conversation Timeline */}
            <div className="mc-timeline-section">
              <h4>Conversation Timeline</h4>
              <div className="mc-timeline-list">
                {(activeMail.timeline || []).map((ev, idx) => (
                  <div key={idx} className="mc-timeline-event">
                    <div className="mc-timeline-icon">
                      <User size={12} />
                    </div>
                    <div className="mc-timeline-content">
                      <b>{ev.role}</b>
                      <span>{ev.title}</span>
                      {ev.body && <p className="mc-timeline-message">{ev.body}</p>}
                    </div>
                    <span className="mc-timeline-time">{ev.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Internal Note Box */}
            <div className="mc-internal-note-box">
              <label>Internal Note</label>
              <textarea
                value={internalNoteText}
                onChange={(e) => setInternalNoteText(e.target.value)}
                placeholder="Add internal note..."
              />
              <div className="mc-internal-note-foot">
                <button className="mc-btn-add-note" onClick={handleAddInternalNote}>
                  Add Note
                </button>
              </div>
            </div>
          </aside>
        ) : (
          <aside className="mc-detail-pane" style={{ justifyContent: "center", alignItems: "center", color: "#64748b" }}>
            Select an email to view full conversation details
          </aside>
        )}
      </div>

      {/* ================= MODAL: COMPOSE MAIL (TARGETED RECIPIENT) ================= */}
      {showComposeModal && (
        <div className="mc-modal-bg" onClick={(e) => e.target === e.currentTarget && setShowComposeModal(false)}>
          <div className="mc-compose-modal">
            <div className="mc-modal-head">
              <h2>Compose New Mail Correction</h2>
              <button className="mc-modal-close" onClick={() => setShowComposeModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="mc-compose-body">
              {/* Multiple recipient selection keeps each employee's inbox routing independent. */}
              <div className="mc-form-field">
                <div className="mc-recipient-label-row">
                  <label>Recipients</label>
                  <span>{composeForm.recipientIds.length ? `${composeForm.recipientIds.length} selected` : "Select one or more employees"}</span>
                </div>
                <div className="mc-recipient-picker">
                  <label className="mc-recipient-option mc-recipient-broadcast">
                    <input
                      type="checkbox"
                      checked={composeForm.recipientIds.includes("all")}
                      onChange={(e) => setComposeForm({
                        ...composeForm,
                        recipientIds: e.target.checked ? ["all"] : []
                      })}
                    />
                    <span><b>All Employees</b><small>Broadcast to every employee</small></span>
                  </label>
                  <div className="mc-recipient-list">
                    {employeeRoster.map(emp => (
                      <label className="mc-recipient-option" key={emp.id}>
                        <input
                          type="checkbox"
                          checked={composeForm.recipientIds.includes(emp.id)}
                          disabled={composeForm.recipientIds.includes("all")}
                          onChange={(e) => setComposeForm(prev => ({
                            ...prev,
                            recipientIds: e.target.checked
                              ? [...prev.recipientIds.filter(id => id !== "all"), emp.id]
                              : prev.recipientIds.filter(id => id !== emp.id)
                          }))}
                        />
                        <span><b>{emp.code} - {emp.name}</b><small>{emp.role} · {emp.team}</small></span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mc-form-row">
                <div className="mc-form-field">
                  <label>Project Name</label>
                  <input
                    value={composeForm.project}
                    onChange={(e) => setComposeForm({ ...composeForm, project: e.target.value })}
                    placeholder="Project Name"
                  />
                </div>
                <div className="mc-form-field">
                  <label>ISBN</label>
                  <input
                    value={composeForm.isbn}
                    onChange={(e) => setComposeForm({ ...composeForm, isbn: e.target.value })}
                    placeholder="9781944659790"
                  />
                </div>
              </div>

              <div className="mc-form-row">
                <div className="mc-form-field">
                  <label>Chapter / Section</label>
                  <input
                    value={composeForm.chapter}
                    onChange={(e) => setComposeForm({ ...composeForm, chapter: e.target.value })}
                    placeholder="Chapter 09"
                  />
                </div>
                <div className="mc-form-field">
                  <label>Category / Label</label>
                  <select
                    value={composeForm.category}
                    onChange={(e) => setComposeForm({ ...composeForm, category: e.target.value })}
                  >
                    <option value="Art Correction">Art Correction</option>
                    <option value="Text Correction">Text Correction</option>
                    <option value="Client Query">Client Query</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="mc-form-row">
                <div className="mc-form-field">
                  <label>Priority</label>
                  <select
                    value={composeForm.priority}
                    onChange={(e) => setComposeForm({ ...composeForm, priority: e.target.value })}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="mc-form-field">
                  <label>Subject</label>
                  <input
                    value={composeForm.subject}
                    onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                    placeholder="Art correction required"
                  />
                </div>
              </div>

              <div className="mc-form-field">
                <label>Message Instructions</label>
                <textarea
                  rows={5}
                  value={composeForm.body}
                  onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                  placeholder="Enter detailed correction instructions for the assigned employee..."
                />
              </div>
            </div>

            <div className="mc-compose-foot">
              <button className="mc-action-btn" onClick={() => setShowComposeModal(false)}>
                Cancel
              </button>
              <button className="mc-btn-compose-top" onClick={handleSendCompose}>
                <Send size={14} />
                <span>Send Mail</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ASSIGN EMPLOYEE ================= */}
      {showAssignModal && activeMail && (
        <div className="mc-modal-bg" onClick={(e) => e.target === e.currentTarget && setShowAssignModal(false)}>
          <div className="mc-compose-modal" style={{ maxWidth: "460px" }}>
            <div className="mc-modal-head">
              <h2>Assign Correction to Employee</h2>
              <button className="mc-modal-close" onClick={() => setShowAssignModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="mc-compose-body">
              <p style={{ color: "#64748b", margin: 0 }}>
                Select the specific Employee ID to route this mail correction directly to their workspace:
              </p>
              <div className="mc-form-field">
                <label>Select Production Employee</label>
                <select
                  defaultValue={activeMail.assigneeId || ""}
                  onChange={(e) => handleAssignEmployee(e.target.value)}
                >
                  <option value="" disabled>Select an employee</option>
                  {employeeRoster.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.code} - {emp.name} ({emp.role} · {emp.team})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mc-compose-foot">
              <button className="mc-action-btn" onClick={() => setShowAssignModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REPLY ================= */}
      {showReplyModal && activeMail && (
        <div className="mc-modal-bg" onClick={(e) => e.target === e.currentTarget && setShowReplyModal(false)}>
          <div className="mc-compose-modal" style={{ maxWidth: "520px" }}>
            <div className="mc-modal-head">
              <h2>Reply to {activeMail.sender}</h2>
              <button className="mc-modal-close" onClick={() => setShowReplyModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="mc-compose-body">
              <p style={{ margin: 0, color: "#475569" }}>
                <b>Subject:</b> Re: {activeMail.title || activeMail.subject}
              </p>
              <div className="mc-form-field">
                <label>Reply Message</label>
                <textarea
                  rows={6}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply message here..."
                />
              </div>
            </div>
            <div className="mc-compose-foot">
              <button className="mc-action-btn" onClick={() => setShowReplyModal(false)}>
                Cancel
              </button>
              <button className="mc-btn-compose-top" onClick={handleSendReply}>
                <Send size={14} />
                <span>Send Reply</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
