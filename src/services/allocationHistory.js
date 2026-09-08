export const importHistoryKey = "fileflow_isbn_import_history";
export function sourceType(name) {
  if (/^manual/i.test(name || "")) return "Manual";
  if (/\.xlsx?$/i.test(name || "")) return "Excel";
  if (/\.csv$/i.test(name || "")) return "CSV";
  if (/\.txt$/i.test(name || "")) return "TXT";
  return "Unknown";
}
export function buildAllocationHistory(history = [], allocations = [], imports = []) {
  const batches = new Map(history.map(item => [item.id, { ...item, status: "Allocated" }]));
  const groups = new Map();
  allocations.forEach(item => {
    if (!item.batchId) return;
    if (!groups.has(item.batchId)) groups.set(item.batchId, new Map());
    groups.get(item.batchId).set(item.id || `${item.isbn}:${item.employeeId}:${item.role}`, item);
  });
  groups.forEach((map, id) => {
    const items = [...map.values()], first = items[0], old = batches.get(id) || {};
    const sources = [...new Set(items.map(item => item.sourceName || item.batchFile).filter(Boolean))];
    const types = [...new Set(items.map(item => item.sourceType || sourceType(item.sourceName || item.batchFile)))];
    const isbns = [...new Set(items.map(item => String(item.isbn)).filter(Boolean))];
    batches.set(id, { ...old, id, createdAt: old.createdAt || Number(id.replace("BATCH-", "")) || first.createdAt,
      fileName: sources.join(", ") || old.fileName || "Unspecified (legacy)", sourceType: types.length > 1 ? "Mixed" : types[0],
      isbns, totalFiles: isbns.length, assignments: items.length, mode: old.mode || first.allocationMode, status: "Allocated" });
  });
  return [...batches.values(), ...imports.map(item => ({ ...item, status: "Uploaded", totalFiles: item.isbns.length, mode: "Source upload" }))].map(item => ({
    ...item, fileName: item.fileName || "Unspecified (legacy)", sourceType: item.sourceType || sourceType(item.fileName),
    createdAt: item.createdAt || Number(String(item.id).replace("BATCH-", "")) || 0
  })).sort((a, b) => b.createdAt - a.createdAt);
}
