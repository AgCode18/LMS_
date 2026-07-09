#  LMS — Accounting Engine

This is the **Accounting Engine module** for the AZZUNIQUE Loan Management System —
the part described in `Accounting_Structure_for_Loan_Management_Software.pdf`. It is
built as two projects:

```
lms-accounting-backend/    Node.js + Express + Prisma API
lms-accounting-frontend/   React + Vite console (Chart of Accounts, journals, reports)
```

It does **not** rebuild leads, KYC, partners, disbursement workflow, recovery, etc. —
you already have those. This module gives you the pieces the PDF asked for:

1. **Chart of Accounts** (COA) — master ledger accounts
2. **Journal Entry engine** — the `createJournal(...)` function from the PDF, as a
   real, transaction-safe service
3. **Auto-posting rules** for the 7 LMS events: loan disbursement, EMI collection,
   penalty collection, processing fee, refund, write-off, and recovery payment
4. **Reports**: Trial Balance, Account/General Ledger, Customer Ledger, Profit & Loss,
   Balance Sheet, Branch-wise summary

---

## How the pieces fit together

```
Your existing LMS controllers                 This module
──────────────────────────────                ─────────────────────────────
LoanDisbursement created  ──────trigger──────▶ autoPostingService.postLoanDisbursement()
EmiPayment recorded       ──────trigger──────▶ autoPostingService.postEmiCollection()
foreClosure settled       ──────trigger──────▶ autoPostingService.postWriteOff() / refund
RecoveryPayment recorded  ──────trigger──────▶ autoPostingService.postRecoveryPayment()
                                                        │
                                                        ▼
                                          journalService.createJournal()
                                     (validates debit=credit, generates voucher
                                      number, writes JournalEntry + lines,
                                      updates Account.currentBalance — all in
                                      one DB transaction)
                                                        │
                                                        ▼
                                          reportService (Trial Balance, P&L,
                                          Balance Sheet, Ledgers) reads it back
```

Every accounting event, whether fired automatically or entered by hand, ends up as
rows in `JournalEntry` + `JournalEntryLine`. The reports never store their own
numbers — they're always computed live from posted journal lines, so the books
can't drift out of sync with the ledger.

---

## 1. Backend — `lms-accounting-backend`

### Stack
Node.js, Express, Prisma (MySQL).

### Schema note — READ THIS FIRST
`prisma/schema.prisma` in this folder is a **trimmed copy** of your real schema. It
keeps every model the accounting engine touches (`Account`, `JournalEntry`,
`JournalEntryLine`, `VoucherCounter`) plus lightweight versions of the models it
hooks into (`LoanApplication`, `EmiPayment`, `LoanDisbursement`, `LoanRecovery`,
`RecoveryPayment`, `foreClosure`, `Customer`, `Branch`, `Kyc`, `Sanction`,
`NachMandate`) so this project runs standalone against a fresh database.

**To integrate into your real backend:**
- Delete this `prisma/schema.prisma` — you already have the full one.
- Copy the `src/` folder (services, controllers, routes, middleware, lib, utils) into
  your existing backend.
- Every field/model this code touches (`Account.systemKey`, `JournalEntry.referenceType`,
  `EmiPayment.accountingStatus`, etc.) already exists in the schema you shared with
  matching names and types — nothing needs renaming.

### Setup
```bash
cd lms-accounting-backend
cp .env.example .env        # set DATABASE_URL to your MySQL instance
npm install
npx prisma generate
npx prisma migrate dev --name init   # only if using the trimmed standalone schema
npm run seed                 # = seed:coa + seed:demo, see below
npm run dev                  # starts on http://localhost:4000
```

### Seeding — production vs. development
The seed step is split into two independent scripts:

| Script | What it does | Run in production? |
|---|---|---|
| `npm run seed:coa` | Creates the Chart of Accounts (Bank Account, Loan Receivable, Interest Income, etc.) | **Yes.** Not test data — the accounting engine can't post anything until these accounts exist. Safe to re-run any time; it upserts by account code and never duplicates or wipes balances. |

| `npm run seed:demo` | Creates a demo branch/customer/loan/KYC/Sanction/NACH/EMI/recovery record so you have real ids to test against | **No — dev/testing only.** In production this data comes from your real leads/KYC/loan-application/NACH flows, not a script. |
| `npm run seed` | Runs both, in order | Dev convenience only |

So when you go live: run `npm run seed:coa` once per environment, and never run `seed:demo` against production.

> If you're merging `src/` into your existing project instead of running this schema
> standalone, skip `migrate` — just run `prisma generate` against your real schema and
> then `npm run seed` (adjust the import path in `prisma/seed.js` if your folder layout
> differs).

### Folder structure
```
src/
  lib/prisma.js               single PrismaClient instance
  utils/
    systemAccounts.js          systemKey constants (no hardcoded account ids anywhere)
    voucherNumber.js           JV-2026-000001 sequential numbering (VoucherCounter)
  services/
    accountService.js          Chart of Accounts CRUD, balance updates, debit/credit-normal logic
    journalService.js          createJournal() — the core double-entry engine
    autoPostingService.js      the 7 LMS event → journal mappings from the PDF
    reportService.js           Trial Balance, Ledger, P&L, Balance Sheet, Customer Ledger
  controllers/ + routes/       thin HTTP layer over the services above
  middleware/                  asyncHandler, centralized errorHandler
prisma/
  schema.prisma                 (see note above)
  seedCoa.js                     seeds the Chart of Accounts — safe for production
  seedDemo.js                    seeds a demo loan/customer/KYC/Sanction/NACH — dev/testing only
```

### API reference

**Chart of Accounts**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/accounts` | list (filter `?type=` `?status=` `?search=` — matches name or code; paginate with `?page=&pageSize=`, otherwise returns the full unpaginated list) |
| GET | `/api/accounts/tree` | parent → children tree |
| GET | `/api/accounts/next-code` | `?type=ASSET` → previews the next auto-generated code for that type (1xxx Asset, 2xxx Liability, 3xxx Equity, 4xxx Income, 5xxx Expense) |
| GET | `/api/accounts/:id` | one account |
| POST | `/api/accounts` | create `{ code?, name, type, systemKey?, parentAccountId?, openingBalance? }` — omit `code` to auto-generate it |
| PATCH | `/api/accounts/:id` | update name/status/description/parent |

**Journal entries**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/journal-entries` | list, filters: `referenceType`, `status`, `from`, `to`, `accountSearch` (matches any line's account name), `page`, `pageSize` |
| GET | `/api/journal-entries/:id` | one entry with lines |
| POST | `/api/journal-entries` | manual voucher: `{ narration, transactionDate, lines: [{accountId, debit, credit, description}], status }` |
| POST | `/api/journal-entries/:id/post` | post a DRAFT entry |
| POST | `/api/journal-entries/:id/cancel` | cancel (reverses balance impact if it was POSTED) |

**Auto-posting triggers** (lower-level — post a journal entry only, assuming the
LMS-side record already exists). Prefer the `/api/loans` endpoints below instead;
these stay here for when you already have your own controllers and just want the
accounting side.
| Method | Path | Body |
|---|---|---|
| POST | `/api/accounting/loan-disbursement` | `{ loanDisbursementId, loanApplicationId, amount, disbursementDate? }` |
| POST | `/api/accounting/emi-collection` | `{ emiPaymentId, loanApplicationId, principalAmount, interestAmount, penaltyAmount?, bounceAmount?, paymentDate? }` |
| POST | `/api/accounting/penalty-collection` | `{ referenceId, amount, collectionDate? }` |
| POST | `/api/accounting/processing-fee` | `{ loanApplicationId, amount, collectedImmediately?, feeDate? }` |
| POST | `/api/accounting/refund` | `{ referenceId, amount, refundDate?, reason? }` |
| POST | `/api/accounting/write-off` | `{ loanApplicationId, amount, writeOffDate? }` |
| POST | `/api/accounting/recovery-payment` | `{ recoveryPaymentId, loanApplicationId, amount, paymentDate? }` |

### Loan lifecycle endpoints — the real business-logic controllers
These are the actual event controllers (`src/services/loanLifecycleService.js` +
`src/controllers/loanLifecycleController.js`), each of which creates its own
LMS-side record (LoanDisbursement, EmiPayment, RecoveryPayment, etc.) **and then
calls the accounting engine in-process** — no HTTP hop, no manual step. This is
what "automatic" means in practice: hit these endpoints (or call the service
functions from your own code) and the journal entry is created for you.

| Method | Path | What it does |
|---|---|---|
| GET | `/api/loans/:id/disbursement-eligibility` | Returns `{ eligible, reasons[] }` — checks KYC=VERIFIED, latest Sanction=APPROVED, latest NACH=ACTIVE, and that it isn't already disbursed |
| POST | `/api/loans/:id/disburse` | Re-runs the eligibility check (rejects with `422` + `reasons` if it fails), creates `LoanDisbursement`, sets `LoanApplication.status = ACTIVE`, then posts the journal entry. Body: `{ disbursementMode, bankName, bankAccountNumber, ifscCode, accountHolderName, transactionReference?, processedBy? }` |
| POST | `/api/loans/emi/:emiScheduleId/collect` | Creates `EmiPayment`, marks the EMI schedule `paid`, posts the journal entry. Body: `{ principalAmount, interestAmount, penaltyAmount?, bounceAmount?, paymentMode, transactionReference?, processedById?, branchId? }` |
| POST | `/api/loans/:id/penalty` | Posts a standalone penalty collection. Body: `{ amount }` |
| POST | `/api/loans/:id/processing-fee` | Records the fee on the loan application, posts the journal entry. Body: `{ amount, collectedImmediately? }` |
| POST | `/api/loans/refund` | Posts a refund reversal. Body: `{ referenceId, amount, reason? }` |
| POST | `/api/loans/:id/write-off` | Sets `LoanApplication.status = WRITTEN_OFF`, posts the journal entry. Body: `{ amount }` |
| POST | `/api/loans/recovery/:loanRecoveryId/payment` | Creates `RecoveryPayment`, updates `LoanRecovery.recoveredAmount`/`balanceAmount`, posts the journal entry. Body: `{ amount, paymentMode, referenceNo? }` |

**Why disbursement has an eligibility gate and the others don't:** disbursement is
the one event where releasing money without checking KYC/Sanction/NACH first is a
real compliance risk, so it's enforced in code, not just left to the caller to
remember. The other 6 events assume their precondition already happened upstream
(an EMI is due, a recovery case exists, a write-off was already approved) — add
your own guards there if you want the same pattern, following `checkDisbursementEligibility`
in `loanLifecycleService.js` as the template.

**Reports**
| Method | Path |
|---|---|
| GET | `/api/reports/trial-balance?asOf=` |
| GET | `/api/reports/trial-balance/export?format=xlsx\|pdf&asOf=` |
| GET | `/api/reports/ledger/:accountId?from=&to=` |
| GET | `/api/reports/ledger/:accountId/export?format=xlsx\|pdf&from=&to=` |
| GET | `/api/reports/profit-loss?from=&to=` |
| GET | `/api/reports/profit-loss/export?format=xlsx\|pdf&from=&to=` |
| GET | `/api/reports/balance-sheet?asOf=` |
| GET | `/api/reports/balance-sheet/export?format=xlsx\|pdf&asOf=` |
| GET | `/api/reports/customer-ledger/:customerId` |
| GET | `/api/reports/branch-wise?from=&to=` |
| GET | `/api/journal-entries/export?format=xlsx\|pdf&referenceType=&status=&accountSearch=` |

Export endpoints stream a `.xlsx` (via `exceljs`) or `.pdf` (via `pdfkit`) file back
with a proper `Content-Disposition` header, so a browser or `curl -OJ` saves it
directly — nothing is written to disk on the server.

### Wiring into your real LMS
Once `src/` is merged into your existing backend, call the service functions
directly instead of going over HTTP — it's the same logic, one less network hop:

```js
const { postLoanDisbursement } = require('./services/autoPostingService');

// inside your existing disbursement controller, right after you create
// the LoanDisbursement row:
await postLoanDisbursement({
  loanDisbursementId: disbursement.id,
  loanApplicationId: disbursement.loanApplicationId,
  amount: disbursement.amount,
  disbursementDate: disbursement.disbursementDate,
});
```

Do the same for `postEmiCollection` after an `EmiPayment` is recorded,
`postWriteOff` when a loan is marked `WRITTEN_OFF`, `postRecoveryPayment` after a
`RecoveryPayment`, etc.

### The Chart of Accounts (from the PDF's sample table)
| Code | Name | Type | systemKey |
|---|---|---|---|
| 1001 | Bank Account | ASSET | `BANK_ACCOUNT` |
| 1002 | Cash Account | ASSET | `CASH_ACCOUNT` |
| 1100 | Loan Receivable | ASSET | `LOAN_RECEIVABLE` |
| 1101 | Customer Receivable | ASSET | `CUSTOMER_RECEIVABLE` |
| 2001 | Security Deposit | LIABILITY | `SECURITY_DEPOSIT` |
| 3001 | Capital Account | EQUITY | `CAPITAL_ACCOUNT` |
| 4001 | Interest Income | INCOME | `INTEREST_INCOME` |
| 4002 | Processing Fee Income | INCOME | `PROCESSING_FEE_INCOME` |
| 4003 | Penalty Income | INCOME | `PENALTY_INCOME` |
| 4004 | Bounce Charge Income | INCOME | `BOUNCE_CHARGE_INCOME` |
| 5001 | Salary Expense | EXPENSE | `SALARY_EXPENSE` |
| 5002 | Bad Debt Expense | EXPENSE | `BAD_DEBT_EXPENSE` |

Code never hardcodes an account id — every auto-posting rule looks accounts up by
`systemKey` (see `src/utils/systemAccounts.js`), matching the schema's own comment
("it will not hardcode account codes"). Add more accounts any time from the Chart
of Accounts screen; only the system-critical ones need a `systemKey`.

---

## 2. Frontend — `lms-accounting-frontend`

### Stack
React + Vite, Tailwind CSS v4 (via `@tailwindcss/vite`) for new components,
layered on top of the original hand-rolled ledger design system (CSS custom
properties in `src/index.css`) — Tailwind's reset doesn't fight the existing
styles because the custom rules are unlayered and win the cascade regardless of
import order. `react-router-dom` for routing.

### Setup
```bash
cd lms-accounting-frontend
npm install
echo "VITE_API_URL=http://localhost:4000/api" > .env
npm run dev      # http://localhost:5173
```

### Design
A ledger/paper aesthetic on purpose, not a generic admin-dashboard template:
warm paper background with faint ruled lines, a serif display face (Fraunces) for
headings, monospace (IBM Plex Mono) for every number/code/voucher id so columns
align like a real ledger, and a rotated ink-stamp style badge for POSTED/DRAFT/CANCELLED.
Debit amounts are always shown in a muted red, credit amounts in a muted teal —
the traditional two-column ledger convention.

### Pages
| Route | Purpose |
|---|---|
| `/` | Dashboard — asset/liability/income/expense totals, recent vouchers |
| `/accounts` | Chart of Accounts tree, **search by name/code with pagination**, create new account with **auto-generated code** (editable) |
| `/journal-entries` | All vouchers — filter by reference type / status, **search by account name**, **paginated** |
| `/journal-entries/new` | Manual journal voucher builder (multi-line, must balance to post) |
| `/journal-entries/:id` | Voucher detail — post a DRAFT, or cancel |
| `/reports/trial-balance` | Trial balance as of any date, **download as XLSX/PDF** |
| `/reports/ledger` | Pick an account (or use the **Bank/Loan/Interest Income quick-access shortcuts**), see its running-balance ledger, **download as XLSX/PDF** |
| `/reports/profit-loss` | Income vs expense for a date range, **download as XLSX/PDF** |
| `/reports/balance-sheet` | Assets vs Liabilities + Equity, with balance check, **download as XLSX/PDF** |
| `/reports/customer-ledger` | Paste a customer id, see every posted journal entry traced back to their loans |
| `/reports/branch-wise` | Posted disbursement totals and application counts, grouped by branch |
| `/loan-workflow` | **Full Lifecycle Workflow** — all 7 real, gated actions in one place: eligibility check, disburse, collect EMI, charge processing fee, collect penalty, write off, record recovery payment, issue refund |
| `/simulate` | Raw Posting Triggers — fires each of the 7 auto-posting events directly for quick testing, bypassing the LMS-record creation and eligibility checks |

All API calls live in `src/api/client.js` — one place to change if your real
backend's base URL or auth headers differ.

---

## Troubleshooting: frontend shows no data
Check these in order:
1. Is the backend actually running? Open `http://localhost:4000/api/health` directly — you should see `{"status":"ok"}`.
2. Does `lms-accounting-frontend/.env` contain `VITE_API_URL=http://localhost:4000/api`? Without it, requests silently go to the wrong place.
3. Is `DATABASE_URL` in the backend's `.env` pointing at a real, reachable database (not the `.env.example` placeholder)?
4. Did `npx prisma migrate dev` run successfully before seeding? `seed:coa`/`seed:demo` only insert rows — they don't create tables.
5. Did `npm run seed` print the ✓ checkmarks and "Demo data ready" message, or did it error out partway? An error there means nothing was written.
6. Browser dev tools (F12) → Network tab, while on the Dashboard — a failed/red request will show you the real error (CORS, 404, connection refused, etc.).

## 3. Quick end-to-end test

```bash
# terminal 1
cd lms-accounting-backend && npm install && npx prisma generate && npx prisma migrate dev --name init && npm run seed && npm run dev

# terminal 2
cd lms-accounting-frontend && npm install && npm run dev
```

`npm run seed` prints a demo loan that already has KYC verified, Sanction approved,
and NACH active — so it will pass the eligibility check. Try the real workflow:

```bash
# check eligibility
curl http://localhost:4000/api/loans/<loanApplicationId>/disbursement-eligibility

# disburse — this creates LoanDisbursement AND posts the journal entry automatically
curl -X POST http://localhost:4000/api/loans/<loanApplicationId>/disburse \
  -H "Content-Type: application/json" \
  -d '{"disbursementMode":"NEFT","bankName":"HDFC","bankAccountNumber":"1234567890","ifscCode":"HDFC0001","accountHolderName":"Asha Verma"}'

# collect an EMI
curl -X POST http://localhost:4000/api/loans/emi/<emiScheduleId>/collect \
  -H "Content-Type: application/json" \
  -d '{"principalAmount":4000,"interestAmount":1000,"paymentMode":"UPI"}'
```

Or use the frontend's **Simulate Postings** page for the same thing with a form.
Then check **Trial Balance** — Bank Account and Loan Receivable should move, and
Total Debit should equal Total Credit.

---

## What this module deliberately does NOT include
Per your scope confirmation, this only covers the accounting engine from the PDF.
It does not touch leads, KYC, partner onboarding, NACH, technical/legal reports, or
the loan application workflow UI — your existing system already has those. The one
new thing to do on your side is add the 5–6 trigger calls listed above into your
existing controllers at the right lifecycle points.
