import React from 'react';
import { priorityColor, statusColor, healthColor, riskColor } from '../../lib/delivery/format';

export function PriorityBadge({ value }: { value: string }) {
  const c = priorityColor(value);
  return <span className="badge" style={{ background: c + '18', color: c }}>{value}</span>;
}

export function StatusBadge({ value }: { value: string }) {
  const { bg, fg } = statusColor(value);
  return <span className="badge" style={{ background: bg, color: fg }}>{value}</span>;
}

export function HealthBadge({ category }: { category: string }) {
  const c = healthColor(category);
  return <span className="badge" style={{ background: c + '18', color: c }}>{category}</span>;
}

export function RiskBadge({ risk }: { risk: string }) {
  const c = riskColor(risk);
  return <span className="badge" style={{ background: c + '18', color: c }}>{risk}</span>;
}

export function DueBadge({ label, color }: { label: string; color: string }) {
  return <span style={{ color, fontWeight: 600, fontSize: '0.78rem' }}>{label}</span>;
}
