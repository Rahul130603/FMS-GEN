import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BookOpen,
  LayoutDashboard,
  FileSpreadsheet,
  FileCheck2,
  Inbox,
  BarChart3,
  Layers,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  Menu,
  X,
  RotateCcw,
  CalendarCheck2,
  MessageSquareText,
  Clock8,
  AlertOctagon,
  MessageSquarePlus,
  LifeBuoy,
  Truck
} from 'lucide-react';
import { usePublishing } from '../../context/PublishingContext';

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const { incomingProjects, myProjects } = usePublishing();
  const location = useLocation();
  const [reportsOpen, setReportsOpen] = useState(true);

  // Incoming count needing assignment
  const unassignedCount = incomingProjects.filter(p => p.status === 'New' || p.status === 'Ready for Assignment' || p.status === 'Under Review').length;
  // Overdue or due today count for current user
  const today = '2026-09-04';
  const urgentMyCount = myProjects.filter(p => p.dueDate <= today && p.status !== 'Completed').length;

  const isReportsActive = location.pathname.startsWith('/reports');

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
      isActive
        ? 'bg-brand-600 text-white shadow-xs font-bold'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const subNavLinkClass = ({ isActive }) =>
    `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? 'bg-brand-50 text-brand-700 font-bold border-l-2 border-brand-600 pl-2.5'
        : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-800'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 tracking-tight block">
                PubFlow <span className="text-brand-600">FMS</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide block uppercase">
                Digital Publishing Engine
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation Section */}
          <div>
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Main Menu
            </span>
            <nav className="space-y-1" aria-label="Main Navigation">
              <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/projects" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                <Layers className="w-4 h-4 shrink-0" />
                <span>All Projects</span>
              </NavLink>
            </nav>
          </div>

          {/* Reports Section with Submenu */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Reports & Analytics
              </span>
              <button
                type="button"
                onClick={() => setReportsOpen(prev => !prev)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Toggle reports submenu"
              >
                {reportsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {reportsOpen && (
              <div className="space-y-1 pl-1">
                {/* My Report */}
                <NavLink
                  to="/reports/my-report"
                  onClick={() => setMobileOpen(false)}
                  className={subNavLinkClass}
                >
                  <div className="flex items-center gap-2.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span>My Report</span>
                  </div>
                  {urgentMyCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700">
                      {urgentMyCount}
                    </span>
                  )}
                </NavLink>

                {/* Incoming Project Report */}
                <NavLink
                  to="/reports/incoming"
                  onClick={() => setMobileOpen(false)}
                  className={subNavLinkClass}
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Incoming Project Report</span>
                  </div>
                  {unassignedCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-brand-100 text-brand-800">
                      {unassignedCount} new
                    </span>
                  )}
                </NavLink>

                {/* Daily Allotment Status */}
                <NavLink
                  to="/reports/daily-allotment"
                  onClick={() => setMobileOpen(false)}
                  className={subNavLinkClass}
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Daily Allotment Status</span>
                  </div>
                </NavLink>

                {/* Rework Round Analysis */}
                <NavLink
                  to="/reports/rework"
                  onClick={() => setMobileOpen(false)}
                  className={subNavLinkClass}
                >
                  <div className="flex items-center gap-2.5">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Rework Analysis</span>
                  </div>
                </NavLink>

                {/* Due Date Delivery Report */}
                <NavLink
                  to="/reports/due-date-delivery"
                  onClick={() => setMobileOpen(false)}
                  className={subNavLinkClass}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock8 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Due Date Delivery</span>
                  </div>
                </NavLink>

                {/* Customer Feedback Report */}
                <NavLink
                  to="/reports/customer-feedback"
                  onClick={() => setMobileOpen(false)}
                  className={subNavLinkClass}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquareText className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                    <span>Customer Feedback</span>
                  </div>
                </NavLink>

                {/* Error Reports */}
                <NavLink
                  to="/reports/error-reports"
                  onClick={() => setMobileOpen(false)}
                  className={subNavLinkClass}
                >
                  <div className="flex items-center gap-2.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Error Reports</span>
                  </div>
                </NavLink>

                {/* Internal Feedback */}
                <NavLink
                  to="/reports/internal-feedback"
                  onClick={() => setMobileOpen(false)}
                  className={subNavLinkClass}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquarePlus className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Internal Feedback</span>
                  </div>
                </NavLink>

                {/* Technical Query Reports */}
                <NavLink
                  to="/reports/technical-queries"
                  onClick={() => setMobileOpen(false)}
                  className={subNavLinkClass}
                >
                  <div className="flex items-center gap-2.5">
                    <LifeBuoy className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Technical Query Reports</span>
                  </div>
                </NavLink>

                <NavLink
                  to="/reports/delivery-production-count"
                  onClick={() => setMobileOpen(false)}
                  className={subNavLinkClass}
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Delivery Production Count</span>
                  </div>
                </NavLink>

                {/* Production Overview */}
                <NavLink
                  to="/reports/production"
                  onClick={() => setMobileOpen(false)}
                  className={subNavLinkClass}
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Production Pipeline</span>
                  </div>
                </NavLink>
              </div>
            )}
          </div>

          {/* Support & Issue Tracking Section */}
          <div>
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Support & Issue Tracking
            </span>
            <nav className="space-y-1">
              <NavLink to="/technical-query/dashboard" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                <LifeBuoy className="w-4 h-4 shrink-0" />
                <span>Technical Query Desk</span>
              </NavLink>

              <NavLink to="/technical-query/my-queries" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>My Queries</span>
              </NavLink>
            </nav>
          </div>

          {/* Administration Section */}
          <div>
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Management
            </span>
            <nav className="space-y-1">
              <NavLink to="/clients" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Clients & Publishers</span>
              </NavLink>

              <NavLink to="/team" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                <Users className="w-4 h-4 shrink-0" />
                <span>Production Team</span>
              </NavLink>

              <NavLink to="/settings" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* System Status Pill */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Production Grid Online
            </span>
            <span className="font-mono text-slate-400">v2.4.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
