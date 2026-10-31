/**
 * AI Search Ads - Persistent Database Manager
 * Handles data persistence for users, campaigns, withdrawals, and search logs.
 */

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

const DEFAULT_CAMPAIGNS = [
  {
    id: "ad-cursor-ai",
    company: "Cursor AI",
    title: "Code at the Speed of Thought",
    description: "The AI-first Code Editor built for software engineers. 2x your programming productivity today.",
    cta: "Download Free",
    url: "https://www.cursor.com",
    category: "Developer Tools",
    keywords: ["code", "coding", "python", "javascript", "react", "programming", "bug", "developer", "ide", "vscode", "software", "api"],
    platform: "all",
    icon: "💻",
    impressions: 0,
    clicks: 0,
    budget: 150.00,
    spent: 0.00,
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "ad-notion-ai",
    company: "Notion AI",
    title: "Your Connected AI Workspace",
    description: "Write faster, think bigger, and organize any workflow with Notion's built-in AI assistant.",
    cta: "Try Notion Free",
    url: "https://www.notion.so/product/ai",
    category: "Productivity & SaaS",
    keywords: ["write", "writing", "note", "notes", "summary", "summarize", "organize", "essay", "docs", "project", "meeting"],
    platform: "all",
    icon: "📝",
    impressions: 0,
    clicks: 0,
    budget: 200.00,
    spent: 0.00,
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "ad-digitalocean",
    company: "DigitalOcean",
    title: "Deploy Cloud Servers in Seconds",
    description: "Get $200 free cloud credit. Scale your apps, databases, and AI models effortlessly.",
    cta: "Claim $200 Credit",
    url: "https://www.digitalocean.com",
    category: "Cloud & Hosting",
    keywords: ["server", "cloud", "deploy", "hosting", "docker", "kubernetes", "database", "backend", "linux", "devops"],
    platform: "all",
    icon: "☁️",
    impressions: 0,
    clicks: 0,
    budget: 250.00,
    spent: 0.00,
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "ad-nordvpn",
    company: "NordVPN",
    title: "Secure Your Digital Privacy Online",
    description: "Protect your personal data and browse with military-grade encryption. Get 70% off + 3 extra months.",
    cta: "Get 70% Off",
    url: "https://nordvpn.com",
    category: "Security & VPN",
    keywords: ["vpn", "privacy", "security", "protect", "ip", "safe", "crypto", "wifi", "browse", "hack"],
    platform: "all",
    icon: "🛡️",
    impressions: 0,
    clicks: 0,
    budget: 180.00,
    spent: 0.00,
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "ad-grammarly",
    company: "Grammarly AI",
    title: "Flawless Writing with AI Precision",
    description: "Elevate your grammar, tone, and clarity instantly across emails, essays, and reports.",
    cta: "Install Free Plugin",
    url: "https://www.grammarly.com",
    category: "Productivity & SaaS",
    keywords: ["grammar", "spell", "email", "essay", "english", "proofread", "resume", "letter", "sentence", "text"],
    platform: "all",
    icon: "✍️",
    impressions: 0,
    clicks: 0,
    budget: 120.00,
    spent: 0.00,
    status: "active",
    createdAt: new Date().toISOString()
  }
];

class Database {
  constructor() {
    this.data = {
      users: {},
      campaigns: [...DEFAULT_CAMPAIGNS],
      withdrawals: [],
      searches: []
    };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || {},
          campaigns: parsed.campaigns && parsed.campaigns.length > 0 ? parsed.campaigns : [...DEFAULT_CAMPAIGNS],
          withdrawals: parsed.withdrawals || [],
          searches: parsed.searches || []
        };
      } else {
        this.save();
      }
    } catch (err) {
      console.error('[DB] Error loading database file, initializing defaults:', err);
      this.save();
    }
  }

  save() {
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[DB] Error saving database:', err);
    }
  }

  // --- USER METHODS ---

  getUser(userId) {
    if (!userId) return null;
    return this.data.users[userId] || null;
  }

  getOrCreateUser(userId) {
    if (!userId) {
      userId = "usr_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    if (!this.data.users[userId]) {
      this.data.users[userId] = {
        id: userId,
        balance: 0.0000,
        searchCount: 0,
        lifetimeEarnings: 0.0000,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      this.save();
    } else {
      this.data.users[userId].lastActive = new Date().toISOString();
      this.save();
    }

    return this.data.users[userId];
  }

  creditSearchReward(userId, reward = 0.0003) {
    const user = this.getOrCreateUser(userId);
    user.balance = Math.round((user.balance + reward) * 1000000) / 1000000;
    user.lifetimeEarnings = Math.round((user.lifetimeEarnings + reward) * 1000000) / 1000000;
    user.searchCount += 1;
    user.lastActive = new Date().toISOString();
    this.save();
    return user;
  }

  deductBalance(userId, amount) {
    const user = this.getUser(userId);
    if (!user || user.balance < amount) return false;
    user.balance = Math.round((user.balance - amount) * 1000000) / 1000000;
    user.lastActive = new Date().toISOString();
    this.save();
    return true;
  }

  addDevBalance(userId, amount) {
    const user = this.getOrCreateUser(userId);
    user.balance = Math.round((user.balance + amount) * 1000000) / 1000000;
    user.lifetimeEarnings = Math.round((user.lifetimeEarnings + amount) * 1000000) / 1000000;
    this.save();
    return user;
  }

  // --- SEARCH AUDIT LOG ---

  recordSearchLog(userId, query, platform, reward, adShown) {
    const entry = {
      id: "srch_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      userId,
      query: (query || "Prompt").slice(0, 150),
      platform: platform || "chatgpt",
      reward,
      adShown: adShown || null,
      timestamp: new Date().toISOString()
    };
    this.data.searches.unshift(entry);
    if (this.data.searches.length > 500) {
      this.data.searches.pop();
    }
    this.save();
    return entry;
  }

  getUserSearches(userId, limit = 50) {
    return this.data.searches
      .filter(s => s.userId === userId)
      .slice(0, limit);
  }

  // --- AD CAMPAIGN METHODS ---

  getCampaigns() {
    return this.data.campaigns;
  }

  matchAd(query = "", platform = "chatgpt") {
    const active = this.data.campaigns.filter(c => {
      if (c.status !== "active") return false;
      if (c.budget && c.spent >= c.budget) return false;
      if (c.platform && c.platform !== "all" && c.platform !== platform) return false;
      return true;
    });

    if (active.length === 0) {
      return this.data.campaigns[0] || null;
    }

    const normQuery = (query || "").toLowerCase();
    const scored = active.map(ad => {
      let score = 1;
      if (ad.keywords && Array.isArray(ad.keywords)) {
        for (const kw of ad.keywords) {
          if (normQuery.includes(kw.toLowerCase())) {
            score += 5;
          }
        }
      }
      return { ad, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const topScore = scored[0].score;
    const topCandidates = scored.filter(s => s.score >= topScore);
    return topCandidates[Math.floor(Math.random() * topCandidates.length)].ad;
  }

  incrementImpression(adId, cost = 0.0003) {
    const ad = this.data.campaigns.find(c => c.id === adId);
    if (ad) {
      ad.impressions = (ad.impressions || 0) + 1;
      ad.spent = Math.round(((ad.spent || 0) + cost) * 1000000) / 1000000;
      this.save();
    }
  }

  incrementClick(adId) {
    const ad = this.data.campaigns.find(c => c.id === adId);
    if (ad) {
      ad.clicks = (ad.clicks || 0) + 1;
      this.save();
    }
  }

  saveCampaign(campaignData) {
    if (!campaignData.id) {
      campaignData.id = "ad-" + Date.now().toString(36) + "-" + Math.random().toString(36).substr(2, 4);
      campaignData.createdAt = new Date().toISOString();
      campaignData.impressions = 0;
      campaignData.clicks = 0;
      campaignData.spent = 0.00;
      campaignData.status = "active";
      this.data.campaigns.unshift(campaignData);
    } else {
      const idx = this.data.campaigns.findIndex(c => c.id === campaignData.id);
      if (idx !== -1) {
        this.data.campaigns[idx] = { ...this.data.campaigns[idx], ...campaignData };
      } else {
        this.data.campaigns.unshift(campaignData);
      }
    }
    this.save();
    return campaignData;
  }

  toggleCampaignStatus(id) {
    const ad = this.data.campaigns.find(c => c.id === id);
    if (!ad) return null;
    ad.status = ad.status === "active" ? "paused" : "active";
    this.save();
    return ad.status;
  }

  deleteCampaign(id) {
    this.data.campaigns = this.data.campaigns.filter(c => c.id !== id);
    this.save();
    return true;
  }

  // --- WITHDRAWAL METHODS ---

  createWithdrawal(userId, amount, method, accountDetails) {
    const tx = {
      id: "TX-" + Math.floor(100000 + Math.random() * 900000),
      userId,
      amount: parseFloat(amount),
      method: method || "PayPal",
      accountDetails: accountDetails.trim(),
      requestedAt: new Date().toISOString(),
      status: "Processing",
      estimatedArrival: "Within 24-48 business hours"
    };

    this.data.withdrawals.unshift(tx);
    this.save();
    return tx;
  }

  getUserWithdrawals(userId) {
    return this.data.withdrawals.filter(w => w.userId === userId);
  }

  resetAllData() {
    this.data = {
      users: {},
      campaigns: [...DEFAULT_CAMPAIGNS],
      withdrawals: [],
      searches: []
    };
    this.save();
  }
}

module.exports = new Database();
