import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import Pagination from '../components/Pagination.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { money, dateTime } from '../utils/format.js';

export default function CustomerLedger() {
  const [customerId, setCustomerId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setData(null);
    setPage(1);
    try {
      setData(await api.getCustomerLedger(customerId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const entries = data?.entries ?? [];
  const currentEntries = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        // eyebrow="Reports · Customer"
        title="Customer Ledger"
        // description="Every posted journal entry traced back to a customer's loan applications — disbursements, EMI collections, penalties, write-offs, all in one place."
      />

      <form className="panel" onSubmit={handleSubmit}>
        <div className="line-row" style={{ gridTemplateColumns: '2fr auto' }}>
          <div className="field">
            <label>Customer id</label>
            <input required value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="paste from npm run seed" />
          </div>
          <div className="field">
            <button className="btn" disabled={busy || !customerId}>
              {busy ? 'Loading…' : 'Load ledger'}
            </button>
          </div>
        </div>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {data && (
        <>
          <div className="panel">
            <div className="panel-title">Loan applications for this customer</div>
            {data.loans.length === 0 ? (
              <div className="empty-state">No loan applications found for this customer id.</div>
            ) : (
              <ul className="list-disc pl-5 text-sm">
                {data.loans.map((l) => (
                  <li key={l.id}>
                    <span className="mono">{l.loanNumber}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel">
            <div className="panel-title">Journal entries</div>
            {data.entries.length === 0 && <div className="empty-state">No posted journal entries yet for this customer's loans.</div>}
            {data.entries.length > 0 && (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>Voucher</th>
                      <th>Date</th>
                      <th>Narration</th>
                      <th>Reference</th>
                      <th className="num">Debit</th>
                      <th className="num">Credit</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEntries.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <Link to={`/journal-entries/${e.id}`} className="mono">
                            {e.voucherNo}
                          </Link>
                        </td>
                        <td>{dateTime(e.transactionDate)}</td>
                        <td>{e.narration}</td>
                        <td className="mono">{e.referenceType || '—'}</td>
                        <td className="num text-debit">{money(e.totalDebit)}</td>
                        <td className="num text-credit">{money(e.totalCredit)}</td>
                        <td>
                          <StatusBadge status={e.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {entries.length > PAGE_SIZE && (
                  <Pagination page={page} pageSize={PAGE_SIZE} total={entries.length} onPageChange={setPage} />
                )}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
