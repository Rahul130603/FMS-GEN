import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, 
  Sun, 
  CalendarRange, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  UserX, 
  Check 
} from 'lucide-react';

export default function Header({
  period,
  setPeriod,
  date,
  dateIso,
  onDateChange,
  navigateDate,
  employee,
  setEmployee,
  employees,
  displayInfo,
  backendOnline
}) {
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setEmpDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentEmpInfo = employees.find(e => e.name.toUpperCase() === (employee || '').toUpperCase()) || (employees.length > 0 ? employees[0] : null);

  const initials = currentEmpInfo ? currentEmpInfo.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() : '';

  const filteredEmployees = employees.filter(e => 
    e.name.toUpperCase().includes(empSearchQuery.toUpperCase()) ||
    e.role.toUpperCase().includes(empSearchQuery.toUpperCase()) ||
    e.dept.toUpperCase().includes(empSearchQuery.toUpperCase())
  );

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
      
      {/* Left: Branding, Title & Live Backend Badge */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-black text-slate-900 leading-tight tracking-tight">REWORK ROUND ANALYSIS</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
              Correction Desk
            </span>
            <span 
              className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                backendOnline 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={backendOnline ? "Connected to Node.js REST API (:9000)" : "Running in local fallback mode"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span>{backendOnline ? 'Backend: Live API' : 'Backend: Offline'}</span>
            </span>
          </div>
          <p className="text-2xs text-slate-400">Employee Defect Recovery & Correction Tracking • Day / Week / Month</p>
        </div>
      </div>

      {/* Right: Header Controls */}
      <div className="flex items-center space-x-3">
        
        {/* Main Report Period Switcher (Day / Week / Month) */}
        <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs font-semibold shadow-2xs">
          <button 
            type="button" 
            onClick={() => setPeriod('day')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              period === 'day' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Day</span>
          </button>
          <button 
            type="button" 
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              period === 'week' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5 text-blue-500" />
            <span>Week</span>
          </button>
          <button 
            type="button" 
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              period === 'month' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-purple-500" />
            <span>Month</span>
          </button>
        </div>

        {/* Date Stepper Navigation & Working Date Picker Pill */}
        <div className="flex items-center space-x-1">
          <button 
            type="button" 
            onClick={() => navigateDate(-1)} 
            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-all shadow-2xs cursor-pointer flex items-center justify-center" 
            title="Previous Date / Week / Month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="relative flex items-center">
            <button 
              type="button" 
              className="flex items-center border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 space-x-2 cursor-pointer transition-all hover:bg-slate-50 shadow-2xs group" 
              title="Click to choose date"
            >
              <span>{displayInfo?.pillText || date}</span>
              <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </button>
            <input 
              type="date" 
              value={dateIso} 
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10" 
              onChange={(e) => onDateChange(e.target.value)} 
            />
          </div>

          <button 
            type="button" 
            onClick={() => navigateDate(1)} 
            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-all shadow-2xs cursor-pointer flex items-center justify-center" 
            title="Next Date / Week / Month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Employee Selector Pill with Rich Dropdown (only when real backend employees exist) */}
        {employees && employees.length > 0 && currentEmpInfo && (
          <div className="relative" ref={dropdownRef}>
            <button 
              type="button" 
              onClick={() => setEmpDropdownOpen(!empDropdownOpen)} 
              className="flex items-center border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 bg-white text-xs font-semibold text-slate-800 space-x-2 cursor-pointer transition-all hover:bg-slate-50 shadow-2xs group"
            >
              <div className={`w-5 h-5 rounded-full ${currentEmpInfo.color || 'bg-blue-100 text-blue-700'} text-[10px] font-bold flex items-center justify-center shrink-0`}>
                {initials}
              </div>
              <span>{currentEmpInfo.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${empDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {empDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden py-1">
                <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                  <input 
                    type="text" 
                    value={empSearchQuery}
                    onChange={(e) => setEmpSearchQuery(e.target.value)}
                    placeholder="Search operator..." 
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden font-medium" 
                    autoFocus 
                  />
                </div>

                <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 dropdown-scroll">
                  {filteredEmployees.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      <UserX className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                      <span>No employees found</span>
                    </div>
                  ) : (
                    filteredEmployees.map(emp => {
                      const isSelected = emp.name.toUpperCase() === (employee || '').toUpperCase();
                      const empInitials = emp.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
                      return (
                        <div 
                          key={emp.name}
                          onClick={() => {
                            setEmployee(emp.name);
                            setEmpDropdownOpen(false);
                            setEmpSearchQuery('');
                          }}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                            isSelected ? 'bg-blue-50/90 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-full ${emp.color || 'bg-slate-100 text-slate-700'} ${emp.border || 'border-slate-200'} border font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs`}>
                              {empInitials}
                            </div>
                            <div className="min-w-0 text-left">
                              <div className="text-xs font-semibold truncate">{emp.name}</div>
                              {(emp.role || emp.dept) && (
                                <div className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                                  {emp.role && <span>{emp.role}</span>}
                                  {emp.role && emp.dept && <span>•</span>}
                                  {emp.dept && <span className="text-slate-500">{emp.dept}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold shrink-0 ml-2 shadow-2xs">
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
        )}

      </div>
    </header>
  );
}
