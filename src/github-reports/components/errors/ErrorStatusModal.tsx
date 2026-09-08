import React, { useState } from 'react';
import { useErrors } from '../../context/ErrorContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ErrorReport, ErrorStatus } from '../../types/errors';
import { TEAM_MEMBERS } from '../../data/initialBooks';
import { CheckCircle2, RotateCcw, UserCheck, Clock, ShieldAlert } from 'lucide-react';

interface ErrorStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorReport | null;
  mode: 'status' | 'assign' | 'resolve' | 'verify' | 'reopen';
}

export const ErrorStatusModal: React.FC<ErrorStatusModalProps> = ({
  isOpen,
  onClose,
  error,
  mode
}) => {
  const { changeStatus, assignError, resolveError, verifyError, reopenError } = useErrors();

  const [newStatus, setNewStatus] = useState<ErrorStatus>(error?.status || 'In Progress');
  const [assignee, setAssignee] = useState(error?.assignedTo || 'Priya S.');
  const [team, setTeam] = useState(error?.team || 'Accessibility Team');
  const [notes, setNotes] = useState('');
  const [user, setUser] = useState('Priya S.');
  const [closeAfterVerify, setCloseAfterVerify] = useState(true);

  if (!error) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'status') {
      changeStatus(error.id, newStatus, notes.trim() || undefined, user);
    } else if (mode === 'assign') {
      assignError(error.id, assignee, team, user);
    } else if (mode === 'resolve') {
      resolveError(error.id, notes.trim() || 'Defect resolved and verified against EPUB 3.2 schema.', user);
    } else if (mode === 'verify') {
      verifyError(error.id, notes.trim() || 'Verified all checklist criteria in reader preview.', user, closeAfterVerify);
    } else if (mode === 'reopen') {
      reopenError(error.id, notes.trim() || 'Defect still reproducing in target e-reader environment.', user);
    }

    onClose();
    setNotes('');
  };

  const getTitle = () => {
    switch (mode) {
      case 'status':
        return `Change Status — ${error.id}`;
      case 'assign':
        return `Assign Error — ${error.id}`;
      case 'resolve':
        return `Resolve Error — ${error.id}`;
      case 'verify':
        return `QA Verification — ${error.id}`;
      case 'reopen':
        return `Reopen Error — ${error.id}`;
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'status':
        return <Clock size={18} className="text-indigo-600" />;
      case 'assign':
        return <UserCheck size={18} className="text-indigo-600" />;
      case 'resolve':
        return <CheckCircle2 size={18} className="text-emerald-600" />;
      case 'verify':
        return <CheckCircle2 size={18} className="text-teal-600" />;
      case 'reopen':
        return <RotateCcw size={18} className="text-purple-600" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title={getTitle()}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="font-semibold text-slate-800">ISBN: {error.isbnNumber}</div>
          <div className="text-slate-500 mt-0.5">{error.projectType} • {error.chapter}</div>
        </div>

        {mode === 'status' && (
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ErrorStatus)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Verified">Verified</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
            </select>
          </div>
        )}

        {mode === 'assign' && (
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assign To</label>
              <select
                value={assignee}
                onChange={(e) => {
                  setAssignee(e.target.value);
                  const mem = TEAM_MEMBERS.find((m) => m.name === e.target.value);
                  if (mem) setTeam(mem.team);
                }}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {TEAM_MEMBERS.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Team</label>
              <input
                type="text"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {mode === 'verify' && (
          <div className="flex items-center gap-2 p-2.5 bg-teal-50 border border-teal-200 rounded-lg">
            <input
              type="checkbox"
              id="closeAfter"
              checked={closeAfterVerify}
              onChange={(e) => setCloseAfterVerify(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="closeAfter" className="text-slate-800 font-medium cursor-pointer">
              Mark as officially Closed upon verification
            </label>
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            {mode === 'resolve'
              ? 'Resolution Notes'
              : mode === 'verify'
              ? 'Verification Notes'
              : mode === 'reopen'
              ? 'Reopening Reason'
              : 'Audit Notes / Reason'}
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              mode === 'resolve'
                ? 'Describe the code/content fix applied...'
                : mode === 'reopen'
                ? 'Explain why the error is not resolved...'
                : 'Provide optional context for this action...'
            }
            className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            required={mode === 'reopen'}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={mode === 'reopen' ? 'danger' : mode === 'resolve' ? 'success' : 'primary'}
            size="md"
            icon={getIcon()}
          >
            {mode === 'resolve'
              ? 'Confirm Resolution'
              : mode === 'verify'
              ? 'Confirm Verification'
              : mode === 'reopen'
              ? 'Reopen Error'
              : 'Update'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
