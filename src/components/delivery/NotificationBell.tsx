import React, { useEffect, useState, useRef } from 'react';
import api from '../../lib/delivery/api';
import { NotificationRow } from '../../lib/delivery/types';

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = () => api.get('/notifications', { params: { unacknowledged: true } }).then((r) => setItems(r.data)).catch(() => {});

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const acknowledge = async (id: number) => {
    await api.patch(`/notifications/${id}/acknowledge`);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn btn-sm" onClick={() => setOpen((o) => !o)}>
        🔔 {items.length > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 999, padding: '1px 6px', fontSize: '0.7rem', marginLeft: 4 }}>{items.length}</span>}
      </button>
      {open && (
        <div className="card" style={{ position: 'absolute', right: 0, top: 36, width: 320, maxHeight: 400, overflowY: 'auto', zIndex: 50, padding: 8 }}>
          {items.length === 0 ? (
            <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No new notifications.</div>
          ) : (
            items.map((n) => (
              <div key={n.id} style={{ padding: 10, borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                <div>{n.message}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ color: 'var(--text-subtle)', fontSize: '0.72rem' }}>{new Date(n.created_at).toLocaleString()}</span>
                  <button className="btn btn-sm" onClick={() => acknowledge(n.id)}>Dismiss</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
