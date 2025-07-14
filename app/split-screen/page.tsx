'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Twitter, Calendar, BarChart3, TrendingUp, ChevronRight, Star, Activity, History, Search, Plus, FileText, Upload, X, GripVertical, Bell, PlusCircle, Trash2, Edit2, Settings } from 'lucide-react';
import { XAuth } from '@/components/twitter-auth';
import { StockNewsHistory } from '@/components/stock-news-history';
import { StockNewsSearch } from '@/components/stock-news-search';
import { StockManualNewsForm } from '@/components/stock-manual-news-form';
import { StockAlertTab } from '@/components/stock-alert-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth-provider';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { StockSelector } from '@/components/stock-selector';
import tickers from '@/lib/tickers.json';

interface Stock {
  id?: string;
  symbol: string;
  name: string;
}

// Add a helper to get the logo URL for a ticker
function getLogoUrl(symbol: string) {
  const entry = tickers.find((t: any) => t.ticker.toLowerCase() === symbol.toLowerCase());
  return entry?.logoUrl || `/images/logos/${symbol.toUpperCase()}.png`;
}

export default function SplitScreenPage() {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'search' | 'news' | 'alerts'>('history');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [watchlist, setWatchlist] = useState<Stock[]>([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Mock watchlist data - in real implementation, this would come from user's watchlist
  const mockWatchlist: Stock[] = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'AMD', name: 'Advanced Micro Devices Inc.' },
    { symbol: 'INTC', name: 'Intel Corporation' },
  ];

  // Add state for new stock input and editing
  const [newStockSymbol, setNewStockSymbol] = useState('');
  const [newStockName, setNewStockName] = useState('');
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [editStockSymbol, setEditStockSymbol] = useState('');
  const [editStockName, setEditStockName] = useState('');

  // Add state for tracking failed logo loads
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

  // Add state for showing the StockSelector modal
  const [showStockSelector, setShowStockSelector] = useState(false);

  // Load user's watchlist on component mount
  useEffect(() => {
    if (user) {
      loadUserWatchlist();
    } else {
      // Fallback to mock data if not authenticated
      setWatchlist(mockWatchlist);
      setIsLoadingStocks(false);
    }
  }, [user]);

  const loadUserWatchlist = async () => {
    try {
      setIsLoadingStocks(true);
      const response = await fetchWithAuth('/api/watchlist');
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        setWatchlist(result.data.slice(0, 10).map((stock: any) => ({
          id: stock.id,
          symbol: stock.ticker,
          name: stock.companyName
        })));
      } else {
        // Fallback to mock data
        setWatchlist(mockWatchlist);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
      setWatchlist(mockWatchlist);
    } finally {
      setIsLoadingStocks(false);
    }
  };

  // Load saved width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('splitScreenLeftWidth');
    if (savedWidth) {
      const width = parseFloat(savedWidth);
      if (width >= 20 && width <= 80) {
        setLeftPanelWidth(width);
      }
    }
  }, []);

  // Save width to localStorage
  const saveWidth = useCallback((width: number) => {
    localStorage.setItem('splitScreenLeftWidth', width.toString());
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = document.getElementById('split-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    
    if (newWidth >= 20 && newWidth <= 80) {
      setLeftPanelWidth(newWidth);
      saveWidth(newWidth);
    }
  }, [isDragging, saveWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Check for image files first (screenshots should be processed as images)
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length > 0) {
        console.log('🖼️ Image files dropped, processing as screenshots');
        
        // Check authentication
        if (!user) {
          console.log('❌ User not authenticated');
          toast({
            title: "Authentication Required", 
            description: "Please log in to process screenshots",
            variant: "destructive",
          });
          return;
        }
        
        // Process each image file
        for (const file of imageFiles) {
          console.log('🔄 Processing file:', file.name, file.type);
          await processScreenshot(file);
        }
        return;
      }
      
      // If no image files, store them for display
      setUploadedFiles(prev => [...prev, ...files]);
      console.log('Files dropped:', files);
    }
  }, [user, toast]);

  const processScreenshot = async (file: File) => {
    console.log('🔄 Starting screenshot processing...');
    try {
      const formData = new FormData();
      formData.append("image", file);
      console.log('📤 Sending request to /api/analyze-screenshot');

      const response = await fetchWithAuth("/api/analyze-screenshot", {
        method: "POST",
        body: formData,
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Screenshot analysis result:', data);
      
      const successCount = data.newsEntryResults?.filter((r: any) => r.success).length || 0;
      const tickers = data.newsEntryResults?.filter((r: any) => r.success).map((r: any) => r.ticker) || [];
      
      toast({
        title: "Screenshot Processed! 📸",
        description: successCount > 0 
          ? `Catalyst(s) added for: ${tickers.join(", ")}`
          : 'No matching stocks found in your watchlist',
        variant: successCount > 0 ? 'default' : 'destructive',
      });
      
    } catch (error) {
      console.error('❌ Screenshot processing error:', error);
      toast({
        title: "Screenshot Analysis Failed",
        description: error instanceof Error ? error.message : "Unable to analyze the screenshot. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleStockClick = useCallback((stock: Stock) => {
    setSelectedStock(stock);
    setActiveTab('history');
  }, []);

  const handlePushBack = useCallback(() => {
    setSelectedStock(null);
  }, []);

  // Add stock to watchlist
  const handleAddStock = () => {
    if (newStockSymbol.trim() && newStockName.trim()) {
      setWatchlist(prev => [
        ...prev,
        { symbol: newStockSymbol.toUpperCase(), name: newStockName }
      ]);
      setNewStockSymbol('');
      setNewStockName('');
    }
  };
  // Remove stock from watchlist
  const handleRemoveStock = (symbol: string) => {
    setWatchlist(prev => prev.filter(stock => stock.symbol !== symbol));
    if (selectedStock?.symbol === symbol) setSelectedStock(null);
  };
  // Start editing a stock
  const handleEditStock = (stock: Stock) => {
    setEditingStock(stock);
    setEditStockSymbol(stock.symbol);
    setEditStockName(stock.name);
  };
  // Save edited stock
  const handleSaveEditStock = () => {
    if (editingStock && editStockSymbol.trim() && editStockName.trim()) {
      setWatchlist(prev => prev.map(stock =>
        stock.symbol === editingStock.symbol
          ? { symbol: editStockSymbol.toUpperCase(), name: editStockName }
          : stock
      ));
      setEditingStock(null);
      setEditStockSymbol('');
      setEditStockName('');
    }
  };
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingStock(null);
    setEditStockSymbol('');
    setEditStockName('');
  };

  const renderTabContent = (tabName: string, content: React.ReactNode) => {
    try {
      return content;
    } catch (error) {
      console.error(`Error in ${tabName} tab:`, error);
      return (
        <div className="p-4 text-center text-red-600">
          <p>Error loading {tabName}. Please try refreshing the page.</p>
          <pre className="text-sm mt-2">{String(error)}</pre>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Split Screen Container */}
      <div 
        className="relative"
      >
        <div 
          id="split-container"
          className="flex h-screen relative"
          style={{ cursor: isDragging ? 'col-resize' : 'default' }}
        >
          {/* Left Panel - ConcoreNews */}
          <div 
            className={`bg-background border-r transition-colors ${
              isDragOver ? 'bg-blue-50 border-blue-300' : ''
            }`}
            style={{ width: `${leftPanelWidth}%` }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="h-full flex flex-col relative">
              {/* Drop Zone Message */}
              {isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 backdrop-blur-sm z-10">
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                    <p className="text-lg font-semibold text-blue-700">Drop news anywhere on ConcoreNews section</p>
                    <p className="text-sm text-blue-600">Screenshots, articles, or documents</p>
                  </div>
                </div>
              )}

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="p-4 border-b bg-muted/30">
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-background p-2 rounded text-xs">
                        <span className="truncate">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Small Drop Message */}
              {!isDragOver && uploadedFiles.length === 0 && (
                <div className="p-4 text-center">
                  <p className="text-2xl md:text-3xl font-bold text-muted-foreground">Drop news anywhere on ConcoreNews section</p>
                </div>
              )}

              {/* Stock Selector */}
              <div className="p-4 border-b">
                <StockSelector
                  value={selectedStock}
                  onChange={setSelectedStock}
                />
              </div>

              {/* Watchlist */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Watchlist</h3>
                    <button
                      onClick={handleAddStock}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {watchlist.map((stock) => (
                      <div
                        key={stock.symbol}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          selectedStock?.symbol === stock.symbol
                            ? 'bg-blue-100 border-blue-300'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedStock(stock)}
                      >
                        <div className="flex items-center space-x-2">
                          <img
                            src={getLogoUrl(stock.symbol)}
                            alt={stock.symbol}
                            className="w-6 h-6 rounded object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-logo.png';
                            }}
                          />
                          <div>
                            <div className="font-medium text-sm">{stock.symbol}</div>
                            <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStock(stock);
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveStock(stock.symbol);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Stock Details */}
                {selectedStock && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b">
                      <div className="flex items-center space-x-3">
                        <img
                          src={getLogoUrl(selectedStock.symbol)}
                          alt={selectedStock.symbol}
                          className="w-8 h-8 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-logo.png';
                          }}
                        />
                        <div>
                          <h3 className="font-semibold">{selectedStock.symbol}</h3>
                          <p className="text-sm text-muted-foreground">{selectedStock.name}</p>
                        </div>
                      </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col min-h-0">
                      <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
                        <TabsTrigger value="history" className="flex items-center space-x-1">
                          <History className="h-3 w-3" />
                          <span className="text-xs">History</span>
                        </TabsTrigger>
                        <TabsTrigger value="search" className="flex items-center space-x-1">
                          <Search className="h-3 w-3" />
                          <span className="text-xs">Search</span>
                        </TabsTrigger>
                        <TabsTrigger value="news" className="flex items-center space-x-1">
                          <Plus className="h-3 w-3" />
                          <span className="text-xs">Add News</span>
                        </TabsTrigger>
                        <TabsTrigger value="alerts" className="flex items-center space-x-1">
                          <Bell className="h-3 w-3" />
                          <span className="text-xs">Alerts</span>
                        </TabsTrigger>
                      </TabsList>

                      <div className="flex-1 overflow-y-auto px-4 pb-4">
                        <TabsContent value="history" className="mt-4 h-full">
                          {renderTabContent("history", <StockNewsHistory ticker={selectedStock.symbol} refreshKey={refreshKey} />)}
                        </TabsContent>

                        <TabsContent value="search" className="mt-4 h-full">
                          {renderTabContent("search", <StockNewsSearch ticker={selectedStock.symbol} />)}
                        </TabsContent>

                        <TabsContent value="news" className="mt-4 h-full">
                          {renderTabContent("news", <StockManualNewsForm ticker={selectedStock.symbol} />)}
                        </TabsContent>

                        <TabsContent value="alerts" className="mt-4 h-full">
                          {renderTabContent("alerts", <StockAlertTab />)}
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resizable Divider */}
          <div
            className="w-1 bg-border hover:bg-blue-500 cursor-col-resize relative group"
            onMouseDown={handleMouseDown}
          >
            {/* Grab Block */}
            <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-8 -ml-4 flex items-center justify-center">
              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap font-medium">
                Grab
              </div>
            </div>
          </div>

          {/* Right Panel - X Integration */}
          <div 
            className="bg-background"
            style={{ width: `${100 - leftPanelWidth}%` }}
          >
            <div className="h-full flex flex-col items-center justify-center px-8">
              {/* Twitter Sign-in Section - Made proportionate to left side */}
              <div className="w-full max-w-lg">
                <div className="mb-12">
                  <XAuth />
                </div>
                
                {/* Workflow Integration Section */}
                <div className="bg-muted/30 rounded-lg p-8">
                  <h3 className="text-2xl font-semibold mb-6 text-center">Workflow Integration</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-lg">Seamless data flow between X and ConcoreNews</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-lg">Drag & drop news in the drop zone</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-lg">Copy and paste article processing</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-lg">Automated news processing</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-lg">Content categorization</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 