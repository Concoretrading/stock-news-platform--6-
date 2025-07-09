"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Loader2, TrendingUp, TrendingDown, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface TickerMatch {
  ticker: string;
  company: string;
  confidence: number;
}

interface NewsEntryResult {
  ticker: string;
  success: boolean;
  id?: string;
  error?: string;
}

interface AnalysisResult {
  extractedText: string;
  matches: TickerMatch[];
  headline: string;
  date: string;
  price: number | null;
  source: string;
  newsEntryResults: NewsEntryResult[];
}

interface ScreenshotAnalyzerProps {
  externalFile?: File | null;
  onExternalFileHandled?: () => void;
  onCatalystAdded?: (tickers: string[]) => void;
}

type FileStatus = 'pending' | 'analyzing' | 'success' | 'error';

interface BulkFile {
  file: File;
  status: FileStatus;
  result?: AnalysisResult;
  error?: string;
}

export function ScreenshotAnalyzer({ externalFile, onExternalFileHandled, onCatalystAdded }: ScreenshotAnalyzerProps) {
  const [files, setFiles] = useState<BulkFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [droppedText, setDroppedText] = useState<string>('')
  const [processingText, setProcessingText] = useState(false)
  const { toast } = useToast()
  const lastAnalyzeTime = useRef(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<AnalysisResult | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    // Check for text content first
    const textData = e.dataTransfer.getData('text/plain')
    if (textData && textData.length > 50) {
      setDroppedText(textData)
      await processNewsArticle(textData)
      return
    }

    // Handle files (existing functionality)
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"))
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles)
      setTimeout(() => analyzeAll(), 0)
    }
  }

  const handleFileSelect = (selected: File[] | File) => {
    const fileList = Array.isArray(selected) ? selected : [selected]
    const validFiles = fileList.filter(f => f.type.startsWith("image/"))
    if (validFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please select image files",
        variant: "destructive",
      })
      return
    }
    setFiles(prev => [
      ...prev,
      ...validFiles.map(file => ({ file, status: 'pending' as FileStatus }))
    ])
    setTimeout(() => analyzeAll(), 0)
  }

  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith("image/")) {
            const blob = await clipboardItem.getType(type)
            const file = new File([blob], "pasted-image.png", { type })
            handleFileSelect([file])
            toast({
              title: "Image pasted successfully",
              description: "Screenshot has been loaded from clipboard",
            })
            return
          }
        }
      }
      toast({
        title: "No image found",
        description: "Please copy an image to your clipboard first",
        variant: "destructive",
      })
    } catch (error) {
      toast({
        title: "Paste failed",
        description: "Unable to access clipboard. Try uploading the file instead.",
        variant: "destructive",
      })
    }
  }

  const analyzeAll = async () => {
    const now = Date.now()
    if (now - lastAnalyzeTime.current < 2000) {
      toast({
        title: "Please wait before analyzing again.",
        description: "You can only analyze once every 2 seconds.",
        variant: "destructive",
      })
      return
    }
    lastAnalyzeTime.current = now
    setFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, status: 'analyzing' } : f))
    let allAddedTickers: string[] = []
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue
      const file = files[i].file
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'analyzing' } : f))
      try {
        const data = await handleScreenshotAnalysis(file)
        const tickerCount = data?.newsEntryResults?.filter(r => r.success).length || 0
        const tickers = data?.newsEntryResults?.filter(r => r.success).map(r => r.ticker) || []
        allAddedTickers = [...allAddedTickers, ...tickers]
        toast({
          title: `Screenshot processed (${file.name})`,
          description: tickerCount > 0
            ? `Catalyst(s) added for: ${tickers.join(", ")}`
            : 'No matching stocks found in your watchlist, or no catalysts were added.',
          variant: tickerCount > 0 ? 'default' : 'destructive',
        })
      } catch (error) {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' } : f))
        toast({
          title: `Analysis failed (${file.name})`,
          description: error instanceof Error ? error.message : 'Unable to analyze the screenshot. Please try again.',
          variant: 'destructive',
        })
      }
    }
    if (allAddedTickers.length > 0 && typeof onCatalystAdded === 'function') {
      // Remove duplicates
      const uniqueTickers = Array.from(new Set(allAddedTickers))
      onCatalystAdded(uniqueTickers)
    }
  }

  const handleScreenshotAnalysis = async (file: File): Promise<AnalysisResult> => {
    setIsAnalyzing(true)
    setError(null)
    setResults(null)

    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetchWithAuth("/api/analyze-screenshot", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json() as AnalysisResult
      setResults(data)
      
      toast({
        title: "Screenshot Analyzed",
        description: `Found ${data.matches?.length || 0} ticker matches and created ${data.newsEntryResults?.filter(r => r.success).length || 0} entries.`,
      })
      
      return data;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to analyze screenshot")
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze screenshot",
        variant: "destructive",
      })
      throw error;
    } finally {
      setIsAnalyzing(false)
    }
  }

  const processNewsArticle = async (articleText: string) => {
    setProcessingText(true)
    setError(null)
    
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
        title: "Article Processed",
        description: `Found ${data.tickers?.length || 0} stock matches and created ${data.successCount || 0} catalyst entries.`,
      })

      if (data.successCount > 0 && typeof onCatalystAdded === 'function') {
        onCatalystAdded(data.tickers || [])
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to process article")
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process news article",
        variant: "destructive",
      })
    } finally {
      setProcessingText(false)
    }
  }

  const getSentimentColor = (confidence: number): string => {
    if (confidence > 0.8) return "text-green-600"
    if (confidence > 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getSentimentIcon = (confidence: number): JSX.Element => {
    if (confidence > 0.8) return <TrendingUp className="h-8 w-8 text-green-600" />
    if (confidence > 0.6) return <TrendingDown className="h-8 w-8 text-yellow-600" />
    return <TrendingDown className="h-8 w-8 text-red-600" />
  }

  // Handle external file drop
  useEffect(() => {
    if (externalFile) {
      handleFileSelect([externalFile])
      if (onExternalFileHandled) {
        onExternalFileHandled()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalFile])

  return (
    <Card className="w-full relative">
      {(files.some(f => f.status === 'analyzing') || processingText) && (
        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-20 rounded-xl">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <span className="text-lg font-semibold text-blue-700">
            {processingText ? "Processing news article..." : "Analyzing screenshots..."}
          </span>
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-2xl">
          <Camera className="h-6 w-6" />
          <span>Screenshot Analyzer</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Screenshot Analyzer</h2>
          <p className="text-muted-foreground mb-4">
            Drop or paste trading screenshots to extract news catalysts
          </p>
        </div>
        {/* Professional Notice: Drag and drop anywhere */}
        <div className="border-2 border-blue-500 bg-blue-50 p-12 text-center rounded-xl flex flex-col items-center justify-center space-y-6">
          <Camera className="h-16 w-16 mx-auto text-blue-400" />
          <h3 className="text-2xl font-bold mb-2">Drag & Drop Screenshots or News Articles</h3>
          <p className="text-gray-700 max-w-xl mx-auto mb-4">
            Drop your trading screenshots OR copy/paste news articles anywhere on the dashboard for instant AI analysis. Our AI will automatically extract stock tickers, headlines, and key information to create catalyst entries.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span>Screenshots → Vision AI Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>News Articles → Text AI Processing</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm">Or use the floating screenshot button at the bottom right to open the analyzer manually.</p>
        </div>

        {/* List of files to analyze */}
        {files.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex justify-between items-center">
              <span className="font-semibold">Selected Files:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeAll}
                disabled={files.every(f => f.status !== 'pending') || files.some(f => f.status === 'analyzing')}
              >
                Analyze All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiles([])}
                className="ml-2"
              >
                Clear All
              </Button>
            </div>
            <ul className="space-y-2">
              {files.map((f, idx) => (
                <li key={idx} className="flex items-center gap-4 p-2 border rounded">
                  <span className="truncate max-w-xs">{f.file.name}</span>
                  <span className="text-xs">
                    {f.status === 'pending' && <span className="text-gray-500">Pending</span>}
                    {f.status === 'analyzing' && <span className="text-blue-500">Analyzing...</span>}
                    {f.status === 'success' && <span className="text-green-600">Success</span>}
                    {f.status === 'error' && <span className="text-red-600">Error</span>}
                  </span>
                  {f.status === 'error' && <span className="text-xs text-red-500 ml-2">{f.error}</span>}
                  {f.status === 'success' && f.result && (
                    <span className="text-xs text-green-700 ml-2">
                      {f.result.matches?.length || 0} stock(s) detected
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Analysis Results - Made much larger */}
        {files.some(f => f.status === 'success') && (
          <div className="space-y-8 p-8 bg-muted rounded-lg">
            <h3 className="font-semibold text-2xl">Analysis Results</h3>

            {/* Render a result card for each successful file */}
            {files.filter(f => f.status === 'success').map((f, idx) => (
              <div key={idx} className="mb-8 p-6 bg-background rounded-lg border">
                <h4 className="font-medium mb-4 text-lg flex items-center">
                  {/* <CheckCircle className="h-5 w-5 mr-2 text-green-600" /> */}
                  {f.file.name}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">{f.result?.matches?.[0]?.ticker || 'N/A'}</span>
                      <Badge variant="secondary">{Math.round((f.result?.matches?.[0]?.confidence || 0) * 100)}%</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{f.result?.matches?.[0]?.company || 'N/A'}</p>
                    <div className="mt-4">
                      <span className="font-medium">Headline:</span>
                      <p className="text-sm text-muted-foreground">{f.result?.headline || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Date:</span>
                      <p className="text-sm text-muted-foreground">{f.result?.date || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Price:</span>
                      <p className="text-sm text-muted-foreground">{f.result?.price !== undefined ? f.result.price : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Source:</span>
                      <p className="text-sm text-muted-foreground">{f.result?.source || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-lg">Extracted Text:</h4>
                    <div className="max-h-40 overflow-y-auto">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{f.result?.extractedText || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                {/* News Entry Results */}
                {f.result?.newsEntryResults?.[0] && (
                  <div className="mt-4 p-3 bg-green-50 rounded border border-green-200 flex items-center justify-between">
                    <span className="font-medium">{f.result?.newsEntryResults?.[0]?.ticker || 'N/A'}</span>
                    <span className="text-sm text-green-600">
                      {f.result?.newsEntryResults?.[0]?.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                )}
              </div>
            ))}

            <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-xs text-yellow-800">
                <strong>Disclaimer:</strong> This analysis is for educational purposes only and should not be
                considered as financial advice. Always conduct your own research and consult with a financial
                advisor before making investment decisions.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
