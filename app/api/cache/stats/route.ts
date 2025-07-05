import { NextResponse } from "next/server"
import { Redis } from '@upstash/redis'

export async function GET() {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })

    const keys = await redis.keys('price:*')
    const stats = {
      totalCachedPrices: keys.length,
      cachedTickers: keys.map(key => key.replace('price:', '')),
      cacheHitRate: 'N/A', // Would need to implement hit/miss tracking
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({ 
      success: true, 
      data: stats 
    })
  } catch (error) {
    console.error("Error getting cache stats:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to get cache stats",
      fallback: "Redis not configured or unavailable"
    })
  }
} 