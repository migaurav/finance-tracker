import { useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import { inr, exportCSV } from '../../../api/client';

interface AssetRow {
  asset_class: string;
  amount: number;
  [key: string]: unknown;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const SAMPLE_DATA: AssetRow[] = [
  { asset_class: 'Mutual Funds', amount: 250000 },
  { asset_class: 'Stocks', amount: 180000 },
  { asset_class: 'Fixed Deposits', amount: 500000 },
  { asset_class: 'Gold', amount: 120000 },
  { asset_class: 'PPF', amount: 80000 },
];

export default function InvestmentsTab() {
  const [data, setData] = useState<AssetRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        const parsed: AssetRow[] = rows
          .filter((r) => r['asset_class'] && r['amount'] !== undefined)
          .map((r) => ({
            ...r,
            asset_class: String(r['asset_class']),
            amount: Number(r['amount']),
          }));

        if (!parsed.length) {
          setError('No valid rows found. Ensure columns: asset_class, amount');
          return;
        }
        setData(parsed);
        setFileName(file.name);
      } catch {
        setError('Failed to parse Excel file. Please check the format.');
      }
    };
    reader.readAsBinaryString(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  }, []);

  const display = data.length ? data : SAMPLE_DATA;
  const isSample = !data.length;
  const total = display.reduce((s, r) => s + r.amount, 0);

  const pieData = display.map((r) => ({ name: r.asset_class, value: r.amount }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Investments Dashboard</h2>
        <div className="flex gap-2">
          {data.length > 0 && (
            <button
              className="btn-secondary text-xs"
              onClick={() => exportCSV('investments.csv', data as unknown as Record<string, unknown>[])}
            >
              ⬇ CSV
            </button>
          )}
          <label className="btn-primary text-xs cursor-pointer">
            📂 Upload Excel
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {isSample && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg px-4 py-3 text-sm">
          Showing sample data. Upload an Excel file with <strong>asset_class</strong> and <strong>amount</strong> columns to see your portfolio.
          {fileName && <span className="ml-2 font-medium">Loaded: {fileName}</span>}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Portfolio</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono mt-1">{inr(total)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 dark:text-gray-400">Asset Classes</p>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 mt-1">{display.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 dark:text-gray-400">Largest Holding</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1 truncate">
            {[...display].sort((a, b) => b.amount - a.amount)[0]?.asset_class ?? '—'}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg per Class</p>
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300 font-mono mt-1">{inr(total / display.length)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="section-title">Portfolio Allocation</h3>
          <div className="h-[220px] sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => inr(v)} />
            </PieChart>
          </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Amount by Asset Class</h3>
          <div className="h-[220px] sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={display} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="asset_class" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => inr(v)} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {display.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <h3 className="section-title">Holdings Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="table-head text-left py-2">Asset Class</th>
                <th className="table-head text-right py-2">Amount</th>
                <th className="table-head text-right py-2">Allocation %</th>
                <th className="table-head text-left py-2 pl-4">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {[...display].sort((a, b) => b.amount - a.amount).map((r, i) => {
                const pct = (r.amount / total) * 100;
                return (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50">
                    <td className="py-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      {r.asset_class}
                    </td>
                    <td className="py-2 text-right font-mono text-gray-700 dark:text-gray-300">{inr(r.amount)}</td>
                    <td className="py-2 text-right text-gray-500">{pct.toFixed(1)}%</td>
                    <td className="py-2 pl-4">
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full w-32">
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-2 font-semibold text-gray-700 dark:text-gray-300">Total</td>
                <td className="pt-2 text-right font-semibold font-mono text-blue-600 dark:text-blue-400">{inr(total)}</td>
                <td className="pt-2 text-right text-gray-500">100%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
