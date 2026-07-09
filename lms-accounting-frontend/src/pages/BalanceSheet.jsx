import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import ExportButtons from '../components/ExportButtons.jsx';
import { money, shortDate } from '../utils/format.js';

export default function BalanceSheet() {
  const [asOf, setAsOf] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function load(params = {}) {
    setError('');
    try {
      const result = await api.getBalanceSheet(params);
      setData(result);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function Section({ title, rows, total, accent }) {
    return (
      <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 text-lg font-semibold text-slate-900">{title}</div>
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="min-w-full text-sm">
            <tbody className="divide-y divide-slate-200">
              {rows.map((r) => (
                <tr key={r.accountId} className="odd:bg-slate-50 even:bg-white">
                  <td className="px-4 py-3 text-slate-800">
                    <span className="mr-2 font-mono text-slate-500">{r.code}</span>
                    {r.name}
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${accent}`}>{money(r.closingBalance)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-sm text-slate-500">
                    Nothing posted here yet.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50">
              <tr>
                <td className="px-4 py-3 text-right font-medium text-slate-700">Total</td>
                <td className={`whitespace-nowrap px-4 py-3 text-right text-base font-semibold ${accent}`}>{money(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        // eyebrow=""
        title="Balance Sheet"
        // description="Assets vs. Liabilities + Equity (including retained earnings from posted P&L) as of a point in time."
        action={
  <div className="flex items-center gap-3">
    <input
      type="date"
      value={asOf}
      onChange={(e) => setAsOf(e.target.value)}
      className="h-11 w-56 rounded-xl border border-slate-300 px-3"
    />

    <button
      type="button"
      onClick={() => load({ asOf: asOf || undefined })}
      className="h-11 rounded-xl bg-slate-900 px-6 text-white hover:bg-slate-700"
    >
      Run
    </button>
  </div>
}
      />

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Loading…
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Total assets</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{money(data.totalAssets)}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Total liabilities + equity</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{money(data.totalLiabilities + data.totalEquity)}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Balanced?</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">
                {data.balanced ? '✓ Yes' : '✗ No — investigate'}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-lg font-semibold text-slate-900">As of {shortDate(data.asOf)}</div>
            <ExportButtons onExport={(format) => api.exportBalanceSheet(format, { asOf: asOf || undefined })} />
          </div>

          <Section title="Assets" rows={data.assets} total={data.totalAssets} accent="text-emerald-600" />
          <Section title="Liabilities" rows={data.liabilities} total={data.totalLiabilities} accent="text-rose-600" />
          <Section
            title={`Equity (incl. retained earnings ${money(data.retainedEarnings)})`}
            rows={data.equity}
            total={data.totalEquity}
            accent="text-rose-600"
          />
        </div>
      )}
    </div>
  );
}
