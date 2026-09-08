import React, { useState, useMemo } from 'react';
import { usePublishing } from '../context/PublishingContext';
import { SummaryCard } from '../components/common/SummaryCard';
import { FilterPanel, FilterInput, FilterSelect } from '../components/common/FilterPanel';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge, PriorityBadge, FormatBadge } from '../components/common/Badge';
import { IncomingDetailModal } from '../components/reports/IncomingDetailModal';
import { exportToCsv } from '../utils/exportUtils';
import {
  PUBLISHING_CLIENTS,
  PROJECT_TYPES,
  INCOMING_STATUSES,
  TEAM_MEMBERS
} from '../data/mockData';
import {
  Download,
  RotateCw,
  Inbox,
  Sparkles,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Search,
  UserCheck,
  Building2,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export function IncomingReport() {
  const { incomingProjects, loading, refreshData, assignIncomingProject } = usePublishing();

  // Modal State
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter Form State
  const [filterValues, setFilterValues] = useState({
    receivedDate: '',
    projectId: '',
    bookTitle: '',
    client: '',
    projectType: '',
    priority: '',
    status: '',
    assignedTo: ''
  });

  // Applied Filters State
  const [appliedFilters, setAppliedFilters] = useState({
    receivedDate: '',
    projectId: '',
    bookTitle: '',
    client: '',
    projectType: '',
    priority: '',
    status: '',
    assignedTo: ''
  });

  const [refreshing, setRefreshing] = useState(false);

  // Handle Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setTimeout(() => setRefreshing(false), 300);
  };

  // Apply Filter
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filterValues });
  };

  // Reset Filter
  const handleResetFilters = () => {
    const emptyFilters = {
      receivedDate: '',
      projectId: '',
      bookTitle: '',
      client: '',
      projectType: '',
      priority: '',
      status: '',
      assignedTo: ''
    };
    setFilterValues(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(appliedFilters).filter(val => val && val.trim() !== '').length;
  }, [appliedFilters]);

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    const total = incomingProjects.length;
    const newCount = incomingProjects.filter(p => p.status === 'New').length;
    const awaitingAssignment = incomingProjects.filter(p => p.status === 'Ready for Assignment' || p.status === 'Under Review').length;
    const assignedCount = incomingProjects.filter(p => p.status === 'Assigned').length;
    const inProductionCount = incomingProjects.filter(p => p.status === 'In Production').length;
    const urgentCount = incomingProjects.filter(p => (p.priority === 'High' || p.priority === 'Urgent') && p.status !== 'In Production').length;

    return { total, newCount, awaitingAssignment, assignedCount, inProductionCount, urgentCount };
  }, [incomingProjects]);

  // Filtered dataset
  const filteredProjects = useMemo(() => {
    return incomingProjects.filter(p => {
      // Received Date
      if (appliedFilters.receivedDate && p.receivedDate !== appliedFilters.receivedDate) return false;

      // Project ID Search
      if (appliedFilters.projectId && !p.id.toLowerCase().includes(appliedFilters.projectId.toLowerCase())) return false;

      // Book Title Search
      if (appliedFilters.bookTitle && !p.bookTitle.toLowerCase().includes(appliedFilters.bookTitle.toLowerCase())) return false;

      // Client / Publisher Filter
      if (appliedFilters.client && p.client !== appliedFilters.client && p.publisher !== appliedFilters.client) return false;

      // Project Type / Format Filter
      if (appliedFilters.projectType && !p.format.toLowerCase().includes(appliedFilters.projectType.toLowerCase()) && p.projectType !== appliedFilters.projectType) return false;

      // Priority Filter
      if (appliedFilters.priority && p.priority !== appliedFilters.priority) return false;

      // Status Filter
      if (appliedFilters.status && p.status !== appliedFilters.status) return false;

      // Assigned To Filter
      if (appliedFilters.assignedTo) {
        if (appliedFilters.assignedTo === 'Unassigned') {
          if (p.assignedTo !== 'Unassigned') return false;
        } else if (p.assignedTo !== appliedFilters.assignedTo && p.assignedUserId !== appliedFilters.assignedTo) {
          return false;
        }
      }

      return true;
    });
  }, [incomingProjects, appliedFilters]);

  // Dynamic client options from actual projects
  const availableClients = useMemo(() => {
    const clientsFromProjects = incomingProjects.map(p => p.client || p.publisher).filter(Boolean);
    return Array.from(new Set(clientsFromProjects)).sort((a, b) => a.localeCompare(b));
  }, [incomingProjects]);

  // Handle Export to CSV
  const handleExport = () => {
    const exportColumns = [
      { header: 'Project ID', key: 'id' },
      { header: 'Book Title', key: 'bookTitle' },
      { header: 'Client / Publisher', key: 'client' },
      { header: 'Format', key: 'format' },
      { header: 'Received Date', key: 'receivedDate' },
      { header: 'Due Date', key: 'dueDate' },
      { header: 'Priority', key: 'priority' },
      { header: 'Assigned To', key: 'assignedTo' },
      { header: 'Status', key: 'status' }
    ];
    exportToCsv('Incoming_Publishing_Report', filteredProjects, exportColumns);
  };

  // Open Detail Modal
  const handleViewProject = (prj) => {
    setSelectedProject(prj);
    setIsModalOpen(true);
  };

  // Quick Assignment Handler passed to Modal
  const handleProjectAssignment = async (projectId, assignmentData) => {
    const success = await assignIncomingProject(projectId, assignmentData);
    if (success) {
      // Also update currently selected project in modal
      setSelectedProject(prev => prev ? {
        ...prev,
        status: 'Assigned',
        assignedTo: assignmentData.assignedUserName,
        assignedTeam: assignmentData.assignedTeam,
        assignedUserId: assignmentData.assignedUserId,
        startDate: assignmentData.startDate,
        dueDate: assignmentData.dueDate || prev.dueDate,
        priority: assignmentData.priority || prev.priority,
        notes: assignmentData.notes
      } : null);
    }
    return success;
  };

  // Table Columns Specification
  const columns = useMemo(() => [
    {
      header: 'Project ID',
      key: 'id',
      sortKey: 'id',
      width: 'w-28',
      render: (row) => (
        <span
          className="font-mono font-bold text-brand-700 text-xs hover:underline cursor-pointer"
          onClick={() => handleViewProject(row)}
        >
          {row.id}
        </span>
      )
    },
    {
      header: 'Book Title',
      key: 'bookTitle',
      sortKey: 'bookTitle',
      render: (row) => (
        <div className="max-w-[280px]">
          <p
            className="font-semibold text-slate-900 line-clamp-1 hover:text-brand-600 transition-colors cursor-pointer"
            onClick={() => handleViewProject(row)}
            title={row.bookTitle}
          >
            {row.bookTitle}
          </p>
          <p className="text-[11px] text-slate-400 font-medium truncate">
            {row.author ? `by ${row.author}` : row.client}
          </p>
        </div>
      )
    },
    {
      header: 'Client',
      key: 'client',
      sortKey: 'client',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium">
          {row.client || row.publisher}
        </span>
      )
    },
    {
      header: 'Format',
      key: 'format',
      sortKey: 'format',
      render: (row) => <FormatBadge format={row.format} />
    },
    {
      header: 'Received Date',
      key: 'receivedDate',
      sortKey: 'receivedDate',
      render: (row) => (
        <span className="text-xs font-mono text-slate-600">
          {row.receivedDate}
        </span>
      )
    },
    {
      header: 'Due Date',
      key: 'dueDate',
      sortKey: 'dueDate',
      render: (row) => (
        <span className="text-xs font-mono font-semibold text-slate-700">
          {row.dueDate}
        </span>
      )
    },
    {
      header: 'Priority',
      key: 'priority',
      sortKey: 'priority',
      render: (row) => <PriorityBadge priority={row.priority} />
    },
    {
      header: 'Assigned To',
      key: 'assignedTo',
      sortKey: 'assignedTo',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.assignedTo === 'Unassigned' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 italic">
              Unassigned
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {row.assignedTo}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      sortKey: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleViewProject(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 hover:text-brand-800 rounded-lg border border-brand-200/80 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label={`View incoming project details for ${row.id}`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </button>
      )
    }
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* PAGE HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Incoming Project Report
            </h1>
            <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2.5 py-0.5 rounded-full">
              Intake & Assignment
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            View and manage newly received publishing projects before assignment and production.
          </p>
        </div>

        {/* Top-Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors shadow-xs"
            aria-label="Refresh incoming project report"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExport}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors shadow-xs"
            aria-label="Export incoming report to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUMMARY METRIC CARDS */}
      {/* ========================================================================= */}
      <section aria-label="Summary Metrics">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <SummaryCard
            title="Total Incoming"
            count={metrics.total}
            icon={Inbox}
            variant="default"
            subtitle="Received projects"
          />
          <SummaryCard
            title="New Projects"
            count={metrics.newCount}
            icon={Sparkles}
            variant="primary"
            subtitle="Needs initial check"
          />
          <SummaryCard
            title="Awaiting Assignment"
            count={metrics.awaitingAssignment}
            icon={UserPlus}
            variant="warning"
            subtitle="Ready for allocation"
          />
          <SummaryCard
            title="Assigned"
            count={metrics.assignedCount}
            icon={UserCheck}
            variant="info"
            subtitle="Team designated"
          />
          <SummaryCard
            title="In Production"
            count={metrics.inProductionCount}
            icon={Clock}
            variant="success"
            subtitle="Active typesetting"
          />
          <SummaryCard
            title="Urgent"
            count={metrics.urgentCount}
            icon={AlertTriangle}
            variant="danger"
            subtitle="High priority queue"
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FILTER SECTION */}
      {/* ========================================================================= */}
      <section aria-label="Incoming Project Filters">
        <FilterPanel
          title="Filter Incoming Intake Projects"
          activeFilterCount={activeFilterCount}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        >
          {/* Received Date */}
          <FilterInput
            label="Received Date"
            id="receivedDate"
            type="date"
            value={filterValues.receivedDate}
            onChange={(val) => setFilterValues(prev => ({ ...prev, receivedDate: val }))}
          />

          {/* Project ID */}
          <FilterInput
            label="Project ID"
            id="projectId"
            placeholder="Search Project ID..."
            icon={Search}
            value={filterValues.projectId}
            onChange={(val) => setFilterValues(prev => ({ ...prev, projectId: val }))}
          />

          {/* Book Title */}
          <FilterInput
            label="Book Title"
            id="bookTitle"
            placeholder="Search book title..."
            icon={Search}
            value={filterValues.bookTitle}
            onChange={(val) => setFilterValues(prev => ({ ...prev, bookTitle: val }))}
          />

          {/* Client / Publisher */}
          <FilterSelect
            label="Client / Publisher"
            id="client"
            value={filterValues.client}
            allLabel="All Publishers & Clients"
            options={availableClients}
            onChange={(val) => setFilterValues(prev => ({ ...prev, client: val }))}
          />

          {/* Project Type / Format */}
          <FilterSelect
            label="Project Type / Format"
            id="projectType"
            value={filterValues.projectType}
            allLabel="All Formats"
            options={PROJECT_TYPES}
            onChange={(val) => setFilterValues(prev => ({ ...prev, projectType: val }))}
          />

          {/* Priority */}
          <FilterSelect
            label="Priority"
            id="priority"
            value={filterValues.priority}
            allLabel="All Priorities"
            options={['High', 'Medium', 'Low']}
            onChange={(val) => setFilterValues(prev => ({ ...prev, priority: val }))}
          />

          {/* Project Status */}
          <FilterSelect
            label="Project Status"
            id="status"
            value={filterValues.status}
            allLabel="All Statuses"
            options={INCOMING_STATUSES}
            onChange={(val) => setFilterValues(prev => ({ ...prev, status: val }))}
          />

          {/* Assigned To */}
          <FilterSelect
            label="Assigned To"
            id="assignedTo"
            value={filterValues.assignedTo}
            allLabel="All Assignees"
            options={[
              { label: 'Unassigned Projects', value: 'Unassigned' },
              ...TEAM_MEMBERS.map(u => ({ label: `${u.name} (${u.role})`, value: u.name }))
            ]}
            onChange={(val) => setFilterValues(prev => ({ ...prev, assignedTo: val }))}
          />
        </FilterPanel>
      </section>

      {/* ========================================================================= */}
      {/* INCOMING PROJECT TABLE */}
      {/* ========================================================================= */}
      <section aria-label="Incoming Projects Table" className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Incoming Intake Pipeline ({filteredProjects.length})
            </h2>
            {activeFilterCount > 0 && (
              <span className="text-xs text-slate-500 italic">
                (Filtered from {incomingProjects.length} total)
              </span>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredProjects}
          keyField="id"
          loading={loading}
          defaultSortField="receivedDate"
          defaultSortDirection="desc"
          pageSize={10}
          emptyMessage="No incoming publishing intake records match your filters. Try resetting the filters or modifying search keywords."
        />
      </section>

      {/* ========================================================================= */}
      {/* INCOMING PROJECT DETAIL MODAL (5 SECTIONS) */}
      {/* ========================================================================= */}
      <IncomingDetailModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAssign={handleProjectAssignment}
      />
    </div>
  );
}
