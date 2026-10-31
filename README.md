# AI Search & Earn - Chrome Extension & Backend System

A complete Google Chrome Extension (Manifest V3) with a **real persistent backend** (Node.js/Express) that pays users **\$0.0003 for every search** submitted on **ChatGPT** and **Google Gemini**, shows relevant sponsored ads, provides a withdrawal system upon reaching **\$10.00**, and includes an **Advertiser Portal** where companies can list, manage, and track their ad campaigns.

---

## 🌟 Architecture & Features

```
ai-search-ads-system/
├── dist/                              # Production Chrome Web Store ZIP distribution
│   ├── ai-search-ads-v1.0.0.zip       # Upload-ready bundle
│   └── unpacked/                      # Clean unpacked extension folder
├── server/                            # Real Node.js / Express Backend Server
│   ├── index.js                       # REST API (balance, search reward, withdrawals)
│   ├── db.js                          # Persistent database (users, campaigns, transactions)
│   ├── test_api.js                    # Automated test suite (9 tests)
│   └── package.json                   # Server dependencies (Express, CORS, dotenv)
├── scripts/
│   └── package.js                     # Chrome Web Store automated packager
├── manifest.json                      # Manifest V3 configuration
├── background.js                      # Background worker with live API sync & offline fallback
├── content.js                         # Search detection on ChatGPT & Gemini + ad injection
├── content.css                        # Injected floating ad card & reward toast styles
├── popup.html / css / js              # User wallet dashboard, progress bar, & $10 withdrawal modal
├── advertiser_portal.html / css / js  # Full-page Advertiser Hub for companies to list ads
├── ad_engine.js                       # Keyword matching algorithm & ad catalog
├── privacy_policy.html / .md          # Required Chrome Web Store privacy documentation
├── CHROME_STORE_GUIDE.md              # Complete store submission copy & paste guide
└── package.json                       # Top-level commands
```

---

## 🚀 Quick Start: Running the Backend Server

To start the real backend API:

```bash
# 1. Start the server (runs on http://localhost:3000)
npm run start:server
```

To run the automated backend test suite:
```bash
npm run test:server
```

### Backend API Endpoints

- `GET  /api/health` — API health status.
- `POST /api/user/sync` — Synchronizes user wallet balance and history.
- `POST /api/search/record` — Validates query, credits **\$0.0003**, matches relevant ad, records impressions.
- `POST /api/ad/click` — Increments ad clicks and tracks CTR.
- `POST /api/withdrawal/request` — Enforces **\$10.00** minimum threshold, logs transaction.
- `GET  /api/withdrawal/history/:userId` — Retrieves user withdrawal history.
- `GET  /api/advertiser/campaigns` — Returns active campaigns and analytics.
- `POST /api/advertiser/campaign` — Publishes or updates an ad campaign.
- `PATCH /api/advertiser/campaign/:id/toggle` — Toggles campaign active/paused.
- `DELETE /api/advertiser/campaign/:id` — Removes an ad campaign.

---

## 💻 Installing the Extension in Google Chrome

1. Open **Google Chrome** and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **"Load unpacked"** (button in top-left).
4. Select the project folder:
   ```
   c:\Users\amita\OneDrive\Apps\Desktop\extension
   ```
   *(or `extension/dist/unpacked` for the pre-built clean package).*
5. Pin **"AI Search & Earn"** to your Chrome toolbar.

---

## 📦 Building the Chrome Web Store Distribution Package

To compile and package a clean production ZIP ready for submission to the Chrome Web Store Developer Dashboard:

```bash
npm run package
```

This runs pre-flight security checks, verifies Manifest V3 and icon specs, and outputs:
```
dist/ai-search-ads-v1.0.0.zip
```

Follow the complete submission walkthrough in [CHROME_STORE_GUIDE.md](file:///c:/Users/amita/OneDrive/Apps/Desktop/extension/CHROME_STORE_GUIDE.md) for fill-in-the-blank text, permission justifications, and store listing instructions.
