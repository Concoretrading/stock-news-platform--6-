"use client"

import React from "react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle"
import { TrendingUp, LogOut, Calendar as CalendarIcon, X, BookOpen, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

// Mobile detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export function AppHeader() {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Mobile Layout
    return (
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          {/* Mobile Top Bar with Welcome Message and Upper Right Controls */}
          <div className="flex items-start justify-between mb-8">
            {/* Welcome Message */}
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold">Welcome to ConcoreNews</h1>
              <div className="flex items-center justify-center space-x-2 mt-1">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-slate-400">Track . Analyze . Succeed</span>
              </div>
            </div>
            
            {/* Upper Right Controls - Theme Toggle and Logout */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log Out</span>
              </Button>
            </div>
          </div>
          
          {/* Mobile Navigation Icons */}
          <div className="flex items-center justify-center space-x-8">
            {/* Calendar */}
            <Link href="/calendar" className="flex flex-col items-center group">
              <div className="h-8 w-8 flex items-center justify-center bg-blue-500/20 rounded-full group-hover:bg-blue-500/30 transition-colors">
                <CalendarIcon className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
              </div>
              <span className="mt-1 text-xs font-medium text-slate-300 group-hover:text-white transition-colors">Calendar</span>
            </Link>
            
            {/* Split + ConcoreNews */}
            <Link href="/split-screen" className="flex flex-col items-center group">
              <div className="h-8 w-8 flex items-center justify-center bg-gray-500/20 rounded-full group-hover:bg-gray-500/30 transition-colors">
                <div className="flex items-center space-x-0.5">
                  <X className="h-3 w-3 text-gray-400 group-hover:text-gray-300 transition-colors" />
                  <Plus className="h-2.5 w-2.5 text-gray-500 group-hover:text-gray-400 transition-colors" />
                  <Image
                    src="/images/concore-logo.png"
                    alt="ConcoreNews"
                    width={12}
                    height={12}
                    className="rounded-full opacity-60 group-hover:opacity-80 transition-opacity"
                  />
                </div>
              </div>
              <span className="mt-1 text-xs font-medium text-slate-300 group-hover:text-white transition-colors">Split Mode</span>
            </Link>
            
            {/* Journal */}
            <Link href="/trade-reviews" className="flex flex-col items-center group">
              <div className="h-8 w-8 flex items-center justify-center bg-amber-500/20 rounded-full group-hover:bg-amber-500/30 transition-colors">
                <BookOpen className="h-5 w-5 text-amber-400 group-hover:text-amber-300 transition-colors" />
              </div>
              <span className="mt-1 text-xs font-medium text-slate-300 group-hover:text-white transition-colors">Journal</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Desktop Layout (existing)
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
              <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
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
                <div className="h-5 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-blue-500 group-hover:text-blue-700 transition-colors" />
                </div>
                <span className="mt-1 text-xs font-medium group-hover:text-blue-700 transition-colors text-center">Calendar</span>
              </Link>
              
              {/* Split Mode with X + Plus + ConcoreNews logo */}
              <Link href="/split-screen" className="flex flex-col items-center group">
                <div className="h-5 flex items-center justify-center space-x-1">
                  <X className="h-4 w-4 text-gray-400 group-hover:text-gray-200 transition-colors" />
                  <Plus className="h-3 w-3 text-gray-500 group-hover:text-gray-300 transition-colors" />
                  <Image
                    src="/images/concore-logo.png"
                    alt="ConcoreNews"
                    width={16}
                    height={16}
                    className="rounded-full opacity-60 group-hover:opacity-80 transition-opacity"
                  />
                </div>
                <span className="mt-1 text-xs font-medium group-hover:text-gray-200 transition-colors text-center">Split Mode</span>
              </Link>
              
              {/* Journal with BookOpen icon in tan color */}
              <Link 
                href="/trade-reviews" 
                className="flex flex-col items-center group"
                onClick={() => console.log('🔧 Journal/Trade Reviews button clicked')}
              >
                <div className="h-5 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-amber-600 group-hover:text-amber-500 transition-colors" />
                </div>
                <span className="mt-1 text-xs font-medium group-hover:text-amber-500 transition-colors text-center">Journal</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
