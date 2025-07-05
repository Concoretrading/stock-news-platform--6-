import { NextRequest } from "next/server"
import { getRealTimePriceService } from "@/lib/real-time-prices"

export async function GET(request: NextRequest) {
  try {
    const service = getRealTimePriceService()
    const status = service.status
    
    return Response.json({
      success: true,
      data: {
        status,
        message: "WebSocket service is running"
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
    const service = getRealTimePriceService()
    
    switch (action) {
      case 'subscribe':
        if (symbols && Array.isArray(symbols)) {
          await service.subscribeToSymbols(symbols)
          return Response.json({
            success: true,
            message: `Subscribed to ${symbols.length} symbols`
          })
        }
        break
        
      case 'unsubscribe':
        if (symbols && Array.isArray(symbols)) {
          service.unsubscribeFromSymbols(symbols)
          return Response.json({
            success: true,
            message: `Unsubscribed from ${symbols.length} symbols`
          })
        }
        break
        
      case 'status':
        return Response.json({
          success: true,
          data: service.status
        })
        
      default:
        return Response.json({
          success: false,
          error: "Invalid action"
        }, { status: 400 })
    }
  } catch (error) {
    console.error("WebSocket action error:", error)
    return Response.json({
      success: false,
      error: "Failed to perform WebSocket action"
    }, { status: 500 })
  }
} 