import { useState } from 'react';
import type { EMI } from '../../../types';
import { addEmi, updateEmi, payEmi, exportCSV, inr } from '../../../api/client';
import StatusBadge from '../../shared/StatusBadge';
import Modal from '../../shared/Modal';

interface Props {
  emis: EMI[];
  onRefresh: () => void;
}

interface FormData {
  name: string;
  total_amount: string;
  monthly_amount: string;
  start_date: string;
  tenure_months: string;
  remaining_months: string;
}

const emptyForm: FormData = {
  name: '', total_amount: '', monthly_amount: '',
  start_date: '', tenure_months: '', remaining_months: '',
};

export default function EMISection({ emis, onRefresh }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EMI | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(emi: EMI) {
    setEditing(emi);
    setForm({
      name: emi.name,
      total_amount: String(emi.total_amount),
      monthly_amount: String(emi.monthly_amount),
      start_date: emi.start_date,
      tenure_months: String(emi.tenure_months),
      remaining_months: String(emi.remaining_months),
    });
    setShowModal(true);
  }

  async function handleSave() {
    const total_amount = parseFloat(form.total_amount);
    const monthly_amount = parseFloat(form.monthly_amount);
    const tenure_months = parseInt(form.tenure_months);
    const remaining_months = form.remaining_months ? parseInt(form.remaining_months) : tenure_months;

    if (!form.name || isNaN(total_amount) || isNaN(monthly_amount) || !form.start_date || isNaN(tenure_months)) return;

    setSaving(true);
    try {
      if (editing) {
        await updateEmi(editing.id, { name: form.name, total_amount, monthly_amount, start_date: form.start_date, tenure_months, remaining_months });
      } else {
        await addEmi({ name: form.name, total_amount, monthly_amount, start_date: form.start_date, tenure_months, remaining_months });
      }
      setShowModal(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function handlePay(id: number) {
    await payEmi(id);
    onRefresh();
  }

  async function handleClose(emi: EMI) {
    if (!confirm(`Mark "${emi.name}" as CLOSED?`)) return;
    await updateEmi(emi.id, { status: 'CLOSED' });
    onRefresh();
  }

  const active = emis.filter((e) => e.status === 'ACTIVE');
  const closed = emis.filter((e) => e.status === 'CLOSED');
  const totalMonthly = active.reduce((s, e) => s + e.monthly_amount, 0);
  const sorted = [...active, ...closed];

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="section-title mb-0">EMIs</h3>
            {active.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Monthly outflow: <span className="font-semibold text-orange-600 dark:text-orange-400">{inr(totalMonthly)}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs" onClick={() => exportCSV('emis.csv', emis as unknown as Record<string, unknown>[])}>
              ⬇ CSV
            </button>
            <button className="btn-primary text-xs" onClick={openAdd}>+ Add EMI</button>
          </div>
        </div>

        {emis.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No EMIs found</p>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden space-y-2">
              {sorted.map((e) => {
                const progress = ((e.tenure_months - e.remaining_months) / e.tenure_months) * 100;
                return (
                  <div key={e.id} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3 space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 dark:text-gray-200 font-medium">{e.name}</span>
                        <span className="font-mono font-semibold text-orange-600 dark:text-orange-400 text-sm">{inr(e.monthly_amount)}/mo</span>
                      </div>
                      <div className="mt-1.5 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{e.remaining_months} / {e.tenure_months} mo remaining</span>
                      <StatusBadge status={e.status} />
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      {e.status === 'ACTIVE' && (
                        <>
                          <button className="btn-success text-xs py-0.5 px-2" onClick={() => handlePay(e.id)}>Pay</button>
                          <button className="btn-secondary text-xs py-0.5 px-2" onClick={() => openEdit(e)}>✏️</button>
                          <button className="btn-danger text-xs py-0.5 px-2" onClick={() => handleClose(e)}>Close</button>
                        </>
                      )}
                      {e.status === 'CLOSED' && (
                        <button className="btn-secondary text-xs py-0.5 px-2" onClick={() => openEdit(e)}>✏️</button>
                      )}
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
                    <th className="table-head text-left py-2">Loan</th>
                    <th className="table-head text-right py-2">Total</th>
                    <th className="table-head text-right py-2">Monthly</th>
                    <th className="table-head text-center py-2">Remaining</th>
                    <th className="table-head text-center py-2">Status</th>
                    <th className="table-head text-center py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((e) => {
                    const progress = ((e.tenure_months - e.remaining_months) / e.tenure_months) * 100;
                    return (
                      <tr key={e.id} className="border-b border-gray-50 dark:border-gray-800/50">
                        <td className="py-2">
                          <div className="text-gray-800 dark:text-gray-200 font-medium">{e.name}</div>
                          <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full w-32">
                            <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                        </td>
                        <td className="py-2 text-right font-mono text-gray-600 dark:text-gray-400 text-xs">{inr(e.total_amount)}</td>
                        <td className="py-2 text-right font-mono font-semibold text-orange-600 dark:text-orange-400">{inr(e.monthly_amount)}</td>
                        <td className="py-2 text-center text-gray-600 dark:text-gray-400">{e.remaining_months} / {e.tenure_months}</td>
                        <td className="py-2 text-center"><StatusBadge status={e.status} /></td>
                        <td className="py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {e.status === 'ACTIVE' && (
                              <>
                                <button className="btn-success text-xs py-0.5 px-2" onClick={() => handlePay(e.id)}>Pay</button>
                                <button className="btn-secondary text-xs py-0.5 px-2" onClick={() => openEdit(e)}>✏️</button>
                                <button className="btn-danger text-xs py-0.5 px-2" onClick={() => handleClose(e)}>Close</button>
                              </>
                            )}
                            {e.status === 'CLOSED' && (
                              <button className="btn-secondary text-xs py-0.5 px-2" onClick={() => openEdit(e)}>✏️</button>
                            )}
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
        <Modal title={editing ? 'Edit EMI' : 'Add EMI'} onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="label">Loan Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Home Loan - SBI" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Total Amount (₹)</label>
                <input className="input" type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
              </div>
              <div>
                <label className="label">Monthly EMI (₹)</label>
                <input className="input" type="number" value={form.monthly_amount} onChange={(e) => setForm({ ...form, monthly_amount: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Start Date</label>
              <input className="input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Tenure (months)</label>
                <input className="input" type="number" value={form.tenure_months} onChange={(e) => setForm({ ...form, tenure_months: e.target.value })} />
              </div>
              <div>
                <label className="label">Remaining (months)</label>
                <input className="input" type="number" value={form.remaining_months} onChange={(e) => setForm({ ...form, remaining_months: e.target.value })} placeholder="= tenure if new" />
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
