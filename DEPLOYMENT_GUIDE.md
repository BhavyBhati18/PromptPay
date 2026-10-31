# Cloud Deployment Guide — AI Search Ads & PromptPay

Your project is now powered by **MongoDB Atlas Cloud Database**.
This means your database lives permanently in the cloud and automatically scales to millions of users!

---

## ⚠️ Important Architecture Note: Netlify vs Backend

- **Netlify**: Best for hosting static frontend websites (HTML/CSS/JS). Netlify cannot run a persistent Node.js Express server.
- **Render.com / Railway.app**: The recommended free cloud hosts for your Node.js backend.

---

## Step 1: Deploy the Backend to Render.com (100% Free)

1. Create a free account at [https://render.com](https://render.com).
2. Push your project folder to a GitHub repository.
3. In Render, click **"New +"** → **"Web Service"**.
4. Connect your GitHub repository.
5. Set the settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Free ($0/month)
6. Under **Environment Variables**, add:
   - `MONGO_URI`: `mongodb+srv://bhavy401821_db_user:uPNx4KtKOAYLcdar@cluster0.q8e1kyh.mongodb.net/promptpay?retryWrites=true&w=majority`
   - `JWT_SECRET`: `promptpay_production_secret_key_849203492348`
   - `ADMIN_EMAIL`: `bhavy4018.21@gmail.com`
   - `ADMIN_KEY`: `admin123`
7. Click **"Deploy Web Service"**.
8. Render will give you a live URL, e.g.:
   `https://ai-search-ads.onrender.com`

---

## Step 2: Update the Chrome Extension API Base URL

Once your backend is live on Render:
1. Open `extension/background.js`
2. Change line 9 from:
   ```js
   const API_BASE = "http://localhost:3000/api";
   ```
   To your live Render URL:
   ```js
   const API_BASE = "https://your-service-name.onrender.com/api";
   ```
3. Run `npm run package` in the extension root to generate the production ZIP ready for the Chrome Web Store!
