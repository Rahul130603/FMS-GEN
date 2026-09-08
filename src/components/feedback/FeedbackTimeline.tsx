import React from 'react';
import { FeedbackTimelineEvent } from '../../types/feedback';
import { formatDateTime } from '../../utils/formatters';
import {
  Sparkles,
  Clock,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send
} from 'lucide-react';

interface FeedbackTimelineProps {
  timeline: FeedbackTimelineEvent[];
}

export const FeedbackTimeline: React.FC<FeedbackTimelineProps> = ({ timeline }) => {
  const getEventIcon = (type: FeedbackTimelineEvent['type']) => {
    switch (type) {
      case 'submit':
        return <Send size={13} className="text-blue-600" />;
      case 'review':
        return <Clock size={13} className="text-amber-600" />;
      case 'plan':
        return <Sparkles size={13} className="text-purple-600" />;
      case 'progress':
        return <CalendarCheck size={13} className="text-indigo-600" />;
      case 'implemented':
        return <CheckCircle2 size={13} className="text-emerald-600" />;
      case 'reject':
        return <XCircle size={13} className="text-rose-600" />;
      case 'comment':
        return <MessageSquare size={13} className="text-slate-600" />;
      default:
        return <Clock size={13} className="text-slate-500" />;
    }
  };

  const getEventBadgeBg = (type: FeedbackTimelineEvent['type']) => {
    switch (type) {
      case 'submit':
        return 'bg-blue-100 border-blue-300';
      case 'review':
        return 'bg-amber-100 border-amber-300';
      case 'plan':
        return 'bg-purple-100 border-purple-300';
      case 'progress':
        return 'bg-indigo-100 border-indigo-300';
      case 'implemented':
        return 'bg-emerald-100 border-emerald-300';
      case 'reject':
        return 'bg-rose-100 border-rose-300';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {timeline.map((event, idx) => (
        <div key={event.id || idx} className="relative group">
          <div
            className={`absolute -left-6 mt-1 w-5 h-5 rounded-full border flex items-center justify-center bg-white shadow-xs ${getEventBadgeBg(
              event.type
            )}`}
          >
            {getEventIcon(event.type)}
          </div>

          <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
              <span className="text-xs font-semibold text-slate-800">{event.title}</span>
              <span className="text-[11px] font-mono text-slate-400">
                {formatDateTime(event.timestamp)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium text-slate-700">{event.user}</span>
              {event.role && <span className="text-[11px] text-slate-400">({event.role})</span>}
            </div>

            {event.details && (
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-white p-2 rounded border border-slate-200/60 font-mono text-[11px]">
                {event.details}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
