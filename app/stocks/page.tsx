"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { StockCard } from "@/components/stock-card"
import { Button } from "@/components/ui/button"
import { SearchStocks } from "@/components/search-stocks"
import { Settings } from "lucide-react"
import { StockSelector } from "@/components/stock-selector"

const DEFAULT_STOCKS = [
  { ticker: "AAPL", name: "Apple Inc." },
  { ticker: "MSFT", name: "Microsoft Corporation" },
  { ticker: "GOOGL", name: "Alphabet Inc." },
  { ticker: "AMZN", name: "Amazon.com Inc." },
  { ticker: "META", name: "Meta Platforms Inc." },
  { ticker: "TSLA", name: "Tesla Inc." },
  { ticker: "NVDA", name: "NVIDIA Corporation" },
  { ticker: "NFLX", name: "Netflix Inc." },
  { ticker: "CRM", name: "Salesforce Inc." },
  { ticker: "ORCL", name: "Oracle Corporation" },
]

export default function StocksPage() {
  const [selectedStocks, setSelectedStocks] = useState(DEFAULT_STOCKS)
  const [showStockSelector, setShowStockSelector] = useState(false)
  const [stockCounts, setStockCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    // Load saved stocks from localStorage
    const savedStocks = localStorage.getItem("selectedStocks")
    if (savedStocks) {
      setSelectedStocks(JSON.parse(savedStocks))
    }

    // Mock news counts - would be replaced with actual API call
    const mockCounts: Record<string, number> = {}
    selectedStocks.forEach((stock) => {
      mockCounts[stock.ticker] = Math.floor(Math.random() * 30) + 5
    })
    setStockCounts(mockCounts)
  }, [])

  const handleStocksUpdate = (newStocks: typeof DEFAULT_STOCKS) => {
    setSelectedStocks(newStocks)
    localStorage.setItem("selectedStocks", JSON.stringify(newStocks))
    setShowStockSelector(false)

    // Update news counts for new stocks
    const mockCounts: Record<string, number> = {}
    newStocks.forEach((stock) => {
      mockCounts[stock.ticker] = Math.floor(Math.random() * 30) + 5
    })
    setStockCounts(mockCounts)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            ← Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">All Stocks</h1>
        <p className="text-muted-foreground">Browse and manage your stock news portfolio</p>
      </div>

      <div className="mb-8">
        <SearchStocks />
      </div>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Your Watch List ({selectedStocks.length} stocks)</h2>
          <Button variant="outline" onClick={() => setShowStockSelector(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Watch List
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {selectedStocks.map((stock) => (
            <StockCard
              key={stock.ticker}
              ticker={stock.ticker}
              name={stock.name}
              newsCount={stockCounts[stock.ticker] || 0}
            />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Customize Watch List</h3>
            <p className="text-sm text-muted-foreground mb-4">Add or remove stocks from your tracking list</p>
            <Button variant="outline" onClick={() => setShowStockSelector(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Stocks
            </Button>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Search All Stocks</h3>
            <p className="text-sm text-muted-foreground mb-4">Find any stock to view or add to your watch list</p>
            <SearchStocks />
          </div>
        </div>
      </section>

      {showStockSelector && (
        <StockSelector
          currentStocks={selectedStocks}
          onUpdate={handleStocksUpdate}
          onClose={() => setShowStockSelector(false)}
        />
      )}
    </div>
  )
}
