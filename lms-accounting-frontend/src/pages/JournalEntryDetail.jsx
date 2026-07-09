import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { money, dateTime } from '../utils/format.js';

export default function JournalEntryDetail() {
  const { id } = useParams();
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api.getJournalEntry(id).then(setEntry).catch((e) => setError(e.message));
  }

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePost() {
    setBusy(true);
    try {
      await api.postJournalEntry(id);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel this voucher? This reverses its effect on account balances.')) return;
    setBusy(true);
    try {
      await api.cancelJournalEntry(id);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (error)
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  if (!entry)
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        Loading…
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Books · 02"
        title={entry.voucherNo}
        description={entry.narration}
        action={
          <div className="flex flex-wrap items-center gap-3">
            {entry.status === 'DRAFT' && (
              <button
                type="button"
                onClick={handlePost}
                disabled={busy}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post entry
              </button>
            )}
            {entry.status !== 'CANCELLED' && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={busy}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel entry
              </button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Status</div>
          <div className="mt-3 text-xl font-semibold text-slate-900">
            <StatusBadge status={entry.status} />
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Transaction date</div>
          <div className="mt-3 text-xl font-semibold text-slate-900">{dateTime(entry.transactionDate)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Reference</div>
          <div className="mt-3 text-xl font-semibold text-slate-900">{entry.referenceType || '—'}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total</div>
          <div className="mt-3 text-xl font-semibold text-slate-900">{money(entry.totalDebit)}</div>
        </div>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 text-lg font-semibold text-slate-900">Ledger lines</div>
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Account</th>
                <th className="px-4 py-3 text-left font-semibold">Description</th>
                <th className="px-4 py-3 text-right font-semibold">Debit</th>
                <th className="px-4 py-3 text-right font-semibold">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
              {entry.lines.map((l) => (
                <tr key={l.id} className="odd:bg-slate-50 even:bg-white">
                  <td className="px-4 py-3">
                    <span className="mr-2 font-mono text-slate-500">{l.account.code}</span>
                    {l.account.name}
                  </td>
                  <td className="px-4 py-3">{l.description || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-emerald-600 font-medium">{l.debit ? money(l.debit) : ''}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-rose-600 font-medium">{l.credit ? money(l.credit) : ''}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-right font-mono text-slate-700">
                  Total
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-emerald-600 font-semibold">{money(entry.totalDebit)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-rose-600 font-semibold">{money(entry.totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <Link to="/journal-entries" className="text-sm text-slate-600 transition hover:text-slate-900">
        ← Back to all journal entries
      </Link>
    </div>
  );
}
