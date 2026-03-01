import { useEffect, useState, useCallback } from 'react';
import { getMonthly } from '../../../api/client';
import type { MonthlyResponse } from '../../../types';
import CreditCardSection from './CreditCardSection';
import ClosingBalanceSection from './ClosingBalanceSection';
import ReceivablesSection from './ReceivablesSection';
import EMISnapshotSection from './EMISnapshotSection';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthOptions() {
  const opts: string[] = [];
  const d = new Date();
  for (let i = 5; i >= -2; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
    opts.push(dt.toISOString().slice(0, 7));
  }
  return opts;
}

export default function MonthlyTally() {
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<MonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMonthly(month);
      setData(res);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  function handleBalanceUpdate(balance: number) {
    setData((prev) => prev ? {
      ...prev,
      tally: { ...prev.tally, closing_balance: balance },
      summary: { ...prev.summary, netBalance: balance - prev.summary.totalCards - prev.summary.totalEmiMonthly },
    } : prev);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      {/* Month Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Month:</label>
        <select
          className="input w-40"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          {monthOptions().map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <button className="btn-secondary text-xs" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : '⟳ Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="text-center text-gray-400 py-12">Loading…</div>
      )}

      {data && (
        <>
          <ClosingBalanceSection tally={data.tally} summary={data.summary} onUpdate={handleBalanceUpdate} />
          <CreditCardSection tally={data.tally} cards={data.cards} onRefresh={load} />
          <ReceivablesSection receivables={data.receivables} />
          <EMISnapshotSection emis={data.emis} />
        </>
      )}
    </div>
  );
}
