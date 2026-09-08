import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { ErrorProvider, useErrors } from './context/ErrorContext';
import { FeedbackProvider, useFeedback } from './context/FeedbackContext';
import { Layout } from './components/layout/Layout';
import { NavRoute } from './components/layout/Sidebar';
import { ErrorReportsPage } from './pages/ErrorReportsPage';
import { InternalFeedbackPage } from './pages/InternalFeedbackPage';
import { DashboardPage } from './components/other/DashboardPage';
import { BooksPage } from './components/other/BooksPage';
import { ProjectsPage } from './components/other/ProjectsPage';
import { ProductionPage } from './components/other/ProductionPage';
import { AccessibilityPage } from './components/other/AccessibilityPage';
import { QaValidationPage } from './components/other/QaValidationPage';

const AppContent: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState<NavRoute>('error-reports');
  const [isNewErrorModalOpen, setIsNewErrorModalOpen] = useState(false);
  const [isSubmitFeedbackModalOpen, setIsSubmitFeedbackModalOpen] = useState(false);

  const { errors, setSelectedError } = useErrors();
  const { feedback, setSelectedFeedback } = useFeedback();

  // Sync route with browser hash / history
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('/error-reports')) {
        setActiveRoute('error-reports');
        const match = hash.match(/\/error-reports\/(ERR-\d+)/);
        if (match) {
          const found = errors.find((e) => e.id === match[1]);
          if (found) setSelectedError(found);
        }
      } else if (hash.startsWith('/internal-feedback')) {
        setActiveRoute('internal-feedback');
        const match = hash.match(/\/internal-feedback\/(FDB-\d+)/);
        if (match) {
          const found = feedback.find((f) => f.id === match[1]);
          if (found) setSelectedFeedback(found);
        }
      } else if (hash === '/dashboard') {
        setActiveRoute('dashboard');
      } else if (hash === '/books') {
        setActiveRoute('books');
      } else if (hash === '/projects') {
        setActiveRoute('projects');
      } else if (hash === '/production') {
        setActiveRoute('production');
      } else if (hash === '/accessibility') {
        setActiveRoute('accessibility');
      } else if (hash === '/qa-validation') {
        setActiveRoute('qa-validation');
      } else {
        // Default route
        setActiveRoute('error-reports');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [errors, feedback, setSelectedError, setSelectedFeedback]);

  const handleNavigate = (route: NavRoute) => {
    setActiveRoute(route);
    window.location.hash = `/${route}`;
  };

  return (
    <Layout
      activeRoute={activeRoute}
      onRouteChange={handleNavigate}
      onNewErrorClick={() => setIsNewErrorModalOpen(true)}
      onNewFeedbackClick={() => setIsSubmitFeedbackModalOpen(true)}
    >
      {activeRoute === 'dashboard' && (
        <DashboardPage
          onNavigate={handleNavigate}
          onNewError={() => setIsNewErrorModalOpen(true)}
          onNewFeedback={() => setIsSubmitFeedbackModalOpen(true)}
        />
      )}

      {activeRoute === 'error-reports' && (
        <ErrorReportsPage
          isNewModalOpen={isNewErrorModalOpen}
          onOpenNewModal={() => setIsNewErrorModalOpen(true)}
          onCloseNewModal={() => setIsNewErrorModalOpen(false)}
        />
      )}

      {activeRoute === 'internal-feedback' && (
        <InternalFeedbackPage
          isSubmitModalOpen={isSubmitFeedbackModalOpen}
          onOpenSubmitModal={() => setIsSubmitFeedbackModalOpen(true)}
          onCloseSubmitModal={() => setIsSubmitFeedbackModalOpen(false)}
        />
      )}

      {activeRoute === 'books' && <BooksPage />}
      {activeRoute === 'projects' && <ProjectsPage />}
      {activeRoute === 'production' && <ProductionPage />}
      {activeRoute === 'accessibility' && <AccessibilityPage />}
      {activeRoute === 'qa-validation' && <QaValidationPage />}
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <ErrorProvider>
        <FeedbackProvider>
          <AppContent />
        </FeedbackProvider>
      </ErrorProvider>
    </ToastProvider>
  );
};

export default App;
