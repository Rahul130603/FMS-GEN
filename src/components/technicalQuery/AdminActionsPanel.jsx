import React, { useEffect, useState } from 'react';
import {
  UserCheck, ArrowRightLeft, StickyNote, HelpCircle, CheckCircle2, XCircle, RotateCcw, Archive,
} from 'lucide-react';
import Modal from './Modal';
import { technicalQueryApi } from '../../services/technicalQueryApi';
import { metaApi } from '../../services/technicalQueryApi';
import { PRIORITIES, STATUSES } from '../../constants/technicalQuery';

/**
 * Every button here maps 1:1 to a backend endpoint that automatically
 * writes a technical_query_events row — the audit trail is never a
 * client-side concern, so this component only needs to call the API
 * and then ask the parent to refresh.
 */
export default function AdminActionsPanel({ query, onChanged }) {
  const [admins, setAdmins] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // 'assign' | 'priority' | 'status' | 'notes' | 'info' | 'resolve' | 'reopen'
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    metaApi.lookups().then((res) => setAdmins(res.data.admins)).catch(() => {});
  }, []);

  const close = () => { setActiveModal(null); setForm({}); setError(''); };

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      close();
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const isTerminal = query.status === 'closed' || query.status === 'archived';

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Admin Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-outline !text-xs" onClick={() => setActiveModal('assign')}><UserCheck size={14} /> Assign</button>
        <button className="btn-outline !text-xs" onClick={() => setActiveModal('priority')}><ArrowRightLeft size={14} /> Priority</button>
        <button className="btn-outline !text-xs" onClick={() => setActiveModal('status')}><ArrowRightLeft size={14} /> Status</button>
        <button className="btn-outline !text-xs" onClick={() => setActiveModal('notes')}><StickyNote size={14} /> Notes</button>
        <button className="btn-outline !text-xs" onClick={() => setActiveModal('info')} disabled={isTerminal}>
          <HelpCircle size={14} /> Request Info
        </button>
        <button className="btn-outline !text-xs" onClick={() => setActiveModal('resolve')} disabled={isTerminal}>
          <CheckCircle2 size={14} /> Resolve
        </button>
        <button
          className="btn-outline !text-xs"
          onClick={() => run(() => technicalQueryApi.close(query.id))}
          disabled={query.status !== 'resolved'}
        >
          <XCircle size={14} /> Close
        </button>
        <button
          className="btn-outline !text-xs"
          onClick={() => setActiveModal('reopen')}
          disabled={!['resolved', 'closed'].includes(query.status)}
        >
          <RotateCcw size={14} /> Reopen
        </button>
        <button
          className="btn-outline !text-xs col-span-2 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
          onClick={() => run(() => technicalQueryApi.archive(query.id))}
        >
          <Archive size={14} /> Archive
        </button>
      </div>

      {/* Assign */}
      <Modal open={activeModal === 'assign'} onClose={close} title="Assign Query"
        footer={<>
          <button className="btn-secondary" onClick={close}>Cancel</button>
          <button className="btn-primary" disabled={busy || !form.assignedTo} onClick={() => run(() => technicalQueryApi.assign(query.id, form))}>Assign</button>
        </>}>
        <label className="label">Admin</label>
        <select className="input" value={form.assignedTo || ''} onChange={(e) => setForm((f) => ({ ...f, assignedTo: Number(e.target.value) }))}>
          <option value="">Select admin…</option>
          {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <label className="label mt-3">Note (optional)</label>
        <textarea className="input" rows={2} value={form.note || ''} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </Modal>

      {/* Priority */}
      <Modal open={activeModal === 'priority'} onClose={close} title="Change Priority"
        footer={<>
          <button className="btn-secondary" onClick={close}>Cancel</button>
          <button className="btn-primary" disabled={busy || !form.priority} onClick={() => run(() => technicalQueryApi.changePriority(query.id, form))}>Update</button>
        </>}>
        <label className="label">Priority</label>
        <select className="input" value={form.priority || ''} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
          <option value="">Select priority…</option>
          {PRIORITIES.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
        </select>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </Modal>

      {/* Status */}
      <Modal open={activeModal === 'status'} onClose={close} title="Update Status"
        footer={<>
          <button className="btn-secondary" onClick={close}>Cancel</button>
          <button className="btn-primary" disabled={busy || !form.status} onClick={() => run(() => technicalQueryApi.changeStatus(query.id, form))}>Update</button>
        </>}>
        <label className="label">Status</label>
        <select className="input" value={form.status || ''} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
          <option value="">Select status…</option>
          {STATUSES.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
        </select>
        <label className="label mt-3">Note (optional)</label>
        <textarea className="input" rows={2} value={form.note || ''} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </Modal>

      {/* Admin notes */}
      <Modal open={activeModal === 'notes'} onClose={close} title="Admin Notes"
        footer={<>
          <button className="btn-secondary" onClick={close}>Cancel</button>
          <button className="btn-primary" disabled={busy} onClick={() => run(() => technicalQueryApi.updateAdminNotes(query.id, { adminNotes: form.adminNotes || '' }))}>Save</button>
        </>}>
        <textarea className="input" rows={5} defaultValue={query.admin_notes || ''} onChange={(e) => setForm((f) => ({ ...f, adminNotes: e.target.value }))} />
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </Modal>

      {/* Request info */}
      <Modal open={activeModal === 'info'} onClose={close} title="Request More Information"
        footer={<>
          <button className="btn-secondary" onClick={close}>Cancel</button>
          <button className="btn-primary" disabled={busy || !form.note} onClick={() => run(() => technicalQueryApi.requestInfo(query.id, form))}>Send Request</button>
        </>}>
        <label className="label">What information do you need from the employee?</label>
        <textarea className="input" rows={4} value={form.note || ''} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </Modal>

      {/* Resolve */}
      <Modal open={activeModal === 'resolve'} onClose={close} title="Resolve Query"
        footer={<>
          <button className="btn-secondary" onClick={close}>Cancel</button>
          <button className="btn-primary" disabled={busy || !form.resolutionNotes} onClick={() => run(() => technicalQueryApi.resolve(query.id, form))}>Mark Resolved</button>
        </>}>
        <label className="label">Resolution Notes</label>
        <textarea className="input" rows={5} value={form.resolutionNotes || ''} onChange={(e) => setForm((f) => ({ ...f, resolutionNotes: e.target.value }))} placeholder="Describe how this was resolved…" />
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </Modal>

      {/* Reopen */}
      <Modal open={activeModal === 'reopen'} onClose={close} title="Reopen Query"
        footer={<>
          <button className="btn-secondary" onClick={close}>Cancel</button>
          <button className="btn-danger" disabled={busy || !form.reason} onClick={() => run(() => technicalQueryApi.reopen(query.id, form))}>Reopen</button>
        </>}>
        <label className="label">Reason for reopening</label>
        <textarea className="input" rows={4} value={form.reason || ''} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </Modal>
    </div>
  );
}
