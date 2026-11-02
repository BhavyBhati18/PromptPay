/**
 * AI Search Ads - Background Service Worker
 * Manages user balance, search reward tracking ($0.0003/search), ad delivery, and withdrawals.
 * Connects to live Backend REST API with seamless local fallback.
 */

importScripts("ad_engine.js");

// Endpoints to try: production Vercel proxy, local server, and direct Render
const API_ENDPOINTS = [
  "https://querypay.vercel.app/api",
  "https://promptpay-api-zzao.onrender.com/api",
  "http://localhost:3000/api"
];
const REWARD_PER_SEARCH = 0.0003;
const MIN_WITHDRAWAL_AMOUNT = 10.00;

/**
 * Generic API client with automatic fallback across local & remote servers
 */
async function apiFetch(endpoint, method = "GET", data = null) {
  const stored = await chrome.storage.local.get(["authToken"]);
  const token = stored.authToken || null;

  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  for (const base of API_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const options = {
        method,
        headers,
        signal: controller.signal
      };
      if (data) options.body = JSON.stringify(data);

      const res = await fetch(`${base}${endpoint}`, options);
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      // Try next endpoint in array
    }
  }

  console.warn(`[AI Search Ads API] ${method} ${endpoint} unreachable on all endpoints`);
  return null;
}

/**
 * Ensures user has a persistent UUID
 */
async function getOrCreateUserId() {
  const data = await chrome.storage.local.get(["userId"]);
  if (data.userId) return data.userId;

  const newId = "usr_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  await chrome.storage.local.set({ userId: newId });
  return newId;
}

// Initialize default storage data upon installation & sync with backend
chrome.runtime.onInstalled.addListener(async () => {
  const userId = await getOrCreateUserId();

  // Try syncing with real backend
  const remote = await apiFetch("/user/sync", "POST", { userId });

  const data = await chrome.storage.local.get([
    "balance",
    "searchCount",
    "lifetimeEarnings",
    "withdrawals",
    "campaigns",
    "recentSearches",
    "settings"
  ]);

  const updates = {};
  if (remote && remote.success && remote.user) {
    updates.balance = Number(remote.user.balance) || 0.0000;
    updates.searchCount = Number(remote.user.search_count ?? remote.user.searchCount) || 0;
    updates.lifetimeEarnings = Number(remote.user.lifetime_earnings ?? remote.user.lifetimeEarnings) || 0.0000;
    if (remote.withdrawals) updates.withdrawals = remote.withdrawals;
    if (remote.searches) updates.recentSearches = remote.searches;
  } else {
    if (data.balance === undefined) updates.balance = 0.0000;
    if (data.searchCount === undefined) updates.searchCount = 0;
    if (data.lifetimeEarnings === undefined) updates.lifetimeEarnings = 0.0000;
    if (!data.withdrawals) updates.withdrawals = [];
    if (!data.recentSearches) updates.recentSearches = [];
  }

  if (!data.campaigns || data.campaigns.length === 0) updates.campaigns = DEFAULT_CAMPAIGNS;
  if (!data.settings) {
    updates.settings = {
      rewardPerSearch: REWARD_PER_SEARCH,
      minWithdrawal: MIN_WITHDRAWAL_AMOUNT,
      soundEnabled: true,
      notificationsEnabled: true
    };
  }

  await chrome.storage.local.set(updates);
  console.log("AI Search Ads Extension ready. User ID:", userId);
});

// Central message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = async () => {
    switch (message.action) {
      case "RECORD_SEARCH":
        return await handleRecordSearch(message.payload);

      case "RECORD_CLICK":
        return await handleRecordClick(message.payload);

      case "REQUEST_WITHDRAWAL":
        return await handleRequestWithdrawal(message.payload);

      case "GET_USER_DATA":
        return await handleGetUserData();

      case "SAVE_CAMPAIGN":
        return await handleSaveCampaign(message.payload);

      case "TOGGLE_CAMPAIGN_STATUS":
        return await handleToggleCampaignStatus(message.payload);

      case "DELETE_CAMPAIGN":
        return await handleDeleteCampaign(message.payload);

      case "DEV_ADD_BALANCE":
        return await handleDevAddBalance(message.payload);

      case "DEV_RESET_DATA":
        return await handleDevReset();

      default:
        return { success: false, error: "Unknown action" };
    }
  };

  handler()
    .then(sendResponse)
    .catch(err => sendResponse({ success: false, error: err.message }));

  return true; // Keep message channel open for async response
});

/**
 * Handles crediting $0.0003 to the user and returning a relevant sponsored ad.
 * Calls real backend API with seamless local fallback.
 */
async function handleRecordSearch({ query, platform }) {
  const userId = await getOrCreateUserId();
  const stored = await chrome.storage.local.get(["authToken"]);
  const token = stored.authToken || null;

  // Attempt backend API call (tries local first, then remote)
  let remoteRes = await apiFetch("/search/record", "POST", { userId, query, platform });

  if (remoteRes && remoteRes.success) {
    // Backend recorded successfully! Update local cache
    const data = await chrome.storage.local.get(["recentSearches"]);
    const recentSearches = data.recentSearches || [];
    recentSearches.unshift({
      id: remoteRes.searchLog ? remoteRes.searchLog.id : "s_" + Date.now(),
      query: (query || "Prompt").slice(0, 100),
      platform: platform || "ai",
      reward: REWARD_PER_SEARCH,
      adShown: remoteRes.ad ? remoteRes.ad.company : null,
      timestamp: new Date().toISOString()
    });
    if (recentSearches.length > 50) recentSearches.pop();

    await chrome.storage.local.set({
      balance: remoteRes.newBalance,
      searchCount: remoteRes.searchCount,
      lifetimeEarnings: remoteRes.lifetimeEarnings,
      recentSearches
    });

    return {
      success: true,
      reward: REWARD_PER_SEARCH,
      newBalance: remoteRes.newBalance,
      searchCount: remoteRes.searchCount,
      ad: remoteRes.ad
    };
  }

  // Fallback: local processing if backend is offline
  const data = await chrome.storage.local.get([
    "balance",
    "searchCount",
    "lifetimeEarnings",
    "campaigns",
    "recentSearches"
  ]);

  let balance = (data.balance || 0) + REWARD_PER_SEARCH;
  balance = Math.round(balance * 1000000) / 1000000;

  const searchCount = (data.searchCount || 0) + 1;
  let lifetimeEarnings = (data.lifetimeEarnings || 0) + REWARD_PER_SEARCH;
  lifetimeEarnings = Math.round(lifetimeEarnings * 1000000) / 1000000;

  const campaigns = data.campaigns && data.campaigns.length > 0 ? data.campaigns : DEFAULT_CAMPAIGNS;
  const ad = AdEngine.matchAd(campaigns, query, platform);

  if (ad) {
    const updatedCampaigns = campaigns.map(c => {
      if (c.id === ad.id) {
        return {
          ...c,
          impressions: (c.impressions || 0) + 1,
          spent: Math.round(((c.spent || 0) + REWARD_PER_SEARCH) * 1000000) / 1000000
        };
      }
      return c;
    });
    await chrome.storage.local.set({ campaigns: updatedCampaigns });
  }

  const recentSearches = data.recentSearches || [];
  recentSearches.unshift({
    id: "s_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    query: (query || "Prompt").slice(0, 100),
    platform: platform || "ai",
    reward: REWARD_PER_SEARCH,
    adShown: ad ? ad.company : null,
    timestamp: new Date().toISOString()
  });
  if (recentSearches.length > 50) recentSearches.pop();

  await chrome.storage.local.set({
    balance,
    searchCount,
    lifetimeEarnings,
    recentSearches
  });

  return {
    success: true,
    reward: REWARD_PER_SEARCH,
    newBalance: balance,
    searchCount,
    ad
  };
}

/**
 * Tracks click on an ad
 */
async function handleRecordClick({ adId }) {
  if (adId) {
    apiFetch("/ad/click", "POST", { adId });
  }

  const data = await chrome.storage.local.get(["campaigns"]);
  if (!data.campaigns) return { success: false };

  const updatedCampaigns = data.campaigns.map(c => {
    if (c.id === adId) {
      return { ...c, clicks: (c.clicks || 0) + 1 };
    }
    return c;
  });

  await chrome.storage.local.set({ campaigns: updatedCampaigns });
  return { success: true };
}

/**
 * Processes a withdrawal request if user has >= $10.00
 */
async function handleRequestWithdrawal({ method, accountDetails, amount }) {
  const userId = await getOrCreateUserId();
  const data = await chrome.storage.local.get(["balance", "withdrawals"]);
  const currentBalance = data.balance || 0;
  const reqAmount = parseFloat(amount) || currentBalance;

  // Try real backend first
  const remoteRes = await apiFetch("/withdrawal/request", "POST", {
    userId,
    method,
    accountDetails,
    amount: reqAmount
  });

  if (remoteRes && remoteRes.success) {
    const withdrawals = data.withdrawals || [];
    withdrawals.unshift(remoteRes.withdrawal);
    await chrome.storage.local.set({
      balance: remoteRes.newBalance,
      withdrawals
    });
    return {
      success: true,
      withdrawal: remoteRes.withdrawal,
      newBalance: remoteRes.newBalance
    };
  }

  // Fallback: local validation
  if (currentBalance < MIN_WITHDRAWAL_AMOUNT) {
    return {
      success: false,
      error: `Minimum withdrawal amount is $${MIN_WITHDRAWAL_AMOUNT.toFixed(2)}. Your current balance is $${currentBalance.toFixed(4)}.`
    };
  }

  if (reqAmount < MIN_WITHDRAWAL_AMOUNT) {
    return {
      success: false,
      error: `You cannot withdraw less than the $${MIN_WITHDRAWAL_AMOUNT.toFixed(2)} threshold.`
    };
  }

  if (reqAmount > currentBalance) {
    return {
      success: false,
      error: `Insufficient funds. Your current balance is $${currentBalance.toFixed(4)}.`
    };
  }

  if (!accountDetails || !accountDetails.trim()) {
    return {
      success: false,
      error: "Please provide valid account details."
    };
  }

  const newBalance = Math.round((currentBalance - reqAmount) * 1000000) / 1000000;
  const newWithdrawal = {
    id: "TX-" + Math.floor(100000 + Math.random() * 900000),
    amount: reqAmount,
    method: method || "PayPal",
    accountDetails: accountDetails.trim(),
    requestedAt: new Date().toISOString(),
    status: "Processing",
    estimatedArrival: "Within 24-48 business hours"
  };

  const withdrawals = data.withdrawals || [];
  withdrawals.unshift(newWithdrawal);

  await chrome.storage.local.set({
    balance: newBalance,
    withdrawals
  });

  return {
    success: true,
    withdrawal: newWithdrawal,
    newBalance
  };
}

/**
 * Returns current snapshot of user stats
 */
async function handleGetUserData() {
  const userId = await getOrCreateUserId();

  // Try sync with backend
  const remote = await apiFetch("/user/sync", "POST", { userId });
  if (remote && remote.success && remote.user) {
    await chrome.storage.local.set({
      balance: Number(remote.user.balance) || 0.0000,
      searchCount: Number(remote.user.search_count ?? remote.user.searchCount) || 0,
      lifetimeEarnings: Number(remote.user.lifetime_earnings ?? remote.user.lifetimeEarnings) || 0.0000,
      withdrawals: remote.withdrawals || [],
      recentSearches: remote.searches || []
    });
  }

  const data = await chrome.storage.local.get([
    "balance",
    "searchCount",
    "lifetimeEarnings",
    "withdrawals",
    "recentSearches",
    "campaigns"
  ]);

  return {
    success: true,
    balance: data.balance || 0.0000,
    searchCount: data.searchCount || 0,
    lifetimeEarnings: data.lifetimeEarnings || 0.0000,
    withdrawals: data.withdrawals || [],
    recentSearches: data.recentSearches || [],
    campaignCount: (data.campaigns || []).length
  };
}

/**
 * Creates or updates an ad campaign
 */
async function handleSaveCampaign(campaign) {
  // Sync to remote API
  apiFetch("/advertiser/campaign", "POST", campaign);

  const data = await chrome.storage.local.get(["campaigns"]);
  let campaigns = data.campaigns || [...DEFAULT_CAMPAIGNS];

  if (!campaign.id) {
    campaign.id = "ad-" + Date.now().toString(36) + "-" + Math.random().toString(36).substr(2, 4);
    campaign.createdAt = new Date().toISOString();
    campaign.impressions = 0;
    campaign.clicks = 0;
    campaign.spent = 0.00;
    campaign.status = "active";
    campaigns.unshift(campaign);
  } else {
    campaigns = campaigns.map(c => (c.id === campaign.id ? { ...c, ...campaign } : c));
  }

  await chrome.storage.local.set({ campaigns });
  return { success: true, campaign };
}

/**
 * Toggles an ad campaign active/paused
 */
async function handleToggleCampaignStatus({ id, status }) {
  apiFetch(`/advertiser/campaign/${id}/toggle`, "PATCH", status ? { status } : {});

  const data = await chrome.storage.local.get(["campaigns"]);
  let campaigns = data.campaigns || [];
  let updatedStatus = status || "active";

  campaigns = campaigns.map(c => {
    if (c.id === id) {
      if (!status) {
        updatedStatus = c.status === "active" ? "paused" : "active";
      }
      return { ...c, status: updatedStatus };
    }
    return c;
  });

  await chrome.storage.local.set({ campaigns });
  return { success: true, newStatus: updatedStatus };
}

/**
 * Deletes a campaign
 */
async function handleDeleteCampaign({ id }) {
  apiFetch(`/advertiser/campaign/${id}`, "DELETE");

  const data = await chrome.storage.local.get(["campaigns"]);
  let campaigns = (data.campaigns || []).filter(c => c.id !== id);
  await chrome.storage.local.set({ campaigns });
  return { success: true };
}

/**
 * Developer tool to add test balance for immediate withdrawal verification
 */
async function handleDevAddBalance({ amount = 5.00 }) {
  const userId = await getOrCreateUserId();
  apiFetch("/dev/add-balance", "POST", { userId, amount });

  const data = await chrome.storage.local.get(["balance", "lifetimeEarnings"]);
  const newBalance = Math.round(((data.balance || 0) + amount) * 1000000) / 1000000;
  const newLifetime = Math.round(((data.lifetimeEarnings || 0) + amount) * 1000000) / 1000000;

  await chrome.storage.local.set({
    balance: newBalance,
    lifetimeEarnings: newLifetime
  });

  return { success: true, newBalance };
}

/**
 * Developer tool to reset data
 */
async function handleDevReset() {
  const userId = await getOrCreateUserId();
  apiFetch("/dev/reset", "POST", { userId });

  await chrome.storage.local.set({
    balance: 0.0000,
    searchCount: 0,
    lifetimeEarnings: 0.0000,
    withdrawals: [],
    recentSearches: [],
    campaigns: DEFAULT_CAMPAIGNS
  });
  return { success: true };
}
