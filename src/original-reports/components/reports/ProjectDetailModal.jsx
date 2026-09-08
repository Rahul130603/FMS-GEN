import React from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge, PriorityBadge, FormatBadge, StageBadge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { Calendar, User, BookOpen, Layers, CheckCircle, Clock, ShieldCheck, FileText } from 'lucide-react';

export function ProjectDetailModal({ project, isOpen, onClose }) {
  if (!project) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${project.isbn ? `ISBN ${project.isbn}` : project.id} - ${project.bookTitle}`}
      subtitle={`Client: ${project.client} â€¢ Format: ${project.projectType}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 text-sm">
        {/* Progress & Status Bar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
              <FormatBadge format={project.projectType} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Layers className="w-3.5 h-3.5 text-brand-600" />
              <span>Current Stage:</span>
              <strong className="text-slate-900">{project.currentStage}</strong>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>Overall Production Progress</span>
              <span>{project.progress}% Complete</span>
            </div>
            <ProgressBar value={project.progress} size="lg" showLabel={false} />
          </div>
        </div>

        {/* Core Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-600" />
              Bibliographic Details
            </h4>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500 font-medium">Book Title</dt>
                <dd className="text-slate-900 font-semibold text-right max-w-[200px] truncate" title={project.bookTitle}>{project.bookTitle}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500 font-medium">Author(s)</dt>
                <dd className="text-slate-800 font-medium text-right">{project.author || 'N/A'}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500 font-medium">ISBN-13</dt>
                <dd className="text-slate-800 font-mono text-right">{project.isbn || 'N/A'}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500 font-medium">Edition</dt>
                <dd className="text-slate-800 font-medium text-right">{project.edition || 'Standard Edition'}</dd>
              </div>
            </dl>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-600" />
              Schedule & Assignment
            </h4>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500 font-medium">Assigned Date</dt>
                <dd className="text-slate-800 font-mono text-right">{project.assignedDate}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500 font-medium">Due Date</dt>
                <dd className="text-rose-700 font-semibold font-mono text-right">{project.dueDate}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500 font-medium">Assigned By</dt>
                <dd className="text-slate-800 font-medium text-right">{project.assignedBy || 'Production Management'}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500 font-medium">Client / Publisher</dt>
                <dd className="text-slate-900 font-semibold text-right">{project.client}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Project Scope & Description */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            Scope & Production Specifications
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            {project.description || 'Standard multi-format production pipeline conforming to client style guide and WCAG 2.1 AA accessibility guidelines.'}
          </p>
        </div>

        {/* Production Stage Milestone Tracker */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Stage Checkpoints
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {['Manuscript', 'Pre-Production', 'Conversion', 'QA', 'Accessibility', 'Final Review', 'Delivery'].map((stg, i) => {
              const isCurrent = project.currentStage === stg;
              const stages = ['Manuscript', 'Pre-Production', 'Conversion', 'QA', 'Accessibility', 'Final Review', 'Delivery'];
              const currentIndex = stages.indexOf(project.currentStage);
              const isPast = stages.indexOf(stg) < currentIndex || project.progress === 100;

              return (
                <div
                  key={stg}
                  className={`p-2 rounded-lg text-center border text-[11px] font-medium transition-all ${
                    isCurrent
                      ? 'bg-brand-50 border-brand-300 text-brand-800 font-bold ring-2 ring-brand-400/30'
                      : isPast
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    {isPast ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : isCurrent ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                    )}
                  </div>
                  <span className="truncate block">{stg}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
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


