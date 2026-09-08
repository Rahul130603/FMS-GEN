import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './github-reports/context/AuthContext';
import { PublishingProvider } from './github-reports/context/PublishingContext';
import { ToastProvider } from './github-reports/context/ToastContext';
import { ErrorProvider } from './github-reports/context/ErrorContext';
import { FeedbackProvider } from './github-reports/context/FeedbackContext';
import { ToastContainer } from './github-reports/components/common/ToastContainer';
import ErrorBoundary from './github-reports/components/common/ErrorBoundary';
import { MyReport } from './github-reports/pages/MyReport';
import { IncomingReport } from './github-reports/pages/IncomingReport';
import { DailyAllotmentPage } from './github-reports/pages/DailyAllotmentPage';
import { ReworkPage } from './github-reports/pages/ReworkPage';
import FeedbackDataGrid from './github-reports/components/FeedbackDataGrid';
import { DueDateDeliveryPage } from './github-reports/pages/DueDateDeliveryPage';
import { ErrorReportsPage } from './github-reports/pages/ErrorReportsPage';
import { InternalFeedbackPage } from './github-reports/pages/InternalFeedbackPage';
import { TechnicalQueryReportsPage } from './github-reports/pages/technicalQuery/TechnicalQueryReportsPage';
import { DeliveryProductionCountPage } from './github-reports/pages/DeliveryProductionCountPage';
import { Projects } from './github-reports/pages/Projects';
import './original-report-tailwind.css';

const pages = {
  'my-report': MyReport,
  'incoming-project-report': IncomingReport,
  'daily-allotment-status': DailyAllotmentPage,
  'rework-analysis': ReworkPage,
  'customer-feedback': FeedbackDataGrid,
  'due-date-delivery': DueDateDeliveryPage,
  'error-reports': ErrorReportsPage,
  'internal-feedback': InternalFeedbackPage,
  'technical-query-reports': TechnicalQueryReportsPage,
  'delivery-production-count': DeliveryProductionCountPage,
  'production-pipeline': Projects,
};

export default function GitHubReportPages({ activeReport, user }) {
  const Page = pages[activeReport] || MyReport;
  return <div className={`original-report github-reports report-${activeReport}`}>
    <ErrorBoundary key={activeReport}>
      <MemoryRouter>
        <AuthProvider user={user}>
          <PublishingProvider>
            <ToastProvider>
              <ErrorProvider>
                <FeedbackProvider>
                  <Page user={user} />
                  <ToastContainer />
                </FeedbackProvider>
              </ErrorProvider>
            </ToastProvider>
          </PublishingProvider>
        </AuthProvider>
      </MemoryRouter>
    </ErrorBoundary>
  </div>;
}
