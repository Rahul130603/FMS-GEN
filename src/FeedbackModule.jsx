import React, { useState, useEffect, useMemo } from "react";
import {
  MessageSquareHeart,
  ThumbsUp,
  ThumbsDown,
  Star,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  User,
  BookOpen,
  Sparkles,
  Building2,
  Check,
  Eye,
  Filter
} from "lucide-react";
import "./feedback-module.css";
import Pagination from "./Pagination";
import "./pagination.css";

const FEEDBACK_STORAGE_KEY = "fileflow_feedbacks";

const INITIAL_FEEDBACKS = [
  {
    id: "FB-101",
    client: "Peter Lang",
    isbn: "9783034339841",
    project: "European Philosophy & Ethics Vol. 4",
    feature: "positive", // "positive" | "negative" | "general"
    category: "Typesetting & Formatting",
    rating: 5,
    title: "Outstanding Typesetting & Complex Diacritics",
    comment: "Outstanding typesetting precision on European Philosophy Vol 4. Complex German umlauts, French accents, and multilingual footnotes are flawlessly aligned. Highly appreciated!",
    employee: "Jaisrinivas P K (Developer)",
    employeeId: "EMP1001",
    channel: "Client Sign-off Email",
    date: "2026-09-02",
    status: "Acknowledged",
    rca: "",
    capa: ""
  },
  {
    id: "FB-102",
    client: "John Wiley & Sons",
    isbn: "9781119782506",
    project: "Handbook of Clinical Biochemistry 2nd Ed",
    feature: "positive",
    category: "Art & Graphics QC",
    rating: 5,
    title: "Urgent Medical Figures Delivered Ahead of Schedule",
    comment: "Urgent Chapter 09 medical biochemistry figures were delivered 4 hours ahead of schedule. Excellent clarity and vector crispness on high-res microscopy charts.",
    employee: "Sivakumar G (Graphics)",
    employeeId: "EMP1002",
    channel: "Production Portal",
    date: "2026-09-03",
    status: "Acknowledged",
    rca: "",
    capa: ""
  },
  {
    id: "FB-103",
    client: "Cengage Learning",
    isbn: "9780357670897",
    project: "General Chemistry Principles & Calculations",
    feature: "positive",
    category: "EPUB / Digital Workflow",
    rating: 5,
    title: "Flawless EPUB 3.0 MathML Validation",
    comment: "Interactive EPUB 3.0 reflowable layout passed all IDPF and DAISY accessibility validations on the very first attempt. Seamless math equations rendering across tablet viewers.",
    employee: "Vandhana T (QC)",
    employeeId: "EMP1003",
    channel: "Publisher Review Note",
    date: "2026-09-01",
    status: "Acknowledged",
    rca: "",
    capa: ""
  },
  {
    id: "FB-104",
    client: "Elsevier",
    isbn: "9780128243602",
    project: "Molecular Biology of Cell Membranes",
    feature: "negative",
    category: "Typesetting & Special Characters",
    rating: 2,
    title: "Missing Greek Symbol in Chapter 03 Table Headers",
    comment: "Mathematical sigma and delta symbols in Table 3.2 rendered as question marks in the print-ready PDF proof. Client flagged this during final author proofing.",
    employee: "Jaisrinivas P K (Developer)",
    employeeId: "EMP1001",
    channel: "Quality Error Escalation",
    date: "2026-09-02",
    status: "In Progress",
    severity: "High",
    rca: "OTF mathematical font subset was not properly embedded during Distiller export.",
    capa: "Updated InDesign PDF export preset to force 100% font subsetting and automated font preflight check."
  },
  {
    id: "FB-105",
    client: "Oxford University Press",
    isbn: "9780198865421",
    project: "Oxford Studies in Medieval Linguistics",
    feature: "positive",
    category: "Composition & Typography",
    rating: 5,
    title: "Superb Linguistics Phonetic Fonts Rendering",
    comment: "Superb handling of Old English runes and international phonetic alphabet (IPA) symbols throughout the 640-page monograph. Editorial team was extremely impressed.",
    employee: "Arul Yosuva (Developer)",
    employeeId: "EMP1004",
    channel: "Publisher Commendation",
    date: "2026-08-30",
    status: "Acknowledged",
    rca: "",
    capa: ""
  },
  {
    id: "FB-106",
    client: "Taylor & Francis",
    isbn: "9781032158891",
    project: "Sustainable Architecture Case Studies",
    feature: "negative",
    category: "Cover Graphics & Spine",
    rating: 2,
    title: "Spine Width Variance on Hardcover Jacket",
    comment: "Spine width calculation was off by 1.8mm on the casebound jacket proof, causing the publisher logo to shift slightly over the crease line.",
    employee: "Sivakumar G (Graphics)",
    employeeId: "EMP1002",
    channel: "Prepress Reject Notice",
    date: "2026-09-03",
    status: "Open",
    severity: "Medium",
    rca: "Standard bulk paper caliper was assumed instead of client's 100gsm woodfree paper bulk chart.",
    capa: "Configured automated spine bulk calculation verification against publisher specification sheet before file export."
  },
  {
    id: "FB-107",
    client: "Peter Lang",
    isbn: "9783631862145",
    project: "Contemporary German Literature Series",
    feature: "positive",
    category: "Quality Assurance & Proofing",
    rating: 4,
    title: "Thorough QC Queries Resolved Promptly",
    comment: "The internal QC caught several missing author bio footnotes that were omitted in original manuscript. Proactive communication saved turnaround delay.",
    employee: "Vandhana T (QC)",
    employeeId: "EMP1003",
    channel: "Editorial Email",
    date: "2026-08-28",
    status: "Acknowledged",
    rca: "",
    capa: ""
  },
  {
    id: "FB-108",
    client: "Cengage Learning",
    isbn: "9780357508497",
    project: "Introduction to Microeconomics",
    feature: "negative",
    category: "Index & Cross-Referencing",
    rating: 3,
    title: "Index Page Numbers Discrepancy After Repagination",
    comment: "Index entries in Chapter 14 showed page references offset by +2 pages after final author text insert was added.",
    employee: "Jaisrinivas P K (Developer)",
    employeeId: "EMP1001",
    channel: "Author Correction Sheet",
    date: "2026-08-27",
    status: "Resolved",
    severity: "Medium",
    rca: "Index script was executed prior to merging final author corrections in prelims.",
    capa: "Added strict gate in workflow requiring index regeneration as the penultimate step before QC release."
  }
];

export default function FeedbackModule({ user, note }) {
  // 3 Feature tabs:
  // "customer" -> Customer Feedback (all client feedback overview)
  // "positive" -> Positive Feedback (commendations & high praises)
  // "negative" -> Negative Feedback (complaints, defects, RCA & resolution tracking)
  const [activeTab, setActiveTab] = useState("customer");

  const [feedbacks, setFeedbacks] = useState(() => {
    try {
      const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load feedbacks:", e);
    }
    return [];
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbacks));
    } catch (e) {
      console.error("Failed to persist feedbacks:", e);
    }
  }, [feedbacks]);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [resolvingItem, setResolvingItem] = useState(null);

  // New feedback form state
  const [formData, setFormData] = useState({
    client: "Peter Lang",
    isbn: "",
    project: "",
    feature: "positive",
    category: "Typesetting & Formatting",
    rating: 5,
    title: "",
    comment: "",
    employee: user?.name ? `${user.name} (${user.role || "Employee"})` : "Jaisrinivas P K (Developer)",
    channel: "Client Email",
    severity: "Medium",
    rca: "",
    capa: ""
  });

  // Resolution form state
  const [resolutionData, setResolutionData] = useState({
    status: "Resolved",
    rca: "",
    capa: "",
    actionNotes: ""
  });

  // Metrics calculation
  const totalCount = feedbacks.length;
  const positiveCount = feedbacks.filter((f) => f.feature === "positive" || f.rating >= 4).length;
  const negativeCount = feedbacks.filter((f) => f.feature === "negative" || f.rating <= 2).length;
  const resolvedCount = feedbacks.filter((f) => f.status === "Resolved").length;
  const openIssuesCount = feedbacks.filter(
    (f) => f.feature === "negative" && f.status !== "Resolved"
  ).length;

  const avgRating = (
    feedbacks.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) / (totalCount || 1)
  ).toFixed(1);

  // Filtered feedbacks based on current tab and filters
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      // Tab filter
      if (activeTab === "positive") {
        if (item.feature !== "positive" && item.rating < 4) return false;
      } else if (activeTab === "negative") {
        if (item.feature !== "negative" && item.rating > 3) return false;
      }
      // Client filter
      if (clientFilter !== "All" && item.client !== clientFilter) return false;
      // Category filter
      if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
      // Status filter
      if (statusFilter !== "All" && item.status !== statusFilter) return false;

      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matches =
          item.client.toLowerCase().includes(query) ||
          item.isbn.toLowerCase().includes(query) ||
          item.project.toLowerCase().includes(query) ||
          item.title.toLowerCase().includes(query) ||
          item.comment.toLowerCase().includes(query) ||
          item.employee.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [feedbacks, activeTab, clientFilter, categoryFilter, statusFilter, search]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const paginatedFeedbacks = useMemo(() => {
    return filteredFeedbacks.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredFeedbacks, page, pageSize]);

  // Clients list for dropdown
  const uniqueClients = useMemo(() => {
    const clients = new Set(feedbacks.map((f) => f.client));
    return ["All", ...Array.from(clients)];
  }, [feedbacks]);

  // Categories list for dropdown
  const uniqueCategories = useMemo(() => {
    const categories = new Set(feedbacks.map((f) => f.category));
    return ["All", ...Array.from(categories)];
  }, [feedbacks]);

  // Handle Add Feedback
  const handleAddFeedback = (e) => {
    e.preventDefault();
    if (!formData.client || !formData.isbn || !formData.title || !formData.comment) {
      note?.("Please fill in all mandatory feedback fields");
      return;
    }

    const newId = `FB-${Date.now().toString().slice(-4)}`;
    const newRecord = {
      ...formData,
      id: newId,
      date: new Date().toISOString().split("T")[0],
      status: formData.feature === "negative" ? "Open" : "Acknowledged"
    };

    setFeedbacks((prev) => [newRecord, ...prev]);
    setShowAddModal(false);
    setFormData({
      client: "Peter Lang",
      isbn: "",
      project: "",
      feature: activeTab === "negative" ? "negative" : "positive",
      category: "Typesetting & Formatting",
      rating: 5,
      title: "",
      comment: "",
      employee: user?.name ? `${user.name} (${user.role || "Employee"})` : "Jaisrinivas P K (Developer)",
      channel: "Client Email",
      severity: "Medium",
      rca: "",
      capa: ""
    });
    note?.("Feedback logged successfully!");
  };

  // Open resolve modal
  const handleOpenResolve = (item) => {
    setResolvingItem(item);
    setResolutionData({
      status: "Resolved",
      rca: item.rca || "",
      capa: item.capa || "",
      actionNotes: `Issue inspected and resolved by ${user?.name || "Admin"} on ${new Date().toLocaleDateString()}.`
    });
  };

  // Submit resolution
  const handleSaveResolution = (e) => {
    e.preventDefault();
    if (!resolvingItem) return;

    setFeedbacks((prev) =>
      prev.map((item) =>
        item.id === resolvingItem.id
          ? {
              ...item,
              status: resolutionData.status,
              rca: resolutionData.rca || item.rca,
              capa: resolutionData.capa || item.capa,
              resolutionDate: new Date().toISOString().split("T")[0],
              resolvedBy: user?.name || "Admin"
            }
          : item
      )
    );
    setResolvingItem(null);
    note?.(`Defect ${resolvingItem.id} marked as ${resolutionData.status}`);
  };

  // Render Stars
  const renderStars = (rating) => {
    return (
      <div className="fb-stars" title={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={i <= rating ? "filled-star" : "empty-star"} />
        ))}
      </div>
    );
  };

  return (
    <div className="fb-shell">
      {/* Top Header */}
      <div className="fb-header">
        <div className="fb-header-info">
          <small>QUALITY & CLIENT SATISFACTION HUB</small>
          <h1>Feedback & Client Insights</h1>
          <p>
            Monitor publisher reviews, client commendations, and defect corrective actions in one
            central place.
          </p>
        </div>
        <div className="fb-header-actions">
          <button
            type="button"
            className="primary"
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                feature: activeTab === "negative" ? "negative" : "positive"
              }));
              setShowAddModal(true);
            }}
          >
            <Plus /> Log New Feedback
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="fb-kpi-grid">
        <div className="fb-kpi-card">
          <div className="fb-kpi-icon blue">
            <MessageSquareHeart />
          </div>
          <div className="fb-kpi-details">
            <small>Total Feedback Received</small>
            <b>{totalCount}</b>
            <span>Across 6 publishing clients</span>
          </div>
        </div>

        <div className="fb-kpi-card">
          <div className="fb-kpi-icon green">
            <ThumbsUp />
          </div>
          <div className="fb-kpi-details">
            <small>Positive Commendations</small>
            <b>{positiveCount}</b>
            <span>{Math.round((positiveCount / (totalCount || 1)) * 100)}% satisfaction rate</span>
          </div>
        </div>

        <div className="fb-kpi-card">
          <div className="fb-kpi-icon red">
            <ThumbsDown />
          </div>
          <div className="fb-kpi-details">
            <small>Negative / Quality Defects</small>
            <b>{negativeCount}</b>
            <span>{openIssuesCount} active open defect{openIssuesCount === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="fb-kpi-card">
          <div className="fb-kpi-icon amber">
            <Star />
          </div>
          <div className="fb-kpi-details">
            <small>Average Client CSAT</small>
            <b>{avgRating} / 5.0</b>
            <span>Based on verified delivery reviews</span>
          </div>
        </div>
      </div>

      {/* 3-Feature Tab Switcher */}
      <div className="fb-nav-tabs">
        <button
          type="button"
          className={`fb-tab-btn ${activeTab === "customer" ? "active" : ""}`}
          onClick={() => setActiveTab("customer")}
        >
          <MessageSquareHeart />
          <span>Customer Feedback</span>
          <span className="fb-tab-badge">{totalCount}</span>
        </button>

        <button
          type="button"
          className={`fb-tab-btn tab-positive ${activeTab === "positive" ? "active" : ""}`}
          onClick={() => setActiveTab("positive")}
        >
          <ThumbsUp />
          <span>Positive Feedback</span>
          <span className="fb-tab-badge">{positiveCount}</span>
        </button>

        <button
          type="button"
          className={`fb-tab-btn tab-negative ${activeTab === "negative" ? "active" : ""}`}
          onClick={() => setActiveTab("negative")}
        >
          <ThumbsDown />
          <span>Negative Feedback</span>
          <span className="fb-tab-badge">{negativeCount}</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="fb-toolbar">
        <div className="fb-search-box">
          <Search />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search in ${
              activeTab === "customer"
                ? "all customer feedback"
                : activeTab === "positive"
                ? "positive commendations"
                : "negative feedback & defect logs"
            } (ISBN, Client, Employee)...`}
          />
        </div>

        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
          <option value="All">All Publishing Clients</option>
          {uniqueClients
            .filter((c) => c !== "All")
            .map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
        </select>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="All">All Categories</option>
          {uniqueCategories
            .filter((c) => c !== "All")
            .map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
        </select>

        {activeTab === "negative" && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Resolution Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        )}

        {(search || clientFilter !== "All" || categoryFilter !== "All" || statusFilter !== "All") && (
          <button
            type="button"
            className="reset-btn"
            onClick={() => {
              setSearch("");
              setClientFilter("All");
              setCategoryFilter("All");
              setStatusFilter("All");
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* FEATURE 1: CUSTOMER FEEDBACK (OVERVIEW & LOG) */}
      {activeTab === "customer" && (
        <div className="fb-panel">
          <div className="fb-panel-header">
            <div>
              <h3>Customer Feedback Master Directory</h3>
              <p>Chronological record of all publisher reviews, CSAT ratings, and quality notices.</p>
            </div>
            <span className="fb-badge neutral">
              Showing {filteredFeedbacks.length} of {totalCount} records
            </span>
          </div>

          <div className="fb-table-container">
            <table className="fb-table">
              <thead>
                <tr>
                  <th>Feedback ID</th>
                  <th>Client / Publisher</th>
                  <th>ISBN & Project</th>
                  <th>Category</th>
                  <th>Rating</th>
                  <th>Sentiment</th>
                  <th>Employee Involved</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFeedbacks.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <b>{item.id}</b>
                      <small style={{ color: "#64748b" }}>{item.channel}</small>
                    </td>
                    <td>
                      <span className="fb-client-tag">
                        <Building2 style={{ width: 13, height: 13 }} />
                        {item.client}
                      </span>
                    </td>
                    <td>
                      <b>{item.project}</b>
                      <small style={{ color: "#64748b" }}>ISBN: {item.isbn}</small>
                    </td>
                    <td>{item.category}</td>
                    <td>{renderStars(item.rating)}</td>
                    <td>
                      <span
                        className={`fb-badge ${
                          item.feature === "positive" || item.rating >= 4
                            ? "positive"
                            : item.feature === "negative" || item.rating <= 2
                            ? "negative"
                            : "neutral"
                        }`}
                      >
                        {item.feature === "positive" || item.rating >= 4 ? (
                          <>
                            <ThumbsUp style={{ width: 11, height: 11 }} /> Positive
                          </>
                        ) : item.feature === "negative" || item.rating <= 2 ? (
                          <>
                            <ThumbsDown style={{ width: 11, height: 11 }} /> Negative
                          </>
                        ) : (
                          "Neutral"
                        )}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <User style={{ width: 13, height: 13, color: "#2874b2" }} />
                        <span>{item.employee}</span>
                      </div>
                    </td>
                    <td>{item.date}</td>
                    <td>
                      <button
                        type="button"
                        className="secondary"
                        style={{ height: 28, padding: "0 10px", fontSize: 11.5 }}
                        onClick={() => setSelectedFeedback(item)}
                      >
                        <Eye style={{ width: 12, height: 12 }} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredFeedbacks.length === 0 && (
              <div className="fb-empty">
                <MessageSquareHeart />
                <b>No customer feedback found</b>
                <span>Try changing search keywords or active filters</span>
              </div>
            )}
          </div>
          {filteredFeedbacks.length > 0 && (
            <Pagination
              currentPage={page}
              totalItems={filteredFeedbacks.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
              itemName="feedback items"
            />
          )}
        </div>
      )}

      {/* FEATURE 2: POSITIVE FEEDBACK (COMMENDATIONS & KUDOS) */}
      {activeTab === "positive" && (
        <div className="fb-panel">
          <div className="fb-panel-header">
            <div>
              <h3>Client Commendations & Positive Accolades</h3>
              <p>Verified testimonials, zero-defect praises, and on-time performance compliments.</p>
            </div>
            <span className="fb-badge positive">
              <Sparkles style={{ width: 12, height: 12 }} /> {filteredFeedbacks.length} Commendations
            </span>
          </div>

          <div className="fb-positive-grid">
            {filteredFeedbacks.map((item) => (
              <div key={item.id} className="fb-positive-card">
                <div className="fb-card-top">
                  <div>
                    <span className="fb-client-tag">
                      <Building2 style={{ width: 13, height: 13 }} />
                      {item.client}
                    </span>
                    <h4 style={{ margin: "8px 0 2px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                      {item.title}
                    </h4>
                    <span style={{ fontSize: 11.5, color: "#64748b" }}>
                      {item.project} · ISBN: {item.isbn}
                    </span>
                  </div>
                  {renderStars(item.rating)}
                </div>

                <p className="fb-quote-text">“{item.comment}”</p>

                <div className="fb-positive-meta">
                  <div className="fb-positive-employee">
                    <ThumbsUp />
                    <span>Recognized: {item.employee}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{item.date}</span>
                    <button
                      type="button"
                      className="secondary"
                      style={{ height: 26, padding: "0 8px", fontSize: 11 }}
                      onClick={() => setSelectedFeedback(item)}
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredFeedbacks.length === 0 && (
            <div className="fb-empty">
              <ThumbsUp />
              <b>No positive feedback matches your criteria</b>
              <span>Clear filters to view all commendations</span>
            </div>
          )}
        </div>
      )}

      {/* FEATURE 3: NEGATIVE FEEDBACK (DEFECTS, RCA & CORRECTIVE ACTION) */}
      {activeTab === "negative" && (
        <div className="fb-panel">
          <div className="fb-panel-header">
            <div>
              <h3>Quality Discrepancies, Complaints & CAPA Tracking</h3>
              <p>
                Track client-flagged defects, perform Root Cause Analysis (RCA), and verify corrective
                actions.
              </p>
            </div>
            <span className="fb-badge negative">
              <AlertTriangle style={{ width: 12, height: 12 }} /> {openIssuesCount} Unresolved Defect
              {openIssuesCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="fb-negative-list">
            {filteredFeedbacks.map((item) => (
              <div key={item.id} className="fb-negative-card">
                <div className="fb-neg-header">
                  <div className="fb-neg-info">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span className="fb-client-tag">
                        <Building2 style={{ width: 13, height: 13 }} />
                        {item.client}
                      </span>
                      <span className={`fb-badge ${item.status.toLowerCase().replace(" ", "-")}`}>
                        {item.status}
                      </span>
                      {item.severity && (
                        <span
                          className="fb-badge"
                          style={{
                            background:
                              item.severity === "High" || item.severity === "Critical"
                                ? "#fee2e2"
                                : "#fef3c7",
                            color:
                              item.severity === "High" || item.severity === "Critical"
                                ? "#991b1b"
                                : "#92400e"
                          }}
                        >
                          {item.severity} Priority
                        </span>
                      )}
                    </div>
                    <h4>{item.title}</h4>
                    <p>
                      <strong>{item.project}</strong> · ISBN: {item.isbn} · Category: {item.category}
                    </p>
                  </div>
                  {renderStars(item.rating)}
                </div>

                <p style={{ margin: 0, fontSize: 13, color: "#1e293b", lineHeight: 1.5 }}>
                  {item.comment}
                </p>

                {/* RCA & CAPA Box */}
                <div className="fb-neg-rca-box">
                  <div>
                    <b>Root Cause Analysis (RCA)</b>
                    <span>{item.rca || "Under investigation by production quality lead."}</span>
                  </div>
                  <div>
                    <b>Corrective & Preventive Action (CAPA)</b>
                    <span>{item.capa || "Pending corrective review and validation test."}</span>
                  </div>
                </div>

                <div className="fb-neg-footer">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#64748b" }}>
                    <span>
                      Assigned: <strong>{item.employee}</strong>
                    </span>
                    <span>Reported: {item.date}</span>
                    {item.resolutionDate && (
                      <span style={{ color: "#059669", fontWeight: 600 }}>
                        Resolved: {item.resolutionDate} by {item.resolvedBy || "Admin"}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="secondary"
                      style={{ height: 28, padding: "0 10px", fontSize: 11.5 }}
                      onClick={() => setSelectedFeedback(item)}
                    >
                      <Eye style={{ width: 12, height: 12 }} /> View
                    </button>
                    {item.status !== "Resolved" ? (
                      <button
                        type="button"
                        className="fb-btn-resolve"
                        onClick={() => handleOpenResolve(item)}
                      >
                        <CheckCircle2 style={{ width: 13, height: 13 }} /> Resolve Issue
                      </button>
                    ) : (
                      <span className="fb-badge resolved">
                        <Check style={{ width: 12, height: 12 }} /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredFeedbacks.length === 0 && (
              <div className="fb-empty">
                <ThumbsDown />
                <b>No negative feedback records found</b>
                <span>Great job! There are no open quality complaints matching the filter.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: LOG NEW FEEDBACK */}
      {showAddModal && (
        <div className="fb-modal-bg" onClick={() => setShowAddModal(false)}>
          <div className="fb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-header">
              <h2>Log Publisher / Customer Feedback</h2>
              <button type="button" onClick={() => setShowAddModal(false)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <form onSubmit={handleAddFeedback}>
              <div className="fb-modal-body">
                <div className="fb-form-grid">
                  <div className="fb-form-group">
                    <label>Publishing Client *</label>
                    <select
                      value={formData.client}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                      required
                    >
                      <option value="Peter Lang">Peter Lang</option>
                      <option value="John Wiley & Sons">John Wiley & Sons</option>
                      <option value="Cengage Learning">Cengage Learning</option>
                      <option value="Elsevier">Elsevier</option>
                      <option value="Oxford University Press">Oxford University Press</option>
                      <option value="Taylor & Francis">Taylor & Francis</option>
                      <option value="Springer Nature">Springer Nature</option>
                    </select>
                  </div>

                  <div className="fb-form-group">
                    <label>Feedback Feature / Nature *</label>
                    <select
                      value={formData.feature}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          feature: e.target.value,
                          rating: e.target.value === "positive" ? 5 : e.target.value === "negative" ? 2 : 4
                        })
                      }
                    >
                      <option value="positive">Positive Commendation (Feature 2)</option>
                      <option value="negative">Negative / Defect (Feature 3)</option>
                      <option value="general">Customer General (Feature 1)</option>
                    </select>
                  </div>

                  <div className="fb-form-group">
                    <label>ISBN (13-Digits) *</label>
                    <input
                      value={formData.isbn}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      placeholder="e.g. 9780198526636"
                      required
                    />
                  </div>

                  <div className="fb-form-group">
                    <label>Book / Project Title *</label>
                    <input
                      value={formData.project}
                      onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                      placeholder="e.g. Advanced Thermodynamics"
                      required
                    />
                  </div>

                  <div className="fb-form-group">
                    <label>Workflow Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Typesetting & Formatting">Typesetting & Formatting</option>
                      <option value="Art & Graphics QC">Art & Graphics QC</option>
                      <option value="EPUB / Digital Workflow">EPUB / Digital Workflow</option>
                      <option value="Quality Assurance & Proofing">Quality Assurance & Proofing</option>
                      <option value="Cover Graphics & Spine">Cover Graphics & Spine</option>
                      <option value="Delivery Schedule & Turnaround">Delivery Schedule & Turnaround</option>
                    </select>
                  </div>

                  <div className="fb-form-group">
                    <label>Star Rating (1 - 5) *</label>
                    <select
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    >
                      <option value={5}>5 Stars - Outstanding</option>
                      <option value={4}>4 Stars - Very Good</option>
                      <option value={3}>3 Stars - Average</option>
                      <option value={2}>2 Stars - Substandard / Defect</option>
                      <option value={1}>1 Star - Critical Escalation</option>
                    </select>
                  </div>

                  <div className="fb-form-group">
                    <label>Employee Addressed / Credited</label>
                    <input
                      value={formData.employee}
                      onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                      placeholder="e.g. Jaisrinivas P K (Developer)"
                    />
                  </div>

                  <div className="fb-form-group">
                    <label>Feedback Channel</label>
                    <select
                      value={formData.channel}
                      onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    >
                      <option value="Client Email">Client Email</option>
                      <option value="Production Portal">Production Portal</option>
                      <option value="Quality Error Escalation">Quality Error Escalation</option>
                      <option value="Author Correction Sheet">Author Correction Sheet</option>
                      <option value="Publisher Review Note">Publisher Review Note</option>
                    </select>
                  </div>

                  <div className="fb-form-group full">
                    <label>Feedback Headline / Title *</label>
                    <input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Superb Turnaround on Math Formula Proofs"
                      required
                    />
                  </div>

                  <div className="fb-form-group full">
                    <label>Client Feedback Description / Remarks *</label>
                    <textarea
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      placeholder="Enter exact feedback quote or notes received from client..."
                      rows={3}
                      required
                    />
                  </div>

                  {formData.feature === "negative" && (
                    <>
                      <div className="fb-form-group full">
                        <label>Root Cause Analysis (RCA)</label>
                        <textarea
                          value={formData.rca}
                          onChange={(e) => setFormData({ ...formData, rca: e.target.value })}
                          placeholder="Technical explanation of why defect occurred..."
                          rows={2}
                        />
                      </div>

                      <div className="fb-form-group full">
                        <label>Corrective & Preventive Action (CAPA)</label>
                        <textarea
                          value={formData.capa}
                          onChange={(e) => setFormData({ ...formData, capa: e.target.value })}
                          placeholder="Action taken to correct this file and prevent future occurrences..."
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="fb-modal-footer">
                <button type="button" className="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Save Feedback Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DETAILS */}
      {selectedFeedback && (
        <div className="fb-modal-bg" onClick={() => setSelectedFeedback(null)}>
          <div className="fb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-header">
              <h2>Feedback Record Details: {selectedFeedback.id}</h2>
              <button type="button" onClick={() => setSelectedFeedback(null)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="fb-modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="fb-client-tag">
                  <Building2 style={{ width: 14, height: 14 }} />
                  {selectedFeedback.client}
                </span>
                {renderStars(selectedFeedback.rating)}
              </div>

              <div>
                <h3 style={{ margin: "4px 0", fontSize: 18, color: "#0f172a" }}>
                  {selectedFeedback.title}
                </h3>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  {selectedFeedback.project} · ISBN: {selectedFeedback.isbn}
                </span>
              </div>

              <div style={{ background: "#f8fbfe", padding: 14, borderRadius: 8, border: "1px solid #dce7f3" }}>
                <strong style={{ display: "block", fontSize: 11, color: "#475569", textTransform: "uppercase" }}>
                  Client Remarks / Testimonial:
                </strong>
                <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "#1e293b", fontStyle: "italic", lineHeight: 1.5 }}>
                  “{selectedFeedback.comment}”
                </p>
              </div>

              <div className="fb-form-grid" style={{ marginTop: 4 }}>
                <div>
                  <small style={{ color: "#64748b", display: "block", fontSize: 11, textTransform: "uppercase" }}>
                    Category
                  </small>
                  <b style={{ fontSize: 13 }}>{selectedFeedback.category}</b>
                </div>

                <div>
                  <small style={{ color: "#64748b", display: "block", fontSize: 11, textTransform: "uppercase" }}>
                    Employee Involved
                  </small>
                  <b style={{ fontSize: 13 }}>{selectedFeedback.employee}</b>
                </div>

                <div>
                  <small style={{ color: "#64748b", display: "block", fontSize: 11, textTransform: "uppercase" }}>
                    Feedback Channel
                  </small>
                  <b style={{ fontSize: 13 }}>{selectedFeedback.channel}</b>
                </div>

                <div>
                  <small style={{ color: "#64748b", display: "block", fontSize: 11, textTransform: "uppercase" }}>
                    Date Recorded
                  </small>
                  <b style={{ fontSize: 13 }}>{selectedFeedback.date}</b>
                </div>
              </div>

              {selectedFeedback.rca && (
                <div style={{ background: "#fff8f8", border: "1px dashed #fca5a5", borderRadius: 8, padding: 12 }}>
                  <b style={{ color: "#991b1b", fontSize: 11, textTransform: "uppercase" }}>
                    Root Cause Analysis (RCA)
                  </b>
                  <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#7f1d1d" }}>
                    {selectedFeedback.rca}
                  </p>
                </div>
              )}

              {selectedFeedback.capa && (
                <div style={{ background: "#ecfdf5", border: "1px dashed #a7f3d0", borderRadius: 8, padding: 12 }}>
                  <b style={{ color: "#065f46", fontSize: 11, textTransform: "uppercase" }}>
                    Corrective & Preventive Action (CAPA)
                  </b>
                  <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#047857" }}>
                    {selectedFeedback.capa}
                  </p>
                </div>
              )}
            </div>

            <div className="fb-modal-footer">
              <button type="button" className="secondary" onClick={() => setSelectedFeedback(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVE NEGATIVE DEFECT */}
      {resolvingItem && (
        <div className="fb-modal-bg" onClick={() => setResolvingItem(null)}>
          <div className="fb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-header">
              <h2>Resolve Defect: {resolvingItem.id}</h2>
              <button type="button" onClick={() => setResolvingItem(null)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <form onSubmit={handleSaveResolution}>
              <div className="fb-modal-body">
                <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                  Provide root cause verification and preventive steps taken to resolve{" "}
                  <strong>{resolvingItem.title}</strong> on ISBN {resolvingItem.isbn}.
                </p>

                <div className="fb-form-group">
                  <label>Resolution Status *</label>
                  <select
                    value={resolutionData.status}
                    onChange={(e) => setResolutionData({ ...resolutionData, status: e.target.value })}
                  >
                    <option value="Resolved">Resolved (Verified & Passed QC)</option>
                    <option value="In Progress">In Progress (Under Testing)</option>
                  </select>
                </div>

                <div className="fb-form-group">
                  <label>Root Cause Analysis (RCA) *</label>
                  <textarea
                    value={resolutionData.rca}
                    onChange={(e) => setResolutionData({ ...resolutionData, rca: e.target.value })}
                    placeholder="Describe what caused the discrepancy..."
                    rows={3}
                    required
                  />
                </div>

                <div className="fb-form-group">
                  <label>Corrective & Preventive Action (CAPA) *</label>
                  <textarea
                    value={resolutionData.capa}
                    onChange={(e) => setResolutionData({ ...resolutionData, capa: e.target.value })}
                    placeholder="Describe corrective actions taken and how repeat occurrences are prevented..."
                    rows={3}
                    required
                  />
                </div>
              </div>

              <div className="fb-modal-footer">
                <button type="button" className="secondary" onClick={() => setResolvingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

