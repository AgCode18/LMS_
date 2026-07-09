import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import Pagination from "../components/Pagination.jsx";
import { money, shortDate } from "../utils/format.js";

export default function BankReconciliation() {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [statementDate, setStatementDate] = useState("");
  const [bankBalance, setBankBalance] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  useEffect(() => {
    api
      .getAccounts()
      .then(setAccounts)
      .catch((e) => setError(e.message));
  }, []);

  async function loadReport() {
    setError("");
    setReport(null);    setPage(1);
    if (!accountId || !statementDate || bankBalance === "") {
      setError(
        "Please select an account, statement date, and bank statement balance.",
      );
      return;
    }

    setLoading(true);
    try {
      const params = {
        statementDate,
        bankBalance,
        from: from || undefined,
        to: to || undefined,
      };
      const data = await api.getBankReconciliation(accountId, params);
      setReport(data.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const reportRows = report?.rows ?? [];
  const currentRows = reportRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Reconciliation"
        description="Compare book balance against bank statement balance for the selected cash account and statement date."
      />

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Bank account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Select account…</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} — {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">
              Statement date
            </label>
            <input
              type="date"
              value={statementDate}
              onChange={(e) => setStatementDate(e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">
              Bank statement balance
            </label>
            <input
              type="number"
              step="0.01"
              value={bankBalance}
              onChange={(e) => setBankBalance(e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={loadReport}
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading…" : "Run reconciliation"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm text-slate-500">From date</div>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm text-slate-500">To date</div>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Statement date</div>
            <div className="mt-2 text-base font-semibold text-slate-900">
              {statementDate ? shortDate(statementDate) : "—"}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Bank balance</div>
            <div className="mt-2 text-base font-semibold text-slate-900">
              {bankBalance !== "" ? money(Number(bankBalance)) : "—"}
            </div>
          </div>
        </div>
      </div>

      {report && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Book balance</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {money(report.bookBalance)}
              </div>
            </div>
            <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">
                Bank statement balance
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {money(report.bankStatementBalance)}
              </div>
            </div>
            <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">
                Adjusted bank balance
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {money(report.adjustedBankBalance)}
              </div>
            </div>
            <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">
                Reconciliation status
              </div>
              <div
                className={`mt-2 text-2xl font-semibold ${report.isReconciled ? "text-emerald-600" : "text-rose-600"}`}
              >
                {report.isReconciled ? "Reconciled" : "Review needed"}
              </div>
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  Ledger activity
                </div>
                <div className="text-sm text-slate-500">
                  Transactions matching your selected account and date range.
                </div>
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <div className="text-sm text-slate-500">
                  Total adjustment: {money(report.netAdjustment)}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      api.exportBankReconciliation(accountId, "xlsx", {
                        statementDate,
                        bankBalance,
                        from: from || undefined,
                        to: to || undefined,
                      })
                    }
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Export XLSX
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      api.exportBankReconciliation(accountId, "pdf", {
                        statementDate,
                        bankBalance,
                        from: from || undefined,
                        to: to || undefined,
                      })
                    }
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            </div>

            {report.rows.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                No posted transactions found for the selected account and date
                range.
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-3xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Voucher
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Narration
                        </th>
                        <th className="px-4 py-3 text-right font-semibold">
                          Debit
                        </th>
                        <th className="px-4 py-3 text-right font-semibold">
                          Credit
                        </th>
                        <th className="px-4 py-3 text-right font-semibold">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                      {currentRows.map((row, index) => (
                        <tr key={index} className="odd:bg-white even:bg-slate-50">
                          <td className="whitespace-nowrap px-4 py-3">
                            {shortDate(row.date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">
                            {row.voucherNo}
                          </td>
                          <td className="px-4 py-3">{row.narration}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-emerald-600">
                            {row.debit ? money(row.debit) : ""}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-rose-600">
                            {row.credit ? money(row.credit) : ""}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            {money(row.runningBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {reportRows.length > PAGE_SIZE && (
                  <Pagination page={page} pageSize={PAGE_SIZE} total={reportRows.length} onPageChange={setPage} />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
