import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import FileUpload from '../../components/technicalQuery/FileUpload';
import { CATEGORIES, PRIORITIES } from '../../constants/technicalQuery';
import { technicalQueryApi } from '../../services/technicalQueryApi';
import '../../styles/technical-query.css';

const initialForm = { category: '', priority: 'normal', isbn: '', subject: '', description: '' };

export function RaiseQueryPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.category) e.category = 'Please select a category';
    if (!form.subject || form.subject.trim().length < 5) e.subject = 'Subject must be at least 5 characters';
    if (!form.description || form.description.trim().length < 10) e.description = 'Please describe the issue in more detail (min 10 characters)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await technicalQueryApi.create(form);
      setSuccess(res.data);
    } catch (err) {
      setErrors({ form: 'Failed to raise query: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Technical Query Submitted</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Query <span className="font-mono font-bold text-slate-800">{success.query_number}</span> has been dispatched to production engineers.
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
            onClick={() => {
              setSuccess(null);
              setForm(initialForm);
            }}
          >
            Raise Another
          </button>
          <button
            type="button"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white"
            onClick={() => navigate('/technical-query/my-queries')}
          >
            View All Queries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Raise New Technical Query</h1>
          <p className="text-xs text-slate-500">Log software roadblocks, missing assets, or catalog discrepancies.</p>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        {errors.form && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{errors.form}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category *</label>
            <select
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-brand-500 outline-hidden"
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-rose-500 text-[11px] mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setField('priority', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-brand-500 outline-hidden"
            >
              {PRIORITIES.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Related ISBN (Optional)</label>
          <input
            type="text"
            placeholder="e.g. 9781234567890"
            value={form.isbn}
            onChange={(e) => setField('isbn', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-brand-500 outline-hidden font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Query Subject / Summary *</label>
          <input
            type="text"
            placeholder="Concise summary of problem"
            value={form.subject}
            onChange={(e) => setField('subject', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-brand-500 outline-hidden"
          />
          {errors.subject && <p className="text-rose-500 text-[11px] mt-1">{errors.subject}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Technical Description *</label>
          <textarea
            rows={4}
            placeholder="Steps to reproduce, expected vs actual behavior, error traces..."
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-brand-500 outline-hidden"
          />
          {errors.description && <p className="text-rose-500 text-[11px] mt-1">{errors.description}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Attachments</label>
          <FileUpload files={files} onChange={setFiles} />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs cursor-pointer"
          >
            <Send size={13} /> {submitting ? 'Submitting...' : 'Submit Query'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RaiseQueryPage;
