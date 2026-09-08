import React from 'react';
import { CheckCheck, Terminal, ShieldCheck, Play, FileCode, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

export const QaValidationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">QA & EpubCheck 5.1 Validation Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated schema validation, OPF manifest verification, CSS vendor check, and XHTML syntax checker.
          </p>
        </div>
        <Button variant="primary" size="md" icon={<Play size={14} />}>
          Run Full EPUB Validation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-semibold block">EpubCheck 5.1 Status</span>
          <span className="text-emerald-600 font-bold text-base mt-1 block">Passed (0 Fatal)</span>
          <span className="text-slate-400 text-[10px]">3 Warnings logged</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-semibold block">W3C HTML5 Linter</span>
          <span className="text-emerald-600 font-bold text-base mt-1 block">Valid</span>
          <span className="text-slate-400 text-[10px]">100% clean XHTML markup</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-semibold block">Cross-Ref Link Checker</span>
          <span className="text-amber-600 font-bold text-base mt-1 block">1 Broken Link</span>
          <span className="text-slate-400 text-[10px]">Logged in Error Reports</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-semibold block">E-Reader Compatibility</span>
          <span className="text-indigo-600 font-bold text-base mt-1 block">99.2% Device Ready</span>
          <span className="text-slate-400 text-[10px]">Kindle, Apple Books, Kobo</span>
        </div>
      </div>

      <div className="bg-slate-950 text-slate-200 rounded-xl p-4 border border-slate-800 font-mono text-xs space-y-2">
        <div className="text-slate-400 pb-2 border-b border-slate-800 flex justify-between">
          <span>EpubCheck 5.1.0 Batch Output Log</span>
          <span>Target: Digital_Publishing_Guide_v4.epub</span>
        </div>
        <div className="text-emerald-400">EpubCheck version 5.1.0 (built with Jing / Saxon-HE)</div>
        <div className="text-slate-300">Validating against EPUB version 3.2 rules.</div>
        <div className="text-emerald-400">Validating OEBPS/package.opf ... OK</div>
        <div className="text-emerald-400">Validating OEBPS/toc.ncx ... OK</div>
        <div className="text-emerald-400">Validating OEBPS/nav.xhtml ... OK</div>
        <div className="text-slate-300">Validating 24 content documents ...</div>
        <div className="text-emerald-400">No fatal errors detected. Package passes standard publishing distributor ingest gates.</div>
      </div>
    </div>
  );
};
