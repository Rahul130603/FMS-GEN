import { useEffect, useState } from "react";
import PeterLangMaster from "./PeterLangMaster";
import "./client-projects.css";

function readClients() {
  try { const rows = JSON.parse(localStorage.getItem("fileflow_clients_list") || "[]"); return Array.isArray(rows) ? rows : []; } catch { return []; }
}
export default function ClientProjects({ note, onOpenClients }) {
  const [clients, setClients] = useState(readClients);
  const [selected, setSelected] = useState("");
  useEffect(() => {
    const refresh = () => setClients(readClients());
    window.addEventListener("storage", refresh);
    window.addEventListener("fileflowClientsUpdated", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("fileflowClientsUpdated", refresh); };
  }, []);
  const client = clients.find(item => item.id === selected) || clients[0];
  return <div className="client-projects">
    <header className="head"><div><small>PROJECT MANAGEMENT</small><h1>Client projects</h1><p>Client details and project records from the client master sheet.</p></div>
      <label>Client<select value={client?.id || ""} onChange={event => setSelected(event.target.value)} aria-label="Select project client">
        {!clients.length && <option value="">No clients available</option>}{clients.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select></label>
    </header>
    {!client ? <section className="panel"><p>Add a client in Clients to view its projects here.</p><button className="primary" onClick={onOpenClients}>Open Clients</button></section> : <>
      <section className="panel client-project-info">
        <header><div><small>{client.code || client.id}</small><h2>{client.name}</h2><p>{client.subtitle}</p></div>{client.status && <span className="badge">{client.status}</span>}</header>
        <dl>{[["Client ID", client.id], ["Industry", client.industry], ["Location", client.location], ["Contact person", client.contactPerson], ["Email", client.email], ["Titles", client.titlesCount], ["Production stages", client.stagesCount], ["Master file", client.masterFileName], ["Uploaded on", client.uploadedDate]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not provided"}</dd></div>)}</dl>
      </section>
      <PeterLangMaster key={client.id} client={client} projectView note={note} />
    </>}
  </div>;
}
