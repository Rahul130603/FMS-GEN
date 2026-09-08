import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox, CheckCircle2, XCircle, Flame, Clock, Hourglass, RotateCcw, ListChecks, Bell, PlusCircle
} from 'lucide-react';
import StatCard from '../../components/technicalQuery/StatCard';
import { SkeletonCards } from '../../components/technicalQuery/Skeleton';
import { technicalQueryApi, notificationApi } from '../../services/technicalQueryApi';
import { formatHours, formatRelative } from '../../utils/tqFormatters';
import { useAuth } from '../../context/AuthContext';
import '../../styles/technical-query.css';

export function TechnicalQueryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    technicalQueryApi.myDashboard().then((res) => {
      setData(res.data);
      setLoading(false);
    });
    notificationApi.list().then((res) => {
      setNotifications(res.data || []);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Technical Query Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome, {user?.name || 'Operator'}. Log and track production system tickets, errors, and delivery roadblocks.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          onClick={() => navigate('/technical-query/raise')}
        >
          <PlusCircle size={15} /> Raise New Query
        </button>
      </div>

      {loading && <SkeletonCards count={8} />}

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Raised" value={data.total_queries} icon={ListChecks} onClick={() => navigate('/technical-query/my-queries')} />
          <StatCard label="Open" value={data.open_count} icon={Inbox} tone="blue" onClick={() => navigate('/technical-query/my-queries')} />
          <StatCard label="Resolved" value={data.resolved_count} icon={CheckCircle2} tone="green" onClick={() => navigate('/technical-query/my-queries')} />
          <StatCard label="Closed" value={data.closed_count} icon={XCircle} tone="slate" onClick={() => navigate('/technical-query/my-queries')} />
          <StatCard label="Pending" value={data.pending_count} icon={Hourglass} tone="amber" />
          <StatCard label="Urgent" value={data.urgent_count} icon={Flame} tone="red" />
          <StatCard label="Reopened" value={data.reopened_count} icon={RotateCcw} tone="red" />
          <StatCard label="Avg. Resolution Time" value={formatHours(data.avg_resolution_hours)} icon={Clock} />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <Bell size={15} className="text-brand-600" /> Recent System Notifications
        </h3>
        {notifications.length === 0 ? (
          <p className="text-xs text-slate-400">No new alerts at this time.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-600" />
                  <span className="text-slate-700 font-medium">{n.message}</span>
                </div>
                <span className="text-slate-400 text-[11px]">{formatRelative(n.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TechnicalQueryDashboard;
