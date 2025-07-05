"use client"

import { usePriceAlerts } from '@/hooks/usePriceAlerts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Bell, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'

export function PriceAlertNotifications() {
  const { alerts, clearAlert, clearAllAlerts, hasAlerts } = usePriceAlerts()

  if (!hasAlerts) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {alerts.map((alert) => {
        const alertId = `${alert.ticker}-${alert.catalystId}`
        const priceChange = alert.priceAfter - alert.priceBefore
        const isPositive = priceChange > 0
        
        return (
          <Card key={alertId} className="bg-background border-2 border-orange-500 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4 text-orange-500" />
                  Price Alert: {alert.ticker}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearAlert(alertId)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-sm">
                  <p className="font-medium">{alert.catalystTitle}</p>
                  <p className="text-muted-foreground text-xs">
                    Revisiting price level from {format(new Date(alert.triggeredAt), 'MMM d, h:mm a')}
                  </p>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Current:</span>
                    <span className="font-medium">{typeof alert.currentPrice === 'number' ? alert.currentPrice.toFixed(2) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-medium">{typeof alert.priceBefore === 'number' ? alert.priceBefore.toFixed(2) : 'N/A'}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Tolerance: ±{typeof alert.tolerancePoints === 'number' ? alert.tolerancePoints.toFixed(2) : 'N/A'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Min Move: {typeof alert.minimumMove === 'number' ? alert.minimumMove.toFixed(2) : 'N/A'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 text-xs">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={isPositive ? "text-green-500" : "text-red-500"}>
                    Original move: {isPositive ? "+" : ""}{typeof priceChange === 'number' ? priceChange.toFixed(2) : 'N/A'} 
                    ({isPositive ? "+" : ""}{typeof priceChange === 'number' && typeof alert.priceBefore === 'number' ? ((priceChange / alert.priceBefore) * 100).toFixed(1) : 'N/A'}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
      
      {alerts.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllAlerts}
            className="text-xs"
          >
            Clear All ({alerts.length})
          </Button>
        </div>
      )}
    </div>
  )
} 