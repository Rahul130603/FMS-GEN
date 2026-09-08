import React from 'react';
import { UserCheck } from 'lucide-react';

export default function ReviewersTable({ reviewers, employees }) {
  if (!reviewers || reviewers.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-5 text-center text-xs text-slate-400">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Rework Raised By</h3>
        <p>No reviewer records available.</p>
      </div>
    );
  }

  const totalRework = reviewers.reduce((acc, r) => acc + r.rework, 0);
  const totalReject = reviewers.reduce((acc, r) => acc + r.reject, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col justify-between">
      <div>
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Rework Raised By</h3>
          </div>
          <span className="text-2xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
            QC & QAG Audit
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {reviewers.map(r => {
            const empInfo = (employees || []).find(e => e.name.toUpperCase() === r.reviewer.toUpperCase()) || {
              color: 'bg-slate-100 text-slate-700',
              border: 'border-slate-200'
            };
            const initials = r.reviewer.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();

            return (
              <div key={r.reviewer} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-6 h-6 rounded-full ${empInfo.color} ${empInfo.border} border text-[9px] font-bold flex items-center justify-center shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 leading-tight">{r.reviewer}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{r.stage} Auditor</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-600">{r.rework} Rework</div>
                  <div className="text-[10px] font-semibold text-rose-600">{r.reject} Reject</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 text-2xs text-slate-500 font-medium flex items-center justify-between">
        <span>Reviewers: <strong>{reviewers.length} active</strong></span>
        <span>Total: <strong className="text-amber-600">{totalRework} Rework</strong> • <strong className="text-rose-600">{totalReject} Reject</strong></span>
      </div>
    </div>
  );
}
