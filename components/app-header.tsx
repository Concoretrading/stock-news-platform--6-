"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { TrendingUp, LogOut, Calendar as CalendarIcon } from "lucide-react"
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
              <div className="flex items-center space-x-2 mt-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-slate-400">Track • Analyze • Succeed</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/calendar" passHref legacyBehavior>
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-500 hover:bg-blue-900/20 hover:text-blue-400 focus-visible:ring-blue-500"
                aria-label="Calendar"
              >
                <CalendarIcon className="h-[1.5rem] w-[1.5rem]" />
              </Button>
            </Link>
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
      </div>
    </header>
  )
}
