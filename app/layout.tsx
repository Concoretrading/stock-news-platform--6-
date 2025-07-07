import React from 'react'
import { Metadata } from 'next'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import ScreenshotButton from "@/components/ScreenshotButton"
import "./globals.css"

// Version display component
function VersionDisplay() {
  return (
    <div className="fixed bottom-2 left-2 text-xs text-muted-foreground/50">
      Build: {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev'}
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
          {children}
          <Toaster />
          <ScreenshotButton />
          <VersionDisplay />
        </ThemeProvider>
      </body>
    </html>
  )
}
