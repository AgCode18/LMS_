import { useEffect, useMemo, useState } from "react";
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

  async function loadReport({ resetPage = true } = {}) {
    setError("");
    setReport(null);
    if (resetPage) {
      setPage(1);
    }

    if (!accountId || !statementDate || bankBalance === "") {
      setError(
        "Please select an account, statement date, and bank statement balance.",
      );
      return;
    }

    setLoading(true);
    try {
      const params = { statementDate, bankBalance };
      const data = await api.getBankReconciliation(accountId, params);
      setReport(data.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Recomputes totals from the FULL, unfiltered row set — this is always
  // the source of truth for balances, regardless of what's on-screen.
  async function handleToggleCleared(rowId, checked) {
    if (!report) return;

    const previousRows = report.rows;
    const nextRows = previousRows.map((row) =>
      row.id === rowId
        ? {
            ...row,
            isCleared: checked,
            clearedDate: checked ? new Date().toISOString() : null,
            isDepositInTransit: row.debit > 0 && !checked,
            isOutstandingCheck: row.credit > 0 && !checked,
          }
        : row,
    );

    const depositsInTransit = nextRows
      .filter((row) => row.isDepositInTransit)
      .reduce((sum, row) => sum + row.debit, 0);

    const outstandingChecks = nextRows
      .filter((row) => row.isOutstandingCheck)
      .reduce((sum, row) => sum + row.credit, 0);

    const netAdjustment = depositsInTransit - outstandingChecks;
    const adjustedBankBalance = Number(bankBalance) + netAdjustment;
    const isReconciled =
      Math.abs(adjustedBankBalance - report.bookBalance) < 0.001;

    setReport({
      ...report,
      rows: nextRows,
      depositsInTransit,
      outstandingChecks,
      netAdjustment,
      adjustedBankBalance,
      isReconciled,
    });

    try {
      await api.setLineCleared(rowId, {
        isCleared: checked,
        clearedDate: checked ? new Date().toISOString() : null,
      });
    } catch (e) {
      setError(e.message);
      setReport({ ...report, rows: previousRows });
    }
  }

  async function handleToggleAll(checked) {
    if (!report) return;

    const previousRows = report.rows;

    const nextRows = previousRows.map((row) => ({
      ...row,
      isCleared: checked,
      clearedDate: checked ? new Date().toISOString() : null,
      isDepositInTransit: row.debit > 0 && !checked,
      isOutstandingCheck: row.credit > 0 && !checked,
    }));

    const depositsInTransit = nextRows
      .filter((row) => row.isDepositInTransit)
      .reduce((sum, row) => sum + row.debit, 0);

    const outstandingChecks = nextRows
      .filter((row) => row.isOutstandingCheck)
      .reduce((sum, row) => sum + row.credit, 0);

    const netAdjustment = depositsInTransit - outstandingChecks;
    const adjustedBankBalance = Number(bankBalance) + netAdjustment;
    const isReconciled =
      Math.abs(adjustedBankBalance - report.bookBalance) < 0.001;

    setReport({
      ...report,
      rows: nextRows,
      depositsInTransit,
      outstandingChecks,
      netAdjustment,
      adjustedBankBalance,
      isReconciled,
    });

    try {
      await Promise.all(
        nextRows.map((row) =>
          api.setLineCleared(row.id, {
            isCleared: checked,
            clearedDate: checked ? new Date().toISOString() : null,
          }),
        ),
      );
    } catch (err) {
      setError(err.message);
      setReport({
        ...report,
        rows: previousRows,
      });
    }
  }

  // Display-only filter — never used for balance math, only for what's
  // shown in the ledger table below.
  const visibleRows = useMemo(() => {
    const rows = report?.rows ?? [];
    if (!from && !to) return rows;
    return rows.filter((row) => {
      const date = new Date(row.date);
      if (from && date < new Date(from)) return false;
      if (to && date > new Date(to)) return false;
      return true;
    });
  }, [report, from, to]);

  const currentRows = visibleRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Bank Reconciliation" />

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
              Closing balance
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
            <div className="text-sm text-slate-500">
              From date <span className="text-slate-400">(display only)</span>
            </div>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm text-slate-500">
              To date <span className="text-slate-400">(display only)</span>
            </div>
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
            <div className="text-sm text-slate-500">Closing balance</div>
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
                  All posted transactions up to the statement date. From/To only
                  filters what's shown below — totals above always reflect the
                  full account history.
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
                      })
                    }
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Export PDF
                  </button>

                  {/* <button
                    type="button"
                    onClick={() => handleToggleAll(true)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                  >
                    Check All
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleAll(false)}
                    className="rounded-xl bg-slate-600 px-4 py-2 text-white hover:bg-slate-700"
                  >
                    Uncheck All
                  </button> */}
                </div>
              </div>
            </div>

            {visibleRows.length === 0 ? (
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
                        <th className="px-4 py-3 text-center font-semibold">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="checkbox"
                              checked={
                                report.rows.length > 0 &&
                                report.rows.every((r) => r.isCleared)
                              }
                              onChange={(e) =>
                                handleToggleAll(e.target.checked)
                              }
                            />
                            {/* <span>All</span> */}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                      {currentRows.map((row) => (
                        <tr
                          key={row.id}
                          className="odd:bg-white even:bg-slate-50"
                        >
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
                          <td className="whitespace-nowrap px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={row.isCleared}
                              onChange={(e) =>
                                handleToggleCleared(row.id, e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {visibleRows.length > PAGE_SIZE && (
                  <Pagination
                    page={page}
                    pageSize={PAGE_SIZE}
                    total={visibleRows.length}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
