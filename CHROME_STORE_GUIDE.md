# Chrome Web Store Submission & Publishing Guide

This guide details step-by-step how to publish your **AI Search & Earn** extension to the official **Google Chrome Web Store**.

---

## 1. Prerequisites

1. **Google Developer Account**:
   - Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
   - Sign in with your Google account.
   - Pay the one-time \$5 USD registration fee (required by Google).

2. **Your Extension Package**:
   - The production ZIP package is already generated and verified at:
     ```
     extension/dist/ai-search-ads-v1.0.0.zip
     ```
   - If you ever make changes to code, regenerate it anytime with:
     ```bash
     npm run package
     ```

---

## 2. Uploading the Extension

1. On the [Developer Dashboard](https://chrome.google.com/webstore/devconsole), click the **"Add new item"** button (top right).
2. Drag and drop `dist/ai-search-ads-v1.0.0.zip` or click browse.
3. Chrome will validate the package and open the **Store Listing** editor.

---

## 3. Store Listing Information (Copy & Paste)

### Item Details
- **Name**: `AI Search & Earn - ChatGPT & Gemini Rewards`
- **Summary / Short Description** *(Max 132 characters)*:
  ```
  Earn $0.0003 for every search on ChatGPT and Gemini. Withdraw earnings at $10.00 to PayPal or Crypto.
  ```
- **Category**: `Productivity` or `Search Tools`
- **Language**: `English`

### Detailed Description (Markdown / Plain Text)
```text
AI Search & Earn pays you micropayments every time you search and chat with AI!

🌟 HOW IT WORKS:
1. Conduct your everyday prompts and searches on ChatGPT (chatgpt.com) or Google Gemini (gemini.google.com).
2. Automatically earn $0.0003 for every valid search prompt you submit.
3. Discover non-intrusive, relevant sponsored tools and special offers tailored to your query topic.
4. Watch your earnings grow in the real-time dashboard progress bar.
5. Reach the $10.00 threshold and withdraw your funds directly to PayPal, USDT (Crypto), or Bank Transfer!

📢 FOR COMPANIES & ADVERTISERS:
List your product or SaaS tool on the AI Search Ads marketplace to connect directly with active AI users based on search keywords.

🔒 PRIVACY & SECURITY:
We respect your privacy. No personal conversations, private data, or passwords are ever stored or sold. Only prompt query intent is processed to award your micropayments and pair relevant sponsor tools.
```

---

## 4. Privacy Tab (Crucial for Google Approval)

Google's review team checks the **Privacy** tab very strictly. Use the exact declarations below:

### Single Purpose Description
```text
The single purpose of this extension is to award users $0.0003 micropayments for searches conducted on ChatGPT and Google Gemini while presenting relevant sponsored ad recommendations based on query topic.
```

### Permission Justifications

1. **Host Permissions (`*://chatgpt.com/*`, `*://chat.openai.com/*`, `*://gemini.google.com/*`)**:
   ```text
   Required to detect prompt submission events inside ChatGPT and Google Gemini interfaces to credit the $0.0003 search reward and render the non-intrusive sponsored ad card and reward toast.
   ```

2. **Storage Permission (`storage`)**:
   ```text
   Required to locally save the user's earnings balance, total search counter, payout history, and cached advertiser campaigns.
   ```

3. **Tabs Permission (`tabs`)**:
   ```text
   Required to allow users and advertisers to open the Advertiser Hub and withdrawal confirmation tabs directly from the popup.
   ```

### Data Usage Disclosures
- **User Activity**: Select *"Yes, the extension collects search queries"*.
  - Justification: *"Queries on ChatGPT/Gemini are read solely to confirm search submission for crediting micropayments and matching sponsor keywords."*
- **Personal Information**: Check *"Authentication / payment info"* (if withdrawing).
  - Justification: *"User voluntarily submits PayPal email or wallet address solely to fulfill withdrawal requests."*

### Privacy Policy URL
- You can host the provided [privacy_policy.html](file:///c:/Users/amita/OneDrive/Apps/Desktop/extension/privacy_policy.html) for free on **GitHub Pages**, **Netlify**, or your company website.
- Enter the public URL into the **"Privacy policy"** field.

---

## 5. Graphic Assets

To publish, Google requires:
1. **Store Icon**: 128x128 PNG (provided at `icons/icon128.png`).
2. **Screenshots**: At least 1 screenshot (1280x800 px or 640x400 px PNG/JPEG).
   - Take a screenshot of the ChatGPT/Gemini interface with the green `+$0.0003 Earned!` toast and sponsored ad card.
   - Take a screenshot of the popup dashboard showing the balance progress bar.
   - Take a screenshot of the Advertiser Hub.
3. **Small Promo Tile**: 440x280 px PNG.

---

## 6. Submit for Review

1. Double-check all fields.
2. Click **"Submit for review"**.
3. Google reviews standard Manifest V3 extensions in **24 to 72 hours**. Once approved, your extension will be live for everyone on the Chrome Web Store!
