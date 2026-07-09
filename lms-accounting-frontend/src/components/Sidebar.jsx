import { NavLink } from "react-router-dom";

const LINKS = [
  { group: "Overview", items: [{ to: "/", label: "Dashboard", idx: "00" }] },
  {
    group: "Books",
    items: [
      { to: "/accounts", label: "Chart of Accounts", idx: "01" },
      { to: "/journal-entries", label: "Journal Entries", idx: "02" },
      { to: "/journal-entries/new", label: "New Journal Voucher", idx: "03" },
    ],
  },
  {
    group: "Reports",
    items: [
      { to: "/reports/trial-balance", label: "Trial Balance", idx: "04" },
      { to: "/reports/ledger", label: "General Ledger", idx: "05" },
      { to: "/reports/profit-loss", label: "Profit & Loss", idx: "06" },
      { to: "/reports/balance-sheet", label: "Balance Sheet", idx: "07" },
      { to: "/reports/reconciliation", label: "Bank Reconciliation", idx: "08" },
      { to: "/reports/customer-ledger", label: "Customer Ledger", idx: "09" },
      { to: "/reports/branch-wise", label: "Branch-wise Summary", idx: "10" },
    ],
  },
  {
    group: "Loan Lifecycle",
    items: [
      { to: "/loan-workflow", label: "Full Lifecycle Workflow", idx: "10" },
    ],
  },
  {
    group: "LMS Event Simulator",
    items: [{ to: "/simulate", label: "Raw Posting Triggers", idx: "11" }],
  },
];

const baseLinkClass = "group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium text-slate-700 ";
const activeLinkClass = "bg-gray-300 text-white shadow-sm";

export default function Sidebar() {
  return (
    <aside className="space-y-8 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <div className="text-2xl font-semibold tracking-tight text-slate-900">
          Ledger
        </div>
        <div className="text-sm text-slate-500">Accounting </div>
      </div>

      <div className="space-y-8">
        {LINKS.map((group) => (
          <div key={group.group}>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {group.group}
            </div>
            <div className="space-y-2">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `${baseLinkClass} ${isActive ? activeLinkClass : "bg-slate-50"}`
                  }
                >
                  {/* <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-700">
                    {item.idx}
                  </span> */}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
