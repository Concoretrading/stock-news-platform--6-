"use client"

import React from "react";

import { Card, CardContent } from "@/components/ui/card"

interface StockCardProps {
  ticker: string
  name: string
  onClick?: () => void
}

export function StockCard({ ticker, name, onClick }: StockCardProps) {
  return (
    <Card 
      className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-blue-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 h-32 sm:h-36 md:h-40 relative"
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4 md:p-6 h-full flex flex-col justify-center">
        {/* Header Section - Now centered and taking full space */}
        <div className="flex-1 flex flex-col justify-center text-center">
          <h3 className="font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors mb-2 sm:mb-2 md:mb-3">
            {ticker}
          </h3>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
            {name}
          </p>
        </div>
        
        {/* Subtle indicator for history navigation - hidden on mobile */}
        <div className="hidden sm:block absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="text-xs text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
            View History →
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
