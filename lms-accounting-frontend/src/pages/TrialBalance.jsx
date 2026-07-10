import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import ExportButtons from "../components/ExportButtons.jsx";
import Pagination from "../components/Pagination.jsx";
import { money, shortDate } from "../utils/format.js";

const inputClass =
  "h-11 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";
const buttonClass =
  "inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed";
const bannerClass =
  "rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700";
const statCardClass =
  "rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm";
const tableWrapperClass =
  "overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm";

function ErrorBanner({ message }) {
  return <div className={bannerClass}>{message}</div>;
}

export default function TrialBalance() {
  const [asOf, setAsOf] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  function load(params = {}) {
    api
      .getTrialBalance(params)
      .then(setData)
      .catch((e) => setError(e.message));
  }

  useEffect(() => load(), []);

  return (
    <>
      <PageHeader
        // eyebrow="Reports · 04"
        title="Trial Balance"
        // description="Every account's total debits and credits posted so far. Total Debit = Total Credit is the check that the books balance."
        action={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              className={inputClass + " w-full sm:w-40"}
            />
            <button
              type="button"
              className={buttonClass}
              onClick={() => load({ asOf: asOf || undefined })}
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
              <div className="text-sm text-slate-500">Total debit</div>
              <div className="mt-3 text-3xl font-semibold text-slate-900">
                {money(data.totalDebit)}
              </div>
            </div>
            <div className={statCardClass}>
              <div className="text-sm text-slate-500">Total credit</div>
              <div className="mt-3 text-3xl font-semibold text-slate-900">
                {money(data.totalCredit)}
              </div>
            </div>
            <div className={statCardClass}>
              <div className="text-sm text-slate-500">Books balanced?</div>
              <div className="mt-3 text-3xl font-semibold text-slate-900">
                {data.balanced ? "✓ Yes" : "✗ No — investigate"}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="text-lg font-semibold text-slate-900">
                  As of {shortDate(data.asOf)}
                </div>
                <input
                  placeholder="Search account code or name"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="mt-0 w-72 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <ExportButtons
                onExport={(format) =>
                  api.exportTrialBalance(format, { asOf: asOf || undefined })
                }
              />
            </div>

            <div className={tableWrapperClass}>
              <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Total debit
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Total credit
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Closing balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(() => {
                    const q = String(search || "")
                      .trim()
                      .toLowerCase();
                    const rows = q
                      ? data.rows.filter((r) =>
                          (r.code + " " + r.name).toLowerCase().includes(q),
                        )
                      : data.rows;
                    const total = rows.length;
                    const start = (page - 1) * PAGE_SIZE;
                    const current = rows.slice(start, start + PAGE_SIZE);
                    return current.map((r) => (
                      <tr key={r.accountId} className="odd:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className="mr-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
                            {r.code}
                          </span>
                          {r.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {r.type}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-rose-700">
                          {r.totalDebit ? money(r.totalDebit) : ""}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-700">
                          {r.totalCredit ? money(r.totalCredit) : ""}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {money(r.closingBalance)}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
            {data.rows && (
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={
                  (search
                    ? data.rows.filter((r) =>
                        (r.code + " " + r.name).toLowerCase().includes(
                          String(search || "")
                            .trim()
                            .toLowerCase(),
                        ),
                      )
                    : data.rows
                  ).length
                }
                onPageChange={(p) => setPage(Math.max(1, p))}
              />
            )}
          </div>
        </>
      )}
    </>
  );
}
