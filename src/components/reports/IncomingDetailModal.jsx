import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge, PriorityBadge, FormatBadge } from '../common/Badge';
import { PRODUCTION_TEAMS, TEAM_MEMBERS } from '../../data/mockData';
import {
  BookOpen,
  CheckCircle2,
  FileCode,
  FileSpreadsheet,
  FileText,
  FileType2,
  FolderArchive,
  Image as ImageIcon,
  UserCheck,
  Calendar,
  AlertCircle,
  Download,
  Eye,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

export function IncomingDetailModal({ project, isOpen, onClose, onAssign }) {
  const [assignTeam, setAssignTeam] = useState('');
  const [assignUser, setAssignUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [assignedSuccess, setAssignedSuccess] = useState(false);

  useEffect(() => {
    if (project) {
      setAssignTeam(project.assignedTeam || '');
      setAssignUser(project.assignedUserId || '');
      setStartDate(project.startDate || new Date().toISOString().split('T')[0]);
      setDueDate(project.dueDate || '');
      setPriority(project.priority || 'Medium');
      setNotes(project.notes || '');
      setAssignedSuccess(false);
    }
  }, [project]);

  if (!project) return null;

  const isAssigned = project.status === 'Assigned' || project.status === 'In Production' || assignedSuccess;

  // Filter team members based on selected team
  const availableUsers = assignTeam
    ? TEAM_MEMBERS.filter(u => u.team === assignTeam)
    : TEAM_MEMBERS;

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignTeam || !assignUser) {
      alert('Please select both a Production Team and an Assignee.');
      return;
    }

    setSubmitting(true);
    const selectedUserObj = TEAM_MEMBERS.find(u => u.id === assignUser);

    const success = await onAssign(project.id, {
      assignedTeam: assignTeam,
      assignedUserId: assignUser,
      assignedUserName: selectedUserObj ? selectedUserObj.name : assignUser,
      startDate,
      dueDate,
      priority,
      notes
    });

    setSubmitting(false);
    if (success) {
      setAssignedSuccess(true);
    }
  };

  const getFileIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('word') || t.includes('manuscript') || t.includes('docx')) return FileText;
    if (t.includes('indesign') || t.includes('indd')) return FileType2;
    if (t.includes('pdf')) return FileText;
    if (t.includes('image') || t.includes('png') || t.includes('jpg')) return ImageIcon;
    if (t.includes('xml') || t.includes('code')) return FileCode;
    if (t.includes('sheet') || t.includes('excel') || t.includes('xlsx')) return FileSpreadsheet;
    return FolderArchive;
  };

  const downloadFile = (file) => {
    // Generate simulated download file
    const content = `Mock content for publishing asset: ${file.name}\nSize: ${file.size}\nProject: ${project.id}\nUploaded: ${file.uploadDate}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${project.id} - ${project.bookTitle}`}
      subtitle={`Received on ${project.receivedDate} • Client: ${project.client || project.publisher}`}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-8 text-slate-800">
        {/* Top Notification Banner if newly assigned */}
        {assignedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <strong className="font-bold">Project Successfully Assigned!</strong> Production kickoff notifications have been dispatched to the assigned team.
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 1: Project Information */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-project-info" className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 id="section-project-info" className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                1
              </span>
              Section 1: Project Information
            </h3>
            <div className="flex items-center gap-2">
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Project ID</span>
              <span className="text-xs font-bold font-mono text-brand-700">{project.id}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Book Title</span>
              <span className="text-xs font-semibold text-slate-900 line-clamp-1" title={project.bookTitle}>{project.bookTitle}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Author</span>
              <span className="text-xs font-medium text-slate-800">{project.author || 'N/A'}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Publisher / Client</span>
              <span className="text-xs font-medium text-slate-800">{project.publisher || project.client}</span>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">ISBN</span>
              <span className="text-xs font-mono text-slate-800">{project.isbn || 'N/A'}</span>
            </div>
            <div className="space-y-1 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Edition</span>
              <span className="text-xs text-slate-800">{project.edition || '1st Edition'}</span>
            </div>
            <div className="space-y-1 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Language</span>
              <span className="text-xs text-slate-800">{project.language || 'English'}</span>
            </div>
            <div className="space-y-1 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Book Type</span>
              <span className="text-xs text-slate-800">{project.bookType || 'Academic Textbook'}</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: Publishing Requirements */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-publishing-reqs" className="space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h3 id="section-publishing-reqs" className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                2
              </span>
              Section 2: Publishing Requirements
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block">Output Format</span>
              <span className="text-xs font-bold text-brand-900">{project.requirements?.outputFormat || project.format}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block">Accessibility Required</span>
              <span className={`text-xs font-bold inline-flex items-center gap-1 ${
                project.requirements?.accessibilityRequired === 'Yes' ? 'text-emerald-700' : 'text-slate-600'
              }`}>
                {project.requirements?.accessibilityRequired === 'Yes' && <ShieldCheck className="w-3.5 h-3.5" />}
                {project.requirements?.accessibilityRequired || 'Yes'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100 col-span-2">
              <span className="text-[11px] font-semibold text-slate-500 block">Accessibility Standard / WCAG</span>
              <span className="text-xs font-medium text-slate-800">{project.requirements?.accessibilityStandard || 'WCAG 2.1 AA'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block">Math / Formula Content</span>
              <span className="text-xs font-medium text-slate-800">{project.requirements?.mathFormulaContent || 'None'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block">Image / Figure Count</span>
              <span className="text-xs font-bold font-mono text-slate-900">{project.requirements?.imageFigureCount || 0} figures</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block">Table Count</span>
              <span className="text-xs font-bold font-mono text-slate-900">{project.requirements?.tableCount || 0} tables</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block">Chapter Count</span>
              <span className="text-xs font-bold font-mono text-slate-900">{project.requirements?.chapterCount || 0} chapters</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: Source Files */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-source-files" className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 id="section-source-files" className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                3
              </span>
              Section 3: Source Files ({project.sourceFiles?.length || 0})
            </h3>
            <span className="text-xs text-slate-500">All intake packages scanned & verified</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {project.sourceFiles?.map((file, idx) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-brand-50 text-brand-700 shrink-0">
                      <FileIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">{file.type}</span> &bull; {file.size} &bull; Uploaded {file.uploadDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => downloadFile(file)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-brand-50 border border-slate-200 transition-colors"
                      title="Download source asset"
                      aria-label={`Download ${file.name}`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: Project Timeline */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-project-timeline" className="space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h3 id="section-project-timeline" className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                4
              </span>
              Section 4: Project Timeline & Workflow
            </h3>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 overflow-x-auto">
            <div className="flex items-center min-w-[700px] justify-between relative">
              {/* Connecting Horizontal Line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 z-0" />

              {project.timeline?.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'current';

                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center text-center px-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs'
                          : isCurrent
                          ? 'bg-brand-600 border-brand-700 text-white shadow-md ring-4 ring-brand-100'
                          : 'bg-white border-slate-300 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold mt-2 ${isCurrent ? 'text-brand-900' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                      {step.stage}
                    </span>
                    <span className="text-[10px] text-slate-500 max-w-[90px] truncate block mt-0.5">
                      {step.date || 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: Assignment */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-assignment" className="space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h3 id="section-assignment" className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                5
              </span>
              Section 5: Assignment & Production Allocation
            </h3>
          </div>

          {isAssigned ? (
            // Assigned View
            <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-200 space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Production Assignment Configured</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Assigned Team</span>
                  <span className="font-semibold text-slate-900">{project.assignedTeam || assignTeam}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Assigned User</span>
                  <span className="font-semibold text-slate-900">{project.assignedTo || assignUser}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Start Date</span>
                  <span className="font-mono text-slate-800">{project.startDate || startDate || '2026-09-05'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Due Date</span>
                  <span className="font-mono font-semibold text-rose-700">{project.dueDate || dueDate}</span>
                </div>
              </div>

              {(project.notes || notes) && (
                <div className="pt-3 border-t border-emerald-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Special Instructions / Notes: </span>
                  {project.notes || notes}
                </div>
              )}
            </div>
          ) : (
            // Unassigned Interactive Form
            <form onSubmit={handleAssignSubmit} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Assign Team */}
                <div className="space-y-1.5">
                  <label htmlFor="assign-team" className="block text-xs font-semibold text-slate-700">
                    Assign Team <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="assign-team"
                    value={assignTeam}
                    onChange={(e) => {
                      setAssignTeam(e.target.value);
                      setAssignUser('');
                    }}
                    required
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Select Production Team</option>
                    {PRODUCTION_TEAMS.map((team) => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>

                {/* Assign User */}
                <div className="space-y-1.5">
                  <label htmlFor="assign-user" className="block text-xs font-semibold text-slate-700">
                    Assign User <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="assign-user"
                    value={assignUser}
                    onChange={(e) => setAssignUser(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Select Lead / Specialist</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label htmlFor="assign-priority" className="block text-xs font-semibold text-slate-700">
                    Priority Level
                  </label>
                  <select
                    id="assign-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="High">High (Urgent)</option>
                    <option value="Medium">Medium (Standard)</option>
                    <option value="Low">Low (Flexible)</option>
                  </select>
                </div>

                {/* Start Date */}
                <div className="space-y-1.5">
                  <label htmlFor="assign-start-date" className="block text-xs font-semibold text-slate-700">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="assign-start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <label htmlFor="assign-due-date" className="block text-xs font-semibold text-slate-700">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="assign-due-date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label htmlFor="assign-notes" className="block text-xs font-semibold text-slate-700">
                  Production Notes & Instructions
                </label>
                <textarea
                  id="assign-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Ensure all chemical formulas are rendered in MathML 3 with proper screen-reader pronunciation guides..."
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Form Action */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <UserCheck className="w-4 h-4" />
                  {submitting ? 'Assigning Project...' : 'Assign Project'}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
