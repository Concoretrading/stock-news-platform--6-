"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

interface StockCardProps {
  stock?: Stock
  ticker?: string
  name?: string
  newsCount?: number
  isLastClose?: boolean
  marketOpen?: boolean
}

export function StockCard({ stock, ticker, name, newsCount, isLastClose, marketOpen }: StockCardProps) {
  // Handle both prop patterns
  const symbol = stock?.symbol || ticker || "N/A"
  const stockName = stock?.name || name || "Unknown"
  const price = stock?.price || 0
  const change = stock?.change || 0
  const changePercent = stock?.changePercent || 0
  
  const isPositive = change >= 0

  return (
    <Link href={`/stocks/${symbol}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-lg">{symbol}</h3>
              <p className="text-sm text-muted-foreground truncate">{stockName}</p>
            </div>
            {isLastClose && (
              <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-400 bg-yellow-100">Last Close</Badge>
            )}
            {stock && !isLastClose ? (
              isPositive ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )
            ) : (
              <Badge variant="secondary" className="text-xs">
                {newsCount || 0} news
              </Badge>
            )}
          </div>

          {stock ? (
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                ${price.toFixed(2)}
                {isLastClose && (
                  <span className="ml-2 text-xs text-yellow-500">(Last Close)</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
                  {isPositive ? "+" : ""}
                  {change.toFixed(2)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {isPositive ? "+" : ""}
                  {changePercent.toFixed(2)}%
                </Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Click to view details</div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
