import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const STATUS_COLORS = {
  'Completed': '#10b981',
  'WIP': '#3b82f6',
  'Pending': '#f59e0b',
  'Delayed': '#f97316',
  'Overdue': '#ef4444',
  'No Activity': '#94a3b8',
  'Rework': '#a855f7'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        padding: '6px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        fontSize: '12px'
      }}>
        <div style={{ fontWeight: '600', color: data.payload.color }}>
          {data.name}: <strong>{data.value} Employees</strong>
        </div>
      </div>
    );
  }
  return null;
};

export default function StatusDistribution({ records }) {
  // Aggregate status counts dynamically
  const statusCounts = {};
  records.forEach((rec) => {
    let s = rec.status;
    if (s === 'In Progress') s = 'WIP';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  const pieData = Object.entries(statusCounts)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name] || '#64748b'
    }));

  const totalEmps = records.length;

  return (
    <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="dashboard-card-header">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PieIcon size={17} className="text-blue-600" />
          Today's Status Distribution
        </h3>
        <span className="card-badge-info">{totalEmps} Employees Filtered</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', height: 230 }}>
        {pieData.length > 0 ? (
          <>
            <div style={{ width: '50%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={pieData}
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Clean Legend */}
            <div style={{ width: '50%', paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pieData.map((entry) => {
                const percent = totalEmps > 0 ? Math.round((entry.value / totalEmps) * 100) : 0;
                return (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }} />
                      <span style={{ color: '#475569', fontWeight: '500' }}>{entry.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>{entry.value}</span>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            No status data to display.
          </div>
        )}
      </div>
    </div>
  );
}
