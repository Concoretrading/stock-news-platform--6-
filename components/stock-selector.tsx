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
      console.log('🔴 Props isShowingDefaults:', isShowingDefaults)
      
      if (isShowingDefaults) {
        // When showing UI-only defaults, start with empty selection
        // This prevents auto-saving the default stocks to database
        console.log('🔴 Showing defaults - starting with empty selection')
        setSelectedStocks([])
      } else {
        // When showing actual saved stocks, use them as initial selection
        console.log('🔴 Showing saved stocks - using current stocks as selection')
        setSelectedStocks(currentStocks)
      }
    }
  }, [isOpen, currentStocks, isShowingDefaults])

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
    setLoading(true)
    console.log('🔴 Starting save process...')
    
    try {
      // Get current stocks from API
      const currentResponse = await fetchWithAuth('/api/watchlist')
      const currentResult = await currentResponse.json()
      
      if (!currentResult.success) {
        throw new Error(currentResult.error || 'Failed to get current stocks')
      }
      
      const currentStocks = currentResult.data
      console.log('🔴 Current stocks:', currentStocks.length, currentStocks.map((s: any) => s.ticker))
      
      // Find stocks to remove and add
      const currentTickers = currentStocks.map((s: any) => s.ticker)
      const selectedTickers = selectedStocks.map(s => s.symbol)
      
      const stocksToRemove = currentStocks.filter((s: any) => !selectedTickers.includes(s.ticker))
      const stocksToAdd = selectedStocks.filter(s => !currentTickers.includes(s.symbol))
      
      console.log('🔴 Stocks to remove:', stocksToRemove.length, stocksToRemove.map((s: any) => s.ticker))
      console.log('🔴 Stocks to add:', stocksToAdd.length, stocksToAdd.map((s: any) => s.symbol))
      
      // Remove stocks (sequential to avoid conflicts)
      for (const stock of stocksToRemove) {
        try {
          console.log(`🔴 Removing stock: ${stock.ticker}`)
          const removeResponse = await fetchWithAuth(`/api/watchlist?id=${stock.id}`, {
            method: 'DELETE'
          })
          const removeResult = await removeResponse.json()
          if (!removeResult.success) {
            console.error(`❌ Failed to remove ${stock.ticker}:`, removeResult.error)
          } else {
            console.log(`✅ Successfully removed ${stock.ticker}`)
          }
        } catch (error) {
          console.error(`❌ Error removing ${stock.ticker}:`, error)
        }
      }
      
      // Add stocks (sequential to avoid conflicts)
      for (const stock of stocksToAdd) {
        try {
          console.log(`🔴 Adding stock: ${stock.symbol}`)
          const addResponse = await fetchWithAuth('/api/watchlist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticker: stock.symbol,
              companyName: stock.name,
            }),
          })
          const addResult = await addResponse.json()
          if (!addResult.success) {
            console.error(`❌ Failed to add ${stock.symbol}:`, addResult.error)
          } else {
            console.log(`✅ Successfully added ${stock.symbol}`)
          }
        } catch (error) {
          console.error(`❌ Error adding ${stock.symbol}:`, error)
        }
      }
      
      // Get updated stocks
      const updatedResponse = await fetchWithAuth('/api/watchlist')
      const updatedResult = await updatedResponse.json()
      
      if (updatedResult.success) {
        const updatedStocks = updatedResult.data.map((stock: any) => ({
          id: stock.id,
          symbol: stock.ticker,
          name: stock.companyName
        }))
        onUpdateWatchlist(updatedStocks)
        console.log('🔴 Final updated watchlist:', updatedStocks.length, updatedStocks.map((s: Stock) => s.symbol))
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
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col bg-card">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Your Watchlist ({selectedStocks.length}/{maxStocks})</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Selected Stocks Panel */}
          <div className="w-1/3 flex flex-col min-h-0">
            <h3 className="text-lg font-semibold mb-2 flex-shrink-0">Your Watchlist (Remove ✕)</h3>
            <div className="flex-1 border border-border rounded-lg p-4 overflow-y-auto bg-muted/20">
              <div className="space-y-2">
                {selectedStocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No stocks selected yet.<br />
                    Add stocks from the panel on the right →
                  </p>
                ) : (
                  selectedStocks.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-3 bg-muted/50 dark:bg-muted rounded-lg border border-border">
                      <div className="flex-1">
                        <span className="font-medium text-sm text-foreground">{stock.symbol}</span>
                        <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStock(stock)}
                        className="ml-2 h-8 w-8 p-0 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
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
          <div className="w-2/3 flex flex-col min-h-0">
            <h3 className="text-lg font-semibold mb-3 flex-shrink-0">Add Stocks (+)</h3>
            <div className="mb-4 flex-shrink-0">
              <Input
                placeholder="Search stocks... (e.g. AAPL, Apple, Tesla)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Showing {availableStocks.slice(0, 100).length} of {availableStocks.length} stocks
              </p>
            </div>
            
            <div className="flex-1 border border-border rounded-lg p-4 overflow-y-auto bg-muted/10">
              <div className="grid grid-cols-1 gap-2">
                {availableStocks.slice(0, 100).map((stock) => (
                  <Card key={stock.ticker} className="p-3 cursor-pointer hover:bg-muted/70 dark:hover:bg-muted/40 transition-colors border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
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
                          className="ml-3 h-8 text-xs"
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
                {availableStocks.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No stocks found matching "{searchTerm}"</p>
                    <p className="text-sm text-muted-foreground mt-1">Try searching for ticker symbols like AAPL, MSFT, TSLA</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center gap-4 mt-4 pt-4 border-t border-border flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            {selectedStocks.length} of {maxStocks} stocks selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="min-w-[120px]"
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
