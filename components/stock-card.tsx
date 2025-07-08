"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { badgeVariants } from "@/components/ui/badge"
import { fetchWithAuth } from "@/lib/fetchWithAuth"

interface StockCardProps {
  ticker: string
  name: string
}

export function StockCard({ ticker, name }: StockCardProps) {
  const [catalystCount, setCatalystCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchCatalystCount = async () => {
      try {
        const response = await fetchWithAuth(`/api/catalysts/count?ticker=${ticker}&period=month`)
        const data = await response.json()
        setCatalystCount(data.count)
      } catch (error) {
        console.error('Error fetching catalyst count:', error)
      }
    }

    fetchCatalystCount()
  }, [ticker])

  return (
    <Link href={`/stocks/${ticker}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl">{ticker}</h3>
              <p className="text-sm text-muted-foreground">{name}</p>
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
