import React, { useEffect, useState } from 'react';
import api from '../../lib/delivery/api';

interface DeliveredRow {
  id: number;
  isbn?: string;
  book_title: string;
  project_number: string;
  due_date?: string;
  actual_delivery?: string;
  onTime: boolean;
}

interface NotDeliveredRow {
  id: number;
  isbn?: string;
  book_title: string;
  project_number: string;
  due_date?: string;
  remaining_days: number | null;
  due_label: string;
  due_color: string;
}

export default function DeliveryStatusPanel({ onOpen }: { onOpen: (id: number) => void }) {
  const [delivered, setDelivered] = useState<DeliveredRow[]>([]);
  const [notDelivered, setNotDelivered] = useState<NotDeliveredRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reports/delivery-status')
      .then((r: any) => {
        setDelivered(Array.isArray(r?.data?.delivered) ? r.data.delivered : []);
        setNotDelivered(Array.isArray(r?.data?.notDelivered) ? r.data.notDelivered : []);
      })
      .catch(() => {
        setDelivered([]);
        setNotDelivered([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton" style={{ height: 160, marginBottom: 20 }} />;

  const deliveredList = delivered || [];
  const notDeliveredList = notDelivered || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#16a34a' }}>✅ Delivered (by ISBN)</span>
          <span className="badge" style={{ background: '#16a34a18', color: '#16a34a' }}>{deliveredList.length}</span>
        </div>
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          <table>
            <thead><tr><th>ISBN</th><th>Book Title</th><th>Delivered On</th></tr></thead>
            <tbody>
              {deliveredList.length === 0 ? (
                <tr><td colSpan={3} className="empty-state" style={{ textAlign: 'center', padding: '24px 16px' }}>No projects delivered yet.</td></tr>
              ) : (
                deliveredList.map((d) => (
                  <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => onOpen(d.id)}>
                    <td>{d.isbn || '—'}</td>
                    <td>{d.book_title} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>#{d.project_number}</span></td>
                    <td style={{ color: d.onTime ? '#16a34a' : '#f59e0b', fontWeight: 600 }}>{d.actual_delivery || '—'}{!d.onTime && ' (late)'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#ef4444' }}>⏳ Not Delivered (by ISBN)</span>
          <span className="badge" style={{ background: '#ef444418', color: '#ef4444' }}>{notDeliveredList.length}</span>
        </div>
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          <table>
            <thead><tr><th>ISBN</th><th>Book Title</th><th>Due Date</th><th>Time Remaining</th></tr></thead>
            <tbody>
              {notDeliveredList.length === 0 ? (
                <tr><td colSpan={4} className="empty-state" style={{ textAlign: 'center', padding: '24px 16px' }}>Everything has been delivered.</td></tr>
              ) : (
                notDeliveredList.map((d) => (
                  <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => onOpen(d.id)}>
                    <td>{d.isbn || '—'}</td>
                    <td>{d.book_title} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>#{d.project_number}</span></td>
                    <td>{d.due_date || '—'}</td>
                    <td style={{ color: d.due_color || '#16a34a', fontWeight: 600 }}>{d.due_label || 'In Progress'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
