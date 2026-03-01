import { useState } from 'react';
import type { CreditCardBill, MonthlyTally } from '../../../types';
import { addCard, updateCard, deleteCard, exportCSV, inr } from '../../../api/client';
import StatusBadge from '../../shared/StatusBadge';
import Modal from '../../shared/Modal';

interface Props {
  tally: MonthlyTally;
  cards: CreditCardBill[];
  onRefresh: () => void;
}

interface FormData {
  card_name: string;
  amount: string;
  due_date: string;
  status: 'PAID' | 'UNPAID';
}

const emptyForm: FormData = { card_name: '', amount: '', due_date: '', status: 'UNPAID' };

export default function CreditCardSection({ tally, cards, onRefresh }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CreditCardBill | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(card: CreditCardBill) {
    setEditing(card);
    setForm({ card_name: card.card_name, amount: String(card.amount), due_date: card.due_date ?? '', status: card.status });
    setShowModal(true);
  }

  async function handleSave() {
    const amount = parseFloat(form.amount);
    if (!form.card_name || isNaN(amount)) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCard(editing.id, { card_name: form.card_name, amount, due_date: form.due_date || null, status: form.status });
      } else {
        await addCard({ month_id: tally.id, card_name: form.card_name, amount, due_date: form.due_date || null, status: form.status });
      }
      setShowModal(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this card bill?')) return;
    await deleteCard(id);
    onRefresh();
  }

  async function handleTogglePaid(card: CreditCardBill) {
    await updateCard(card.id, { status: card.status === 'PAID' ? 'UNPAID' : 'PAID' });
    onRefresh();
  }

  const total = cards.reduce((s, c) => s + c.amount, 0);

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title mb-0">Credit Card Bills</h3>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs" onClick={() => exportCSV('cards.csv', cards as unknown as Record<string, unknown>[])}>
              ⬇ CSV
            </button>
            <button className="btn-primary text-xs" onClick={openAdd}>+ Add Bill</button>
          </div>
        </div>

        {cards.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No bills this month</p>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden space-y-2">
              {cards.map((c) => (
                <div key={c.id} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{c.card_name}</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300 text-sm">{inr(c.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{c.due_date ?? '—'}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <button className="btn-success text-xs py-0.5 px-2" onClick={() => handleTogglePaid(c)}>
                      {c.status === 'PAID' ? 'Unmark' : 'Paid'}
                    </button>
                    <button className="btn-secondary text-xs py-0.5 px-2" onClick={() => openEdit(c)}>✏️</button>
                    <button className="btn-danger text-xs py-0.5 px-2" onClick={() => handleDelete(c.id)}>🗑</button>
                  </div>
                </div>
              ))}
              <div className="sm:hidden flex justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Total</span>
                <span className="font-semibold font-mono text-red-600 dark:text-red-400">{inr(total)}</span>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="table-head text-left py-2">Card</th>
                    <th className="table-head text-right py-2">Amount</th>
                    <th className="table-head text-center py-2">Due Date</th>
                    <th className="table-head text-center py-2">Status</th>
                    <th className="table-head text-center py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="py-2 text-gray-800 dark:text-gray-200">{c.card_name}</td>
                      <td className="py-2 text-right font-mono text-gray-700 dark:text-gray-300">{inr(c.amount)}</td>
                      <td className="py-2 text-center text-gray-500 dark:text-gray-400">{c.due_date ?? '—'}</td>
                      <td className="py-2 text-center"><StatusBadge status={c.status} /></td>
                      <td className="py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="btn-success text-xs py-0.5 px-2" onClick={() => handleTogglePaid(c)}>
                            {c.status === 'PAID' ? 'Unmark' : 'Paid'}
                          </button>
                          <button className="btn-secondary text-xs py-0.5 px-2" onClick={() => openEdit(c)}>✏️</button>
                          <button className="btn-danger text-xs py-0.5 px-2" onClick={() => handleDelete(c.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="pt-2 font-semibold text-gray-700 dark:text-gray-300">Total</td>
                    <td className="pt-2 text-right font-semibold font-mono text-red-600 dark:text-red-400">{inr(total)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Card Bill' : 'Add Card Bill'} onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="label">Card Name</label>
              <input className="input" value={form.card_name} onChange={(e) => setForm({ ...form, card_name: e.target.value })} placeholder="e.g. HDFC Regalia" />
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'PAID' | 'UNPAID' })}>
                <option value="UNPAID">UNPAID</option>
                <option value="PAID">PAID</option>
              </select>
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
