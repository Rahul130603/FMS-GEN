import React from 'react';
import { Cpu, Terminal, FileCode, Play, Layers, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

export const ProductionPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">EPUB Production & Asset Compiler</h1>
          <p className="text-xs text-slate-500 mt-1">
            Build OEBPS manifests, compile OPF spine packages, minify CSS, and generate TOC navMap.
          </p>
        </div>
        <Button variant="primary" size="md" icon={<Play size={14} />}>
          Run Package Build
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Spine Builder</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">16 / 16 Documents</div>
          <p className="text-[11px] text-slate-500 mt-1">Reflowable XHTML validated</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Stylesheets & Fonts</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">4 CSS Bundles</div>
          <p className="text-[11px] text-slate-500 mt-1">Adobe obfuscation active</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">TOC & Landmarks</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">nav.xhtml & ncx</div>
          <p className="text-[11px] text-slate-500 mt-1">Dual navigation synchronized</p>
        </div>
      </div>

      <div className="bg-slate-900 text-slate-200 rounded-xl p-4 border border-slate-800 font-mono text-xs space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
          <span>Live Ingest & Compiler Log</span>
          <span>pubvantage-compiler-worker #4</span>
        </div>
        <div className="text-emerald-400">[INFO] Compiling EPUB 3.2 package for 'The Art of Modern Living' (PUB-AML-2026)...</div>
        <div className="text-slate-300">[INFO] Parsing OPF package manifest: 84 items detected.</div>
        <div className="text-slate-300">[INFO] Validating XHTML 1.1 schema conformance across 16 spine items...</div>
        <div className="text-emerald-400">[SUCCESS] Package compiled in 1.42s (Output: build/PUB-AML-2026.epub, Size: 14.8 MB)</div>
      </div>
    </div>
  );
};
