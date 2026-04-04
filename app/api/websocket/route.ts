import { NextRequest } from "next/server"
// TODO: Real-time price service has been removed - need to implement alternative
// import { getRealTimePriceService } from "@/lib/real-time-prices"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Real-time price service temporarily unavailable
    return Response.json({
      success: true,
      data: {
        status: "disabled",
        message: "WebSocket service is currently disabled"
      }
    })
  } catch (error) {
    console.error("WebSocket status error:", error)
    return Response.json({
      success: false,
      error: "Failed to get WebSocket status"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, symbols } = await request.json()
    
    // Real-time price service temporarily unavailable
    return Response.json({
      success: false,
      error: "WebSocket service is currently disabled"
    }, { status: 503 })
  } catch (error) {
    console.error("WebSocket action error:", error)
    return Response.json({
      success: false,
      error: "Failed to perform WebSocket action"
    }, { status: 500 })
  }
} 