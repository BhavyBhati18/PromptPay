# Privacy Policy - AI Search & Earn Chrome Extension

**Last Updated**: September 8, 2026

AI Search & Earn ("the Extension", "we", "our", or "us") is dedicated to protecting your privacy and being transparent about our data practices. This Privacy Policy details the types of information we collect, how it is used, and how your data is safeguarded when you use our Chrome Extension.

---

## 1. Single Purpose & Description

The single purpose of the Extension is to reward users with micropayments ($0.0003 per query) for conducting searches on AI platforms (specifically ChatGPT and Google Gemini) while displaying relevant, sponsored recommendations from vetted advertisers.

---

## 2. Information We Collect

### A. Non-Personally Identifiable Information (Non-PII)
- **Search Intent & Topic Keywords**: When you submit a prompt on supported AI platforms (`chatgpt.com`, `gemini.google.com`), the content script reads the active prompt text solely to:
  1. Detect that a legitimate search interaction occurred to credit your balance ($0.0003).
  2. Match relevant sponsored campaign keywords (e.g. queries about coding will match developer tools; queries about writing will match productivity apps).
- **Aggregate Ad Metrics**: Impression counts and click counts on sponsored ads are aggregated to bill advertisers.

### B. Account & Payout Information (User-Provided)
- When requesting a withdrawal once you reach the $10.00 minimum threshold, you voluntarily provide payout recipient information:
  - PayPal email address,
  - USDT crypto wallet address, or
  - Bank transfer details.
- This information is used exclusively to fulfill the payment request and is never shared, sold, or rented to third-party data brokers.

### C. Technical Identifiers
- An anonymous, randomly generated User UUID (`usr_...`) is created locally in your browser to maintain your wallet balance, search count, and transaction history.

---

## 3. What We DO NOT Collect
- We **NEVER** collect personal passwords, credit card numbers, browsing history outside of the designated AI domains, or personal private messages.
- We **NEVER** sell or monetize your browsing history.
- We **NEVER** use external tracking scripts or analytics cookies inside ChatGPT or Gemini.

---

## 4. Permissions Disclosure & Justification

| Permission | Justification |
| :--- | :--- |
| `storage` | Required to store your wallet balance, search count, and payout preferences locally and securely. |
| `tabs` | Required to allow opening the Advertiser Hub and withdrawal confirmation pages in a new tab. |
| `host_permissions` (`*://chatgpt.com/*`, `*://gemini.google.com/*`) | Required to detect search submissions on supported AI platforms and render the non-intrusive sponsored ad card and reward toast. |

---

## 5. Data Security

We implement industry-standard encryption and security protocols to safeguard all communications between the Chrome Extension and our backend API (`https://...`). Payout details are encrypted and stored solely for transaction fulfillment and fraud prevention.

---

## 6. Children's Privacy

The Extension does not knowingly solicit or collect data from individuals under 13 years of age.

---

## 7. Contact Us

If you have questions regarding this Privacy Policy or your data, please contact our support team at:
- **Email**: privacy@aisearchearn.com
- **Website**: https://aisearchearn.com
