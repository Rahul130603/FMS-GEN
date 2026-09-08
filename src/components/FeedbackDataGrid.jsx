import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  X
} from 'lucide-react';
import { api } from '../services/api';
import StarRating from '../components/StarRating';

export default function FeedbackDataGrid({ onSelectIsbn, onOpenExportModal }) {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const [rating, setRating] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('submitted_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.getFeedbackList({
        search,
        isbn,
        title,
        feedbackType,
        rating,
        dateRange,
        startDate,
        endDate,
        sortBy,
        sortOrder,
        page,
        limit: 10
      });

      if (res.success) {
        setRecords(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Error fetching feedback list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(1);
  }, [feedbackType, rating, dateRange, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords(1);
  };

  const resetFilters = () => {
    setSearch('');
    setIsbn('');
    setTitle('');
    setFeedbackType('');
    setRating('');
    setDateRange('');
    setStartDate('');
    setEndDate('');
    setSortBy('submitted_at');
    setSortOrder('DESC');
    fetchRecords(1);
  };

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(col);
      setSortOrder('DESC');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Customer Feedback &amp; Critic Master Data Grid
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, filter, and inspect permanently archived customer evaluations across all production books.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRecords(pagination.page)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export Data
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Universal Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keyword, comments, customer..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ISBN filter */}
          <div className="w-36">
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="Filter ISBN..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Feedback Type */}
          <div className="w-36">
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="POSITIVE">Positive Only</option>
              <option value="NEGATIVE">Negative Only</option>
            </select>
          </div>

          {/* Rating */}
          <div className="w-32">
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars (★★★★★)</option>
              <option value="4">4 Stars (★★★★)</option>
              <option value="3">3 Stars (★★★)</option>
              <option value="2">2 Stars (★★)</option>
              <option value="1">1 Star (★)</option>
            </select>
          </div>

          {/* Quick Date Range Chips */}
          <div className="w-36">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year (2026)</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            Apply Filters
          </button>

          {(search || isbn || title || feedbackType || rating || dateRange) && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort('feedback_number')}
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Feedback #</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('isbn')}
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ISBN</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('title')}
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Book Title</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('feedback_type')}
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Type</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('rating')}
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Rating</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3.5">Customer / Organization</th>
                <th className="px-4 py-3.5">Customer Comment &amp; Critique</th>
                <th
                  onClick={() => handleSort('submitted_at')}
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Submitted Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-slate-400 animate-pulse">
                    Loading customer feedback records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-slate-400">
                    No feedback records available.
                  </td>
                </tr>
              ) : (
                records.map((item) => {
                  const isPos = item.feedback_type === 'POSITIVE';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => setSelectedRecord(item)}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {item.feedback_number}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIsbn(item.isbn);
                          }}
                          className="hover:text-blue-600 hover:underline flex items-center gap-1"
                          title="View ISBN Deep Dive Report"
                        >
                          {item.isbn}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </button>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">
                        {item.title}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isPos
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          }`}
                        >
                          {isPos ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                          {item.feedback_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StarRating rating={item.rating} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <div className="font-medium">{item.customer_name || 'Anonymous Customer'}</div>
                        <div className="text-[10px] text-slate-400">{item.customer_company || 'Independent Reader'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[280px]">
                        <p className="line-clamp-2">{item.comment}</p>
                        {item.critic_category && (
                          <span className="mt-1 inline-block text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                            Issue: {item.critic_category}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                        {item.submitted_at?.substring(0, 16)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(item);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-xs font-semibold transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {records.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {pagination.total}
            </span>{' '}
            records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchRecords(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2">
              Page {pagination.page} / {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchRecords(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Inspect Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  {selectedRecord.feedback_number}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedRecord.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 uppercase text-[10px] font-bold">ISBN</span>
                <p className="font-mono font-semibold text-slate-900 dark:text-white">{selectedRecord.isbn}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Sentiment &amp; Score</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StarRating rating={selectedRecord.rating} size="sm" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Customer</span>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedRecord.customer_name || 'Anonymous'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Company / Org</span>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedRecord.customer_company || '-'}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-bold">Primary Comment</label>
                <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mt-1">
                  {selectedRecord.comment}
                </p>
              </div>

              {selectedRecord.appreciation_message && (
                <div>
                  <label className="text-emerald-600 dark:text-emerald-400 uppercase text-[10px] font-bold">
                    Appreciation Message
                  </label>
                  <p className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 mt-1 border border-emerald-200 dark:border-emerald-900/50">
                    {selectedRecord.appreciation_message}
                  </p>
                </div>
              )}

              {selectedRecord.critic_message && (
                <div>
                  <label className="text-rose-600 dark:text-rose-400 uppercase text-[10px] font-bold flex items-center justify-between">
                    <span>Criticism &amp; Root Cause</span>
                    {selectedRecord.critic_category && (
                      <span className="bg-rose-100 dark:bg-rose-900 px-2 py-0.5 rounded text-[10px]">
                        {selectedRecord.critic_category}
                      </span>
                    )}
                  </label>
                  <p className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 mt-1 border border-rose-200 dark:border-rose-900/50">
                    {selectedRecord.critic_message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const targetIsbn = selectedRecord.isbn;
                  setSelectedRecord(null);
                  onSelectIsbn(targetIsbn);
                }}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Open Full ISBN Timeline &rarr;
              </button>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-800 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

