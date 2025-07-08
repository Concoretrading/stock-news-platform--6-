"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, ArrowLeft, Calendar, Search, Plus, Bell } from "lucide-react"
import Link from "next/link"
import { StockNewsHistory } from "@/components/stock-news-history"
import { StockManualNewsForm } from "@/components/stock-manual-news-form"
import { StockAlertTab } from "@/components/stock-alert-tab"
import ScreenshotButton from '@/components/ScreenshotButton'
import { StockNewsSearch } from "@/components/stock-news-search"

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: string
  marketCap: string
  peRatio: number
}

export default function StockPage() {
  const params = useParams()
  const ticker = params.ticker as string
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState("history")

  useEffect(() => {
    // Check for URL fragment to determine active tab
    if (typeof window !== 'undefined') {
      const fragment = window.location.hash.replace('#', '')
      if (fragment && ['history', 'search', 'add-news', 'alerts'].includes(fragment)) {
        setActiveTab(fragment)
      }
    }
  }, [])

  useEffect(() => {
    // Update URL fragment when tab changes
    if (typeof window !== 'undefined' && activeTab) {
      window.history.replaceState(null, '', `#${activeTab}`)
    }
  }, [activeTab])

  useEffect(() => {
    // Mock stock data - in real app, fetch from API
    const mockData: StockData = {
      symbol: ticker.toUpperCase(),
      name: getStockName(ticker.toUpperCase()),
      price: Math.random() * 500 + 50,
      change: (Math.random() - 0.5) * 20,
      changePercent: (Math.random() - 0.5) * 5,
      volume: "2.5M",
      marketCap: "2.8T",
      peRatio: 28.5,
    }

    setStockData(mockData)
    setLoading(false)
  }, [ticker])

  const getStockName = (symbol: string): string => {
    const names: { [key: string]: string } = {
      AAPL: "Apple Inc.",
      GOOGL: "Alphabet Inc.",
      MSFT: "Microsoft Corp.",
      AMZN: "Amazon.com Inc.",
      TSLA: "Tesla Inc.",
      NVDA: "NVIDIA Corp.",
      META: "Meta Platforms",
      NFLX: "Netflix Inc.",
      AMD: "Advanced Micro Devices",
      CRM: "Salesforce Inc.",
    }
    return names[symbol] || `${symbol} Corporation`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!stockData) return null

  const isPositive = stockData.change >= 0

  // console.log('stockData.price value:', stockData.price, typeof stockData.price);
  // console.log('stockData.change value:', stockData.change, typeof stockData.change);
  // console.log('stockData.changePercent value:', stockData.changePercent, typeof stockData.changePercent);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Stock Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-3xl font-bold">{stockData.symbol}</h1>
                  <p className="text-muted-foreground">{stockData.name}</p>
                </div>
                {isPositive ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-bold">{typeof stockData.price === 'number' && !isNaN(stockData.price) ? stockData.price.toFixed(2) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Change</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={isPositive ? "default" : "destructive"}>
                    {isPositive ? "+" : ""}
                    {typeof stockData.change === 'number' && !isNaN(stockData.change) ? stockData.change.toFixed(2) : 'N/A'}
                  </Badge>
                  <span className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
                    {isPositive ? "+" : ""}
                    {typeof stockData.changePercent === 'number' && !isNaN(stockData.changePercent) ? stockData.changePercent.toFixed(2) : 'N/A'}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volume</p>
                <p className="font-semibold">{stockData.volume}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Market Cap</p>
                <p className="font-semibold">{stockData.marketCap}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">P/E Ratio</p>
                <p className="font-semibold">{stockData.peRatio}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
            <StockNewsHistory ticker={stockData.symbol} refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="search">
            <StockNewsSearch ticker={stockData.symbol} />
          </TabsContent>

          <TabsContent value="add-news">
            <StockManualNewsForm ticker={stockData.symbol} />
          </TabsContent>

          <TabsContent value="alerts">
            <StockAlertTab />
          </TabsContent>
        </Tabs>

        {/* Floating Screenshot Button with Analyzer */}
        <ScreenshotButton onCatalystAdded={() => setRefreshKey(k => k + 1)} />
      </div>
    </div>
  )
}
