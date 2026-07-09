import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';
import ExportButtons from '../components/ExportButtons.jsx';
import { money, dateTime } from '../utils/format.js';

const REFERENCE_TYPES = [
  '',
  'LOAN_DISBURSEMENT',
  'EMI_PAYMENT',
  'RECOVERY',
  'FORECLOSURE',
  'PROCESSING_FEE',
  'PARTNER_COMMISSION',
  'PENALTY',
  'WRITE_OFF',
  'REFUND',
  'MANUAL',
];

const PAGE_SIZE = 10;

export default function JournalEntries() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ referenceType: '', status: '', accountSearch: '' });
  const [page, setPage] = useState(1);

  function load(f, p) {
    api
      .getJournalEntries({ ...f, page: p, pageSize: PAGE_SIZE })
      .then(setResult)
      .catch((e) => setError(e.message));
  }

  // Debounce the free-text account search; other filters/page changes
  // fire immediately. This single effect also covers the initial load.
  useEffect(() => {
    const handle = setTimeout(() => load(filters, page), filters.accountSearch ? 300 : 0);
    return () => clearTimeout(handle);
  }, [filters, page]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  return (
    <div className="space-y-6 text-white ">
      <PageHeader
        eyebrow="Books · 02"
        title="Journal Entries"
        // description="Every voucher posted by the accounting engine, whether triggered automatically by an LMS event or entered manually."
        action={
          <Link
            to="/journal-entries/new"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            + New voucher
          </Link>
        }
      />

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.4fr] mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-600">Reference type</label>
            <select
              value={filters.referenceType}
              onChange={(e) => updateFilter('referenceType', e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {REFERENCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t || 'All'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">All</option>
              <option value="DRAFT">Draft</option>
              <option value="POSTED">Posted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">Search by account name</label>
            <input
              type="text"
              placeholder="e.g. Bank Account, Loan Receivable…"
              value={filters.accountSearch}
              onChange={(e) => updateFilter('accountSearch', e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-lg font-semibold text-slate-900">
            {result ? `${result.total} voucher${result.total === 1 ? '' : 's'}` : 'Vouchers'}
          </div>
          <ExportButtons
            onExport={(format) =>
              api.exportJournalEntries(format, {
                referenceType: filters.referenceType || undefined,
                status: filters.status || undefined,
                accountSearch: filters.accountSearch || undefined,
              })
            }
          />
        </div>

        {!result && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 mt-6">Loading…</div>
        )}
        {result && result.data.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 mt-6">
            No journal entries match these filters.
          </div>
        )}

        {result && result.data.length > 0 && (
          <div className="mt-6 space-y-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Voucher</th>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Narration</th>
                    <th className="px-4 py-3 text-left font-semibold">Reference</th>
                    <th className="px-4 py-3 text-right font-semibold">Debit</th>
                    <th className="px-4 py-3 text-right font-semibold">Credit</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                  {result.data.map((e) => (
                    <tr key={e.id} className="odd:bg-slate-50 even:bg-white">
                      <td className="px-4 py-3">
                        <Link to={`/journal-entries/${e.id}`} className="font-mono text-slate-700 hover:text-slate-900">
                          {e.voucherNo}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{dateTime(e.transactionDate)}</td>
                      <td className="px-4 py-3">{e.narration}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">{e.referenceType || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-emerald-600 font-medium">{money(e.totalDebit)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-rose-600 font-medium">{money(e.totalCredit)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={e.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
