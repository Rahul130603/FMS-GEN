import React from 'react';
import {
  PlusCircle, UserCheck, ArrowRightLeft, MessageSquare, StickyNote, HelpCircle,
  CheckCircle2, XCircle, RotateCcw, Archive, Paperclip, Clock,
} from 'lucide-react';
import { formatDate, formatRelative } from '../../utils/tqFormatters';

const EVENT_META = {
  created: { icon: PlusCircle, color: 'text-blue-600 bg-blue-100 dark:bg-blue-500/15' },
  assigned: { icon: UserCheck, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-500/15' },
  reassigned: { icon: UserCheck, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-500/15' },
  priority_changed: { icon: ArrowRightLeft, color: 'text-orange-600 bg-orange-100 dark:bg-orange-500/15' },
  status_changed: { icon: ArrowRightLeft, color: 'text-amber-600 bg-amber-100 dark:bg-amber-500/15' },
  comment_added: { icon: MessageSquare, color: 'text-gray-600 bg-gray-100 dark:bg-slate-700/40' },
  note_added: { icon: StickyNote, color: 'text-purple-600 bg-purple-100 dark:bg-purple-500/15' },
  info_requested: { icon: HelpCircle, color: 'text-amber-600 bg-amber-100 dark:bg-amber-500/15' },
  resolved: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15' },
  closed: { icon: XCircle, color: 'text-gray-600 bg-gray-200 dark:bg-slate-700/40' },
  reopened: { icon: RotateCcw, color: 'text-red-600 bg-red-100 dark:bg-red-500/15' },
  archived: { icon: Archive, color: 'text-slate-600 bg-slate-200 dark:bg-slate-700/40' },
  attachment_added: { icon: Paperclip, color: 'text-teal-600 bg-teal-100 dark:bg-teal-500/15' },
};

function eventLabel(evt) {
  const labels = {
    created: 'Query Created', assigned: 'Assigned', reassigned: 'Reassigned',
    priority_changed: 'Priority Changed', status_changed: 'Status Changed',
    comment_added: 'Comment Added', note_added: 'Note Updated', info_requested: 'Information Requested',
    resolved: 'Resolved', closed: 'Closed', reopened: 'Reopened', archived: 'Archived',
    attachment_added: 'Attachment Added',
  };
  return labels[evt.event_type] || evt.event_type;
}

export default function QueryTimeline({ events = [] }) {
  if (!events.length) {
    return <p className="text-sm text-gray-400 flex items-center gap-1.5"><Clock size={14} /> No activity yet.</p>;
  }

  return (
    <ol className="relative border-l border-gray-200 dark:border-slate-700 ml-3">
      {events.map((evt) => {
        const meta = EVENT_META[evt.event_type] || { icon: Clock, color: 'text-gray-500 bg-gray-100 dark:bg-slate-700/40' };
        const Icon = meta.icon;
        return (
          <li key={evt.id} className="mb-5 ml-5">
            <span className={`absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${meta.color}`}>
              <Icon size={13} />
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{eventLabel(evt)}</p>
              <span className="text-xs text-gray-400">by {evt.actor_name || 'System'}</span>
            </div>
            {evt.note && <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{evt.note}</p>}
            <p className="text-xs text-gray-400 mt-0.5" title={formatDate(evt.created_at)}>{formatRelative(evt.created_at)}</p>
          </li>
        );
      })}
    </ol>
  );
}
