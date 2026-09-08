import React from 'react';
import { downloadExport } from '../../lib/delivery/api';

export default function ExportButtons({ params, scope }: { params: Record<string, any>; scope?: string }) {
  const merged = { ...params, scope };
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button className="btn btn-sm" onClick={() => downloadExport('csv', merged, 'delivery-report.csv')}>Export CSV</button>
      <button className="btn btn-sm" onClick={() => downloadExport('excel', merged, 'delivery-report.xlsx')}>Export Excel</button>
      <button className="btn btn-sm" onClick={() => downloadExport('pdf', merged, 'delivery-report.pdf')}>Export PDF</button>
    </div>
  );
}
