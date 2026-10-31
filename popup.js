/**
 * AI Search & Earn - Popup Controller
 * Manages dashboard state, payout unlocking at $10.00, withdrawal requests, and demo tools.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const MIN_WITHDRAWAL = 10.00;
  let currentBalance = 0.0000;

  // DOM Elements
  const balanceDisplay = document.getElementById("balance-display");
  const searchCountDisplay = document.getElementById("search-count-display");
  const lifetimeDisplay = document.getElementById("lifetime-display");
  const progressPercent = document.getElementById("progress-percent");
  const progressRemaining = document.getElementById("progress-remaining");
  const progressFill = document.getElementById("progress-fill");
  const btnWithdraw = document.getElementById("btn-withdraw");
  const withdrawIcon = document.getElementById("withdraw-icon");
  const withdrawBtnText = document.getElementById("withdraw-btn-text");

  const recentSearchesList = document.getElementById("recent-searches-list");
  const withdrawalsList = document.getElementById("withdrawals-list");
  const payoutCount = document.getElementById("payout-count");

  const btnOpenPortal = document.getElementById("btn-open-portal");

  // Modal elements
  const withdrawModal = document.getElementById("withdraw-modal");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const modalAvailableBalance = document.getElementById("modal-available-balance");
  const payoutMethod = document.getElementById("payout-method");
  const accountLabel = document.getElementById("account-label");
  const payoutAccount = document.getElementById("payout-account");
  const payoutAmount = document.getElementById("payout-amount");
  const modalFeedback = document.getElementById("modal-feedback");
  const btnSubmitWithdrawal = document.getElementById("btn-submit-withdrawal");

  // Demo buttons
  const btnAdd5 = document.getElementById("btn-add-5");
  const btnAdd10 = document.getElementById("btn-add-10");
  const btnSimSearch = document.getElementById("btn-sim-search");
  const btnResetData = document.getElementById("btn-reset-data");

  // Tabs
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add("active");
    });
  });

  // Open Advertiser Portal
  btnOpenPortal.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("advertiser_portal.html") });
  });

  /**
   * Loads user data and updates UI
   */
  async function refreshData() {
    try {
      const response = await chrome.runtime.sendMessage({ action: "GET_USER_DATA" });
      if (!response || !response.success) return;

      currentBalance = response.balance || 0.0000;
      const searchCount = response.searchCount || 0;
      const lifetimeEarnings = response.lifetimeEarnings || 0.0000;
      const withdrawals = response.withdrawals || [];
      const recentSearches = response.recentSearches || [];

      // Update Header Stats
      balanceDisplay.innerText = `$${currentBalance.toFixed(4)}`;
      searchCountDisplay.innerText = searchCount.toLocaleString();
      lifetimeDisplay.innerText = `$${lifetimeEarnings.toFixed(4)}`;

      // Update Progress
      const percentage = Math.min(100, (currentBalance / MIN_WITHDRAWAL) * 100);
      progressFill.style.width = `${percentage}%`;
      progressPercent.innerText = `${percentage.toFixed(1)}% of $${MIN_WITHDRAWAL.toFixed(2)} goal`;

      const remaining = Math.max(0, MIN_WITHDRAWAL - currentBalance);
      if (remaining > 0) {
        progressRemaining.innerText = `$${remaining.toFixed(4)} remaining`;
      } else {
        progressRemaining.innerText = `Goal Reached! 🎉`;
      }

      // Update Withdraw Button Status
      if (currentBalance >= MIN_WITHDRAWAL) {
        btnWithdraw.disabled = false;
        btnWithdraw.classList.remove("disabled");
        btnWithdraw.classList.add("unlocked");
        withdrawIcon.innerText = "🔓";
        withdrawBtnText.innerText = `Withdraw Funds ($${currentBalance.toFixed(2)})`;
      } else {
        btnWithdraw.disabled = true;
        btnWithdraw.classList.remove("unlocked");
        btnWithdraw.classList.add("disabled");
        withdrawIcon.innerText = "🔒";
        withdrawBtnText.innerText = `Locked ($10.00 Minimum)`;
      }

      // Render Recent Activity
      renderRecentSearches(recentSearches);

      // Render Withdrawals
      payoutCount.innerText = withdrawals.length;
      renderWithdrawals(withdrawals);

    } catch (err) {
      console.error("Failed to load user data:", err);
    }
  }

  function renderRecentSearches(searches) {
    if (!searches || searches.length === 0) {
      recentSearchesList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <p>No searches recorded yet.</p>
          <small>Ask something on ChatGPT or Gemini to earn $0.0003!</small>
        </div>
      `;
      return;
    }

    recentSearchesList.innerHTML = searches.map(item => {
      const timeStr = formatTime(item.timestamp);
      const icon = item.platform === "gemini" ? "✨" : "🤖";
      const sponsorText = item.adShown ? ` • Sponsored by ${item.adShown}` : "";
      return `
        <div class="activity-item">
          <div class="activity-info">
            <span class="activity-query">${icon} "${escapeHtml(item.query)}"</span>
            <span class="activity-meta">${timeStr}${sponsorText}</span>
          </div>
          <span class="activity-reward">+0.0003$</span>
        </div>
      `;
    }).join("");
  }

  function renderWithdrawals(withdrawals) {
    if (!withdrawals || withdrawals.length === 0) {
      withdrawalsList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">💳</span>
          <p>No withdrawals requested yet.</p>
          <small>Reach $10.00 to request your first payout.</small>
        </div>
      `;
      return;
    }

    withdrawalsList.innerHTML = withdrawals.map(tx => {
      const dateStr = formatTime(tx.requestedAt);
      return `
        <div class="payout-item">
          <div class="payout-info">
            <span class="payout-amount">$${tx.amount.toFixed(2)} USD</span>
            <span class="payout-meta">${tx.method} • ${escapeHtml(tx.accountDetails)}</span>
            <span class="payout-meta">${dateStr}</span>
          </div>
          <span class="payout-badge">${tx.status || "Processing"}</span>
        </div>
      `;
    }).join("");
  }

  // Handle Dynamic Account Label in Modal
  payoutMethod.addEventListener("change", () => {
    const val = payoutMethod.value;
    if (val === "PayPal") {
      accountLabel.innerText = "PayPal Email Address";
      payoutAccount.placeholder = "user@example.com";
    } else if (val.includes("USDT")) {
      accountLabel.innerText = `${val} Wallet Address`;
      payoutAccount.placeholder = "0x... or T...";
    } else if (val === "Bank Transfer") {
      accountLabel.innerText = "IBAN / Account Number & Routing";
      payoutAccount.placeholder = "Account Number, Routing / SWIFT";
    } else {
      accountLabel.innerText = "UPI ID / Stripe Email";
      payoutAccount.placeholder = "user@upi or user@stripe.com";
    }
  });

  // Modal open/close
  btnWithdraw.addEventListener("click", () => {
    if (currentBalance < MIN_WITHDRAWAL) return;
    modalAvailableBalance.innerText = `$${currentBalance.toFixed(4)}`;
    payoutAmount.value = currentBalance.toFixed(2);
    payoutAmount.max = currentBalance.toFixed(2);
    modalFeedback.className = "form-feedback hidden";
    withdrawModal.classList.remove("hidden");
  });

  btnCloseModal.addEventListener("click", () => {
    withdrawModal.classList.add("hidden");
  });

  // Handle Withdrawal Submission
  btnSubmitWithdrawal.addEventListener("click", async () => {
    const method = payoutMethod.value;
    const account = payoutAccount.value.trim();
    const amount = parseFloat(payoutAmount.value);

    if (!account) {
      showModalFeedback("Please enter your payout account details.", "error");
      return;
    }

    if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
      showModalFeedback(`Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}.`, "error");
      return;
    }

    if (amount > currentBalance) {
      showModalFeedback(`Amount exceeds your balance of $${currentBalance.toFixed(4)}.`, "error");
      return;
    }

    btnSubmitWithdrawal.disabled = true;
    btnSubmitWithdrawal.innerText = "Submitting Request...";

    try {
      const res = await chrome.runtime.sendMessage({
        action: "REQUEST_WITHDRAWAL",
        payload: {
          method,
          accountDetails: account,
          amount
        }
      });

      if (res && res.success) {
        showModalFeedback(`🎉 Withdrawal requested! Ref: ${res.withdrawal.id}. Funds will arrive in 24-48h.`, "success");
        setTimeout(() => {
          withdrawModal.classList.add("hidden");
          btnSubmitWithdrawal.disabled = false;
          btnSubmitWithdrawal.innerText = "Confirm & Withdraw";
          payoutAccount.value = "";
          refreshData();
        }, 2000);
      } else {
        showModalFeedback(res.error || "Failed to process withdrawal.", "error");
        btnSubmitWithdrawal.disabled = false;
        btnSubmitWithdrawal.innerText = "Confirm & Withdraw";
      }
    } catch (err) {
      showModalFeedback(err.message, "error");
      btnSubmitWithdrawal.disabled = false;
      btnSubmitWithdrawal.innerText = "Confirm & Withdraw";
    }
  });

  function showModalFeedback(msg, type) {
    modalFeedback.className = `form-feedback ${type}`;
    modalFeedback.innerText = msg;
  }

  // --- DEMO / TESTER TOOLS ---
  btnAdd5.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ action: "DEV_ADD_BALANCE", payload: { amount: 5.00 } });
    await refreshData();
  });

  btnAdd10.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ action: "DEV_ADD_BALANCE", payload: { amount: 10.00 } });
    await refreshData();
  });

  btnSimSearch.addEventListener("click", async () => {
    const samples = [
      { q: "Best python web framework in 2026", p: "chatgpt" },
      { q: "How to deploy docker containers to cloud", p: "gemini" },
      { q: "Prompt engineering tips for writing essays", p: "chatgpt" },
      { q: "Online security and privacy best practices", p: "gemini" }
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    await chrome.runtime.sendMessage({
      action: "RECORD_SEARCH",
      payload: { query: pick.q, platform: pick.p }
    });
    await refreshData();
  });

  btnResetData.addEventListener("click", async () => {
    if (confirm("Reset all earnings, searches, and withdrawals?")) {
      await chrome.runtime.sendMessage({ action: "DEV_RESET_DATA" });
      await refreshData();
    }
  });

  // Helpers
  function formatTime(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Initial Load & Poll for live updates while popup is open
  await refreshData();
});
