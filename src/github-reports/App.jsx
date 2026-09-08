import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { MyReport } from './pages/MyReport';
import { IncomingReport } from './pages/IncomingReport';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { NotFound } from './pages/NotFound';
import FeedbackDataGrid from './components/FeedbackDataGrid';
import { ErrorReportsPage } from './pages/ErrorReportsPage';
import { InternalFeedbackPage } from './pages/InternalFeedbackPage';
import { ReworkPage } from './pages/ReworkPage';
import { DailyAllotmentPage } from './pages/DailyAllotmentPage';
import { DueDateDeliveryPage } from './pages/DueDateDeliveryPage';
import { TechnicalQueryDashboard } from './pages/technicalQuery/TechnicalQueryDashboard';
import { RaiseQueryPage } from './pages/technicalQuery/RaiseQueryPage';
import { MyQueriesPage } from './pages/technicalQuery/MyQueriesPage';
import { TechnicalQueryReportsPage } from './pages/technicalQuery/TechnicalQueryReportsPage';
import { DeliveryProductionCountPage } from './pages/DeliveryProductionCountPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/reports/my-report" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports/my-report" element={<MyReport />} />
        <Route path="/reports/incoming" element={<IncomingReport />} />

        {/* Integrated Developer Branch Pages */}
        <Route path="/reports/daily-allotment" element={<DailyAllotmentPage />} />
        <Route path="/reports/rework" element={<ReworkPage />} />
        <Route path="/reports/customer-feedback" element={<FeedbackDataGrid />} />
        <Route path="/reports/due-date-delivery" element={<DueDateDeliveryPage />} />
        <Route path="/reports/error-reports" element={<ErrorReportsPage />} />
        <Route path="/reports/internal-feedback" element={<InternalFeedbackPage />} />
        <Route path="/reports/technical-queries" element={<TechnicalQueryReportsPage />} />
        <Route path="/reports/delivery-production-count" element={<DeliveryProductionCountPage />} />

        {/* Technical Query Operations */}
        <Route path="/technical-query/dashboard" element={<TechnicalQueryDashboard />} />
        <Route path="/technical-query/raise" element={<RaiseQueryPage />} />
        <Route path="/technical-query/my-queries" element={<MyQueriesPage />} />

        <Route path="/reports/production" element={<Projects />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/clients" element={<Projects />} />
        <Route path="/team" element={<Projects />} />
        <Route path="/settings" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
