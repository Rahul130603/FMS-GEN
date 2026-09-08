import React, { useState } from 'react';
import { Sidebar, NavRoute } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/ToastContainer';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: NavRoute;
  onRouteChange: (route: NavRoute) => void;
  onNewErrorClick?: () => void;
  onNewFeedbackClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeRoute,
  onRouteChange,
  onNewErrorClick,
  onNewFeedbackClick
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        activeRoute={activeRoute}
        onRouteChange={onRouteChange}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeRoute={activeRoute}
          onMobileMenuToggle={() => setIsMobileOpen(true)}
          onNewErrorClick={onNewErrorClick}
          onNewFeedbackClick={onNewFeedbackClick}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" id="main-content">
          <div className="max-w-7xl mx-auto w-full space-y-6">{children}</div>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
