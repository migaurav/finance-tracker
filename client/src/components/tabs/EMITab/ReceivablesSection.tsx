import { useState } from 'react';
import type { Receivable } from '../../../types';
import { addReceivable, updateReceivable, markReceived, exportCSV, inr } from '../../../api/client';
import StatusBadge from '../../shared/StatusBadge';
import Modal from '../../shared/Modal';

interface Props {
  receivables: Receivable[];
  onRefresh: () => void;
}

interface FormData {
  person_name: string;
  amount: string;
  date_given: string;
  expected_return_date: string;
}

const emptyForm: FormData = { person_name: '', amount: '', date_given: '', expected_return_date: '' };

const today = new Date().toISOString().split('T')[0];

export default function ReceivablesSection({ receivables, onRefresh }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Receivable | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showClosed, setShowClosed] = useState(false);

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm, date_given: today });
    setShowModal(true);
  }

  function openEdit(r: Receivable) {
    setEditing(r);
    setForm({
      person_name: r.person_name,
      amount: String(r.amount),
      date_given: r.date_given,
      expected_return_date: r.expected_return_date ?? '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    const amount = parseFloat(form.amount);
    if (!form.person_name || isNaN(amount) || !form.date_given) return;
    setSaving(true);
    try {
      if (editing) {
        await updateReceivable(editing.id, {
          person_name: form.person_name,
          amount,
          date_given: form.date_given,
          expected_return_date: form.expected_return_date || null,
        });
      } else {
        await addReceivable({
          person_name: form.person_name,
          amount,
          date_given: form.date_given,
          expected_return_date: form.expected_return_date || null,
        });
      }
      setShowModal(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleReceive(r: Receivable) {
    if (!confirm(`Mark ₹${r.amount} from ${r.person_name} as received?`)) return;
    await markReceived(r.id);
    onRefresh();
  }

  const pending = receivables.filter((r) => r.status === 'PENDING');
  const received = receivables.filter((r) => r.status === 'RECEIVED');
  const totalPending = pending.reduce((s, r) => s + r.amount, 0);

  const visible = showClosed ? receivables : pending;

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="section-title mb-0">Receivables</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Pending: <span className="font-semibold text-orange-600 dark:text-orange-400">{inr(totalPending)}</span>
              {received.length > 0 && <span className="ml-2 text-gray-400">({received.length} received)</span>}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
              <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} className="rounded" />
              Show received
            </label>
            <button className="btn-secondary text-xs" onClick={() => exportCSV('receivables.csv', receivables as unknown as Record<string, unknown>[])}>
              ⬇ CSV
            </button>
            <button className="btn-primary text-xs" onClick={openAdd}>+ Add</button>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            {pending.length === 0 ? 'No pending receivables' : 'No records to show'}
          </p>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden space-y-2">
              {visible.map((r) => {
                const overdue = r.status === 'PENDING' && r.expected_return_date && r.expected_return_date < today;
                return (
                  <div key={r.id} className={`border rounded-lg p-3 space-y-2 ${overdue ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {overdue && <span className="mr-1">⚠️</span>}
                        {r.person_name}
                      </span>
                      <span className="font-mono font-semibold text-gray-700 dark:text-gray-300 text-sm">{inr(r.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Given: {r.date_given} · Due: {r.expected_return_date ?? '—'}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      {r.status === 'PENDING' && (
                        <button className="btn-success text-xs py-0.5 px-2" onClick={() => handleReceive(r)}>Received</button>
                      )}
                      <button className="btn-secondary text-xs py-0.5 px-2" onClick={() => openEdit(r)}>✏️</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="table-head text-left py-2">Person</th>
                    <th className="table-head text-right py-2">Amount</th>
                    <th className="table-head text-center py-2">Given On</th>
                    <th className="table-head text-center py-2">Expected By</th>
                    <th className="table-head text-center py-2">Status</th>
                    <th className="table-head text-center py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const overdue = r.status === 'PENDING' && r.expected_return_date && r.expected_return_date < today;
                    return (
                      <tr key={r.id} className={`border-b border-gray-50 dark:border-gray-800/50 ${overdue ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                        <td className="py-2 text-gray-800 dark:text-gray-200">
                          {overdue && <span className="mr-1">⚠️</span>}
                          {r.person_name}
                        </td>
                        <td className="py-2 text-right font-mono font-semibold text-gray-700 dark:text-gray-300">{inr(r.amount)}</td>
                        <td className="py-2 text-center text-gray-500 dark:text-gray-400">{r.date_given}</td>
                        <td className="py-2 text-center text-gray-500 dark:text-gray-400">
                          {r.expected_return_date ?? '—'}
                        </td>
                        <td className="py-2 text-center"><StatusBadge status={r.status} /></td>
                        <td className="py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {r.status === 'PENDING' && (
                              <button className="btn-success text-xs py-0.5 px-2" onClick={() => handleReceive(r)}>Received</button>
                            )}
                            <button className="btn-secondary text-xs py-0.5 px-2" onClick={() => openEdit(r)}>✏️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Receivable' : 'Add Receivable'} onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="label">Person Name</label>
              <input className="input" value={form.person_name} onChange={(e) => setForm({ ...form, person_name: e.target.value })} placeholder="e.g. Rahul Sharma" />
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Date Given</label>
                <input className="input" type="date" value={form.date_given} onChange={(e) => setForm({ ...form, date_given: e.target.value })} />
              </div>
              <div>
                <label className="label">Expected Return</label>
                <input className="input" type="date" value={form.expected_return_date} onChange={(e) => setForm({ ...form, expected_return_date: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Add'}
              </button>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
