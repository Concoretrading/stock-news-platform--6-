# Redis Setup Guide for Stock Price Caching

## Why Redis?

With multiple users watching stocks, we need efficient caching to avoid hitting Alpaca's API rate limits. Redis provides:

- **Shared caching** across multiple server instances
- **Automatic TTL** (Time To Live) for cache expiration
- **High performance** for concurrent users
- **Fallback to memory** if Redis is unavailable

## Setup with Upstash Redis (Recommended)

### 1. Create Upstash Redis Database

1. Go to [upstash.com](https://upstash.com)
2. Sign up/login and create a new Redis database
3. Choose a region close to your Vercel deployment
4. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### 2. Add Environment Variables

Add these to your `.env.local` file:

```bash
# Upstash Redis (for caching stock prices)
UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
```

### 3. Add to Vercel (Production)

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the same variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## How It Works

### Cache Strategy
- **5-second TTL**: Prices cached for 5 seconds
- **Shared across users**: 100 users watching AAPL = 1 API call every 5 seconds
- **Automatic fallback**: If Redis fails, falls back to in-memory cache

### API Usage Example
```
User 1 requests: AAPL, TSLA, NVDA → 3 API calls to Alpaca
User 2-100 request same stocks → 0 API calls (served from cache)
After 5 seconds: Cache expires, next request makes fresh API calls
```

### Performance Benefits
- **Before**: 100 users × 10 stocks × 12 requests/min = 12,000 requests/min ❌
- **After**: ~200 requests/min (within free tier limits) ✅

## Monitoring

### Cache Statistics
Visit `/api/cache/stats` to see:
- Number of cached prices
- List of cached tickers
- Cache performance metrics

### Clear Cache
POST to `/api/cache/clear` to manually clear the cache (useful for debugging)

## Fallback Behavior

If Redis is not configured or unavailable:
1. System automatically falls back to in-memory caching
2. Works for single-server deployments
3. Logs warnings but continues functioning
4. No user impact - seamless degradation

## Cost Considerations

- **Upstash Free Tier**: 10,000 requests/day
- **Typical Usage**: ~2,000 requests/day for 100 users
- **Cost**: $0 for most use cases
- **Scaling**: Pay-as-you-go for higher usage

## Troubleshooting

### Redis Connection Issues
1. Check environment variables are set correctly
2. Verify Upstash database is active
3. Check network connectivity
4. System will fallback to memory cache automatically

### High API Usage
1. Monitor `/api/cache/stats` for cache hit rates
2. Consider increasing cache TTL if acceptable
3. Implement user-specific caching if needed
4. Add multiple Alpaca API keys for load distribution 