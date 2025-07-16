import React from 'react'
import { Metadata } from 'next'
import "./globals.css"

export const metadata: Metadata = {
  title: "AI Breakout Analyzer - Advanced Trading Analysis",
  description: "AI-powered breakout analysis, momentum tracking, and chart pattern recognition platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          {children}
        </div>
      </body>
    </html>
  )
}
