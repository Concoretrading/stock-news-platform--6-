"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { StockCard } from "@/components/stock-card"
import { StockSelector } from "@/components/stock-selector"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Settings, ChevronLeft, ChevronRight, ArrowDown, Camera, List, Shuffle, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ScreenshotButton from "@/components/ScreenshotButton"
import { useAuth } from "@/components/auth-provider"
import { getUserStocks, addStockToWatchlist, getIdToken } from "@/lib/firebase-services"
import { fetchWithAuth } from "@/lib/fetchWithAuth"

interface Stock {
  id?: string
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

interface FirebaseStock {
  id: string
  ticker: string
  companyName: string
  createdAt: any
}

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [watchlist, setWatchlist] = useState<Stock[]>([])
  const [showStockSelector, setShowStockSelector] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [globalDragActive, setGlobalDragActive] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [isLoadingStocks, setIsLoadingStocks] = useState(true)
  const { toast } = useToast()

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
  }, [user])

  const loadUserWatchlist = async () => {
    try {
      setIsLoadingStocks(true)
      const userStocks = await getUserStocks() as FirebaseStock[]
      
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
        ];
        for (const stock of defaultStocks) {
          await addStockToWatchlist(stock.symbol, stock.name)
        }
        // Reload after adding defaults
        const updatedStocks = await getUserStocks() as FirebaseStock[]
        setWatchlist(updatedStocks.map(stock => ({
          id: stock.id,
          symbol: stock.ticker,
          name: stock.companyName,
          price: Math.random() * 500 + 50,
          change: (Math.random() - 0.5) * 20,
          changePercent: (Math.random() - 0.5) * 5,
        })))
      } else {
        setWatchlist(userStocks.slice(0, 10).map(stock => ({
          id: stock.id,
          symbol: stock.ticker,
          name: stock.companyName,
          price: Math.random() * 500 + 50,
          change: (Math.random() - 0.5) * 20,
          changePercent: (Math.random() - 0.5) * 5,
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

  const handleUpdateWatchlist = async (newStocks: any[]) => {
    try {
      // Clear existing stocks and add new ones
      setWatchlist(newStocks.map((stock) => ({
        symbol: stock.ticker,
        name: stock.name,
        price: Math.random() * 500 + 50,
        change: (Math.random() - 0.5) * 20,
        changePercent: (Math.random() - 0.5) * 5,
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

  // Global drag-and-drop handlers
  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setGlobalDragActive(true)
  }
  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setGlobalDragActive(false)
  }
  const handleGlobalDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setGlobalDragActive(false)
    const files = e.dataTransfer.files
    if (files && files[0] && files[0].type.startsWith("image/")) {
      const file = files[0]
      setDroppedFile(file)
      try {
        const idToken = await getIdToken()
        if (!idToken) {
          console.error("No ID token found. User may not be authenticated.")
          toast({
            title: "Not Authenticated",
            description: "You must be logged in to analyze screenshots. Please log in and try again.",
            variant: "destructive",
          })
          setDroppedFile(null)
          return
        }
        console.log("Frontend ID Token:", idToken)
        const formData = new FormData()
        formData.append("image", file)
        const response = await fetchWithAuth("/api/analyze-screenshot", {
          method: "POST",
          body: formData,
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        if (result.error) {
          throw new Error(result.error)
        }
        setDroppedFile(null)
      } catch (error) {
        console.error("Screenshot analysis failed:", error)
        toast({
          title: "Analysis Failed",
          description: error instanceof Error ? error.message : "Unable to analyze the screenshot. Please try again.",
          variant: "destructive",
        })
        setDroppedFile(null)
      }
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div
      className="min-h-screen bg-background relative"
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
    >
      {globalDragActive && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-blue-900/80 pointer-events-none">
          <div className="text-2xl font-bold text-blue-200 mb-4">Drop your screenshot to organize</div>
        </div>
      )}
      <AppHeader />
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Watchlist Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <CardTitle>Your Watchlist</CardTitle>
                <Badge variant="secondary">{watchlist.length} stocks</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage + 1} of {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowStockSelector(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {visibleStocks.map((stock) => (
                <StockCard key={stock.symbol} stock={stock} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Section: How to use the dashboard */}
        <Card className="my-8 border-2 border-gradient-to-r from-blue-500 to-purple-500 bg-gradient-to-br from-slate-900/50 to-blue-900/30 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Professional Trading Workflow
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Create Watch List */}
              <div className="group relative p-6 bg-slate-800/50 rounded-xl border border-blue-700/30 hover:border-blue-600/50 transition-all duration-300 hover:shadow-md hover:bg-slate-800/70 flex flex-col items-center text-center">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-900/50 rounded-full flex items-center justify-center group-hover:bg-blue-800/70 transition-colors">
                    <span className="text-blue-300 font-bold text-lg">1</span>
                  </div>
                  <h3 className="font-semibold text-lg text-slate-200">Create Your Watch List</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Build a personalized watch list of your favorite stocks. Add, remove, and organize stocks to track their performance and stay focused on your investment strategy.
                </p>
                <List className="h-6 w-6 mt-3 text-blue-400" />
              </div>

              {/* Upload Screenshots Anywhere */}
              <div className="group relative p-6 bg-slate-800/50 rounded-xl border border-green-700/30 hover:border-green-600/50 transition-all duration-300 hover:shadow-md hover:bg-slate-800/70 flex flex-col items-center text-center">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-900/50 rounded-full flex items-center justify-center group-hover:bg-green-800/70 transition-colors">
                    <span className="text-green-300 font-bold text-lg">2</span>
                  </div>
                  <h3 className="font-semibold text-lg text-slate-200">Upload Screenshots Anywhere</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Simply drag and drop your trading screenshots anywhere on the dashboard for instant AI analysis. No need to navigate to specific upload areas—drop your images and let our platform do the rest!
                </p>
                <Shuffle className="h-6 w-6 mt-3 text-green-400" />
              </div>

              {/* Automatic Filing */}
              <div className="group relative p-6 bg-slate-800/50 rounded-xl border border-purple-700/30 hover:border-purple-600/50 transition-all duration-300 hover:shadow-md hover:bg-slate-800/70 flex flex-col items-center text-center">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-900/50 rounded-full flex items-center justify-center group-hover:bg-purple-800/70 transition-colors">
                    <span className="text-purple-300 font-bold text-lg">3</span>
                  </div>
                  <h3 className="font-semibold text-lg text-slate-200">Automatic Stock History</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  All analyzed screenshots are automatically filed within your stock history. Each stock maintains a complete record of your analysis, making it easy to track patterns and insights over time.
                </p>
                <Calendar className="h-6 w-6 mt-3 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Selector Modal - Only show when showStockSelector is true */}
        {showStockSelector && (
          <StockSelector
            currentStocks={watchlist.map((stock) => ({ ticker: stock.symbol, name: stock.name }))}
            onUpdate={handleUpdateWatchlist}
            onClose={() => setShowStockSelector(false)}
          />
        )}
        
        {/* Floating Screenshot Button */}
        <ScreenshotButton />
      </main>
    </div>
  )
}
