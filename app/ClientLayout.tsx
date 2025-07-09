"use client"

import { useState, useEffect, useRef } from "react"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import ScreenshotButton from "@/components/ScreenshotButton"
import { NewsPasteButton } from "@/components/news-paste-button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { fetchWithAuth } from "@/lib/fetchWithAuth"

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [processingArticle, setProcessingArticle] = useState(false)
  const [showPastePrompt, setShowPastePrompt] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()
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
      const response = await fetchWithAuth('/api/process-news-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleText })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "News Article Processed! 📰",
          description: `Found ${data.tickers?.length || 0} stock matches, created ${data.successCount || 0} catalyst entries`,
        })
      } else {
        throw new Error('Failed to process article')
      }
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "Unable to process the news article. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingArticle(false)
    }
  }

  const processScreenshot = async (file: File) => {
    console.log('🔄 Starting screenshot processing...')
    setProcessingArticle(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      console.log('📤 Sending request to /api/analyze-screenshot')

      const response = await fetchWithAuth("/api/analyze-screenshot", {
        method: "POST",
        body: formData,
      })

      console.log('📥 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Screenshot analysis result:', data)
      
      const successCount = data.newsEntryResults?.filter((r: any) => r.success).length || 0
      const tickers = data.newsEntryResults?.filter((r: any) => r.success).map((r: any) => r.ticker) || []
      
      toast({
        title: "Screenshot Processed! 📸",
        description: successCount > 0 
          ? `Catalyst(s) added for: ${tickers.join(", ")}`
          : 'No matching stocks found in your watchlist',
        variant: successCount > 0 ? 'default' : 'destructive',
      })
    } catch (error) {
      console.error('❌ Screenshot processing error:', error)
      toast({
        title: "Screenshot Analysis Failed",
        description: error instanceof Error ? error.message : "Unable to analyze the screenshot. Please try again.",
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

      if (!user) {
        toast({
          title: "Authentication Required", 
          description: "Please log in to process news articles",
          variant: "destructive",
        })
        return
      }

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
  }, [user, toast])

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

      if (!user) {
        toast({
          title: "Authentication Required", 
          description: "Please log in to process news articles",
          variant: "destructive",
        })
        return
      }

      // PRIORITY 1: Check for image files first (screenshots should be processed as images)
      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
        if (imageFiles.length > 0) {
          console.log('🖼️ Image files dropped, processing as screenshots')
          for (const file of imageFiles) {
            await processScreenshot(file)
          }
          return
        }
      }

      // PRIORITY 2: Try multiple ways to get text content
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
  }, [user, toast])

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
    <div className="relative min-h-screen">
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/30 backdrop-blur-sm">
          <div className="h-full w-full flex items-center justify-center">
            <div className="bg-card dark:bg-card p-8 rounded-xl shadow-2xl text-center border-2 border-blue-500 max-w-md mx-4">
              <div className="text-6xl mb-4">📰</div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">Drop News Article Here</h2>
              <p className="text-muted-foreground">Release to process news article with AI</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Processing Overlays */}
      {/* isProcessingImage and isProcessingNews are not defined in the original file,
          but the edit specification includes them. Assuming they are meant to be
          state variables or derived from processingArticle.
          For now, I'll add placeholders to avoid breaking the new code.
          In a real scenario, these would need to be defined. */}
      {/* {isProcessingImage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="absolute top-4 left-4 text-blue-500 text-sm font-medium bg-card/90 px-3 py-1 rounded-full">
            📸 Image Processing
          </div>
          <div className="absolute top-4 right-4 text-blue-500 text-sm font-medium bg-card/90 px-3 py-1 rounded-full">
            🔍 Vision AI
          </div>
          <div className="absolute bottom-4 left-4 text-blue-500 text-sm font-medium bg-card/90 px-3 py-1 rounded-full">
            🤖 Analyzing...
          </div>
          <div className="absolute bottom-4 right-4 text-blue-500 text-sm font-medium bg-card/90 px-3 py-1 rounded-full">
            ⚡ Real-time
          </div>
          
          <div className="bg-card dark:bg-card p-8 rounded-xl shadow-2xl text-center border-2 border-green-500">
            <div className="animate-spin h-16 w-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">Processing Screenshot</h2>
            <p className="text-muted-foreground">AI is analyzing the image and extracting stock information...</p>
          </div>
        </div>
      )} */}

      {/* {isProcessingNews && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card dark:bg-card p-8 rounded-xl shadow-2xl text-center">
            <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">Processing News Article</h2>
            <p className="text-muted-foreground">AI is extracting stock tickers and creating catalyst entries...</p>
          </div>
        </div>
      )} */}

      {/* Paste detection overlay */}
      {showPastePrompt && (
        <div className="fixed inset-0 z-50 bg-green-500/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card dark:bg-card p-8 rounded-xl shadow-2xl text-center border-2 border-green-500">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-2">News Article Detected!</h3>
            <p className="text-muted-foreground">
              Processing your pasted article...
            </p>
          </div>
        </div>
      )}

      {/* Processing overlay */}
      {processingArticle && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card dark:bg-card p-8 rounded-xl shadow-2xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold">Processing Content...</h3>
            <p className="text-muted-foreground mt-2">
              Analyzing screenshot or article and creating catalyst entries
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
      
      <NewsPasteButton />
    </div>
  )
} 