"use client"

import { useState, useEffect, useRef } from 'react'
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import ScreenshotButton from "@/components/ScreenshotButton"
import { useToast } from '@/hooks/use-toast'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { getCurrentUser } from '@/lib/firebase-services'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [processingArticle, setProcessingArticle] = useState(false)
  const { toast } = useToast()
  const dragCounterRef = useRef(0)

  // Global drag and drop handlers
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounterRef.current++
      setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounterRef.current--
      if (dragCounterRef.current === 0) {
        setIsDragging(false)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      dragCounterRef.current = 0
      setIsDragging(false)

      const user = getCurrentUser()
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to process news articles",
          variant: "destructive",
        })
        return
      }

      // Check for text content
      const textData = e.dataTransfer?.getData('text/plain')
      if (textData && textData.length > 50) {
        await processNewsArticle(textData)
        return
      }

      // Check for image files
      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
        if (imageFiles.length > 0) {
          // Let the screenshot analyzer handle image files
          return
        }
      }
    }

    const processNewsArticle = async (articleText: string) => {
      setProcessingArticle(true)
      
      try {
        const response = await fetchWithAuth("/api/process-news-article", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ articleText }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()
        
        toast({
          title: "News Article Processed",
          description: `Found ${data.tickers?.length || 0} stock matches and created ${data.successCount || 0} catalyst entries.`,
        })
        
      } catch (error) {
        toast({
          title: "Processing Failed",
          description: error instanceof Error ? error.message : "Failed to process news article",
          variant: "destructive",
        })
      } finally {
        setProcessingArticle(false)
      }
    }

    // Add event listeners
    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [toast])

  // Service worker cleanup
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister()
        }
      })
    }
  }, [])

  return (
    <AuthProvider>
      <div className="relative min-h-screen">
        {/* Global drag overlay */}
        {isDragging && (
          <div className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-2xl text-center border-2 border-blue-500 border-dashed">
              <div className="text-4xl mb-4">📰</div>
              <h3 className="text-xl font-bold mb-2">Drop News Article Here</h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI will automatically extract stock tickers and create catalyst entries
              </p>
            </div>
          </div>
        )}

        {/* Processing overlay */}
        {processingArticle && (
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-2xl text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold">Processing News Article...</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Extracting stock tickers and creating catalyst entries
              </p>
            </div>
          </div>
        )}

        {children}
        
        <Toaster />
        <ScreenshotButton />
      </div>
    </AuthProvider>
  )
} 