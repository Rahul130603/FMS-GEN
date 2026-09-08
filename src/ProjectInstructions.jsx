import {useMemo,useState,useEffect} from "react";
import {Archive,CheckCircle2,ChevronLeft,Download,Edit3,Eye,FileText,Filter,Plus,RefreshCw,Search,Trash2,X} from "lucide-react";
import "./project-instructions.css";
import Pagination from "./Pagination";
import "./pagination.css";

const seed=[
 {id:"INS-0156",description:"Hi Logistics Team, please follow the attached Peter Lang production workflow for all incoming ISBN folders.",project:"Peter Lang Master Production",projectId:"PETER-LANG",isbn:"9783631552988",client:"Peter Lang",file:"PeterLang_Logistics_Instructions.pdf",postedBy:"Agasthidevi",createdAt:"2026-08-11T10:12:26",status:"Active",priority:"High",department:"Logistics"},
 {id:"INS-0155",description:"Hi Team, please process POD and ePDF outputs according to the project specification and naming convention.",project:"Peter Lang POD and ePDF",projectId:"PETER-LANG",isbn:"9783631323755",client:"Peter Lang",file:"POD_ePDF_Specification.xlsx",postedBy:"Agasthidevi",createdAt:"2026-08-11T10:09:01",status:"Active",priority:"Normal",department:"Production"},
 {id:"INS-0154",description:"20260808 Hi Team, cover and text files must be maintained separately. Validate ISBN before upload.",project:"Peter Lang Digital Conversion",projectId:"PETER-LANG",isbn:"9783261002372",client:"Peter Lang",file:"",postedBy:"Agasthidevi",createdAt:"2026-08-08T10:06:19",status:"Completed",priority:"Normal",department:"Digital"},
 {id:"INS-0153",description:"20260807 Hi Team, complete image QC before starting the final combined PDF process.",project:"Peter Lang Image QC",projectId:"PETER-LANG",isbn:"9783631371862",client:"Peter Lang",file:"Image_QC_Checklist.pdf",postedBy:"Agasthidevi",createdAt:"2026-08-07T08:41:42",status:"Active",priority:"High",department:"Graphics"},
 {id:"INS-0152",description:"BPA Process Request: verify metadata, web optimized PDF and archive deliverables for each ISBN.",project:"Peter Lang BPA",projectId:"PETER-LANG",isbn:"9783631548219",client:"Peter Lang",file:"BPA_Process_Request.docx",postedBy:"Agasthidevi",createdAt:"2026-08-05T19:52:13",status:"Draft",priority:"Normal",department:"ePDF"}
];
const key="fileflow-project-instructions";
const load=()=>[];
export default function ProjectInstructions({ user, note, back }) {
  const [items, setItems] = useState(load);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(null);
  const [edit, setEdit] = useState(null);
  const [create, setCreate] = useState(false);

  const rows = useMemo(
    () => items.filter(x => !search || Object.values(x).join(" ").toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const persist = next => {
    setItems(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  const remove = id => {
    persist(items.filter(x => x.id !== id));
    note?.("Instruction deleted");
  };

  const save = form => {
    const next = form.id
      ? items.map(x => (x.id === form.id ? form : x))
      : [{ ...form, id: `INS-${Date.now()}`, postedBy: user?.name || "Admin", createdAt: new Date().toISOString(), status: "Active" }, ...items];
    persist(next);
    setCreate(false);
    setEdit(null);
    note?.("Project instruction saved");
  };

  const counts = s => items.filter(x => x.status === s).length;

  return (
    <div className="pi">
      <button className="pi-back" onClick={back}>
        <ChevronLeft /> Back to Customer Support
      </button>
      <header>
        <div>
          <small>Publishing Operations / Project Instruction</small>
          <h1>Project Instruction</h1>
          <p>Create, manage and track complete project instructions in one place.</p>
        </div>
        <button onClick={() => setCreate(true)}>
          <Plus /> New Instruction
        </button>
      </header>
      <section className="pi-panel">
        <div className="pi-summary">
          {[
            [FileText, "Total Instructions", items.length],
            [CheckCircle2, "Active", counts("Active")],
            [Edit3, "Draft", counts("Draft")],
            [CheckCircle2, "Completed", counts("Completed")],
            [Archive, "Archived", counts("Archived")]
          ].map(([I, x, n]) => (
            <article key={x}>
              <I />
              <span>
                {x}
                <b>{n}</b>
              </span>
            </article>
          ))}
          <button onClick={() => note?.("Instruction export prepared")}>
            <Download /> Export
          </button>
          <button onClick={() => setItems(load())}>
            <RefreshCw />
          </button>
        </div>
        <div className="pi-table">
          <table>
            <thead>
              <tr>
                <th>Project Description</th>
                <th>Project / ISBN</th>
                <th>Upload File Name</th>
                <th>Post By</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
              <tr className="filters">
                <th>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search description..." />
                </th>
                <th><input placeholder="Search project..." readOnly /></th>
                <th><input placeholder="Search file name..." readOnly /></th>
                <th><input placeholder="Search user..." readOnly /></th>
                <th><input type="date" readOnly /></th>
                <th />
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No project instructions found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map(x => (
                  <tr key={x.id}>
                    <td>
                      <button className="description" onClick={() => setSelected(x)}>
                        {x.description}
                      </button>
                    </td>
                    <td>
                      <b>{x.project}</b>
                      <small>{x.projectId} · {x.isbn}</small>
                    </td>
                    <td>{x.file || "—"}</td>
                    <td>{x.postedBy}</td>
                    <td>{new Date(x.createdAt).toLocaleString()}</td>
                    <td>
                      <div>
                        <button className="delete" onClick={() => remove(x.id)} title="Delete instruction">
                          <Trash2 />
                        </button>
                        <button className="edit" onClick={() => setEdit(x)} title="Edit instruction">
                          <Edit3 />
                        </button>
                        <button className="view" onClick={() => setSelected(x)} title="View instruction">
                          <Eye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
            itemName="instructions"
          />
        )}
      </section>
      {selected && <InstructionDetail item={selected} close={() => setSelected(null)} />}
      {(create || edit) && (
        <InstructionForm
          value={edit}
          close={() => {
            setCreate(false);
            setEdit(null);
          }}
          save={save}
        />
      )}
    </div>
  );
}
function InstructionDetail({item,close}){return <div className="pi-modal-bg"><section className="pi-detail"><header><div><small>{item.id} · {item.status}</small><h2>{item.project}</h2><p>{item.client} · {item.projectId} · ISBN {item.isbn}</p></div><button onClick={close}><X/></button></header><dl>{[["Instruction",item.description],["Department",item.department],["Priority",item.priority],["Posted by",item.postedBy],["Created date",new Date(item.createdAt).toLocaleString()],["Attachment",item.file||"No attachment"]].map(([x,v])=><div className={x==="Instruction"?"wide":""} key={x}><dt>{x}</dt><dd>{v}</dd></div>)}</dl></section></div>}
function InstructionForm({value,close,save}){const[form,setForm]=useState(value||{description:"",project:"",projectId:"PETER-LANG",isbn:"",client:"Peter Lang",file:"",priority:"Normal",department:"Production"});const change=e=>setForm(x=>({...x,[e.target.name]:e.target.value}));return <div className="pi-modal-bg"><form className="pi-form" onSubmit={e=>{e.preventDefault();save(form)}}><header><h2>{value?"Edit":"New"} Project Instruction</h2><button type="button" onClick={close}><X/></button></header><div><label>Project name<input name="project" value={form.project} onChange={change} required/></label><label>Project ID<input name="projectId" value={form.projectId} onChange={change} required/></label><label>ISBN<input name="isbn" value={form.isbn} onChange={change} required/></label><label>Client<input name="client" value={form.client} onChange={change}/></label><label>Department<input name="department" value={form.department} onChange={change}/></label><label>Priority<select name="priority" value={form.priority} onChange={change}><option>Normal</option><option>High</option><option>Urgent</option></select></label><label className="wide">Project instruction<textarea name="description" value={form.description} onChange={change} required/></label><label className="wide">Upload file<input type="file" onChange={e=>setForm(x=>({...x,file:e.target.files?.[0]?.name||""}))}/></label></div><footer><button type="button" onClick={close}>Cancel</button><button>Save Instruction</button></footer></form></div>}
