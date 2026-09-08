import React, { useState, useMemo } from 'react';
import { usePublishing } from '../context/PublishingContext';
import { SummaryCard } from '../components/common/SummaryCard';
import { FilterPanel, FilterInput, FilterSelect } from '../components/common/FilterPanel';
import { SearchableSelect } from '../components/common/SearchableSelect';
import { DatePickerInput } from '../components/common/DatePickerInput';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge, PriorityBadge, FormatBadge, StageBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { ProjectDetailModal } from '../components/reports/ProjectDetailModal';
import { RecentActivityFeed } from '../components/reports/RecentActivityFeed';
import { exportMyReportSummaryToExcel } from '../utils/exportExcel';
import { calculateMyReportMetrics } from '../utils/reportMetrics';
import {
  PUBLISHING_CLIENTS,
  PROJECT_TYPES,
  MY_REPORT_STATUSES
} from '../data/mockData';
import {
  Download,
  RotateCw,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Eye,
  BookOpen,
  FileCheck2,
  CalendarCheck,
  Search,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  X
} from 'lucide-react';

export function MyReport({ user = { name: 'Administrator' } }) {
  const { myProjects, activities, loading, refreshData, lastRefreshed } = usePublishing();

  // Detail Modal State
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toast / Notification State
  const [toast, setToast] = useState(null);

  // Export Loading State
  const [isExporting, setIsExporting] = useState(false);

  // Filter Form State
  const [filterValues, setFilterValues] = useState({
    fromDate: '',
    toDate: '',
    searchName: '',
    client: '',
    projectType: '',
    status: '',
    priority: ''
  });

  // Applied Filters State
  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: '',
    toDate: '',
    searchName: '',
    client: '',
    projectType: '',
    status: '',
    priority: ''
  });

  const [refreshing, setRefreshing] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Handle Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setTimeout(() => setRefreshing(false), 300);
  };

  // Handle Apply Filter
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filterValues });
  };

  // Handle Reset Filter
  const handleResetFilters = () => {
    const emptyFilters = {
      fromDate: '',
      toDate: '',
      searchName: '',
      client: '',
      projectType: '',
      status: '',
      priority: ''
    };
    setFilterValues(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(appliedFilters).filter(val => val && val.trim() !== '').length;
  }, [appliedFilters]);

  // Current today reference (2026-09-04)
  const TODAY_STR = '2026-09-04';

  // Dynamic unique client names list for searchable combobox
  const availableClients = useMemo(() => {
    const clientsFromProjects = myProjects.map(p => p.client || p.publisher).filter(Boolean);
    return Array.from(new Set(clientsFromProjects)).sort((a, b) => a.localeCompare(b));
  }, [myProjects]);

  // Filtered dataset based on applied filters
  const filteredProjects = useMemo(() => {
    return myProjects.filter(p => {
      // From Date (Assigned): Assigned Date >= selected From Date
      if (appliedFilters.fromDate && p.assignedDate && p.assignedDate < appliedFilters.fromDate) {
        return false;
      }

      // To Date (Due): Due Date <= selected To Date
      if (appliedFilters.toDate && p.dueDate && p.dueDate > appliedFilters.toDate) {
        return false;
      }

      // ISBN / Book Name Search (case-insensitive substring match against ISBN or Book Title)
      if (appliedFilters.searchName) {
        const query = appliedFilters.searchName.trim().toLowerCase();
        const matchesIsbn = (String(p.isbn || '')).toLowerCase().includes(query);
        const matchesTitle = (p.bookTitle || '').toLowerCase().includes(query);
        if (!matchesIsbn && !matchesTitle) return false;
      }

      // Client / Publisher Filter
      if (appliedFilters.client && p.client !== appliedFilters.client && p.publisher !== appliedFilters.client) {
        return false;
      }

      // Project Type Filter
      if (appliedFilters.projectType && p.projectType !== appliedFilters.projectType) {
        return false;
      }

      // Status Filter
      if (appliedFilters.status && p.status !== appliedFilters.status) {
        return false;
      }

      // Priority Filter
      if (appliedFilters.priority && p.priority !== appliedFilters.priority) {
        return false;
      }

      return true;
    });
  }, [myProjects, appliedFilters]);

  // Dynamic Summary Metrics calculation representing the current My Report dataset
  const metrics = useMemo(() => {
    return calculateMyReportMetrics(filteredProjects, TODAY_STR);
  }, [filteredProjects]);

  // Handle Export to Excel (.xlsx) Summary
  const handleExport = async () => {
    if (isExporting) return;

    if (!filteredProjects || filteredProjects.length === 0) {
      showToast('No projects available to export.', 'warning');
      return;
    }

    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      await exportMyReportSummaryToExcel(metrics, TODAY_STR);
      showToast('My Report Summary Excel downloaded successfully.', 'success');
    } catch (err) {
      console.error('Excel Export Error:', err);
      showToast('Unable to export the report. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Open View Modal
  const handleViewProject = (prj) => {
    setSelectedProject(prj);
    setIsModalOpen(true);
  };

  // Table Columns Specification
  const columns = useMemo(() => [
    {
      header: 'ISBN',
      key: 'isbn',
      sortKey: 'isbn',
      width: 'w-36',
      render: (row) => (
        <span
          className="font-mono font-bold text-brand-700 text-xs hover:underline cursor-pointer tracking-wide"
          onClick={() => handleViewProject(row)}
          title={`ISBN: ${row.isbn}`}
        >
          {String(row.isbn || '')}
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
          {row.client}
        </span>
      )
    },
    {
      header: 'Project Type',
      key: 'projectType',
      sortKey: 'projectType',
      render: (row) => <FormatBadge format={row.projectType} />
    },
    {
      header: 'Assigned Date',
      key: 'assignedDate',
      sortKey: 'assignedDate',
      render: (row) => (
        <span className="text-xs font-mono text-slate-600">
          {row.assignedDate}
        </span>
      )
    },
    {
      header: 'Due Date',
      key: 'dueDate',
      sortKey: 'dueDate',
      render: (row) => {
        const isOverdue = row.dueDate < TODAY_STR && row.status !== 'Completed';
        const isToday = row.dueDate === TODAY_STR && row.status !== 'Completed';
        return (
          <span className={`text-xs font-mono font-semibold ${
            isOverdue ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded' : isToday ? 'text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded' : 'text-slate-700'
          }`}>
            {row.dueDate}
          </span>
        );
      }
    },
    {
      header: 'Progress',
      key: 'progress',
      sortKey: 'progress',
      width: 'w-36',
      render: (row) => <ProgressBar value={row.progress} />
    },
    {
      header: 'Current Stage',
      key: 'currentStage',
      sortKey: 'currentStage',
      render: (row) => <StageBadge stage={row.currentStage} />
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
          aria-label={`View details of project ${row.id}`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </button>
      )
    }
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* ========================================================================= */}
      {/* FLOATING TOAST NOTIFICATION */}
      {/* ========================================================================= */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-elevated border text-xs font-medium transition-all animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : toast.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:opacity-75 ml-2"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              My Report
            </h1>
            <span className="text-xs bg-brand-100 text-brand-800 font-semibold px-2.5 py-0.5 rounded-full">
              {user.name}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your assigned publishing projects, progress, deadlines, and pending work.
          </p>
        </div>

        {/* Top-Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors shadow-xs"
            aria-label="Refresh report data"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors shadow-xs"
            aria-label="Export report to Excel (.xlsx)"
          >
            {isExporting ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUMMARY METRIC CARDS (EXACTLY 6 REQUIRED CARDS) */}
      {/* ========================================================================= */}
      <section aria-label="Summary Metrics">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. TOTAL FILES */}
          <SummaryCard
            title="TOTAL FILES"
            count={metrics.total}
            icon={Layers}
            variant="primary"
            subtitle="Current queue"
          />

          {/* 2. IN PROGRESS */}
          <SummaryCard
            title="IN PROGRESS"
            count={metrics.inProgress}
            icon={Clock}
            variant="info"
            subtitle="Under production"
          />

          {/* 3. COMPLETED */}
          <SummaryCard
            title="COMPLETED"
            count={metrics.completed}
            icon={CheckCircle2}
            variant="success"
            subtitle="Delivered titles"
          />

          {/* 4. PENDING */}
          <SummaryCard
            title="PENDING"
            count={metrics.pending}
            icon={FileCheck2}
            variant="warning"
            subtitle="Awaiting action"
          />

          {/* 5. OVERDUE */}
          <SummaryCard
            title="OVERDUE"
            count={metrics.overdue}
            icon={AlertTriangle}
            variant="danger"
            subtitle="Past due date"
          />

          {/* 6. DUE TODAY */}
          <SummaryCard
            title="DUE TODAY"
            count={metrics.dueToday}
            icon={CalendarCheck}
            variant="purple"
            subtitle="04 Sep 2026"
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FILTER SECTION */}
      {/* ========================================================================= */}
      <section aria-label="Report Filters">
        <FilterPanel
          title="Filter Assigned Projects"
          activeFilterCount={activeFilterCount}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        >
          {/* From Date (Assigned) */}
          <DatePickerInput
            label="From Date (Assigned)"
            id="fromDate"
            value={filterValues.fromDate}
            onChange={(val) => setFilterValues(prev => ({ ...prev, fromDate: val }))}
          />

          {/* To Date (Due) */}
          <DatePickerInput
            label="To Date (Due)"
            id="toDate"
            value={filterValues.toDate}
            onChange={(val) => setFilterValues(prev => ({ ...prev, toDate: val }))}
          />

          {/* ISBN / Book Name Search */}
          <FilterInput
            label="ISBN / Book Name"
            id="searchName"
            placeholder="Search by ISBN or title..."
            icon={Search}
            value={filterValues.searchName}
            onChange={(val) => setFilterValues(prev => ({ ...prev, searchName: val }))}
          />

          {/* Client / Publisher (Searchable Combobox) */}
          <SearchableSelect
            label="Client / Publisher"
            id="client"
            value={filterValues.client}
            allLabel="All Clients & Publishers"
            options={availableClients}
            onChange={(val) => setFilterValues(prev => ({ ...prev, client: val }))}
          />

          {/* Project Type */}
          <FilterSelect
            label="Project Type"
            id="projectType"
            value={filterValues.projectType}
            allLabel="All Formats / Types"
            options={PROJECT_TYPES}
            onChange={(val) => setFilterValues(prev => ({ ...prev, projectType: val }))}
          />

          {/* Status */}
          <FilterSelect
            label="Status"
            id="status"
            value={filterValues.status}
            allLabel="All Statuses"
            options={MY_REPORT_STATUSES}
            onChange={(val) => setFilterValues(prev => ({ ...prev, status: val }))}
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
        </FilterPanel>
      </section>

      {/* ========================================================================= */}
      {/* MY PROJECTS TABLE */}
      {/* ========================================================================= */}
      <section aria-label="My Assigned Projects Table" className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Assigned Projects ({filteredProjects.length})
            </h2>
            {activeFilterCount > 0 && (
              <span className="text-xs text-slate-500 italic">
                (Filtered from {myProjects.length} total)
              </span>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredProjects}
          keyField="id"
          loading={loading}
          defaultSortField="dueDate"
          defaultSortDirection="asc"
          pageSize={10}
          emptyMessage="No assigned publishing projects match the specified filter criteria. Try resetting or broadening your filters."
        />
      </section>

      {/* ========================================================================= */}
      {/* RECENT ACTIVITY SECTION */}
      {/* ========================================================================= */}
      <section aria-label="Recent Activity">
        <RecentActivityFeed activities={activities} />
      </section>

      {/* ========================================================================= */}
      {/* PROJECT DETAIL MODAL */}
      {/* ========================================================================= */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

