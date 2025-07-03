import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import ScreenshotButton from "@/components/ScreenshotButton"
import { AuthProvider } from "@/components/auth-provider"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
          {children}
          <Toaster />
            {/* Floating Screenshot Button and Modal moved to ScreenshotButton */}
            <ScreenshotButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
