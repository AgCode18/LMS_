const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, { method = "GET", body, params } = {}) {
  const url = new URL(BASE_URL + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.details = data?.details;
    throw err;
  }
  return data;
}

/** Downloads a report export (xlsx/pdf) by triggering a browser save,
 * rather than trying to parse the response as JSON. */
async function downloadFile(path, params, fallbackFilename) {
  const url = new URL(BASE_URL + path, window.location.origin);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Export failed (${res.status})`);
  }

  const disposition = res.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="(.+)"/);
  const filename = match ? match[1] : fallbackFilename;

  const blob = await res.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export const api = {
  // Accounts / COA
  getAccountTree: () => request("/accounts/tree"),
  getAccounts: (params) => request("/accounts", { params }),
  getNextAccountCode: (type) =>
    request("/accounts/next-code", { params: { type } }),
  createAccount: (body) => request("/accounts", { method: "POST", body }),
  updateAccount: (id, body) =>
    request(`/accounts/${id}`, { method: "PATCH", body }),

  // Journal entries
  getJournalEntries: (params) => request("/journal-entries", { params }),
  getJournalEntry: (id) => request(`/journal-entries/${id}`),
  createJournalEntry: (body) =>
    request("/journal-entries", { method: "POST", body }),
  postJournalEntry: (id) =>
    request(`/journal-entries/${id}/post`, { method: "POST" }),
  cancelJournalEntry: (id) =>
    request(`/journal-entries/${id}/cancel`, { method: "POST" }),

  // Auto-posting triggers (simulate LMS events)
  postLoanDisbursement: (body) =>
    request("/accounting/loan-disbursement", { method: "POST", body }),
  postEmiCollection: (body) =>
    request("/accounting/emi-collection", { method: "POST", body }),
  postPenaltyCollection: (body) =>
    request("/accounting/penalty-collection", { method: "POST", body }),
  postProcessingFee: (body) =>
    request("/accounting/processing-fee", { method: "POST", body }),
  postRefund: (body) => request("/accounting/refund", { method: "POST", body }),
  postWriteOff: (body) =>
    request("/accounting/write-off", { method: "POST", body }),
  postRecoveryPayment: (body) =>
    request("/accounting/recovery-payment", { method: "POST", body }),

  // Loan lifecycle — real business-logic endpoints (creates the LMS record
  // AND posts the accounting entry, in one call)
  checkDisbursementEligibility: (loanApplicationId) =>
    request(`/loans/${loanApplicationId}/disbursement-eligibility`),
  disburseLoan: (loanApplicationId, body) =>
    request(`/loans/${loanApplicationId}/disburse`, { method: "POST", body }),
  collectEmiReal: (emiScheduleId, body) =>
    request(`/loans/emi/${emiScheduleId}/collect`, { method: "POST", body }),
  collectPenaltyReal: (loanApplicationId, body) =>
    request(`/loans/${loanApplicationId}/penalty`, { method: "POST", body }),
  chargeProcessingFeeReal: (loanApplicationId, body) =>
    request(`/loans/${loanApplicationId}/processing-fee`, {
      method: "POST",
      body,
    }),
  refundReal: (body) => request("/loans/refund", { method: "POST", body }),
  writeOffReal: (loanApplicationId, body) =>
    request(`/loans/${loanApplicationId}/write-off`, { method: "POST", body }),
  recoveryPaymentReal: (loanRecoveryId, body) =>
    request(`/loans/recovery/${loanRecoveryId}/payment`, {
      method: "POST",
      body,
    }),

  // Reports
  getTrialBalance: (params) => request("/reports/trial-balance", { params }),
  getAccountLedger: (accountId, params) =>
    request(`/reports/ledger/${accountId}`, { params }),
  getProfitAndLoss: (params) => request("/reports/profit-loss", { params }),
  getBalanceSheet: (params) => request("/reports/balance-sheet", { params }),
  getCustomerLedger: (customerId) =>
    request(`/reports/customer-ledger/${customerId}`),
  getBranchWise: (params) => request("/reports/branch-wise", { params }),
  getBranches: () => request("/branches"),
  createBranch: (body) => request("/branches", { method: "POST", body }),
  getBankReconciliation: (accountId, params) =>
    request("/reports/reconciliation", { params: { accountId, ...params } }),
  exportBankReconciliation: (accountId, format, params) =>
    downloadFile(
      "/reports/reconciliation/export",
      { accountId, format, ...params },
      `bank-reconciliation.${format}`,
    ),

  // Report exports (xlsx / pdf)
  exportTrialBalance: (format, params) =>
    downloadFile(
      "/reports/trial-balance/export",
      { ...params, format },
      `trial-balance.${format}`,
    ),
  exportProfitAndLoss: (format, params) =>
    downloadFile(
      "/reports/profit-loss/export",
      { ...params, format },
      `profit-and-loss.${format}`,
    ),
  exportBalanceSheet: (format, params) =>
    downloadFile(
      "/reports/balance-sheet/export",
      { ...params, format },
      `balance-sheet.${format}`,
    ),
  exportAccountLedger: (accountId, format, params) =>
    downloadFile(
      `/reports/ledger/${accountId}/export`,
      { ...params, format },
      `account-ledger.${format}`,
    ),
  exportJournalEntries: (format, params) =>
    downloadFile(
      "/journal-entries/export",
      { ...params, format },
      `journal-entries.${format}`,
    ),
};
