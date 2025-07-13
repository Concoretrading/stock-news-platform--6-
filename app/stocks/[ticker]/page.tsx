import React from "react";
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Search, Plus, Bell } from "lucide-react"
import Link from "next/link"
import { StockNewsHistory } from "@/components/stock-news-history"
import { StockManualNewsForm } from "@/components/stock-manual-news-form"
import { StockAlertTab } from "@/components/stock-alert-tab"
import ScreenshotButton from '@/components/ScreenshotButton'
import { StockNewsSearch } from "@/components/stock-news-search"

export default function StockPage() {
  const params = useParams()
  const ticker = params.ticker as string
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState("history")

  useEffect(() => {
    // Simple loading simulation
    setLoading(false)
  }, [ticker])

  const getStockName = (symbol: string): string => {
    const names: { [key: string]: string } = {
      AAPL: "Apple Inc.",
      GOOGL: "Alphabet Inc.",
      MSFT: "Microsoft Corporation",
      AMZN: "Amazon.com Inc.",
      TSLA: "Tesla Inc.",
      NVDA: "NVIDIA Corporation",
      META: "Meta Platforms Inc.",
      NFLX: "Netflix Inc.",
      AMD: "Advanced Micro Devices",
      CRM: "Salesforce Inc.",
      AVGO: "Broadcom Inc.",
      MSTR: "MicroStrategy Inc.",
    }
    return names[symbol] || `${symbol} Corporation`
  }

  const renderTabContent = (tabName: string, content: React.ReactNode) => {
    try {
      return content
    } catch (error) {
      console.error(`Error in ${tabName} tab:`, error)
      return (
        <div className="p-4 text-center text-red-600">
          <p>Error loading {tabName}. Please try refreshing the page.</p>
          <pre className="text-sm mt-2">{String(error)}</pre>
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-16 bg-muted rounded w-1/2"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const stockSymbol = ticker.toUpperCase()
  const stockName = getStockName(stockSymbol)

  try {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Clean Stock Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{stockSymbol}</h1>
            <p className="text-xl text-muted-foreground">{stockName}</p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="history" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>History</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Search</span>
              </TabsTrigger>
              <TabsTrigger value="add-news" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add News</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span>Alerts</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              {renderTabContent("history", <StockNewsHistory ticker={stockSymbol} refreshKey={refreshKey} />)}
            </TabsContent>

            <TabsContent value="search">
              {renderTabContent("search", <StockNewsSearch ticker={stockSymbol} />)}
            </TabsContent>

            <TabsContent value="add-news">
              {renderTabContent("add-news", <StockManualNewsForm ticker={stockSymbol} />)}
            </TabsContent>

            <TabsContent value="alerts">
              {renderTabContent("alerts", <StockAlertTab />)}
            </TabsContent>
          </Tabs>

          {/* Screenshot Button */}
          <ScreenshotButton onCatalystAdded={() => setRefreshKey(prev => prev + 1)} />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Stock page error:', error)
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">
            <p>Error loading stock page for {ticker}. Please try refreshing the page.</p>
            <pre className="text-sm mt-2">{String(error)}</pre>
          </div>
        </div>
      </div>
    )
  }
}
