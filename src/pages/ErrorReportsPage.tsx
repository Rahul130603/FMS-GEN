import React, { useState } from 'react';
import { useErrors } from '../context/ErrorContext';
import { ErrorMetricsStrip } from '../components/errors/ErrorMetricsStrip';
import { ErrorViewsSidebar } from '../components/errors/ErrorViewsSidebar';
import { ErrorCardList } from '../components/errors/ErrorCardList';
import { ErrorInspector } from '../components/errors/ErrorInspector';
import { ReportIssueModal } from '../components/errors/ReportIssueModal';
import { AssignIssueModal } from '../components/errors/AssignIssueModal';
import { Button } from '../components/common/Button';
import { ErrorReport } from '../types/errors';
import {
  Plus,
  ChevronRight,
  SlidersHorizontal,
  X,
  Layers,
  ArrowLeft
} from 'lucide-react';

interface ErrorReportsPageProps {
  isNewModalOpen?: boolean;
  onOpenNewModal?: () => void;
  onCloseNewModal?: () => void;
}

export const ErrorReportsPage: React.FC<ErrorReportsPageProps> = ({
  isNewModalOpen,
  onOpenNewModal,
  onCloseNewModal
}) => {
  const { selectedError, setSelectedError } = useErrors();

  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const activeModalOpen = isNewModalOpen !== undefined ? isNewModalOpen : internalModalOpen;
  const handleOpenNewModal = onOpenNewModal || (() => setInternalModalOpen(true));
  const handleCloseNewModal = onCloseNewModal || (() => setInternalModalOpen(false));

  const [editingError, setEditingError] = useState<ErrorReport | null>(null);
  const [assigningError, setAssigningError] = useState<ErrorReport | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileInspector, setShowMobileInspector] = useState(false);

  const handleEdit = (error: ErrorReport) => {
    setEditingError(error);
  };

  const handleAssign = (error: ErrorReport) => {
    setAssigningError(error);
  };

  return (
    <div className="space-y-3.5 flex flex-col h-[calc(100vh-6rem)]">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between gap-4 pb-1 shrink-0">
        <div>
          {/* Small contextual breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-0.5">
            <span>Production</span>
            <ChevronRight size={11} className="text-slate-300" />
            <span className="text-slate-600 font-semibold">Issue Management</span>
          </div>

          <div className="flex items-baseline gap-3">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Error Reports
            </h1>
            <p className="hidden md:inline text-xs text-slate-500">
              Monitor and resolve production, EPUB and accessibility issues.
            </p>
          </div>
        </div>

        {/* Right Header Action */}
        <div className="flex items-center gap-2">
          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-md lg:hidden hover:bg-slate-50"
            aria-label="Toggle views and filters"
          >
            <SlidersHorizontal size={15} />
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenNewModal}
            icon={<Plus size={14} />}
            className="shadow-2xs font-semibold"
          >
            + Report Issue
          </Button>
        </div>
      </div>

      {/* 2. COMPACT METRICS STRIP */}
      <div className="shrink-0">
        <ErrorMetricsStrip />
      </div>

      {/* 3. MAIN WORKSPACE (3-COLUMN LAYOUT) */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden relative">
        {/* LEFT: Views & Filters Panel (~220px desktop) */}
        <div className="hidden lg:block shrink-0 h-full">
          <ErrorViewsSidebar />
        </div>

        {/* Mobile Views & Filters Drawer */}
        {showMobileSidebar && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex lg:hidden">
            <div className="w-64 bg-white h-full p-4 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">Views & Filters</span>
                <button
                  type="button"
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                <ErrorViewsSidebar />
              </div>
            </div>
            <div className="flex-1" onClick={() => setShowMobileSidebar(false)} />
          </div>
        )}

        {/* CENTER: Issue List (Flexible 45-50% desktop) */}
        <div className={`flex-1 h-full min-w-0 ${selectedError && showMobileInspector ? 'hidden md:flex' : 'flex'}`}>
          <ErrorCardList onOpenReportModal={onOpenNewModal} />
        </div>

        {/* RIGHT: Issue Inspector / Details (~35% desktop) */}
        <div
          className={`h-full ${
            selectedError && showMobileInspector
              ? 'fixed inset-0 z-40 bg-white p-4 flex flex-col'
              : 'hidden md:flex shrink-0'
          }`}
        >
          {/* Mobile Back Button when in inspector */}
          {showMobileInspector && (
            <div className="pb-2 border-b mb-2 flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setShowMobileInspector(false)}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600"
              >
                <ArrowLeft size={14} />
                <span>Back to Issue List</span>
              </button>
            </div>
          )}

          <ErrorInspector onEdit={handleEdit} onOpenAssign={handleAssign} />
        </div>
      </div>

      {/* 2-COLUMN REPORT ISSUE MODAL */}
      <ReportIssueModal
        isOpen={activeModalOpen || !!editingError}
        onClose={() => {
          if (activeModalOpen) handleCloseNewModal();
          if (editingError) setEditingError(null);
        }}
        initialData={editingError}
      />

      {/* ASSIGN ISSUE MODAL */}
      <AssignIssueModal
        isOpen={!!assigningError}
        onClose={() => setAssigningError(null)}
        error={assigningError}
      />
    </div>
  );
};
