import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_PALETTE } from '../../constants/technicalQuery';
import EmptyState from './EmptyState';

export default function BarChartCard({ title, data, bars, series, xKey = 'name', height = 280 }) {
  const barList = bars || series || [];

  return (
    <div className="card p-4">
      {title && <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>}
      {!data || data.length === 0 ? (
        <EmptyState title="No data for this period" />
      ) : (
        <ResponsiveContainer width="100%" height={height} minWidth={100} minHeight={height}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-slate-800" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            {barList.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {barList.map((bar, idx) => (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                name={bar.label || bar.name || bar.key}
                fill={bar.color || CHART_PALETTE[idx % CHART_PALETTE.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
