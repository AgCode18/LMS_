import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import Pagination from '../components/Pagination.jsx';
import { money } from '../utils/format.js';

export default function BranchWise() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', code: '' });
  const [branchSaving, setBranchSaving] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [disbursementsPage, setDisbursementsPage] = useState(1);
  const [applicationsPage, setApplicationsPage] = useState(1);
  const PAGE_SIZE = 10;

  async function loadBranches() {
    try {
      const result = await api.getBranches();
      setBranches(result);
    } catch (e) {
      setError(e.message);
    }
  }

  async function load() {
    setError('');
    try {
      const result = await api.getBranchWise({
        from: from || undefined,
        to: to || undefined,
        branchId: branchId || undefined,
      });
      setData(result);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    loadBranches();
    load();
  }, []);

  const disbursementRows = data?.disbursementsByBranch ?? [];
  const applicationRows = data?.applicationsByBranch ?? [];
  const currentDisbursementRows = disbursementRows.slice((disbursementsPage - 1) * PAGE_SIZE, disbursementsPage * PAGE_SIZE);
  const currentApplicationRows = applicationRows.slice((applicationsPage - 1) * PAGE_SIZE, applicationsPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports · Branch"
        title="Branch-wise Summary"
        // description="Posted disbursement totals and loan application counts, grouped by branch."
      />

      <form
        className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          setDisbursementsPage(1);
          setApplicationsPage(1);
          load();
        }}
      >
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_auto] items-end">
          <div>
            <label className="block text-sm font-medium text-slate-600">Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">All branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.code} — {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowBranchForm((s) => !s)}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {showBranchForm ? 'Cancel' : '+ Add branch'}
            </button>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Apply
            </button>
          </div>
        </div>
      </form>
      {showBranchForm && (
        <form
          className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            setBranchSaving(true);
            setError('');
            try {
              await api.createBranch(branchForm);
              setBranchForm({ name: '', code: '' });
              setShowBranchForm(false);
              await loadBranches();
            } catch (err) {
              setError(err.message);
            } finally {
              setBranchSaving(false);
            }
          }}
        >
          <div className="mb-4 text-lg font-semibold text-slate-900">New branch</div>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
            <div>
              <label className="block text-sm font-medium text-slate-600">Branch name</label>
              <input
                required
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Branch code</label>
              <input
                required
                value={branchForm.code}
                onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={branchSaving}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {branchSaving ? 'Saving…' : 'Create branch'}
              </button>
            </div>
          </div>
        </form>
      )}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 text-lg font-semibold text-slate-900">Disbursements by branch (posted only)</div>
        {!data && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            Loading…
          </div>
        )}
        {data && data.disbursementsByBranch.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            No posted disbursements yet.
          </div>
        )}
        {data && data.disbursementsByBranch.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Branch id</th>
                  <th className="px-4 py-3 text-right font-semibold">Disbursement count</th>
                  <th className="px-4 py-3 text-right font-semibold">Total disbursed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                {currentDisbursementRows.map((row) => (
                  <tr key={row.branchId}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">{row.branchId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">{row._count._all}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">{money(row._sum.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 text-lg font-semibold text-slate-900">Loan applications by branch</div>
        {data && data.applicationsByBranch.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            No loan applications yet.
          </div>
        )}
        {data && data.applicationsByBranch.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Branch id</th>
                  <th className="px-4 py-3 text-right font-semibold">Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                {currentApplicationRows.map((row) => (
                  <tr key={row.branchId}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">{row.branchId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">{row._count._all}</td>
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
