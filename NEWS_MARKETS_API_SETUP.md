# 🌍 News & Markets API Setup Guide

## 🔑 Required API Keys

To enable the News & Markets Intelligence Module, you need to obtain API keys from the following services:

### 1️⃣ NewsAPI (Primary News Source)
- **Website**: https://newsapi.org/
- **Free Tier**: 1,000 requests/day
- **Setup**:
  1. Create account at https://newsapi.org/register
  2. Get your API key from dashboard
  3. Add to `.env`: `NEWSAPI_KEY=your-newsapi-key-here`

### 2️⃣ GNews API (Fallback News Source)
- **Website**: https://gnews.io/
- **Free Tier**: 100 requests/day
- **Setup**:
  1. Create account at https://gnews.io/
  2. Get your API token from dashboard
  3. Add to `.env`: `GNEWS_API_KEY=your-gnews-api-key-here`

### 3️⃣ Alpha Vantage (Forex Data)
- **Website**: https://www.alphavantage.co/
- **Free Tier**: 25 requests/day
- **Setup**:
  1. Create account at https://www.alphavantage.co/support/#api-key
  2. Get your free API key
  3. Add to `.env`: `ALPHA_VANTAGE_KEY=your-alpha-vantage-key-here`

### 4️⃣ Financial Modeling Prep (Stock Data)
- **Website**: https://financialmodelingprep.com/
- **Free Tier**: 250 requests/day
- **Setup**:
  1. Create account at https://financialmodelingprep.com/developer/docs
  2. Get your API key from dashboard
  3. Add to `.env`: `FMP_API_KEY=your-fmp-api-key-here`

## 🚀 Quick Start

1. **Update Environment Variables**:
   ```bash
   # Edit backend/.env file
   NEWSAPI_KEY=your-newsapi-key-here
   GNEWS_API_KEY=your-gnews-api-key-here
   ALPHA_VANTAGE_KEY=your-alpha-vantage-key-here
   FMP_API_KEY=your-fmp-api-key-here
   ```

2. **Test the APIs**:
   ```bash
   # Test news endpoint
   curl http://localhost:3000/api/v1/news?category=general

   # Test forex endpoint
   curl http://localhost:3000/api/v1/markets/forex?from=USD&to=UGX

   # Test stock endpoint
   curl http://localhost:3000/api/v1/markets/stocks/AAPL

   # Test market indices
   curl http://localhost:3000/api/v1/markets/indices
   ```

3. **Access the News & Markets Page**:
   - Open http://localhost:3000
   - Click "News & Markets" in the navigation
   - Browse news by category or search
   - View live market data

## 📊 Features Included

### News Features:
- ✅ Real-time news aggregation from multiple sources
- ✅ Category filtering (General, Business, Tech, Sports, etc.)
- ✅ Search functionality with debouncing
- ✅ Pagination support
- ✅ Auto-refresh every 60 seconds
- ✅ Responsive grid layout
- ✅ Loading states and error handling
- ✅ Article deduplication
- ✅ Clean modern UI with animations

### Markets Features:
- ✅ Live forex rates (USD/UGX, EUR/USD, GBP/USD, USD/JPY)
- ✅ Major market indices (S&P 500, NASDAQ, DOW)
- ✅ Real-time stock quotes
- ✅ Auto-refresh market data
- ✅ Percentage change indicators
- ✅ Professional trading interface
- ✅ Cached data for performance

## 🛡️ Security & Performance

- **API Key Protection**: All keys stored in backend environment variables
- **Rate Limiting**: Built-in request throttling to prevent API limit violations
- **Caching**: 5-minute cache for news, 2-minute cache for market data
- **Error Handling**: Graceful fallbacks when APIs are unavailable
- **CORS Protection**: Proper CORS configuration
- **Input Validation**: All user inputs sanitized and validated

## 🔧 Troubleshooting

### Common Issues:

1. **"All news services are currently unavailable"**
   - Check your API keys in `.env`
   - Verify API key validity on respective platforms
   - Check if you've exceeded rate limits

2. **"Connection failed: timeout"**
   - Check internet connection
   - Verify API endpoints are accessible
   - Try increasing timeout in controllers

3. **Market data not loading**
   - Verify Financial Modeling Prep and Alpha Vantage keys
   - Check if markets are open (some data only available during trading hours)
   - Review server logs for specific errors

### Debug Mode:
```bash
# Check server logs
npm run dev-simple

# Test individual API endpoints
curl -v http://localhost:3000/api/v1/news/categories
curl -v http://localhost:3000/api/v1/markets/forex/popular
```

## 📈 Production Deployment

For production deployment:

1. **Environment Variables**: Set all API keys in production environment
2. **Rate Limiting**: Implement additional rate limiting middleware
3. **Monitoring**: Add API usage monitoring and alerting
4. **Caching**: Consider Redis for distributed caching
5. **CDN**: Use CDN for static assets and image optimization

## 🎯 Next Steps

The News & Markets module is now fully integrated into your portfolio. You can:

- Customize categories in `newsController.ts`
- Add more forex pairs in `marketsController.ts`
- Modify the UI styling in `NewsAndMarkets.tsx`
- Add more news sources or market data providers
- Implement user preferences and saved searches

Enjoy your new News & Markets Intelligence Module! 🚀