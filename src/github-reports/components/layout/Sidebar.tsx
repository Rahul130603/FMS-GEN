import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FolderGit2,
  Cpu,
  Eye,
  CheckCheck,
  AlertTriangle,
  MessageSquarePlus,
  BookText,
  ChevronRight,
  ShieldCheck,
  FileCode
} from 'lucide-react';
import { useErrors } from '../../context/ErrorContext';
import { useFeedback } from '../../context/FeedbackContext';

export type NavRoute =
  | 'dashboard'
  | 'books'
  | 'projects'
  | 'production'
  | 'accessibility'
  | 'qa-validation'
  | 'error-reports'
  | 'internal-feedback';

interface SidebarProps {
  activeRoute: NavRoute;
  onRouteChange: (route: NavRoute) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeRoute,
  onRouteChange,
  isMobileOpen,
  onMobileClose
}) => {
  const { metrics: errorMetrics } = useErrors();
  const { metrics: feedbackMetrics } = useFeedback();

  const navItems = [
    {
      id: 'dashboard' as NavRoute,
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
      group: 'OVERVIEW'
    },
    {
      id: 'books' as NavRoute,
      label: 'Books',
      icon: <BookOpen size={18} />,
      group: 'PUBLISHING'
    },
    {
      id: 'projects' as NavRoute,
      label: 'Projects',
      icon: <FolderGit2 size={18} />,
      group: 'PUBLISHING'
    },
    {
      id: 'production' as NavRoute,
      label: 'Production',
      icon: <Cpu size={18} />,
      group: 'EPUB WORKFLOW'
    },
    {
      id: 'accessibility' as NavRoute,
      label: 'Accessibility',
      icon: <Eye size={18} />,
      group: 'EPUB WORKFLOW'
    },
    {
      id: 'qa-validation' as NavRoute,
      label: 'QA / Validation',
      icon: <CheckCheck size={18} />,
      badge: 'EPUB 3.2',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      group: 'EPUB WORKFLOW'
    },
    {
      id: 'error-reports' as NavRoute,
      label: 'Error Reports',
      icon: <AlertTriangle size={18} />,
      badge: errorMetrics.open.toString(),
      badgeColor: 'bg-rose-500 text-white font-bold',
      group: 'ISSUE & FEEDBACK'
    },
    {
      id: 'internal-feedback' as NavRoute,
      label: 'Internal Feedback',
      icon: <MessageSquarePlus size={18} />,
      badge: feedbackMetrics.newCount.toString(),
      badgeColor: 'bg-indigo-500 text-white font-bold',
      group: 'ISSUE & FEEDBACK'
    }
  ];

  const handleNavClick = (route: NavRoute) => {
    onRouteChange(route);
    onMobileClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static shrink-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md">
              <BookText size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                PubVantage
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  EPUB
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Production Studio</div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Main Navigation">
          {['OVERVIEW', 'PUBLISHING', 'EPUB WORKFLOW', 'ISSUE & FEEDBACK'].map((groupName) => {
            const items = navItems.filter((i) => i.group === groupName);
            if (items.length === 0) return null;

            return (
              <div key={groupName} className="space-y-1">
                <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {groupName}
                </div>
                <div className="space-y-0.5 pt-1">
                  {items.map((item) => {
                    const isActive = activeRoute === item.id;
                    const isNewHighlight = item.id === 'error-reports' || item.id === 'internal-feedback';

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`${
                              isActive
                                ? 'text-white'
                                : isNewHighlight
                                ? 'text-indigo-400 group-hover:text-indigo-300'
                                : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-white/20 text-white' : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Environment / Spec Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <div>
                <div className="font-medium text-slate-200 text-[11px]">EpubCheck 5.1 & Ace 1.3</div>
                <div className="text-[10px] text-slate-400">WCAG 2.1 AA Compliant</div>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Engine Active" />
          </div>
        </div>
      </aside>
    </>
  );
};
