import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import { money } from "../utils/format.js";

const emptyLine = () => ({
  accountId: "",
  debit: "",
  credit: "",
  description: "",
});

const inputClass =
  "mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";
const selectClass = inputClass;
const buttonClass =
  "inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed";
const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-900 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed";

function Banner({ type, children }) {
  const className =
    type === "success"
      ? "rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
      : "rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700";
  return <div className={className}>{children}</div>;
}

export default function NewJournalEntry() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [narration, setNarration] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [lines, setLines] = useState([emptyLine(), emptyLine()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getAccounts()
      .then(setAccounts)
      .catch((e) => setError(e.message));
  }, []);

  const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005 && totalDebit > 0;

  function updateLine(idx, patch) {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    );
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(idx) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!balanced) {
      setError("Debits must equal credits before this voucher can be posted.");
      return;
    }
    setSaving(true);
    try {
      const entry = await api.createJournalEntry({
        narration,
        transactionDate,
        referenceType: "MANUAL",
        status: "POSTED",
        lines: lines
          .filter((l) => l.accountId && (l.debit || l.credit))
          .map((l) => ({
            accountId: l.accountId,
            debit: Number(l.debit || 0),
            credit: Number(l.credit || 0),
            description: l.description,
          })),
      });
      navigate(`/journal-entries/${entry.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="New Journal Entry" />

      {error && <Banner type="error">{error}</Banner>}

      <form
        onSubmit={handleSubmit}
        className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Narration
            </label>
            <input
              required
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="e.g. Office rent for July"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Transaction date
            </label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-8 mb-4 text-lg font-semibold text-slate-900">
          Lines
        </div>
        <div className="space-y-4">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
            >
              <div className="grid gap-4 xl:grid-cols-[2fr_1fr_1fr_1fr_auto] items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-600">
                    Account
                  </label>
                  <select
                    required
                    value={line.accountId}
                    onChange={(e) =>
                      updateLine(idx, { accountId: e.target.value })
                    }
                    className={selectClass}
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
                  <label className="block text-sm font-medium text-slate-600">
                    Debit
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.debit}
                    onChange={(e) =>
                      updateLine(idx, {
                        debit: e.target.value,
                        credit: e.target.value ? "" : line.credit,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">
                    Credit
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.credit}
                    onChange={(e) =>
                      updateLine(idx, {
                        credit: e.target.value,
                        debit: e.target.value ? "" : line.debit,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">
                    Description
                  </label>
                  <input
                    value={line.description}
                    onChange={(e) =>
                      updateLine(idx, { description: e.target.value })
                    }
                    placeholder="optional"
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    className={secondaryButtonClass}
                    onClick={() => removeLine(idx)}
                    disabled={lines.length <= 2}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={`${secondaryButtonClass} mt-4`}
          onClick={addLine}
        >
          + Add line
        </button>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Total debit</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">
              {money(totalDebit)}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Total credit</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">
              {money(totalCredit)}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Balanced?</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">
              {balanced ? "✓ Yes" : "✗ Not yet"}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button className={buttonClass} disabled={!balanced || saving}>
            {saving ? "Posting…" : "Post voucher"}
          </button>
        </div>
      </form>
    </>
  );
}
