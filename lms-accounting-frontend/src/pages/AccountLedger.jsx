import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import Pagination from '../components/Pagination.jsx';
import ExportButtons from '../components/ExportButtons.jsx';
import { money, shortDate } from '../utils/format.js';

// The PDF names these three ledgers explicitly ("Bank Ledger", "Loan
// Ledger", "Interest Income Ledger") — rather than separate pages, they're
// just this same Account Ledger pointed at a specific account, offered
// here as one-click shortcuts.

const QUICK_LEDGERS = [
  { systemKey: 'BANK_ACCOUNT', label: 'Bank Ledger' },
  { systemKey: 'LOAN_RECEIVABLE', label: 'Loan Ledger' },
  { systemKey: 'INTEREST_INCOME', label: 'Interest Income Ledger' },
];

export default function AccountLedger() {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [ledger, setLedger] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const PAGE_SIZE = 10;

  useEffect(() => {
    api.getAccounts().then(setAccounts).catch((e) => setError(e.message));
  }, []);

  async function load(id, params = {}) {
    if (!id) return;
    setError('');
    try {
      const result = await api.getAccountLedger(id, params);
      setLedger(result);
    } catch (e) {
      setError(e.message);
    }
  }

  function handleAccountChange(id) {
    setAccountId(id);
    setLedger(null);
    setPage(1);
    load(id, { from: from || undefined, to: to || undefined });
  }

  const ledgerRows = ledger?.rows ?? [];
  const currentLedgerRows = ledgerRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        // eyebrow="Reports · 05"
        title="General Ledger"
        description="Choose an account to view its posted ledger lines and running balance."
      />

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
          Quick access:
        </span>
        {QUICK_LEDGERS.map((q) => {
          const acc = accounts.find((a) => a.systemKey === q.systemKey);
          return (
            <button
              key={q.systemKey}
              type="button"
              disabled={!acc}
              onClick={() => handleAccountChange(acc?.id)}
              className="font-mono text-[0.72rem] uppercase border border-amber-500 text-black bg-white px-3 py-1 rounded-full transition hover:bg-amber-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {q.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] items-end">
          <div>
            <label className="block text-sm font-medium text-slate-600">Account</label>
            <select
              value={accountId}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Select account…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <button
            type="button"
            onClick={() => load(accountId, { from: from || undefined, to: to || undefined })}
            disabled={!accountId}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run
          </button>
        </div>
      </div>

      {!accountId && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Choose an account to see its ledger.
        </div>
      )}

      {ledger && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">{ledger.account.code} — {ledger.account.name}</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{ledger.account.type}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Opening balance</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{money(ledger.openingBalance)}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Closing balance</div>
              <div className="mt-2 text-xl font-semibold text-slate-900">{money(ledger.closingBalance)}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-lg font-semibold text-slate-900">Transactions</div>
              <ExportButtons
                onExport={(format) =>
                  api.exportAccountLedger(accountId, format, {
                    from: from || undefined,
                    to: to || undefined,
                  })
                }
              />
            </div>

            {ledger.rows.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                No posted movements in this range yet.
              </div>
            )}

            {ledger.rows.length > 0 && (
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Voucher</th>
                      <th className="px-4 py-3 text-left font-semibold">Narration</th>
                      <th className="px-4 py-3 text-right font-semibold">Debit</th>
                      <th className="px-4 py-3 text-right font-semibold">Credit</th>
                      <th className="px-4 py-3 text-right font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                    {currentLedgerRows.map((r, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap px-4 py-3">{shortDate(r.date)}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">{r.voucherNo}</td>
                        <td className="px-4 py-3">{r.narration}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-emerald-600">
                          {r.debit ? money(r.debit) : ''}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-rose-600">
                          {r.credit ? money(r.credit) : ''}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">{money(r.runningBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {ledgerRows.length > PAGE_SIZE && (
              <Pagination page={page} pageSize={PAGE_SIZE} total={ledgerRows.length} onPageChange={setPage} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
