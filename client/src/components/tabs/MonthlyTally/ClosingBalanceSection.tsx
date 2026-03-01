import { useState } from 'react';
import type { MonthlySummary, MonthlyTally } from '../../../types';
import { updateClosingBalance, inr } from '../../../api/client';

interface Props {
  tally: MonthlyTally;
  summary: MonthlySummary;
  onUpdate: (balance: number) => void;
}

export default function ClosingBalanceSection({ tally, summary, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(tally.closing_balance));
  const [saving, setSaving] = useState(false);

  async function save() {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setSaving(true);
    try {
      await updateClosingBalance(tally.id, num);
      onUpdate(num);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const summaryCards = [
    { label: 'Closing Balance', value: tally.closing_balance, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Credit Card Bills', value: summary.totalCards, color: 'text-red-600 dark:text-red-400' },
    { label: 'EMI Outflow', value: summary.totalEmiMonthly, color: 'text-orange-600 dark:text-orange-400' },
    { label: 'Net After Bills', value: summary.netBalance, color: summary.netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title mb-0">Closing Balance</h3>
        {!editing && (
          <button className="btn-secondary text-xs" onClick={() => { setEditing(true); setValue(String(tally.closing_balance)); }}>
            ✏️ Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-gray-500">₹</span>
          <input
            className="input w-48"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            autoFocus
          />
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
            <p className={`text-lg font-bold font-mono mt-0.5 ${c.color}`}>{inr(c.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
