import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_PALETTE } from '../../constants/technicalQuery';
import EmptyState from './EmptyState';

export default function LineChartCard({ title, data, lines, series, xKey = 'name', height = 300 }) {
  const lineList = lines || series || [];

  return (
    <div className="card p-4">
      {title && <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>}
      {!data || data.length === 0 ? (
        <EmptyState title="No data for this period" />
      ) : (
        <ResponsiveContainer width="100%" height={height} minWidth={100} minHeight={height}>
          <LineChart data={data} margin={{ top: 4, right: 12, left: -16, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-slate-800" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {lineList.map((line, idx) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label || line.name || line.key}
                stroke={line.color || CHART_PALETTE[idx % CHART_PALETTE.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
