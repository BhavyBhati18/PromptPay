/**
 * MongoDB Atlas Schemas & Models
 * Scalable cloud persistence for AI Search Ads & PayGpt
 */

const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, default: null },
  avatar_url: { type: String, default: null },
  balance: { type: Number, default: 0 },
  search_count: { type: Number, default: 0 },
  lifetime_earnings: { type: Number, default: 0 },
  provider: { type: String, default: 'email' },
  created_at: { type: String, default: () => new Date().toISOString() },
  last_active: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

// Search Prompt Log Schema
const searchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  query: { type: String, default: null },
  platform: { type: String, default: null },
  reward: { type: Number, default: 0.0003 },
  ad_shown: { type: String, default: null },
  timestamp: { type: String, default: () => new Date().toISOString() }
});

// Withdrawal Request Schema
const withdrawalSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  account_details: { type: String, required: true },
  status: { type: String, default: 'Processing' },
  requested_at: { type: String, default: () => new Date().toISOString() },
  processed_at: { type: String, default: null }
});

// Ad Campaign Schema
const campaignSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  company: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  cta: { type: String, default: 'Learn More' },
  url: { type: String, required: true },
  category: { type: String, default: 'General' },
  keywords: { type: String, default: '[]' },
  platform: { type: String, default: 'all' },
  icon: { type: String, default: '🚀' },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  budget: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
  created_at: { type: String, default: () => new Date().toISOString() }
});

// Session Schema
const sessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true },
  expires_at: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
});

// Inquiry Schema (From Businesses wanting to advertise)
const inquirySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  company: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true },
  url: { type: String, required: true },
  budget: { type: String, required: true },
  platform: { type: String, default: 'all' },
  keywords: { type: String, default: '' },
  goal: { type: String, default: '' },
  status: { type: String, default: 'Pending Review' },
  created_at: { type: String, default: () => new Date().toISOString() }
});

const User = mongoose.model('User', userSchema);
const Search = mongoose.model('Search', searchSchema);
const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);
const Session = mongoose.model('Session', sessionSchema);
const Inquiry = mongoose.model('Inquiry', inquirySchema);

module.exports = {
  User,
  Search,
  Withdrawal,
  Campaign,
  Session,
  Inquiry
};
