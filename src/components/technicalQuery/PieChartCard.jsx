import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_PALETTE } from '../../constants/technicalQuery';
import EmptyState from './EmptyState';

export default function PieChartCard({ title, data, dataKey = 'value', nameKey = 'name', height = 280 }) {
  return (
    <div className="card p-4">
      {title && <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>}
      {!data || data.length === 0 ? (
        <EmptyState title="No data for this period" />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={data} dataKey={dataKey} nameKey={nameKey} innerRadius={55} outerRadius={90} paddingAngle={2}>
              {data.map((_, idx) => (
                <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
