import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
  MapPin,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X
} from "lucide-react";
import PeterLangMaster from "./PeterLangMaster";
import "./peter-lang-master.css";

// Initial default client: Peter Lang
const INITIAL_CLIENTS = [
  {
    id: "CLI-PETERLANG",
    code: "PL",
    name: "Peter Lang Publishing Group",
    subtitle: "International Academic & Scientific Publishers · Established 1970",
    location: "Bern, Switzerland / International",
    industry: "Academic & Scientific Publishing",
    titlesCount: "200+ Books & Journals",
    stagesCount: "10 Production Stages",
    email: "editorial@peterlang.com",
    contactPerson: "Dr. Hans Meyer (Publishing Director)",
    status: "Active Enterprise Partner",
    masterFileName: "PeterLang_Master_Batch_2026.xlsx",
    masterFileSize: "4.8 MB",
    uploadedDate: "01 Sep 2026"
  }
];

export default function ClientsModule({ projects, note }) {
  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem("fileflow_clients_list");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [activeClientMaster, setActiveClientMaster] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New Client Form State
  const [form, setForm] = useState({
    name: "",
    code: "",
    location: "",
    industry: "Academic & Scientific Publishing",
    titlesCount: "50 Titles",
    stagesCount: "8 Stages",
    email: "",
    contactPerson: "",
    masterFile: null
  });

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("fileflow_clients_list", JSON.stringify(clients));
      window.dispatchEvent(new Event("fileflowClientsUpdated"));
    } catch (e) {}
  }, [clients]);

  // Handle Form Change
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(prev => ({
        ...prev,
        masterFile: {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        }
      }));
      note?.(`Uploaded master file: ${file.name}`);
    }
  };

  // Submit Add Client
  const handleAddClientSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      note?.("Please enter the client name and contact email.");
      return;
    }

    const initials = form.name
      .split(" ")
      .map(w => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const newClient = {
      id: `CLI-${Date.now()}`,
      code: form.code.trim().toUpperCase() || initials || "CL",
      name: form.name.trim(),
      subtitle: `${form.industry} · Partner since ${new Date().getFullYear()}`,
      location: form.location.trim() || "International",
      industry: form.industry,
      titlesCount: form.titlesCount || "50 Titles",
      stagesCount: form.stagesCount || "8 Stages",
      email: form.email.trim(),
      contactPerson: form.contactPerson.trim() || "Publishing Lead",
      status: "Active Enterprise Partner",
      masterFileName: form.masterFile?.name || `${form.name.replace(/\s+/g, "_")}_Master_Data.xlsx`,
      masterFileSize: form.masterFile?.size || "2.4 MB",
      uploadedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    };

    setClients(prev => [newClient, ...prev]);
    setShowAddModal(false);
    setForm({
      name: "",
      code: "",
      location: "",
      industry: "Academic & Scientific Publishing",
      titlesCount: "50 Titles",
      stagesCount: "8 Stages",
      email: "",
      contactPerson: "",
      masterFile: null
    });

    note?.(`New client "${newClient.name}" and Master Sheet successfully added.`);
  };

  // Delete Client
  const handleDeleteClient = (clientId, e) => {
    e.stopPropagation();
    if (clients.length <= 1) {
      note?.("At least one client record must remain in the platform.");
      return;
    }
    setClients(prev => prev.filter(c => c.id !== clientId));
    note?.("Client removed.");
  };

  // If viewing a client's Master Sheet
  if (activeClientMaster) {
    return (
      <PeterLangMaster
        client={activeClientMaster}
        note={note}
        onBack={() => setActiveClientMaster(null)}
      />
    );
  }

  // Filtered Clients
  const filteredClients = clients.filter(c =>
    !searchQuery.trim() ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="clients-container" style={{ padding: "4px 0 24px" }}>
      {/* 1. Header Bar with Top Right "+ Add Client" Button */}
      <div className="excel-head" style={{ marginBottom: "18px" }}>
        <div>
          <small style={{ color: "#2874b2", fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" }}>
            Customer Operations / Clients
          </small>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", margin: "2px 0 3px" }}>
            Clients
          </h1>
          <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
            Manage enterprise publishing partners, upload master sheets, and access live title trackers.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="mc-btn-compose-top"
            onClick={() => setShowAddModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#2874b2",
              color: "#ffffff",
              border: "1px solid #2874b2",
              borderRadius: "9px",
              padding: "8px 16px",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            <Plus size={16} />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Search Bar if multiple clients exist */}
      {clients.length > 1 && (
        <div style={{ marginBottom: "16px", maxWidth: "420px", display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #dce7f3", borderRadius: "8px", padding: "6px 12px" }}>
          <Search size={15} color="#64748b" />
          <input
            style={{ border: "none", outline: "none", width: "100%", fontSize: "12px", color: "#0f172a" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search publisher name, location or email..."
          />
        </div>
      )}

      {/* 2. Client Cards List */}
      <div style={{ display: "grid", gap: "18px" }}>
        {filteredClients.map((client) => (
          <div key={client.id} className="client-hero-card">
            <div className="client-hero-top">
              <div className="client-hero-brand">
                <div className="client-hero-logo">{client.code || "PL"}</div>
                <div className="client-hero-title">
                  <h2>{client.name}</h2>
                  <p>{client.subtitle}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="badge b-completed">{client.status}</span>
                {clients.length > 1 && (
                  <button
                    title="Remove Client"
                    onClick={(e) => handleDeleteClient(client.id, e)}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="client-hero-grid">
              <div>
                <span>Headquarters</span>
                <b>{client.location}</b>
              </div>
              <div>
                <span>Active Titles Inventory</span>
                <b>{client.titlesCount}</b>
              </div>
              <div>
                <span>Workflow Stages</span>
                <b>{client.stagesCount}</b>
              </div>
              <div>
                <span>Primary Contact</span>
                <b>{client.email}</b>
              </div>
            </div>

            {/* Master Sheet Attachment Box */}
            {client.masterFileName && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#eff6fc",
                  border: "1px solid #c7ddf2",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "12px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FileSpreadsheet size={20} color="#2874b2" />
                  <div>
                    <b style={{ color: "#0b3c6d", display: "block" }}>{client.masterFileName}</b>
                    <small style={{ color: "#64748b" }}>
                      Uploaded {client.uploadedDate} · {client.masterFileSize} · Ready for real-time sync
                    </small>
                  </div>
                </div>
                <span style={{ color: "#2874b2", fontWeight: 700, fontSize: "11px" }}>
                  ✓ Master Sheet Linked
                </span>
              </div>
            )}

            <div className="client-hero-actions">
              <button className="client-btn-master" onClick={() => setActiveClientMaster(client)}>
                <FileSpreadsheet size={16} />
                <span>Open {client.name.split(" ")[0]} Master Sheet</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Modal: Add New Client with Master Sheet Upload */}
      {showAddModal && (
        <div
          className="mc-modal-bg"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="mc-compose-modal" style={{ maxWidth: "620px" }}>
            <div className="mc-modal-head">
              <h2>Add New Customer & Master Sheet</h2>
              <button className="mc-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddClientSubmit}>
              <div className="mc-compose-body">
                <div className="mc-form-row">
                  <div className="mc-form-field">
                    <label>Client / Publisher Name *</label>
                    <input
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Taylor & Francis Group"
                    />
                  </div>
                  <div className="mc-form-field">
                    <label>Publisher Code (2-4 Letters)</label>
                    <input
                      name="code"
                      value={form.code}
                      onChange={handleChange}
                      placeholder="e.g. TF or SPRINGER"
                    />
                  </div>
                </div>

                <div className="mc-form-row">
                  <div className="mc-form-field">
                    <label>Headquarters / Location</label>
                    <input
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="e.g. Oxford, United Kingdom"
                    />
                  </div>
                  <div className="mc-form-field">
                    <label>Industry / Vertical</label>
                    <select name="industry" value={form.industry} onChange={handleChange}>
                      <option value="Academic & Scientific Publishing">Academic & Scientific Publishing</option>
                      <option value="Higher Education & STEM">Higher Education & STEM</option>
                      <option value="Medical & Healthcare Publishing">Medical & Healthcare Publishing</option>
                      <option value="Trade & Fiction Books">Trade & Fiction Books</option>
                    </select>
                  </div>
                </div>

                <div className="mc-form-row">
                  <div className="mc-form-field">
                    <label>Primary Contact Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="editorial@clientdomain.com"
                    />
                  </div>
                  <div className="mc-form-field">
                    <label>Contact Person / Lead</label>
                    <input
                      name="contactPerson"
                      value={form.contactPerson}
                      onChange={handleChange}
                      placeholder="e.g. Sarah Jenkins"
                    />
                  </div>
                </div>

                <div className="mc-form-row">
                  <div className="mc-form-field">
                    <label>Estimated Initial Titles</label>
                    <input
                      name="titlesCount"
                      value={form.titlesCount}
                      onChange={handleChange}
                      placeholder="e.g. 150 Books"
                    />
                  </div>
                  <div className="mc-form-field">
                    <label>Production Stages Count</label>
                    <input
                      name="stagesCount"
                      value={form.stagesCount}
                      onChange={handleChange}
                      placeholder="e.g. 10 Production Stages"
                    />
                  </div>
                </div>

                {/* Upload Master Sheet / Data File */}
                <div className="mc-form-field">
                  <label>Upload Client Master Sheet / Inventory Data (Excel / CSV / XLSX)</label>
                  <label
                    style={{
                      border: "1.5px dashed #8ec0e4",
                      background: "#f8fbfe",
                      borderRadius: "8px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    <Upload size={22} color="#2874b2" style={{ marginBottom: "6px" }} />
                    <b style={{ fontSize: "12px", color: "#0b3c6d" }}>
                      {form.masterFile ? form.masterFile.name : "Click to browse or drop Master Sheet file"}
                    </b>
                    <span style={{ fontSize: "10.5px", color: "#64748b", marginTop: "2px" }}>
                      {form.masterFile
                        ? `File size: ${form.masterFile.size} · Click to replace`
                        : "Supports .XLSX, .XLS, .CSV or .ZIP spreadsheets"}
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.zip"
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>

              <div className="mc-compose-foot">
                <button type="button" className="mc-action-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="mc-btn-compose-top">
                  <CheckCircle2 size={15} />
                  <span>Save Client & Master Sheet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

