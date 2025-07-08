"use client"

import type React from "react"
import { Bell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PriceAlertManagerProps {
  ticker?: string
  isOpen: boolean
}

export function PriceAlertManager({ ticker, isOpen }: PriceAlertManagerProps) {
  if (!isOpen) return null

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Price Alerts
            {ticker && <Badge variant="outline">{ticker}</Badge>}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="h-12 w-12 mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Price Alerts Coming Soon!</h3>
          <p className="text-muted-foreground max-w-md">
            We&apos;re working on bringing you real-time price alerts. Soon you&apos;ll be able to track price movements and get notified about important market events.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
