"use client"

import React from "react";

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, ChevronLeft, ChevronRight, Settings, Upload, Calendar, Twitter, Monitor, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { StockCard } from "@/components/stock-card"
import { StockSelector } from "@/components/stock-selector"
import { AppHeader } from "@/components/app-header"
import { OnboardingPopup } from "@/components/onboarding-popup"
import { NewsPasteButton } from "@/components/news-paste-button"
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

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

interface EconomicEvent {
  id: string
  date: string
  time: string
  event: string
  importance: 'HIGH' | 'MEDIUM' | 'LOW'
  iconUrl?: string
  created_at?: any
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
  const [mounted, setMounted] = useState(false)
  const [watchlist, setWatchlist] = useState<Stock[]>([])
  const [isLoadingStocks, setIsLoadingStocks] = useState(true)
  const [showStockSelector, setShowStockSelector] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [showPastInstructions, setShowPastInstructions] = useState(false)
  const [showFutureInstructions, setShowFutureInstructions] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [isShowingDefaults, setIsShowingDefaults] = useState(false) // Track if showing UI-only defaults
  const [todaysEvents, setTodaysEvents] = useState<EconomicEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false)
  const [processingArticle, setProcessingArticle] = useState(false)
  const [showPastePrompt, setShowPastePrompt] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const dragCounterRef = useRef(0)
  
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const isMobile = useIsMobile()

  // Ensure component only renders on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Carousel settings - show 3 stocks per page on mobile, 8 on desktop, max 10 total
  const stocksPerPage = isMobile ? 3 : 8
  const maxStocks = 10

  // Hide instructions after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  // Show onboarding for new users (with a small delay to avoid immediate popup)
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!loading && user && !showOnboarding && !onboardingChecked) {
        setOnboardingChecked(true) // Mark as checked to prevent multiple calls
        
        try {
          const token = user.uid === 'test-user-localhost' ? 'dev-token-localhost' : await user.firebaseUser?.getIdToken()
          if (!token) return
          
          const response = await fetchWithAuth('/api/user-preferences', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && !result.data.hasSeenOnboarding) {
              // Small delay to avoid immediate popup
              setTimeout(() => {
                setShowOnboarding(true)
              }, 1000)
            }
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error)
        }
      }
    }
    
    // Only check onboarding status once when user is loaded
    if (user && !loading && !onboardingChecked) {
      checkOnboardingStatus()
    }
  }, [user, loading, onboardingChecked])

  // Utility function to reset onboarding (for testing)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - Adding to window for testing
      window.resetOnboarding = async () => {
        if (user) {
          try {
            const token = user.uid === 'test-user-localhost' ? 'dev-token-localhost' : await user.firebaseUser?.getIdToken()
            if (token) {
              await fetchWithAuth('/api/user-preferences', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ hasSeenOnboarding: false })
              })
              setShowOnboarding(true)
              console.log('🔄 Onboarding reset - popup will show again')
            }
          } catch (error) {
            console.error('Error resetting onboarding:', error)
          }
        }
      }
    }
  }, [user])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch today's economic events
  const fetchTodaysEvents = async () => {
    try {
      setEventsLoading(true)
      const db = getFirestore()
      const today = format(new Date(), 'yyyy-MM-dd')
      
      const economicEventsRef = collection(db, 'economic_events')
      const todayQuery = query(
        economicEventsRef,
        where('date', '==', today)
      )
      
      const snapshot = await getDocs(todayQuery)
      const events: EconomicEvent[] = []
      
      snapshot.forEach((doc) => {
        const data = doc.data()
        events.push({
          id: doc.id,
          date: data.date,
          time: data.time,
          event: data.event,
          importance: data.importance,
          iconUrl: data.iconUrl,
          created_at: data.created_at
        })
      })
      
      // Sort events by time
      events.sort((a, b) => {
        const timeA = new Date(`2000-01-01 ${a.time}`).getTime()
        const timeB = new Date(`2000-01-01 ${b.time}`).getTime()
        return timeA - timeB
      })
      
      setTodaysEvents(events)
    } catch (error) {
      console.error('Error fetching today\'s events:', error)
      toast({
        title: "Error",
        description: "Failed to fetch today's economic events",
        variant: "destructive"
      })
    } finally {
      setEventsLoading(false)
    }
  }

  // Fetch today's events when calendar tab is clicked
  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchTodaysEvents()
    }
  }, [activeTab])

  // Load user's watchlist from Firebase
  useEffect(() => {
    if (user) {
      loadUserWatchlist()
    }
  }, [user, refreshKey])

  const processNewsArticle = async (articleText: string) => {
    setProcessingArticle(true)
    try {
      const response = await fetchWithAuth('/api/process-news-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleText })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "News Article Processed! 📰",
          description: `Found ${data.tickers?.length || 0} stock matches, created ${data.successCount || 0} catalyst entries`,
        })
      } else {
        throw new Error('Failed to process article')
      }
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "Unable to process the news article. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingArticle(false)
    }
  }

  const processScreenshot = async (file: File) => {
    console.log('🔄 Starting screenshot processing...')
    setProcessingArticle(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      console.log('📤 Sending request to /api/analyze-screenshot')

      const response = await fetchWithAuth("/api/analyze-screenshot", {
        method: "POST",
        body: formData,
      })

      console.log('📥 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Screenshot analysis result:', data)
      
      const successCount = data.newsEntryResults?.filter((r: any) => r.success).length || 0
      const tickers = data.newsEntryResults?.filter((r: any) => r.success).map((r: any) => r.ticker) || []
      
      toast({
        title: "Screenshot Processed! 📸",
        description: successCount > 0 
          ? `Catalyst(s) added for: ${tickers.join(", ")}`
          : 'No matching stocks found in your watchlist',
        variant: successCount > 0 ? 'default' : 'destructive',
      })
    } catch (error) {
      console.error('❌ Screenshot processing error:', error)
      toast({
        title: "Screenshot Analysis Failed",
        description: error instanceof Error ? error.message : "Unable to analyze the screenshot. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingArticle(false)
    }
  }

  // Global paste detection
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Don't process paste if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.contentEditable === 'true') {
        return
      }

      if (!user) {
        toast({
          title: "Authentication Required", 
          description: "Please log in to process news articles",
          variant: "destructive",
        })
        return
      }

      const clipboardData = e.clipboardData || (window as any).clipboardData
      const pastedText = clipboardData?.getData('text/plain') || ''

      if (pastedText && pastedText.length > 100) {
        e.preventDefault()
        console.log('Detected news article paste:', pastedText.substring(0, 100) + '...')
        
        // Show confirmation
        setShowPastePrompt(true)
        
        // Auto-process after a brief delay to show the prompt
        setTimeout(async () => {
          setShowPastePrompt(false)
          await processNewsArticle(pastedText)
        }, 1000)
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [user, toast])

  // Global drag and drop handlers
  useEffect(() => {
    console.log('🚀 Setting up drag/drop event listeners...')
    console.log('🔐 User authenticated:', !!user)
    
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('🟢 Drag enter detected', e.dataTransfer?.types)
      dragCounterRef.current++
      setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current--
      if (dragCounterRef.current === 0) {
        console.log('🔴 Drag leave - hiding overlay')
        setIsDragging(false)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('🎯 Drop detected!')
      
      dragCounterRef.current = 0
      setIsDragging(false)

      if (!user) {
        console.log('❌ User not authenticated')
        toast({
          title: "Authentication Required", 
          description: "Please log in to process news articles",
          variant: "destructive",
        })
        return
      }

      // Check for image files first
      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
        if (imageFiles.length > 0) {
          for (const file of imageFiles) {
            await processScreenshot(file)
          }
          return
        }
      }

      // Try to get text content
      let textData = ''
      const types = ['text/plain', 'text/html', 'text/uri-list', 'text']
      for (const type of types) {
        try {
          const data = e.dataTransfer?.getData(type)
          if (data && data.length > textData.length) {
            textData = data
          }
        } catch (err) {
          console.log(`❌ Failed to get ${type}:`, err)
        }
      }

      if (textData && textData.length > 50) {
        await processNewsArticle(textData)
        return
      }

      toast({
        title: "No Content Detected",
        description: "Try selecting and copying the text first, then paste (Ctrl+V) instead",
        variant: "destructive",
      })
    }

    // Add event listeners to document and window
    const elements = [document, window]
    elements.forEach(element => {
      element.addEventListener('dragenter', handleDragEnter as any)
      element.addEventListener('dragleave', handleDragLeave as any)
      element.addEventListener('dragover', handleDragOver as any)
      element.addEventListener('drop', handleDrop as any)
    })

    return () => {
      elements.forEach(element => {
        element.removeEventListener('dragenter', handleDragEnter as any)
        element.removeEventListener('dragleave', handleDragLeave as any)
        element.removeEventListener('dragover', handleDragOver as any)
        element.removeEventListener('drop', handleDrop as any)
      })
    }
  }, [user, toast])

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

  // Don't render anything until mounted to prevent SSR issues
  if (!mounted) {
    return null
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/30 backdrop-blur-sm">
          <div className="h-full w-full flex items-center justify-center">
            <div className="bg-card dark:bg-card p-8 rounded-xl shadow-2xl text-center border-2 border-blue-500 max-w-md mx-4">
              <div className="text-6xl mb-4">📰</div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">Drop News Article Here</h2>
              <p className="text-muted-foreground">Release to process news article with AI</p>
            </div>
          </div>
        </div>
      )}

      {/* Paste detection overlay */}
      {showPastePrompt && (
        <div className="fixed inset-0 z-50 bg-green-500/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card dark:bg-card p-8 rounded-xl shadow-2xl text-center border-2 border-green-500">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-2">News Article Detected!</h3>
            <p className="text-muted-foreground">
              Processing your pasted article...
            </p>
          </div>
        </div>
      )}

      {/* Processing overlay */}
      {processingArticle && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card dark:bg-card p-8 rounded-xl shadow-2xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold">Processing Content...</h3>
            <p className="text-muted-foreground mt-2">
              Analyzing screenshot or article and creating catalyst entries
            </p>
          </div>
        </div>
      )}

      {/* Instructions overlay - shows for 5 seconds */}
      {showInstructions && (
        <div className="fixed top-6 right-6 z-40 bg-gradient-to-r from-blue-500 to-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm animate-slide-in-right">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🚀</div>
            <div>
              <h4 className="font-bold mb-1">Getting Started</h4>
              <p className="text-sm opacity-90 mb-2">
                Click manage to customize your watch list. Drop your news on the screen and it will be placed in your stocks history.
              </p>
              <div className="text-xs opacity-75">
                Or use Ctrl+V or the green button ⬇️
              </div>
            </div>
            <button 
              onClick={() => setShowInstructions(false)}
              className="text-white/70 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

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
                {/* Mobile: Horizontal scrolling carousel */}
                <div className="block sm:hidden">
                  <div className="relative">
                    {/* Mobile Horizontal Scroll Container */}
                    <div 
                      className="flex gap-3 px-4 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar"
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch'
                      }}
                    >
                      {watchlist.map((stock) => (
                        <div key={stock.symbol} className="flex-none w-[calc(33.333%-8px)] snap-start">
                          <StockCard 
                            ticker={stock.symbol}
                            name={stock.name}
                            onClick={() => handleStockClick(stock)}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Mobile scroll indicator dots */}
                    {watchlist.length > 3 && (
                      <div className="flex justify-center mt-4 space-x-2">
                        {Array.from({ length: Math.ceil(watchlist.length / 3) }).map((_, idx) => (
                          <div
                            key={idx}
                            className="w-2 h-2 rounded-full bg-gray-300"
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Mobile total counter */}
                    <div className="flex justify-center mt-2">
                      <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                        {watchlist.length} stocks total
                      </div>
                    </div>
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

        {/* Main Content Tabs */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-8">
              {/* Three Aspects of Time Section */}
              <div>
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
                            <span className="flex items-center">
                              <Upload className="h-4 w-4 mr-2" />
                              Try It
                            </span>
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
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Today's Economic Events
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
                <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
                {eventsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading today's events...</p>
                  </div>
                ) : todaysEvents.length > 0 ? (
                  <div className="space-y-4">
                    {todaysEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{event.time}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{event.event}</h3>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={event.importance === 'HIGH' ? 'destructive' : event.importance === 'MEDIUM' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {event.importance}
                          </Badge>
                          {event.importance === 'HIGH' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <Link href="/calendar">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Calendar className="h-4 w-4 mr-2" />
                          View Full Calendar
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">No Events Today</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      No economic events scheduled for today
                    </p>
                    <Link href="/calendar">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Calendar className="h-4 w-4 mr-2" />
                        View Full Calendar
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
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
          onClose={async () => {
            setShowOnboarding(false)
            // Mark that user has seen onboarding
            if (user) {
              try {
                const token = user.uid === 'test-user-localhost' ? 'dev-token-localhost' : await user.firebaseUser?.getIdToken()
                if (token) {
                  await fetchWithAuth('/api/user-preferences', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ hasSeenOnboarding: true })
                  })
                }
              } catch (error) {
                console.error('Error marking onboarding as seen:', error)
              }
            }
          }}
        />
      </div>
      
      <NewsPasteButton />
    </div>
  )
}
