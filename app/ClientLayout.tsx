"use client"

import { useState, useEffect, useRef } from 'react'
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import ScreenshotButton from "@/components/ScreenshotButton"
import { NewsPasteButton } from "@/components/news-paste-button"
import { useToast } from '@/hooks/use-toast'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { getCurrentUser } from '@/lib/firebase-services'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [processingArticle, setProcessingArticle] = useState(false)
  const [showPastePrompt, setShowPastePrompt] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const { toast } = useToast()
  const dragCounterRef = useRef(0)

  // Hide instructions after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const processNewsArticle = async (articleText: string) => {
    setProcessingArticle(true)
    
    try {
      // Clean up HTML if present
      const cleanText = articleText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      
      console.log('Processing article:', cleanText.substring(0, 200))
      
      const response = await fetchWithAuth("/api/process-news-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ articleText: cleanText }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      toast({
        title: "News Article Processed!",
        description: `Found ${data.tickers?.length || 0} stock matches and created ${data.successCount || 0} catalyst entries.`,
      })
      
    } catch (error) {
      console.error('Processing error:', error)
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process news article",
        variant: "destructive",
      })
    } finally {
      setProcessingArticle(false)
    }
  }

  // Global paste detection
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Don't process paste if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.contentEditable === 'true') {
        return
      }

      const user = getCurrentUser()
      if (!user) return

      const clipboardData = e.clipboardData || (window as any).clipboardData
      const pastedText = clipboardData?.getData('text/plain') || ''

      if (pastedText && pastedText.length > 100) {
        e.preventDefault()
        console.log('Detected news article paste:', pastedText.substring(0, 100) + '...')
        
        // Show confirmation
        setShowPastePrompt(true)
        
        // Auto-process after a brief delay to show the prompt
        setTimeout(async () => {
          setShowPastePrompt(false)
          await processNewsArticle(pastedText)
        }, 1000)
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  // Global drag and drop handlers with better debugging
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('🟢 Drag enter detected', e.dataTransfer?.types)
      dragCounterRef.current++
      setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current--
      if (dragCounterRef.current === 0) {
        console.log('🔴 Drag leave - hiding overlay')
        setIsDragging(false)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('🎯 Drop detected!')
      console.log('DataTransfer types:', e.dataTransfer?.types)
      console.log('DataTransfer items:', e.dataTransfer?.items)
      
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

      // Try multiple ways to get text content
      let textData = ''
      
      // Method 1: Try different MIME types
      const types = ['text/plain', 'text/html', 'text/uri-list', 'text']
      for (const type of types) {
        try {
          const data = e.dataTransfer?.getData(type)
          if (data && data.length > textData.length) {
            textData = data
            console.log(`📝 Found text via ${type}:`, data.substring(0, 100))
          }
        } catch (err) {
          console.log(`❌ Failed to get ${type}:`, err)
        }
      }

      // Method 2: Try items API
      if (!textData && e.dataTransfer?.items) {
        for (const item of Array.from(e.dataTransfer.items)) {
          console.log('📄 Item:', item.kind, item.type)
          if (item.kind === 'string') {
            try {
              const data = await new Promise<string>((resolve) => {
                item.getAsString(resolve)
              })
              if (data && data.length > textData.length) {
                textData = data
                console.log('📝 Found text via items API:', data.substring(0, 100))
              }
            } catch (err) {
              console.log('❌ Failed to get string from item:', err)
            }
          }
        }
      }

      console.log('📋 Final text data length:', textData.length)

      if (textData && textData.length > 50) {
        console.log('✅ Processing article text')
        await processNewsArticle(textData)
        return
      }

      // Check for image files
      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
        if (imageFiles.length > 0) {
          console.log('🖼️ Image files dropped, letting screenshot analyzer handle')
          return
        }
      }

      // If we get here, nothing was processed
      console.log('❌ No valid content detected')
      toast({
        title: "No Content Detected",
        description: "Try selecting and copying the text first, then paste (Ctrl+V) instead",
        variant: "destructive",
      })
    }

    // Add event listeners to document and window for maximum coverage
    const elements = [document, window]
    
    elements.forEach(element => {
      element.addEventListener('dragenter', handleDragEnter as any)
      element.addEventListener('dragleave', handleDragLeave as any)
      element.addEventListener('dragover', handleDragOver as any)
      element.addEventListener('drop', handleDrop as any)
    })

    return () => {
      elements.forEach(element => {
        element.removeEventListener('dragenter', handleDragEnter as any)
        element.removeEventListener('dragleave', handleDragLeave as any)
        element.removeEventListener('dragover', handleDragOver as any)
        element.removeEventListener('drop', handleDrop as any)
      })
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
        {/* Global drag overlay - Full screen drop zone */}
        {isDragging && (
          <div className="fixed inset-0 z-50 bg-blue-500/30 backdrop-blur-sm">
            {/* Border animation around entire screen */}
            <div className="absolute inset-2 border-4 border-blue-500 border-dashed rounded-lg animate-pulse">
              <div className="absolute inset-4 border-2 border-blue-400 border-dashed rounded-lg">
                <div className="absolute inset-6 border-2 border-blue-300 border-dotted rounded-lg opacity-50"></div>
              </div>
            </div>
            
            {/* Center content */}
            <div className="flex items-center justify-center h-full">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-2xl text-center border-2 border-blue-500 max-w-md mx-4">
                <div className="text-6xl mb-4">📰</div>
                <h3 className="text-2xl font-bold mb-3 text-blue-600">Drop Anywhere!</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Drop your news article anywhere on this screen
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>AI will automatically extract stock tickers</span>
                </div>
                <p className="text-xs text-gray-400">
                  💡 If dragging doesn't work, try copying (Ctrl+C) then pasting (Ctrl+V)
                </p>
              </div>
            </div>

            {/* Corner indicators */}
            <div className="absolute top-4 left-4 text-blue-500 text-sm font-medium bg-white/90 px-3 py-1 rounded-full">
              📍 Drop Zone Active
            </div>
            <div className="absolute top-4 right-4 text-blue-500 text-sm font-medium bg-white/90 px-3 py-1 rounded-full">
              Anywhere on Screen ✨
            </div>
            <div className="absolute bottom-4 left-4 text-blue-500 text-sm font-medium bg-white/90 px-3 py-1 rounded-full">
              🎯 AI Processing Ready
            </div>
            <div className="absolute bottom-4 right-4 text-blue-500 text-sm font-medium bg-white/90 px-3 py-1 rounded-full">
              Global Drop Zone 🌍
            </div>
          </div>
        )}

        {/* Paste detection overlay */}
        {showPastePrompt && (
          <div className="fixed inset-0 z-50 bg-green-500/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-2xl text-center border-2 border-green-500">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-bold mb-2">News Article Detected!</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Processing your pasted article...
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

        {/* Instructions overlay - shows for 5 seconds */}
        {showInstructions && (
          <div className="fixed top-6 right-6 z-40 bg-gradient-to-r from-blue-500 to-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm animate-slide-in-right">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🚀</div>
              <div>
                <h4 className="font-bold mb-1">News Article Processing</h4>
                <p className="text-sm opacity-90 mb-2">
                  Drag news articles from any website and drop anywhere on this screen!
                </p>
                <div className="text-xs opacity-75">
                  Or use Ctrl+V or the green button ⬇️
                </div>
              </div>
              <button 
                onClick={() => setShowInstructions(false)}
                className="text-white/70 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {children}
        
        <Toaster />
        <ScreenshotButton />
        <NewsPasteButton />
      </div>
    </AuthProvider>
  )
} 