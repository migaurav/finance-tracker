import type { Receivable } from '../../../types';
import { inr } from '../../../api/client';
import StatusBadge from '../../shared/StatusBadge';

interface Props {
  receivables: Receivable[];
}

const today = new Date().toISOString().split('T')[0];

export default function ReceivablesSection({ receivables }: Props) {
  if (!receivables.length) return null;

  return (
    <div className="card">
      <h3 className="section-title">Pending Receivables</h3>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {receivables.map((r) => {
          const overdue = r.expected_return_date && r.expected_return_date < today && r.status === 'PENDING';
          return (
            <div key={r.id} className={`border rounded-lg p-3 space-y-1.5 ${overdue ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-gray-800 dark:text-gray-200 font-medium">
                  {overdue && <span className="mr-1">⚠️</span>}
                  {r.person_name}
                </span>
                <span className="font-mono text-gray-700 dark:text-gray-300 text-sm">{inr(r.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Due: {r.expected_return_date ?? '—'}</span>
                <StatusBadge status={r.status} />
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
              <th className="table-head text-center py-2">Expected By</th>
              <th className="table-head text-center py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {receivables.map((r) => {
              const overdue = r.expected_return_date && r.expected_return_date < today && r.status === 'PENDING';
              return (
                <tr key={r.id} className={`border-b border-gray-50 dark:border-gray-800/50 ${overdue ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                  <td className="py-2 text-gray-800 dark:text-gray-200">
                    {overdue && <span className="mr-1">⚠️</span>}
                    {r.person_name}
                  </td>
                  <td className="py-2 text-right font-mono text-gray-700 dark:text-gray-300">{inr(r.amount)}</td>
                  <td className="py-2 text-center text-gray-500 dark:text-gray-400">
                    {r.expected_return_date ?? '—'}
                  </td>
                  <td className="py-2 text-center">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
