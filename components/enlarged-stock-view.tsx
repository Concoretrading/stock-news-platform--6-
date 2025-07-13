"use client"

import React from "react";

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

interface EnlargedStockViewProps {
  ticker: string
  name: string
  onClose: () => void
}

export function EnlargedStockView({ ticker, name, onClose }: EnlargedStockViewProps) {
  const router = useRouter()

  const handleViewDetails = () => {
    router.push(`/stocks/${ticker}`)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-2 border-blue-300 shadow-2xl transform scale-110 transition-all duration-300">
        <CardContent className="p-12 text-center relative">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Stock Information */}
          <div className="space-y-6">
            <h1 className="font-bold text-6xl text-gray-900 dark:text-white text-blue-600 mb-4">
              {ticker}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-md mx-auto">
              {name}
            </p>
            
            {/* Action Button */}
            <Button
              onClick={handleViewDetails}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 mt-8"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
