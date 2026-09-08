import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const allocated = payload.find(p => p.dataKey === 'allocated')?.value || 0;
    const completed = payload.find(p => p.dataKey === 'completed')?.value || 0;
    const completionRate = allocated > 0 ? Math.round((completed / allocated) * 100) : 0;

    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontSize: '12px'
      }}>
        <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
          {label} <span style={{ fontWeight: '400', color: '#64748b' }}>({data.role})</span>
        </div>
        <div style={{ color: '#2563eb', marginBottom: '3px' }}>
          Allocated: <strong>{allocated} files</strong>
        </div>
        <div style={{ color: '#10b981', marginBottom: '4px' }}>
          Completed: <strong>{completed} files</strong>
        </div>
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '4px', color: '#64748b', fontSize: '11px' }}>
          Completion Rate: <strong style={{ color: '#0f172a' }}>{completionRate}%</strong>
        </div>
      </div>
    );
  }
  return null;
};

export default function AllocationChart({ records }) {
  // Take first 8-10 records for readable, non-crowded bar chart
  const chartData = (records || []).slice(0, 8).map(item => ({
    name: item.employeeName.split(' ')[0], // Short first name for clean axis
    fullName: item.employeeName,
    role: item.role,
    allocated: item.allocated,
    completed: item.completed
  }));

  return (
    <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="dashboard-card-header">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={17} className="text-blue-600" />
          Allocation vs Completion
        </h3>
        <span className="card-badge-info">Employee-wise Comparison</span>
      </div>

      <div style={{ width: '100%', height: 240 }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
              />
              <Bar
                dataKey="allocated"
                name="Allocated Files"
                fill="#93c5fd"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="completed"
                name="Completed Files"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
            No chart data available for current filters.
          </div>
        )}
      </div>
    </div>
  );
}
