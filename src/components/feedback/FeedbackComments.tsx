import React, { useState } from 'react';
import { FeedbackComment } from '../../types/feedback';
import { formatDateTime } from '../../utils/formatters';
import { Button } from '../common/Button';
import { MessageSquare, CornerDownRight, Trash2, Send } from 'lucide-react';

interface FeedbackCommentsProps {
  feedbackId: string;
  comments: FeedbackComment[];
  onAddComment: (content: string) => void;
  onReply: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export const FeedbackComments: React.FC<FeedbackCommentsProps> = ({
  feedbackId,
  comments,
  onAddComment,
  onReply,
  onDeleteComment
}) => {
  const [mainComment, setMainComment] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleMainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainComment.trim()) return;
    onAddComment(mainComment.trim());
    setMainComment('');
  };

  const handleReplySubmit = (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(commentId, replyText.trim());
    setReplyingToId(null);
    setReplyText('');
  };

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
            No discussions yet. Share your feedback on this proposal below.
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                    {comment.author.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-slate-800">{comment.author}</span>
                  <span className="text-[11px] text-slate-400">({comment.role})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">
                    {formatDateTime(comment.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteComment(comment.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-all"
                    title="Delete comment"
                    aria-label="Delete comment"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed pl-8">{comment.content}</p>

              {/* Reply trigger button */}
              <div className="pl-8 pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToId(replyingToId === comment.id ? null : comment.id);
                    setReplyText('');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <CornerDownRight size={11} />
                  <span>Reply</span>
                </button>
              </div>

              {/* Threaded Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-8 pt-2 space-y-2 border-l-2 border-slate-100 ml-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-800">{reply.author}</span>
                          <span className="text-[10px] text-slate-400">({reply.role})</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatDateTime(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Reply Form */}
              {replyingToId === comment.id && (
                <form
                  onSubmit={(e) => handleReplySubmit(comment.id, e)}
                  className="pl-8 pt-2 flex gap-2"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${comment.author}...`}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    autoFocus
                  />
                  <Button type="submit" variant="primary" size="sm" disabled={!replyText.trim()}>
                    Reply
                  </Button>
                </form>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add New Top-Level Comment */}
      <form onSubmit={handleMainSubmit} className="pt-2">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Post Internal Feedback / Discussion
        </label>
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={mainComment}
            onChange={(e) => setMainComment(e.target.value)}
            placeholder="Share your perspective on feasibility, workflow benefits, or impact..."
            className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!mainComment.trim()}
            icon={<Send size={13} />}
          >
            Post
          </Button>
        </div>
      </form>
    </div>
  );
};
