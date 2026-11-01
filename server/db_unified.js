/**
 * Unified Database Layer (Hybrid: MongoDB Atlas Cloud + Local SQLite Fallback)
 * Automatically connects to MongoDB Atlas if MONGO_URI is set.
 * Otherwise falls back to local SQLite with zero downtime.
 */

require('dotenv').config();
const dns = require('dns');
try { dns.setDefaultResultOrder('ipv4first'); } catch {}

const mongoose = require('mongoose');
const sqliteDb = require('./database');
const { User, Search, Withdrawal, Campaign, Session } = require('./mongo_models');
const crypto = require('crypto');

class UnifiedDatabase {
  constructor() {
    this.isMongo = false;
    this.mongoConnected = false;
    this.mongoError = null;
    this.db = sqliteDb.db;
  }

  async init() {
    const DEFAULT_MONGO_URI = 'mongodb+srv://bhavy401821_db_user:uPNx4KtKOAYLcdar@cluster0.q8e1kyh.mongodb.net/PayGpt?retryWrites=true&w=majority';
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || DEFAULT_MONGO_URI;

    if (mongoUri && mongoUri.startsWith('mongodb')) {
      try {
        console.log('⏳ Connecting to MongoDB Atlas Cloud Database...');
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 10000,
          family: 4
        });
        this.isMongo = true;
        this.mongoConnected = true;
        console.log('✅ Connected successfully to MongoDB Atlas Cloud Database!');
      } catch (err) {
        this.mongoError = err.message;
        console.warn('⚠️ MongoDB Atlas connection failed:', err.message);
        console.log('📦 Falling back to local SQLite database (database.sqlite)');
        this.isMongo = false;
      }
    } else {
      console.log('📦 No MONGO_URI detected in .env. Using high-speed local SQLite database.');
      this.isMongo = false;
    }
  }

  // ── USER METHODS ─────────────────────────────────────────────────────────

  async createUser({ email, password_hash, name, phone = null }) {
    if (this.isMongo) {
      const id = 'usr_' + crypto.randomBytes(12).toString('hex');
      const doc = await User.create({
        id,
        email: email.toLowerCase().trim(),
        password_hash,
        name: name.trim(),
        phone
      });
      return doc.toObject();
    }
    return sqliteDb.createUser({ email, password_hash, name, phone });
  }

  async getUserByEmail(email) {
    if (this.isMongo) {
      const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();
      return user || null;
    }
    return sqliteDb.getUserByEmail(email);
  }

  async getUserById(id) {
    if (this.isMongo) {
      const user = await User.findOne({ id }).lean();
      return user || null;
    }
    return sqliteDb.getUserById(id);
  }

  async updateUserBalance(id, newBalance, newSearchCount, newLifetimeEarnings) {
    if (this.isMongo) {
      await User.updateOne({ id }, {
        $set: {
          balance: newBalance,
          search_count: newSearchCount,
          lifetime_earnings: newLifetimeEarnings,
          last_active: new Date().toISOString()
        }
      });
      return;
    }
    return sqliteDb.updateUserBalance(id, newBalance, newSearchCount, newLifetimeEarnings);
  }

  async updateLastActive(id) {
    if (this.isMongo) {
      await User.updateOne({ id }, { $set: { last_active: new Date().toISOString() } });
      return;
    }
    return sqliteDb.updateLastActive(id);
  }

  async getAllUsers() {
    if (this.isMongo) {
      return await User.find({}).sort({ created_at: -1 }).lean();
    }
    return sqliteDb.db.prepare('SELECT id, name, email, phone, balance, search_count, lifetime_earnings, created_at FROM users ORDER BY created_at DESC').all();
  }

  // ── SEARCH LOGS ──────────────────────────────────────────────────────────

  async recordSearch({ userId, query, platform, reward, adShown }) {
    if (this.isMongo) {
      const id = 'srch_' + crypto.randomBytes(12).toString('hex');
      const doc = await Search.create({
        id,
        user_id: userId,
        query,
        platform,
        reward,
        ad_shown: adShown
      });
      return doc.toObject();
    }
    return sqliteDb.recordSearch({ userId, query, platform, reward, adShown });
  }

  async getSearches(userId, limit = 50) {
    if (this.isMongo) {
      return await Search.find({ user_id: userId }).sort({ timestamp: -1 }).limit(limit).lean();
    }
    return sqliteDb.getSearches(userId, limit);
  }

  async getAllSearches(limit = 50) {
    if (this.isMongo) {
      return await Search.find({}).sort({ timestamp: -1 }).limit(limit).lean();
    }
    return sqliteDb.db.prepare('SELECT id, user_id, query, platform, reward, ad_shown, timestamp FROM searches ORDER BY timestamp DESC LIMIT ?').all(limit);
  }

  // ── WITHDRAWALS ──────────────────────────────────────────────────────────

  async createWithdrawal({ userId, amount, method, accountDetails }) {
    if (this.isMongo) {
      const id = 'wd_' + crypto.randomBytes(12).toString('hex');
      const doc = await Withdrawal.create({
        id,
        user_id: userId,
        amount,
        method,
        account_details: accountDetails
      });
      return doc.toObject();
    }
    return sqliteDb.createWithdrawal({ userId, amount, method, accountDetails });
  }

  async getWithdrawals(userId) {
    if (this.isMongo) {
      return await Withdrawal.find({ user_id: userId }).sort({ requested_at: -1 }).lean();
    }
    return sqliteDb.getWithdrawals(userId);
  }

  async getAllWithdrawals() {
    if (this.isMongo) {
      return await Withdrawal.find({}).sort({ requested_at: -1 }).lean();
    }
    return sqliteDb.db.prepare('SELECT id, user_id, amount, method, account_details, status, requested_at FROM withdrawals ORDER BY requested_at DESC').all();
  }

  // ── CAMPAIGNS ────────────────────────────────────────────────────────────

  async getCampaigns() {
    if (this.isMongo) {
      return await Campaign.find({}).sort({ created_at: -1 }).lean();
    }
    return sqliteDb.getCampaigns();
  }

  async getCampaignById(id) {
    if (this.isMongo) {
      return await Campaign.findOne({ id }).lean();
    }
    return sqliteDb.getCampaignById(id);
  }

  async createCampaign(campaign) {
    if (this.isMongo) {
      const id = campaign.id || ('ad_' + crypto.randomBytes(10).toString('hex'));
      const doc = await Campaign.create({ ...campaign, id });
      return doc.toObject();
    }
    return sqliteDb.createCampaign(campaign);
  }

  async updateCampaign(id, updates) {
    if (this.isMongo) {
      await Campaign.updateOne({ id }, { $set: updates });
      return await Campaign.findOne({ id }).lean();
    }
    return sqliteDb.updateCampaign(id, updates);
  }

  async deleteCampaign(id) {
    if (this.isMongo) {
      await Campaign.deleteOne({ id });
      return true;
    }
    return sqliteDb.deleteCampaign(id);
  }

  async seedDefaultCampaigns(defaults) {
    if (this.isMongo) {
      const count = await Campaign.countDocuments();
      if (count === 0 && defaults && defaults.length > 0) {
        for (const camp of defaults) {
          await Campaign.create(camp);
        }
        console.log(`🌱 Seeded ${defaults.length} default ad campaigns into MongoDB.`);
      }
      return;
    }
    return sqliteDb.seedDefaultCampaigns(defaults);
  }

  // ── SESSIONS ─────────────────────────────────────────────────────────────

  async createSession(userId, token, expiresAt) {
    if (this.isMongo) {
      const id = 'sess_' + crypto.randomBytes(12).toString('hex');
      await Session.create({ id, user_id: userId, token, expires_at: expiresAt });
      return;
    }
    return sqliteDb.createSession(userId, token, expiresAt);
  }

  async deleteSession(token) {
    if (this.isMongo) {
      await Session.deleteOne({ token });
      return;
    }
    return sqliteDb.deleteSession(token);
  }

  async deleteExpiredSessions() {
    if (this.isMongo) {
      await Session.deleteMany({ expires_at: { $lt: new Date().toISOString() } });
      return;
    }
    return sqliteDb.deleteExpiredSessions();
  }
}

const db = new UnifiedDatabase();
module.exports = db;
