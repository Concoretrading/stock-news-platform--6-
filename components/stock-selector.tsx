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
}

export function StockSelector({ isOpen, onClose, onUpdateWatchlist, currentStocks, maxStocks }: StockSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStocks, setSelectedStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      console.log('📋 Stock selector opened, loading current stocks:', currentStocks)
      console.log('📋 Current stocks structure:', currentStocks.map(s => ({ symbol: s.symbol, name: s.name, id: s.id })))
      setSelectedStocks(currentStocks)
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
    console.log('🗑️ Attempting to remove stock:', stock)
    console.log('🗑️ Current selectedStocks before removal:', selectedStocks)
    const newSelectedStocks = selectedStocks.filter(s => s.symbol !== stock.symbol)
    console.log('🗑️ New selectedStocks after removal:', newSelectedStocks)
    console.log('🗑️ Successfully removed?', newSelectedStocks.length < selectedStocks.length)
    setSelectedStocks(newSelectedStocks)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      console.log('Starting save operation...')
      console.log('Selected stocks:', selectedStocks)
      console.log('Current stocks from props:', currentStocks)
      
      // Get current stocks from API with timeout
      const currentResponse = await Promise.race([
        fetchWithAuth('/api/watchlist'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ]) as Response
      
      const currentResult = await currentResponse.json()
      
      if (!currentResult.success) {
        throw new Error(currentResult.error || 'Failed to get current stocks')
      }
      
      const currentApiStocks = currentResult.data
      console.log('Current stocks from API:', currentApiStocks)
      
      // Find stocks to add and remove
      const currentSymbols = currentApiStocks.map((stock: any) => stock.ticker)
      const selectedSymbols = selectedStocks.map(stock => stock.symbol)
      
      const stocksToAdd = selectedStocks.filter(stock => !currentSymbols.includes(stock.symbol))
      const stocksToRemove = currentApiStocks.filter((stock: any) => !selectedSymbols.includes(stock.ticker))
      
      console.log('Stocks to add:', stocksToAdd)
      console.log('Stocks to remove:', stocksToRemove)
      
      // Track failures
      const failures: string[] = []
      
      // Remove stocks first (in parallel with timeout protection)
      if (stocksToRemove.length > 0) {
        const removePromises = stocksToRemove.map(async (stock: any) => {
          try {
            const removeResponse = await Promise.race([
              fetchWithAuth(`/api/watchlist?id=${stock.id}`, {
                method: 'DELETE',
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Remove timeout')), 8000)
              )
            ]) as Response
            
            const removeResult = await removeResponse.json()
            if (!removeResult.success) {
              console.error(`Failed to remove ${stock.ticker}:`, removeResult.error)
              failures.push(`Remove ${stock.ticker}: ${removeResult.error}`)
            } else {
              console.log(`Successfully removed ${stock.ticker}`)
            }
          } catch (error) {
            console.error(`Error removing ${stock.ticker}:`, error)
            failures.push(`Remove ${stock.ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        })
        
        await Promise.allSettled(removePromises)
      }
      
      // Add new stocks (in parallel with timeout protection)
      if (stocksToAdd.length > 0) {
        const addPromises = stocksToAdd.map(async (stock) => {
          try {
            const addResponse = await Promise.race([
              fetchWithAuth('/api/watchlist', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ticker: stock.symbol,
                  companyName: stock.name,
                }),
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Add timeout')), 8000)
              )
            ]) as Response
            
            const addResult = await addResponse.json()
            if (!addResult.success) {
              console.error(`Failed to add ${stock.symbol}:`, addResult.error)
              failures.push(`Add ${stock.symbol}: ${addResult.error}`)
            } else {
              console.log(`Successfully added ${stock.symbol}`)
            }
          } catch (error) {
            console.error(`Error adding ${stock.symbol}:`, error)
            failures.push(`Add ${stock.symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        })
        
        await Promise.allSettled(addPromises)
      }
      
      // Get updated stocks with timeout
      const updatedResponse = await Promise.race([
        fetchWithAuth('/api/watchlist'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Update fetch timeout')), 10000)
        )
      ]) as Response
      
      const updatedResult = await updatedResponse.json()
      
      if (updatedResult.success) {
        const updatedStocks = updatedResult.data.map((stock: any) => ({
          id: stock.id,
          symbol: stock.ticker,
          name: stock.companyName
        }))
        onUpdateWatchlist(updatedStocks)
        console.log('Updated watchlist:', updatedStocks)
      }
      
      // Show appropriate toast message
      if (failures.length === 0) {
        toast({
          title: "Success",
          description: "Watchlist updated successfully",
        })
      } else if (failures.length < (stocksToAdd.length + stocksToRemove.length)) {
        toast({
          title: "Partial Success",
          description: `Some operations failed: ${failures.join(', ')}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: `All operations failed: ${failures.join(', ')}`,
          variant: "destructive",
        })
      }
      
      onClose()
    } catch (error) {
      console.error('Error updating watchlist:', error)
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
            <h3 className="text-lg font-semibold mb-2 flex-shrink-0">Selected Stocks</h3>
            <div className="flex-1 border border-border rounded-lg p-4 overflow-y-auto bg-muted/20">
              <div className="space-y-2">
                {selectedStocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No stocks selected yet.<br />
                    Browse and add stocks from the right panel.
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
                              ✓ Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
                      </div>
                      <Button
                        variant={isSelected(stock) ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleStock(stock)}
                        disabled={!isSelected(stock) && selectedStocks.length >= maxStocks}
                        className="ml-3 h-8 text-xs"
                      >
                        {isSelected(stock) ? "Remove" : "Add"}
                      </Button>
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
