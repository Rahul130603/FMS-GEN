import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { SkeletonTable } from './Skeleton';
import EmptyState from './EmptyState';
import Pagination from './Pagination';

/**
 * Generic, reusable data grid used by every list screen in this module
 * (My Technical Queries, All Queries + each status submenu, and the
 * Reports table). Sorting/pagination are server-driven — this component
 * only renders what it's given and reports intent (sort clicked, page
 * clicked) back to the caller.
 *
 * columns: [{ key, header, sortable?, render?: (row) => node, className? }]
 */
export default function DataTable({
  columns,
  rows,
  loading,
  error,
  emptyTitle = 'No records found',
  emptyDescription,
  sortBy,
  sortDir,
  onSort,
  onRowClick,
  pagination, // { page, pageSize, totalCount, totalPages, onPageChange }
}) {
  if (loading) return <SkeletonTable cols={columns.length} />;

  if (error) {
    return (
      <div className="card p-6 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap ${col.headerClassName || ''}`}
                >
                  {col.sortable ? (
                    <button
                      className="flex items-center gap-1 hover:text-brand-700 dark:hover:text-brand-400"
                      onClick={() => {
                        const nextDir = sortBy === col.key && sortDir === 'asc' ? 'desc' : 'asc';
                        onSort(col.key, nextDir);
                      }}
                    >
                      {col.header}
                      {sortBy === col.key ? (
                        sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={13} className="text-gray-300" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {(!rows || rows.length === 0) ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="font-semibold text-sm">{emptyTitle}</span>
                    {emptyDescription && <span className="text-xs text-gray-400">{emptyDescription}</span>}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors' : ''}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 whitespace-nowrap ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
