import {useEffect,useMemo,useState} from "react";
import {CheckCircle2,ClipboardCheck,Eye,Headphones,MessageSquareText,Plus,RefreshCcw,Search,ShieldCheck,X} from "lucide-react";
import "./customer-support.css";
import ProjectInstructions from "./ProjectInstructions";
import ProjectSpecifications from "./ProjectSpecifications";
import Pagination from "./Pagination";
import "./pagination.css";

const initialQueries=[
 {id:"QRY-2026-0045",isbn:"9781394472567",project:"Key Concepts in Economics U3",projectId:"PRJ002",client:"John Wiley",type:"Technical Query",priority:"High",assignedTo:"Ashwin G",employeeId:"EMP001",createdAt:"2026-08-31T15:20:00",status:"Open",subject:"Client marked PDF does not match source",description:"Please confirm which marked PDF should be followed for chapter C03.",remarks:"Waiting for production confirmation."},
 {id:"QRY-2026-0044",isbn:"9781119983412",project:"Financial Accounting 12E",projectId:"PRJ003",client:"Cengage Learning",type:"Project Inspection",priority:"Medium",assignedTo:"Farhana",employeeId:"EMP008",createdAt:"2026-08-31T14:45:00",status:"In Progress",subject:"Project quality review",description:"Review typography and chapter consistency before delivery.",remarks:"Inspection started."},
 {id:"QRY-2026-0043",isbn:"9780198876542",project:"Digital Marketing 4E",projectId:"PRJ005",client:"Oxford University Press",type:"Project Specification",priority:"Low",assignedTo:"Arun Kumar",employeeId:"EMP012",createdAt:"2026-08-31T13:30:00",status:"Awaiting Client",subject:"Project specification required",description:"Record the POD, ePDF, eBook and cover design production requirements.",remarks:"Specification requested from client."},
 {id:"QRY-2026-0042",isbn:"9783631363164",project:"Peterlang Production",projectId:"Ptlng0007",client:"Peterlang",type:"Technical Query",priority:"High",assignedTo:"Ashwin G",employeeId:"EMP001",createdAt:"2026-08-31T11:05:00",status:"In Progress",subject:"Missing image reference",description:"Image reference is missing in the received correction file.",remarks:"Checking with project admin."},
 {id:"QRY-2026-0041",isbn:"9780137654218",project:"Introduction to Psychology 8E",projectId:"PRJ004",client:"Pearson",type:"Project Inspection",priority:"Medium",assignedTo:"A. Kevin",employeeId:"EMP003",createdAt:"2026-08-31T10:15:00",status:"Resolved",subject:"Final QC inspection",description:"Project inspection completed after correction round.",remarks:"Approved and resolved."}
];
const storageKey="fileflow-customer-support";
const statusClass=x=>`support-status support-${x.toLowerCase().replaceAll(" ","-")}`;
const load=()=>[];

export default function CustomerSupport({user,note}){const[queries,setQueries]=useState(load),[search,setSearch]=useState(""),[type,setType]=useState("All"),[status,setStatus]=useState("All"),[selected,setSelected]=useState(null),[editing,setEditing]=useState(null),[create,setCreate]=useState(false),[instructionView,setInstructionView]=useState(false),[specificationView,setSpecificationView]=useState(false);const employee=user.role==="Employee";
 useEffect(()=>localStorage.setItem(storageKey,JSON.stringify(queries)),[queries]);useEffect(()=>{const sync=()=>setQueries(load());window.addEventListener("storage",sync);const timer=setInterval(sync,3000);return()=>{window.removeEventListener("storage",sync);clearInterval(timer)}},[]);
 useEffect(()=>{if(type==="Project Inspection"){setInstructionView(true);setType("All")}else if(type==="Project Specification"){setSpecificationView(true);setType("All")}},[type]);
 const visible=useMemo(()=>queries.filter(x=>!employee||x.employeeId==="EMP001"||x.assignedTo===user.name).filter(x=>type==="All"||x.type===type).filter(x=>status==="All"||x.status===status).filter(x=>!search||Object.values(x).join(" ").toLowerCase().includes(search.toLowerCase())),[queries,employee,user,search,type,status]);
 const[page,setPage]=useState(1),[pageSize,setPageSize]=useState(10);
 const paginatedVisible = useMemo(()=>visible.slice((page-1)*pageSize, page*pageSize), [visible, page, pageSize]);
  const saveQuery=data=>{
    const number=Math.max(45,...queries.map(x=>Number(x.id.slice(-4))))+1;
    const record={...data,id:`QRY-2026-${String(number).padStart(4,"0")}`,createdAt:new Date().toISOString(),status:"Open",assignedTo:employee?user.name:data.assignedTo||"Unassigned",employeeId:employee?user.empId||user.username||"EMP001":data.employeeId||""};
    setQueries(x=>[record,...x]);
    setCreate(false);
    const notif = {
      id: `NOTIF-${Date.now()}`,
      title: `Client Query: ${record.subject || record.type}`,
      type: "query",
      category: "Client Query",
      status: "Query",
      isbn: record.isbn || "",
      projectId: record.projectId || "PRJ",
      projectName: record.project || `Project ${record.projectId || ""}`,
      employeeId: record.employeeId,
      employeeName: record.assignedTo,
      client: record.client || "",
      reason: `Client query raised: "${record.subject}". Type: ${record.type}, Priority: ${record.priority}. Description: ${record.description}`,
      remarks: record.remarks || record.description || "",
      createdAt: Date.now(),
      read: false,
      section: "Notifications"
    };
    try {
      const savedNotifs = JSON.parse(localStorage.getItem("fileflow_notifications") || "[]");
      localStorage.setItem("fileflow_notifications", JSON.stringify([notif, ...savedNotifs]));
      window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
      fetch("/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-FileFlow-Token": "fileflow-secret-token-2026" },
        body: JSON.stringify(notif)
      }).catch(() => {});
    } catch {}
    note?.(`${record.id} submitted successfully and sent to admin`);
  };
  const updateQuery=data=>{
    setQueries(x=>x.map(q=>q.id===data.id?{...q,...data}:q));
    setEditing(null);
    const notif = {
      id: `NOTIF-${Date.now()}`,
      title: `Query Updated: ${data.id}`,
      type: "query",
      category: "Client Query",
      status: data.status || "Query",
      isbn: data.isbn || "",
      projectId: data.projectId || "PRJ",
      projectName: data.project || `Project ${data.projectId || ""}`,
      employeeId: employee ? user.empId || user.username || "EMP" : data.employeeId || "EMP",
      employeeName: employee ? user.name : data.assignedTo || "Employee",
      reason: `Query ${data.id} status is now "${data.status}". Remarks: ${data.remarks || data.description || ""}`,
      remarks: data.remarks || data.description || "",
      createdAt: Date.now(),
      read: false,
      section: "Notifications"
    };
    try {
      const savedNotifs = JSON.parse(localStorage.getItem("fileflow_notifications") || "[]");
      localStorage.setItem("fileflow_notifications", JSON.stringify([notif, ...savedNotifs]));
      window.dispatchEvent(new Event("fileflowNotificationsUpdated"));
      fetch("/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-FileFlow-Token": "fileflow-secret-token-2026" },
        body: JSON.stringify(notif)
      }).catch(() => {});
    } catch {}
    note?.(`${data.id} updated successfully`);
  };
 const count=(t,s)=>queries.filter(x=>(!t||x.type===t)&&(!s||x.status===s)).length;if(instructionView)return <ProjectInstructions user={user} note={note} back={()=>setInstructionView(false)}/>;if(specificationView)return <ProjectSpecifications user={user} note={note} back={()=>setSpecificationView(false)}/>;
 return <><div className="support-head"><div><small>CUSTOMER COMMUNICATION</small><h1>Customer Support</h1><p>Track, review and resolve customer requests received from employees and clients.</p></div><button className="primary" onClick={()=>setCreate(true)}><Plus/>{employee?"Raise query":"New query"}</button></div><div className="support-category-cards"><article><i className="technical"><Headphones/></i><div><h3>Technical Query</h3><p>Resolve product, file and workflow issues.</p></div><dl><span><small>Open</small><b>{count("Technical Query","Open")}</b></span><span><small>In progress</small><b>{count("Technical Query","In Progress")}</b></span></dl><button onClick={()=>setType("Technical Query")}>View queries</button></article><article><i className="project"><ClipboardCheck/></i><div><h3>Project Inspection</h3><p>Review project quality and production requirements.</p></div><dl><span><small>Pending</small><b>{count("Project Inspection","Open")}</b></span><span><small>Scheduled</small><b>{count("Project Inspection","In Progress")}</b></span></dl><button onClick={()=>setType("Project Inspection")}>Start review</button></article><article><i className="client"><ShieldCheck/></i><div><h3>Project Specification</h3><p>Record and manage complete project production specifications.</p></div><dl><span><small>Awaiting client</small><b>{count("Project Specification","Awaiting Client")}</b></span><span><small>Approved</small><b>{count("Project Specification","Resolved")}</b></span></dl><button onClick={()=>setSpecificationView(true)}>View specifications</button></article></div><div className="support-summary">{[[MessageSquareText,"Total queries",queries.length],[RefreshCcw,"Open",count(null,"Open")],[RefreshCcw,"In progress",count(null,"In Progress")],[CheckCircle2,"Resolved",count(null,"Resolved")]].map(([I,x,n])=><article key={x}><i><I/></i><span><small>{x}</small><b>{n}</b></span></article>)}</div><section className="panel support-table"><div className="support-table-title"><div><h3>{employee?"My customer queries":"Recent customer queries"}</h3><p>{employee?"Queries raised by or allocated to your employee account.":"Queries received from employee dashboards and client communication."}</p></div></div><div className="support-filters"><label><Search/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search Query ID, ISBN, client or employee"/></label><select value={type} onChange={e=>{setType(e.target.value);setPage(1);}}><option>All</option><option>Technical Query</option><option>Project Inspection</option><option>Project Specification</option></select><select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option>All</option><option>Open</option><option>In Progress</option><option>Awaiting Client</option><option>Resolved</option><option>Rejected</option></select><button className="secondary" onClick={()=>{setSearch("");setType("All");setStatus("All");setPage(1);}}>Clear</button></div><div className="scroll"><table><thead><tr><th>Query ID</th><th>ISBN / Project</th><th>Client</th><th>Query type</th><th>Priority</th><th>Assigned to</th><th>Created date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{paginatedVisible.map(q=><tr key={q.id}><td><b>{q.id}</b></td><td><b>{q.isbn}</b><small>{q.projectId} · {q.project}</small></td><td>{q.client}</td><td><span className={`support-type ${q.type.toLowerCase().replaceAll(" ","-")}`}>{q.type}</span></td><td><span className={`support-priority ${q.priority.toLowerCase()}`}>{q.priority}</span></td><td><b>{q.assignedTo}</b><small>{q.employeeId||"Not assigned"}</small></td><td>{new Date(q.createdAt).toLocaleString()}</td><td><span className={statusClass(q.status)}>{q.status}</span></td><td><div className="support-actions"><button onClick={()=>setSelected(q)}><Eye/>View</button><button onClick={()=>setEditing(q)}>Update</button></div></td></tr>)}</tbody></table>{!visible.length&&<div className="support-empty"><MessageSquareText/><b>No customer queries found</b><span>Raise a query or change the filters.</span></div>}</div>{visible.length>0&&<Pagination currentPage={page} totalItems={visible.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} pageSizeOptions={[5, 10, 20, 50]} itemName="queries"/>}</section>{create&&<QueryForm employee={employee} user={user} close={()=>setCreate(false)} save={saveQuery}/>} {editing&&<QueryForm employee={employee} user={user} value={editing} close={()=>setEditing(null)} save={updateQuery}/>} {selected&&<QueryDetails query={selected} close={()=>setSelected(null)}/>}</>}

function QueryForm({employee,user,value,close,save}){const[form,setForm]=useState(value||{isbn:"",project:"",projectId:"",client:"",type:"Technical Query",priority:"Medium",assignedTo:employee?user.name:"Ashwin G",employeeId:employee?"EMP001":"EMP001",subject:"",description:"",remarks:"",status:"Open"});const change=e=>setForm(x=>({...x,[e.target.name]:e.target.value}));return <div className="support-modal-bg"><form className="support-modal" onSubmit={e=>{e.preventDefault();save(form)}}><header><div><h2>{value?"Update customer query":"Create customer query"}</h2><p>{employee?"This query will appear immediately on the admin dashboard.":"Enter the request and allocation details."}</p></div><button type="button" onClick={close}><X/></button></header><div className="support-form-grid"><label>ISBN<input name="isbn" value={form.isbn} onChange={change} required/></label><label>Project ID<input name="projectId" value={form.projectId} onChange={change} required/></label><label>Project name<input name="project" value={form.project} onChange={change} required/></label><label>Client<input name="client" value={form.client} onChange={change} required/></label><label>Query type<select name="type" value={form.type} onChange={change}><option>Technical Query</option><option>Project Inspection</option><option>Project Specification</option></select></label><label>Priority<select name="priority" value={form.priority} onChange={change}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label><label>Assigned employee<input name="assignedTo" value={form.assignedTo} onChange={change}/></label>{value&&<label>Status<select name="status" value={form.status} onChange={change}><option>Open</option><option>In Progress</option><option>Awaiting Client</option><option>Resolved</option><option>Rejected</option></select></label>}<label className="wide">Subject<input name="subject" value={form.subject} onChange={change} required/></label><label className="wide">Query description<textarea name="description" value={form.description} onChange={change} required/></label><label className="wide">Remarks<textarea name="remarks" value={form.remarks} onChange={change} placeholder="Add employee/client remarks"/></label></div><footer><button type="button" className="secondary" onClick={close}>Cancel</button><button className="primary">{value?"Save update":"Submit query"}</button></footer></form></div>}
function QueryDetails({query,close}){return <div className="support-modal-bg"><section className="support-modal support-details"><header><div><small>{query.id}</small><h2>{query.subject}</h2><p>{query.isbn} · {query.project}</p></div><button onClick={close}><X/></button></header><div className="support-detail-grid">{[["Client",query.client],["Project ID",query.projectId],["Query type",query.type],["Priority",query.priority],["Assigned to",`${query.employeeId} · ${query.assignedTo}`],["Created",new Date(query.createdAt).toLocaleString()],["Status",query.status],["Description",query.description],["Remarks",query.remarks||"No remarks"]].map(([x,v])=><div key={x} className={x==="Description"||x==="Remarks"?"wide":""}><small>{x}</small><b>{v}</b></div>)}</div></section></div>}
