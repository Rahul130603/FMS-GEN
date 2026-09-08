import React from 'react';

export default function Pagination({ page, limit, total, onChange }: { page: number; limit: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
      <span>{total} result{total === 1 ? '' : 's'} · page {page} of {pages}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Prev</button>
        <button className="btn btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}
