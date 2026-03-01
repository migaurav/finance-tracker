import type { EMI } from '../../../types';
import { inr } from '../../../api/client';

interface Props {
  emis: EMI[];
}

export default function EMISnapshotSection({ emis }: Props) {
  const active = emis.filter((e) => e.status === 'ACTIVE');
  const total = active.reduce((s, e) => s + e.monthly_amount, 0);

  if (!active.length) return null;

  return (
    <div className="card">
      <h3 className="section-title">EMI Snapshot (Active)</h3>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {active.map((e) => (
          <div key={e.id} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-800 dark:text-gray-200 font-medium">{e.name}</span>
              <span className="font-mono text-gray-700 dark:text-gray-300 text-sm">{inr(e.monthly_amount)}/mo</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{e.remaining_months} mo remaining</div>
          </div>
        ))}
        <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-sm">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Total EMIs</span>
          <span className="font-semibold font-mono text-blue-600 dark:text-blue-400">{inr(total)}</span>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="table-head text-left py-2">Loan</th>
              <th className="table-head text-right py-2">Monthly EMI</th>
              <th className="table-head text-right py-2">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {active.map((e) => (
              <tr key={e.id} className="border-b border-gray-50 dark:border-gray-800/50">
                <td className="py-2 text-gray-800 dark:text-gray-200">{e.name}</td>
                <td className="py-2 text-right font-mono text-gray-700 dark:text-gray-300">{inr(e.monthly_amount)}</td>
                <td className="py-2 text-right text-gray-500 dark:text-gray-400">{e.remaining_months} mo</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-2 font-semibold text-gray-700 dark:text-gray-300">Total EMIs</td>
              <td className="pt-2 text-right font-semibold font-mono text-blue-600 dark:text-blue-400">{inr(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
