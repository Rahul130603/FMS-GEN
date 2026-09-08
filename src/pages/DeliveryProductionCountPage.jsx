import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, ClipboardList, PackageCheck, RefreshCw, Search, Truck } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { getDeliveryProductionRecords } from '../services/deliveryProductionCountApi';

const dateValue = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const displayDate = (value) => {
  const date = dateValue(value);
  return date ? date.toLocaleDateString() : (value || '—');
};

export function DeliveryProductionCountPage() {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setUnavailable(false);
    try {
      setRecords(await getDeliveryProductionRecords());
    } catch {
      setRecords([]);
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const filteredRecords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) =>
      [record.id, record.customer, record.title, record.isbn, record.type, record.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [query, records]);

  const completed = records.filter((record) => String(record.status || '').toLowerCase() === 'delivered').length;
  const totalQuantity = records.reduce((sum, record) => sum + Number(record.qty ?? record.filesCount ?? 0), 0);

  const cards = [
    { label: 'Delivery Records', value: records.length, icon: ClipboardList, tone: 'text-brand-600 bg-brand-50' },
    { label: 'Delivered', value: completed, icon: PackageCheck, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Production Count', value: totalQuantity, icon: BarChart3, tone: 'text-indigo-600 bg-indigo-50' }
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-brand-700">
            <Truck className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Reports & Analytics</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Delivery Production Count</h1>
          <p className="mt-1 text-sm text-slate-500">Live delivery production records from the connected operations API.</p>
        </div>
        <button onClick={loadRecords} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></div>
            <p className="text-2xl font-bold text-slate-900">{loading ? '—' : value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-sm font-bold text-slate-900">Delivery records</h2><p className="mt-0.5 text-xs text-slate-500">No sample records are used in this report.</p></div>
          <label className="relative block"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-500 sm:w-64" placeholder="Search delivery records" /></label>
        </div>
        {loading ? <div className="p-10 text-center text-sm text-slate-500">Loading delivery production data…</div> : unavailable ? (
          <EmptyState title="Delivery data is not connected" description="The current application does not expose the delivery production API yet. No records have been substituted." actionText="Try again" onAction={loadRecords} type="folder" />
        ) : filteredRecords.length === 0 ? (
          <EmptyState title={records.length ? 'No matching delivery records' : 'No delivery production records'} description={records.length ? 'Try a different search term.' : 'Delivery records will appear here when they are available from the production API.'} actionText={records.length ? 'Clear search' : 'Refresh'} onAction={() => records.length ? setQuery('') : loadRecords()} type="search" />
        ) : (
          <div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{['Delivery ID', 'Customer', 'Title / ISBN', 'Type', 'Quantity', 'Date', 'Status'].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filteredRecords.map((record, index) => <tr key={record.id || index} className="text-slate-700"><td className="px-4 py-3 font-semibold text-slate-900">{record.id || '—'}</td><td className="px-4 py-3">{record.customer || '—'}</td><td className="px-4 py-3"><div>{record.title || '—'}</div>{record.isbn && <div className="mt-0.5 text-slate-400">{record.isbn}</div>}</td><td className="px-4 py-3">{record.type || '—'}</td><td className="px-4 py-3">{record.qty ?? record.filesCount ?? '—'}</td><td className="px-4 py-3">{displayDate(record.date || record.deliveredAt)}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">{record.status || '—'}</span></td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
