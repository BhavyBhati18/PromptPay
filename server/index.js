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
    id: 'camp_safarnamma',
    company: 'Safarnamma',
    title: 'Safarnamma — Curated Group Trips & Backpacking Journeys',
    description: 'Discover offbeat destinations, community backpacking adventures, and boutique group travel across the world.',
    cta: 'Explore Trips →',
    url: 'https://safarnamma.com',
    category: 'Travel & Hospitality',
    keywords: JSON.stringify(['travel', 'travelling', 'traveling', 'trip', 'trips', 'tour', 'tours', 'itinerary', 'vacation', 'holiday', 'hotel', 'flights', 'flight', 'backpacking', 'destinations', 'wanderlust', 'journey', 'explore']),
    platform: 'all',
    icon: 'safarnamma_logo.jpeg',
    budget: 5000,
    status: 'active'
  },
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

async function matchAd(query) {
  const campaigns = await db.getCampaigns();
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
async function requireAdmin(req, res, next) {
  const token = req.cookies?.auth_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in as admin.' });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }

  const user = await db.getUserById(decoded.userId);
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
app.get('/api/admin/database', async (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.query.key;
  const SECRET_ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';
  
  // Check if query key matches
  if (adminKey === SECRET_ADMIN_KEY) {
    return await serveDatabaseData(res);
  }

  // Alternatively check if signed in as admin email
  const token = req.cookies?.auth_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.userId) {
      const user = await db.getUserById(decoded.userId);
      if (user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        return await serveDatabaseData(res);
      }
    }
  }

  return res.status(403).json({ 
    error: 'Access denied: Please sign in as bhavy4018.21@gmail.com or enter your admin key.' 
  });
});

async function serveDatabaseData(res) {
  try {
    const users = await db.getAllUsers();
    const searches = await db.getAllSearches(50);
    const withdrawals = await db.getAllWithdrawals();
    const campaigns = await db.getCampaigns();
    
    let inquiries = [];
    if (db.isMongo) {
      const { Inquiry } = require('./mongo_models');
      inquiries = await Inquiry.find().sort({ created_at: -1 }).lean();
    }

    res.json({
      success: true,
      users,
      searches,
      withdrawals,
      campaigns,
      inquiries
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read database', details: err.message });
  }
}

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'DEFAULT_USED';
    res.json({
      status: 'ok',
      database: db.isMongo ? 'MongoDB Atlas' : 'Local SQLite',
      mongoError: db.mongoError,
      uriSource: uri.startsWith('mongodb') ? 'QueryPay' : uri,
      timestamp: new Date().toISOString(),
      userCount: users ? users.length : 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Health check failed', details: err.message });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone, promoCode } = req.body;

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
    const existing = await db.getUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Promo code validation: INDIA5 adds $5.00 signup bonus
    const cleanPromo = (promoCode || '').trim().toUpperCase();
    let initialBalance = 0.0000;
    let promoApplied = false;

    if (cleanPromo === 'INDIA5') {
      initialBalance = 5.0000;
      promoApplied = true;
    }

    // Create user
    const password_hash = await hashPassword(password);
    const user = await db.createUser({
      email: email.toLowerCase().trim(),
      password_hash,
      name: name.trim(),
      phone: phone || null,
      balance: initialBalance,
      lifetime_earnings: initialBalance
    });

    // Generate token and set cookie
    const token = generateToken(user.id);
    setAuthCookie(res, token);

    // Store session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.createSession(user.id, token, expiresAt);

    res.status(201).json({
      success: true,
      message: promoApplied
        ? 'Account created with $5.00 Welcome Bonus (INDIA5 applied)!'
        : 'Account created successfully',
      promoApplied,
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

    const cleanEmail = email.toLowerCase().trim();
    let user = await db.getUserByEmail(cleanEmail);

    // Guaranteed Admin Master Login: auto-provision if not found
    if (cleanEmail === ADMIN_EMAIL.toLowerCase() && password === 'Bhavy@2007') {
      if (!user) {
        const password_hash = await hashPassword('Bhavy@2007');
        user = await db.createUser({
          email: ADMIN_EMAIL,
          password_hash,
          name: 'Admin Bhavya'
        });
      } else {
        const valid = await comparePassword(password, user.password_hash);
        if (!valid) {
          const password_hash = await hashPassword('Bhavy@2007');
          if (db.isMongo) {
            const { User } = require('./mongo_models');
            await User.updateOne({ email: ADMIN_EMAIL }, { $set: { password_hash } });
          } else if (db.db) {
            db.db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(password_hash, ADMIN_EMAIL);
          }
          user.password_hash = password_hash;
        }
      }
    } else {
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const valid = await comparePassword(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    // Update last active
    await db.updateLastActive(user.id);

    // Generate token and set cookie
    const token = generateToken(user.id);
    setAuthCookie(res, token);

    // Store session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.createSession(user.id, token, expiresAt);

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
app.get('/api/auth/me', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ authenticated: false });
    }

    const user = await db.getUserById(req.user.userId);
    if (!user) {
      return res.json({ authenticated: false });
    }

    await db.updateLastActive(user.id);

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
app.post('/api/search/record', optionalAuth, async (req, res) => {
  try {
    let { query, platform, userId } = req.body;
    
    // Priority: authenticated user from JWT token > passed userId
    if (req.user && req.user.userId) {
      userId = req.user.userId;
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID or active session is required' });
    }

    let user = await db.getUserById(userId);
    // Auto-create guest user if using extension without account yet
    if (!user) {
      user = await db.getUserByEmail(`${userId}@anonymous.local`);
      if (!user) {
        user = await db.createUser({
          id: userId,
          email: `${userId}@anonymous.local`,
          password_hash: 'anonymous',
          name: 'AI Searcher',
          phone: null
        });
      }
    }

    // Match an ad
    const ad = await matchAd(query);
    const adShown = ad ? ad.id : null;

    // Increment ad impressions
    if (ad) {
      await db.updateCampaign(ad.id, { impressions: (ad.impressions || 0) + 1 });
    }

    // Credit the reward
    const newBalance = user.balance + REWARD_PER_SEARCH;
    const newSearchCount = user.search_count + 1;
    const newLifetimeEarnings = user.lifetime_earnings + REWARD_PER_SEARCH;
    await db.updateUserBalance(userId, newBalance, newSearchCount, newLifetimeEarnings);

    // Record the search
    await db.recordSearch({
      userId,
      query: query || null,
      platform: platform || null,
      reward: REWARD_PER_SEARCH,
      adShown
    });

    // Update last active
    await db.updateLastActive(userId);

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
app.post('/api/user/sync', optionalAuth, async (req, res) => {
  try {
    let userId = req.user?.userId || req.body?.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let user = await db.getUserById(userId);
    if (!user) {
      user = await db.getUserByEmail(`${userId}@anonymous.local`);
      if (!user) {
        user = await db.createUser({
          id: userId,
          email: `${userId}@anonymous.local`,
          password_hash: 'anonymous',
          name: 'AI Searcher',
          phone: null
        });
      }
    }

    const searches = await db.getSearches(user.id, 20);
    const withdrawals = await db.getWithdrawals(user.id);

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
app.post('/api/ad/click', optionalAuth, async (req, res) => {
  try {
    const { adId } = req.body;

    if (!adId) {
      return res.status(400).json({ error: 'Ad ID is required' });
    }

    const campaign = await db.getCampaignById(adId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await db.updateCampaign(adId, { clicks: (campaign.clicks || 0) + 1 });

    res.json({ success: true, message: 'Click recorded' });
  } catch (err) {
    console.error('Ad click error:', err);
    res.status(500).json({ error: 'Failed to record click' });
  }
});

// Get user profile
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const searches = await db.getSearches(user.id, 5);
    const withdrawals = await db.getWithdrawals(user.id);

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
app.get('/api/user/searches', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const searches = await db.getSearches(req.user.userId, limit);
    res.json({ success: true, searches });
  } catch (err) {
    console.error('Searches error:', err);
    res.status(500).json({ error: 'Failed to fetch searches' });
  }
});

// Get withdrawal history
app.get('/api/user/withdrawals', authMiddleware, async (req, res) => {
  try {
    const withdrawals = await db.getWithdrawals(req.user.userId);
    res.json({ success: true, withdrawals });
  } catch (err) {
    console.error('Withdrawals error:', err);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// Request withdrawal
app.post('/api/withdrawal/request', optionalAuth, async (req, res) => {
  try {
    const { method, accountDetails, amount } = req.body;
    let userId = req.user?.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!method) {
      return res.status(400).json({ error: 'Withdrawal method is required' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    let user = await db.getUserById(userId);
    if (!user) {
      user = await db.getUserByEmail(`${userId}@anonymous.local`);
      if (!user) {
        user = await db.createUser({
          id: userId,
          email: `${userId}@anonymous.local`,
          password_hash: 'anonymous',
          name: 'AI Searcher',
          phone: null,
          balance: amount,
          lifetime_earnings: amount
        });
      }
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
    const withdrawal = await db.createWithdrawal({
      userId: user.id,
      amount,
      method,
      accountDetails: accountDetails || null
    });

    const newBalance = Math.max(0, user.balance - amount);
    await db.updateUserBalance(user.id, newBalance, user.search_count || 0, user.lifetime_earnings || amount);

    console.log(`\n💰 WITHDRAWAL REQUEST RECEIVED:`);
    console.log(`   User: ${user.name || user.email} (${user.id})`);
    console.log(`   Amount: $${Number(amount).toFixed(2)} USD`);
    console.log(`   Method: ${method}`);
    console.log(`   Account: ${accountDetails}`);
    console.log(`   New Balance: $${Number(newBalance).toFixed(4)}\n`);

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

// Update withdrawal status (Mark Completed / Processing / Rejected)
app.patch('/api/admin/withdrawal/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'Completed' } = req.body;
    const adminKey = req.headers['x-admin-key'] || req.query.key;
    const SECRET_ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';

    // Allow via admin key or admin session
    let isAuthorized = (adminKey === SECRET_ADMIN_KEY);
    if (!isAuthorized) {
      const token = req.cookies?.auth_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
      if (token) {
        const decoded = verifyToken(token);
        if (decoded?.userId) {
          const user = await db.getUserById(decoded.userId);
          if (user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            isAuthorized = true;
          }
        }
      }
    }

    // Also allow for local admin / localhost dashboard requests
    const clientIp = req.ip || req.connection?.remoteAddress || '';
    if (clientIp.includes('127.0.0.1') || clientIp.includes('::1')) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Unauthorized to update withdrawal status' });
    }

    const updated = await db.updateWithdrawalStatus(id, status);
    console.log(`\n✅ WITHDRAWAL STATUS UPDATED: ${id} -> ${status}`);
    res.json({ success: true, message: `Withdrawal marked as ${status}`, withdrawal: updated });
  } catch (err) {
    console.error('Update withdrawal status error:', err);
    res.status(500).json({ error: 'Failed to update withdrawal status' });
  }
});

// ═════════════════════════════════════════════════════════════════════════
//  ADVERTISER ROUTES
// ═════════════════════════════════════════════════════════════════════════

// List campaigns
app.get('/api/advertiser/campaigns', optionalAuth, async (req, res) => {
  try {
    const allCampaigns = await db.getCampaigns();
    const campaigns = allCampaigns.map(c => {
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
app.post('/api/advertiser/campaign', optionalAuth, async (req, res) => {
  try {
    const campaign = await db.createCampaign(req.body);
    res.status(201).json({ success: true, campaign });
  } catch (err) {
    console.error('Campaign create error:', err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Toggle or update campaign status (Active / Paused / Completed)
app.patch('/api/advertiser/campaign/:id/toggle', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const campaign = await db.getCampaignById(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    let newStatus = status;
    if (!newStatus) {
      newStatus = campaign.status === 'active' ? 'paused' : 'active';
    }

    const updated = await db.updateCampaign(id, { status: newStatus });
    console.log(`\n📢 CAMPAIGN STATUS UPDATED: ${id} -> ${newStatus}`);
    res.json({ success: true, campaign: updated, newStatus });
  } catch (err) {
    console.error('Campaign toggle error:', err);
    res.status(500).json({ error: 'Failed to toggle campaign status' });
  }
});

// Update campaign
app.patch('/api/advertiser/campaign/:id', optionalAuth, async (req, res) => {
  try {
    const campaign = await db.updateCampaign(req.params.id, req.body);
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
app.delete('/api/advertiser/campaign/:id', optionalAuth, async (req, res) => {
  try {
    const deleted = await db.deleteCampaign(req.params.id);
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
app.post('/api/dev/add-balance', optionalAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    let userId = req.user?.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    let user = await db.getUserById(userId);
    if (!user) {
      user = await db.getUserByEmail(`${userId}@anonymous.local`);
      if (!user) {
        user = await db.createUser({
          id: userId,
          email: `${userId}@anonymous.local`,
          password_hash: 'anonymous',
          name: 'AI Searcher',
          phone: null,
          balance: 0,
          lifetime_earnings: 0
        });
      }
    }

    const newBalance = (user.balance || 0) + amount;
    const newLifetimeEarnings = (user.lifetime_earnings || 0) + amount;
    await db.updateUserBalance(user.id, newBalance, user.search_count || 0, newLifetimeEarnings);

    res.json({
      success: true,
      message: `Added $${amount} to balance`,
      user: sanitizeUser({ ...user, balance: newBalance, lifetime_earnings: newLifetimeEarnings }),
      newBalance,
      lifetimeEarnings: newLifetimeEarnings
    });
  } catch (err) {
    console.error('Add balance error:', err);
    res.status(500).json({ error: 'Failed to add balance' });
  }
});

// Reset user data (dev only)
app.post('/api/dev/reset', optionalAuth, async (req, res) => {
  try {
    let userId = req.user?.userId || req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reset balance and search count
    await db.updateUserBalance(user.id, 0, 0, 0);

    if (db.isMongo) {
      const { Search, Withdrawal } = require('./mongo_models');
      await Search.deleteMany({ user_id: user.id });
      await Withdrawal.deleteMany({ user_id: user.id });
    } else if (db.db) {
      // Delete user's searches
      db.db.prepare('DELETE FROM searches WHERE user_id = ?').run(user.id);
      // Delete user's withdrawals
      db.db.prepare('DELETE FROM withdrawals WHERE user_id = ?').run(user.id);
    }

    res.json({ success: true, message: 'User data reset' });
  } catch (err) {
    console.error('Dev reset error:', err);
    res.status(500).json({ error: 'Failed to reset data' });
  }
});

// ═════════════════════════════════════════════════════════════════════════
//  START SERVER
// ═════════════════════════════════════════════════════════════════════════

db.init().then(async () => {
  app.listen(PORT, async () => {
    console.log(`\n🚀 AI Search Ads server running on http://localhost:${PORT}`);
    console.log(`📦 Database: ${db.isMongo ? 'MongoDB Atlas Cloud' : 'Local SQLite (database.sqlite)'}`);
    console.log(`🔐 Admin Account: ${ADMIN_EMAIL}`);
    console.log(`💰 Reward per search: $${REWARD_PER_SEARCH}\n`);

    // Automatically seed admin user if not exists
    try {
      const admin = await db.getUserByEmail(ADMIN_EMAIL);
      if (!admin) {
        const password_hash = await hashPassword('Bhavy@2007');
        await db.createUser({
          email: ADMIN_EMAIL,
          password_hash,
          name: 'Admin Bhavya'
        });
        console.log(`✅ Admin account seeded: ${ADMIN_EMAIL}`);
      }
    } catch (e) {
      console.warn('Admin seed warning:', e.message);
    }

    // Seed default campaigns if none exist
    db.seedDefaultCampaigns(DEFAULT_CAMPAIGNS);
  });
});

module.exports = app;
