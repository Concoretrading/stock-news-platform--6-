"use client"

import { useState, useEffect } from "react"
import { Bell, X, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Update the AlertNotification interface to include detailed news context
interface AlertNotification {
  id: string
  ticker: string
  message: string
  triggerPrice: number
  currentPrice: number
  priceMovement: number
  newsHeadline?: string
  newsDate?: string
  newsSnippet?: string
  timestamp: string
}

export function AlertNotificationCenter() {
  const [notifications, setNotifications] = useState<AlertNotification[]>([])
  const [isVisible, setIsVisible] = useState(false)

  // Update mock notifications to include full news context with dates
  useEffect(() => {
    const mockNotifications: AlertNotification[] = [
      {
        id: "notif-1",
        ticker: "AAPL",
        message: "AAPL is within 1.2 points of significant news level from January 15, 2024",
        triggerPrice: 185.5,
        currentPrice: 184.3,
        priceMovement: 12.3,
        newsHeadline: "Apple announces revolutionary AI chip breakthrough with 40% performance boost",
        newsDate: "2024-01-15",
        newsSnippet:
          "Apple unveiled its next-generation AI processing chip, promising unprecedented performance improvements that could revolutionize mobile computing...",
        timestamp: new Date().toISOString(),
      },
    ]

    // Simulate receiving a notification after 3 seconds
    const timer = setTimeout(() => {
      setNotifications(mockNotifications)
      setIsVisible(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter((notif) => notif.id !== id))
    if (notifications.length <= 1) {
      setIsVisible(false)
    }
  }

  const dismissAll = () => {
    setNotifications([])
    setIsVisible(false)
  }

  if (!isVisible || notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 w-96 space-y-2">
      {notifications.map((notification) => (
        <Card key={notification.id} className="border-red-200 bg-red-50 shadow-lg animate-in slide-in-from-right">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-4 w-4 text-red-600" />
                  <Badge className="bg-red-100 text-red-800">{notification.ticker}</Badge>
                  <Badge variant="outline" className="text-xs">
                    ${typeof notification.triggerPrice === 'number' ? notification.triggerPrice.toFixed(2) : 'N/A'}
                  </Badge>
                  {notification.newsDate && (
                    <Badge variant="outline" className="text-xs bg-gray-100">
                      {new Date(notification.newsDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Badge>
                  )}
                  <Badge variant={notification.priceMovement > 0 ? "default" : "destructive"} className="text-xs">
                    {notification.priceMovement > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {notification.priceMovement > 0 ? "+" : ""}
                    {typeof notification.priceMovement === 'number' ? notification.priceMovement.toFixed(1) : 'N/A'} pts
                  </Badge>
                </div>

                <p className="text-sm font-medium text-red-800 mb-2">{notification.message}</p>

                {/* Enhanced news context in notification */}
                {notification.newsHeadline && (
                  <div className="mb-2 p-2 bg-white rounded border border-red-200">
                    <p className="text-xs font-medium text-red-900 mb-1">Original News ({notification.newsDate}):</p>
                    <p className="text-xs text-red-800">{notification.newsHeadline}</p>
                  </div>
                )}

                <p className="text-xs text-red-600 mb-2">
                  Current: ${typeof notification.currentPrice === 'number' ? notification.currentPrice.toFixed(2) : 'N/A'} | Target: ${typeof notification.triggerPrice === 'number' ? notification.triggerPrice.toFixed(2) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleTimeString()}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => dismissNotification(notification.id)}
                className="text-red-600 hover:text-red-700 h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {notifications.length > 1 && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={dismissAll} className="text-xs">
            Dismiss All ({notifications.length})
          </Button>
        </div>
      )}
    </div>
  )
}
