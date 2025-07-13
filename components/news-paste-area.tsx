"use client"

import React from "react";

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, FileText, Loader2 } from "lucide-react"
import { useToast } from '@/hooks/use-toast'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface NewsPasteAreaProps {
  isOpen: boolean
  onClose: () => void
}

export function NewsPasteArea({ isOpen, onClose }: NewsPasteAreaProps) {
  const [articleText, setArticleText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleProcess = async () => {
    if (!articleText.trim() || articleText.length < 50) {
      toast({
        title: "Invalid Article",
        description: "Please paste a news article (at least 50 characters)",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    
    try {
      const response = await fetchWithAuth("/api/process-news-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ articleText: articleText.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      toast({
        title: "Article Processed Successfully!",
        description: `Found ${data.tickers?.length || 0} stock matches and created ${data.successCount || 0} catalyst entries.`,
      })

      // Reset and close
      setArticleText('')
      onClose()
      
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process news article",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setArticleText(text)
      toast({
        title: "Article Pasted",
        description: "Article text has been pasted. Click 'Process Article' to analyze it.",
      })
    } catch (error) {
      toast({
        title: "Paste Failed",
        description: "Unable to read from clipboard. Please paste manually (Ctrl+V).",
        variant: "destructive",
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-5 w-5" />
              Paste News Article
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="touch-manipulation">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3 sm:gap-4 pb-4">
          <div className="flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePaste}
                className="text-sm touch-manipulation"
              >
                📋 Paste from Clipboard
              </Button>
              <span className="text-sm text-gray-500 self-center">
                or paste manually below
              </span>
            </div>
            
            <Textarea
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
              placeholder="Paste your news article here... 

Example:
Tesla (TSLA) Reports Strong Q4 Earnings
Tesla Inc. reported stronger-than-expected fourth quarter earnings yesterday, with revenue climbing 15% year-over-year to $25.2 billion..."
              className="flex-1 min-h-[250px] sm:min-h-[300px] resize-none text-sm"
              disabled={isProcessing}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="text-sm text-gray-500 text-center sm:text-left">
              {articleText.length} characters {articleText.length >= 50 ? '✅' : '❌ (min 50)'}
            </div>
            <div className="flex gap-2 justify-center sm:justify-end">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isProcessing}
                className="flex-1 sm:flex-none min-w-[100px] touch-manipulation"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleProcess} 
                disabled={isProcessing || articleText.length < 50}
                className="flex-1 sm:flex-none min-w-[120px] touch-manipulation"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Process Article'
                )}
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
            <strong>💡 How it works:</strong> AI will automatically extract stock tickers, headlines, and dates from your article to create catalyst entries for stocks in your watchlist.
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
