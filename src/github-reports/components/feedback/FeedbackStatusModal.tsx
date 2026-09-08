import React, { useState } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { InternalFeedbackItem, FeedbackStatus } from '../../types/feedback';
import { TEAM_MEMBERS } from '../../data/initialBooks';
import { Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface FeedbackStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: InternalFeedbackItem | null;
}

const STATUS_OPTIONS: FeedbackStatus[] = [
  'New',
  'Under Review',
  'Planned',
  'In Progress',
  'Implemented',
  'Rejected',
  'Duplicate'
];

export const FeedbackStatusModal: React.FC<FeedbackStatusModalProps> = ({
  isOpen,
  onClose,
  feedback
}) => {
  const { changeStatus } = useFeedback();

  const [newStatus, setNewStatus] = useState<FeedbackStatus>(feedback?.status || 'Under Review');
  const [reviewNote, setReviewNote] = useState(feedback?.reviewNotes || '');
  const [owner, setOwner] = useState(feedback?.owner || 'Priya S.');
  const [targetDate, setTargetDate] = useState(feedback?.targetDate || '2026-10-30');
  const [reviewer, setReviewer] = useState('Priya S.');

  if (!feedback) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changeStatus(feedback.id, newStatus, reviewNote.trim() || undefined, owner, targetDate, reviewer);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={`Update Feedback Status — ${feedback.id}`}
      subtitle={feedback.title}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Target Status</label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as FeedbackStatus)}
            className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Feature Owner / Lead</label>
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Unassigned</option>
            {TEAM_MEMBERS.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} ({m.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Target Release / Milestone Date</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Reviewer Notes / Rationale {newStatus === 'Rejected' && <span className="text-rose-500">*</span>}
          </label>
          <textarea
            rows={3}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Explain why this status is assigned, roadmap alignment, or technical prerequisites..."
            className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            required={newStatus === 'Rejected'}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={newStatus === 'Rejected' ? 'danger' : 'primary'}
            size="md"
            icon={<CheckCircle2 size={14} />}
          >
            Update Status
          </Button>
        </div>
      </form>
    </Modal>
  );
};
