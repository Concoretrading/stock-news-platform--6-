"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function DateDebugPanel() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timezoneInfo, setTimezoneInfo] = useState<any>({})

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Get timezone information
    const tzInfo = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset: new Date().getTimezoneOffset(),
      offsetHours: new Date().getTimezoneOffset() / 60,
      localTime: new Date().toLocaleString(),
      utcTime: new Date().toISOString(),
      todayIso: new Date().toISOString().split("T")[0],
      todayLocal: new Date().toLocaleDateString(),
    }
    setTimezoneInfo(tzInfo)

    return () => clearInterval(timer)
  }, [])

  const testDateParsing = () => {
    const testDates = [
      "2024-01-15",
      "2024-12-31", 
      new Date().toISOString().split("T")[0], // Today
    ]

    console.log("=== Date Parsing Test ===")
    testDates.forEach(dateStr => {
      const date1 = new Date(dateStr)
      const date2 = new Date(dateStr + 'T00:00:00.000Z')
      const date3 = new Date(dateStr + 'T00:00:00')
      
      console.log(`Date: ${dateStr}`)
      console.log(`  new Date(dateStr): ${date1.toISOString()}`)
      console.log(`  new Date(dateStr + 'T00:00:00.000Z'): ${date2.toISOString()}`)
      console.log(`  new Date(dateStr + 'T00:00:00'): ${date3.toISOString()}`)
      console.log(`  Local: ${date1.toLocaleDateString()}`)
      console.log("---")
    })
  }

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-sm">Date & Timezone Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <strong>Current Time:</strong> {currentTime.toLocaleTimeString()}
          </div>
          <div>
            <strong>Timezone:</strong> {timezoneInfo.timezone}
          </div>
          <div>
            <strong>Offset:</strong> {timezoneInfo.offset}min ({timezoneInfo.offsetHours}h)
          </div>
          <div>
            <strong>Today (ISO):</strong> {timezoneInfo.todayIso}
          </div>
          <div>
            <strong>Today (Local):</strong> {timezoneInfo.todayLocal}
          </div>
          <div>
            <strong>UTC Time:</strong> {timezoneInfo.utcTime}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testDateParsing}
            className="text-xs"
          >
            Test Date Parsing
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => console.log("Timezone info:", timezoneInfo)}
            className="text-xs"
          >
            Log Timezone Info
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Check browser console for detailed date parsing tests and timezone information.
        </div>
      </CardContent>
    </Card>
  )
} 