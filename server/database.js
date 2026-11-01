const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'data', 'ai_search_ads.db');

class AppDatabase {
  constructor() {
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this._initialize();
  }

  _initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        avatar_url TEXT,
        balance REAL DEFAULT 0,
        search_count INTEGER DEFAULT 0,
        lifetime_earnings REAL DEFAULT 0,
        provider TEXT DEFAULT 'email',
        created_at TEXT NOT NULL,
        last_active TEXT
      );

      CREATE TABLE IF NOT EXISTS searches (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        query TEXT,
        platform TEXT,
        reward REAL DEFAULT 0.0003,
        ad_shown TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS withdrawals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        method TEXT NOT NULL,
        account_details TEXT,
        status TEXT DEFAULT 'Processing',
        requested_at TEXT NOT NULL,
        processed_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        company TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        cta TEXT,
        url TEXT,
        category TEXT,
        keywords TEXT,
        platform TEXT DEFAULT 'all',
        icon TEXT,
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        budget REAL DEFAULT 0,
        spent REAL DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
  }

  _generateId(prefix) {
    return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
  }

  // ── User Methods ──────────────────────────────────────────────────────

  createUser({ id = null, email, password_hash, name, phone, balance = 0, lifetime_earnings = 0 }) {
    const finalId = id || this._generateId('usr');
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, name, phone, balance, lifetime_earnings, created_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(finalId, email, password_hash, name, phone || null, balance, lifetime_earnings, now, now);
    return this.getUserById(finalId);
  }

  getUserByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) || null;
  }

  getUserById(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) || null;
  }

  updateUserBalance(id, newBalance, newSearchCount, newLifetimeEarnings) {
    const stmt = this.db.prepare(`
      UPDATE users SET balance = ?, search_count = ?, lifetime_earnings = ? WHERE id = ?
    `);
    stmt.run(newBalance, newSearchCount, newLifetimeEarnings, id);
  }

  updateLastActive(id) {
    const stmt = this.db.prepare('UPDATE users SET last_active = ? WHERE id = ?');
    stmt.run(new Date().toISOString(), id);
  }

  // ── Search Methods ────────────────────────────────────────────────────

  recordSearch({ userId, query, platform, reward, adShown }) {
    const id = this._generateId('srch');
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO searches (id, user_id, query, platform, reward, ad_shown, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId, query || null, platform || null, reward, adShown || null, now);
    return { id, userId, query, platform, reward, adShown, timestamp: now };
  }

  getSearches(userId, limit = 50) {
    const stmt = this.db.prepare(
      'SELECT * FROM searches WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?'
    );
    return stmt.all(userId, limit);
  }

  // ── Withdrawal Methods ────────────────────────────────────────────────

  createWithdrawal({ userId, amount, method, accountDetails }) {
    const id = this._generateId('wd');
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO withdrawals (id, user_id, amount, method, account_details, requested_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId, amount, method, accountDetails || null, now);
    return { id, userId, amount, method, accountDetails, status: 'Processing', requested_at: now };
  }

  getWithdrawals(userId) {
    const stmt = this.db.prepare(
      'SELECT * FROM withdrawals WHERE user_id = ? ORDER BY requested_at DESC'
    );
    return stmt.all(userId);
  }

  updateWithdrawalStatus(id, status) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(
      'UPDATE withdrawals SET status = ?, processed_at = ? WHERE id = ?'
    );
    stmt.run(status, now, id);
    return this.db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(id);
  }

  // ── Campaign Methods ──────────────────────────────────────────────────

  getCampaigns() {
    const stmt = this.db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC');
    return stmt.all();
  }

  createCampaign(campaign) {
    const id = campaign.id || this._generateId('camp');
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO campaigns (id, company, title, description, cta, url, category, keywords, platform, icon, impressions, clicks, budget, spent, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      campaign.company,
      campaign.title,
      campaign.description || null,
      campaign.cta || null,
      campaign.url || null,
      campaign.category || null,
      typeof campaign.keywords === 'object' ? JSON.stringify(campaign.keywords) : (campaign.keywords || null),
      campaign.platform || 'all',
      campaign.icon || null,
      campaign.impressions || 0,
      campaign.clicks || 0,
      campaign.budget || 0,
      campaign.spent || 0,
      campaign.status || 'active',
      now
    );
    return { id, ...campaign, created_at: now };
  }

  updateCampaign(id, updates) {
    const allowed = ['company', 'title', 'description', 'cta', 'url', 'category', 'keywords', 'platform', 'icon', 'impressions', 'clicks', 'budget', 'spent', 'status'];
    const fields = [];
    const values = [];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        let val = updates[key];
        if (key === 'keywords' && typeof val === 'object') {
          val = JSON.stringify(val);
        }
        values.push(val);
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE campaigns SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.getCampaignById(id);
  }

  getCampaignById(id) {
    const stmt = this.db.prepare('SELECT * FROM campaigns WHERE id = ?');
    return stmt.get(id) || null;
  }

  deleteCampaign(id) {
    const stmt = this.db.prepare('DELETE FROM campaigns WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ── Session Methods ───────────────────────────────────────────────────

  createSession(userId, token, expiresAt) {
    const id = this._generateId('sess');
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId, token, expiresAt, now);
    return { id, userId, token, expiresAt, created_at: now };
  }

  getSession(token) {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE token = ?');
    return stmt.get(token) || null;
  }

  deleteSession(token) {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE token = ?');
    stmt.run(token);
  }

  deleteExpiredSessions() {
    const now = new Date().toISOString();
    const stmt = this.db.prepare('DELETE FROM sessions WHERE expires_at < ?');
    const result = stmt.run(now);
    return result.changes;
  }

  // ── Seed Methods ──────────────────────────────────────────────────────

  seedDefaultCampaigns(campaigns) {
    const count = this.db.prepare('SELECT COUNT(*) as cnt FROM campaigns').get();
    if (count.cnt > 0) return;

    const insertMany = this.db.transaction((items) => {
      for (const campaign of items) {
        this.createCampaign(campaign);
      }
    });
    insertMany(campaigns);
  }
}

// Export singleton instance
const instance = new AppDatabase();
module.exports = instance;
