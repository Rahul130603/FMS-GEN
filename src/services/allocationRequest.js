export async function saveAllocationBatch(items, { timeoutMs = 30000, fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl("/api/allocations/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
      signal: controller.signal
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || result.detail || "Could not save employee allocations");
    return result;
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Server response timed out. Check allocation history before retrying; the server may have saved the batch.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
