"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { badgeVariants } from "@/components/ui/badge"
import { fetchWithAuth } from "@/lib/fetchWithAuth"

interface Stock {
  symbol: string
  name: string
}

interface StockCardProps {
  stock?: Stock
  ticker?: string
  name?: string
  newsCount?: number
}

export function StockCard({ stock, ticker, name, newsCount }: StockCardProps) {
  const [catalystCount, setCatalystCount] = useState<number | null>(null)
  
  // Handle both prop patterns
  const symbol = stock?.symbol || ticker || "N/A"
  const stockName = stock?.name || name || "Unknown"

  useEffect(() => {
    const fetchCatalystCount = async () => {
      try {
        const response = await fetchWithAuth(`/api/catalysts/count?ticker=${symbol}`)
        const data = await response.json()
        setCatalystCount(data.count)
      } catch (error) {
        console.error('Error fetching catalyst count:', error)
      }
    }

    fetchCatalystCount()
  }, [symbol])

  return (
    <Link href={`/stocks/${symbol}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center text-center">
            <h3 className="font-bold text-xl mb-2">{symbol}</h3>
            <p className="text-sm text-muted-foreground mb-4">{stockName}</p>
            
            <div className="flex gap-2">
              <div className={cn(badgeVariants({ variant: "secondary" }), "text-xs")}>
                {newsCount || 0} news
              </div>
              {catalystCount !== null && (
                <div className={cn(badgeVariants({ variant: "outline" }), "text-xs")}>
                  {catalystCount} catalysts this week
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
