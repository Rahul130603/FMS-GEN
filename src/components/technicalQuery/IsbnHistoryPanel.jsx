import React, { useEffect, useState } from 'react';
import { BookOpenText } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { technicalQueryApi } from '../../services/technicalQueryApi';
import { CATEGORY_LABELS } from '../../constants/technicalQuery';
import { formatDateShort } from '../../utils/tqFormatters';

/**
 * Shows every other technical query already raised against a given ISBN,
 * so anyone raising or reviewing a query can immediately spot a recurring,
 * already-known ISBN issue instead of duplicating it. Fetches fresh on
 * every `isbn`/`excludeId` change; renders nothing while the ISBN is empty
 * or too short to be meaningful, and nothing when there's no history.
 */
export default function IsbnHistoryPanel({ isbn, excludeId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = (isbn || '').trim();
    if (trimmed.length < 4) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    technicalQueryApi.isbnHistory(trimmed, excludeId)
      .then((res) => { if (!cancelled) setRows(res.data || []); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isbn, excludeId]);

  const trimmed = (isbn || '').trim();
  if (trimmed.length < 4) return null;
  if (!loading && rows.length === 0) return null;

  return (
    <div className="card p-4 mt-2">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-1.5">
        <BookOpenText size={15} /> Previous Queries for ISBN {trimmed}
      </h4>
      {loading ? (
        <p className="text-xs text-gray-400">Checking history…</p>
      ) : (
        <div className="space-y-2">
          {rows.map((h) => (
            <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">{h.query_number} — {h.subject}</p>
                <p className="text-xs text-gray-400">
                  {CATEGORY_LABELS[h.category] || h.category} · Raised by {h.raised_by_name} · {formatDateShort(h.created_at)}
                  {h.resolved_at && ` · Resolved ${formatDateShort(h.resolved_at)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={h.priority} />
                <StatusBadge status={h.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
