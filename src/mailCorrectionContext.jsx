import { createContext, useContext, useEffect, useMemo, useState } from "react";

const MailCorrectionContext = createContext(null);

export function MailCorrectionProvider({ children }) {
  const [corrections, setCorrections] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([
    ["PRJ001", "Exploring Management 2E", "9781394415106", "John Wiley"],
    ["PRJ002", "Key Concepts in Economics U3", "9781394472567", "John Wiley"],
    ["PRJ003", "Financial Accounting 12E", "9781119983412", "Cengage Learning"],
    ["PRJ004", "Introduction to Psychology 8E", "9780137654218", "Pearson"],
    ["PRJ005", "Digital Marketing 4E", "9780198876542", "Oxford University Press"]
  ]);

  const loadData = async () => {
    try {
      const [corrRes, empRes] = await Promise.all([
        fetch("/api/mail-corrections").catch(() => null),
        fetch("/api/employees").catch(() => null)
      ]);
      if (corrRes && corrRes.ok) {
        const data = await corrRes.json();
        if (Array.isArray(data.items)) {
          setCorrections(data.items);
        }
      }
      if (empRes && empRes.ok) {
        const empData = await empRes.json();
        if (Array.isArray(empData.items)) {
          setEmployees(empData.items.map(e => [e.giEmpId || e.empId, e.name]));
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const addActivity = (record, text) => ({
    ...record,
    activity: [
      ...(record.activity || []),
      { at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), text }
    ]
  });

  const createCorrection = async (data) => {
    try {
      const res = await fetch("/api/mail-corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.ok && json.item) {
        setCorrections(prev => [json.item, ...prev]);
        return json.item.id;
      }
    } catch {}
    return null;
  };

  const updateStatus = async (id, status, extra = {}) => {
    try {
      await fetch(`/api/mail-corrections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra })
      });
      setCorrections(x =>
        x.map(r => (r.id === id ? addActivity({ ...r, ...extra, status }, `Status changed to ${status}`) : r))
      );
    } catch {}
  };

  const updateCorrection = async (id, patch, text = "Correction updated") => {
    try {
      await fetch(`/api/mail-corrections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      setCorrections(x =>
        x.map(r => (r.id === id ? addActivity({ ...r, ...patch }, text) : r))
      );
    } catch {}
  };

  const removeCorrection = async (id) => {
    try {
      await fetch(`/api/mail-corrections/${id}`, { method: "DELETE" });
      setCorrections(x => x.filter(r => r.id !== id));
    } catch {}
  };

  const resetCorrections = () => {
    loadData();
  };

  const value = useMemo(
    () => ({
      corrections,
      createCorrection,
      updateStatus,
      updateCorrection,
      removeCorrection,
      resetCorrections,
      projects,
      employees
    }),
    [corrections, projects, employees]
  );

  return <MailCorrectionContext.Provider value={value}>{children}</MailCorrectionContext.Provider>;
}

export const useMailCorrections = () => useContext(MailCorrectionContext);
