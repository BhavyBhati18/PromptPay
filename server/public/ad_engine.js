/**
 * AI Search Ads - Ad Engine & Inventory Manager
 * Handles default campaigns, smart query keyword matching, and campaign metrics.
 */

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
    budget: 50.00,
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
    category: "Productivity",
    keywords: ["write", "writing", "note", "notes", "summary", "summarize", "organize", "essay", "docs", "project", "meeting"],
    platform: "all",
    icon: "📝",
    impressions: 0,
    clicks: 0,
    budget: 80.00,
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
    budget: 100.00,
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
    category: "Security",
    keywords: ["vpn", "privacy", "security", "protect", "ip", "safe", "crypto", "wifi", "browse", "hack"],
    platform: "all",
    icon: "🛡️",
    impressions: 0,
    clicks: 0,
    budget: 120.00,
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
    category: "Writing",
    keywords: ["grammar", "spell", "email", "essay", "english", "proofread", "resume", "letter", "sentence", "text"],
    platform: "all",
    icon: "✍️",
    impressions: 0,
    clicks: 0,
    budget: 65.00,
    spent: 0.00,
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "ad-midjourney-course",
    company: "PromptMaster Pro",
    title: "Master AI Image Generation",
    description: "Step-by-step masterclass on Midjourney, Stable Diffusion, and Gemini Vision prompt engineering.",
    cta: "Start Learning",
    url: "https://www.promptmaster.io",
    category: "AI & Design",
    keywords: ["image", "art", "photo", "midjourney", "design", "drawing", "picture", "logo", "graphic", "generate image"],
    platform: "all",
    icon: "🎨",
    impressions: 0,
    clicks: 0,
    budget: 45.00,
    spent: 0.00,
    status: "active",
    createdAt: new Date().toISOString()
  }
];

class AdEngine {
  /**
   * Selects an ad from the list based on query keyword matching and platform.
   * @param {Array} campaigns - Array of campaign objects
   * @param {string} query - The user's search / prompt text
   * @param {string} platform - "chatgpt" or "gemini"
   * @returns {Object|null} Selected ad
   */
  static matchAd(campaigns, query = "", platform = "chatgpt") {
    if (!campaigns || campaigns.length === 0) {
      campaigns = DEFAULT_CAMPAIGNS;
    }

    // Filter active campaigns eligible for this platform
    const active = campaigns.filter(c => {
      if (c.status !== "active") return false;
      if (c.budget && c.spent >= c.budget) return false;
      if (c.platform && c.platform !== "all" && c.platform !== platform) return false;
      return true;
    });

    if (active.length === 0) {
      // Fallback: pick any active from default campaigns
      return DEFAULT_CAMPAIGNS[0];
    }

    // Keyword relevance scoring
    const normalizedQuery = (query || "").toLowerCase();
    const scored = active.map(ad => {
      let score = 1; // base score
      if (ad.keywords && Array.isArray(ad.keywords)) {
        for (const kw of ad.keywords) {
          if (normalizedQuery.includes(kw.toLowerCase())) {
            score += 5;
          }
        }
      }
      return { ad, score };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Pick among the top tier with weighted randomness
    const topScore = scored[0].score;
    const topCandidates = scored.filter(s => s.score >= topScore);
    const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)].ad;

    return chosen;
  }
}

// Export for ES modules / service worker and browser environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFAULT_CAMPAIGNS, AdEngine };
}
