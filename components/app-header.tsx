"use client"

import React from "react";
import { ThemeToggle } from "@/components/theme-toggle"
import { TrendingUp, LogOut, Calendar as CalendarIcon, Twitter, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export function AppHeader() {
  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Image
                src="/images/concore-logo.png"
                alt="ConcoreNews"
                width={64}
                height={64}
                className="rounded-full bg-white/10 p-2 cursor-pointer"
              />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Welcome to ConcoreNews</h1>
              <div className="flex items-center space-x-2 mt-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-slate-400">Track • Analyze • Succeed</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-3">
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="outline" size="sm">
                <div className="flex items-center space-x-2">
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </div>
              </Button>
            </div>
            
            {/* Navigation icons under the logout button */}
            <div className="flex items-center space-x-4">
              {/* Calendar */}
              <Link href="/calendar" className="flex flex-col items-center group">
                <div>
                  <CalendarIcon className="h-5 w-5 text-blue-500 group-hover:text-blue-700 transition-colors" />
                  <span className="mt-1 text-xs font-medium group-hover:text-blue-700 transition-colors block">Calendar</span>
                </div>
              </Link>
              
              {/* Split Mode */}
              <Link href="/split-screen" className="flex flex-col items-center group">
                <div>
                  <Twitter className="h-5 w-5 text-gray-400 group-hover:text-gray-200 transition-colors" />
                  <span className="mt-1 text-xs font-medium group-hover:text-gray-200 transition-colors block">Split Mode</span>
                </div>
              </Link>
              
              {/* Journal */}
              <Link href="/trade-reviews" className="flex flex-col items-center group">
                <div>
                  <FileText className="h-5 w-5 text-green-500 group-hover:text-green-700 transition-colors" />
                  <span className="mt-1 text-xs font-medium group-hover:text-green-700 transition-colors block">Journal</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
