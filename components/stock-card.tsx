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
}

export function StockCard({ stock, ticker, name }: StockCardProps) {
  const [catalystCount, setCatalystCount] = useState<number | null>(null)
  
  // Handle both prop patterns
  const symbol = stock?.symbol || ticker || "N/A"
  const stockName = stock?.name || name || "Unknown"

  useEffect(() => {
    const fetchCatalystCount = async () => {
      try {
        // Get catalysts for the last month
        const response = await fetchWithAuth(`/api/catalysts/count?ticker=${symbol}&period=month`)
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl">{symbol}</h3>
              <p className="text-sm text-muted-foreground">{stockName}</p>
            </div>
            {catalystCount !== null && (
              <div className={cn(badgeVariants({ variant: "outline" }), "text-xs")}>
                {catalystCount} catalysts this month
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
