import { NextResponse } from "next/server"
import { clearCache } from "@/lib/redis"

export async function POST() {
  try {
    await clearCache()
    return NextResponse.json({ 
      success: true, 
      message: "Cache cleared successfully" 
    })
  } catch (error) {
    console.error("Error clearing cache:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to clear cache" 
    }, { status: 500 })
  }
} 