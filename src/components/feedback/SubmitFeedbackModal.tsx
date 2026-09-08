import React, { useState, useEffect, useRef } from 'react';
import { useFeedback, normalizeCategory } from '../../context/FeedbackContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  InternalFeedbackItem,
  FeedbackType,
  FeedbackCategory
} from '../../types/feedback';
import { Attachment, Priority } from '../../types/common';
import {
  Sparkles,
  ArrowUpRight,
  Info,
  AlertOctagon,
  FileText,
  UserCheck,
  Paperclip,
  UploadCloud,
  X,
  CheckCircle2,
  Bookmark,
  Download,
  ImageIcon
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  downloadAttachment,
  formatFileSize,
  inferMimeType,
  readFileAsDataUrl
} from '../../utils/exportUtils';
import { storeUploadedFile, removeUploadedFile } from '../../utils/fileStorage';

interface SubmitFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: InternalFeedbackItem | null;
}

const TYPE_OPTIONS: { type: FeedbackType; label: string; desc: string; icon: any }[] = [
  {
    type: 'Suggestion',
    label: 'Suggestion',
    desc: 'General idea or enhancement',
    icon: Info
  },
  {
    type: 'Improvement',
    label: 'Improvement',
    desc: 'Refining existing feature or workflow',
    icon: ArrowUpRight
  },
  {
    type: 'Feature Request',
    label: 'Feature Request',
    desc: 'New capability or tool integration',
    icon: Sparkles
  },
  {
    type: 'Process Issue',
    label: 'Process Issue',
    desc: 'Bottleneck or governance friction',
    icon: AlertOctagon
  }
];

const CATEGORY_OPTIONS: FeedbackCategory[] = [
  'Scanning',
  'POD',
  'EPDF',
  'Accessibility'
];

const MEMBER_OPTIONS = [
  'Priya S.',
  'Arun K.',
  'Rahul M.',
  'Meena T.',
  'Saran S.'
];

const TEAM_OPTIONS = [
  'Accessibility Team',
  'Production Team',
  'QA Team',
  'Editorial Team',
  'Publishing Team'
];

const MEMBER_TEAM_MAP: Record<string, string> = {
  'Priya S.': 'Accessibility Team',
  'Arun K.': 'Production Team',
  'Rahul M.': 'QA Team',
  'Meena T.': 'Editorial Team',
  'Saran S.': 'Publishing Team'
};

const PRIORITY_OPTIONS: Priority[] = ['High', 'Medium', 'Low'];

export const SubmitFeedbackModal: React.FC<SubmitFeedbackModalProps> = ({
  isOpen,
  onClose,
  initialData
}) => {
  const { createFeedback, updateFeedback } = useFeedback();
  const { addToast } = useToast();

  const isEditing = !!initialData;

  const mockupInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Section 1: Feedback Type
  const [type, setType] = useState<FeedbackType>('Improvement');

  // Section 2: Feedback Details
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('Scanning');
  const [rootCause, setRootCause] = useState('');
  const [preventiveAction, setPreventiveAction] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');

  // Section 3: Ownership & Priority
  const [submittedBy, setSubmittedBy] = useState('Priya S.');
  const [team, setTeam] = useState('Accessibility Team');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [owner, setOwner] = useState('Arun K.');

  // Section 4: Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmittedByChange = (name: string) => {
    setSubmittedBy(name);
    if (MEMBER_TEAM_MAP[name]) {
      setTeam(MEMBER_TEAM_MAP[name]);
    }
  };

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setCategory(normalizeCategory(initialData.category));
      setRootCause(initialData.rootCause || initialData.problemCurrentExperience || initialData.description || '');
      setPreventiveAction(initialData.preventiveAction || initialData.suggestedImprovement || '');
      setCorrectiveAction(initialData.correctiveAction || initialData.suggestedSolution || initialData.suggestedImprovement || '');
      setSubmittedBy(initialData.submittedBy || 'Priya S.');
      setTeam(initialData.team || MEMBER_TEAM_MAP[initialData.submittedBy] || 'Accessibility Team');
      setPriority(initialData.priority || 'Medium');
      setOwner(initialData.owner || 'Arun K.');
      setAttachments(initialData.attachments || []);
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setType('Improvement');
    setTitle('');
    setCategory('Scanning');
    setRootCause('');
    setPreventiveAction('');
    setCorrectiveAction('');
    setSubmittedBy('Priya S.');
    setTeam('Accessibility Team');
    setPriority('Medium');
    setOwner('Arun K.');
    setAttachments([]);
    setErrors({});
  };

  const generateUniqueAttachmentId = (prefix: 'mock' | 'doc') => {
    const ts = Date.now();
    const rand = Math.random().toString(36).substring(2, 8);
    const entropy = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.floor(Math.random() * 1000000).toString(36);
    return `f-att-${prefix}-${ts}-${rand}-${entropy}`;
  };

  const handleMockupUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newAttachments: Attachment[] = [];

      for (const file of files) {
        try {
          const attId = generateUniqueAttachmentId('mock');
          const fileId = attId;
          const storageKey = `feedback/attachments/${attId}/${encodeURIComponent(file.name)}`;

          // Store real binary File in client-side storage (memory + IndexedDB) under id, storageKey, and fileId
          await storeUploadedFile(attId, file, file.name, storageKey, fileId);

          // For small files (< 500KB), generate dataUrl for instant inline preview
          let fileData: string | undefined = undefined;
          if (file.size < 500000) {
            try {
              fileData = await readFileAsDataUrl(file);
            } catch {
              // ignore
            }
          }

          newAttachments.push({
            id: attId,
            fileId,
            storageKey,
            name: file.name,
            type: file.type || inferMimeType(file.name),
            size: formatFileSize(file.size),
            source: 'upload',
            file: file,
            fileData,
            uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
          });
        } catch (err) {
          console.error('Failed to read uploaded mockup file:', err);
        }
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
      addToast(`Attached ${files.length} UI mockup file(s)`, undefined, 'info');
      if (mockupInputRef.current) {
        mockupInputRef.current.value = '';
      }
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newAttachments: Attachment[] = [];

      for (const file of files) {
        try {
          const attId = generateUniqueAttachmentId('doc');
          const fileId = attId;
          const storageKey = `feedback/attachments/${attId}/${encodeURIComponent(file.name)}`;

          // Store real binary File in client-side storage (memory + IndexedDB) under id, storageKey, and fileId
          await storeUploadedFile(attId, file, file.name, storageKey, fileId);

          // For small files (< 500KB), generate dataUrl for instant inline preview
          let fileData: string | undefined = undefined;
          if (file.size < 500000) {
            try {
              fileData = await readFileAsDataUrl(file);
            } catch {
              // ignore
            }
          }

          newAttachments.push({
            id: attId,
            fileId,
            storageKey,
            name: file.name,
            type: file.type || inferMimeType(file.name),
            size: formatFileSize(file.size),
            source: 'upload',
            file: file,
            fileData,
            uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
          });
        } catch (err) {
          console.error('Failed to read uploaded specification document:', err);
        }
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
      addToast(`Attached ${files.length} specification document(s)`, undefined, 'info');
      if (docInputRef.current) {
        docInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = async (target: string | Attachment) => {
    const id = typeof target === 'string' ? target : target.id;
    const att = typeof target === 'object' ? target : attachments.find((a) => a.id === id);
    if (id) await removeUploadedFile(id);
    if (att?.storageKey) await removeUploadedFile(att.storageKey);
    if (att?.fileId) await removeUploadedFile(att.fileId);
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Feedback title is required';
    if (!rootCause.trim()) {
      newErrors.rootCause = 'Root Cause is required.';
    }
    if (!preventiveAction.trim()) {
      newErrors.preventiveAction = 'Preventive Action is required.';
    }
    if (!correctiveAction.trim()) {
      newErrors.correctiveAction = 'Corrective Action is required.';
    }
    if (!submittedBy.trim()) {
      newErrors.submittedBy = 'Please select a submitter';
    }
    if (!team.trim()) {
      newErrors.team = 'Please select a team';
    }
    if (!priority) {
      newErrors.priority = 'Please select a priority';
    }
    if (!owner.trim()) {
      newErrors.owner = 'Please select an owner';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      addToast('Please complete required fields.', 'Check marked inputs above.', 'error');
      return;
    }

    setIsSubmitting(true);

    const feedbackPayload: Partial<InternalFeedbackItem> = {
      type,
      title: title.trim(),
      description: rootCause.trim() || title.trim(),
      category,
      rootCause: rootCause.trim(),
      preventiveAction: preventiveAction.trim(),
      correctiveAction: correctiveAction.trim(),
      problemCurrentExperience: rootCause.trim(),
      suggestedImprovement: preventiveAction.trim(),
      submittedBy: submittedBy.trim(),
      team: team.trim(),
      priority,
      owner: owner.trim(),
      assignedTo: owner.trim(),
      suggestedSolution: correctiveAction.trim(),
      attachments
    };

    if (isEditing && initialData) {
      updateFeedback(initialData.id, feedbackPayload);
    } else {
      createFeedback(feedbackPayload);
    }

    setIsSubmitting(false);
    onClose();
  };

  const handleSaveDraft = () => {
    addToast('Feedback draft saved.', 'Your ideas are saved locally.', 'info');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title={isEditing ? `Edit Feedback (${initialData?.id})` : 'Submit Internal Feedback & Workflow Ideas'}
      subtitle="Share proposals, feature requests, and process improvements for the EPUB publishing ecosystem."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: FEEDBACK TYPE */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Sparkles size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Section 1 — Feedback Type
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPE_OPTIONS.map((item) => {
              const isSelected = type === item.type;
              const IconComponent = item.icon;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setType(item.type)}
                  className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <IconComponent
                      size={16}
                      className={isSelected ? 'text-indigo-600' : 'text-slate-500'}
                    />
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: FEEDBACK DETAILS */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <FileText size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Section 2 — Feedback Details
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Feedback Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Add bulk chapter validation and parallel EpubCheck batch runs"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Root Cause <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="Describe the underlying cause of the issue..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              {errors.rootCause && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.rootCause}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Preventive Action <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={preventiveAction}
                onChange={(e) => setPreventiveAction(e.target.value)}
                placeholder="Describe how this issue can be prevented from happening again..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              {errors.preventiveAction && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.preventiveAction}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Corrective Action <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                placeholder="Describe the action required to fix the current issue..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              {errors.correctiveAction && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.correctiveAction}</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: OWNERSHIP & PRIORITY */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <UserCheck size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Section 3 — Ownership & Priority
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Submitted By <span className="text-rose-500">*</span>
                </label>
                <select
                  value={submittedBy}
                  onChange={(e) => handleSubmittedByChange(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select Submitter</option>
                  {MEMBER_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                {errors.submittedBy && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.submittedBy}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Team <span className="text-rose-500">*</span>
                </label>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select Team</option>
                  {TEAM_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.team && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.team}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Priority <span className="text-rose-500">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                {errors.priority && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.priority}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Owner <span className="text-rose-500">*</span>
                </label>
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select Owner</option>
                  {MEMBER_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                {errors.owner && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.owner}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: ATTACHMENTS & REFERENCE DOCUMENTS */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Paperclip size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Section 4 — Attachments & Reference Documents
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Hidden Real Browser File Inputs */}
            <input
              type="file"
              ref={mockupInputRef}
              onChange={handleMockupUpload}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              multiple
              className="hidden"
              aria-hidden="true"
            />
            <input
              type="file"
              ref={docInputRef}
              onChange={handleDocUpload}
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              multiple
              className="hidden"
              aria-hidden="true"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => mockupInputRef.current?.click()}
                icon={<UploadCloud size={13} />}
              >
                + Add UI Mockup
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => docInputRef.current?.click()}
                icon={<FileText size={13} />}
              >
                + Add Specification Doc
              </Button>
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {attachments.map((file) => {
                  const isImg = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|svg)$/i.test(file.name);
                  return (
                    <div
                      key={file.id}
                      className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isImg ? (
                          <ImageIcon size={14} className="text-indigo-600 shrink-0" />
                        ) : (
                          <FileText size={14} className="text-purple-600 shrink-0" />
                        )}
                        <div className="min-w-0 truncate">
                          <span className="font-semibold text-slate-800 block truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {file.type || 'File'} • {file.size}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await downloadAttachment(file, (title, desc, type) => {
                              addToast(title, desc || '', type || 'info');
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                          title={`Download ${file.name}`}
                          aria-label={`Download ${file.name}`}
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAttachment(file.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title={`Remove ${file.name}`}
                          aria-label={`Remove ${file.name}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleSaveDraft}
                icon={<Bookmark size={14} />}
              >
                Save Draft
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              icon={<CheckCircle2 size={14} />}
            >
              {isEditing ? 'Save Changes' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
