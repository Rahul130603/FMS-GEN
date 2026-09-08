import React from 'react';

export default function ProfileHero({
  employee,
  employees = [],
  kpis,
  status,
  setStatus,
  displayInfo
}) {
  if (!employee || !employees || employees.length === 0) {
    return null;
  }

  const currentEmpInfo = employees.find(e => e.name.toUpperCase() === (employee || '').toUpperCase());
  if (!currentEmpInfo) {
    return null;
  }

  const initials = (currentEmpInfo.name || '').split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  const recoveryRate = kpis ? parseFloat(kpis.recovery_rate) || 0 : 0;
  const pendingRate = Math.max(0, 100 - recoveryRate);

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Employee Avatar & Profile Details */}
        <div className="flex items-center space-x-4">
          <div className={`w-14 h-14 rounded-full ${currentEmpInfo.color} ${currentEmpInfo.border} border-2 flex items-center justify-center text-lg font-black shadow-xs shrink-0`}>
            {initials}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{currentEmpInfo.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {currentEmpInfo.role} • {currentEmpInfo.dept}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
              <span>{displayInfo?.scopeNotice || 'Daily Scope'}</span>
              <span>•</span>
              <span className="font-semibold text-emerald-600">Recovery Rate: {kpis?.recovery_rate || '0.00'}%</span>
            </div>
          </div>
        </div>

        {/* Center: Recovery Progress Bar */}
        <div className="w-full md:w-72 space-y-1.5">
          <div className="flex justify-between text-2xs font-bold text-slate-600">
            <span>Clearance Progress</span>
            <span className="text-emerald-600 font-extrabold">{kpis?.recovery_rate || '0.00'}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${recoveryRate}%` }} 
              className="bg-emerald-500 h-full transition-all duration-300"
              title={`${kpis?.corrected_count || 0} Corrected`}
            />
            <div 
              style={{ width: `${pendingRate}%` }} 
              className="bg-amber-400 h-full transition-all duration-300"
              title={`${kpis?.pending_count || 0} Pending`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>{kpis?.corrected_count || 0} Corrected</span>
            <span>{kpis?.pending_count || 0} Pending</span>
          </div>
        </div>

        {/* Right: Quick Status Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
          {[
            { id: 'All', label: 'All', count: kpis?.total_defects || 0 },
            { id: 'Rework', label: 'Rework', count: kpis?.rework || 0 },
            { id: 'Rejected', label: 'Reject', count: kpis?.reject || 0 },
            { id: 'Completed', label: 'Passed', count: kpis?.corrected_count || 0 }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatus(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 cursor-pointer ${
                status === tab.id ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1 py-0.2 bg-slate-200/70 rounded-full text-slate-700 font-bold">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
