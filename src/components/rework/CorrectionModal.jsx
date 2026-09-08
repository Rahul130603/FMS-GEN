import React from 'react';
import { X, Check } from 'lucide-react';

export default function CorrectionModal({ file, onClose, onResolve }) {
  if (!file) return null;

  const isCorrected = file.correction_status === 'CORRECTED';
  const isRejected = file.status === 'REJECT';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">File Defect Inspector</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800">
              {file.file_id}
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Book Title</label>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{file.book_name}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Work Stage</label>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">{file.work_stage}</div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Time</label>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">{file.completed_time}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Auditor Flagged By</label>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">{file.checked_by} ({file.checked_stage})</div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Defect Reason</label>
              <div className="text-xs font-semibold text-amber-700 mt-0.5">{file.reason}</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Correction Status</div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                {isCorrected ? '100% Fixed & Cleared' : isRejected ? 'Unrecoverable Defect' : 'Correction Pending'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                isCorrected ? 'bg-emerald-100 text-emerald-800' : isRejected ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {file.correction_status}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
          {!isCorrected && !isRejected && (
            <button 
              type="button" 
              onClick={() => onResolve(file.file_id)} 
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark as Corrected (100% Fixed)</span>
            </button>
          )}
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
