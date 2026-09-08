import React, { useState } from 'react';
import { useFeedback } from '../context/FeedbackContext';
import { FeedbackSummaryCards } from '../components/feedback/FeedbackSummaryCards';
import { FeedbackFilterBar } from '../components/feedback/FeedbackFilterBar';
import { FeedbackTable } from '../components/feedback/FeedbackTable';
import { FeedbackDetailDrawer } from '../components/feedback/FeedbackDetailDrawer';
import { SubmitFeedbackModal } from '../components/feedback/SubmitFeedbackModal';
import { FeedbackStatusModal } from '../components/feedback/FeedbackStatusModal';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { InternalFeedbackItem } from '../types/feedback';
import { MessageSquarePlus, Plus } from 'lucide-react';

interface InternalFeedbackPageProps {
  isSubmitModalOpen?: boolean;
  onOpenSubmitModal?: () => void;
  onCloseSubmitModal?: () => void;
}

export const InternalFeedbackPage: React.FC<InternalFeedbackPageProps> = ({
  isSubmitModalOpen,
  onOpenSubmitModal,
  onCloseSubmitModal
}) => {
  const [internalSubmitOpen, setInternalSubmitOpen] = useState(false);
  const activeSubmitOpen = isSubmitModalOpen !== undefined ? isSubmitModalOpen : internalSubmitOpen;
  const handleOpenSubmit = onOpenSubmitModal || (() => setInternalSubmitOpen(true));
  const handleCloseSubmit = onCloseSubmitModal || (() => setInternalSubmitOpen(false));
  const {
    filteredFeedback,
    page,
    pageSize,
    totalPages,
    totalCount,
    setPage,
    setPageSize,
    clearFilters
  } = useFeedback();

  const [editingFeedback, setEditingFeedback] = useState<InternalFeedbackItem | null>(null);
  const [statusModalFeedback, setStatusModalFeedback] = useState<InternalFeedbackItem | null>(null);

  const handleEdit = (item: InternalFeedbackItem) => {
    setEditingFeedback(item);
  };

  const handleChangeStatus = (item: InternalFeedbackItem) => {
    setStatusModalFeedback(item);
  };

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <MessageSquarePlus size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Internal Feedback
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Share ideas, workflow improvements, and internal feedback to continuously improve the publishing process.
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenSubmit}
            icon={<Plus size={16} />}
            className="shadow-sm font-semibold"
          >
            + Submit Feedback
          </Button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <FeedbackSummaryCards />

      {/* 3. SEARCH + FILTER TOOLBAR */}
      <FeedbackFilterBar />

      {/* 4. FEEDBACK LIST TABLE */}
      <div className="space-y-0 shadow-xs rounded-xl overflow-hidden">
        <FeedbackTable
          onEdit={handleEdit}
          onChangeStatus={handleChangeStatus}
          onAddComment={handleChangeStatus}
        />

        {/* PAGINATION */}
        {totalCount > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* 5. FEEDBACK DETAIL DRAWER */}
      <FeedbackDetailDrawer
        onEdit={handleEdit}
        onChangeStatusModal={handleChangeStatus}
      />

      {/* 6. SUBMIT / EDIT FEEDBACK MODAL */}
      <SubmitFeedbackModal
        isOpen={activeSubmitOpen || !!editingFeedback}
        onClose={() => {
          if (activeSubmitOpen) handleCloseSubmit();
          if (editingFeedback) setEditingFeedback(null);
        }}
        initialData={editingFeedback}
      />

      {/* 7. STATUS MANAGEMENT MODAL */}
      {statusModalFeedback && (
        <FeedbackStatusModal
          isOpen={!!statusModalFeedback}
          onClose={() => setStatusModalFeedback(null)}
          feedback={statusModalFeedback}
        />
      )}
    </div>
  );
};
