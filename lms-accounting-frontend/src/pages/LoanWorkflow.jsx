import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import { money } from "../utils/format.js";

const inputClass =
  "mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200";
const selectClass = inputClass;
const buttonClass =
  "inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed";

function Banner({ type, children }) {
  const style =
    type === "success"
      ? "rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
      : "rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700";
  return <div className={style}>{children}</div>;
}

function EligibilityPanel() {
  const [loanApplicationId, setLoanApplicationId] = useState("");
  const [check, setCheck] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function runCheck(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setCheck(null);
    try {
      setCheck(await api.checkDisbursementEligibility(loanApplicationId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={runCheck}
      className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm mb-6"
    >
      <div className="text-lg font-semibold text-slate-900 mb-4">
        1 · Check disbursement eligibility
      </div>
      {/* <p className="text-sm leading-6 text-slate-600 mb-6">
        Verifies KYC = VERIFIED, latest Sanction = APPROVED, latest NACH = ACTIVE,
        and that this loan isn't already disbursed — before any money moves.
      </p> */}
      <div className="grid gap-4 lg:grid-cols-[2fr_auto]">
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Loan application id
          </label>
          <input
            value={loanApplicationId}
            onChange={(e) => setLoanApplicationId(e.target.value)}
            placeholder="paste from npm run seed"
            className={inputClass}
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className={buttonClass}
            disabled={busy || !loanApplicationId}
          >
            {busy ? "Checking…" : "Check"}
          </button>
        </div>
      </div>
      {error && <Banner type="error">{error}</Banner>}
      {check && (
        <Banner type={check.eligible ? "success" : "error"}>
          <div>
            {check.eligible
              ? "✓ Eligible for disbursement."
              : "✗ Not eligible yet:"}
          </div>
          {!check.eligible && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
              {check.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </Banner>
      )}
    </form>
  );
}

function DisburseForm() {
  const [loanApplicationId, setLoanApplicationId] = useState("");
  const [fields, setFields] = useState({
    disbursementMode: "NEFT",
    bankName: "",
    bankAccountNumber: "",
    ifscCode: "",
    accountHolderName: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await api.disburseLoan(loanApplicationId, fields));
    } catch (err) {
      setError(
        err.message + (err.details ? ": " + err.details.join("; ") : ""),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm mb-6"
    >
      <div className="text-lg font-semibold text-slate-900 mb-4">
        2 · Disburse a loan
      </div>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Loan application id
          </label>
          <input
            required
            value={loanApplicationId}
            onChange={(e) => setLoanApplicationId(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Mode
            </label>
            <select
              value={fields.disbursementMode}
              onChange={(e) =>
                setFields({ ...fields, disbursementMode: e.target.value })
              }
              className={selectClass}
            >
              {[
                "NEFT",
                "RTGS",
                "IMPS",
                "BANK_TRANSFER",
                "CHEQUE",
                "CASH",
                "UPI",
              ].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Bank name
            </label>
            <input
              value={fields.bankName}
              onChange={(e) =>
                setFields({ ...fields, bankName: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Account no.
            </label>
            <input
              value={fields.bankAccountNumber}
              onChange={(e) =>
                setFields({ ...fields, bankAccountNumber: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">
              IFSC
            </label>
            <input
              value={fields.ifscCode}
              onChange={(e) =>
                setFields({ ...fields, ifscCode: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Holder name
            </label>
            <input
              value={fields.accountHolderName}
              onChange={(e) =>
                setFields({ ...fields, accountHolderName: e.target.value })
              }
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className={buttonClass} disabled={busy}>
            {busy ? "Disbursing…" : "Disburse loan"}
          </button>
        </div>
      </div>
      {error && <Banner type="error">{error}</Banner>}
      {result && (
        <Banner type="success">
          Disbursed {money(result.disbursement.amount)} — journal voucher{" "}
          <span className="font-mono text-slate-700">
            {result.journalEntry.voucherNo}
          </span>{" "}
          was posted automatically.{" "}
          <Link
            to={`/journal-entries/${result.journalEntry.id}`}
            className="font-semibold text-slate-900 hover:text-slate-700"
          >
            View entry →
          </Link>
        </Banner>
      )}
    </form>
  );
}

function EmiCollectForm() {
  const [emiScheduleId, setEmiScheduleId] = useState("");
  const [fields, setFields] = useState({
    principalAmount: "",
    interestAmount: "",
    paymentMode: "UPI",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const payload = {
        ...fields,
        principalAmount: Number(fields.principalAmount || 0),
        interestAmount: Number(fields.interestAmount || 0),
      };
      setResult(await api.collectEmiReal(emiScheduleId, payload));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm mb-6"
    >
      <div className="text-lg font-semibold text-slate-900 mb-4">
        3 · Collect an EMI
      </div>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600">
            EMI schedule id
          </label>
          <input
            required
            value={emiScheduleId}
            onChange={(e) => setEmiScheduleId(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Principal
            </label>
            <input
              type="number"
              step="0.01"
              value={fields.principalAmount}
              onChange={(e) =>
                setFields({ ...fields, principalAmount: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Interest
            </label>
            <input
              type="number"
              step="0.01"
              value={fields.interestAmount}
              onChange={(e) =>
                setFields({ ...fields, interestAmount: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Payment mode
            </label>
            <select
              value={fields.paymentMode}
              onChange={(e) =>
                setFields({ ...fields, paymentMode: e.target.value })
              }
              className={selectClass}
            >
              {["UPI", "CASH", "BANK", "CHEQUE"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className={buttonClass} disabled={busy}>
            {busy ? "Collecting…" : "Collect EMI"}
          </button>
        </div>
      </div>
      {error && <Banner type="error">{error}</Banner>}
      {result && (
        <Banner type="success">
          Collected — journal voucher{" "}
          <span className="font-mono text-slate-700">
            {result.journalEntry.voucherNo}
          </span>{" "}
          was posted automatically.{" "}
          <Link
            to={`/journal-entries/${result.journalEntry.id}`}
            className="font-semibold text-slate-900 hover:text-slate-700"
          >
            View entry →
          </Link>
        </Banner>
      )}
    </form>
  );
}

function ProcessingFeeForm() {
  const [loanApplicationId, setLoanApplicationId] = useState("");
  const [amount, setAmount] = useState("");
  const [collectedImmediately, setCollectedImmediately] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(
        await api.chargeProcessingFeeReal(loanApplicationId, {
          amount: Number(amount),
          collectedImmediately,
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm mb-6"
    >
      <div className="text-lg font-semibold text-slate-900 mb-4">
        Charge processing fee
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_auto] items-end">
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Loan application id
          </label>
          <input
            required
            value={loanApplicationId}
            onChange={(e) => setLoanApplicationId(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Amount
          </label>
          <input
            required
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={collectedImmediately}
            onChange={(e) => setCollectedImmediately(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
          />
          Collected now
        </label>
        <div className="flex justify-end">
          <button type="submit" className={buttonClass} disabled={busy}>
            {busy ? "Charging…" : "Charge fee"}
          </button>
        </div>
      </div>
      <p className="text-sm leading-6 text-slate-600">
        Uncheck "Collected now" if the fee is only receivable (books it against
        Customer Receivable instead of Bank).
      </p>
      {error && <Banner type="error">{error}</Banner>}
      {result && (
        <Banner type="success">
          Fee posted — journal voucher{" "}
          <span className="font-mono text-slate-700">
            {result.journalEntry.voucherNo}
          </span>
          .{" "}
          <Link
            to={`/journal-entries/${result.journalEntry.id}`}
            className="font-semibold text-slate-900 hover:text-slate-700"
          >
            View entry →
          </Link>
        </Banner>
      )}
    </form>
  );
}

function PenaltyForm() {
  const [loanApplicationId, setLoanApplicationId] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(
        await api.collectPenaltyReal(loanApplicationId, {
          amount: Number(amount),
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm mb-6"
    >
      <div className="text-lg font-semibold text-slate-900 mb-4">
        Collect penalty
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr_auto] items-end">
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Loan application id
          </label>
          <input
            required
            value={loanApplicationId}
            onChange={(e) => setLoanApplicationId(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Amount
          </label>
          <input
            required
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className={buttonClass} disabled={busy}>
            {busy ? "Collecting…" : "Collect penalty"}
          </button>
        </div>
      </div>
      {error && <Banner type="error">{error}</Banner>}
      {result && (
        <Banner type="success">
          Penalty posted — journal voucher{" "}
          <span className="font-mono text-slate-700">
            {result.journalEntry.voucherNo}
          </span>
          .{" "}
          <Link
            to={`/journal-entries/${result.journalEntry.id}`}
            className="font-semibold text-slate-900 hover:text-slate-700"
          >
            View entry →
          </Link>
        </Banner>
      )}
    </form>
  );
}

function WriteOffForm() {
  const [loanApplicationId, setLoanApplicationId] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (
      !window.confirm(
        "Write off this loan? This marks it WRITTEN_OFF and cannot be easily undone.",
      )
    )
      return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(
        await api.writeOffReal(loanApplicationId, { amount: Number(amount) }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm mb-6"
    >
      <div className="text-lg font-semibold text-slate-900 mb-4">
        Write off a loan
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr_auto] items-end">
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Loan application id
          </label>
          <input
            required
            value={loanApplicationId}
            onChange={(e) => setLoanApplicationId(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Outstanding amount
          </label>
          <input
            required
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={busy}
          >
            {busy ? "Writing off…" : "Write off loan"}
          </button>
        </div>
      </div>
      <p className="text-sm leading-6 text-slate-600">
        Sets LoanApplication.status to WRITTEN_OFF and posts the bad-debt entry.
        Confirmed before submitting.
      </p>
      {error && <Banner type="error">{error}</Banner>}
      {result && (
        <Banner type="success">
          Written off — journal voucher{" "}
          <span className="font-mono text-slate-700">
            {result.journalEntry.voucherNo}
          </span>
          .{" "}
          <Link
            to={`/journal-entries/${result.journalEntry.id}`}
            className="font-semibold text-slate-900 hover:text-slate-700"
          >
            View entry →
          </Link>
        </Banner>
      )}
    </form>
  );
}

function RecoveryPaymentForm() {
  const [loanRecoveryId, setLoanRecoveryId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [referenceNo, setReferenceNo] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(
        await api.recoveryPaymentReal(loanRecoveryId, {
          amount: Number(amount),
          paymentMode,
          referenceNo,
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm mb-6"
    >
      <div className="text-lg font-semibold text-slate-900 mb-4">
        Record a recovery payment
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] items-end">
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Loan recovery id
          </label>
          <input
            required
            value={loanRecoveryId}
            onChange={(e) => setLoanRecoveryId(e.target.value)}
            placeholder="from LoanRecovery, not the loan application"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Amount
          </label>
          <input
            required
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Payment mode
          </label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className={selectClass}
          >
            {["UPI", "CASH", "BANK", "CHEQUE"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Reference no.
          </label>
          <input
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            placeholder="optional"
            className={inputClass}
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className={buttonClass} disabled={busy}>
            {busy ? "Recording…" : "Record payment"}
          </button>
        </div>
      </div>
      <p className="text-sm leading-6 text-slate-600">
        Rejects if the amount exceeds the recovery&apos;s outstanding balance.
        Updates `LoanRecovery.recoveredAmount`/`balanceAmount`.
      </p>
      {error && <Banner type="error">{error}</Banner>}
      {result && (
        <Banner type="success">
          Recovery recorded — journal voucher{" "}
          <span className="font-mono text-slate-700">
            {result.journalEntry.voucherNo}
          </span>
          .{" "}
          <Link
            to={`/journal-entries/${result.journalEntry.id}`}
            className="font-semibold text-slate-900 hover:text-slate-700"
          >
            View entry →
          </Link>
        </Banner>
      )}
    </form>
  );
}

function RefundForm() {
  const [referenceId, setReferenceId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(
        await api.refundReal({ referenceId, amount: Number(amount), reason }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm mb-6"
    >
      <div className="text-lg font-semibold text-slate-900 mb-4">
        Issue a refund
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr_2fr_auto] items-end">
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Reference id
          </label>
          <input
            required
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            placeholder="loan application id, or any id"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Amount
          </label>
          <input
            required
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">
            Reason
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. excess EMI payment"
            className={inputClass}
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className={buttonClass} disabled={busy}>
            {busy ? "Issuing…" : "Issue refund"}
          </button>
        </div>
      </div>
      {error && <Banner type="error">{error}</Banner>}
      {result && (
        <Banner type="success">
          Refund posted — journal voucher{" "}
          <span className="font-mono text-slate-700">
            {result.journalEntry.voucherNo}
          </span>
          .{" "}
          <Link
            to={`/journal-entries/${result.journalEntry.id}`}
            className="font-semibold text-slate-900 hover:text-slate-700"
          >
            View entry →
          </Link>
        </Banner>
      )}
    </form>
  );
}

export default function LoanWorkflow() {
  return (
    <div className="space-y-6">
      <PageHeader
        // eyebrow="Loan lifecycle · real controllers"
        title="Loan Lifecycle Workflow"
        // description="The actual gated workflow, not raw accounting triggers: disbursement checks KYC/Sanction/NACH before it will move money, and every step here creates its own LMS record before handing off to the accounting engine automatically."
      />
      <EligibilityPanel />
      <DisburseForm />
      <EmiCollectForm />
      <ProcessingFeeForm />
      <PenaltyForm />
      <WriteOffForm />
      <RecoveryPaymentForm />
      <RefundForm />
    </div>
  );
}
