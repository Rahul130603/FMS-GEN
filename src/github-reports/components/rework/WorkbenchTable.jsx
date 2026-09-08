import React, { useState } from 'react';
import { 
  FileText, 
  Check, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle 
} from 'lucide-react';

export default function WorkbenchTable({
  files,
  onSelectFile,
  onQuickResolve,
  kpis,
  period
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalFiles = files ? files.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalFiles / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentFiles = files ? files.slice(startIndex, startIndex + pageSize) : [];

  return (
    <div className="px-6 py-2">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        
        {/* Table Header & Summary */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">File-Level Correction Workbench</h3>
            <span className="text-[10px] text-slate-400 font-medium">
              (Showing {totalFiles} defect files • {kpis?.corrected_count || 0} Corrected, {kpis?.pending_count || 0} Pending)
            </span>
          </div>
          <div className="text-2xs text-slate-500 font-medium">
            1-Click resolution syncs directly to server
          </div>
        </div>

        {/* Files Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-4">File ID</th>
                <th className="py-2.5 px-4">Book Title</th>
                <th className="py-2.5 px-4">Work Stage</th>
                <th className="py-2.5 px-4">Audit Raised By</th>
                <th className="py-2.5 px-4">Defect Reason</th>
                <th className="py-2.5 px-4">Queue Status</th>
                <th className="py-2.5 px-4">Correction</th>
                <th className="py-2.5 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {currentFiles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No files found in this queue.
                  </td>
                </tr>
              ) : (
                currentFiles.map(file => {
                  const isCorrected = file.correction_status === 'CORRECTED';
                  const isRejected = file.status === 'REJECT';

                  return (
                    <tr key={file.file_id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {file.file_id}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate" title={file.book_name}>
                        {file.book_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {file.work_stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600 font-medium">
                        {file.checked_by} ({file.checked_stage})
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {file.reason}
                      </td>
                      <td className="py-3 px-4">
                        {file.status === 'REWORK' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Rework</span>
                          </span>
                        )}
                        {file.status === 'REJECT' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
                          </span>
                        )}
                        {file.status === 'COMPLETED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Passed</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isCorrected ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-[11px]">
                            <Check className="w-3.5 h-3.5" />
                            <span>Corrected</span>
                          </span>
                        ) : isRejected ? (
                          <span className="text-rose-600 font-medium text-[11px]">Strict Reject</span>
                        ) : (
                          <span className="text-amber-600 font-semibold text-[11px]">Pending Fix</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {!isCorrected && !isRejected && (
                          <button
                            type="button"
                            onClick={() => onQuickResolve(file.file_id)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-200 transition-all cursor-pointer inline-flex items-center space-x-1 shadow-2xs"
                            title="1-Click Mark Corrected"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark Fixed</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectFile(file)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition-all cursor-pointer inline-flex items-center space-x-1"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-2xs text-slate-500 font-medium">
            Showing Page {currentPage} of {totalPages} ({totalFiles} files)
          </span>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
