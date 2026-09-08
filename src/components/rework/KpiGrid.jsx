import React from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Layers, 
  BookOpen, 
  CheckCheck, 
  ShieldAlert 
} from 'lucide-react';

export default function KpiGrid({ kpis }) {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 px-6 py-4">
      
      {/* 1. Rework Count */}
      <div className="bg-white border border-amber-200/80 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-amber-600 mb-1">
          <span className="text-2xs font-bold uppercase tracking-wider">Rework Load</span>
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="text-2xl font-black text-slate-900">{kpis.rework.toLocaleString()}</div>
        <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
          {kpis.rework_rate} rate
        </div>
      </div>

      {/* 2. Reject Count */}
      <div className="bg-white border border-rose-200/80 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-rose-600 mb-1">
          <span className="text-2xs font-bold uppercase tracking-wider">Strict Reject</span>
          <XCircle className="w-4 h-4" />
        </div>
        <div className="text-2xl font-black text-slate-900">{kpis.reject.toLocaleString()}</div>
        <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
          {kpis.reject_rate} rate
        </div>
      </div>

      {/* 3. Total Defect Load */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-2xs font-bold uppercase tracking-wider">Total Defects</span>
          <Layers className="w-4 h-4" />
        </div>
        <div className="text-2xl font-black text-slate-900">{kpis.total_defects.toLocaleString()}</div>
        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
          Rework + Reject
        </div>
      </div>

      {/* 4. Quality Passed / Corrected */}
      <div className="bg-white border border-emerald-200/80 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-emerald-600 mb-1">
          <span className="text-2xs font-bold uppercase tracking-wider">Cleared / Passed</span>
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="text-2xl font-black text-slate-900">{kpis.corrected_count.toLocaleString()}</div>
        <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
          {kpis.recovery_rate}% Recovery
        </div>
      </div>

      {/* 5. Scan Stage Defects */}
      <div className="bg-white border border-blue-200/80 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-blue-600 mb-1">
          <span className="text-2xs font-bold uppercase tracking-wider">Scan Origin</span>
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="text-2xl font-black text-slate-900">{kpis.scan_issues.toLocaleString()}</div>
        <div className="text-[10px] text-blue-700 font-medium mt-0.5">
          Digitization queue
        </div>
      </div>

      {/* 6. QC Stage Defects */}
      <div className="bg-white border border-purple-200/80 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-purple-600 mb-1">
          <span className="text-2xs font-bold uppercase tracking-wider">QC Audit</span>
          <CheckCheck className="w-4 h-4" />
        </div>
        <div className="text-2xl font-black text-slate-900">{kpis.qc_issues.toLocaleString()}</div>
        <div className="text-[10px] text-purple-700 font-medium mt-0.5">
          Audit flagged
        </div>
      </div>

      {/* 7. QAG Stage Defects */}
      <div className="bg-white border border-emerald-200/80 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-emerald-600 mb-1">
          <span className="text-2xs font-bold uppercase tracking-wider">QAG Audit</span>
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="text-2xl font-black text-slate-900">{kpis.qag_issues.toLocaleString()}</div>
        <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
          Approval stage
        </div>
      </div>

    </div>
  );
}
