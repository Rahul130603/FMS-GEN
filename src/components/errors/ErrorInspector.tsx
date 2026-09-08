import React, { useState } from 'react';
import { useErrors } from '../../context/ErrorContext';
import { useToast } from '../../context/ToastContext';
import { ErrorReport } from '../../types/errors';
import { Attachment } from '../../types/common';
import { ProjectTypeBadge, ErrorStatusBadge, PriorityBadge } from '../common/Badge';
import { formatDate, formatDateTime, getDaysRemaining } from '../../utils/formatters';
import { downloadAttachment } from '../../utils/exportUtils';
import { Button } from '../common/Button';
import {
  BookOpen,
  Paperclip,
  CheckCircle2,
  Clock,
  RotateCcw,
  Edit3,
  UserCheck,
  Trash2,
  Download,
  ArrowRight,
  CheckCheck,
  Server,
  FileCode,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface ErrorInspectorProps {
  onEdit: (error: ErrorReport) => void;
  onOpenAssign: (error: ErrorReport) => void;
}

export const ErrorInspector: React.FC<ErrorInspectorProps> = ({ onEdit, onOpenAssign }) => {
  const {
    selectedError,
    changeStatus,
    resolveError,
    verifyError,
    reopenError,
    deleteError,
    addComment
  } = useErrors();
  const { addToast } = useToast();

  const [commentText, setCommentText] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeActionModal, setActiveActionModal] = useState<'resolve' | 'verify' | 'reopen' | null>(null);

  // Form states for status transition
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [fixedBy, setFixedBy] = useState('Priya S.');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('Rahul M.');
  const [reopenReason, setReopenReason] = useState('');

  const handleDownloadFile = async (file: Attachment) => {
    await downloadAttachment(file, (title, desc, type) => {
      addToast(title, desc || '', type || 'info');
    });
  };

  if (!selectedError) {
    return (
      <div className="w-full lg:w-[380px] xl:w-[420px] bg-white rounded-lg border border-slate-200 p-8 flex flex-col items-center justify-center text-center text-xs text-slate-400">
        <BookOpen size={32} className="text-slate-300 mb-2" />
        <p className="font-medium text-slate-600">Select an issue to inspect details</p>
        <p className="text-[11px] text-slate-400 mt-1">Use arrow keys or click on a card from the center list.</p>
      </div>
    );
  }

  const dueInfo = getDaysRemaining(selectedError.dueDate);
  const isOverdue = dueInfo.isOverdue && selectedError.status !== 'Resolved' && selectedError.status !== 'Closed' && selectedError.status !== 'Verified';

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(selectedError.id, commentText.trim(), 'Priya S.', 'Lead Accessibility Engineer');
    setCommentText('');
  };

  const handleStartFix = () => {
    changeStatus(selectedError.id, 'In Progress', 'Fix initiated by engineer.', 'Priya S.');
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    resolveError(selectedError.id, resolutionNotes || 'Defect resolved and verified against production standards.', fixedBy);
    setActiveActionModal(null);
    setResolutionNotes('');
  };

  const handleConfirmVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyError(selectedError.id, verificationNotes || 'Verified all checklist criteria in reader preview.', verifiedBy, true);
    setActiveActionModal(null);
    setVerificationNotes('');
  };

  const handleConfirmReopen = (e: React.FormEvent) => {
    e.preventDefault();
    reopenError(selectedError.id, reopenReason || 'Defect still reproducing in target environment.', 'Rahul M.');
    setActiveActionModal(null);
    setReopenReason('');
  };

  return (
    <div className="w-full lg:w-[380px] xl:w-[420px] bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col shrink-0 h-full overflow-hidden text-xs">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/70 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
              {selectedError.id}
            </span>
            <ProjectTypeBadge projectType={selectedError.projectType} size="sm" />
            <PriorityBadge priority={selectedError.priority} size="sm" />
            <ErrorStatusBadge status={selectedError.status} size="sm" />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(selectedError)}
              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 rounded"
              title="Edit Issue"
              aria-label="Edit Issue"
            >
              <Edit3 size={13} />
            </button>
            <button
              type="button"
              onClick={() => onOpenAssign(selectedError)}
              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 rounded"
              title="Assign Issue"
              aria-label="Assign Issue"
            >
              <UserCheck size={13} />
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-200/60 rounded"
              title="Delete Issue"
              aria-label="Delete Issue"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <h2 className="text-sm font-bold text-slate-900 leading-snug">
          ISBN: {selectedError.isbnNumber}
        </h2>
        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
          {selectedError.projectType} Issue • {selectedError.chapter}
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 divide-y divide-slate-100">
        {/* 1. PRODUCTION CONTEXT */}
        <div className="space-y-2 pt-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Production Context
          </div>
          <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200/80 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">PROJECT TYPE</span>
                <span className="font-semibold text-slate-800">
                  {selectedError.projectType}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">ISBN NUMBER</span>
                <span className="font-mono text-slate-800 font-semibold">{selectedError.isbnNumber}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 block">CHAPTER</span>
                <span className="text-slate-800 font-medium">{selectedError.chapter}</span>
              </div>
            </div>

            {/* Server Location */}
            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-[10px] text-slate-400 block mb-0.5">SERVER LOCATION</span>
              <div className="font-mono text-[11px] bg-slate-900 text-emerald-400 px-2 py-1 rounded border border-slate-800 flex items-center justify-between">
                <span className="truncate" title={selectedError.serverLocation}>{selectedError.serverLocation}</span>
                <Server size={12} className="text-emerald-500 shrink-0 ml-1.5" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. ISSUE DIAGNOSTICS & DESCRIPTION */}
        <div className="space-y-2.5 pt-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Description & Findings
          </div>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-2.5 rounded border border-slate-200/60">
            {selectedError.description}
          </p>

          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-emerald-700">Expected Result</div>
            <div className="text-[11px] text-slate-700 bg-emerald-50/50 p-2 rounded border border-emerald-200/60 leading-relaxed">
              {selectedError.expectedResult}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-rose-700">Actual Result</div>
            <div className="text-[11px] text-slate-700 bg-rose-50/50 p-2 rounded border border-rose-200/60 leading-relaxed">
              {selectedError.actualResult}
            </div>
          </div>
        </div>

        {/* 3. EVIDENCE & ATTACHMENTS */}
        <div className="space-y-2 pt-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Evidence & Files</span>
            <span className="font-mono text-[10px]">{selectedError.attachments.length} files</span>
          </div>

          {selectedError.attachments.length === 0 ? (
            <div className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded text-center">
              No evidence files attached
            </div>
          ) : (
            <div className="space-y-1.5">
              {selectedError.attachments.map((file) => {
                const isImg = file.type?.startsWith('image/');
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isImg ? (
                        <ImageIcon size={13} className="text-indigo-600 shrink-0" />
                      ) : (
                        <FileText size={13} className="text-slate-500 shrink-0" />
                      )}
                      <span className="font-medium text-slate-800 text-[11px] truncate" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">({file.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                      title={`Download ${file.name}`}
                      aria-label={`Download ${file.name}`}
                    >
                      <Download size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. ASSIGNMENT & METADATA */}
        <div className="space-y-2 pt-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Assignment & Metadata
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-md border border-slate-200/80">
            <div>
              <span className="text-[10px] text-slate-400 block">REPORTED BY</span>
              <span className="font-medium text-slate-800">{selectedError.reportedBy}</span>
              <span className="text-[10px] text-slate-400 block">{selectedError.source}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">ASSIGNED TO</span>
              <span className="font-semibold text-slate-900">{selectedError.assignedTo}</span>
              <span className="text-[10px] text-slate-400 block">{selectedError.team}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">PRIORITY</span>
              <PriorityBadge priority={selectedError.priority} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">DUE DATE</span>
              <span className="font-medium text-slate-800">{formatDate(selectedError.dueDate)}</span>
              {isOverdue && <span className="text-[10px] font-bold text-rose-600 block">{dueInfo.label}</span>}
            </div>
          </div>
        </div>

        {/* 5. STATUS WORKFLOW CONTROL */}
        <div className="space-y-2 pt-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workflow Status
          </div>

          <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/80 space-y-2.5">
            {/* Workflow status stepper */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
              <span className={selectedError.status === 'Open' ? 'font-bold text-sky-700' : ''}>Open</span>
              <ArrowRight size={10} className="text-slate-300" />
              <span className={selectedError.status === 'In Progress' ? 'font-bold text-indigo-700' : ''}>In Progress</span>
              <ArrowRight size={10} className="text-slate-300" />
              <span className={selectedError.status === 'Resolved' ? 'font-bold text-emerald-700' : ''}>Resolved</span>
              <ArrowRight size={10} className="text-slate-300" />
              <span className={selectedError.status === 'Verified' || selectedError.status === 'Closed' ? 'font-bold text-teal-700' : ''}>
                {selectedError.status === 'Closed' ? 'Closed' : 'Verified'}
              </span>
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-slate-200/60">
              {selectedError.status === 'Open' && (
                <>
                  <Button variant="primary" size="sm" onClick={handleStartFix} icon={<Clock size={12} />}>
                    Start Fix
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setActiveActionModal('resolve')}
                    icon={<CheckCircle2 size={12} />}
                  >
                    Mark Resolved
                  </Button>
                </>
              )}

              {selectedError.status === 'In Progress' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => setActiveActionModal('resolve')}
                  icon={<CheckCircle2 size={12} />}
                >
                  Mark Resolved
                </Button>
              )}

              {selectedError.status === 'Resolved' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveActionModal('verify')}
                    icon={<CheckCheck size={12} />}
                  >
                    Verify & Close
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveActionModal('reopen')}
                    icon={<RotateCcw size={12} />}
                  >
                    Reopen
                  </Button>
                </>
              )}

              {(selectedError.status === 'Verified' || selectedError.status === 'Closed') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveActionModal('reopen')}
                  icon={<RotateCcw size={12} />}
                >
                  Reopen Issue
                </Button>
              )}

              {selectedError.status === 'Reopened' && (
                <>
                  <Button variant="primary" size="sm" onClick={handleStartFix} icon={<Clock size={12} />}>
                    Start Fix
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setActiveActionModal('resolve')}
                    icon={<CheckCircle2 size={12} />}
                  >
                    Resolve
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 6. ACTIVITY TIMELINE */}
        <div className="space-y-2 pt-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Activity Timeline
          </div>
          <div className="relative pl-4 space-y-2.5 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-0.5 before:bg-slate-200">
            {selectedError.timeline.map((item) => (
              <div key={item.id} className="relative text-[11px]">
                <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-slate-400 border border-white" />
                <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                  <span>{formatDateTime(item.timestamp)}</span>
                </div>
                <div className="font-semibold text-slate-800 mt-0.5">{item.title}</div>
                {item.details && (
                  <p className="text-slate-600 text-[10px] mt-0.5 font-mono bg-slate-50 p-1 rounded border border-slate-200/50">
                    {item.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 7. INTERNAL DISCUSSION / COMMENTS */}
        <div className="space-y-2 pt-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Internal Remarks ({selectedError.comments.length})
          </div>

          <div className="space-y-2">
            {selectedError.comments.map((c) => (
              <div key={c.id} className="p-2 bg-slate-50 rounded border border-slate-200/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{c.author}</span>
                  <span className="text-[10px] font-mono text-slate-400">{formatDateTime(c.createdAt)}</span>
                </div>
                <p className="text-slate-700 leading-snug">{c.content}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handlePostComment} className="pt-1 flex gap-1.5">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Post an internal note..."
              className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="px-2.5 py-1 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              Post
            </button>
          </form>
        </div>
      </div>

      {/* Action Modals */}
      {activeActionModal === 'resolve' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmResolve}
            className="bg-white rounded-lg shadow-xl border border-slate-200 p-4 max-w-sm w-full space-y-3 text-xs animate-in zoom-in-95 duration-100"
          >
            <h3 className="font-bold text-slate-900">Mark as Resolved — {selectedError.id}</h3>
            <div>
              <label className="block text-slate-500 mb-1">Fixed By</label>
              <input
                type="text"
                value={fixedBy}
                onChange={(e) => setFixedBy(e.target.value)}
                className="w-full p-1.5 border border-slate-300 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Resolution Notes</label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe fix applied (e.g. Added alt tag to figure 4.2)..."
                className="w-full p-1.5 border border-slate-300 rounded"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" size="sm" onClick={() => setActiveActionModal(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="success" size="sm">
                Confirm Resolution
              </Button>
            </div>
          </form>
        </div>
      )}

      {activeActionModal === 'verify' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmVerify}
            className="bg-white rounded-lg shadow-xl border border-slate-200 p-4 max-w-sm w-full space-y-3 text-xs animate-in zoom-in-95 duration-100"
          >
            <h3 className="font-bold text-slate-900">QA Verification — {selectedError.id}</h3>
            <div>
              <label className="block text-slate-500 mb-1">Verified By</label>
              <input
                type="text"
                value={verifiedBy}
                onChange={(e) => setVerifiedBy(e.target.value)}
                className="w-full p-1.5 border border-slate-300 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Verification Notes</label>
              <textarea
                rows={2}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Verification checklist confirmation..."
                className="w-full p-1.5 border border-slate-300 rounded"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" size="sm" onClick={() => setActiveActionModal(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Verify & Close
              </Button>
            </div>
          </form>
        </div>
      )}

      {activeActionModal === 'reopen' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmReopen}
            className="bg-white rounded-lg shadow-xl border border-slate-200 p-4 max-w-sm w-full space-y-3 text-xs animate-in zoom-in-95 duration-100"
          >
            <h3 className="font-bold text-slate-900">Reopen Issue — {selectedError.id}</h3>
            <div>
              <label className="block text-slate-500 mb-1">Reopening Reason</label>
              <textarea
                rows={2}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Explain why issue is still reproducing..."
                className="w-full p-1.5 border border-slate-300 rounded"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" size="sm" onClick={() => setActiveActionModal(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm">
                Reopen Issue
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            deleteError(selectedError.id);
            setIsDeleteModalOpen(false);
          }}
          title={`Delete Error ${selectedError.id}?`}
          message={`Are you sure you want to delete issue ${selectedError.id} (${selectedError.projectType} - ISBN ${selectedError.isbnNumber})? This action cannot be undone.`}
          confirmText="Delete Error"
          variant="danger"
        />
      )}
    </div>
  );
};
