import React from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  RotateCcw,
  CheckCheck,
  XCircle,
  Sparkles,
  Flame,
  ArrowUpRight,
  Minus
} from 'lucide-react';
import { ProjectType, ErrorStatus } from '../../types/errors';
import { FeedbackStatus, FeedbackType, ProductionImpact } from '../../types/feedback';
import { Priority } from '../../types/common';

// --- Project Type Badge ---
export const ProjectTypeBadge: React.FC<{ projectType: ProjectType; size?: 'sm' | 'md' }> = ({ projectType, size = 'sm' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (projectType) {
    case 'Scan':
      return (
        <span className={`inline-flex items-center font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}>
          Scan
        </span>
      );
    case 'POD':
      return (
        <span className={`inline-flex items-center font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}>
          POD
        </span>
      );
    case 'EPDF':
      return (
        <span className={`inline-flex items-center font-bold rounded-md bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses}`}>
          EPDF
        </span>
      );
    case 'Accessibility':
      return (
        <span className={`inline-flex items-center font-bold rounded-md bg-teal-50 text-teal-700 border border-teal-200 ${sizeClasses}`}>
          Accessibility
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          {projectType}
        </span>
      );
  }
};

// --- Error Status Badges ---
export const ErrorStatusBadge: React.FC<{ status: ErrorStatus; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const iconSize = isSm ? 12 : 14;

  switch (status) {
    case 'Open':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span>Open</span>
        </span>
      );
    case 'In Progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}
        >
          <Clock size={iconSize} className="text-indigo-600" />
          <span>In Progress</span>
        </span>
      );
    case 'Resolved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <CheckCircle2 size={iconSize} className="text-emerald-600" />
          <span>Resolved</span>
        </span>
      );
    case 'Verified':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-teal-50 text-teal-800 border border-teal-200 ${sizeClasses}`}
        >
          <CheckCheck size={iconSize} className="text-teal-600" />
          <span>Verified</span>
        </span>
      );
    case 'Closed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}
        >
          <CheckCircle2 size={iconSize} className="text-slate-400" />
          <span>Closed</span>
        </span>
      );
    case 'Reopened':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}
        >
          <RotateCcw size={iconSize} className="text-purple-600" />
          <span>Reopened</span>
        </span>
      );
  }
};

// --- Feedback Status Badges ---
export const FeedbackStatusBadge: React.FC<{ status: FeedbackStatus; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const iconSize = isSm ? 12 : 14;

  switch (status) {
    case 'New':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          <span>New</span>
        </span>
      );
    case 'Under Review':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}
        >
          <Clock size={iconSize} className="text-amber-600" />
          <span>Under Review</span>
        </span>
      );
    case 'Planned':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}
        >
          <Sparkles size={iconSize} className="text-purple-600" />
          <span>Planned</span>
        </span>
      );
    case 'In Progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}
        >
          <Clock size={iconSize} className="text-indigo-600" />
          <span>In Progress</span>
        </span>
      );
    case 'Implemented':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <CheckCircle2 size={iconSize} className="text-emerald-600" />
          <span>Implemented</span>
        </span>
      );
    case 'Rejected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
        >
          <XCircle size={iconSize} className="text-rose-500" />
          <span>Rejected</span>
        </span>
      );
    case 'Duplicate':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}
        >
          <Minus size={iconSize} className="text-slate-400" />
          <span>Duplicate</span>
        </span>
      );
  }
};

// --- Feedback Type Badges ---
export const FeedbackTypeBadge: React.FC<{ type: FeedbackType }> = ({ type }) => {
  switch (type) {
    case 'Feature Request':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
          <Sparkles size={11} />
          <span>Feature Request</span>
        </span>
      );
    case 'Improvement':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ArrowUpRight size={11} />
          <span>Improvement</span>
        </span>
      );
    case 'Suggestion':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
          <Info size={11} />
          <span>Suggestion</span>
        </span>
      );
    case 'Usability Feedback':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
          <AlertCircle size={11} />
          <span>Usability</span>
        </span>
      );
    case 'Process Issue':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
          <AlertOctagon size={11} />
          <span>Process Issue</span>
        </span>
      );
  }
};

// --- Priority Badge ---
export const PriorityBadge: React.FC<{ priority: Priority; size?: 'sm' | 'md' }> = ({ priority, size = 'sm' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const iconSize = isSm ? 12 : 14;

  switch (priority) {
    case 'Critical':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <Flame size={iconSize} className="text-rose-600 animate-pulse" />
          <span>Critical</span>
        </span>
      );
    case 'High':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <AlertTriangle size={iconSize} className="text-rose-600" />
          <span>High</span>
        </span>
      );
    case 'Medium':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
          <AlertCircle size={iconSize} className="text-amber-600" />
          <span>Medium</span>
        </span>
      );
    case 'Low':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <Info size={iconSize} className="text-slate-500" />
          <span>Low</span>
        </span>
      );
  }
};

// --- Impact Badge ---
export const ImpactBadge: React.FC<{ impact?: ProductionImpact }> = ({ impact }) => {
  if (!impact) return null;
  switch (impact) {
    case 'Critical':
      return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800">Critical Impact</span>;
    case 'High':
      return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">High Impact</span>;
    case 'Medium':
      return <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">Medium Impact</span>;
    case 'Low':
      return <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">Low Impact</span>;
  }
};
