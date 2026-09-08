import React, { useState, useEffect, useRef } from 'react';
import { useErrors } from '../../context/ErrorContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ErrorReport, ErrorSource } from '../../types/errors';
import { Priority, Attachment } from '../../types/common';
import { TEAM_MEMBERS } from '../../data/initialBooks';
import {
  UploadCloud,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Paperclip,
  Download
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  readFileAsDataUrl,
  downloadAttachment,
  formatFileSize,
  inferMimeType
} from '../../utils/exportUtils';
import {
  storeUploadedFile,
  removeUploadedFile
} from '../../utils/fileStorage';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ErrorReport | null;
}

const PROJECT_TYPE_OPTIONS = ['Scan', 'POD', 'EPDF', 'Accessibility'] as const;

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  initialData
}) => {
  const { createError, updateError } = useErrors();
  const { addToast } = useToast();

  const isEditing = !!initialData;

  // File input refs for real native uploads
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const logFileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Left Column States (Issue Diagnostics & Location)
  const [projectType, setProjectType] = useState<string>('Scan');
  const [chapter, setChapter] = useState<string>('');
  const [serverLocation, setServerLocation] = useState<string>('');
  const [isbnNumber, setIsbnNumber] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [expectedResult, setExpectedResult] = useState<string>('');
  const [actualResult, setActualResult] = useState<string>('');

  // Right Column States (Workflow & Evidence)
  const [reportedBy, setReportedBy] = useState<string>('QA Team');
  const [source, setSource] = useState<ErrorSource>('QA');
  const [assignedTo, setAssignedTo] = useState<string>('Priya S.');
  const [priority, setPriority] = useState<Priority>('High');
  const [targetDueDate, setTargetDueDate] = useState<string>('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setProjectType(
        PROJECT_TYPE_OPTIONS.includes(initialData.projectType as any)
          ? initialData.projectType
          : 'Scan'
      );
      setChapter(initialData.chapter || '');
      setServerLocation(initialData.serverLocation || '');
      setIsbnNumber(initialData.isbnNumber || '');
      setDescription(initialData.description || '');
      setExpectedResult(initialData.expectedResult || '');
      setActualResult(initialData.actualResult || '');
      setReportedBy(initialData.reportedBy || 'QA Team');
      setSource(initialData.source || 'QA');
      setAssignedTo(initialData.assignedTo || 'Priya S.');
      setPriority(initialData.priority || 'High');
      setTargetDueDate(initialData.dueDate || '');
      setAttachments(initialData.attachments || []);
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setProjectType('Scan');
    setChapter('');
    setServerLocation('');
    setIsbnNumber('');
    setDescription('');
    setExpectedResult('');
    setActualResult('');
    setReportedBy('QA Team');
    setSource('QA');
    setAssignedTo('Priya S.');
    setPriority('High');
    setTargetDueDate('');
    setAttachments([]);
    setErrors({});
  };

  const generateUniqueAttachmentId = (prefix: 'img' | 'log' | 'doc') => {
    const ts = Date.now();
    const rand = Math.random().toString(36).substring(2, 8);
    const entropy = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.floor(Math.random() * 1000000).toString(36);
    return `att-${prefix}-${ts}-${rand}-${entropy}`;
  };

  // Real Screenshot Upload Handler
  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newAttachments: Attachment[] = [];

      for (const file of files) {
        try {
          const attId = generateUniqueAttachmentId('img');
          const fileId = attId;
          const storageKey = `errors/attachments/${attId}/${encodeURIComponent(file.name)}`;

          // Store actual binary File in client-side storage (memory + IndexedDB) under id, storageKey, and fileId
          await storeUploadedFile(attId, file, file.name, storageKey, fileId);

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
          console.error('Failed to read uploaded screenshot:', err);
        }
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
      addToast(`Attached ${files.length} screenshot(s)`, undefined, 'info');
      if (screenshotInputRef.current) {
        screenshotInputRef.current.value = '';
      }
    }
  };

  // Real Log File Upload Handler
  const handleLogFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newAttachments: Attachment[] = [];

      for (const file of files) {
        try {
          const attId = generateUniqueAttachmentId('log');
          const fileId = attId;
          const storageKey = `errors/attachments/${attId}/${encodeURIComponent(file.name)}`;

          // Store actual binary File in client-side storage (memory + IndexedDB) under id, storageKey, and fileId
          await storeUploadedFile(attId, file, file.name, storageKey, fileId);

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
          console.error('Failed to read uploaded log file:', err);
        }
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
      addToast(`Attached ${files.length} log/data file(s)`, undefined, 'info');
      if (logFileInputRef.current) {
        logFileInputRef.current.value = '';
      }
    }
  };

  // Real Document / PDF Upload Handler
  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newAttachments: Attachment[] = [];

      for (const file of files) {
        try {
          const attId = generateUniqueAttachmentId('doc');
          const fileId = attId;
          const storageKey = `errors/attachments/${attId}/${encodeURIComponent(file.name)}`;

          // Store actual binary File in client-side storage (memory + IndexedDB) under id, storageKey, and fileId
          await storeUploadedFile(attId, file, file.name, storageKey, fileId);

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
          console.error('Failed to read uploaded document/PDF:', err);
        }
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
      addToast(`Attached ${files.length} document/PDF file(s)`, undefined, 'info');
      if (docFileInputRef.current) {
        docFileInputRef.current.value = '';
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

    if (!projectType.trim()) newErrors.projectType = 'Book / Project is required';
    if (!chapter.trim()) newErrors.chapter = 'Chapter is required';
    if (!isbnNumber.trim()) newErrors.isbnNumber = 'ISBN Number is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!expectedResult.trim()) newErrors.expectedResult = 'Expected result is required';
    if (!actualResult.trim()) newErrors.actualResult = 'Actual result is required';
    if (!reportedBy.trim()) newErrors.reportedBy = 'Reported by is required';
    if (!targetDueDate.trim()) newErrors.targetDueDate = 'Target due date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      addToast('Please complete required fields.', 'Check marked fields below.', 'error');
      return;
    }

    setIsSubmitting(true);

    const teamMember = TEAM_MEMBERS.find((m) => m.name === assignedTo);
    const assignedTeam = teamMember ? teamMember.team : 'Accessibility Team';

    const errorPayload: Partial<ErrorReport> = {
      projectType: projectType as any,
      chapter: chapter.trim(),
      serverLocation: serverLocation.trim() || '/server/scan/batch-1400/ch01.xhtml',
      isbnNumber: isbnNumber.trim(),
      description: description.trim(),
      expectedResult: expectedResult.trim(),
      actualResult: actualResult.trim(),
      reportedBy: reportedBy.trim(),
      source,
      assignedTo,
      team: assignedTeam,
      priority,
      dueDate: targetDueDate,
      status: initialData ? initialData.status : 'Open',
      attachments
    };

    if (isEditing && initialData) {
      updateError(initialData.id, errorPayload);
    } else {
      createError(errorPayload);
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={isEditing ? `Edit Issue (${initialData?.id})` : 'Report Production Issue'}
      subtitle="Log defects identified during book typesetting, EPUB validation, and accessibility QA."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Hidden Native File Inputs */}
        <input
          ref={screenshotInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple
          onChange={handleScreenshotChange}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
        <input
          ref={logFileInputRef}
          type="file"
          accept=".log,.txt,.json,.xml,.pdf,text/plain,application/json,application/xml,application/pdf"
          multiple
          onChange={handleLogFileChange}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
        <input
          ref={docFileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          onChange={handleDocFileChange}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* 2-COLUMN FORM LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* LEFT COLUMN: Issue Diagnostics & Location (7 cols) */}
          <div className="md:col-span-7 space-y-3 bg-slate-50/70 p-4 rounded-lg border border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200">
              Issue Diagnostics & Location
            </div>

            {/* Book / Project & Chapter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Book / Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  {PROJECT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {errors.projectType && <p className="text-[10px] text-rose-500 mt-0.5">{errors.projectType}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chapter <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="e.g. Chapter 04: Typography"
                  className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                {errors.chapter && <p className="text-[10px] text-rose-500 mt-0.5">{errors.chapter}</p>}
              </div>
            </div>

            {/* Server Location */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Server Location</label>
              <input
                type="text"
                value={serverLocation}
                onChange={(e) => setServerLocation(e.target.value)}
                placeholder="/server/epub/batch-1400/ch04.xhtml"
                className="w-full p-2 bg-white border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* ISBN Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ISBN Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={isbnNumber}
                onChange={(e) => setIsbnNumber(e.target.value)}
                placeholder="Enter ISBN number"
                className="w-full p-2 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              {errors.isbnNumber && <p className="text-[10px] text-rose-500 mt-0.5">{errors.isbnNumber}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the failure in detail..."
                className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              {errors.description && <p className="text-[10px] text-rose-500 mt-0.5">{errors.description}</p>}
            </div>

            {/* Expected & Actual Results */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-emerald-700 mb-1">
                  Expected Result <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={expectedResult}
                  onChange={(e) => setExpectedResult(e.target.value)}
                  placeholder="Expected behavior..."
                  className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                {errors.expectedResult && <p className="text-[10px] text-rose-500 mt-0.5">{errors.expectedResult}</p>}
              </div>

              <div>
                <label className="block font-semibold text-rose-700 mb-1">
                  Actual Result <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={actualResult}
                  onChange={(e) => setActualResult(e.target.value)}
                  placeholder="Observed error..."
                  className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                {errors.actualResult && <p className="text-[10px] text-rose-500 mt-0.5">{errors.actualResult}</p>}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Workflow & Evidence (5 cols) */}
          <div className="md:col-span-5 space-y-3 bg-slate-50/70 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200">
                Workflow & Evidence
              </div>

              {/* Reported By & Source */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reported By <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reportedBy}
                    onChange={(e) => setReportedBy(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  {errors.reportedBy && <p className="text-[10px] text-rose-500 mt-0.5">{errors.reportedBy}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as ErrorSource)}
                    className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="QA">QA</option>
                    <option value="Accessibility Review">Accessibility</option>
                    <option value="EPUB Validator">EPUB Validator</option>
                    <option value="Production">Production</option>
                    <option value="Editor">Editor</option>
                    <option value="Automated Check">Automated Check</option>
                  </select>
                </div>
              </div>

              {/* Assigned To & Priority */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned To</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    {TEAM_MEMBERS.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full p-2 bg-white border border-slate-300 rounded font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Target Due Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={targetDueDate}
                  onChange={(e) => setTargetDueDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                {errors.targetDueDate && <p className="text-[10px] text-rose-500 mt-0.5">{errors.targetDueDate}</p>}
              </div>

              {/* Attach Evidence Section */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1.5">Attach Evidence</label>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => screenshotInputRef.current?.click()}
                    icon={<ImageIcon size={13} className="text-indigo-600" />}
                  >
                    + Screenshot
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => logFileInputRef.current?.click()}
                    icon={<FileText size={13} className="text-slate-600" />}
                  >
                    + Log File
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => docFileInputRef.current?.click()}
                    icon={<FileText size={13} className="text-purple-600" />}
                  >
                    + Document / PDF
                  </Button>
                </div>

                {/* Compact Attachment List */}
                {attachments.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                    {attachments.map((a) => {
                      const isImg = a.type.startsWith('image/');
                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between p-1.5 px-2 bg-white rounded border border-slate-200 text-[11px] shadow-2xs hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isImg ? (
                              <ImageIcon size={13} className="text-indigo-600 shrink-0" />
                            ) : (
                              <FileText size={13} className="text-slate-500 shrink-0" />
                            )}
                            <span className="truncate max-w-[130px] font-medium text-slate-800" title={a.name}>
                              {a.name}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {a.size}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadAttachment(a, (title, desc, type) => {
                                  addToast(title, desc || '', type || 'info');
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                              title={`Download ${a.name}`}
                              aria-label={`Download ${a.name}`}
                            >
                              <Download size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAttachment(a.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title={`Remove ${a.name}`}
                              aria-label={`Remove ${a.name}`}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  icon={<CheckCircle2 size={13} />}
                >
                  {isEditing ? 'Save Changes' : 'Report Issue'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
