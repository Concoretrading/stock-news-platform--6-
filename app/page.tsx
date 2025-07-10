"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, ChevronLeft, ChevronRight, Settings, Upload, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { StockCard } from "@/components/stock-card"
import { StockSelector } from "@/components/stock-selector"
import { AppHeader } from "@/components/app-header"
import { OnboardingPopup } from "@/components/onboarding-popup"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function HomePage() {
  const [watchlist, setWatchlist] = useState<Stock[]>([])
  const [isLoadingStocks, setIsLoadingStocks] = useState(true)
  const [showStockSelector, setShowStockSelector] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [showPastInstructions, setShowPastInstructions] = useState(false)
  const [showFutureInstructions, setShowFutureInstructions] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isShowingDefaults, setIsShowingDefaults] = useState(false) // Track if showing UI-only defaults
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const isMobile = useIsMobile()

  // Carousel settings - show 5 stocks per page on mobile, 8 on desktop (2 rows of 4), max 10 total
  const stocksPerPage = isMobile ? 5 : 8
  const maxStocks = 10

  // Show onboarding for new users
  useEffect(() => {
    if (isShowingDefaults && !loading) {
      // Check if user has seen onboarding before
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
      if (!hasSeenOnboarding) {
        setShowOnboarding(true)
        // Mark that user has seen onboarding
        localStorage.setItem('hasSeenOnboarding', 'true')
      }
    }
  }, [isShowingDefaults, loading])

  // Utility function to reset onboarding (for testing)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - Adding to window for testing
      window.resetOnboarding = () => {
        localStorage.removeItem('hasSeenOnboarding')
        setShowOnboarding(true)
        console.log('🔄 Onboarding reset - popup will show again')
      }
    }
  }, [])

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
      console.log('🔍 Loading user watchlist...')
      console.log('🔍 Current user:', user)
      
      // Use API endpoint instead of direct Firebase SDK
      const response = await fetchWithAuth('/api/watchlist')
      const result = await response.json()
      
      console.log('🔍 API response:', result)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load watchlist')
      }
      
      const userStocks = result.data
      console.log('🔍 User stocks from API:', userStocks)
      
      if (userStocks.length === 0) {
        // New user with no stocks - show default stocks in UI only (not saved to database)
        console.log('🔍 New user - showing default stocks in UI only')
        const defaultStocks = [
          { symbol: "AAPL", name: "Apple Inc." },
          { symbol: "MSFT", name: "Microsoft Corporation" },
          { symbol: "GOOGL", name: "Alphabet Inc." },
          { symbol: "AMZN", name: "Amazon.com Inc." },
          { symbol: "META", name: "Meta Platforms Inc." },
          { symbol: "TSLA", name: "Tesla Inc." },
          { symbol: "NVDA", name: "NVIDIA Corporation" },
          { symbol: "NFLX", name: "Netflix Inc." },
          { symbol: "AMD", name: "Advanced Micro Devices Inc." },
          { symbol: "INTC", name: "Intel Corporation" },
        ]
        setWatchlist(defaultStocks)
        setIsShowingDefaults(true)
      } else {
        // Existing user - use their saved stocks from database
        console.log('🔍 Existing user - using saved stocks from database')
        setWatchlist(userStocks.slice(0, maxStocks).map((stock: any) => ({
          id: stock.id,
          symbol: stock.ticker,
          name: stock.companyName
        })))
        setIsShowingDefaults(false)
      }
    } catch (error) {
      console.error('❌ Error loading watchlist:', error)
      toast({
        title: "Error",
        description: "Failed to load your watchlist",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStocks(false)
    }
  }

  const totalPages = Math.ceil(watchlist.length / stocksPerPage)
  const startIndex = currentPage * stocksPerPage
  const visibleStocks = watchlist.slice(startIndex, startIndex + stocksPerPage)

  const handleUpdateWatchlist = async (newStocks: Stock[]) => {
    try {
      // Update watchlist with new stocks (limit to 10)
      setWatchlist(newStocks.slice(0, maxStocks).map((stock) => ({
        symbol: stock.symbol,
        name: stock.name
      })))
      setCurrentPage(0)
      
      // If user was seeing defaults and now has actual stocks, update the flag
      if (isShowingDefaults && newStocks.length > 0) {
        setIsShowingDefaults(false)
        console.log('🔍 User transitioned from defaults to saved stocks')
      }
      
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

  const handleStockClick = (stock: Stock) => {
    router.push(`/stocks/${stock.symbol}#history`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Calendar and Logout */}
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Watchlist Section */}
        <Card id="stocks-section" className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg sm:text-xl">Your Watchlist</CardTitle>
                <Badge variant="secondary" className="text-xs sm:text-sm">{watchlist.length} of {maxStocks} stocks</Badge>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Carousel Navigation - Only show on desktop */}
                {totalPages > 1 && (
                  <div className="hidden sm:flex items-center justify-center gap-2 order-2 sm:order-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={prevPage}
                      disabled={currentPage === 0}
                      className="touch-manipulation"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                      {currentPage + 1} of {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={nextPage}
                      disabled={currentPage === totalPages - 1}
                      className="touch-manipulation"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowStockSelector(true)}
                  className="order-1 sm:order-2 touch-manipulation"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStocks ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Mobile: Horizontal Sliding Layout with 5 stocks visible */}
                <div className="block sm:hidden">
                  <div className="relative">
                    {/* Mobile Navigation Arrows */}
                    {totalPages > 1 && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={prevPage}
                          disabled={currentPage === 0}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border-gray-300 shadow-sm"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={nextPage}
                          disabled={currentPage === totalPages - 1}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border-gray-300 shadow-sm"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {/* Horizontal Scroll Container - Show only current page stocks */}
                    <div className="overflow-x-auto scrollbar-hide touch-scroll">
                      <div className="flex gap-3 pb-4">
                        {visibleStocks.map((stock) => (
                          <div key={stock.symbol} className="flex-shrink-0 w-[calc(20%-12px)] transform transition-transform hover:scale-105">
                            <StockCard 
                              ticker={stock.symbol}
                              name={stock.name}
                              onClick={() => handleStockClick(stock)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Mobile Page Indicators */}
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-4">
                        <div className="flex space-x-2">
                          {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentPage(idx)}
                              className={`w-2 h-2 rounded-full transition-colors touch-manipulation ${
                                currentPage === idx ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Desktop: Grid Layout */}
                <div className="hidden sm:block">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
                    {visibleStocks.map((stock) => (
                      <div key={stock.symbol} className="transform transition-transform hover:scale-105">
                        <StockCard 
                          ticker={stock.symbol}
                          name={stock.name}
                          onClick={() => handleStockClick(stock)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Page Indicators - Only show on desktop */}
            {totalPages > 1 && (
              <div className="hidden sm:flex justify-center mt-6">
                <div className="flex space-x-2">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx)}
                      className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-colors touch-manipulation ${
                        currentPage === idx ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Three Aspects of Time Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-2">
              We as traders need to master
            </h2>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              All three aspects of time
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* The Past */}
            <Card className="border-amber-200 hover:border-amber-400 transition-colors flex flex-col">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  The Past
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4 flex-1 flex flex-col justify-between">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  • Drop news anywhere on the dashboard where it then automatically fills in and stores your catalyst within your specific stocks history
                </p>
                <p className="text-center text-sm font-medium text-amber-600 dark:text-amber-400">
                  as long as its a stock in your watch list
                </p>
                <Dialog open={showPastInstructions} onOpenChange={setShowPastInstructions}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 mt-auto">
                      <Upload className="h-4 w-4 mr-2" />
                      Try It
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-amber-700">📸 Drop Screenshot Instructions</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h3 className="font-semibold text-amber-800 mb-2">How to use screenshot dropping:</h3>
                        <ol className="list-decimal list-inside space-y-2 text-amber-700">
                          <li>Take a screenshot of news about any stock in your watchlist</li>
                          <li>Drag and drop the image <strong>anywhere</strong> on this website</li>
                          <li>Our AI will automatically extract the news and create a catalyst</li>
                          <li>The catalyst will be stored in your stock's history</li>
                        </ol>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* The Present */}
            <Card className="border-green-200 hover:border-green-400 transition-colors flex flex-col">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-300">
                  The Present
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4 flex-1 flex flex-col justify-between">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  • We are building some incredibly powerful tools that will be available to the Concore family very soon.
                </p>
                <div className="w-full py-3 px-4 bg-green-50 border border-green-200 rounded-lg mt-auto">
                  <span className="text-green-700 font-medium">Coming Soon</span>
                </div>
              </CardContent>
            </Card>

            {/* The Future */}
            <Card className="border-purple-200 hover:border-purple-400 transition-colors flex flex-col">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  The Future
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4 flex-1 flex flex-col justify-between">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  • We have built a multi-functional calendar to keep us completely prepared for any future upcoming events.
                </p>
                <Link href="/calendar" className="mt-auto">
                  <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                    <Calendar className="h-4 w-4 mr-2" />
                    Open Calendar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stock Selector Modal */}
        {showStockSelector && (
          <StockSelector
            isOpen={true}
            onClose={() => setShowStockSelector(false)}
            onUpdateWatchlist={(stocks) => handleUpdateWatchlist(stocks)}
            currentStocks={watchlist}
            maxStocks={maxStocks}
            isShowingDefaults={isShowingDefaults}
          />
        )}

        {/* Onboarding Popup */}
        <OnboardingPopup
          isVisible={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      </div>
    </div>
  )
}
