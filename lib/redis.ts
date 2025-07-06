import { Redis } from '@upstash/redis'

// Initialize Redis client
let redis: Redis | null = null

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
} catch (error) {
  console.warn('Redis not configured, falling back to in-memory cache')
}

// Fallback in-memory cache
const memoryCache = new Map<string, { price: number; timestamp: number }>()
const CACHE_DURATION = 5000 // 5 seconds

export interface CachedPrice {
  price: number
  timestamp: number
}

export async function getCachedPrice(ticker: string): Promise<CachedPrice | null> {
  const now = Date.now()
  if (redis) {
    try {
      const cached = await redis.get<CachedPrice>(`price:${ticker}`)
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached
      }
    } catch (error) {
      console.warn('Redis error, falling back to memory cache:', error)
    }
  }
  // Fallback to memory cache
  const cached = memoryCache.get(ticker)
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached
  }
  return null
}

export async function setCachedPrice(ticker: string, price: number): Promise<void> {
  const now = Date.now()
  const cachedPrice: CachedPrice = { price, timestamp: now }
  if (redis) {
    try {
      // Set with TTL (5 seconds)
      await redis.setex(`price:${ticker}`, 5, cachedPrice)
    } catch (error) {
      console.warn('Redis error, falling back to memory cache:', error)
      memoryCache.set(ticker, cachedPrice)
    }
  } else {
    memoryCache.set(ticker, cachedPrice)
  }
}

export async function clearCache(): Promise<void> {
  if (redis) {
    try {
      const keys = await redis.keys('price:*')
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.warn('Redis clear error:', error)
    }
  }
  memoryCache.clear()
} 