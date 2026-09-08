import React from 'react';

export default function KpiCard({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="card kpi-card">
      <div className="label">{label}</div>
      <div className="value" style={{ color: color || 'var(--text)' }}>{value}</div>
    </div>
  );
}
