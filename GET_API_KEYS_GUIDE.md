# 🔑 API Keys Setup Guide - Step by Step

## 1️⃣ NewsAPI (Primary News Source)
**Website**: https://newsapi.org/register

### Steps:
1. Go to https://newsapi.org/register
2. Fill out the registration form:
   - First Name: Your first name
   - Last Name: Your last name  
   - Email: Your email address
   - Password: Create a strong password
3. Click "Get API Key"
4. Verify your email address
5. Login to your dashboard
6. Copy your API key from the dashboard
7. **Free Plan**: 1,000 requests/day, 500 requests/month for development

---

## 2️⃣ GNews API (Secondary News Source)
**Website**: https://gnews.io/

### Steps:
1. Go to https://gnews.io/
2. Click "Get API Key" or "Sign Up"
3. Fill out the registration:
   - Email: Your email address
   - Password: Create a password
4. Verify your email
5. Login to your dashboard
6. Copy your API token
7. **Free Plan**: 100 requests/day

---

## 3️⃣ Alpha Vantage (Forex & Stock Data)
**Website**: https://www.alphavantage.co/support/#api-key

### Steps:
1. Go to https://www.alphavantage.co/support/#api-key
2. Fill out the form:
   - First Name: Your first name
   - Last Name: Your last name
   - Email: Your email address
   - Organization: Can put "Personal" or your company
3. Click "GET FREE API KEY"
4. Check your email for the API key
5. **Free Plan**: 25 requests/day, 5 requests/minute

---

## 4️⃣ Financial Modeling Prep (Stock Market Data)
**Website**: https://financialmodelingprep.com/developer/docs

### Steps:
1. Go to https://financialmodelingprep.com/developer/docs
2. Click "Get API Key" or "Sign Up"
3. Create account:
   - Email: Your email address
   - Password: Create a password
   - Confirm password
4. Verify your email
5. Login to dashboard
6. Go to "API Keys" section
7. Copy your API key
8. **Free Plan**: 250 requests/day

---

## 🚀 Quick Setup Commands

Once you have all 4 API keys, update your `.env` file:

```bash
# Navigate to backend directory
cd backend

# Edit the .env file and add your keys:
NEWSAPI_KEY=your-newsapi-key-here
GNEWS_API_KEY=your-gnews-token-here  
ALPHA_VANTAGE_KEY=your-alphavantage-key-here
FMP_API_KEY=your-fmp-key-here
```

## 📝 Example .env Entry
```
NEWSAPI_KEY=abc123def456ghi789
GNEWS_API_KEY=xyz789uvw456rst123
ALPHA_VANTAGE_KEY=DEMO123456789
FMP_API_KEY=demo123456789abcdef
```

## ✅ Test Your Setup
After adding the keys, restart your server and test:
```bash
npm run dev-simple
```

Then visit: http://localhost:3000 → Click "News & Markets"

---

## 🆘 Need Help?
- **NewsAPI Issues**: Check https://newsapi.org/docs
- **GNews Issues**: Check https://gnews.io/docs  
- **Alpha Vantage Issues**: Check https://www.alphavantage.co/documentation/
- **FMP Issues**: Check https://financialmodelingprep.com/developer/docs

All services offer free tiers perfect for development and testing!