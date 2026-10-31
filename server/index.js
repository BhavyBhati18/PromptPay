require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const db = require('./db_unified');
const { hashPassword, comparePassword, generateToken, verifyToken, authMiddleware, optionalAuth } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;
const REWARD_PER_SEARCH = 0.0003;
const MIN_WITHDRAWAL = 10;

// ── Middleware ───────────────────────────────────────────────────────────

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ── Default Campaigns ───────────────────────────────────────────────────

const DEFAULT_CAMPAIGNS = [
  {
    id: 'camp_cursor_ai',
    company: 'Cursor',
    title: 'Cursor AI — The AI Code Editor',
    description: 'Write, edit, and refactor code 10x faster with AI. Built on VS Code, powered by GPT-4.',
    cta: 'Try Cursor Free →',
    url: 'https://cursor.sh',
    category: 'Developer Tools',
    keywords: JSON.stringify(['code', 'coding', 'programming', 'developer', 'IDE', 'editor', 'vscode', 'ai code', 'refactor', 'debug', 'software', 'engineering', 'python', 'javascript', 'typescript', 'react', 'api', 'github', 'git']),
    platform: 'all',
    icon: '🖥️',
    budget: 5000,
    status: 'active'
  },
  {
    id: 'camp_notion_ai',
    company: 'Notion',
    title: 'Notion AI — Your Connected AI Workspace',
    description: 'Leverage AI across docs, wikis, and projects. Summarize, write, brainstorm — all in one place.',
    cta: 'Get Notion AI →',
    url: 'https://notion.so',
    category: 'Productivity',
    keywords: JSON.stringify(['notes', 'writing', 'document', 'wiki', 'project management', 'organize', 'workspace', 'productivity', 'summarize', 'brainstorm', 'meeting notes', 'template', 'collaboration', 'team', 'planning', 'notion']),
    platform: 'all',
    icon: '📝',
    budget: 4000,
    status: 'active'
  },
  {
    id: 'camp_digitalocean',
    company: 'DigitalOcean',
    title: 'DigitalOcean Cloud — Simple, Scalable Hosting',
    description: 'Deploy apps, databases, and AI models with simple cloud infrastructure. Starting at $4/mo.',
    cta: 'Start Building →',
    url: 'https://digitalocean.com',
    category: 'Cloud & Hosting',
    keywords: JSON.stringify(['hosting', 'server', 'cloud', 'deploy', 'database', 'vps', 'kubernetes', 'docker', 'devops', 'infrastructure', 'website', 'domain', 'ssl', 'linux', 'backend', 'scalable', 'aws', 'azure']),
    platform: 'all',
    icon: '☁️',
    budget: 6000,
    status: 'active'
  },
  {
    id: 'camp_nordvpn',
    company: 'NordVPN',
    title: 'NordVPN — Secure Your AI Searches',
    description: 'Keep your AI conversations private. Military-grade encryption, 5000+ servers worldwide.',
    cta: 'Get 70% Off →',
    url: 'https://nordvpn.com',
    category: 'Security & Privacy',
    keywords: JSON.stringify(['vpn', 'privacy', 'security', 'encrypt', 'anonymous', 'browse', 'safe', 'protect', 'data', 'hack', 'password', 'online safety', 'network', 'firewall', 'malware', 'phishing']),
    platform: 'all',
    icon: '🛡️',
    budget: 8000,
    status: 'active'
  },
  {
    id: 'camp_grammarly',
    company: 'Grammarly',
    title: 'Grammarly AI — Write with Confidence',
    description: 'AI-powered writing assistant. Fix grammar, improve tone, and generate text across every app.',
    cta: 'Write Better →',
    url: 'https://grammarly.com',
    category: 'Writing & Communication',
    keywords: JSON.stringify(['grammar', 'writing', 'spell check', 'email', 'essay', 'blog', 'content', 'copywriting', 'proofread', 'tone', 'communication', 'english', 'translate', 'language', 'sentence', 'paragraph']),
    platform: 'all',
    icon: '✍️',
    budget: 4500,
    status: 'active'
  },
  {
    id: 'camp_promptmaster',
    company: 'PromptMaster Pro',
    title: 'PromptMaster Pro — Master AI Prompting',
    description: 'Learn to write perfect prompts for ChatGPT, Claude, and Midjourney. 500+ tested templates.',
    cta: 'Learn Prompting →',
    url: 'https://promptmaster.pro',
    category: 'AI & Education',
    keywords: JSON.stringify(['prompt', 'chatgpt', 'claude', 'midjourney', 'ai', 'artificial intelligence', 'machine learning', 'gpt', 'llm', 'openai', 'anthropic', 'gemini', 'bard', 'copilot', 'dall-e', 'stable diffusion', 'image generation', 'ai art']),
    platform: 'all',
    icon: '🧠',
    budget: 3000,
    status: 'active'
  }
];

// Seed default campaigns on startup
db.seedDefaultCampaigns(DEFAULT_CAMPAIGNS);

// Clean up expired sessions periodically
setInterval(() => {
  db.deleteExpiredSessions();
}, 60 * 60 * 1000); // Every hour

// ── Helper: strip password_hash from user object ────────────────────────

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

// ── Helper: match ad to query ───────────────────────────────────────────

function matchAd(query) {
  const campaigns = db.getCampaigns();
  const activeCampaigns = campaigns.filter(c => c.status === 'active');

  if (activeCampaigns.length === 0) return null;
  if (!query || query.trim() === '') {
    // Return random campaign if no query
    return activeCampaigns[Math.floor(Math.random() * activeCampaigns.length)];
  }

  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  let bestScore = 0;
  let bestCampaigns = [];

  for (const campaign of activeCampaigns) {
    let keywords = [];
    try {
      keywords = typeof campaign.keywords === 'string' ? JSON.parse(campaign.keywords) : (campaign.keywords || []);
    } catch {
      keywords = [];
    }

    let score = 0;
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      if (queryLower.includes(kw)) {
        score += kw.split(/\s+/).length; // Multi-word keywords score higher
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCampaigns = [campaign];
    } else if (score === bestScore && score > 0) {
      bestCampaigns.push(campaign);
    }
  }

  if (bestCampaigns.length > 0) {
    return bestCampaigns[Math.floor(Math.random() * bestCampaigns.length)];
  }

  // No keyword match — return random campaign
  return activeCampaigns[Math.floor(Math.random() * activeCampaigns.length)];
}

// ── Helper: set auth cookie ─────────────────────────────────────────────

function setAuthCookie(res, token) {
  res.cookie('auth_token', token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax',
    path: '/'
  });
}

// ── Helper: validate email format ───────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ═════════════════════════════════════════════════════════════════════════
//  PUBLIC ROUTES
// ═════════════════════════════════════════════════════════════════════════

const ADMIN_EMAIL = 'bhavy4018.21@gmail.com';

// ── Helper: Admin Verification Middleware ────────────────────────────────
function requireAdmin(req, res, next) {
  const token = req.cookies?.auth_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in as admin.' });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }

  const user = db.getUserById(decoded.userId);
  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied: You must be signed in as the administrator (bhavy4018.21@gmail.com).' });
  }

  req.adminUser = user;
  next();
}

// Public endpoint for businesses submitting an ad inquiry
app.post('/api/advertiser/inquiry', async (req, res) => {
  try {
    const { company, contact, email, url, budget, platform, keywords, goal } = req.body;

    if (!company || !email || !url || !budget) {
      return res.status(400).json({ error: 'Company name, work email, website URL, and budget are required.' });
    }

    const { Inquiry } = require('./mongo_models');
    const crypto = require('crypto');
    const id = 'inq_' + crypto.randomBytes(8).toString('hex');

    if (db.isMongo) {
      await Inquiry.create({
        id,
        company,
        contact: contact || company,
        email,
        url,
        budget,
        platform: platform || 'all',
        keywords: keywords || '',
        goal: goal || '',
        status: 'Pending Review',
        created_at: new Date().toISOString()
      });
    }

    console.log(`\n📬 NEW ADVERTISER INQUIRY from: ${company} (${email}) - Budget: ${budget}`);

    res.json({
      success: true,
      message: 'Inquiry submitted successfully. Our ad ops team will contact you shortly.'
    });
  } catch (err) {
    console.error('Inquiry error:', err);
    res.status(500).json({ error: 'Failed to record inquiry', details: err.message });
  }
});

// Admin Database Viewer API (Allows secret key OR admin email login)
app.get('/api/admin/database', (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.query.key;
  const SECRET_ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';
  
  // Check if query key matches
  if (adminKey === SECRET_ADMIN_KEY) {
    return serveDatabaseData(res);
  }

  // Alternatively check if signed in as admin email
  const token = req.cookies?.auth_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.userId) {
      const user = db.getUserById(decoded.userId);
      if (user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        return serveDatabaseData(res);
      }
    }
  }

  return res.status(403).json({ 
    error: 'Access denied: Please sign in as bhavy4018.21@gmail.com or enter your admin key.' 
  });
});

function serveDatabaseData(res) {
  try {
    const users = db.db.prepare('SELECT id, name, email, phone, balance, search_count, lifetime_earnings, created_at FROM users ORDER BY created_at DESC').all();
    const searches = db.db.prepare('SELECT id, user_id, query, platform, reward, ad_shown, timestamp FROM searches ORDER BY timestamp DESC LIMIT 50').all();
    const withdrawals = db.db.prepare('SELECT id, user_id, amount, method, account_details, status, requested_at FROM withdrawals ORDER BY requested_at DESC').all();
    const campaigns = db.getCampaigns();

    res.json({
      success: true,
      users,
      searches,
      withdrawals,
      campaigns
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read database', details: err.message });
  }
}

// Health check
app.get('/api/health', (req, res) => {
  try {
    const usersStmt = db.db.prepare('SELECT COUNT(*) as cnt FROM users');
    const userCount = usersStmt.get().cnt;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      userCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Health check failed', details: err.message });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // Validation
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check if email already exists
    const existing = db.getUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Create user
    const password_hash = await hashPassword(password);
    const user = db.createUser({
      email: email.toLowerCase().trim(),
      password_hash,
      name: name.trim(),
      phone: phone || null
    });

    // Generate token and set cookie
    const token = generateToken(user.id);
    setAuthCookie(res, token);

    // Store session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.createSession(user.id, token, expiresAt);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: sanitizeUser(user),
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create account', details: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last active
    db.updateLastActive(user.id);

    // Generate token and set cookie
    const token = generateToken(user.id);
    setAuthCookie(res, token);

    // Store session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.createSession(user.id, token, expiresAt);

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: sanitizeUser(user),
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (token) {
      db.deleteSession(token);
    }
    res.clearCookie('auth_token', { path: '/' });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
app.get('/api/auth/me', optionalAuth, (req, res) => {
  try {
    if (!req.user) {
      return res.json({ authenticated: false });
    }

    const user = db.getUserById(req.user.userId);
    if (!user) {
      return res.json({ authenticated: false });
    }

    db.updateLastActive(user.id);

    res.json({
      authenticated: true,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Auth check error:', err);
    res.status(500).json({ error: 'Auth check failed' });
  }
});

// ═════════════════════════════════════════════════════════════════════════
//  PROTECTED ROUTES
// ═════════════════════════════════════════════════════════════════════════

// Record a search and earn reward
app.post('/api/search/record', optionalAuth, (req, res) => {
  try {
    let { query, platform, userId } = req.body;
    
    // Priority: authenticated user from JWT token > passed userId
    if (req.user && req.user.userId) {
      userId = req.user.userId;
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID or active session is required' });
    }

    let user = db.getUserById(userId);
    // Auto-create guest user if using extension without account yet
    if (!user) {
      user = db.createUser({
        email: `${userId}@anonymous.local`,
        password_hash: 'anonymous',
        name: 'AI Searcher',
        phone: null
      });
      // Override id to match the extension's userId if desired, or use user.id
    }

    // Match an ad
    const ad = matchAd(query);
    const adShown = ad ? ad.id : null;

    // Increment ad impressions
    if (ad) {
      db.updateCampaign(ad.id, { impressions: (ad.impressions || 0) + 1 });
    }

    // Credit the reward
    const newBalance = user.balance + REWARD_PER_SEARCH;
    const newSearchCount = user.search_count + 1;
    const newLifetimeEarnings = user.lifetime_earnings + REWARD_PER_SEARCH;
    db.updateUserBalance(userId, newBalance, newSearchCount, newLifetimeEarnings);

    // Record the search
    db.recordSearch({
      userId,
      query: query || null,
      platform: platform || null,
      reward: REWARD_PER_SEARCH,
      adShown
    });

    // Update last active
    db.updateLastActive(userId);

    // Prepare ad response
    let adResponse = null;
    if (ad) {
      let keywords = [];
      try {
        keywords = typeof ad.keywords === 'string' ? JSON.parse(ad.keywords) : (ad.keywords || []);
      } catch { keywords = []; }

      adResponse = {
        id: ad.id,
        company: ad.company,
        title: ad.title,
        description: ad.description,
        cta: ad.cta,
        url: ad.url,
        category: ad.category,
        icon: ad.icon,
        keywords
      };
    }

    res.json({
      success: true,
      reward: REWARD_PER_SEARCH,
      newBalance,
      searchCount: newSearchCount,
      lifetimeEarnings: newLifetimeEarnings,
      ad: adResponse
    });
  } catch (err) {
    console.error('Search record error:', err);
    res.status(500).json({ error: 'Failed to record search', details: err.message });
  }
});

// Sync or fetch user for extension/client
app.post('/api/user/sync', optionalAuth, (req, res) => {
  try {
    let userId = req.user?.userId || req.body?.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let user = db.getUserById(userId);
    if (!user) {
      user = db.createUser({
        email: `${userId}@anonymous.local`,
        password_hash: 'anonymous',
        name: 'AI Searcher',
        phone: null
      });
    }

    const searches = db.getSearches(user.id, 20);
    const withdrawals = db.getWithdrawals(user.id);

    res.json({
      success: true,
      user: sanitizeUser(user),
      searches,
      withdrawals
    });
  } catch (err) {
    res.status(500).json({ error: 'Sync failed', details: err.message });
  }
});

// Record ad click
app.post('/api/ad/click', optionalAuth, (req, res) => {
  try {
    const { adId } = req.body;

    if (!adId) {
      return res.status(400).json({ error: 'Ad ID is required' });
    }

    const campaign = db.getCampaignById(adId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    db.updateCampaign(adId, { clicks: (campaign.clicks || 0) + 1 });

    res.json({ success: true, message: 'Click recorded' });
  } catch (err) {
    console.error('Ad click error:', err);
    res.status(500).json({ error: 'Failed to record click' });
  }
});

// Get user profile
app.get('/api/user/profile', authMiddleware, (req, res) => {
  try {
    const user = db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const searches = db.getSearches(user.id, 5);
    const withdrawals = db.getWithdrawals(user.id);

    const pendingWithdrawals = withdrawals.filter(w => w.status === 'Processing').reduce((sum, w) => sum + w.amount, 0);

    res.json({
      success: true,
      user: sanitizeUser(user),
      stats: {
        totalSearches: user.search_count,
        totalEarnings: user.lifetime_earnings,
        currentBalance: user.balance,
        pendingWithdrawals,
        recentSearches: searches.length
      },
      recentSearches: searches,
      withdrawals
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get search history
app.get('/api/user/searches', authMiddleware, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const searches = db.getSearches(req.user.userId, limit);
    res.json({ success: true, searches });
  } catch (err) {
    console.error('Searches error:', err);
    res.status(500).json({ error: 'Failed to fetch searches' });
  }
});

// Get withdrawal history
app.get('/api/user/withdrawals', authMiddleware, (req, res) => {
  try {
    const withdrawals = db.getWithdrawals(req.user.userId);
    res.json({ success: true, withdrawals });
  } catch (err) {
    console.error('Withdrawals error:', err);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// Request withdrawal
app.post('/api/withdrawal/request', authMiddleware, (req, res) => {
  try {
    const { method, accountDetails, amount } = req.body;
    const userId = req.user.userId;

    if (!method) {
      return res.status(400).json({ error: 'Withdrawal method is required' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balance < MIN_WITHDRAWAL) {
      return res.status(400).json({
        error: `Minimum withdrawal amount is $${MIN_WITHDRAWAL}. Your balance is $${user.balance.toFixed(4)}.`
      });
    }

    if (amount > user.balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create withdrawal and deduct balance
    const withdrawal = db.createWithdrawal({
      userId,
      amount,
      method,
      accountDetails: accountDetails || null
    });

    const newBalance = user.balance - amount;
    db.updateUserBalance(userId, newBalance, user.search_count, user.lifetime_earnings);

    res.json({
      success: true,
      message: 'Withdrawal request submitted',
      withdrawal,
      newBalance
    });
  } catch (err) {
    console.error('Withdrawal error:', err);
    res.status(500).json({ error: 'Failed to process withdrawal request' });
  }
});

// ═════════════════════════════════════════════════════════════════════════
//  ADVERTISER ROUTES
// ═════════════════════════════════════════════════════════════════════════

// List campaigns
app.get('/api/advertiser/campaigns', authMiddleware, (req, res) => {
  try {
    const campaigns = db.getCampaigns().map(c => {
      let keywords = [];
      try {
        keywords = typeof c.keywords === 'string' ? JSON.parse(c.keywords) : (c.keywords || []);
      } catch { keywords = []; }
      return { ...c, keywords };
    });
    res.json({ success: true, campaigns });
  } catch (err) {
    console.error('Campaigns list error:', err);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Create campaign
app.post('/api/advertiser/campaign', authMiddleware, (req, res) => {
  try {
    const campaign = db.createCampaign(req.body);
    res.status(201).json({ success: true, campaign });
  } catch (err) {
    console.error('Campaign create error:', err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign
app.patch('/api/advertiser/campaign/:id', authMiddleware, (req, res) => {
  try {
    const campaign = db.updateCampaign(req.params.id, req.body);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ success: true, campaign });
  } catch (err) {
    console.error('Campaign update error:', err);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign
app.delete('/api/advertiser/campaign/:id', authMiddleware, (req, res) => {
  try {
    const deleted = db.deleteCampaign(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (err) {
    console.error('Campaign delete error:', err);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// ═════════════════════════════════════════════════════════════════════════
//  DEV ROUTES
// ═════════════════════════════════════════════════════════════════════════

// Add test balance (dev only)
app.post('/api/dev/add-balance', authMiddleware, (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const user = db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newBalance = user.balance + amount;
    const newLifetimeEarnings = user.lifetime_earnings + amount;
    db.updateUserBalance(user.id, newBalance, user.search_count, newLifetimeEarnings);

    res.json({
      success: true,
      message: `Added $${amount} to balance`,
      newBalance,
      lifetimeEarnings: newLifetimeEarnings
    });
  } catch (err) {
    console.error('Add balance error:', err);
    res.status(500).json({ error: 'Failed to add balance' });
  }
});

// Reset user data (dev only)
app.post('/api/dev/reset', authMiddleware, (req, res) => {
  try {
    const userId = req.user.userId;
    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reset balance and search count
    db.updateUserBalance(userId, 0, 0, 0);

    // Delete user's searches
    db.db.prepare('DELETE FROM searches WHERE user_id = ?').run(userId);

    // Delete user's withdrawals
    db.db.prepare('DELETE FROM withdrawals WHERE user_id = ?').run(userId);

    res.json({
      success: true,
      message: 'User data reset successfully',
      user: sanitizeUser(db.getUserById(userId))
    });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Failed to reset user data' });
  }
});

// ═════════════════════════════════════════════════════════════════════════
//  START SERVER
// ═════════════════════════════════════════════════════════════════════════

db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 AI Search Ads server running on http://localhost:${PORT}`);
    console.log(`📦 Database: ${db.isMongo ? 'MongoDB Atlas Cloud' : 'Local SQLite (database.sqlite)'}`);
    console.log(`🔐 Admin Account: ${ADMIN_EMAIL}`);
    console.log(`💰 Reward per search: $${REWARD_PER_SEARCH}\n`);

    // Seed default campaigns if none exist
    db.seedDefaultCampaigns(DEFAULT_CAMPAIGNS);
  });
});

module.exports = app;
