import React, { useState, useRef, useEffect } from 'react';
import { 
  Filter, 
  RotateCcw, 
  Calendar, 
  ChevronDown, 
  Check, 
  Layers, 
  BookOpen, 
  Image as ImageIcon, 
  CheckCircle2, 
  ShieldCheck, 
  ListFilter, 
  AlertTriangle, 
  XCircle, 
  UserX 
} from 'lucide-react';

export const roleConfig = [
  { id: 'All', label: 'All Roles', icon: Layers, badge: 'All', color: 'bg-slate-100 text-slate-700', sub: 'Complete department scope' },
  { id: 'BOOK SCAN', label: 'BOOK SCAN', icon: BookOpen, badge: 'Scan', color: 'bg-blue-100 text-blue-700', sub: 'Page scanning & digitization' },
  { id: 'COVER SCAN', label: 'COVER SCAN', icon: ImageIcon, badge: 'Cover', color: 'bg-indigo-100 text-indigo-700', sub: 'Cover, jacket & spine scan' },
  { id: 'QC', label: 'QC', icon: CheckCircle2, badge: 'QC', color: 'bg-amber-100 text-amber-700', sub: 'Quality check & image audit' },
  { id: 'QAG', label: 'QAG', icon: ShieldCheck, badge: 'QAG', color: 'bg-emerald-100 text-emerald-700', sub: 'Quality assurance & approval' }
];

export const statusConfig = [
  { id: 'All', label: 'All Statuses', icon: ListFilter, badge: 'All', color: 'bg-slate-100 text-slate-700', sub: 'Complete file defect queue' },
  { id: 'Rework', label: 'Rework Queue', icon: AlertTriangle, badge: 'Needs Fix', color: 'bg-amber-100 text-amber-700', sub: 'Defects requiring correction' },
  { id: 'Rejected', label: 'Reject Queue', icon: XCircle, badge: 'Rejected', color: 'bg-rose-100 text-rose-700', sub: 'Strict unrecoverable defects' },
  { id: 'Completed', label: 'Quality Passed', icon: CheckCircle2, badge: 'Passed', color: 'bg-emerald-100 text-emerald-700', sub: 'Corrected and verified files' }
];

export default function FilterPanel({
  dateIso,
  onDateChange,
  navigateDate,
  setTodayDate,
  displayInfo,
  employee,
  setEmployee,
  employees,
  role,
  setRole,
  status,
  setStatus,
  onReset
}) {
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
  const [empQuery, setEmpQuery] = useState('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const empRef = useRef(null);
  const roleRef = useRef(null);
  const statusRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (empRef.current && !empRef.current.contains(e.target)) setEmpDropdownOpen(false);
      if (roleRef.current && !roleRef.current.contains(e.target)) setRoleDropdownOpen(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setStatusDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const currentEmpInfo = employees.find(e => e.name.toUpperCase() === (employee || '').toUpperCase()) || null;

  const empInitials = currentEmpInfo ? currentEmpInfo.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() : '';
  const currentRoleInfo = roleConfig.find(r => r.id === role) || roleConfig[0];
  const currentStatusInfo = statusConfig.find(s => s.id === status) || statusConfig[0];
  const RoleIcon = currentRoleInfo.icon;
  const StatusIcon = currentStatusInfo.icon;

  const filteredEmployees = employees.filter(e => 
    e.name.toUpperCase().includes((empQuery || '').toUpperCase()) ||
    (e.role && e.role.toUpperCase().includes((empQuery || '').toUpperCase()))
  );

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3.5 transition-all">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Filter Operations Desk</span>
          <span className="text-2xs text-slate-400 font-medium">(Scope: {displayInfo?.pillText || 'Current'})</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            type="button" 
            onClick={() => {
              setEmpQuery('');
              onReset();
            }}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all cursor-pointer border border-transparent hover:border-slate-200"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Date Selector */}
        <div className="space-y-1">
          <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>{displayInfo?.filterLabel || 'Date'}</span>
            <div className="flex items-center space-x-1.5">
              <button 
                type="button" 
                onClick={() => navigateDate(-1)} 
                className="text-[10px] text-slate-500 hover:text-blue-600 font-semibold px-1.5 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
              >
                ◀ Prev
              </button>
              <button 
                type="button" 
                onClick={setTodayDate} 
                className="text-[10px] text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Today
              </button>
              <button 
                type="button" 
                onClick={() => navigateDate(1)} 
                className="text-[10px] text-slate-500 hover:text-blue-600 font-semibold px-1.5 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
              >
                Next ▶
              </button>
            </div>
          </label>
          <div className="relative flex items-center">
            <input 
              type="date" 
              value={dateIso} 
              onChange={(e) => onDateChange(e.target.value)} 
              className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden font-medium cursor-pointer transition-all bg-white hover:border-slate-300 pr-9" 
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[10px] font-semibold text-blue-600 truncate">
            {displayInfo?.scopeNotice || 'Daily scope'}
          </div>
        </div>

        {/* Employee Searchable Dropdown */}
        <div className="space-y-1 relative" ref={empRef}>
          <label className="text-2xs font-bold uppercase tracking-wider text-slate-500">Employee</label>
          <div className="relative group">
            {currentEmpInfo && (
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
                <div className={`w-5 h-5 rounded-full ${currentEmpInfo.color || 'bg-blue-100 text-blue-700'} text-[10px] font-bold flex items-center justify-center shrink-0`}>
                  {empInitials}
                </div>
              </div>
            )}
            <input 
              type="text" 
              value={empQuery || employee} 
              placeholder={employees.length === 0 ? "No employees available" : "All Employees"}
              disabled={employees.length === 0}
              onFocus={() => { if (employees.length > 0) setEmpDropdownOpen(true); }}
              onChange={(e) => {
                setEmpQuery(e.target.value);
                setEmpDropdownOpen(true);
              }}
              className={`w-full text-xs rounded-lg border border-slate-200 ${currentEmpInfo ? 'pl-9' : 'pl-3'} pr-16 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden font-semibold transition-all hover:border-slate-300 ${employees.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed bg-slate-50'}`} 
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 z-20">
              {employee && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEmpQuery('');
                    setEmployee('');
                  }} 
                  className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-400 hover:text-rose-600 flex items-center justify-center text-xs transition-colors cursor-pointer" 
                  title="Clear Employee"
                >
                  ✕
                </button>
              )}
              {employees.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => setEmpDropdownOpen(!empDropdownOpen)} 
                  className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${empDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {empDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden py-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                <span>Select Employee</span>
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-semibold">{filteredEmployees.length}</span>
              </div>
              <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 dropdown-scroll">
                {filteredEmployees.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <UserX className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                    <span>No employee found</span>
                  </div>
                ) : (
                  filteredEmployees.map(emp => {
                    const isSelected = emp.name.toUpperCase() === (employee || '').toUpperCase();
                    const initials = emp.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
                    return (
                      <div 
                        key={emp.name}
                        onClick={() => {
                          setEmployee(emp.name);
                          setEmpQuery('');
                          setEmpDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                          isSelected ? 'bg-blue-50/90 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-full ${emp.color || 'bg-slate-100 text-slate-700'} ${emp.border || 'border-slate-200'} border font-bold text-[11px] flex items-center justify-center shrink-0`}>
                            {initials}
                          </div>
                          <div className="min-w-0 text-left">
                            <div className="text-xs font-semibold truncate">{emp.name}</div>
                            {(emp.role || emp.dept) && (
                              <div className="text-[10px] text-slate-400 font-medium">
                                {[emp.role, emp.dept].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold shrink-0 ml-2">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Custom Role Dropdown */}
        <div className="space-y-1 relative" ref={roleRef}>
          <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Role / Stage</span>
            <span className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => setRole('All')}>
              {role === 'All' ? 'All' : 'Reset'}
            </span>
          </label>
          <div 
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-800 flex items-center justify-between bg-white hover:border-slate-300 cursor-pointer shadow-2xs group transition-all"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <div className={`w-5 h-5 rounded-md ${currentRoleInfo.color} flex items-center justify-center shrink-0`}>
                <RoleIcon className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-900 truncate">{currentRoleInfo.label}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {roleDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden py-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
                Select Operational Role
              </div>
              <div className="p-1.5 space-y-1">
                {roleConfig.map(r => {
                  const isSelected = r.id === role;
                  const IconComponent = r.icon;
                  return (
                    <div 
                      key={r.id}
                      onClick={() => {
                        setRole(r.id);
                        setRoleDropdownOpen(false);
                      }}
                      className={`px-2.5 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-50/90 border border-blue-200 text-blue-900 font-bold shadow-2xs' 
                          : 'hover:bg-slate-50 border border-transparent text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <div className={`w-7 h-7 rounded-lg ${r.color} flex items-center justify-center shrink-0`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold leading-tight text-slate-900">{r.label}</div>
                          <div className="text-[10px] text-slate-400 font-normal truncate">{r.sub}</div>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {isSelected ? (
                          <Check className="w-4 h-4 text-blue-600 font-black" />
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{r.badge}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Custom Status Dropdown */}
        <div className="space-y-1 relative" ref={statusRef}>
          <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Status</span>
            <span className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => setStatus('All')}>
              {status === 'All' ? 'All' : 'Reset'}
            </span>
          </label>
          <div 
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-800 flex items-center justify-between bg-white hover:border-slate-300 cursor-pointer shadow-2xs group transition-all"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <div className={`w-5 h-5 rounded-md ${currentStatusInfo.color} flex items-center justify-center shrink-0`}>
                <StatusIcon className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-900 truncate">{currentStatusInfo.label}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {statusDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden py-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
                Filter Defect Queue
              </div>
              <div className="p-1.5 space-y-1">
                {statusConfig.map(s => {
                  const isSelected = s.id === status;
                  const IconComponent = s.icon;
                  return (
                    <div 
                      key={s.id}
                      onClick={() => {
                        setStatus(s.id);
                        setStatusDropdownOpen(false);
                      }}
                      className={`px-2.5 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-50/90 border border-blue-200 text-blue-900 font-bold shadow-2xs' 
                          : 'hover:bg-slate-50 border border-transparent text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center shrink-0`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold leading-tight text-slate-900">{s.label}</div>
                          <div className="text-[10px] text-slate-400 font-normal truncate">{s.sub}</div>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {isSelected ? (
                          <Check className="w-4 h-4 text-blue-600 font-black" />
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{s.badge}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
