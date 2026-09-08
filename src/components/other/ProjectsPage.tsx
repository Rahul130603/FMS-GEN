import React from 'react';
import { INITIAL_BOOKS } from '../../data/initialBooks';
import { FolderGit2, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';

export const ProjectsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Publishing Projects & Milestones</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track multi-phase editorial releases, conversion pipelines, and publishing sign-offs.
          </p>
        </div>
        <Button variant="primary" size="md">
          + New Project Milestone
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
        {INITIAL_BOOKS.map((project) => (
          <div key={project.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <FolderGit2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">{project.projectCode}</span>
                  <h3 className="text-sm font-bold text-slate-900">{project.title}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Author: {project.author} • Format: {project.format}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                  <span>Target Release: Oct 15, 2026</span>
                  <span>•</span>
                  <span>{project.chaptersCount} chapters compiled</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {project.status}
              </span>
              <Button variant="secondary" size="sm">
                Manage Milestone
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
