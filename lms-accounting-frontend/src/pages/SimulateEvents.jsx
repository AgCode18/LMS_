import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';

const inputClass =
  'mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200';
const buttonClass =
  'inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed';
const panelClass = 'rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm';
const bannerClass =
  'rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700';
const errorClass =
  'rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700';

const EVENTS = {
  loanDisbursement: {
    label: 'Loan Disbursement',
    hint: 'Dr Loan Receivable · Cr Bank Account',
    fields: [
      { key: 'loanApplicationId', label: 'Loan application id', placeholder: 'e.g. from prisma studio' },
      { key: 'amount', label: 'Amount', type: 'number' },
    ],
    call: api.postLoanDisbursement,
  },
  emiCollection: {
    label: 'EMI Collection',
    hint: 'Dr Bank · Cr Loan Receivable, Interest Income, Penalty Income, Bounce Income',
    fields: [
      { key: 'emiScheduleId', label: 'EMI schedule id' },
      { key: 'loanApplicationId', label: 'Loan application id (for narration)' },
      { key: 'principalAmount', label: 'Principal amount', type: 'number' },
      { key: 'interestAmount', label: 'Interest amount', type: 'number' },
      { key: 'penaltyAmount', label: 'Penalty amount (optional)', type: 'number' },
      { key: 'bounceAmount', label: 'Bounce charges (optional)', type: 'number' },
    ],
    call: api.postEmiCollection,
  },
  processingFee: {
    label: 'Processing Fee',
    hint: 'Dr Customer/Bank · Cr Processing Fee Income',
    fields: [
      { key: 'loanApplicationId', label: 'Loan application id' },
      { key: 'amount', label: 'Amount', type: 'number' },
    ],
    call: api.postProcessingFee,
  },
  penaltyCollection: {
    label: 'Penalty Collection',
    hint: 'Dr Bank · Cr Penalty Income',
    fields: [
      { key: 'referenceId', label: 'Reference id (loan/customer)' },
      { key: 'amount', label: 'Amount', type: 'number' },
    ],
    call: api.postPenaltyCollection,
  },
  writeOff: {
    label: 'Loan Write-Off',
    hint: 'Dr Bad Debt Expense · Cr Loan Receivable',
    fields: [
      { key: 'loanApplicationId', label: 'Loan application id' },
      { key: 'amount', label: 'Outstanding amount', type: 'number' },
    ],
    call: api.postWriteOff,
  },
  recoveryPayment: {
    label: 'Recovery Payment',
    hint: 'Dr Bank · Cr Loan Receivable',
    fields: [
      { key: 'loanApplicationId', label: 'Loan application id' },
      { key: 'customerId', label: 'Customer id' },
      { key: 'amount', label: 'Amount recovered', type: 'number' },
    ],
    call: api.postRecoveryPayment,
  },
  refund: {
    label: 'Refund',
    hint: 'Reverses a prior receipt',
    fields: [
      { key: 'referenceId', label: 'Reference id' },
      { key: 'amount', label: 'Amount', type: 'number' },
      { key: 'reason', label: 'Reason' },
    ],
    call: api.postRefund,
  },
};

function EventCard({ def }) {
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const payload = {};
      for (const f of def.fields) {
        if (values[f.key] === undefined || values[f.key] === '') continue;
        payload[f.key] = f.type === 'number' ? Number(values[f.key]) : values[f.key];
      }
      const entry = await def.call(payload);
      setResult(entry);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={panelClass} onSubmit={submit}>
      <div className="mb-2 text-lg font-semibold text-slate-900">{def.label}</div>
      <p className="mb-5 text-sm leading-6 text-slate-600">{def.hint}</p>

      <div className="space-y-4">
        {def.fields.map((f) => (
          <label key={f.key} className="block text-sm font-medium text-slate-600">
            <span>{f.label}</span>
            <input
              type={f.type || 'text'}
              step={f.type === 'number' ? '0.01' : undefined}
              placeholder={f.placeholder}
              value={values[f.key] || ''}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              className={inputClass}
            />
          </label>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button type="submit" className={buttonClass} disabled={busy}>
          {busy ? 'Posting…' : `Fire ${def.label}`}
        </button>
      </div>

      {error && <div className={`mt-5 ${errorClass}`}>{error}</div>}
      {result && (
        <div className={`mt-5 ${bannerClass}`}>
          Posted <span className="font-mono text-slate-700">{result.voucherNo}</span> — total {result.totalDebit}.{' '}
          <Link to={`/journal-entries/${result.id}`} className="font-semibold text-slate-900 hover:text-slate-700">
            View entry →
          </Link>
        </div>
      )}
    </form>
  );
}

export default function SimulateEvents() {
  return (
    <>
      <PageHeader
        eyebrow="LMS Event Simulator · 08"
        title="Simulate postings"
        description="Fire each accounting event by hand — this is exactly what your real loan-application, EMI, and recovery controllers should call once they're wired to this engine (see README → 'Wiring into your real LMS'). Run npm run seed in the backend first; it prints a demo loanApplicationId/customerId/emiScheduleId you can paste below."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {Object.entries(EVENTS).map(([key, def]) => (
          <EventCard key={key} def={def} />
        ))}
      </div>
    </>
  );
}
