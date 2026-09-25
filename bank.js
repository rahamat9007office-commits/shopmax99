/* =========================================================
   SHOPMAX99 - COMPANY BANK ACCOUNT / TRANSACTION LEDGER
   Frontend data-layer boundary. Replace persistence/API methods
   with backend calls later without changing the Admin UI contract.
   ========================================================= */
(function () {
  "use strict";
  const KEY = "shopmax99_company_bank_account";
  const TX_KEY = "shopmax99_transactions";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = v => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  const read = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const defaultAccount = () => ({ id: "BANK-CURRENT-001", accountType: "current", status: "active", accountHolderName: "", bankName: "", accountNumber: "", ifsc: "", branch: "", upiId: "", currency: "INR", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  const getAccount = () => ({ ...defaultAccount(), ...(read(KEY, {}) || {}) });
  const saveAccount = account => write(KEY, { ...getAccount(), ...account, updatedAt: new Date().toISOString() });
  const mask = value => { const s = String(value || ""); return s.length <= 4 ? s : "•••• •••• " + s.slice(-4); };
  const money = value => "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  function renderBankAccount() {
    const box = document.querySelector('[data-admin-section="bank-account"]');
    if (!box) return;
    const account = getAccount();
    let transactions = Array.isArray(read(TX_KEY, [])) ? read(TX_KEY, []) : [];
    let migrated = false;
    transactions = transactions.map(tx => {
      if (!tx.bankAccountId) { migrated = true; return { ...tx, bankAccountId: account.id }; }
      return tx;
    });
    if (migrated) write(TX_KEY, transactions);
    const linked = transactions.filter(tx => String(tx.bankAccountId || "") === String(account.id));
    const credits = linked.filter(tx => String(tx.type).toLowerCase() === "credit").reduce((s, tx) => s + Number(tx.amount || 0), 0);
    const debits = linked.filter(tx => String(tx.type).toLowerCase() === "debit").reduce((s, tx) => s + Number(tx.amount || 0), 0);
    box.innerHTML = `
      <div class="bank-account-page">
        <div class="bank-account-hero">
          <div><span class="seller-kicker">FINANCE CONTROL</span><h1>Company Bank Account</h1><p>One active company current account is the transaction ledger anchor for ShopMax99.</p></div>
          <span class="bank-account-status ${account.status === "active" ? "active" : "inactive"}">${esc(account.status || "active")}</span>
        </div>
        <div class="bank-account-metrics">
          <article><span>Linked Account</span><strong>${esc(account.id)}</strong><small>${esc(account.bankName || "Bank not configured")}</small></article>
          <article><span>Ledger Credits</span><strong>${money(credits)}</strong><small>${linked.filter(tx => String(tx.type).toLowerCase() === "credit").length} transaction(s)</small></article>
          <article><span>Ledger Debits</span><strong>${money(debits)}</strong><small>${linked.filter(tx => String(tx.type).toLowerCase() === "debit").length} transaction(s)</small></article>
          <article><span>Ledger Balance</span><strong>${money(credits - debits)}</strong><small>Prototype ledger balance</small></article>
        </div>
        <div class="bank-account-grid">
          <form id="companyBankAccountForm" class="bank-account-card">
            <div class="bank-card-heading"><div><span class="seller-kicker">ACTIVE CURRENT ACCOUNT</span><h2>Account Configuration</h2></div><span class="bank-linked-pill"><i class="fa-solid fa-link"></i> Transaction Linked</span></div>
            <label>Account Holder Name<input name="accountHolderName" required value="${esc(account.accountHolderName)}" placeholder="ShopMax99 Private / Proprietor name"></label>
            <label>Bank Name<input name="bankName" required value="${esc(account.bankName)}" placeholder="Bank name"></label>
            <label>Account Number<input name="accountNumber" required inputmode="numeric" value="${esc(account.accountNumber)}" placeholder="Company current account number"></label>
            <label>IFSC<input name="ifsc" required value="${esc(account.ifsc)}" placeholder="IFSC code"></label>
            <label>Branch<input name="branch" value="${esc(account.branch)}" placeholder="Branch"></label>
            <label>UPI ID (optional)<input name="upiId" value="${esc(account.upiId)}" placeholder="company@bank"></label>
            <div class="bank-account-preview"><span>Stored account</span><strong>${esc(mask(account.accountNumber))}</strong><small>${esc(account.bankName || "Not configured")} · ${esc(account.ifsc || "IFSC pending")}</small></div>
            <button type="submit" class="primary-btn">Save & Set as Active Company Account</button>
          </form>
          <aside class="bank-account-card bank-account-rules">
            <div class="bank-card-heading"><div><span class="seller-kicker">TRANSACTION ROUTING</span><h2>How this account is used</h2></div></div>
            <ul><li>Customer order credits are linked to this account ID.</li><li>Seller, staff and courier payouts are recorded as debit transactions against this account.</li><li>Every transaction stores the bank account ID so the backend can map it to a real bank ledger later.</li><li>Changing the account updates the active ledger anchor; historical transactions retain their original account ID.</li></ul>
            <div class="bank-security-note"><i class="fa-solid fa-shield-halved"></i><span><strong>Security boundary</strong> Real banking credentials, payment processing and fund movement must be performed server-side through a regulated bank/payment integration. This browser prototype stores only configuration metadata.</span></div>
          </aside>
        </div>
        <div class="bank-account-card bank-ledger-card"><div class="bank-card-heading"><div><span class="seller-kicker">LINKED LEDGER</span><h2>Recent Transactions</h2></div><span>${linked.length} linked</span></div><div class="support-table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Party</th><th>Reference</th><th>Amount</th><th>Bank Account</th></tr></thead><tbody>${linked.slice().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,50).map(tx=>`<tr><td>${esc(tx.createdAt ? new Date(tx.createdAt).toLocaleString("en-IN") : "-")}</td><td>${esc(tx.type || "-")}</td><td>${esc(tx.partyName || tx.sellerEmail || "-")}</td><td>${esc(tx.reference || tx.id || "-")}</td><td>${money(tx.amount)}</td><td>${esc(tx.bankAccountId || account.id)}</td></tr>`).join("") || `<tr><td colspan="6" class="bank-empty-cell">No linked transactions yet.</td></tr>`}</tbody></table></div></div>
      </div>`;
    const form = $("#companyBankAccountForm");
    if (form) form.addEventListener("submit", event => {
      event.preventDefault();
      if (read("shopmax99_admin_session", null)?.role !== "admin") return;
      const data = new FormData(form);
      saveAccount({ accountHolderName: String(data.get("accountHolderName") || "").trim(), bankName: String(data.get("bankName") || "").trim(), accountNumber: String(data.get("accountNumber") || "").trim(), ifsc: String(data.get("ifsc") || "").trim().toUpperCase(), branch: String(data.get("branch") || "").trim(), upiId: String(data.get("upiId") || "").trim(), status: "active" });
      renderBankAccount();
      window.ShopMax99?.showToast?.("Company current account saved and set as active ledger account.");
    });
  }

  function getActiveBankAccount() { return getAccount(); }
  window.ShopMax99 = window.ShopMax99 || {};
  window.ShopMax99.bank = { getActiveAccount: getActiveBankAccount, render: renderBankAccount };
  window.renderAdminBankAccount = renderBankAccount;
})();
