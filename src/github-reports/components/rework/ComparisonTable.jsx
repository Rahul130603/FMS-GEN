import React from 'react';
import { Users2 } from 'lucide-react';

export default function ComparisonTable({ comparison, currentEmployee, displayInfo }) {
  if (!comparison || comparison.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-5 text-center text-xs text-slate-400">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          {displayInfo?.comparisonTitle || 'Team Performance Comparison'}
        </h3>
        <p>No comparison records available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col justify-between">
      <div>
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {displayInfo?.comparisonTitle || 'Team Performance Comparison'}
            </h3>
          </div>
          <span className="text-2xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            Clearance Benchmark
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4 text-right">Rework</th>
                <th className="py-2.5 px-4 text-right">Corrected</th>
                <th className="py-2.5 px-4 text-right">Pending</th>
                <th className="py-2.5 px-4 text-right">Clearance %</th>
                <th className="py-2.5 px-4 text-right">Reject</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {comparison.map(emp => {
                const isCurrent = emp.employee.toUpperCase() === (currentEmployee || '').toUpperCase();
                return (
                  <tr 
                    key={emp.employee} 
                    className={`transition-colors ${isCurrent ? 'bg-blue-50/60 font-semibold text-blue-900' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="py-2.5 px-4 font-bold flex items-center space-x-1.5">
                      <span>{emp.employee}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[9px] font-black">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-medium text-slate-500">{emp.role}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-amber-600">{emp.rework}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{emp.corrected}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-slate-600">{emp.pending}</td>
                    <td className="py-2.5 px-4 text-right font-black text-blue-600">{emp.clearance_rate}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-rose-600">{emp.reject}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 text-2xs text-slate-500 font-medium flex items-center justify-between">
        <span>Operators compared: <strong>{comparison.length}</strong></span>
        <span>Average Team Clearance: <strong className="text-emerald-600">~81%</strong></span>
      </div>
    </div>
  );
}
