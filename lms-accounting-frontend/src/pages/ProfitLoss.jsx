import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import ExportButtons from "../components/ExportButtons.jsx";
import { money } from "../utils/format.js";

const inputClass =
  "h-11 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";
const buttonClass =
  "inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed";
const bannerClass =
  "rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700";
const statCardClass =
  "rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm";

function ErrorBanner({ message }) {
  return <div className={bannerClass}>{message}</div>;
}

export default function ProfitLoss() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  function load(params = {}) {
    api
      .getProfitAndLoss(params)
      .then(setData)
      .catch((e) => setError(e.message));
  }

  useEffect(() => load(), []);

  return (
    <>
      <PageHeader
        // eyebrow="Reports · 06"
        title="Profit & Loss"
        // description="Interest income, processing fee income and penalty income, less expenses, for the selected period."
        action={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputClass + " w-full sm:w-40"}
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputClass + " w-full sm:w-40"}
            />
            <button
              type="button"
              className={buttonClass}
              onClick={() =>
                load({ from: from || undefined, to: to || undefined })
              }
            >
              Run
            </button>
          </div>
        }
      />

      {error && <ErrorBanner message={error} />}
      {!data && !error && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Loading…
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className={statCardClass}>
              <div className="text-sm text-slate-500">Total income</div>
              <div className="mt-3 text-3xl font-semibold text-slate-900">
                {money(data.totalIncome)}
              </div>
            </div>
            <div className={statCardClass}>
              <div className="text-sm text-slate-500">Total expense</div>
              <div className="mt-3 text-3xl font-semibold text-slate-900">
                {money(data.totalExpense)}
              </div>
            </div>
            <div className={statCardClass}>
              <div className="text-sm text-slate-500">
                Net {data.netProfit >= 0 ? "profit" : "loss"}
              </div>
              <div className="mt-3 text-3xl font-semibold text-slate-900">
                {money(Math.abs(data.netProfit))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <ExportButtons
              onExport={(format) =>
                api.exportProfitAndLoss(format, {
                  from: from || undefined,
                  to: to || undefined,
                })
              }
            />
          </div>

          <div className="mt-6 space-y-6">
            <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-lg font-semibold text-slate-900">
                Income
              </div>
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                  <tbody>
                    {data.income.map((r) => (
                      <tr key={r.code} className="odd:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className="mr-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
                            {r.code}
                          </span>
                          {r.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-700">
                          {money(r.amount)}
                        </td>
                      </tr>
                    ))}
                    {data.income.length === 0 && (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-4 py-6 text-center text-sm text-slate-500"
                        >
                          No income posted in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-lg font-semibold text-slate-900">
                Expense
              </div>
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                  <tbody>
                    {data.expense.map((r) => (
                      <tr key={r.code} className="odd:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className="mr-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
                            {r.code}
                          </span>
                          {r.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-rose-700">
                          {money(r.amount)}
                        </td>
                      </tr>
                    ))}
                    {data.expense.length === 0 && (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-4 py-6 text-center text-sm text-slate-500"
                        >
                          No expense posted in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
