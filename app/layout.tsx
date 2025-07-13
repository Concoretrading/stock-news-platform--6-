import React from 'react'
import { Metadata } from 'next'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import ScreenshotButton from "@/components/ScreenshotButton"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

// Version display component
function VersionDisplay() {
  return (
    <div className="fixed bottom-2 left-2 text-xs text-muted-foreground/50">
      Build: {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev'} |
      Time: {process.env.NEXT_PUBLIC_BUILD_TIME ? new Date(parseInt(process.env.NEXT_PUBLIC_BUILD_TIME)).toLocaleString() : 'unknown'} |
      Env: {process.env.NODE_ENV}
    </div>
  )
}

export const metadata: Metadata = {
  title: "ConcoreNews - Professional Stock News Platform",
  description: "AI-powered stock news analysis and catalyst tracking platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div>
              {children}
              <Toaster />
              <button className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center border-2 border-blue-500 p-0 touch-manipulation" title="Upload Screenshot for AI Analysis">
                <span style={{fontSize: '2rem', lineHeight: 1}}>📷</span>
              </button>
              <VersionDisplay />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
