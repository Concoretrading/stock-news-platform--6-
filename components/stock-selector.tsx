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
    setSelectedStocks(selectedStocks.filter(s => s.symbol !== stock.symbol))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // Get current stocks from API
      const currentResponse = await fetchWithAuth('/api/watchlist')
      const currentResult = await currentResponse.json()
      
      if (!currentResult.success) {
        throw new Error(currentResult.error || 'Failed to get current stocks')
      }
      
      const currentStocks = currentResult.data
      
      // Find stocks to add and remove
      const currentSymbols = currentStocks.map((stock: any) => stock.ticker)
      const selectedSymbols = selectedStocks.map(stock => stock.symbol)
      
      const stocksToAdd = selectedStocks.filter(stock => !currentSymbols.includes(stock.symbol))
      const stocksToRemove = currentStocks.filter((stock: any) => !selectedSymbols.includes(stock.ticker))
      
      // Add new stocks
      for (const stock of stocksToAdd) {
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
          console.error(`Failed to add ${stock.symbol}:`, addResult.error)
        }
      }
      
      // Remove stocks
      for (const stock of stocksToRemove) {
        const removeResponse = await fetchWithAuth(`/api/watchlist?id=${stock.id}`, {
          method: 'DELETE',
        })
        const removeResult = await removeResponse.json()
        if (!removeResult.success) {
          console.error(`Failed to remove ${stock.ticker}:`, removeResult.error)
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
      }
      
      toast({
        title: "Success",
        description: "Watchlist updated successfully",
      })
      
      onClose()
    } catch (error) {
      console.error('Error updating watchlist:', error)
      toast({
        title: "Error",
        description: "Failed to update watchlist",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Your Watchlist ({selectedStocks.length}/{maxStocks})</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-6 h-full">
          {/* Selected Stocks Panel */}
          <div className="w-1/3 flex flex-col">
            <h3 className="text-lg font-semibold mb-2">Selected Stocks</h3>
            <div className="flex-1 border rounded-lg p-4 overflow-y-auto">
              <div className="space-y-2">
                {selectedStocks.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div>
                      <span className="font-medium">{stock.symbol}</span>
                      <p className="text-sm text-muted-foreground">{stock.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStock(stock)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Available Stocks Panel */}
          <div className="w-2/3 flex flex-col">
            <div className="mb-4">
              <Input
                placeholder="Search stocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex-1 border rounded-lg p-4 overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {availableStocks.slice(0, 50).map((stock) => (
                  <Card key={stock.ticker} className="p-3 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{stock.ticker}</span>
                        <p className="text-sm text-muted-foreground">{stock.name}</p>
                      </div>
                      <Button
                        variant={isSelected(stock) ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => toggleStock(stock)}
                        disabled={!isSelected(stock) && selectedStocks.length >= maxStocks}
                      >
                        {isSelected(stock) ? "Remove" : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
