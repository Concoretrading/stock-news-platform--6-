"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export function SearchStocks() {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  // Mock data - would be replaced with actual API call
  const stockResults = [
    { ticker: "AAPL", name: "Apple Inc." },
    { ticker: "MSFT", name: "Microsoft Corporation" },
    { ticker: "GOOGL", name: "Alphabet Inc." },
    { ticker: "AMZN", name: "Amazon.com Inc." },
    { ticker: "META", name: "Meta Platforms Inc." },
  ]

  const filteredResults = stockResults.filter(
    (stock) =>
      stock.ticker.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase()),
  )

  const handleSelect = (ticker: string) => {
    setIsOpen(false)
    setQuery("")
    router.push(`/stocks/${ticker}`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(value.length > 0)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search for a stock..."
          className="pl-10"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
      </div>

      {isOpen && query && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-64 overflow-y-auto">
          <CardContent className="p-2">
            {filteredResults.length > 0 ? (
              <div className="space-y-1">
                {filteredResults.map((stock) => (
                  <div
                    key={stock.ticker}
                    className="flex items-center p-2 hover:bg-accent rounded-sm cursor-pointer"
                    onClick={() => handleSelect(stock.ticker)}
                  >
                    <span className="font-medium mr-2">{stock.ticker}</span>
                    <span className="text-muted-foreground text-sm">{stock.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 text-sm text-muted-foreground">No results found for "{query}"</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
