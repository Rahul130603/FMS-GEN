import React, { useState, useEffect } from 'react';
import {
  Inbox, CheckCircle2, XCircle, Flame, Clock, Hourglass, RotateCcw, ListChecks, BarChart3, TrendingUp
} from 'lucide-react';
import StatCard from '../../components/technicalQuery/StatCard';
import BarChartCard from '../../components/technicalQuery/BarChartCard';
import LineChartCard from '../../components/technicalQuery/LineChartCard';
import { SkeletonCards } from '../../components/technicalQuery/Skeleton';
import { reportApi } from '../../services/technicalQueryApi';
import { formatHours } from '../../utils/tqFormatters';
import { CATEGORY_LABELS } from '../../constants/technicalQuery';
import '../../styles/technical-query.css';

import ErrorBoundary from '../../components/common/ErrorBoundary';

export function TechnicalQueryReportsPage() {
  const [data, setData] = useState(null);
  const [catData, setCatData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportApi.dashboard(),
      reportApi.categoryAnalytics(),
      reportApi.trendReport()
    ]).then(([d, c, t]) => {
      setData(d?.data || null);
      setCatData(
        (c?.data || []).map((item) => ({
          name: CATEGORY_LABELS[item.category] || item.category,
          count: item.count
        }))
      );
      setTrendData(t?.data || []);
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching technical query reports:', err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Technical Query Analytics &amp; Reports
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Executive telemetry across open tickets, categories, resolution cycle times, and reopening rates.
        </p>
      </div>

      {loading && <SkeletonCards count={8} />}

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Queries" value={data.total_queries} icon={ListChecks} />
          <StatCard label="Open" value={data.open_count} icon={Inbox} tone="blue" />
          <StatCard label="Resolved" value={data.resolved_count} icon={CheckCircle2} tone="green" />
          <StatCard label="Closed" value={data.closed_count} icon={XCircle} tone="slate" />
          <StatCard label="Pending Action" value={data.pending_count} icon={Hourglass} tone="amber" />
          <StatCard label="Urgent Priority" value={data.urgent_count} icon={Flame} tone="red" />
          <StatCard label="Reopened Rate" value={data.reopened_count} icon={RotateCcw} tone="red" />
          <StatCard label="Avg. Resolution Time" value={formatHours(data.avg_resolution_hours)} icon={Clock} />
        </div>
      )}

      {/* Visual Telemetry Charts */}
      <ErrorBoundary fallbackTitle="Could not load charts">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChartCard
            title="Root Cause / Category Distribution"
            data={catData}
            xKey="name"
            bars={[{ key: 'count', label: 'Queries', color: '#026bc7' }]}
            series={[{ key: 'count', label: 'Queries', color: '#026bc7' }]}
          />
          <LineChartCard
            title="Daily Query Volume & Resolution Trend"
            data={trendData}
            xKey="date"
            lines={[
              { key: 'raised', label: 'Raised', color: '#ef4444' },
              { key: 'resolved', label: 'Resolved', color: '#10b981' }
            ]}
            series={[
              { key: 'raised', label: 'Raised', color: '#ef4444' },
              { key: 'resolved', label: 'Resolved', color: '#10b981' }
            ]}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
}

export default TechnicalQueryReportsPage;
