import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { usePublishing } from '../../context/PublishingContext';

export function Topbar({ setMobileOpen }) {
  const { activities } = usePublishing();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate dynamic breadcrumb
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.includes('my-report')) {
      return [
        { label: 'Reports', to: '/reports/my-report' },
        { label: 'My Report', active: true }
      ];
    }
    if (path.includes('incoming')) {
      return [
        { label: 'Reports', to: '/reports/incoming' },
        { label: 'Incoming Project Report', active: true }
      ];
    }
    if (path.includes('projects')) {
      return [{ label: 'All Projects', active: true }];
    }
    return [{ label: 'Dashboard', active: true }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-subtle">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs">
          <Link to="/dashboard" className="text-slate-400 hover:text-slate-700 font-medium hidden sm:inline">
            PubFlow
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
              {crumb.active ? (
                <span className="font-bold text-slate-900">{crumb.label}</span>
              ) : (
                <Link to={crumb.to} className="text-slate-500 hover:text-brand-600 font-medium">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Quick Search, Date Badge, Notifications & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Global Live Date Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-brand-600" />
          <span>Fri, 04 Sep 2026</span>
        </div>

        {/* Department Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 border border-brand-200/70 rounded-lg text-xs font-semibold text-brand-800">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
          <span>Publishing Ops</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            type="button"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-elevated border border-slate-200 z-50 p-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <span className="text-[11px] text-brand-600 font-medium">All Read</span>
              </div>
              <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
                {activities.slice(0, 4).map((act, i) => (
                  <div key={i} className="p-2 rounded-lg hover:bg-slate-50 text-xs border border-transparent hover:border-slate-100 transition-colors">
                    <p className="font-semibold text-slate-800">{act.activity}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{act.project}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{act.timestamp}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-brand-600 font-semibold hover:underline"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
