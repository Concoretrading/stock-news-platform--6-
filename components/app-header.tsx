"use client"

import React from "react";
import Link from "next/link"
import { CalendarIcon } from "lucide-react"
import { Twitter } from "lucide-react"

export function AppHeader() {
  return (
    <div className="bg-gradient-to-r from-blue-900 to-gray-900 text-white p-6 shadow-lg">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src="/images/concore-logo-new.png" alt="ConcoreNews" className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Welcome to ConcoreNews</h1>
              <div className="flex items-center space-x-8 mt-2 justify-center">
                {/* Calendar */}
                <Link href="/calendar" className="flex flex-col items-center group">
                  <div>
                    <CalendarIcon className="h-8 w-8 text-blue-500 group-hover:text-blue-700 transition-colors" />
                    <span className="mt-1 text-sm font-medium group-hover:text-blue-700 transition-colors block">Calendar</span>
                  </div>
                </Link>
                {/* Split Mode */}
                <Link href="/split-screen" className="flex flex-col items-center group">
                  <div>
                    <Twitter className="h-8 w-8 text-blue-400 group-hover:text-blue-600 transition-colors" />
                    <span className="mt-1 text-sm font-medium group-hover:text-gray-200 transition-colors block">Split Mode</span>
                  </div>
                </Link>
                {/* Journal */}
                <Link href="/trade-reviews" className="flex flex-col items-center group">
                  <div>
                    <img src="/images/journal.png" alt="Journal" width={32} height={32} className="group-hover:opacity-80 transition-opacity" />
                    <span className="mt-1 text-sm font-medium group-hover:text-gray-200 transition-colors block">Journal</span>
                  </div>
                </Link>
                {/* Manual Entry */}
                <Link href="/manual" className="flex flex-col items-center group">
                  <div>
                    <img src="/images/manual.png" alt="Manual Entry" width={32} height={32} className="group-hover:opacity-80 transition-opacity" />
                    <span className="mt-1 text-sm font-medium group-hover:text-gray-200 transition-colors block">Manual Entry</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <img src="/images/concore-logo-new.png" alt="ConcoreNews" className="h-8 w-8" />
            <div className="text-right">
              <div className="text-sm text-gray-300">Real-time Stock News</div>
              <div className="text-xs text-gray-400">Powered by AI</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
