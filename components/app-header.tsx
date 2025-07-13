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
                alt="ConcoreTrading"
                width={64}
                height={64}
                className="rounded-full bg-white/10 p-2 cursor-pointer"
              />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Welcome to ConcoreNews</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
              onClick={async () => {
                const { getAuth, signOut } = await import("firebase/auth");
                const auth = getAuth();
                await signOut(auth);
                window.location.reload();
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
        
        {/* Navigation Icons - Centered under the welcome text */}
        <div className="flex items-center justify-center space-x-8 mt-4">
          {/* Calendar */}
          <Link href="/calendar" className="flex flex-col items-center group">
            <div>
              <CalendarIcon className="h-8 w-8 text-blue-500 group-hover:text-blue-700 transition-colors" />
              <span className="mt-1 text-sm font-medium group-hover:text-blue-700 transition-colors block text-center">Calendar</span>
            </div>
          </Link>
          {/* Split Mode */}
          <Link href="/split-screen" className="flex flex-col items-center group">
            <div>
              <Twitter className="h-8 w-8 text-blue-400 group-hover:text-blue-600 transition-colors" />
              <span className="mt-1 text-sm font-medium group-hover:text-gray-200 transition-colors block text-center">Split Mode</span>
            </div>
          </Link>
          {/* Journal */}
          <Link href="/trade-reviews" className="flex flex-col items-center group">
            <div>
              <img src="/images/journal.png" alt="Journal" width={32} height={32} className="group-hover:opacity-80 transition-opacity" />
              <span className="mt-1 text-sm font-medium group-hover:text-green-400 transition-colors block text-center">Journal</span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
