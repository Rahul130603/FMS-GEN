import React, { useState, useEffect, useCallback } from 'react';
import ReworkHeader from '../components/rework/ReworkHeader';
import FilterPanel from '../components/rework/FilterPanel';
import ProfileHero from '../components/rework/ProfileHero';
import KpiGrid from '../components/rework/KpiGrid';
import DonutChart from '../components/rework/DonutChart';
import StageBarChart from '../components/rework/StageBarChart';
import TrendChart from '../components/rework/TrendChart';
import WorkbenchTable from '../components/rework/WorkbenchTable';
import ReviewersTable from '../components/rework/ReviewersTable';
import ComparisonTable from '../components/rework/ComparisonTable';
import ReasonDonuts from '../components/rework/ReasonDonuts';
import CorrectionModal from '../components/rework/CorrectionModal';
import ReworkToast from '../components/rework/ReworkToast';

import { 
  fetchReworkHealth, 
  fetchReworkEmployees, 
  fetchReworkDashboard, 
  resolveReworkFile 
} from '../services/reworkMetricsService';

const getToday = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return { iso: `${y}-${m}-${d}`, display: `${d}-${m}-${y}` };
};

export function ReworkPage() {
  const initialDate = getToday();
  const [period, setPeriod] = useState('day');
  const [date, setDate] = useState(initialDate.display);
  const [dateIso, setDateIso] = useState(initialDate.iso);
  const [employee, setEmployee] = useState('');
  const [role, setRole] = useState('All');
  const [status, setStatus] = useState('All');

  const [employees, setEmployees] = useState([]);
  const [data, setData] = useState(null);
  const [modalFile, setModalFile] = useState(null);
  const [backendOnline, setBackendOnline] = useState(true);
  const [toast, setToast] = useState({ message: '', visible: false });

  const showToast = useCallback((msg) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2500);
  }, []);

  // Check health and load employees on mount
  useEffect(() => {
    async function loadInitial() {
      try {
        const health = await fetchReworkHealth();
        setBackendOnline(health?.status === 'ok');

        const emps = await fetchReworkEmployees();
        setEmployees(emps);
      } catch (err) {
        console.warn('Backend server not yet ready, will retry:', err);
        setBackendOnline(false);
      }
    }
    loadInitial();
  }, []);

  // Fetch Dashboard Data whenever filters change
  const refreshDashboard = useCallback(async () => {
    try {
      const result = await fetchReworkDashboard(employee, date, period, { role, status });
      setData(result);
      setBackendOnline(true);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setBackendOnline(false);
    }
  }, [employee, date, period, role, status]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Date Change Handlers
  const handleDateChange = (isoVal) => {
    if (!isoVal) return;
    setDateIso(isoVal);
    const parts = isoVal.split('-');
    if (parts.length === 3) {
      const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
      setDate(formatted);
      showToast(`Date changed to ${formatted}`);
    }
  };

  const navigateDate = (step) => {
    let dt = new Date();
    if (date.includes('-')) {
      const parts = date.split('-');
      if (parts[0].length === 4) {
        dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        dt = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }

    if (period === 'month') {
      dt.setMonth(dt.getMonth() + step);
    } else if (period === 'week') {
      dt.setDate(dt.getDate() + (step * 7));
    } else {
      dt.setDate(dt.getDate() + step);
    }

    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    handleDateChange(`${y}-${m}-${d}`);
  };

  const setTodayDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    handleDateChange(`${y}-${m}-${d}`);
  };

  // 1-Click File Resolution
  const handleQuickResolve = async (fileId) => {
    try {
      showToast(`Saving resolution for file ${fileId}...`);
      await resolveReworkFile(employee, fileId);
      showToast(`File ${fileId} marked as Corrected`);
      await refreshDashboard();
    } catch (err) {
      showToast('Resolution error: ' + err.message);
    }
  };

  const handleResetFilters = async () => {
    const today = getToday();
    setPeriod('day');
    setDate(today.display);
    setDateIso(today.iso);
    setEmployee('');
    setRole('All');
    setStatus('All');
    showToast('Filters reset to default');
  };

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <ReworkHeader
        period={period}
        setPeriod={setPeriod}
        date={date}
        dateIso={dateIso}
        onDateChange={handleDateChange}
        navigateDate={navigateDate}
        employee={employee}
        setEmployee={setEmployee}
        employees={employees}
        displayInfo={data?.displayInfo}
        backendOnline={backendOnline}
      />

      {/* 2. Filter Operations Desk */}
      <FilterPanel
        dateIso={dateIso}
        onDateChange={handleDateChange}
        navigateDate={navigateDate}
        setTodayDate={setTodayDate}
        displayInfo={data?.displayInfo}
        employee={employee}
        setEmployee={setEmployee}
        employees={employees}
        role={role}
        setRole={setRole}
        status={status}
        setStatus={setStatus}
        onReset={handleResetFilters}
      />

      {/* Main Content Area */}
      <div className="space-y-4 pb-8">
        {/* 3. Employee Profile Hero Card */}
        <ProfileHero
          employee={employee}
          employees={employees}
          kpis={data?.kpis}
          status={status}
          setStatus={setStatus}
          displayInfo={data?.displayInfo}
        />

        {/* 4. Operational Defect KPI Cards */}
        <KpiGrid kpis={data?.kpis} />

        {/* 5. Charts Row (Donut, Grouped Bars, Trend) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DonutChart distribution={data?.distribution} />
          <StageBarChart stageWise={data?.stage_wise} />
          <TrendChart dailyTrend={data?.daily_trend} displayInfo={data?.displayInfo} />
        </div>

        {/* 6. Candidate File Workbench Table */}
        <WorkbenchTable
          files={data?.files}
          onSelectFile={setModalFile}
          onQuickResolve={handleQuickResolve}
          kpis={data?.kpis}
          period={period}
        />

        {/* 7. Reviewers & Employee Comparisons Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-4">
            <ReviewersTable reviewers={data?.reviewers} employees={employees} />
          </div>
          <div className="lg:col-span-8">
            <ComparisonTable 
              comparison={data?.comparison} 
              currentEmployee={employee} 
              displayInfo={data?.displayInfo} 
            />
          </div>
        </div>

        {/* 8. Rework & Reject Reason Breakdown Donuts */}
        <ReasonDonuts 
          reworkReasons={data?.rework_reasons} 
          rejectReasons={data?.reject_reasons} 
        />
      </div>

      {/* File Inspector Modal */}
      {modalFile && (
        <CorrectionModal
          file={modalFile}
          onClose={() => setModalFile(null)}
          onResolve={async (fId) => {
            await handleQuickResolve(fId);
            setModalFile(null);
          }}
        />
      )}

      {/* Toast Alert */}
      <ReworkToast message={toast.message} visible={toast.visible} />
    </div>
  );
}

export default ReworkPage;
