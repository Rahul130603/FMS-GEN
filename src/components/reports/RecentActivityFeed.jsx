import React from 'react';
import {
  CheckCircle2,
  Eye,
  UploadCloud,
  MessageSquare,
  ArrowRightCircle,
  CheckCheck,
  UserCheck,
  Clock,
  Activity
} from 'lucide-react';
import { StatusBadge } from '../common/Badge';

const ICON_MAP = {
  CheckCircle2,
  Eye,
  UploadCloud,
  MessageSquare,
  ArrowRightCircle,
  CheckCheck,
  UserCheck,
  Clock
};

export function RecentActivityFeed({ activities = [], title = 'Recent Publishing Activity' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden mt-8">
      <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">Live production timeline & editorial updates</p>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {activities.length} Updates
        </span>
      </div>

      <div className="p-5">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No recent activity updates.
          </div>
        ) : (
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {activities.map((item, idx) => {
                const IconComponent = ICON_MAP[item.icon] || Clock;
                const isLast = idx === activities.length - 1;

                return (
                  <li key={item.id || idx}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span
                          className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex items-start space-x-3.5">
                        {/* Icon */}
                        <div>
                          <div
                            className={`relative px-1 flex h-8 w-8 items-center justify-center rounded-full border shadow-xs ${
                              item.color || 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <IconComponent className="h-4 w-4" aria-hidden="true" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-0.5">
                          <div>
                            <p className="text-xs font-medium text-slate-900">
                              <span className="font-semibold text-slate-800">{item.activity}</span>
                              {item.user && (
                                <span className="text-slate-500 font-normal"> by {item.user}</span>
                              )}
                            </p>
                            <p className="text-xs text-brand-700 font-mono mt-0.5">
                              {item.project}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 mt-1 sm:mt-0">
                            {item.status && <StatusBadge status={item.status} size="sm" />}
                            <time className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                              {item.timestamp}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
