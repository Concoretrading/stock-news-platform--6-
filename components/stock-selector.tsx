"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { X, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import tickers from "@/lib/tickers.json"

interface Stock {
  id?: string
  symbol: string
  name: string
  ticker?: string
  companyName?: string
}

interface TickerItem {
  ticker: string
  name: string
}

interface StockSelectorProps {
  isOpen: boolean
  onClose: () => void
  onUpdateWatchlist: (stocks: Stock[]) => void
  currentStocks: Stock[]
  maxStocks: number
  isShowingDefaults?: boolean // New prop to indicate if currentStocks are UI-only defaults
}

export function StockSelector({ isOpen, onClose, onUpdateWatchlist, currentStocks, maxStocks, isShowingDefaults }: StockSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStocks, setSelectedStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      console.log('🔴 STOCK SELECTOR OPENED')
      console.log('🔴 Props currentStocks:', currentStocks.length, currentStocks.map(s => s.symbol))
      
      // SIMPLIFIED: Always start with currentStocks, but deduplicate them
      const uniqueCurrentStocks = currentStocks.filter((stock, index, self) => 
        index === self.findIndex(s => s.symbol === stock.symbol)
      )
      
      console.log('🔴 Setting selectedStocks to:', uniqueCurrentStocks.map(s => s.symbol))
      setSelectedStocks(uniqueCurrentStocks)
    }
  }, [isOpen, currentStocks])

  const availableStocks = tickers.filter(ticker => 
    ticker.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticker.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isSelected = (tickerItem: TickerItem) => {
    return selectedStocks.some(s => s.symbol === tickerItem.ticker)
  }

  const toggleStock = (tickerItem: TickerItem) => {
    if (isSelected(tickerItem)) {
      setSelectedStocks(selectedStocks.filter(s => s.symbol !== tickerItem.ticker))
    } else {
      if (selectedStocks.length < maxStocks) {
        setSelectedStocks([...selectedStocks, { symbol: tickerItem.ticker, name: tickerItem.name }])
      } else {
        toast({
          title: "Maximum stocks reached",
          description: `You can only select up to ${maxStocks} stocks`,
          variant: "destructive",
        })
      }
    }
  }

  const removeStock = (stock: Stock) => {
    console.log('🔴 REMOVE ATTEMPT:', stock.symbol)
    console.log('🔴 Before removal - selectedStocks count:', selectedStocks.length)
    console.log('🔴 Before removal - selectedStocks:', selectedStocks.map(s => s.symbol))
    
    const newSelectedStocks = selectedStocks.filter(s => s.symbol !== stock.symbol)
    
    console.log('🔴 After filter - newSelectedStocks count:', newSelectedStocks.length)
    console.log('🔴 After filter - newSelectedStocks:', newSelectedStocks.map(s => s.symbol))
    console.log('🔴 Successfully filtered?', newSelectedStocks.length < selectedStocks.length)
    
    setSelectedStocks(newSelectedStocks)
    
    // Log after state update (this will show in next render)
    setTimeout(() => {
      console.log('🔴 State after update - selectedStocks count:', selectedStocks.length)
    }, 100)
  }

  const handleSave = async () => {
    if (loading) return // Prevent multiple simultaneous saves
    
    setLoading(true)
    console.log('🔴 Starting SIMPLIFIED save process...')
    console.log('🔴 Selected stocks to save:', selectedStocks.map(s => s.symbol))
    
    try {
      // STEP 1: Get current database state
      const currentResponse = await fetchWithAuth('/api/watchlist')
      const currentResult = await currentResponse.json()
      
      if (!currentResult.success) {
        throw new Error(currentResult.error || 'Failed to get current stocks')
      }
      
      const currentDbStocks = currentResult.data
      console.log('🔴 Current DB stocks:', currentDbStocks.map((s: any) => s.ticker))
      
      // STEP 2: Remove ALL current stocks from database
      for (const stock of currentDbStocks) {
        try {
          console.log(`🗑️ Removing: ${stock.ticker}`)
          await fetchWithAuth(`/api/watchlist?id=${stock.id}`, {
            method: 'DELETE'
          })
        } catch (error) {
          console.error(`❌ Error removing ${stock.ticker}:`, error)
        }
      }
      
      // STEP 3: Add all selected stocks to database
      for (const stock of selectedStocks) {
        try {
          console.log(`➕ Adding: ${stock.symbol}`)
          await fetchWithAuth('/api/watchlist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticker: stock.symbol,
              companyName: stock.name,
            }),
          })
        } catch (error) {
          console.error(`❌ Error adding ${stock.symbol}:`, error)
        }
      }
      
      // STEP 4: Get final result and update UI
      const finalResponse = await fetchWithAuth('/api/watchlist')
      const finalResult = await finalResponse.json()
      
      if (finalResult.success) {
        const finalStocks = finalResult.data.map((stock: any) => ({
          id: stock.id,
          symbol: stock.ticker,
          name: stock.companyName
        }))
        
        console.log('🔴 Final watchlist:', finalStocks.map((s: any) => s.symbol))
        onUpdateWatchlist(finalStocks)
      }
      
      toast({
        title: "Success",
        description: "Watchlist updated successfully",
      })
      
      onClose()
    } catch (error) {
      console.error('❌ Error updating watchlist:', error)
      toast({
        title: "Error",
        description: `Failed to update watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col bg-card m-2 sm:m-4">
        <DialogHeader className="flex-shrink-0 pb-2 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl">Edit Your Watchlist ({selectedStocks.length}/{maxStocks})</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0">
          {/* Selected Stocks Panel */}
          <div className="w-full lg:w-1/3 flex flex-col min-h-0 order-2 lg:order-1">
            <h3 className="text-base lg:text-lg font-semibold mb-2 flex-shrink-0">Your Watchlist (Remove ✕)</h3>
            <div className="flex-1 border border-border rounded-lg p-3 sm:p-4 overflow-y-auto bg-muted/20 min-h-[200px] lg:min-h-0">
              <div className="space-y-2">
                {selectedStocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6 lg:py-8">
                    No stocks selected yet.<br />
                    <span className="hidden lg:inline">Add stocks from the panel on the right →</span>
                    <span className="lg:hidden">Add stocks from above ↑</span>
                  </p>
                ) : (
                  selectedStocks.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 dark:bg-muted rounded-lg border border-border">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm text-foreground">{stock.symbol}</span>
                        <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStock(stock)}
                        className="ml-2 h-8 w-8 p-0 hover:bg-destructive/20 text-muted-foreground hover:text-destructive touch-manipulation flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Available Stocks Panel */}
          <div className="w-full lg:w-2/3 flex flex-col min-h-0 order-1 lg:order-2">
            <h3 className="text-base lg:text-lg font-semibold mb-3 flex-shrink-0">Add Stocks (+)</h3>
            <div className="mb-4 flex-shrink-0">
              <Input
                placeholder="Search stocks... (e.g. AAPL, Apple, Tesla)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm touch-manipulation"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Showing {availableStocks.slice(0, 100).length} of {availableStocks.length} stocks
              </p>
            </div>
            
            <div className="flex-1 border border-border rounded-lg p-3 sm:p-4 overflow-y-auto bg-muted/10 min-h-[300px] lg:min-h-0">
              <div className="grid grid-cols-1 gap-2">
                {availableStocks.slice(0, 100).map((stock) => (
                  <Card key={stock.ticker} className="p-2 sm:p-3 cursor-pointer hover:bg-muted/70 dark:hover:bg-muted/40 transition-colors border-border/50 touch-manipulation">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{stock.ticker}</span>
                          {isSelected(stock) && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                              ✓ In Watchlist
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
                      </div>
                      {!isSelected(stock) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => toggleStock(stock)}
                          disabled={selectedStocks.length >= maxStocks}
                          className="ml-3 h-8 text-xs touch-manipulation flex-shrink-0"
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
                {availableStocks.length === 0 && (
                  <div className="text-center py-6 lg:py-8">
                    <p className="text-muted-foreground">No stocks found matching "{searchTerm}"</p>
                    <p className="text-sm text-muted-foreground mt-1">Try searching for ticker symbols like AAPL, MSFT, TSLA</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4 pt-4 border-t border-border flex-shrink-0">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            {selectedStocks.length} of {maxStocks} stocks selected
          </div>
          <div className="flex gap-2 justify-center sm:justify-end">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="flex-1 sm:flex-none min-w-[100px] touch-manipulation"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="flex-1 sm:flex-none min-w-[120px] touch-manipulation"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
