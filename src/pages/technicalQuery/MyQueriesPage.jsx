import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Paperclip, Search, Filter } from 'lucide-react';
import PriorityBadge from '../../components/technicalQuery/PriorityBadge';
import StatusBadge from '../../components/technicalQuery/StatusBadge';
import { technicalQueryApi } from '../../services/technicalQueryApi';
import { CATEGORIES, STATUSES, PRIORITIES, CATEGORY_LABELS } from '../../constants/technicalQuery';
import { formatDateShort } from '../../utils/tqFormatters';
import '../../styles/technical-query.css';

export function MyQueriesPage() {
  const navigate = useNavigate();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');

  const loadQueries = async () => {
    setLoading(true);
    const res = await technicalQueryApi.list({ search, status, category, priority });
    setQueries(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadQueries();
  }, [status, category, priority]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadQueries();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Technical Queries Master Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse, filter, and review all active and archived technical tickets.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs cursor-pointer self-start sm:self-auto"
          onClick={() => navigate('/technical-query/raise')}
        >
          <PlusCircle size={15} /> Raise New Query
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search query #, subject, or ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 outline-hidden focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="w-36">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 outline-hidden"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s.code} value={s.code}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="w-40">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 outline-hidden"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Queries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Query #</th>
                <th className="px-4 py-3.5">Subject</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Assigned</th>
                <th className="px-4 py-3.5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading queries...</td>
                </tr>
              ) : queries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No matching technical queries found.</td>
                </tr>
              ) : (
                queries.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-brand-700">{q.query_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{q.subject}</div>
                      {q.isbn && <div className="text-[11px] text-slate-400 font-mono">ISBN: {q.isbn}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{CATEGORY_LABELS[q.category] || q.category}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={q.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                    <td className="px-4 py-3 text-slate-600">{q.assigned_to_name || <span className="text-slate-400">Unassigned</span>}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateShort(q.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MyQueriesPage;
