"use client"

import { useState, useEffect } from 'react'
import { usePriceAlerts } from '@/hooks/usePriceAlerts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth-provider'

export default function TestAlertsPage() {
  const { user } = useAuth()
  const { alerts, clearAllAlerts, hasAlerts } = usePriceAlerts()
  const [testMessage, setTestMessage] = useState('')

  useEffect(() => {
    if (hasAlerts) {
      setTestMessage('✅ Real-time alerts are working! Check the top-right corner for notifications.')
    } else {
      setTestMessage('⏳ Waiting for price alerts... Add some catalysts with priceBefore/priceAfter and set alert settings.')
    }
  }, [hasAlerts])

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Price Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to test the price alert system.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Price Alert Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h3 className="font-medium mb-2">How it works:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Add catalysts with <code>priceBefore</code> and <code>priceAfter</code> values</li>
              <li>Set alert settings for stocks (tolerance and minimum move)</li>
              <li>When current price gets within tolerance of a catalyst's start price, you'll get an instant notification</li>
              <li>Notifications appear in the top-right corner</li>
            </ol>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm">{testMessage}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Current Alerts ({alerts.length})</h3>
            {alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map((alert, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{alert.ticker} - {alert.catalystTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          Current: ${alert.currentPrice.toFixed(2)} | Target: ${alert.priceBefore.toFixed(2)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        ±${alert.tolerancePoints.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button onClick={clearAllAlerts} variant="outline" size="sm">
                  Clear All Alerts
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active alerts</p>
            )}
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <h3 className="font-medium mb-2">Testing Tips:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Create a catalyst with priceBefore: $150.00, priceAfter: $155.00</li>
              <li>Set alert tolerance to $2.00 and minimum move to $3.00</li>
              <li>When current price reaches $148.00-$152.00, you'll get an alert</li>
              <li>Alerts appear instantly via WebSocket, no polling needed!</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 