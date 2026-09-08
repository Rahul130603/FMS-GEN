import React, { useState } from 'react';
import { Send, Lock, MessageSquare } from 'lucide-react';
import { formatDate } from '../../utils/tqFormatters';
import { technicalQueryApi } from '../../services/technicalQueryApi';
import { useAuth } from '../../context/AuthContext';

export default function CommentSection({ queryId, comments = [], onCommentAdded }) {
  const { isAdmin } = useAuth();
  const [text, setText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await technicalQueryApi.addComment(queryId, { comment: text.trim(), isInternal });
      setText('');
      setIsInternal(false);
      onCommentAdded?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 flex items-center gap-1.5 mb-3"><MessageSquare size={14} /> No comments yet.</p>
      ) : (
        <ul className="space-y-3 mb-4">
          {comments.map((c) => (
            <li
              key={c.id}
              className={`rounded-lg px-3.5 py-2.5 text-sm ${
                c.is_internal
                  ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20'
                  : 'bg-gray-50 dark:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {c.user_name} <span className="text-xs font-normal text-gray-400 capitalize">({c.user_role.replace('_', ' ')})</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  {c.is_internal && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                      <Lock size={11} /> Internal
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-200 mt-1 whitespace-pre-wrap">{c.comment}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Add a comment…"
          className="input resize-none"
        />
        <div className="flex items-center justify-between">
          {isAdmin ? (
            <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded" />
              Internal note (not visible to employee)
            </label>
          ) : <span />}
          <button type="submit" disabled={submitting || !text.trim()} className="btn-primary !py-1.5">
            <Send size={14} /> Add Comment
          </button>
        </div>
      </form>
    </div>
  );
}
