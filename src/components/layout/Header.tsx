import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Search,
  Book,
  Plus,
  ChevronDown,
  User,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';
import { INITIAL_BOOKS } from '../../data/initialBooks';
import { NavRoute } from './Sidebar';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  activeRoute: NavRoute;
  onNewErrorClick?: () => void;
  onNewFeedbackClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onMobileMenuToggle,
  activeRoute,
  onNewErrorClick,
  onNewFeedbackClick
}) => {
  const [selectedBook, setSelectedBook] = useState<string>('All Active Projects');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Left section: mobile hamburger & active book selector */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Book / Project Quick Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-expanded={isDropdownOpen}
          >
            <Book size={14} className="text-indigo-600 shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">{selectedBook}</span>
            <ChevronDown size={12} className="text-slate-400 shrink-0" />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Active Publishing Projects
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedBook('All Active Projects');
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-700 hover:text-indigo-600 font-medium"
              >
                <span>All Active Projects{INITIAL_BOOKS.length > 0 ? ` (${INITIAL_BOOKS.length} Books)` : ''}</span>
                {selectedBook === 'All Active Projects' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
              </button>
              {INITIAL_BOOKS.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => {
                    setSelectedBook(book.title);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-700 hover:text-indigo-600"
                >
                  <div className="truncate pr-2">
                    <div className="font-medium truncate">{book.title}</div>
                    <div className="text-[10px] text-slate-400">{book.projectCode} • {book.format}</div>
                  </div>
                  {selectedBook === book.title && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right section: Global Actions & User Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick Create Buttons on Header if on other pages */}
        {activeRoute !== 'error-reports' && onNewErrorClick && (
          <button
            type="button"
            onClick={onNewErrorClick}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
          >
            <Plus size={13} />
            <span>New Error</span>
          </button>
        )}

        {activeRoute !== 'internal-feedback' && onNewFeedbackClick && (
          <button
            type="button"
            onClick={onNewFeedbackClick}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
          >
            <Plus size={13} />
            <span>Submit Feedback</span>
          </button>
        )}

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Notifications (3 unread)"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="Priya S."
            className="w-8 h-8 rounded-full ring-2 ring-indigo-500/20 object-cover"
          />
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">Priya S.</div>
            <div className="text-[11px] text-slate-500">Accessibility Lead</div>
          </div>
        </div>
      </div>
    </header>
  );
};
