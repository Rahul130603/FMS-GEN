import React, { useState } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { useToast } from '../../context/ToastContext';
import { Drawer } from '../common/Drawer';
import {
  FeedbackStatusBadge,
  FeedbackTypeBadge,
  PriorityBadge,
  ImpactBadge
} from '../common/Badge';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { downloadAttachment } from '../../utils/exportUtils';
import { FeedbackTimeline } from './FeedbackTimeline';
import { FeedbackComments } from './FeedbackComments';
import { Button } from '../common/Button';
import {
  Sparkles,
  Layers,
  Paperclip,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Edit3,
  Trash2,
  User,
  Calendar,
  AlertCircle,
  TrendingUp,
  RotateCcw,
  CheckCheck,
  XCircle,
  Download,
  ImageIcon
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';
import { InternalFeedbackItem, FeedbackStatus } from '../../types/feedback';

interface FeedbackDetailDrawerProps {
  onEdit: (item: InternalFeedbackItem) => void;
  onChangeStatusModal: (item: InternalFeedbackItem) => void;
}

export const FeedbackDetailDrawer: React.FC<FeedbackDetailDrawerProps> = ({
  onEdit,
  onChangeStatusModal
}) => {
  const {
    selectedFeedback,
    setSelectedFeedback,
    changeStatus,
    addComment,
    replyToComment,
    deleteComment,
    deleteFeedback
  } = useFeedback();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'details' | 'attachments' | 'timeline' | 'comments'>('details');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!selectedFeedback) return null;

  return (
    <>
      <Drawer
        isOpen={!!selectedFeedback}
        onClose={() => setSelectedFeedback(null)}
        width="3xl"
        title={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded">
              {selectedFeedback.id}
            </span>
            <span className="text-sm font-semibold text-slate-900 truncate max-w-md">
              {selectedFeedback.title}
            </span>
          </div>
        }
        subtitle={
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-slate-600 font-medium">{selectedFeedback.category}</span>
            {selectedFeedback.relatedBook && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">{selectedFeedback.relatedBook}</span>
              </>
            )}
          </div>
        }
        headerActions={
          <div className="flex items-center gap-1.5 mr-2">
            <button
              type="button"
              onClick={() => onEdit(selectedFeedback)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Edit Feedback"
              aria-label="Edit Feedback"
            >
              <Edit3 size={16} />
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Delete Feedback"
              aria-label="Delete Feedback"
            >
              <Trash2 size={16} />
            </button>
          </div>
        }
      >
        <div className="p-6 space-y-6">
          {/* Status, Type & Workflow Quick Actions */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center flex-wrap gap-2">
              <FeedbackStatusBadge status={selectedFeedback.status} size="md" />
              <FeedbackTypeBadge type={selectedFeedback.type} />
              <ImpactBadge impact={selectedFeedback.productionImpact} />
            </div>

            {/* Quick Status Workflow Progress Buttons */}
            <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
              {selectedFeedback.status === 'New' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    changeStatus(
                      selectedFeedback.id,
                      'Under Review',
                      'Moved to Under Review for editorial and engineering triage.',
                      'Priya S.',
                      undefined,
                      'Priya S.'
                    )
                  }
                  icon={<Clock size={13} />}
                >
                  Start Review
                </Button>
              )}

              {selectedFeedback.status === 'Under Review' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      changeStatus(
                        selectedFeedback.id,
                        'Planned',
                        'Approved during sprint roadmap planning.',
                        'Product Team',
                        '2026-11-15',
                        'Devon Miller'
                      )
                    }
                    icon={<Sparkles size={13} />}
                  >
                    Plan Feature
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChangeStatusModal(selectedFeedback)}
                  >
                    More Actions
                  </Button>
                </>
              )}

              {selectedFeedback.status === 'Planned' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    changeStatus(
                      selectedFeedback.id,
                      'In Progress',
                      'Development and UX design started.',
                      'Arun K.',
                      undefined,
                      'Arun K.'
                    )
                  }
                  icon={<Clock size={13} />}
                >
                  Start Progress
                </Button>
              )}

              {selectedFeedback.status === 'In Progress' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() =>
                    changeStatus(
                      selectedFeedback.id,
                      'Implemented',
                      'Shipped in latest PubVantage EPUB release.',
                      'Arun K.',
                      undefined,
                      'Arun K.'
                    )
                  }
                  icon={<CheckCircle2 size={13} />}
                >
                  Mark Implemented
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => onChangeStatusModal(selectedFeedback)}
                icon={<RotateCcw size={13} />}
              >
                Change Status
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`pb-3 px-3 transition-colors border-b-2 ${
                activeTab === 'details'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Overview & Impact
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'attachments'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Attachments & Mockups</span>
              {selectedFeedback.attachments.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {selectedFeedback.attachments.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Workflow Progression</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                {selectedFeedback.timeline.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'comments'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Discussion Thread</span>
              {selectedFeedback.comments.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                  {selectedFeedback.comments.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Root Cause, Preventive Action, Corrective Action */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} className="text-indigo-600" />
                  <span>Root Cause & Corrective Analysis</span>
                </h4>

                <div>
                  <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                    Root Cause
                  </span>
                  <p className="text-xs text-slate-800 mt-1 leading-relaxed bg-rose-50/50 p-3 rounded-lg border border-rose-200/60 whitespace-pre-wrap">
                    {selectedFeedback.rootCause || selectedFeedback.problemCurrentExperience || selectedFeedback.description}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                    Preventive Action
                  </span>
                  <p className="text-xs text-slate-800 mt-1 leading-relaxed bg-amber-50/50 p-3 rounded-lg border border-amber-200/60 whitespace-pre-wrap">
                    {selectedFeedback.preventiveAction || selectedFeedback.suggestedImprovement || 'No preventive action specified.'}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                    Corrective Action
                  </span>
                  <p className="text-xs text-slate-800 mt-1 leading-relaxed bg-emerald-50/50 p-3 rounded-lg border border-emerald-200/60 whitespace-pre-wrap">
                    {selectedFeedback.correctiveAction || selectedFeedback.suggestedSolution || selectedFeedback.suggestedImprovement || 'No corrective action specified.'}
                  </p>
                </div>
              </div>

              {/* Impact & Scope - only displayed if present */}
              {(selectedFeedback.expectedBenefit || selectedFeedback.whoIsAffected || selectedFeedback.frequency || selectedFeedback.relatedBook) && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={14} className="text-indigo-600" />
                    <span>Impact Assessment & Beneficiaries</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {selectedFeedback.expectedBenefit && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                        <span className="text-slate-400 block text-[11px]">Expected Benefit</span>
                        <span className="font-medium text-slate-800 mt-0.5 block leading-relaxed">
                          {selectedFeedback.expectedBenefit}
                        </span>
                      </div>
                    )}
                    {selectedFeedback.whoIsAffected && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                        <span className="text-slate-400 block text-[11px]">Who is Affected?</span>
                        <span className="font-medium text-slate-800 mt-0.5 block leading-relaxed">
                          {selectedFeedback.whoIsAffected}
                        </span>
                      </div>
                    )}
                    {selectedFeedback.frequency && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                        <span className="text-slate-400 block text-[11px]">Frequency of Occurrence</span>
                        <span className="font-medium text-slate-800 mt-0.5 block">
                          {selectedFeedback.frequency}
                        </span>
                      </div>
                    )}
                    {selectedFeedback.relatedBook && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                        <span className="text-slate-400 block text-[11px]">Related Book / Project</span>
                        <span className="font-medium text-slate-800 mt-0.5 block">
                          {selectedFeedback.relatedBook}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Management & Governance */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User size={14} className="text-indigo-600" />
                  <span>Management & Target Schedule</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Submitted By</span>
                    <span className="font-semibold text-slate-800">{selectedFeedback.submittedBy}</span>
                    <span className="text-[10px] text-slate-400 block">{selectedFeedback.team}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Feature Owner</span>
                    <span className="font-semibold text-slate-800">
                      {selectedFeedback.owner || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Target Release Date</span>
                    <span className="font-medium text-slate-800">
                      {formatDate(selectedFeedback.targetDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Priority</span>
                    <PriorityBadge priority={selectedFeedback.priority} />
                  </div>
                </div>
              </div>

              {/* Reviewer Notes & Decision */}
              {(selectedFeedback.reviewer || selectedFeedback.reviewNotes) && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCheck size={14} className="text-indigo-600" />
                    <span>Editorial / Product Review Notes</span>
                  </h4>
                  <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-200/70 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-indigo-900">
                        Decision: {selectedFeedback.decision || 'Under Evaluation'}
                      </span>
                      <span className="text-[11px] text-indigo-700">
                        Reviewed by {selectedFeedback.reviewer} on {formatDate(selectedFeedback.decisionDate)}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{selectedFeedback.reviewNotes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ATTACHMENTS */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Paperclip size={14} className="text-indigo-600" />
                <span>Reference Files & Visual Mockups ({selectedFeedback.attachments.length})</span>
              </h4>

              {selectedFeedback.attachments.length === 0 ? (
                <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  No files attached to this feedback item.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedFeedback.attachments.map((file) => {
                    const isImg = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|svg)$/i.test(file.name);
                    return (
                      <div
                        key={file.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:border-indigo-300 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2 ${isImg ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'} rounded-lg shrink-0`}>
                            {isImg ? <ImageIcon size={16} /> : <FileText size={16} />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                              {file.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {file.type || 'File'} • {file.size} • {file.uploadedAt}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await downloadAttachment(file, (title, desc, type) => {
                              addToast(title, desc || '', type || 'info');
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                          title={`Download ${file.name}`}
                          aria-label={`Download ${file.name}`}
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="py-2">
              <FeedbackTimeline timeline={selectedFeedback.timeline} />
            </div>
          )}

          {/* TAB 4: COMMENTS */}
          {activeTab === 'comments' && (
            <FeedbackComments
              feedbackId={selectedFeedback.id}
              comments={selectedFeedback.comments}
              onAddComment={(content) =>
                addComment(selectedFeedback.id, content, 'Priya S.', 'Lead Accessibility Engineer')
              }
              onReply={(commentId, content) =>
                replyToComment(selectedFeedback.id, commentId, content, 'Priya S.', 'Lead Accessibility Engineer')
              }
              onDeleteComment={(commentId) => deleteComment(selectedFeedback.id, commentId)}
            />
          )}
        </div>
      </Drawer>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedFeedback && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            deleteFeedback(selectedFeedback.id);
            setIsDeleteModalOpen(false);
          }}
          title={`Delete Feedback ${selectedFeedback.id}?`}
          message={`Are you sure you want to delete "${selectedFeedback.title}"? This feedback item and all discussion threads will be permanently removed.`}
          confirmText="Delete Feedback"
          variant="danger"
        />
      )}
    </>
  );
};
