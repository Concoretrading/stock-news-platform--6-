# Earnings Data Setup Guide

## 🎯 Overview
This guide shows you how to get access to future earnings data for your calendar. You can use multiple data sources to ensure comprehensive coverage.

## 📊 Data Sources Ranked by Recommendation

### 1. **Alpaca Markets API** (Best for your app)
**Cost**: Free tier available
**Setup**: 
1. Go to https://alpaca.markets/
2. Create account
3. Get API keys from dashboard
4. Add to your `.env.local`:
```bash
ALPACA_API_KEY=your_api_key_here
ALPACA_SECRET_KEY=your_secret_key_here
```

**Pros**: 
- ✅ Already integrated with your app
- ✅ Real-time data
- ✅ Good documentation
- ✅ Free tier

### 2. **Alpha Vantage API** (Best free option)
**Cost**: Free (500 requests/day), $49.99/month for premium
**Setup**:
1. Go to https://www.alphavantage.co/
2. Get free API key
3. Add to your `.env.local`:
```bash
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

**Pros**:
- ✅ Free tier available
- ✅ Comprehensive earnings data
- ✅ Global markets
- ✅ Good documentation

### 3. **Financial Modeling Prep** (Best comprehensive)
**Cost**: $15-50/month
**Setup**:
1. Go to https://financialmodelingprep.com/
2. Choose plan (Basic $15/month recommended)
3. Get API key
4. Add to your `.env.local`:
```bash
FMP_API_KEY=your_api_key_here
```

**Pros**:
- ✅ Most comprehensive data
- ✅ Future estimates
- ✅ Historical data
- ✅ Global markets

## 🚀 Quick Start (Recommended)

### Step 1: Get Alpaca API Keys
1. Visit https://alpaca.markets/
2. Sign up for free account
3. Go to API Keys section
4. Copy your API Key and Secret Key

### Step 2: Add to Environment
Add to your `.env.local` file:
```bash
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
```

### Step 3: Test the Integration
1. Go to your Calendar page
2. Click "Earnings Manager" tab
3. Click "Update from API"
4. You should see real earnings data populate

## 🔧 Advanced Setup

### Multiple Sources (Recommended)
For the most comprehensive data, use multiple sources:

```bash
# .env.local
ALPACA_API_KEY=your_alpaca_key
ALPACA_SECRET_KEY=your_alpaca_secret
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FMP_API_KEY=your_fmp_key
```

The system will automatically:
- Fetch from all available sources
- Merge the data
- Remove duplicates
- Use the most complete information

### Automatic Updates
Set up a cron job to update earnings daily:

```bash
# Add to your deployment script
0 6 * * * curl -X POST https://your-app.com/api/earnings-calendar \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"fetch_and_update"}'
```

## 📈 What Data You'll Get

### Earnings Information
- **Stock Ticker & Company Name**
- **Earnings Date & Time**
- **Earnings Type** (Before Open, After Close, Pre-Market)
- **EPS Estimates** (Expected earnings per share)
- **Revenue Estimates** (Expected revenue)
- **Previous Results** (Last quarter's actual results)
- **Conference Call URLs**
- **Confirmation Status**

### Time Range
- **Current month** to **4 months ahead**
- **Real-time updates** as companies announce dates
- **Historical data** for analysis

## 💰 Cost Comparison

| Service | Free Tier | Paid Plans | Best For |
|---------|-----------|------------|----------|
| Alpaca | ✅ Yes | $0-200/month | Your app (already integrated) |
| Alpha Vantage | ✅ 500 req/day | $49.99/month | Free users |
| FMP | ❌ No | $15-50/month | Professional users |
| Yahoo Finance | ✅ Yes | N/A | Unofficial (risky) |

## 🎯 Recommendation for Your App

### Start with Alpaca (Free)
1. Get Alpaca API keys
2. Test the integration
3. See how much data you get

### Add Alpha Vantage (Free)
1. Get Alpha Vantage API key
2. Add to environment
3. Get more comprehensive data

### Consider FMP (Paid) if needed
1. If you need more data
2. If you want global markets
3. If you need historical analysis

## 🔍 Testing Your Setup

### Test API Connection
```bash
# Test Alpaca
curl "https://data.alpaca.markets/v2/stocks/earnings?start=2024-01-01&end=2024-04-30" \
  -H "APCA-API-KEY-ID: YOUR_KEY" \
  -H "APCA-API-SECRET-KEY: YOUR_SECRET"

# Test Alpha Vantage
curl "https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=3month&apikey=YOUR_KEY"
```

### Check Your Calendar
1. Go to Calendar → Earnings Manager
2. Click "Update from API"
3. Check the results
4. Verify data appears in calendar views

## 🚨 Troubleshooting

### No Data Showing
1. Check API keys are correct
2. Verify environment variables are loaded
3. Check browser console for errors
4. Try individual API calls

### Rate Limits
1. Alpha Vantage: 500 requests/day free
2. Alpaca: Generous free tier
3. FMP: Based on plan

### Data Quality
1. Some APIs have better data than others
2. Use multiple sources for best coverage
3. Manual entries can fill gaps

## 📞 Support

If you need help:
1. Check API documentation
2. Test individual API calls
3. Check your app logs
4. Verify environment setup

The system is designed to work with any combination of these APIs, so you can start with one and add more as needed! 