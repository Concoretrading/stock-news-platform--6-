import React from 'react'
import { Metadata } from 'next'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import ScreenshotButton from "@/components/ScreenshotButton"
import { AuthProvider } from "@/components/auth-provider"
import ClientLayout from "./ClientLayout"
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
            <>
              <ClientLayout>
                {children}
              </ClientLayout>
              <Toaster />
              <ScreenshotButton />
              <VersionDisplay />
            </>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
