import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DailyReportHeader from './DailyReportHeader';
import QuickReportCards from './QuickReportCards';
import ManagerAttentionPanel from './ManagerAttentionPanel';
import RoleProgress from './RoleProgress';
import StatusDistribution from './StatusDistribution';
import AllocationChart from './AllocationChart';
import DailyAllotmentTable from './DailyAllotmentTable';
import ColumnVisibilityDropdown from './ColumnVisibilityDropdown';
import Pagination from './Pagination';
import HourlyProductivity from './HourlyProductivity';
import RecentActivity from './RecentActivity';
import TwoHourReportModal from './TwoHourReportModal';
import EmployeeDetailsDrawer from './EmployeeDetailsDrawer';
import EmployeeReportModal from './EmployeeReportModal';
import EmployeeComparisonModal from './EmployeeComparisonModal';
import { Calendar, Clock8 } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';

import { 
  INITIAL_EMPLOYEE_RECORDS, 
  DISPLAY_REPORT_DATE, 
  CURRENT_REPORT_DATE,
  DEFAULT_VISIBLE_COLUMNS,
  formatDisplayDate,
  getEmployeeRecordsForDate
} from '../data/dailyAllotmentDummyData';
import { 
  calculateKpiSummary, 
  calculateStatusBreakdown, 
  getStatusPriority,
  calculatePending,
  calculateCompletionRate,
  calculateProductivityScore
} from '../utils/statusCalculations';
import { exportToCSV, exportToExcel } from '../utils/exportUtils';

export default function DailyAllotmentStatus() {
  // Selected Report Date (past date or current)
  const [selectedDate, setSelectedDate] = useState(CURRENT_REPORT_DATE);

  // Master records for selected date
  const [allRecords, setAllRecords] = useState(() => getEmployeeRecordsForDate(CURRENT_REPORT_DATE));

  // 2-Hour tracking slot selection for right-hand breakdown panel
  const [selectedTwoHourSlot, setSelectedTwoHourSlot] = useState(null);

  // Sorting state
  const [sortBy, setSortBy] = useState('employeeName');
  const [sortOrder, setSortOrder] = useState('asc');

  // Column Filters state
  const [columnFilters, setColumnFilters] = useState({
    employeeName: '',
    employeeId: '',
    role: 'all',
    allocated: 'all',
    dailyTarget: 'all',
    completed: 'all',
    pending: 'all',
    rework: 'all',
    productivityScore: 'all',
    status: 'all',
  });

  const handleColumnFilterChange = (colKey, val) => {
    setColumnFilters(prev => ({ ...prev, [colKey]: val }));
    setCurrentPage(1);
  };

  const handleClearColumnFilter = (colKey) => {
    setColumnFilters(prev => ({ 
      ...prev, 
      [colKey]: (colKey === 'employeeName' || colKey === 'employeeId') ? '' : 'all' 
    }));
    setCurrentPage(1);
  };

  const handleClearAllColumnFilters = () => {
    setColumnFilters({
      employeeName: '',
      employeeId: '',
      role: 'all',
      allocated: 'all',
      dailyTarget: 'all',
      completed: 'all',
      pending: 'all',
      rework: 'all',
      productivityScore: 'all',
      status: 'all',
    });
    setCurrentPage(1);
  };

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Column Visibility with localStorage persistence
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const stored = localStorage.getItem('daily_allotment_visible_columns');
      if (stored) {
        const parsed = JSON.parse(stored);
        const sanitized = { ...DEFAULT_VISIBLE_COLUMNS };
        Object.keys(DEFAULT_VISIBLE_COLUMNS).forEach(key => {
          if (typeof parsed[key] === 'boolean') {
            sanitized[key] = parsed[key];
          }
        });
        return sanitized;
      }
      return DEFAULT_VISIBLE_COLUMNS;
    } catch {
      return DEFAULT_VISIBLE_COLUMNS;
    }
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Refresh & loading state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('08:45 AM');

  // Drawers & Modals
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // Handle Date Selection (past date or today)
  const handleDateChange = (newDate) => {
    if (!newDate) return;
    setSelectedDate(newDate);
    setAllRecords(getEmployeeRecordsForDate(newDate));
    if (newDate === CURRENT_REPORT_DATE) {
      setLastUpdated('08:45 AM');
    } else {
      setLastUpdated('06:00 PM (EOD)');
    }
    setCurrentPage(1);
    setSelectedIds([]);
  };

  // Persist column visibility changes
  const handleToggleColumn = (colKey) => {
    setVisibleColumns(prev => {
      const updated = { ...prev, [colKey]: !prev[colKey] };
      try {
        localStorage.setItem('daily_allotment_visible_columns', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    try {
      localStorage.setItem('daily_allotment_visible_columns', JSON.stringify(DEFAULT_VISIBLE_COLUMNS));
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered & Sorted dataset
  const filteredAndSortedRecords = useMemo(() => {
    let result = [...allRecords];

    // 1. Column Filters
    if (columnFilters.employeeName && columnFilters.employeeName.trim()) {
      const q = columnFilters.employeeName.toLowerCase().trim();
      result = result.filter(r => r.employeeName && r.employeeName.toLowerCase().includes(q));
    }

    if (columnFilters.employeeId && columnFilters.employeeId.trim()) {
      const q = columnFilters.employeeId.toLowerCase().trim();
      result = result.filter(r => r.employeeId && r.employeeId.toLowerCase().includes(q));
    }

    if (columnFilters.role && columnFilters.role !== 'all') {
      result = result.filter(r => r.role === columnFilters.role);
    }

    if (columnFilters.allocated && columnFilters.allocated !== 'all') {
      if (columnFilters.allocated === 'high') result = result.filter(r => r.allocated > 25);
      else if (columnFilters.allocated === 'mid') result = result.filter(r => r.allocated >= 15 && r.allocated <= 25);
      else if (columnFilters.allocated === 'low') result = result.filter(r => r.allocated < 15);
    }

    if (columnFilters.dailyTarget && columnFilters.dailyTarget !== 'all') {
      if (columnFilters.dailyTarget === 'met') {
        result = result.filter(r => (r.completed / (r.dailyTarget || r.allocated)) >= 1);
      } else if (columnFilters.dailyTarget === 'ontrack') {
        result = result.filter(r => {
          const rate = r.completed / (r.dailyTarget || r.allocated);
          return rate >= 0.7 && rate < 1;
        });
      } else if (columnFilters.dailyTarget === 'behind') {
        result = result.filter(r => (r.completed / (r.dailyTarget || r.allocated)) < 0.7);
      }
    }

    if (columnFilters.completed && columnFilters.completed !== 'all') {
      if (columnFilters.completed === 'high') result = result.filter(r => r.completed > 15);
      else if (columnFilters.completed === 'mid') result = result.filter(r => r.completed > 0 && r.completed <= 15);
      else if (columnFilters.completed === 'zero') result = result.filter(r => r.completed === 0);
    }

    if (columnFilters.pending && columnFilters.pending !== 'all') {
      if (columnFilters.pending === 'has') {
        result = result.filter(r => calculatePending(r.allocated, r.completed, r.wip) > 0);
      } else if (columnFilters.pending === 'high') {
        result = result.filter(r => calculatePending(r.allocated, r.completed, r.wip) > 10);
      } else if (columnFilters.pending === 'zero') {
        result = result.filter(r => calculatePending(r.allocated, r.completed, r.wip) === 0);
      }
    }

    if (columnFilters.rework && columnFilters.rework !== 'all') {
      if (columnFilters.rework === 'has') result = result.filter(r => (r.rework || 0) > 0);
      else if (columnFilters.rework === 'high') result = result.filter(r => (r.rework || 0) >= 3);
      else if (columnFilters.rework === 'zero') result = result.filter(r => (r.rework || 0) === 0);
    }

    if (columnFilters.productivityScore && columnFilters.productivityScore !== 'all') {
      if (columnFilters.productivityScore === 'high') {
        result = result.filter(r => calculateProductivityScore(r).score >= 80);
      } else if (columnFilters.productivityScore === 'avg') {
        result = result.filter(r => {
          const s = calculateProductivityScore(r).score;
          return s >= 50 && s < 80;
        });
      } else if (columnFilters.productivityScore === 'low') {
        result = result.filter(r => calculateProductivityScore(r).score < 50);
      }
    }

    if (columnFilters.status && columnFilters.status !== 'all') {
      result = result.filter(r => r.status === columnFilters.status);
    }

    // 2. Sorting
    result.sort((a, b) => {
      if (sortBy === 'status') {
        const priorityA = getStatusPriority(a.status);
        const priorityB = getStatusPriority(b.status);
        return sortOrder === 'reverse-priority' ? priorityB - priorityA : priorityA - priorityB;
      }

      if (sortBy === 'allocated') {
        return sortOrder === 'desc' ? b.allocated - a.allocated : a.allocated - b.allocated;
      }

      if (sortBy === 'dailyTarget') {
        const tA = a.dailyTarget || a.allocated;
        const tB = b.dailyTarget || b.allocated;
        return sortOrder === 'desc' ? tB - tA : tA - tB;
      }

      if (sortBy === 'completed') {
        return sortOrder === 'desc' ? b.completed - a.completed : a.completed - b.completed;
      }

      if (sortBy === 'pending') {
        const pA = calculatePending(a.allocated, a.completed, a.wip);
        const pB = calculatePending(b.allocated, b.completed, b.wip);
        return sortOrder === 'desc' ? pB - pA : pA - pB;
      }

      if (sortBy === 'rework') {
        return sortOrder === 'desc' ? (b.rework || 0) - (a.rework || 0) : (a.rework || 0) - (b.rework || 0);
      }

      if (sortBy === 'completionRate') {
        const cA = calculateCompletionRate(a.completed, a.allocated);
        const cB = calculateCompletionRate(b.completed, b.allocated);
        return sortOrder === 'desc' ? cB - cA : cA - cB;
      }

      if (sortBy === 'productivityScore') {
        const prA = calculateProductivityScore(a).score;
        const prB = calculateProductivityScore(b).score;
        return sortOrder === 'desc' ? prB - prA : prA - prB;
      }

      if (sortBy === 'employeeId') {
        const numA = parseInt(a.employeeId.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.employeeId.replace(/\D/g, ''), 10) || 0;
        return sortOrder === 'desc' ? numB - numA : numA - numB;
      }

      if (sortBy === 'role') {
        const comp = (a.role || '').localeCompare(b.role || '');
        return sortOrder === 'desc' ? -comp : comp;
      }

      // Default: Employee Name
      const comp = (a.employeeName || '').localeCompare(b.employeeName || '');
      return sortOrder === 'desc' ? -comp : comp;
    });

    return result;
  }, [allRecords, columnFilters, sortBy, sortOrder]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedRecords.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedRecords, currentPage, pageSize]);

  // Dynamic calculations from filtered dataset
  const kpis = useMemo(() => {
    return calculateKpiSummary(filteredAndSortedRecords);
  }, [filteredAndSortedRecords]);

  // Bulk Selection Handlers
  const handleToggleSelect = (empId) => {
    setSelectedIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleSelectAllPage = (pageRecords) => {
    const pageIds = pageRecords.map(r => r.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Selected employee objects
  const selectedEmployeesList = useMemo(() => {
    return allRecords.filter(r => selectedIds.includes(r.id));
  }, [allRecords, selectedIds]);

  // Sort change handler
  const handleSortChange = (columnKey, direction) => {
    setSortBy(columnKey);
    setSortOrder(direction);
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleOpenReportModal = (employee) => {
    setSelectedEmployee(employee);
    setIsReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
  };

  const handleOpenCompareModal = () => {
    if (selectedIds.length < 2) {
      alert("Please select at least 2 employees using the table checkboxes to compare.");
      return;
    }
    setIsComparisonModalOpen(true);
  };

  const handleResetFilters = () => {
    setSortBy('employeeName');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setAllRecords(getEmployeeRecordsForDate(selectedDate));
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(timeString);
      setIsRefreshing(false);
    }, 400);
  };

  // Scope-based exports
  const handleExportCsv = (scope = 'current') => {
    if (scope === 'selected') {
      exportToCSV(selectedEmployeesList, `Daily_Allotment_${selectedDate}_Selected.csv`);
    } else if (scope === 'all') {
      exportToCSV(allRecords, `Daily_Allotment_${selectedDate}_All.csv`);
    } else {
      exportToCSV(filteredAndSortedRecords, `Daily_Allotment_${selectedDate}_Current.csv`);
    }
  };

  const handleExportExcel = (scope = 'current') => {
    if (scope === 'selected') {
      exportToExcel(selectedEmployeesList, `Daily_Allotment_${selectedDate}_Selected.xls`);
    } else if (scope === 'all') {
      exportToExcel(allRecords, `Daily_Allotment_${selectedDate}_All.xls`);
    } else {
      exportToExcel(filteredAndSortedRecords, `Daily_Allotment_${selectedDate}_Current.xls`);
    }
  };

  return (
    <div className="allotment-page-container">
      {/* 1. Page Header with Interactive Calendar */}
      <DailyReportHeader
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        maxDate={CURRENT_REPORT_DATE}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        onExportCsv={handleExportCsv}
        onExportExcel={handleExportExcel}
        selectedCount={selectedIds.length}
        onOpenCompare={handleOpenCompareModal}
      />

      {/* Historical Report Notice when past date is selected */}
      {selectedDate !== CURRENT_REPORT_DATE && (
        <div className="historical-report-banner">
          <div className="historical-banner-content">
            <Calendar size={16} className="text-amber-600" />
            <span>
              <strong>Historical Report Mode:</strong> Viewing archived production allotment records for <strong>{formatDisplayDate(selectedDate)}</strong>.
            </span>
          </div>
          <button
            type="button"
            className="btn-today-shortcut"
            onClick={() => handleDateChange(CURRENT_REPORT_DATE)}
          >
            Switch to Today's Live Report
          </button>
        </div>
      )}

      {/* 2. Quick Report KPI Cards */}
      <QuickReportCards kpis={kpis} />

      {/* 3. Manager Attention Panel */}
      <div style={{ marginBottom: '24px' }}>
        <ManagerAttentionPanel 
          records={filteredAndSortedRecords} 
          onSelectEmployee={handleSelectEmployee} 
        />
      </div>

      {/* 4. Insights Row: Role Performance & Status Distribution */}
      <div className="insights-row" style={{ marginBottom: '20px' }}>
        <RoleProgress records={filteredAndSortedRecords} />
        <StatusDistribution records={filteredAndSortedRecords} />
      </div>

      {/* 8. Allocation vs Completion Full Width Chart */}
      <div style={{ marginBottom: '24px' }}>
        <AllocationChart records={filteredAndSortedRecords} />
      </div>

      {/* Table Controls Bar: Column Visibility Toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '10px' }}>
        <ColumnVisibilityDropdown
          visibleColumns={visibleColumns}
          onToggleColumn={handleToggleColumn}
          onResetColumns={handleResetColumns}
        />
      </div>

      {/* 9. Employee Daily Allotment Table */}
      {isRefreshing ? (
        <SkeletonLoader rows={pageSize} />
      ) : (
        <>
          <DailyAllotmentTable
            records={paginatedRecords}
            filterRecords={allRecords}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            columnFilters={columnFilters}
            onColumnFilterChange={handleColumnFilterChange}
            onClearColumnFilter={handleClearColumnFilter}
            onClearAllColumnFilters={handleClearAllColumnFilters}
            totalFilteredCount={filteredAndSortedRecords.length}
            totalAllRecordsCount={allRecords.length}
            onSelectEmployee={handleSelectEmployee}
            selectedEmployeeId={selectedEmployee?.id}
            onResetFilters={handleClearAllColumnFilters}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAllPage={handleSelectAllPage}
            visibleColumns={visibleColumns}
            onOpenCompare={handleOpenCompareModal}
            onExportSelected={() => handleExportCsv('selected')}
            onClearSelection={handleClearSelection}
          />

          {filteredAndSortedRecords.length > 0 && (
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredAndSortedRecords.length}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </>
      )}

      {/* 10. Hourly Productivity & Recent Activity (Fixed Container Layout) */}
      <div className="bottom-insights-grid" style={{ marginTop: '24px' }}>
        <HourlyProductivity 
          records={allRecords}
          selectedDate={selectedDate}
          selectedSlot={selectedTwoHourSlot}
          onSelectSlot={setSelectedTwoHourSlot}
          onSelectEmployee={handleSelectEmployee}
        />
        <RecentActivity />
      </div>

      {/* 11. Slide-over Right Details Drawer */}
      <EmployeeDetailsDrawer
        employee={selectedEmployee}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onOpenReportModal={handleOpenReportModal}
      />

      {/* 12. Employee Full Report Modal */}
      <EmployeeReportModal
        employee={selectedEmployee}
        isOpen={isReportModalOpen}
        onClose={handleCloseReportModal}
      />

      {/* 13. Employee Performance Comparison Modal */}
      <EmployeeComparisonModal
        selectedEmployees={selectedEmployeesList}
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        onClearSelection={handleClearSelection}
      />

      {/* 14. 2-Hour Report Tracking Popup Modal */}
      <TwoHourReportModal
        isOpen={Boolean(selectedTwoHourSlot)}
        selectedSlot={selectedTwoHourSlot}
        onSelectSlot={setSelectedTwoHourSlot}
        selectedDate={selectedDate}
        records={allRecords}
        onClose={() => setSelectedTwoHourSlot(null)}
        onSelectEmployee={(emp) => {
          setSelectedTwoHourSlot(null);
          handleSelectEmployee(emp);
        }}
      />
    </div>
  );
}
