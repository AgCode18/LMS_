import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ChartOfAccounts from './pages/ChartOfAccounts.jsx';
import JournalEntries from './pages/JournalEntries.jsx';
import JournalEntryDetail from './pages/JournalEntryDetail.jsx';
import NewJournalEntry from './pages/NewJournalEntry.jsx';
import TrialBalance from './pages/TrialBalance.jsx';
import AccountLedger from './pages/AccountLedger.jsx';
import ProfitLoss from './pages/ProfitLoss.jsx';
import BalanceSheet from './pages/BalanceSheet.jsx';
import CustomerLedger from './pages/CustomerLedger.jsx';
import BranchWise from './pages/BranchWise.jsx';
import BankReconciliation from './pages/BankReconciliation.jsx';
import SimulateEvents from './pages/SimulateEvents.jsx';
import LoanWorkflow from './pages/LoanWorkflow.jsx';
import asyncHandler from '../../lms-accounting-backend/src/middleware/asyncHandler.js';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:px-8">
        <Sidebar />
        <main className="min-h-screen rounded-4xl bg-slate-100 p-6 shadow-inner shadow-slate-100/80">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<ChartOfAccounts />} />
            <Route path="/journal-entries" element={<JournalEntries />} />
            <Route path="/journal-entries/new" element={<NewJournalEntry />} />
            <Route path="/journal-entries/:id" element={<JournalEntryDetail />} />
            <Route path="/reports/trial-balance" element={<TrialBalance />} />
            <Route path="/reports/ledger" element={<AccountLedger />} />
            <Route path="/reports/general-ledger" element={<AccountLedger />} />
            <Route path="/reports/profit-loss" element={<ProfitLoss />} />
            <Route path="/reports/balance-sheet" element={<BalanceSheet />} />
            <Route path="/reports/reconciliation" element={<BankReconciliation />} />
            <Route path="/reports/customer-ledger" element={<CustomerLedger />} />
            <Route path="/reports/branch-wise" element={<BranchWise />} />
            {/* <Route path="/simulate" element={<SimulateEvents />} /> */}
            <Route path="/loan-workflow" element={<LoanWorkflow />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}