"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { StockCard } from "@/components/stock-card"
import { StockSelector } from "@/components/stock-selector"
import { ScreenshotAnalyzer } from "@/components/screenshot-analyzer"
import { StockManualNewsForm } from "@/components/stock-manual-news-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TrendingUp, Settings, Camera, Calendar, PlusCircle, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getUserStocks, addStockToWatchlist } from "@/lib/firebase-services"
import Link from "next/link"

interface Stock {
  id?: string
  symbol: string
  name: string
}

interface FirebaseStock {
  id: string
  ticker: string
  companyName: string
  createdAt: string
}

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [watchlist, setWatchlist] = useState<Stock[]>([])
  const [showStockSelector, setShowStockSelector] = useState(false)
  const [showScreenshotAnalyzer, setShowScreenshotAnalyzer] = useState(false)
  const [showManualNewsForm, setShowManualNewsForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoadingStocks, setIsLoadingStocks] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const { toast } = useToast()

  // Add state for mobile carousel page
  const [mobilePage, setMobilePage] = useState(0)
  const stocksPerMobilePage = 5
  const totalMobilePages = Math.ceil(watchlist.length / stocksPerMobilePage)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Load user's watchlist from Firebase
  useEffect(() => {
    if (user) {
      loadUserWatchlist()
    }
  }, [user, refreshKey])

  const loadUserWatchlist = async () => {
    try {
      setIsLoadingStocks(true)
      const userStocks = await getUserStocks() as unknown as FirebaseStock[]
      
      if (userStocks.length === 0) {
        // If no stocks, add the standard set of 10
        const defaultStocks = [
          { symbol: "NVDA", name: "NVIDIA Corporation" },
          { symbol: "TSLA", name: "Tesla Inc." },
          { symbol: "META", name: "Meta Platforms Inc." },
          { symbol: "AMZN", name: "Amazon.com Inc." },
          { symbol: "AVGO", name: "Broadcom Inc." },
          { symbol: "MSFT", name: "Microsoft Corporation" },
          { symbol: "GOOGL", name: "Alphabet Inc." },
          { symbol: "AMZN", name: "Amazon.com Inc." },
          { symbol: "NFLX", name: "Netflix Inc." },
          { symbol: "MSTR", name: "MicroStrategy Inc." },
        ]
        for (const stock of defaultStocks) {
          await addStockToWatchlist(stock.symbol, stock.name)
        }
        // Reload after adding defaults
        const updatedStocks = await getUserStocks() as unknown as FirebaseStock[]
        setWatchlist(updatedStocks.map(stock => ({
          id: stock.id,
          symbol: stock.ticker,
          name: stock.companyName
        })))
      } else {
        setWatchlist(userStocks.slice(0, 10).map(stock => ({
          id: stock.id,
          symbol: stock.ticker,
          name: stock.companyName
        })))
      }
    } catch (error) {
      console.error('Error loading watchlist:', error)
      toast({
        title: "Error",
        description: "Failed to load your watchlist",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStocks(false)
    }
  }

  const stocksPerPage = 8
  const totalPages = Math.ceil(watchlist.length / stocksPerPage)
  const startIndex = currentPage * stocksPerPage
  const visibleStocks = watchlist.slice(startIndex, startIndex + stocksPerPage)

  const handleUpdateWatchlist = async (newStocks: Stock[]) => {
    try {
      // Update watchlist with new stocks
      setWatchlist(newStocks.map((stock) => ({
        symbol: stock.symbol,
        name: stock.name
      })))
      setCurrentPage(0)
      
      toast({
        title: "Watchlist Updated",
        description: "Your watchlist has been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watchlist",
        variant: "destructive",
      })
    }
  }

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
  }

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0))
  }

  const handleRefresh = async () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleScrollToStocks = () => {
    const stocksSection = document.getElementById('stocks-section')
    if (stocksSection) {
      stocksSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Getting Started - Workflow Guidance */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Getting Started with ConcoreNews</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Screenshot Analysis */}
          <Card className="border-blue-200 hover:border-blue-400 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5 text-blue-600" />
                Screenshot Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Upload trading screenshots for instant AI analysis to extract stock tickers and news.
              </p>
              <Dialog open={showScreenshotAnalyzer} onOpenChange={setShowScreenshotAnalyzer}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    Try Screenshot Analysis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Screenshot Analysis</DialogTitle>
                  </DialogHeader>
                  <ScreenshotAnalyzer 
                    onCatalystAdded={(tickers) => {
                      toast({
                        title: "Catalyst Added",
                        description: `Added catalysts for: ${tickers.join(', ')}`,
                      })
                      setShowScreenshotAnalyzer(false)
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Manual Catalyst Entry */}
          <Card className="border-green-200 hover:border-green-400 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <PlusCircle className="h-5 w-5 text-green-600" />
                Add News Catalyst
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Manually add news catalysts with headlines, dates, prices, and notes for your stocks.
              </p>
              <Dialog open={showManualNewsForm} onOpenChange={setShowManualNewsForm}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    Add Catalyst
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add News Catalyst</DialogTitle>
                  </DialogHeader>
                  {watchlist.length > 0 ? (
                    <StockManualNewsForm 
                      ticker={watchlist[0].symbol}
                    />
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      Please add stocks to your watchlist first
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Calendar View */}
          <Link href="/calendar">
            <Card className="border-purple-200 hover:border-purple-400 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Calendar & Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  View earnings calendar, upcoming events, and important dates for your stocks.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Open Calendar
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Stock Analysis */}
          <Card className="border-orange-200 hover:border-orange-400 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                Stock Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Click on any stock below to view detailed analysis, news history, and catalysts.
              </p>
              <Button variant="outline" size="sm" className="w-full" onClick={handleScrollToStocks}>
                Analyze Stocks
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Watchlist Section */}
      <Card id="stocks-section">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle>Your Watchlist</CardTitle>
              <Badge variant="secondary">{watchlist.length} stocks</Badge>
            </div>
            {/* Desktop: Manage button */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowStockSelector(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile: Swipeable carousel */}
          <div className="block md:hidden">
            <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
              <div className="flex min-w-full transition-transform duration-300" style={{ transform: `translateX(-${mobilePage * 100}vw)` }}>
                {Array.from({ length: totalMobilePages }).map((_, pageIdx) => (
                  <div key={pageIdx} className="min-w-[100vw] max-w-[100vw] flex-shrink-0">
                    <div className="flex flex-col space-y-4">
                      {watchlist.slice(pageIdx * stocksPerMobilePage, (pageIdx + 1) * stocksPerMobilePage).map((stock) => (
                        <StockCard 
                          key={stock.symbol} 
                          ticker={stock.symbol}
                          name={stock.name}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Page indicator and dots */}
            <div className="flex flex-col items-center mt-2">
              <span className="text-xs text-muted-foreground mb-1">{mobilePage + 1}/{totalMobilePages}</span>
              <div className="flex space-x-2">
                {Array.from({ length: totalMobilePages }).map((_, idx) => (
                  <span key={idx} className={`w-2 h-2 rounded-full ${mobilePage === idx ? 'bg-blue-600' : 'bg-gray-300'}`}></span>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: grid view */}
          <div className="hidden md:block">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {visibleStocks.map((stock) => (
                <StockCard 
                  key={stock.symbol} 
                  ticker={stock.symbol}
                  name={stock.name}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Selector Modal */}
      {showStockSelector && (
        <StockSelector
          currentStocks={watchlist.map(stock => ({ ticker: stock.symbol, name: stock.name }))}
          onUpdate={(stocks) => handleUpdateWatchlist(stocks.map(stock => ({ symbol: stock.ticker, name: stock.name })))}
          onClose={() => setShowStockSelector(false)}
        />
      )}
    </div>
  )
}
