const API_BASE = "/api/mail-corrections";

export const getMailCorrections = async () => {
  try {
    const res = await fetch(API_BASE);
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
};

export const getMailCorrectionById = async (id) => {
  const all = await getMailCorrections();
  return all.find(x => x.id === id);
};

export const createMailCorrection = async (data) => {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    return json.item || data;
  } catch {
    return data;
  }
};

export const updateMailCorrection = async (id, data) => {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    return json.item || { id, ...data };
  } catch {
    return { id, ...data };
  }
};

export const deleteMailCorrection = async (id) => {
  try {
    await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    return id;
  } catch {
    return id;
  }
};

export const allocateCorrection = async (id, employee) => {
  return updateMailCorrection(id, { assignedEmployee: employee, status: "Allocated" });
};

export const updateCorrectionStatus = async (id, status) => {
  return updateMailCorrection(id, { status });
};

export const uploadCorrectionFile = async (id, file) => ({ id, file });
export const raiseCorrectionQuery = async (id, message) =>
  updateMailCorrection(id, { status: "Waiting for Clarification", internalRemarks: message });
export const submitCorrectionToQC = async (id) =>
  updateMailCorrection(id, { status: "QC Pending" });
export const approveCorrection = async (id) =>
  updateMailCorrection(id, { status: "QC Approved" });
export const rejectCorrection = async (id, reason) =>
  updateMailCorrection(id, { status: "QC Rejected", internalRemarks: reason });
export const closeCorrection = async (id) =>
  updateMailCorrection(id, { status: "Closed" });
export const getMailCorrectionReport = async (filters) => ({
  filters,
  records: await getMailCorrections(),
  apiBase: API_BASE
});
