import { useEffect, useCallback, useState } from 'react'
import { getRealTimePriceService } from '@/lib/real-time-prices'
import { useAuth } from '@/components/auth-provider'

interface PriceAlert {
  ticker: string
  catalystId: string
  catalystTitle: string
  priceBefore: number
  priceAfter: number
  currentPrice: number
  tolerancePoints: number
  minimumMove: number
  triggeredAt: string
}

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const { user } = useAuth()

  const handleAlert = useCallback((alert: PriceAlert) => {
    setAlerts(prev => {
      // Check if this alert already exists (same ticker, catalyst, and recent time)
      const existingIndex = prev.findIndex(a => 
        a.ticker === alert.ticker && 
        a.catalystId === alert.catalystId &&
        Math.abs(new Date(a.triggeredAt).getTime() - new Date(alert.triggeredAt).getTime()) < 60000 // Within 1 minute
      )
      
      if (existingIndex >= 0) {
        // Update existing alert
        const newAlerts = [...prev]
        newAlerts[existingIndex] = alert
        return newAlerts
      } else {
        // Add new alert
        return [...prev, alert]
      }
    })
  }, [])

  const clearAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => 
      `${alert.ticker}-${alert.catalystId}` !== alertId
    ))
  }, [])

  const clearAllAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  useEffect(() => {
    if (!user) {
      setAlerts([])
      return
    }

    const priceService = getRealTimePriceService()
    
    // Subscribe to alerts
    priceService.onAlert(handleAlert)

    // Cleanup on unmount
    return () => {
      priceService.offAlert(handleAlert)
    }
  }, [user, handleAlert])

  return {
    alerts,
    clearAlert,
    clearAllAlerts,
    hasAlerts: alerts.length > 0
  }
} 