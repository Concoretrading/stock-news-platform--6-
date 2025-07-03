"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Settings, Save, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface StockAlertSettings {
  ticker: string
  defaultTolerancePoints: number
  defaultMinimumMovement: number
  autoCreateAlerts: boolean
  notificationPreferences: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

interface StockAlertSettingsProps {
  ticker: string
  stockName: string
}

export function StockAlertSettings({ ticker, stockName }: StockAlertSettingsProps) {
  const [settings, setSettings] = useState<StockAlertSettings>({
    ticker,
    defaultTolerancePoints: 2.0,
    defaultMinimumMovement: 10.0,
    autoCreateAlerts: true,
    notificationPreferences: {
      email: false,
      push: true,
      sms: false,
    },
  })
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  // Load settings for this specific stock
  useEffect(() => {
    // Mock API call - would be replaced with actual implementation
    const loadSettings = async () => {
      try {
        // Simulate different settings per stock
        const mockSettings: Record<string, Partial<StockAlertSettings>> = {
          AAPL: {
            defaultTolerancePoints: 1.5,
            defaultMinimumMovement: 8.0,
            autoCreateAlerts: true,
          },
          MSFT: {
            defaultTolerancePoints: 2.5,
            defaultMinimumMovement: 12.0,
            autoCreateAlerts: true,
          },
          GOOGL: {
            defaultTolerancePoints: 3.0,
            defaultMinimumMovement: 15.0,
            autoCreateAlerts: false,
          },
        }

        const stockSpecificSettings = mockSettings[ticker] || {}
        setSettings((prev) => ({ ...prev, ...stockSpecificSettings }))
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
    }

    loadSettings()
  }, [ticker])

  const handleSettingChange = (key: keyof StockAlertSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleNotificationChange = (key: keyof StockAlertSettings["notificationPreferences"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notificationPreferences: { ...prev.notificationPreferences, [key]: value },
    }))
    setHasChanges(true)
  }

  const handleToleranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numValue = value === "" ? 0 : Number.parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      handleSettingChange("defaultTolerancePoints", numValue)
    }
  }

  const handleMinimumMovementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numValue = value === "" ? 0 : Number.parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      handleSettingChange("defaultMinimumMovement", numValue)
    }
  }

  const saveSettings = async () => {
    setIsLoading(true)
    try {
      // Mock API call - would be replaced with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Settings Saved",
        description: `Alert settings for ${ticker} have been updated successfully.`,
      })
      setHasChanges(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetToDefaults = () => {
    setSettings({
      ticker,
      defaultTolerancePoints: 2.0,
      defaultMinimumMovement: 10.0,
      autoCreateAlerts: true,
      notificationPreferences: {
        email: false,
        push: true,
        sms: false,
      },
    })
    setHasChanges(true)
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-black flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Alert Settings for {ticker}
        </CardTitle>
        <p className="text-sm text-gray-600">Customize alert behavior specifically for {stockName}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-Create Alerts */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <Label className="text-blue-900 font-medium">Automatic Alert Creation</Label>
            <p className="text-sm text-blue-700">
              Automatically create alerts when {ticker} has significant news events
            </p>
          </div>
          <Switch
            checked={settings.autoCreateAlerts}
            onCheckedChange={(value) => handleSettingChange("autoCreateAlerts", value)}
          />
        </div>

        {/* Alert Thresholds */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tolerance" className="text-black font-medium">
              Price Tolerance (Points)
            </Label>
            <Input
              id="tolerance"
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={settings.defaultTolerancePoints.toString()}
              onChange={handleToleranceChange}
              className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
            />
            <p className="text-xs text-gray-500">
              Alert triggers when {ticker} is within ±{settings.defaultTolerancePoints} points of target price
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimum" className="text-black font-medium">
              Minimum Movement (Points)
            </Label>
            <Input
              id="minimum"
              type="number"
              step="0.1"
              min="1"
              max="50"
              value={settings.defaultMinimumMovement.toString()}
              onChange={handleMinimumMovementChange}
              className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
            />
            <p className="text-xs text-gray-500">
              Only create alerts for {ticker} news events with {settings.defaultMinimumMovement}+ point movements
            </p>
          </div>
        </div>

        {/* Notification Preferences */}
        <div>
          <Label className="text-black font-medium mb-3 block">Notification Preferences for {ticker}</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <span className="font-medium text-black">Push Notifications</span>
                <p className="text-sm text-gray-600">In-app notifications when alerts trigger</p>
              </div>
              <Switch
                checked={settings.notificationPreferences.push}
                onCheckedChange={(value) => handleNotificationChange("push", value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <span className="font-medium text-black">Email Notifications</span>
                <p className="text-sm text-gray-600">Send email alerts for {ticker} price movements</p>
              </div>
              <Switch
                checked={settings.notificationPreferences.email}
                onCheckedChange={(value) => handleNotificationChange("email", value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <span className="font-medium text-black">SMS Notifications</span>
                <p className="text-sm text-gray-600">Text message alerts for urgent {ticker} movements</p>
              </div>
              <Switch
                checked={settings.notificationPreferences.sms}
                onCheckedChange={(value) => handleNotificationChange("sms", value)}
              />
            </div>
          </div>
        </div>

        {/* Stock-Specific Examples */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-black mb-2">Example for {ticker}:</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <p>
              • News events moving {ticker} by {settings.defaultMinimumMovement}+ points will create alerts
            </p>
            <p>
              • Alerts trigger when {ticker} price is within ±{settings.defaultTolerancePoints} points of significant
              levels
            </p>
            <p>
              • {settings.autoCreateAlerts ? "Automatic" : "Manual"} alert creation for {ticker}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            onClick={saveSettings}
            disabled={!hasChanges || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
          <Button variant="outline" onClick={resetToDefaults} className="border-gray-300 text-black">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
