import React, { useState } from 'react';
import { useErrors } from '../../context/ErrorContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ErrorReport } from '../../types/errors';
import { TEAM_MEMBERS } from '../../data/initialBooks';
import { UserCheck } from 'lucide-react';

interface AssignIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorReport | null;
}

export const AssignIssueModal: React.FC<AssignIssueModalProps> = ({
  isOpen,
  onClose,
  error
}) => {
  const { assignError } = useErrors();
  const [assignee, setAssignee] = useState(error?.assignedTo || 'Priya S.');
  const [team, setTeam] = useState(error?.team || 'Accessibility Team');

  if (!error) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignError(error.id, assignee, team);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={`Assign Issue — ${error.id}`}
      subtitle={`ISBN: ${error.isbnNumber} • ${error.projectType}`}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Assign To</label>
          <select
            value={assignee}
            onChange={(e) => {
              setAssignee(e.target.value);
              const mem = TEAM_MEMBERS.find((m) => m.name === e.target.value);
              if (mem) setTeam(mem.team);
            }}
            className="w-full p-2 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            {TEAM_MEMBERS.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} ({m.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Responsible Team</label>
          <input
            type="text"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" icon={<UserCheck size={13} />}>
            Confirm Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
