import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { money, dateTime } from "../utils/format.js";

export default function Dashboard() {
  const [tb, setTb] = useState(null);
  const [pnl, setPnl] = useState(null);
  const [recent, setRecent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.getTrialBalance(),
      api.getProfitAndLoss(),
      api.getJournalEntries({ pageSize: 8 }),
    ])
      .then(([tbRes, pnlRes, recentRes]) => {
        setTb(tbRes);
        setPnl(pnlRes);
        setRecent(recentRes);
      })
      .catch((e) => setError(e.message));
  }, []);

  const assetTotal =
    tb?.rows
      .filter((r) => r.type === "ASSET")
      .reduce((s, r) => s + r.closingBalance, 0) ?? 0;
  const liabilityTotal =
    tb?.rows
      .filter((r) => r.type === "LIABILITY")
      .reduce((s, r) => s + r.closingBalance, 0) ?? 0;

  return (
    <div className="space-y-6 text-white">
      <PageHeader
        title="Accounting dashboard"
        action={
          <Link
            to="/journal-entries/new"
            className="inline-flex h-11 items-center text-white justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold  transition hover:bg-slate-700"
          >
            + New Entry
          </Link>
        }
      />

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div>{error}</div>

        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total Assets</div>
          <div className="mt-3 text-2xl font-semibold text-slate-900">
            {money(assetTotal)}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total Liabilities</div>
          <div className="mt-3 text-2xl font-semibold text-slate-900">
            {money(liabilityTotal)}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Income (all-time)</div>
          <div className="mt-3 text-2xl font-semibold text-slate-900">
            {money(pnl?.totalIncome)}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Expense (all-time)</div>
          <div className="mt-3 text-2xl font-semibold text-slate-900">
            {money(pnl?.totalExpense)}
          </div>
        </div>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 text-lg font-semibold text-slate-900">
          Recent journal vouchers
        </div>
        {!recent && !error && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            Loading…
          </div>
        )}
        {recent && recent.data.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            No journal entries yet. Post one from the Simulate Postings page, or
            run{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700">
              npm run seed
            </code>{" "}
            in the backend first to load the Chart of Accounts.
          </div>
        )}
        {recent && recent.data.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Voucher</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Narration
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                {recent.data.map((e) => (
                  <tr key={e.id} className="odd:bg-slate-50 even:bg-white">
                    <td className="px-4 py-3">
                      <Link
                        to={`/journal-entries/${e.id}`}
                        className="font-mono text-slate-700 hover:text-slate-900"
                      >
                        {e.voucherNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{dateTime(e.transactionDate)}</td>
                    <td className="px-4 py-3">{e.narration}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {e.referenceType || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {money(e.totalDebit)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
