const API_BASE = '/api';

/**
 * Retrieves delivery records from the production API.  This module deliberately
 * does not supply fallbacks: reporting must never render fabricated records.
 */
export async function getDeliveryProductionRecords() {
  const response = await fetch(`${API_BASE}/deliveries`);
  if (!response.ok) {
    throw new Error(`Delivery production records are unavailable (${response.status})`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : (payload.deliveries || []);
}
