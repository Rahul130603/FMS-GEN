import React from 'react';
import { usePublishing } from '../context/PublishingContext';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge, PriorityBadge, FormatBadge, StageBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { Layers } from 'lucide-react';

export function Projects() {
  const { myProjects, incomingProjects } = usePublishing();

  // Combine both sets for full repository
  const allProjects = [...myProjects, ...incomingProjects];

  const columns = [
    {
      header: 'Project ID',
      key: 'id',
      sortKey: 'id',
      render: (row) => <span className="font-mono font-bold text-brand-700 text-xs">{row.id}</span>
    },
    {
      header: 'Book Title',
      key: 'bookTitle',
      sortKey: 'bookTitle',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs">{row.bookTitle}</p>
          <p className="text-[11px] text-slate-400">{row.client || row.publisher}</p>
        </div>
      )
    },
    {
      header: 'Format',
      key: 'format',
      render: (row) => <FormatBadge format={row.projectType || row.format} />
    },
    {
      header: 'Due Date',
      key: 'dueDate',
      sortKey: 'dueDate',
      render: (row) => <span className="text-xs font-mono text-slate-700">{row.dueDate}</span>
    },
    {
      header: 'Status',
      key: 'status',
      sortKey: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Priority',
      key: 'priority',
      sortKey: 'priority',
      render: (row) => <PriorityBadge priority={row.priority} />
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">All Publishing Projects</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Master repository of active, assigned, and incoming titles</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={allProjects}
        keyField="id"
        pageSize={10}
        defaultSortField="dueDate"
      />
    </div>
  );
}
