"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { badgeVariants } from "@/components/ui/badge"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { Activity } from "lucide-react"

interface StockCardProps {
  ticker: string
  name: string
}

export function StockCard({ ticker, name }: StockCardProps) {
  const [catalystCount, setCatalystCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCatalystCount = async () => {
      try {
        setIsLoading(true)
        const response = await fetchWithAuth(`/api/catalysts/count?ticker=${ticker}&period=month`)
        const data = await response.json()
        setCatalystCount(data.count)
      } catch (error) {
        console.error('Error fetching catalyst count:', error)
        setCatalystCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCatalystCount()
  }, [ticker])

  return (
    <Link href={`/stocks/${ticker}`} className="block">
      <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-blue-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 h-40">
        <CardContent className="p-6 h-full flex flex-col justify-between">
          {/* Header Section */}
          <div className="flex-1 flex flex-col justify-center text-center">
            <h3 className="font-bold text-3xl text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors mb-2">
              {ticker}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-tight">
              {name}
            </p>
          </div>

          {/* Catalyst Count Section */}
          <div className="flex justify-center mt-4">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full px-4 py-2 text-xs">
                Loading catalysts...
              </div>
            ) : (
              <div className={cn(
                badgeVariants({ variant: "outline" }), 
                "text-sm flex items-center gap-2 px-4 py-2",
                catalystCount && catalystCount > 0 
                  ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300" 
                  : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
              )}>
                <Activity className="h-4 w-4" />
                <span className="font-medium">
                  {catalystCount ?? 0} catalyst{(catalystCount ?? 0) !== 1 ? 's' : ''} this month
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
