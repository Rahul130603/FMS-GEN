import React from 'react';
import { EventRow } from '../../lib/delivery/types';

export default function Timeline({ events }: { events: EventRow[] }) {
  if (!events.length) return <div className="empty-state">No activity recorded yet.</div>;
  return (
    <div className="timeline">
      {events.map((e) => (
        <div className="timeline-item" key={e.id}>
          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{e.event}</div>
          {(e.old_status || e.new_status) && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {e.old_status || '—'} → {e.new_status || '—'}
            </div>
          )}
          {e.note && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.note}</div>}
          <div className="timeline-time">{new Date(e.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
