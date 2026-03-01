import { useEffect, useState, useCallback } from 'react';
import { getEmis, getReceivables } from '../../../api/client';
import type { EMI, Receivable } from '../../../types';
import EMISection from './EMISection';
import ReceivablesSection from './ReceivablesSection';

export default function EMITab() {
  const [emis, setEmis] = useState<EMI[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [e, r] = await Promise.all([getEmis(), getReceivables()]);
      setEmis(e);
      setReceivables(r);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">EMIs &amp; Receivables</h2>
        <button className="btn-secondary text-xs" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : '⟳ Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && !emis.length && !receivables.length ? (
        <div className="text-center text-gray-400 py-12">Loading…</div>
      ) : (
        <>
          <EMISection emis={emis} onRefresh={load} />
          <ReceivablesSection receivables={receivables} onRefresh={load} />
        </>
      )}
    </div>
  );
}
