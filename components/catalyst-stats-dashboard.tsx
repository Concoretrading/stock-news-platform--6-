"use client"

import React from "react";

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, TrendingUp, Calendar, BarChart3 } from "lucide-react"
import { fetchWithAuth } from "@/lib/fetchWithAuth"

interface CatalystStats {
  totalCatalysts: number
  recentCatalysts: number
  thisWeekCatalysts: number
  thisMonthCatalysts: number
}

export function CatalystStatsDashboard() {
  const [stats, setStats] = useState<CatalystStats>({
    totalCatalysts: 0,
    recentCatalysts: 0,
    thisWeekCatalysts: 0,
    thisMonthCatalysts: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCatalystStats()
  }, [])

  const loadCatalystStats = async () => {
    try {
      setIsLoading(true)
      
      // Fetch all catalysts to calculate statistics
      const response = await fetchWithAuth('/api/catalysts')
      const data = await response.json()
      
      if (data.success && data.data) {
        const catalysts = data.data
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(todayStart.getTime() - (todayStart.getDay() * 24 * 60 * 60 * 1000))
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const threeDaysAgo = new Date(todayStart.getTime() - (3 * 24 * 60 * 60 * 1000))

        const totalCatalysts = catalysts.length
        
        const recentCatalysts = catalysts.filter((catalyst: any) => {
          const catalystDate = new Date(catalyst.date)
          return catalystDate >= threeDaysAgo
        }).length

        const thisWeekCatalysts = catalysts.filter((catalyst: any) => {
          const catalystDate = new Date(catalyst.date)
          return catalystDate >= weekStart
        }).length

        const thisMonthCatalysts = catalysts.filter((catalyst: any) => {
          const catalystDate = new Date(catalyst.date)
          return catalystDate >= monthStart
        }).length

        setStats({
          totalCatalysts,
          recentCatalysts,
          thisWeekCatalysts,
          thisMonthCatalysts
        })
      }
    } catch (error) {
      console.error('Error loading catalyst stats:', error)
      // Set to 0 on error instead of showing error to user
      setStats({
        totalCatalysts: 0,
        recentCatalysts: 0,
        thisWeekCatalysts: 0,
        thisMonthCatalysts: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Catalyst Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-8 w-16 mx-auto"></div>
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-20 mx-auto"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Catalyst Statistics</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Real-time data
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Total Catalysts */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-1">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <span className="text-2xl font-bold text-blue-600">{stats.totalCatalysts}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Catalysts</p>
          </div>

          {/* Recent (Last 3 Days) */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-1">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-2xl font-bold text-green-600">{stats.recentCatalysts}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last 3 Days</p>
          </div>

          {/* This Week */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-1">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-2xl font-bold text-purple-600">{stats.thisWeekCatalysts}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
          </div>

          {/* This Month */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-1">
              <Activity className="h-4 w-4 text-gray-500" />
              <span className="text-2xl font-bold text-orange-600">{stats.thisMonthCatalysts}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
