import React, { useState } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { InternalFeedbackItem, FeedbackStatus } from '../../types/feedback';
import { FeedbackStatusBadge, FeedbackTypeBadge, PriorityBadge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';
import {
  MoreHorizontal,
  Eye,
  Edit3,
  RotateCcw,
  Trash2,
  MessageSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface FeedbackTableProps {
  onEdit: (item: InternalFeedbackItem) => void;
  onChangeStatus: (item: InternalFeedbackItem) => void;
  onAddComment: (item: InternalFeedbackItem) => void;
}

export const FeedbackTable: React.FC<FeedbackTableProps> = ({
  onEdit,
  onChangeStatus,
  onAddComment
}) => {
  const {
    filteredFeedback,
    page,
    pageSize,
    sortField,
    sortDirection,
    setSort,
    setSelectedFeedback,
    deleteFeedback
  } = useFeedback();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InternalFeedbackItem | null>(null);

  const paginatedFeedback = filteredFeedback.slice((page - 1) * pageSize, page * pageSize);

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-slate-400 opacity-0 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={12} className="text-indigo-600" />
    ) : (
      <ArrowDown size={12} className="text-indigo-600" />
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
            <thead className="bg-slate-50/90 text-[11px] font-semibold text-slate-600 uppercase tracking-wider select-none">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 cursor-pointer group hover:bg-slate-100/80 transition-colors"
                  onClick={() => setSort('id')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Feedback ID</span>
                    {getSortIcon('id')}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-4 py-3 cursor-pointer group hover:bg-slate-100/80 transition-colors min-w-[280px]"
                  onClick={() => setSort('title')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Title & Description</span>
                    {getSortIcon('title')}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-3 py-3 cursor-pointer group hover:bg-slate-100/80 transition-colors"
                  onClick={() => setSort('type')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Type</span>
                    {getSortIcon('type')}
                  </div>
                </th>

                <th scope="col" className="px-3 py-3">
                  Category
                </th>

                <th scope="col" className="px-3 py-3">
                  Submitted By
                </th>

                <th
                  scope="col"
                  className="px-3 py-3 cursor-pointer group hover:bg-slate-100/80 transition-colors"
                  onClick={() => setSort('priority')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Priority</span>
                    {getSortIcon('priority')}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-3 py-3 cursor-pointer group hover:bg-slate-100/80 transition-colors"
                  onClick={() => setSort('status')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-3 py-3 cursor-pointer group hover:bg-slate-100/80 transition-colors"
                  onClick={() => setSort('submittedDate')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Submitted</span>
                    {getSortIcon('submittedDate')}
                  </div>
                </th>

                <th scope="col" className="px-3 py-3">
                  Owner
                </th>

                <th scope="col" className="px-4 py-3 text-right sticky right-0 bg-slate-50/95 shadow-xs">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedFeedback.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="font-semibold text-sm text-slate-700">No feedback records available</span>
                      <span className="text-xs text-slate-400">No internal feedback entries match the selected filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedFeedback.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => setSelectedFeedback(item)}
                >
                  {/* Feedback ID */}
                  <td className="px-4 py-3.5 font-mono font-semibold text-indigo-600 whitespace-nowrap">
                    <span className="hover:underline flex items-center gap-1">
                      {item.id}
                    </span>
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3.5 min-w-[280px]">
                    <div className="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {item.rootCause || item.problemCurrentExperience || item.description}
                    </div>
                    {item.comments && item.comments.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                        <MessageSquare size={10} />
                        <span>{item.comments.length} internal notes</span>
                      </div>
                    )}
                  </td>

                  {/* Type */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <FeedbackTypeBadge type={item.type} />
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <span className="text-xs text-slate-700 font-medium">{item.category}</span>
                  </td>

                  {/* Submitted By */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <div className="font-medium text-slate-800 text-xs">{item.submittedBy}</div>
                    {item.team && <div className="text-[10px] text-slate-400">{item.team}</div>}
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <PriorityBadge priority={item.priority} />
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <FeedbackStatusBadge status={item.status} />
                  </td>

                  {/* Submitted Date */}
                  <td className="px-3 py-3.5 whitespace-nowrap text-xs text-slate-500 font-medium">
                    {formatDate(item.submittedDate)}
                  </td>

                  {/* Owner */}
                  <td className="px-3 py-3.5 whitespace-nowrap text-xs text-slate-700">
                    {item.owner ? (
                      <span className="font-medium text-slate-800">{item.owner}</span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td
                    className="px-4 py-3.5 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50/80 transition-colors shadow-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label={`Actions for ${item.id}`}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {activeMenuId === item.id && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFeedback(item);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 font-medium"
                            >
                              <Eye size={14} className="text-slate-500" />
                              <span>View Feedback</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onEdit(item);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                            >
                              <Edit3 size={14} className="text-slate-500" />
                              <span>Edit Details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onChangeStatus(item);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                            >
                              <RotateCcw size={14} className="text-slate-500" />
                              <span>Change Status</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onAddComment(item);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                            >
                              <MessageSquare size={14} className="text-slate-500" />
                              <span>Add Comment</span>
                            </button>

                            <div className="border-t border-slate-100 my-1" />

                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTarget(item);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                            >
                              <Trash2 size={14} className="text-rose-500" />
                              <span>Delete Feedback</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget) {
              deleteFeedback(deleteTarget.id);
              setDeleteTarget(null);
            }
          }}
          title={`Delete Feedback ${deleteTarget.id}?`}
          message={`Are you sure you want to delete "${deleteTarget.title}"? This feedback item and all discussion history will be permanently deleted.`}
          confirmText="Delete Feedback"
          variant="danger"
        />
      )}
    </>
  );
};
