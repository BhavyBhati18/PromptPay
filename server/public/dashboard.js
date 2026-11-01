/**
 * User Dashboard Logic
 * Fetches user profile, real-time balance, prompts feed, and handles payouts.
 */

let currentUser = null;

async function checkAuthAndLoad() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();

    if (!data.authenticated || !data.user) {
      window.location.href = '/login.html';
      return;
    }

    currentUser = data.user;
    renderUser(currentUser);
    loadSearches();
    loadWithdrawals();
  } catch (err) {
    console.error('Failed to load user session:', err);
    window.location.href = '/login.html';
  }
}

function renderUser(user) {
  // Navigation display
  document.getElementById('user-display-name').textContent = user.name || 'User';
  document.getElementById('user-display-email').textContent = user.email || '';
  document.getElementById('welcome-title').textContent = `Welcome back, ${user.name || 'User'}!`;

  const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('avatar-initials').textContent = initials;

  // Stats Grid
  const balance = Number(user.balance || 0);
  const lifetime = Number(user.lifetime_earnings || user.balance || 0);
  const searches = Number(user.search_count || 0);

  document.getElementById('stat-balance').textContent = `$${balance.toFixed(4)}`;
  document.getElementById('stat-lifetime').textContent = `$${lifetime.toFixed(4)}`;
  document.getElementById('stat-searches').textContent = searches.toLocaleString();

  // Progress Bar for Withdrawal
  const threshold = 10.00;
  const percent = Math.min(100, Math.max(0, (balance / threshold) * 100));
  const fill = document.getElementById('progress-fill');
  fill.style.width = `${percent}%`;

  document.getElementById('progress-percent').textContent = `${percent.toFixed(1)}% reached`;

  const withdrawBtn = document.getElementById('open-withdraw-btn');
  const remainingEl = document.getElementById('progress-remaining');

  if (balance >= threshold) {
    withdrawBtn.disabled = false;
    remainingEl.textContent = 'Threshold unlocked! Ready to withdraw.';
    remainingEl.style.color = '#34d399';
    document.getElementById('withdraw-subtext').textContent = 'You have reached the $10.00 threshold! Click below to withdraw.';
  } else {
    withdrawBtn.disabled = true;
    const remaining = (threshold - balance).toFixed(4);
    remainingEl.textContent = `$${remaining} to threshold`;
    remainingEl.style.color = '#94a3b8';
  }

  // Profile Section
  document.getElementById('profile-uid').textContent = user.id;
  document.getElementById('profile-name').textContent = user.name;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-phone').textContent = user.phone || 'None linked';

  // Admin tabs check
  const adminAds = document.getElementById('dash-admin-ads');
  const adminDb = document.getElementById('dash-admin-db');
  if (user.email && user.email.toLowerCase() === 'bhavy4018.21@gmail.com') {
    if (adminAds) adminAds.style.display = 'inline-block';
    if (adminDb) adminDb.style.display = 'inline-block';
  }
  if (user.created_at) {
    const d = new Date(user.created_at);
    document.getElementById('profile-joined').textContent = d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

async function loadSearches() {
  try {
    const res = await fetch('/api/user/searches', { credentials: 'include' });
    const data = await res.json();

    const tbody = document.getElementById('searches-tbody');
    const badge = document.getElementById('search-count-badge');

    if (data.searches && data.searches.length > 0) {
      badge.textContent = `${data.searches.length} logged`;
      tbody.innerHTML = data.searches.map(s => {
        const platformClass = (s.platform || 'ai').toLowerCase().includes('gemini') ? 'gemini' : 'chatgpt';
        const dateStr = s.timestamp ? new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
        return `
          <tr>
            <td class="query-cell" title="${escapeHtml(s.query || '')}">${escapeHtml(s.query || 'Prompt')}</td>
            <td><span class="platform-pill ${platformClass}">${escapeHtml(s.platform || 'AI')}</span></td>
            <td class="reward-cell">+$$${(Number(s.reward) || 0.0003).toFixed(4)}</td>
            <td>${escapeHtml(s.ad_shown || 'Sponsored Link')}</td>
            <td>${dateStr}</td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.warn('Could not load searches:', err);
  }
}

async function loadWithdrawals() {
  try {
    const res = await fetch('/api/user/withdrawals', { credentials: 'include' });
    const data = await res.json();

    const tbody = document.getElementById('withdrawals-tbody');
    if (data.withdrawals && data.withdrawals.length > 0) {
      let totalPaid = 0;
      let completedCount = 0;

      tbody.innerHTML = data.withdrawals.map(w => {
        const amt = Number(w.amount) || 0;
        const status = (w.status || 'Processing').toLowerCase();
        if (status === 'completed' || status === 'approved') {
          totalPaid += amt;
          completedCount++;
        }
        const dateStr = w.requested_at ? new Date(w.requested_at).toLocaleDateString() : '-';
        return `
          <tr>
            <td style="font-weight: 700; color: #fff;">$$${amt.toFixed(2)}</td>
            <td>${escapeHtml(w.method || 'PayPal')}</td>
            <td><span class="status-badge ${status}">${escapeHtml(w.status || 'Processing')}</span></td>
            <td>${dateStr}</td>
          </tr>
        `;
      }).join('');

      document.getElementById('stat-withdrawn').textContent = `$$${totalPaid.toFixed(2)}`;
      document.getElementById('stat-payout-count').textContent = `${completedCount} completed payouts`;
    }
  } catch (err) {
    console.warn('Could not load withdrawals:', err);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// ── Modal Handling ──────────────────────────────────────────────────────────

const modal = document.getElementById('withdraw-modal');
const openModalBtn = document.getElementById('open-withdraw-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const withdrawForm = document.getElementById('withdraw-form');
const modalAlert = document.getElementById('modal-alert');
const methodSelect = document.getElementById('withdraw-method');
const accountLabel = document.getElementById('account-label');
const accountInput = document.getElementById('account-details');

if (methodSelect && accountLabel && accountInput) {
  methodSelect.addEventListener('change', () => {
    if (methodSelect.value === 'Mobile Number Transfer') {
      accountLabel.textContent = 'Mobile Number / UPI ID (PhonePe / GPay / Paytm)';
      accountInput.placeholder = 'e.g. +91 9876543210 or yourname@upi';
    } else {
      accountLabel.textContent = 'Bank Account Details (Account No, IFSC, Holder Name)';
      accountInput.placeholder = 'e.g. Account: 1234567890, IFSC: HDFC0001234, Name: John Doe';
    }
  });
}

openModalBtn.addEventListener('click', () => {
  if (currentUser) {
    document.getElementById('withdraw-amount').value = Number(currentUser.balance || 0).toFixed(2);
    document.getElementById('withdraw-amount').max = currentUser.balance;
  }
  modal.classList.add('active');
});

closeModalBtn.addEventListener('click', () => {
  modal.classList.remove('active');
  modalAlert.style.display = 'none';
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.remove('active');
    modalAlert.style.display = 'none';
  }
});

withdrawForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  modalAlert.style.display = 'none';

  const amount = parseFloat(document.getElementById('withdraw-amount').value);
  const method = document.getElementById('withdraw-method').value;
  const accountDetails = document.getElementById('account-details').value.trim();

  if (!amount || amount < 10) {
    modalAlert.textContent = 'Minimum withdrawal amount is $10.00.';
    modalAlert.className = 'alert-box alert-error';
    modalAlert.style.display = 'block';
    return;
  }

  if (!accountDetails) {
    modalAlert.textContent = 'Please enter your destination account details.';
    modalAlert.className = 'alert-box alert-error';
    modalAlert.style.display = 'block';
    return;
  }

  const confirmBtn = document.getElementById('confirm-withdraw-btn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Submitting...';

  try {
    const res = await fetch('/api/withdrawal/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount, method, accountDetails })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      modalAlert.textContent = 'Withdrawal requested successfully! Processing status updated.';
      modalAlert.className = 'alert-box alert-success';
      modalAlert.style.display = 'block';

      setTimeout(() => {
        modal.classList.remove('active');
        checkAuthAndLoad();
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Payout Request';
      }, 1200);
    } else {
      modalAlert.textContent = data.error || 'Failed to submit withdrawal.';
      modalAlert.className = 'alert-box alert-error';
      modalAlert.style.display = 'block';
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm Payout Request';
    }
  } catch (err) {
    modalAlert.textContent = 'Network error while requesting payout.';
    modalAlert.className = 'alert-box alert-error';
    modalAlert.style.display = 'block';
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm Payout Request';
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (e) {}
  window.location.href = '/login.html';
});

// Initial boot
checkAuthAndLoad();
