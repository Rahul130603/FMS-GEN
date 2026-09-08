import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  BookOpen,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Eye,
  FileDown,
  FileText,
  Filter,
  Layers3,
  Paperclip,
  Plus,
  Printer,
  Search,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import "./project-specifications.css";
import Pagination from "./Pagination";
import "./pagination.css";

const STORE = "fileflow_project_specifications";
const SERVICES = [
  "POD Book",
  "ePDF",
  "eBook",
  "Cover Design",
  "Interior Design / Typesetting",
  "Proofreading",
  "Other"
];

const ATTACHMENT_CATEGORIES = [
  "Manuscript File",
  "Sample/Reference File",
  "Images",
  "Logo",
  "Existing Cover",
  "Printer Template",
  "ISBN Barcode",
  "Other Supporting Files"
];

const seed = [
  {
    id: "SPEC-2026-001",
    projectId: "PRJ003",
    projectName: "Financial Accounting 12E",
    clientName: "Cengage Learning",
    authorName: "Dr. Robert Miles",
    isbn: "9781119983412",
    projectType: "Book Production",
    services: ["POD Book", "ePDF", "Cover Design"],
    assignedTo: "Farhana",
    priority: "High",
    startDate: "2026-08-24",
    deliveryDate: "2026-09-18",
    status: "Submitted",
    reference: "CEN-FA12-88",
    description: "Complete print and digital production package for the twelfth edition.",
    clientInstructions: "Follow the supplied Cengage typography and layout guide.",
    internalNotes: "Confirm final page extent before spine calculation.",
    revisionInstructions: "Two client correction rounds included.",
    revisions: "2",
    deliveryFormat: "Print-ready PDF, ePDF and cover package",
    finalOutputs: "Interior PDF, interactive ePDF, full-wrap cover PDF",
    qualityNotes: "Preflight fonts, bleed and image resolution (minimum 300 DPI).",
    createdBy: "Ashwin G",
    createdAt: "2026-08-24T10:30:00.000Z",
    updatedBy: "Ashwin G",
    updatedAt: "2026-09-01T09:15:00.000Z",
    attachments: [
      {
        name: "FA12_manuscript.docx",
        size: 2840000,
        category: "Manuscript File",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      },
      {
        name: "publisher-style-guide.pdf",
        size: 920000,
        category: "Sample/Reference File",
        type: "application/pdf"
      }
    ],
    pod: {
      trimSize: "8.5 × 11 in",
      customWidth: "8.5",
      customHeight: "11",
      unit: "in",
      pages: "684",
      binding: "Paperback",
      interiorColor: "Black & White",
      paperType: "Cream",
      paperGsm: "80",
      coverType: "Full Wrap",
      coverFinish: "Matte",
      bleed: "Yes",
      bleedSize: "0.125",
      marginTop: "0.75",
      marginBottom: "0.75",
      marginInside: "0.9",
      marginOutside: "0.7",
      gutter: "0.25",
      platform: "Amazon KDP",
      quantity: "250",
      barcode: "Yes",
      instructions: "Use publisher supplied imprint page and barcode location."
    },
    epdf: {
      pdfType: "Interactive PDF",
      pageSize: "8.5 × 11 in",
      orientation: "Portrait",
      pages: "684",
      dpi: "300",
      colorMode: "RGB",
      bleed: "No",
      cropMarks: "No",
      fontsEmbedded: "Yes",
      hyperlinks: "Yes",
      bookmarks: "Yes",
      tocLinks: "Yes",
      password: "No",
      compression: "High quality",
      accessibility: "Tagged headings and reading order",
      instructions: "Optimize for screen viewing without visible font degradation."
    },
    cover: {
      coverType: "Full Wrap",
      bookSize: "8.5 × 11 in",
      spineWidth: "1.42 in",
      bleedSize: "0.125 in",
      totalDimensions: "18.17 × 11.25 in",
      title: "Financial Accounting",
      subtitle: "Twelfth Edition",
      author: "Dr. Robert Miles",
      blurb: "The premier accounting resource for modern undergraduate business education.",
      authorBio: "Dr. Miles is a professor of accounting and finance at Stanford University.",
      barcode: "9781119983412",
      publisher: "Cengage Learning",
      genre: "Business & Economics",
      style: "Professional, academic",
      colors: "Navy, white and gold",
      fonts: "Publisher brand serif and sans-serif",
      images: "Abstract finance illustration",
      reference: "Previous edition cover layout",
      template: "Amazon KDP Paperback Template",
      finish: "Matte",
      output: "PDF, PSD",
      dpi: "300",
      colorMode: "CMYK",
      instructions: "Maintain brand family consistency across all spine and back covers."
    }
  },
  {
    id: "SPEC-2026-002",
    projectId: "PRJ005",
    projectName: "Digital Marketing 4E",
    clientName: "Oxford University Press",
    authorName: "A. Kingsnorth",
    isbn: "9780198876542",
    projectType: "Digital Edition",
    services: ["eBook", "ePDF", "Proofreading"],
    assignedTo: "Arun Kumar",
    priority: "Medium",
    startDate: "2026-08-30",
    deliveryDate: "2026-09-24",
    status: "Draft",
    reference: "OUP-DM4",
    description: "Accessible reflowable digital edition with interactive internal linking.",
    clientInstructions: "Validate accessibility with Ace by DAISY and EPUBCheck.",
    internalNotes: "Review all SVGs and math formulas in chapter 4.",
    revisionInstructions: "Single editorial round prior to master signoff.",
    revisions: "1",
    deliveryFormat: "EPUB 3.2, Mobi and Web ePDF",
    finalOutputs: "Master EPUB, screen ePDF, preflight verification report",
    qualityNotes: "All images require descriptive alt text and proper hierarchy.",
    createdBy: "Admin",
    createdAt: "2026-08-30T08:00:00.000Z",
    updatedBy: "Admin",
    updatedAt: "2026-08-30T08:00:00.000Z",
    attachments: [
      {
        name: "OUP_Digital_Checklist.xlsx",
        size: 145000,
        category: "Printer Template",
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    ],
    ebook: {
      format: "EPUB",
      layout: "Reflowable",
      platforms: "Kindle, Apple Books, Kobo, Google Play Books",
      chapters: "18",
      toc: "Yes",
      internalLinks: "Yes",
      externalLinks: "Yes",
      imagesIncluded: "Yes",
      imageDetails: "JPG/PNG, minimum 150 DPI",
      fonts: "Open licensed serif body font embedded",
      dropCaps: "No",
      notes: "Yes",
      metadata: "Full ONIX 3.0 metadata embedded",
      accessibility: "EPUB Accessibility 1.1 Conforming",
      drm: "Platform managed",
      instructions: "Must pass EPUBCheck 4.2.6 with zero warnings."
    },
    epdf: {
      pdfType: "Interactive PDF",
      pageSize: "A4 (210 × 297 mm)",
      orientation: "Portrait",
      pages: "412",
      dpi: "150",
      colorMode: "RGB",
      bleed: "No",
      cropMarks: "No",
      fontsEmbedded: "Yes",
      hyperlinks: "Yes",
      bookmarks: "Yes",
      tocLinks: "Yes",
      password: "No",
      compression: "Web optimized",
      accessibility: "Fully tagged PDF/UA compliant",
      instructions: "Set initial view to bookmarks and page fit."
    },
    proofreading: {
      styleGuide: "Oxford Style Manual",
      level: "Standard Copyediting",
      language: "UK English",
      instructions: "Check consistency of UK spelling and hyphenation in technical terms."
    }
  }
];

const blank = () => ({
  projectId: "",
  projectName: "",
  clientName: "",
  authorName: "",
  isbn: "",
  projectType: "Book Production",
  services: [],
  assignedTo: "",
  priority: "Medium",
  startDate: "",
  deliveryDate: "",
  status: "Draft",
  reference: "",
  description: "",
  clientInstructions: "",
  internalNotes: "",
  revisionInstructions: "",
  revisions: "2",
  deliveryFormat: "",
  finalOutputs: "",
  qualityNotes: "",
  attachments: [],
  pod: { unit: "in", bleed: "Yes", barcode: "Yes" },
  epdf: { orientation: "Portrait", colorMode: "RGB", fontsEmbedded: "Yes", hyperlinks: "Yes", bookmarks: "Yes", tocLinks: "Yes", bleed: "No", cropMarks: "No", password: "No" },
  ebook: { format: "EPUB", layout: "Reflowable", toc: "Yes", internalLinks: "Yes", externalLinks: "Yes", imagesIncluded: "Yes", dropCaps: "No", notes: "Yes" },
  cover: { coverType: "Full Wrap", finish: "Matte", colorMode: "CMYK" },
  interior: { alignment: "Justified" },
  proofreading: { styleGuide: "Chicago Manual of Style (CMOS)", level: "Standard Copyediting", language: "US English" },
  other: {}
});

const load = () => {
  try {
    const x = JSON.parse(localStorage.getItem(STORE) || "null");
    return Array.isArray(x) ? x : [];
  } catch {
    return [];
  }
};

const sectionFields = {
  pod: [
    ["trimSize", "Trim Size / Book Size", "select", ["6 × 9 in", "8.5 × 11 in", "5.5 × 8.5 in", "5 × 8 in", "7 × 10 in", "A4 (210 × 297 mm)", "A5 (148 × 210 mm)", "B5 (176 × 250 mm)", "Custom Size"]],
    ["customWidth", "Custom Width"],
    ["customHeight", "Custom Height"],
    ["unit", "Measurement Unit", "select", ["in", "mm"]],
    ["pages", "Number of Pages", "number"],
    ["binding", "Binding Type", "select", ["Paperback", "Hardcover", "Spiral", "Saddle Stitch", "Other"]],
    ["interiorColor", "Interior Color", "select", ["Black & White", "Standard Color", "Premium Color"]],
    ["paperType", "Paper Type"],
    ["paperGsm", "Paper GSM", "number"],
    ["coverType", "Cover Type"],
    ["coverFinish", "Cover Finish", "select", ["Matte", "Glossy", "Soft Touch", "Other"]],
    ["bleed", "Bleed Required", "yes"],
    ["bleedSize", "Bleed Size"],
    ["marginTop", "Top Margin"],
    ["marginBottom", "Bottom Margin"],
    ["marginInside", "Inside Margin"],
    ["marginOutside", "Outside Margin"],
    ["gutter", "Gutter Size"],
    ["platform", "Printing Platform", "select", ["Amazon KDP", "IngramSpark", "Local Printer", "Other"]],
    ["quantity", "Print Quantity", "number"],
    ["barcode", "ISBN / Barcode Required", "yes"],
    ["instructions", "Special Printing Instructions", "area"]
  ],
  epdf: [
    ["pdfType", "PDF Type", "select", ["Print-ready PDF", "Interactive PDF", "Standard PDF"]],
    ["pageSize", "Page Size"],
    ["orientation", "Orientation", "select", ["Portrait", "Landscape"]],
    ["pages", "Number of Pages", "number"],
    ["dpi", "Image Resolution / DPI", "number"],
    ["colorMode", "Color Mode", "select", ["RGB", "CMYK", "Grayscale"]],
    ["bleed", "Bleed Required", "yes"],
    ["cropMarks", "Crop Marks Required", "yes"],
    ["fontsEmbedded", "Fonts Embedded", "yes"],
    ["hyperlinks", "Hyperlinks Required", "yes"],
    ["bookmarks", "Bookmarks Required", "yes"],
    ["tocLinks", "Table of Contents Links", "yes"],
    ["password", "Password Protection", "yes"],
    ["compression", "PDF Quality / Compression"],
    ["accessibility", "Accessibility Requirements", "area"],
    ["instructions", "Additional PDF Instructions", "area"]
  ],
  ebook: [
    ["format", "Output Format", "select", ["EPUB", "MOBI", "Kindle", "Fixed Layout EPUB", "Reflowable EPUB"]],
    ["layout", "Layout Type", "select", ["Reflowable", "Fixed Layout"]],
    ["platforms", "Target Platforms"],
    ["chapters", "Number of Chapters", "number"],
    ["toc", "Table of Contents Required", "yes"],
    ["internalLinks", "Internal Links Required", "yes"],
    ["externalLinks", "External Links Required", "yes"],
    ["imagesIncluded", "Images Included", "yes"],
    ["imageDetails", "Image Format and Resolution"],
    ["fonts", "Font Requirements"],
    ["dropCaps", "Drop Caps Required", "yes"],
    ["notes", "Footnotes / Endnotes Required", "yes"],
    ["metadata", "Metadata Details", "area"],
    ["accessibility", "Accessibility Requirements", "area"],
    ["drm", "DRM Requirement"],
    ["instructions", "Additional eBook Instructions", "area"]
  ],
  cover: [
    ["coverType", "Cover Type", "select", ["Front Cover", "Back Cover", "Spine", "Full Wrap"]],
    ["bookSize", "Book Size (Width × Height)"],
    ["spineWidth", "Spine Width"],
    ["bleedSize", "Bleed Size"],
    ["totalDimensions", "Total Cover Dimensions"],
    ["title", "Front Cover Title"],
    ["subtitle", "Subtitle"],
    ["author", "Author Name"],
    ["blurb", "Back Cover Description / Blurb", "area"],
    ["authorBio", "Author Bio", "area"],
    ["barcode", "ISBN / Barcode Details"],
    ["publisher", "Publisher Name and Logo"],
    ["genre", "Genre / Category"],
    ["style", "Preferred Design Style"],
    ["colors", "Preferred Colors"],
    ["fonts", "Font Preference"],
    ["images", "Images / Illustrations Required"],
    ["reference", "Client Reference Design"],
    ["template", "Print Platform Template"],
    ["finish", "Cover Finish", "select", ["Matte", "Glossy", "Soft Touch", "Other"]],
    ["output", "Output Format"],
    ["dpi", "Resolution / DPI", "number"],
    ["colorMode", "Color Mode", "select", ["RGB", "CMYK"]],
    ["instructions", "Additional Cover Instructions", "area"]
  ],
  interior: [
    ["pageSize", "Page Size"],
    ["fontFamily", "Font Family"],
    ["bodySize", "Body Font Size"],
    ["headings", "Heading Styles"],
    ["lineSpacing", "Line Spacing"],
    ["paragraphSpacing", "Paragraph Spacing"],
    ["alignment", "Text Alignment", "select", ["Left", "Justified", "Centered"]],
    ["headerFooter", "Header / Footer Details"],
    ["pageNumber", "Page Number Position"],
    ["chapterStyle", "Chapter Starting Style"],
    ["imagePlacement", "Image Placement"],
    ["tableStyle", "Table Style"],
    ["instructions", "Special Layout Instructions", "area"]
  ],
  proofreading: [
    ["styleGuide", "Style Guide", "select", ["Chicago Manual of Style (CMOS)", "Oxford Style Manual", "Associated Press (AP) Stylebook", "APA Style", "Client Style Guide", "Other"]],
    ["level", "Proofreading Level", "select", ["Light Proofreading", "Standard Copyediting", "Heavy Proofreading"]],
    ["language", "Language / Dialect", "select", ["US English", "UK English", "Canadian English", "Australian English", "Other"]],
    ["instructions", "Special Proofreading Instructions", "area"]
  ],
  other: [
    ["title", "Deliverables / Service Name"],
    ["scope", "Scope & Requirements", "area"],
    ["instructions", "Special Instructions", "area"]
  ]
};

const serviceMap = {
  "POD Book": "pod",
  "ePDF": "epdf",
  "eBook": "ebook",
  "Cover Design": "cover",
  "Interior Design / Typesetting": "interior",
  "Proofreading": "proofreading",
  "Other": "other"
};

const labels = {
  pod: "POD Book Specifications",
  epdf: "ePDF Specifications",
  ebook: "eBook Specifications",
  cover: "Cover Design Specifications",
  interior: "Interior Design / Typesetting",
  proofreading: "Proofreading Specifications",
  other: "Other Specifications"
};

const fmtSize = n => (n ? `${(n / 1024 / 1024).toFixed(n > 1048576 ? 1 : 2)} MB` : "—");

export default function ProjectSpecifications({ user, note, back }) {
  const [items, setItems] = useState(load);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [service, setService] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("updated-desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORE, JSON.stringify(items));
  }, [items]);

  const filtered = useMemo(() => {
    return items
      .filter(x => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          [x.id, x.projectId, x.projectName, x.clientName, x.isbn, x.authorName].some(v =>
            String(v || "").toLowerCase().includes(q)
          );
        const matchesStatus = status === "All" || x.status === status;
        const matchesPriority = priority === "All" || x.priority === priority;
        const matchesService = service === "All" || x.services?.includes(service);
        const matchesDate =
          !dateFilter ||
          (x.deliveryDate && x.deliveryDate.includes(dateFilter)) ||
          (x.startDate && x.startDate.includes(dateFilter)) ||
          (x.createdAt && x.createdAt.slice(0, 10) === dateFilter);
        return matchesSearch && matchesStatus && matchesPriority && matchesService && matchesDate;
      })
      .sort((a, b) => {
        if (sortBy === "updated-desc") return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        if (sortBy === "created-desc") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        if (sortBy === "name-asc") return (a.projectName || "").localeCompare(b.projectName || "");
        if (sortBy === "delivery-asc") return new Date(a.deliveryDate || "9999") - new Date(b.deliveryDate || "9999");
        if (sortBy === "priority") {
          const rank = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
          return (rank[b.priority] || 0) - (rank[a.priority] || 0);
        }
        return 0;
      });
  }, [items, search, status, priority, service, dateFilter, sortBy]);

  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, status, priority, service, dateFilter, sortBy]);

  const save = (form, submit) => {
    const now = new Date().toISOString();
    const actor = user?.name || "Admin";
    if (form.id) {
      setItems(v =>
        v.map(x =>
          x.id === form.id
            ? {
                ...form,
                status: submit ? "Submitted" : form.status || "Draft",
                updatedBy: actor,
                updatedAt: now
              }
            : x
        )
      );
    } else {
      const generatedId = `SPEC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
      setItems(v => [
        {
          ...form,
          id: generatedId,
          status: submit ? "Submitted" : "Draft",
          createdBy: actor,
          createdAt: now,
          updatedBy: actor,
          updatedAt: now
        },
        ...v
      ]);
    }
    setMode(null);
    note?.(submit ? "Project specification submitted successfully" : "Project specification saved as draft");
  };

  const remove = () => {
    setItems(v => v.filter(x => x.id !== confirm.id));
    setConfirm(null);
    note?.("Project specification deleted");
  };

  const counts = s => items.filter(x => x.status === s).length;

  return (
    <div className="ps-page">
      {back && (
        <button className="ps-back" onClick={back}>
          <ArrowLeft /> Back to Customer Support
        </button>
      )}
      <header className="ps-hero">
        <div>
          <small>CUSTOMER SUPPORT / PROJECT SPECIFICATION</small>
          <h1>Project Specifications</h1>
          <p>Record, review and maintain complete technical production specifications for every publishing title.</p>
        </div>
        <button className="ps-primary" onClick={() => setMode({ type: "new", value: blank() })}>
          <Plus /> New Specification
        </button>
      </header>

      <div className="ps-stats">
        {[
          [Layers3, "Total Specifications", items.length],
          [FileText, "Draft", counts("Draft")],
          [Check, "Submitted", counts("Submitted")],
          [BookOpen, "Services Covered", new Set(items.flatMap(x => x.services || [])).size]
        ].map(([I, l, n]) => (
          <article key={l}>
            <i>
              <I />
            </i>
            <span>
              <small>{l}</small>
              <b>{n}</b>
            </span>
          </article>
        ))}
      </div>

      <section className="ps-panel">
        <div className="ps-panel-title">
          <div>
            <h2>Specification Register</h2>
            <p>Filter by service type, status, priority or date. Search across Project ID, title, client and ISBN.</p>
          </div>
        </div>

        <div className="ps-filters">
          <label className="ps-search">
            <Search />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Project ID, Book title, Client or ISBN..."
            />
          </label>
          <label title="Filter by service">
            <Filter />
            <select value={service} onChange={e => setService(e.target.value)}>
              <option value="All">All Services</option>
              {SERVICES.map(x => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <select value={status} onChange={e => setStatus(e.target.value)} title="Filter by status">
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>
          <select value={priority} onChange={e => setPriority(e.target.value)} title="Filter by priority">
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          <label className="ps-date-filter" title="Filter by date">
            <Calendar />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              placeholder="Filter date"
            />
          </label>
          <label className="ps-sort-select" title="Sort specifications">
            <ArrowUpDown />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="updated-desc">Updated (Newest)</option>
              <option value="created-desc">Created (Newest)</option>
              <option value="name-asc">Title (A–Z)</option>
              <option value="delivery-asc">Delivery (Earliest)</option>
              <option value="priority">Priority (High–Low)</option>
            </select>
          </label>
          <button
            onClick={() => {
              setSearch("");
              setService("All");
              setStatus("All");
              setPriority("All");
              setDateFilter("");
              setSortBy("updated-desc");
            }}
          >
            Clear
          </button>
        </div>

        <div className="ps-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Specification ID</th>
                <th>Project / ISBN</th>
                <th>Client</th>
                <th>Services Required</th>
                <th>Delivery Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(x => (
                <tr key={x.id}>
                  <td>
                    <b className="ps-id">{x.id}</b>
                    <small>Updated {new Date(x.updatedAt || x.createdAt).toLocaleDateString()}</small>
                  </td>
                  <td>
                    <b>{x.projectName}</b>
                    <small>
                      {x.projectId} · {x.isbn || "No ISBN"}
                    </small>
                  </td>
                  <td>{x.clientName}</td>
                  <td>
                    <div className="ps-chips">
                      {x.services?.slice(0, 2).map(s => (
                        <span key={s}>{s}</span>
                      ))}
                      {x.services?.length > 2 && <span>+{x.services.length - 2}</span>}
                    </div>
                  </td>
                  <td>{x.deliveryDate ? new Date(`${x.deliveryDate}T00:00:00`).toLocaleDateString() : "—"}</td>
                  <td>
                    <span className={`ps-priority ${x.priority?.toLowerCase()}`}>{x.priority}</span>
                  </td>
                  <td>
                    <span className={`ps-status ${x.status?.toLowerCase()}`}>{x.status}</span>
                  </td>
                  <td>
                    <div className="ps-actions">
                      <button title="View complete specification" onClick={() => setSelected(x)}>
                        <Eye />
                      </button>
                      <button title="Edit specification" onClick={() => setMode({ type: "edit", value: x })}>
                        <Edit3 />
                      </button>
                      <button className="danger" title="Delete specification" onClick={() => setConfirm(x)}>
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <div className="ps-empty">
              <FileText />
              <b>No project specifications found</b>
              <span>Try adjusting your search criteria or create a new project specification.</span>
            </div>
          )}
        </div>
        {filtered.length > 0 && (
          <Pagination
            currentPage={page}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            itemName="specifications"
          />
        )}
      </section>

      {mode && <SpecificationForm initial={mode.value} onClose={() => setMode(null)} onSave={save} />}
      {selected && (
        <SpecificationPreview
          item={selected}
          close={() => setSelected(null)}
          edit={() => {
            setMode({ type: "edit", value: selected });
            setSelected(null);
          }}
          note={note}
        />
      )}
      {confirm && <Confirm item={confirm} close={() => setConfirm(null)} remove={remove} />}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", options, required, placeholder }) {
  return (
    <label className={type === "area" ? "ps-wide" : ""}>
      <span>
        {label}
        {required && <em>*</em>}
      </span>
      {type === "area" ? (
        <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      ) : type === "yes" ? (
        <div className="ps-radio">
          {["Yes", "No"].map(x => (
            <button
              className={value === x ? "on" : ""}
              type="button"
              onClick={() => onChange(x)}
              key={x}
            >
              {x}
            </button>
          ))}
        </div>
      ) : type === "select" ? (
        <select value={value || ""} onChange={e => onChange(e.target.value)}>
          <option value="">Select option</option>
          {options.map(x => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function SpecificationForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(initial)));
  const [tab, setTab] = useState("project");
  const [error, setError] = useState("");
  const [selectedUploadCategory, setSelectedUploadCategory] = useState("Manuscript File");

  const set = (k, v) => setForm(x => ({ ...x, [k]: v }));
  const toggleService = s => {
    setForm(x => ({
      ...x,
      services: x.services.includes(s) ? x.services.filter(y => y !== s) : [...x.services, s]
    }));
  };

  const serviceTabs = form.services.map(s => serviceMap[s]).filter(Boolean);

  const finish = submit => {
    if (submit) {
      if (!form.projectId?.trim() || !form.projectName?.trim() || !form.clientName?.trim()) {
        setError("Please provide required fields: Project ID, Book/Project Title, and Client Name.");
        setTab("project");
        return;
      }
      if (!form.services?.length) {
        setError("Please select at least one required service from 'Services Required'.");
        setTab("project");
        return;
      }
    }
    setError("");
    onSave(form, submit);
  };

  const handleFileUpload = e => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;

    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const item = {
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          category: selectedUploadCategory,
          dataUrl: reader.result,
          uploadedAt: new Date().toISOString()
        };
        setForm(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), item]
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const downloadAttachment = att => {
    const link = document.createElement("a");
    link.download = att.name;
    link.href = att.dataUrl || `data:text/plain;charset=utf-8,${encodeURIComponent(`FileFlow Specification File: ${att.name}`)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewAttachment = att => {
    if (att.dataUrl && (att.type?.startsWith("image/") || att.type === "application/pdf")) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<title>${att.name}</title><body style="margin:0;background:#1e293b;display:grid;place-items:center;min-height:100vh;"><iframe src="${att.dataUrl}" style="width:100vw;height:100vh;border:0;"></iframe></body>`
        );
        return;
      }
    }
    alert(`File: ${att.name}\nCategory: ${att.category || "General"}\nSize: ${fmtSize(att.size)}\nType: ${att.type}`);
  };

  return (
    <div className="ps-overlay">
      <div className="ps-form-modal">
        <header>
          <div>
            <small>{form.id || "NEW SPECIFICATION"}</small>
            <h2>{form.id ? "Edit Project Specification" : "Create Project Specification"}</h2>
            <p>Define complete project information, then configure technical parameters for each selected service.</p>
          </div>
          <button onClick={onClose} aria-label="Close modal">
            <X />
          </button>
        </header>

        <nav>
          <button className={tab === "project" ? "on" : ""} onClick={() => setTab("project")}>
            1. Project Details
          </button>
          {serviceTabs.map((x, i) => (
            <button key={x} className={tab === x ? "on" : ""} onClick={() => setTab(x)}>
              {i + 2}. {labels[x].replace(" Specifications", "").replace(" / Typesetting", "")}
            </button>
          ))}
          <button className={tab === "delivery" ? "on" : ""} onClick={() => setTab("delivery")}>
            {serviceTabs.length + 2}. Delivery & Files
          </button>
        </nav>

        <main>
          {error && <div className="ps-error">{error}</div>}

          {tab === "project" && (
            <>
              <FormSection
                title="Project Information"
                sub="Core project identification, client, schedule and assignment details"
              >
                <Input
                  label="Project ID"
                  value={form.projectId}
                  onChange={v => set("projectId", v)}
                  placeholder="e.g. PRJ003 or auto-ID"
                  required
                />
                <Input
                  label="Project Name / Book Title"
                  value={form.projectName}
                  onChange={v => set("projectName", v)}
                  placeholder="e.g. Financial Accounting 12E"
                  required
                />
                <Input
                  label="Client Name"
                  value={form.clientName}
                  onChange={v => set("clientName", v)}
                  placeholder="e.g. Cengage Learning"
                  required
                />
                <Input
                  label="Author Name"
                  value={form.authorName}
                  onChange={v => set("authorName", v)}
                  placeholder="e.g. Dr. Robert Miles"
                />
                <Input
                  label="ISBN"
                  value={form.isbn}
                  onChange={v => set("isbn", v)}
                  placeholder="e.g. 9781119983412"
                />
                <Input
                  label="Project Type"
                  value={form.projectType}
                  onChange={v => set("projectType", v)}
                  placeholder="e.g. Book Production, Monograph, Digital Edition"
                />
                <Input
                  label="Assigned Team / Employee"
                  value={form.assignedTo}
                  onChange={v => set("assignedTo", v)}
                  placeholder="e.g. Farhana or Composition Team"
                />
                <Input
                  label="Priority"
                  type="select"
                  options={["Low", "Medium", "High", "Urgent"]}
                  value={form.priority}
                  onChange={v => set("priority", v)}
                />
                <Input
                  label="Start Date"
                  type="date"
                  value={form.startDate}
                  onChange={v => set("startDate", v)}
                />
                <Input
                  label="Expected Delivery Date"
                  type="date"
                  value={form.deliveryDate}
                  onChange={v => set("deliveryDate", v)}
                />
                <Input
                  label="Current Status"
                  type="select"
                  options={["Draft", "Submitted", "Completed", "Archived"]}
                  value={form.status}
                  onChange={v => set("status", v)}
                />
                <Input
                  label="Client Reference Number"
                  value={form.reference}
                  onChange={v => set("reference", v)}
                  placeholder="e.g. PO-88219"
                />
                <Input
                  label="General Project Description"
                  type="area"
                  value={form.description}
                  onChange={v => set("description", v)}
                  placeholder="Summary of project requirements and publishing scope..."
                />
              </FormSection>

              <FormSection
                title="Services Required *"
                sub="Selecting services dynamically displays detailed specification sections for each service"
              >
                <div className="ps-service-grid">
                  {SERVICES.map(s => (
                    <button
                      type="button"
                      className={form.services.includes(s) ? "on" : ""}
                      onClick={() => toggleService(s)}
                      key={s}
                    >
                      <span>{form.services.includes(s) && <Check />}</span>
                      {s}
                    </button>
                  ))}
                </div>
              </FormSection>
            </>
          )}

          {serviceTabs.includes(tab) && (
            <FormSection
              title={labels[tab]}
              sub="Fill confirmed technical parameters and requirements for this service"
            >
              {sectionFields[tab].map(([k, l, t, o]) => (
                <Input
                  key={k}
                  label={l}
                  type={t}
                  options={o}
                  value={form[tab]?.[k]}
                  onChange={v =>
                    setForm(x => ({
                      ...x,
                      [tab]: { ...(x[tab] || {}), [k]: v }
                    }))
                  }
                />
              ))}
            </FormSection>
          )}

          {tab === "delivery" && (
            <>
              <FormSection
                title="Additional Details & Delivery"
                sub="Record client instructions, internal team notes, revision limits and quality check notes"
              >
                <Input
                  label="Client Instructions"
                  type="area"
                  value={form.clientInstructions}
                  onChange={v => set("clientInstructions", v)}
                  placeholder="Specific client instructions, styling notes or guidelines..."
                />
                <Input
                  label="Internal Team Notes"
                  type="area"
                  value={form.internalNotes}
                  onChange={v => set("internalNotes", v)}
                  placeholder="Internal production guidance, preflight warnings, coordinator notes..."
                />
                <Input
                  label="Revision Instructions"
                  type="area"
                  value={form.revisionInstructions}
                  onChange={v => set("revisionInstructions", v)}
                  placeholder="Correction round turnaround expectations, marked PDF rules..."
                />
                <Input
                  label="Number of Revisions Allowed"
                  type="number"
                  value={form.revisions}
                  onChange={v => set("revisions", v)}
                  placeholder="e.g. 2"
                />
                <Input
                  label="Delivery Format"
                  value={form.deliveryFormat}
                  onChange={v => set("deliveryFormat", v)}
                  placeholder="e.g. Print-ready PDF, ePDF, EPUB package"
                />
                <Input
                  label="Final Output Files Required"
                  type="area"
                  value={form.finalOutputs}
                  onChange={v => set("finalOutputs", v)}
                  placeholder="Specific filenames, directory structures or archive formats required..."
                />
                <Input
                  label="Quality Check Notes"
                  type="area"
                  value={form.qualityNotes}
                  onChange={v => set("qualityNotes", v)}
                  placeholder="Preflight checklists, font licensing, bleed verification notes..."
                />
              </FormSection>

              <FormSection
                title="File Attachments"
                sub="Upload manuscript files, references, logos, cover assets, barcode files or printer templates"
              >
                <div className="ps-attachment-tools">
                  <label className="ps-category-select">
                    <span>Attachment Category:</span>
                    <select
                      value={selectedUploadCategory}
                      onChange={e => setSelectedUploadCategory(e.target.value)}
                    >
                      {ATTACHMENT_CATEGORIES.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="ps-upload">
                    <UploadCloud />
                    <b>Upload Supporting Files ({selectedUploadCategory})</b>
                    <span>Multiple files supported: DOCX, PDF, INDD, ZIP, JPG, PNG, AI, PSD</span>
                    <input type="file" multiple onChange={handleFileUpload} />
                  </label>
                </div>

                <div className="ps-file-list">
                  {form.attachments?.map((f, i) => (
                    <div key={`${f.name}-${i}`}>
                      <Paperclip />
                      <span>
                        <b>{f.name}</b>
                        <small>
                          {f.category || "General File"} · {fmtSize(f.size)}
                        </small>
                      </span>
                      <div className="ps-file-actions">
                        <button
                          type="button"
                          title="View"
                          onClick={() => viewAttachment(f)}
                          className="ps-file-btn"
                        >
                          <Eye />
                        </button>
                        <button
                          type="button"
                          title="Download"
                          onClick={() => downloadAttachment(f)}
                          className="ps-file-btn"
                        >
                          <Download />
                        </button>
                        <button
                          type="button"
                          title="Remove"
                          onClick={() =>
                            set(
                              "attachments",
                              form.attachments.filter((_, j) => i !== j)
                            )
                          }
                          className="ps-file-remove"
                        >
                          <X />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!form.attachments?.length && (
                    <div className="ps-empty-inline">No files attached yet. Select category and upload files above.</div>
                  )}
                </div>
              </FormSection>
            </>
          )}
        </main>

        <footer>
          <button className="ps-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="ps-secondary" onClick={() => finish(false)}>
            <Download /> Save Draft
          </button>
          <button className="ps-primary" onClick={() => finish(true)}>
            <Check /> Submit Specification
          </button>
        </footer>
      </div>
    </div>
  );
}

function FormSection({ title, sub, children }) {
  return (
    <section className="ps-form-section">
      <div className="ps-section-title">
        <h3>{title}</h3>
        <p>{sub}</p>
      </div>
      <div className="ps-form-grid">{children}</div>
    </section>
  );
}

function SpecificationPreview({ item, close, edit, note }) {
  const printable = () => window.print();

  const downloadSummary = () => {
    let text = `======================================================\n`;
    text += `FILEFLOW PUBLISHING - PROJECT SPECIFICATION SUMMARY\n`;
    text += `======================================================\n\n`;
    text += `Specification ID : ${item.id}\n`;
    text += `Project ID       : ${item.projectId}\n`;
    text += `Project Name     : ${item.projectName}\n`;
    text += `Client Name      : ${item.clientName}\n`;
    text += `Author Name      : ${item.authorName || "—"}\n`;
    text += `ISBN             : ${item.isbn || "—"}\n`;
    text += `Project Type     : ${item.projectType || "—"}\n`;
    text += `Assigned To      : ${item.assignedTo || "—"}\n`;
    text += `Priority         : ${item.priority}\n`;
    text += `Status           : ${item.status}\n`;
    text += `Start Date       : ${item.startDate || "—"}\n`;
    text += `Delivery Date    : ${item.deliveryDate || "—"}\n`;
    text += `Client Reference : ${item.reference || "—"}\n`;
    text += `Description      : ${item.description || "—"}\n\n`;
    text += `SERVICES REQUIRED:\n- ${item.services.join("\n- ")}\n\n`;

    item.services.forEach(s => {
      const k = serviceMap[s];
      if (k && item[k]) {
        text += `------------------------------------------------------\n`;
        text += `${labels[k].toUpperCase()}\n`;
        text += `------------------------------------------------------\n`;
        (sectionFields[k] || []).forEach(([key, label]) => {
          const val = item[k]?.[key];
          if (val !== undefined && val !== null && val !== "") {
            text += `${label.padEnd(30, " ")}: ${val}\n`;
          }
        });
        text += `\n`;
      }
    });

    text += `------------------------------------------------------\n`;
    text += `INSTRUCTIONS & DELIVERY DETAILS\n`;
    text += `------------------------------------------------------\n`;
    text += `Client Instructions  : ${item.clientInstructions || "—"}\n`;
    text += `Internal Team Notes  : ${item.internalNotes || "—"}\n`;
    text += `Revision Guidelines  : ${item.revisionInstructions || "—"}\n`;
    text += `Revisions Allowed    : ${item.revisions || "—"}\n`;
    text += `Delivery Format      : ${item.deliveryFormat || "—"}\n`;
    text += `Final Output Files   : ${item.finalOutputs || "—"}\n`;
    text += `Quality Check Notes  : ${item.qualityNotes || "—"}\n\n`;

    if (item.attachments?.length) {
      text += `ATTACHMENTS (${item.attachments.length}):\n`;
      item.attachments.forEach((a, i) => {
        text += `${i + 1}. [${a.category || "General"}] ${a.name} (${fmtSize(a.size)})\n`;
      });
      text += `\n`;
    }

    text += `Audit Record:\nCreated: ${item.createdAt} by ${item.createdBy}\nUpdated: ${item.updatedAt} by ${item.updatedBy}\n`;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.download = `${item.projectId || item.id}_Specification_Summary.txt`;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    note?.("Specification summary downloaded");
  };

  const downloadAttachment = att => {
    const link = document.createElement("a");
    link.download = att.name;
    link.href = att.dataUrl || `data:text/plain;charset=utf-8,${encodeURIComponent(`FileFlow Specification File: ${att.name}`)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewAttachment = att => {
    if (att.dataUrl && (att.type?.startsWith("image/") || att.type === "application/pdf")) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<title>${att.name}</title><body style="margin:0;background:#1e293b;display:grid;place-items:center;min-height:100vh;"><iframe src="${att.dataUrl}" style="width:100vw;height:100vh;border:0;"></iframe></body>`
        );
        return;
      }
    }
    alert(`File: ${att.name}\nCategory: ${att.category || "General"}\nSize: ${fmtSize(att.size)}\nType: ${att.type}`);
  };

  return (
    <div className="ps-overlay">
      <article className="ps-preview">
        <header>
          <div>
            <small>PROJECT SPECIFICATION</small>
            <h2>{item.projectName}</h2>
            <p>
              {item.id} · {item.projectId} · {item.clientName}
            </p>
          </div>
          <div>
            <button onClick={printable} title="Print specification summary">
              <Printer /> Print
            </button>
            <button onClick={downloadSummary} title="Download text summary">
              <FileDown /> Download Summary
            </button>
            <button onClick={edit} title="Edit specification">
              <Edit3 /> Edit
            </button>
            <button className="icon" onClick={close} aria-label="Close preview">
              <X />
            </button>
          </div>
        </header>

        <main>
          <section className="ps-preview-banner">
            <div>
              <span>Client Name</span>
              <b>{item.clientName}</b>
            </div>
            <div>
              <span>ISBN</span>
              <b>{item.isbn || "—"}</b>
            </div>
            <div>
              <span>Delivery Date</span>
              <b>{item.deliveryDate || "—"}</b>
            </div>
            <div>
              <span>Current Status</span>
              <b className={`ps-status ${item.status?.toLowerCase()}`}>{item.status}</b>
            </div>
          </section>

          <PreviewSection
            title="Project Overview"
            data={{
              "Author Name": item.authorName,
              "Project Type": item.projectType,
              "Assigned Team / Employee": item.assignedTo,
              Priority: item.priority,
              "Start Date": item.startDate,
              "Client Reference": item.reference,
              "General Description": item.description
            }}
          />

          <div className="ps-preview-services">
            <h3>Services Required</h3>
            <div className="ps-chips">
              {item.services.map(s => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>

          {item.services.map(s => {
            const k = serviceMap[s];
            return (
              k && (
                <PreviewSection
                  key={s}
                  title={labels[k]}
                  data={Object.fromEntries(
                    (sectionFields[k] || []).map(([key, label]) => [label, item[k]?.[key]])
                  )}
                />
              )
            );
          })}

          <PreviewSection
            title="Additional Details & Delivery"
            data={{
              "Client Instructions": item.clientInstructions,
              "Internal Team Notes": item.internalNotes,
              "Revision Instructions": item.revisionInstructions,
              "Revisions Allowed": item.revisions,
              "Delivery Format": item.deliveryFormat,
              "Final Output Files": item.finalOutputs,
              "Quality Check Notes": item.qualityNotes
            }}
          />

          {item.attachments?.length > 0 && (
            <section className="ps-preview-files">
              <h3>File Attachments ({item.attachments.length})</h3>
              {item.attachments.map((f, i) => (
                <div key={i}>
                  <Paperclip />
                  <b>{f.name}</b>
                  <span className="ps-tag">{f.category || "General"}</span>
                  <span className="ps-file-size">{fmtSize(f.size)}</span>
                  <div className="ps-preview-file-actions">
                    <button onClick={() => viewAttachment(f)} title="View file">
                      <Eye /> View
                    </button>
                    <button onClick={() => downloadAttachment(f)} title="Download file">
                      <Download /> Download
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          <footer>
            Created by {item.createdBy || "—"} on{" "}
            {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"} · Last updated by{" "}
            {item.updatedBy || "—"} on {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "—"}
          </footer>
        </main>
      </article>
    </div>
  );
}

function PreviewSection({ title, data }) {
  const rows = Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!rows.length) return null;
  return (
    <section className="ps-preview-section">
      <h3>{title}</h3>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Confirm({ item, close, remove }) {
  return (
    <div className="ps-overlay">
      <div className="ps-confirm">
        <i>
          <Trash2 />
        </i>
        <h2>Delete Project Specification?</h2>
        <p>
          <b>{item.id}</b> for <b>{item.projectName}</b> will be permanently removed.
        </p>
        <div>
          <button onClick={close}>Cancel</button>
          <button className="danger" onClick={remove}>
            Delete Specification
          </button>
        </div>
      </div>
    </div>
  );
}
