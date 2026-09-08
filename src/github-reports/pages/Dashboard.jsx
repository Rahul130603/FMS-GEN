import React from 'react';
import { Link } from 'react-router-dom';
import { usePublishing } from '../context/PublishingContext';
import { useAuth } from '../context/AuthContext';
import { SummaryCard } from '../components/common/SummaryCard';
import { RecentActivityFeed } from '../components/reports/RecentActivityFeed';
import {
  BookOpen,
  FileCheck2,
  Inbox,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { StatusBadge, PriorityBadge, FormatBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';

export function Dashboard() {
  const { user } = useAuth();
  const { myProjects, incomingProjects, activities } = usePublishing();

  const totalAssigned = myProjects.length;
  const inProgress = myProjects.filter(p => p.status === 'In Progress').length;
  const newIncoming = incomingProjects.filter(p => p.status === 'New' || p.status === 'Ready for Assignment').length;
  const completed = myProjects.filter(p => p.status === 'Completed').length;

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 p-6 sm:p-8 text-white shadow-card">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-100 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-brand-300" />
            <span>Publishing Fulfillment Grid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-brand-100/90 leading-relaxed">
            You have <strong className="text-white font-bold">{inProgress} active production jobs</strong> in your queue and <strong className="text-white font-bold">{newIncoming} new incoming books</strong> awaiting intake review.
          </p>
          <div className="pt-3 flex flex-wrap gap-3">
            <Link
              to="/reports/my-report"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-brand-900 font-bold text-xs rounded-xl shadow-xs hover:bg-brand-50 transition-colors"
            >
              <FileCheck2 className="w-4 h-4 text-brand-700" />
              <span>Open My Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/reports/incoming"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700/80 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl border border-white/20 transition-colors"
            >
              <Inbox className="w-4 h-4" />
              <span>Review Incoming ({newIncoming})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          title="Assigned to Me"
          count={totalAssigned}
          icon={Layers}
          variant="primary"
          subtitle="Your workload"
        />
        <SummaryCard
          title="In Progress"
          count={inProgress}
          icon={Clock}
          variant="info"
          subtitle="Active conversion/QA"
        />
        <SummaryCard
          title="Incoming Queue"
          count={newIncoming}
          icon={Inbox}
          variant="warning"
          subtitle="Intake pending"
        />
        <SummaryCard
          title="Completed Books"
          count={completed}
          icon={CheckCircle2}
          variant="success"
          subtitle="Delivered to clients"
        />
      </div>

      {/* Dual Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Assigned Projects Preview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-900">Your Priority Publishing Deadlines</h2>
            </div>
            <Link to="/reports/my-report" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {myProjects.slice(0, 3).map((prj) => (
              <div key={prj.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-brand-700">{prj.id}</span>
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{prj.bookTitle}</h3>
                    <p className="text-[11px] text-slate-500">{prj.client} &bull; Due {prj.dueDate}</p>
                  </div>
                  <PriorityBadge priority={prj.priority} size="sm" />
                </div>
                <ProgressBar value={prj.progress} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Incoming Intake Preview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Incoming Publishing Intakes</h2>
            </div>
            <Link to="/reports/incoming" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
              Intake Manager <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {incomingProjects.slice(0, 3).map((p) => (
              <div key={p.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-indigo-700">{p.id}</span>
                    <FormatBadge format={p.format} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 truncate mt-0.5">{p.bookTitle}</h3>
                  <p className="text-[11px] text-slate-500">{p.client} &bull; Recv: {p.receivedDate}</p>
                </div>
                <StatusBadge status={p.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <RecentActivityFeed activities={activities} />
    </div>
  );
}
