import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import Pagination from '../components/Pagination.jsx';
import { money } from '../utils/format.js';

const TYPES = ['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE', 'EQUITY'];
const PAGE_SIZE = 10;

function flatten(nodes, depth = 0, out = []) {
  for (const n of nodes) {
    out.push({ ...n, depth });
    if (n.children?.length) flatten(n.children, depth + 1, out);
  }
  return out;
}

export default function ChartOfAccounts() {
  const [tree, setTree] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', type: 'ASSET', description: '' });
  const [codeAuto, setCodeAuto] = useState(true); // true = let the backend keep auto-generating as type changes
  const [saving, setSaving] = useState(false);

  // Search + pagination (flat, server-side) — shown instead of the tree
  // once the user starts typing a search term.
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [searchResult, setSearchResult] = useState(null);

  function loadTree() {
    api.getAccountTree().then(setTree).catch((e) => setError(e.message));
  }

  useEffect(loadTree, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResult(null);
      return;
    }
    const handle = setTimeout(() => {
      api
        .getAccounts({ search: search.trim(), page, pageSize: PAGE_SIZE })
        .then(setSearchResult)
        .catch((e) => setError(e.message));
    }, 250); // debounce so we're not firing a request on every keystroke
    return () => clearTimeout(handle);
  }, [search, page]);

  useEffect(() => {
    if (!showForm || !codeAuto) return;
    api
      .getNextAccountCode(form.type)
      .then((res) => setForm((f) => ({ ...f, code: res.code })))
      .catch(() => {});
  }, [showForm, codeAuto, form.type]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.createAccount(form);
      setForm({ code: '', name: '', type: 'ASSET', description: '' });
      setCodeAuto(true);
      setShowForm(false);
      loadTree();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const treeRows = tree ? flatten(tree) : [];
  const isSearching = search.trim().length > 0;
  const pagedTreeRows = treeRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts"
        // description="Every ledger account the engine can post to. Assets and Expenses carry a natural debit balance; Liabilities, Income and Equity carry a natural credit balance."
        action={
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className=" inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
          
          >
            {showForm ? 'Cancel' : '+ New account'}
          </button>
        }
      />

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="mb-5 text-lg font-semibold text-slate-900">New ledger account</div>
          <div className="grid gap-4 md:grid-cols-[1fr_2fr_1fr_2fr_auto] items-end">
            <div>
              <label className="block text-sm font-medium text-slate-600">Code</label>
              <input
                required
                value={form.code}
                onChange={(e) => {
                  setCodeAuto(false);
                  setForm({ ...form, code: e.target.value });
                }}
                placeholder="auto"
                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              {/* {codeAuto && <div className="mt-2 text-xs text-slate-500">{form.type}</div>} */}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Petty Cash"
                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="optional"
                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-lg font-semibold text-slate-900">{isSearching ? 'Search results' : 'Ledger tree'}</div>
          <input
            type="text"
            placeholder="Search by account name or code…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full max-w-xs rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {!isSearching && !tree && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Loading…</div>
        )}

        {!isSearching && tree && treeRows.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            No accounts yet — run <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700">npm run seed</code> in the backend to load the sample Chart of Accounts.
          </div>
        )}

        {!isSearching && treeRows.length > 0 && (
          <>
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Account</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Opening Balance</th>
                    <th className="px-4 py-3 text-right font-semibold">Current Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                  {pagedTreeRows.map((r) => (
                    <tr key={r.id} className="odd:bg-slate-50 even:bg-white">
                      <td className="px-4 py-3" style={{ paddingLeft: 10 + r.depth * 22 }}>
                        <span className="mr-2 font-mono text-slate-500">{r.code}</span>
                        {r.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">{r.type}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">{r.status}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{money(r.openingBalance)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{money(r.currentBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {treeRows.length > PAGE_SIZE && (
              <Pagination page={page} pageSize={PAGE_SIZE} total={treeRows.length} onPageChange={setPage} />
            )}
          </>
        )}

        {isSearching && !searchResult && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Searching…</div>
        )}

        {isSearching && searchResult && searchResult.data.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            No accounts match "{search}".
          </div>
        )}

        {isSearching && searchResult && searchResult.data.length > 0 && (
          <>
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Account</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Opening</th>
                    <th className="px-4 py-3 text-right font-semibold">Current balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                  {searchResult.data.map((r) => (
                    <tr key={r.id} className="odd:bg-slate-50 even:bg-white">
                      <td className="px-4 py-3">
                        <span className="mr-2 font-mono text-slate-500">{r.code}</span>
                        {r.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">{r.type}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">{r.status}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{money(r.openingBalance)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{money(r.currentBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={searchResult.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
