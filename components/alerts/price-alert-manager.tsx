"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Bell, X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface PriceAlert {
  id: string
  ticker: string
  alertType: "price_revisit" | "manual" | "threshold"
  triggerPrice: number
  originalPriceMovement?: number
  tolerancePoints: number
  minimumMovement: number
  isActive: boolean
  alertMessage: string
  createdAt: string
  triggeredAt?: string
  newsHeadline?: string
  newsDate?: string
  newsSnippet?: string
}

interface PriceAlertManagerProps {
  ticker?: string
  isOpen: boolean
  onClose: () => void
}

declare global {
  interface Window {
    SpeechRecognition: {
      prototype: SpeechRecognition
      new (): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new (): SpeechRecognition
    }
  }
}

export function PriceAlertManager({ ticker, isOpen, onClose }: PriceAlertManagerProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [activeAlerts, setActiveAlerts] = useState<PriceAlert[]>([])
  const [newAlert, setNewAlert] = useState({
    ticker: ticker || "",
    triggerPrice: "",
    tolerancePoints: "2.0",
    minimumMovement: "10.0",
  })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { toast } = useToast()

  // Mock data - would be replaced with actual API calls
  useEffect(() => {
    const mockAlerts: PriceAlert[] = [
      {
        id: "1",
        ticker: "AAPL",
        alertType: "price_revisit",
        triggerPrice: 185.5,
        originalPriceMovement: 12.3,
        tolerancePoints: 1.5, // Stock-specific setting
        minimumMovement: 8.0, // Stock-specific setting
        isActive: true,
        alertMessage: "AAPL revisited price level $185.50 from January 15, 2024 news event (+12.3 points)",
        createdAt: "2024-01-15T10:30:00Z",
        newsHeadline: "Apple announces revolutionary AI chip breakthrough with 40% performance boost",
        newsDate: "2024-01-15",
        newsSnippet:
          "Apple unveiled its next-generation AI processing chip, promising unprecedented performance improvements that could revolutionize mobile computing and set new industry standards.",
      },
      {
        id: "2",
        ticker: "MSFT",
        alertType: "price_revisit",
        triggerPrice: 378.2,
        originalPriceMovement: 15.7,
        tolerancePoints: 2.5, // Stock-specific setting
        minimumMovement: 12.0, // Stock-specific setting
        isActive: true,
        alertMessage: "MSFT revisited price level $378.20 from January 10, 2024 news event (+15.7 points)",
        createdAt: "2024-01-10T14:20:00Z",
        newsHeadline: "Microsoft secures $10B government cloud contract, largest in company history",
        newsDate: "2024-01-10",
        newsSnippet:
          "Microsoft announced a landmark government cloud services contract worth $10 billion over five years, significantly expanding its presence in the public sector and boosting long-term revenue projections.",
      },
      {
        id: "3",
        ticker: "AAPL",
        alertType: "price_revisit",
        triggerPrice: 192.8,
        originalPriceMovement: -11.4,
        tolerancePoints: 1.5,
        minimumMovement: 8.0,
        isActive: true,
        alertMessage: "AAPL revisited price level $192.80 from December 28, 2023 news event (-11.4 points)",
        createdAt: "2023-12-28T09:15:00Z",
        newsHeadline: "Apple faces production delays in China, iPhone shipments expected to drop 15%",
        newsDate: "2023-12-28",
        newsSnippet:
          "Supply chain disruptions at key manufacturing facilities in China are expected to significantly impact iPhone production, with analysts predicting a 15% reduction in Q1 shipments.",
      },
    ]

    // Filter by ticker if provided and show stock-specific settings
    const filteredAlerts = ticker ? mockAlerts.filter((alert) => alert.ticker === ticker) : mockAlerts
    setAlerts(filteredAlerts)

    // Update active alerts to include full news context
    const mockActiveAlerts: PriceAlert[] = [
      {
        id: "active-1",
        ticker: "AAPL",
        alertType: "price_revisit",
        triggerPrice: 185.5,
        originalPriceMovement: 12.3,
        tolerancePoints: 1.5,
        minimumMovement: 8.0,
        isActive: true,
        alertMessage: "🚨 AAPL is within 1.2 points of $185.50 from January 15, 2024 breakthrough news",
        createdAt: "2024-01-15T10:30:00Z",
        triggeredAt: new Date().toISOString(),
        newsHeadline: "Apple announces revolutionary AI chip breakthrough with 40% performance boost",
        newsDate: "2024-01-15",
        newsSnippet:
          "Apple unveiled its next-generation AI processing chip, promising unprecedented performance improvements...",
      },
    ]

    if (!ticker) {
      setActiveAlerts(mockActiveAlerts)
    }
  }, [ticker])

  const handleTriggerPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewAlert({ ...newAlert, triggerPrice: value })
  }

  const handleToleranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewAlert({ ...newAlert, tolerancePoints: value })
  }

  const handleMinimumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewAlert({ ...newAlert, minimumMovement: value })
  }

  const createAlert = async () => {
    try {
      // Validate inputs
      const triggerPrice = Number.parseFloat(newAlert.triggerPrice)
      const tolerancePoints = Number.parseFloat(newAlert.tolerancePoints)
      const minimumMovement = Number.parseFloat(newAlert.minimumMovement)

      if (isNaN(triggerPrice) || isNaN(tolerancePoints) || isNaN(minimumMovement)) {
        toast({
          title: "Invalid Input",
          description: "Please enter valid numeric values for all fields.",
          variant: "destructive",
        })
        return
      }

      // Mock API call - would be replaced with actual implementation
      const alert: PriceAlert = {
        id: Math.random().toString(36).substring(2, 9),
        ticker: newAlert.ticker.toUpperCase(),
        alertType: "manual",
        triggerPrice: triggerPrice,
        tolerancePoints: tolerancePoints,
        minimumMovement: minimumMovement,
        isActive: true,
        alertMessage: `Manual alert: ${newAlert.ticker.toUpperCase()} target price $${triggerPrice.toFixed(2)}`,
        createdAt: new Date().toISOString(),
      }

      setAlerts([...alerts, alert])
      setNewAlert({ ticker: ticker || "", triggerPrice: "", tolerancePoints: "2.0", minimumMovement: "10.0" })
      setShowCreateForm(false)

      toast({
        title: "Alert Created",
        description: `Price alert created for ${alert.ticker} at $${alert.triggerPrice.toFixed(2)}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create alert",
        variant: "destructive",
      })
    }
  }

  const toggleAlert = async (alertId: string) => {
    setAlerts(alerts.map((alert) => (alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert)))
  }

  const deleteAlert = async (alertId: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== alertId))
    toast({
      title: "Alert Deleted",
      description: "Price alert has been removed",
    })
  }

  const dismissActiveAlert = (alertId: string) => {
    setActiveAlerts(activeAlerts.filter((alert) => alert.id !== alertId))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="text-black flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Price Alert Manager {ticker && `- ${ticker}`}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto p-6">
          {/* Active Alerts Section */}
          {activeAlerts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4 text-red-500" />
                Active Alerts ({activeAlerts.length})
              </h3>
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <Card key={alert.id} className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-red-100 text-red-800">{alert.ticker}</Badge>
                            <Badge variant="outline" className="text-xs">
                              ${alert.triggerPrice.toFixed(2)}
                            </Badge>
                            {alert.originalPriceMovement && (
                              <Badge
                                variant={alert.originalPriceMovement > 0 ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {alert.originalPriceMovement > 0 ? "+" : ""}
                                {alert.originalPriceMovement.toFixed(1)} pts
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-red-800 mb-1">{alert.alertMessage}</p>
                          {alert.newsHeadline && (
                            <p className="text-xs text-red-600">Original news: {alert.newsHeadline}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Triggered: {new Date(alert.triggeredAt!).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissActiveAlert(alert.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Create New Alert */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">Alert Configuration</h3>
              <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Alert
              </Button>
            </div>

            {showCreateForm && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ticker">Stock Ticker</Label>
                      <Input
                        id="ticker"
                        placeholder="e.g., AAPL"
                        value={newAlert.ticker}
                        onChange={(e) => setNewAlert({ ...newAlert, ticker: e.target.value })}
                        disabled={!!ticker}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="triggerPrice">Target Price ($)</Label>
                      <Input
                        id="triggerPrice"
                        type="number"
                        step="0.01"
                        placeholder="185.50"
                        value={newAlert.triggerPrice}
                        onChange={handleTriggerPriceChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tolerance">Tolerance (Points)</Label>
                      <Input
                        id="tolerance"
                        type="number"
                        step="0.1"
                        value={newAlert.tolerancePoints}
                        onChange={handleToleranceChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minimum">Min Movement (Points)</Label>
                      <Input
                        id="minimum"
                        type="number"
                        step="0.1"
                        value={newAlert.minimumMovement}
                        onChange={handleMinimumChange}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={createAlert} className="bg-blue-600 hover:bg-blue-700">
                      Create Alert
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Existing Alerts */}
          <div>
            <h3 className="text-lg font-bold text-black mb-4">Configured Alerts ({alerts.length})</h3>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No alerts configured</p>
                    <p className="text-sm text-gray-500">
                      Create your first alert to get notified when stocks revisit significant price levels
                    </p>
                  </CardContent>
                </Card>
              ) : (
                alerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className={`${alert.isActive ? "border-gray-200" : "border-gray-100 bg-gray-50"}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{alert.ticker}</Badge>
                            <Badge className="bg-blue-100 text-blue-800">${alert.triggerPrice.toFixed(2)}</Badge>
                            {alert.alertType === "price_revisit" && (
                              <Badge variant="secondary" className="text-xs">
                                News Revisit
                              </Badge>
                            )}
                            {alert.originalPriceMovement && (
                              <Badge
                                variant={alert.originalPriceMovement > 0 ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {alert.originalPriceMovement > 0 ? "+" : ""}
                                {alert.originalPriceMovement.toFixed(1)} pts
                              </Badge>
                            )}
                            {alert.newsDate && (
                              <Badge variant="outline" className="text-xs bg-gray-100">
                                {new Date(alert.newsDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </Badge>
                            )}
                          </div>

                          {/* Enhanced news context display */}
                          {alert.newsHeadline && (
                            <div className="mb-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <h4 className="text-sm font-medium text-blue-900 mb-1">
                                Original News Event ({alert.newsDate}):
                              </h4>
                              <p className="text-sm text-blue-800 font-medium mb-1">{alert.newsHeadline}</p>
                              {alert.newsSnippet && <p className="text-xs text-blue-700">{alert.newsSnippet}</p>}
                            </div>
                          )}

                          <p className="text-sm text-gray-700 mb-1">{alert.alertMessage}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Tolerance: ±{alert.tolerancePoints} pts</span>
                            <span>Min Movement: {alert.minimumMovement} pts</span>
                            <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={alert.isActive} onCheckedChange={() => toggleAlert(alert.id)} />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAlert(alert.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
