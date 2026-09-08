import React from 'react';
import { Eye, ShieldCheck, CheckCircle2, AlertTriangle, Flame, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

export const AccessibilityPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">EPUB Accessibility & WCAG 2.1 Audit Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            DAISY Ace validator conformance, screen-reader navigation verification, and accessible math annotations.
          </p>
        </div>
        <Button variant="primary" size="md" icon={<Eye size={14} />}>
          Run Ace Audit Pass
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">WCAG 2.1 AA Compliance</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">94.8% Score</div>
          <p className="text-[11px] text-slate-400 mt-1">2 rules require attention</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Image Alt-Text Coverage</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">142 / 148 Images</div>
          <p className="text-[11px] text-rose-500 font-semibold mt-1">6 images missing descriptions</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Heading Hierarchy</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">Sequential</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Zero skipped levels detected</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Accessibility Conformance Breakdown</h3>
        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Perceivable (Color Contrast & Text Alternatives)</span>
              <span>92%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Operable (Keyboard Navigation & Landmarks)</span>
              <span>98%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[98%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Understandable (Language & Heading Sequence)</span>
              <span>95%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[95%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
