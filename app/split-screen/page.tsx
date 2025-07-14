'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Twitter, Calendar, BarChart3, TrendingUp, ChevronRight, Star, Activity, History, Search, Plus, FileText, Upload, X, GripVertical, Bell, PlusCircle, Trash2, Edit2, Settings, Move } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [showStockSelector, setShowStockSelector] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Mock watchlist data - in real implementation, this would come from user's watchlist
  const mockWatchlist: Stock[] = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'UBER', name: 'Uber Technologies Inc.' },
    { symbol: 'SPOT', name: 'Spotify Technology S.A.' },
  ];

  const containerRef = useRef<HTMLDivElement>(null);

  // Track client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle mouse events for resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Handle touch events for mobile resizing
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Check if we're on mobile (flex-col) or desktop (flex-row)
    const isMobile = isClient && window.innerWidth < 768;
    
    if (isMobile) {
      // Mobile: vertical resize (Y axis)
      const percentage = ((e.clientY - rect.top) / rect.height) * 100;
      setLeftPanelWidth(Math.min(Math.max(percentage, 20), 80));
    } else {
      // Desktop: horizontal resize (X axis)
      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPanelWidth(Math.min(Math.max(percentage, 20), 80));
    }
  }, [isDragging, isClient]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const touch = e.touches[0];
    
    // Check if we're on mobile (flex-col) or desktop (flex-row)
    const isMobile = isClient && window.innerWidth < 768;
    
    if (isMobile) {
      // Mobile: vertical resize (Y axis)
      const percentage = ((touch.clientY - rect.top) / rect.height) * 100;
      setLeftPanelWidth(Math.min(Math.max(percentage, 20), 80));
    } else {
      // Desktop: horizontal resize (X axis)
      const percentage = ((touch.clientX - rect.left) / rect.width) * 100;
      setLeftPanelWidth(Math.min(Math.max(percentage, 20), 80));
    }
  }, [isDragging, isClient]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      // Mouse events
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Touch events
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const loadUserWatchlist = async () => {
    if (!user) return;
    
    try {
      const response = await fetchWithAuth('/api/watchlist');
      if (response.ok) {
        const data = await response.json();
        if (data.watchlist && data.watchlist.length > 0) {
          setWatchlist(data.watchlist);
        } else {
          setWatchlist(mockWatchlist);
        }
      } else {
        setWatchlist(mockWatchlist);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
      setWatchlist(mockWatchlist);
    } finally {
      setIsLoadingStocks(false);
    }
  };

  useEffect(() => {
    loadUserWatchlist();
  }, [user]);

  useEffect(() => {
    if (watchlist.length > 0 && !selectedStock) {
      setSelectedStock(watchlist[0]);
    }
  }, [watchlist, selectedStock]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
      
      // Process each file
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          processScreenshot(file);
        } else {
          console.log('Processing non-image file:', file.name);
        }
      });
    }
  }, []);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processScreenshot = async (file: File) => {
    if (!selectedStock) {
      toast({
        title: "No Stock Selected",
        description: "Please select a stock before uploading screenshots.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('screenshot', file);
      formData.append('ticker', selectedStock.symbol);

      const response = await fetchWithAuth('/api/analyze-screenshot', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Screenshot Processed",
          description: `Successfully analyzed screenshot for ${selectedStock.symbol}`,
        });
        
        // Refresh the history tab
        setRefreshKey(prev => prev + 1);
        
        // Remove the processed file
        setUploadedFiles(prev => prev.filter(f => f !== file));
      } else {
        const error = await response.json();
        toast({
          title: "Processing Failed",
          description: error.message || "Failed to process screenshot",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing screenshot:', error);
      toast({
        title: "Error",
        description: "An error occurred while processing the screenshot",
        variant: "destructive",
      });
    }
  };

  const handleAddStock = () => {
    setShowStockSelector(true);
  };

  const handleRemoveStock = (symbol: string) => {
    setWatchlist(prev => prev.filter(stock => stock.symbol !== symbol));
    if (selectedStock?.symbol === symbol) {
      setSelectedStock(watchlist.find(s => s.symbol !== symbol) || null);
    }
  };

  const handleEditStock = (stock: Stock) => {
    // For now, just show the stock selector
    setShowStockSelector(true);
  };

  const handleSaveEditStock = () => {
    // Implementation for saving edited stock
    setShowStockSelector(false);
  };

  const handleCancelEdit = () => {
    setShowStockSelector(false);
  };

  const handleUpdateWatchlist = async (newStocks: Stock[]) => {
    try {
      const response = await fetchWithAuth('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ watchlist: newStocks }),
      });

      if (response.ok) {
        setWatchlist(newStocks);
        if (newStocks.length > 0 && !selectedStock) {
          setSelectedStock(newStocks[0]);
        }
        setShowStockSelector(false);
        toast({
          title: "Watchlist Updated",
          description: "Your watchlist has been successfully updated.",
        });
      } else {
        throw new Error('Failed to update watchlist');
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to update watchlist. Please try again.",
        variant: "destructive",
      });
    }
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
      {/* Back Button */}
      <div className="sticky top-0 z-50 bg-background border-b px-4 py-3">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Split Screen Container */}
      <div 
        ref={containerRef}
        className="relative"
      >
        <div 
          id="split-container"
          className="flex flex-col md:flex-row h-[calc(100vh-64px)] relative"
          style={{ cursor: isDragging ? 'row-resize md:col-resize' : 'default' }}
        >
          {/* X Panel - Top on Mobile, Right on Desktop */}
          <div 
            className="bg-background border-b md:border-b-0 md:border-l w-full md:w-auto order-first md:order-last"
            style={{ 
              height: `${leftPanelWidth}%`,
              width: isClient && window.innerWidth >= 768 ? `${100 - leftPanelWidth}%` : '100%'
            }}
          >
            <div className="h-full flex flex-col items-center justify-center px-4 md:px-8">
              {/* Twitter Sign-in Section */}
              <div className="w-full max-w-lg">
                <div className="mb-6 md:mb-12">
                  <XAuth />
                </div>
                
                {/* Workflow Integration Section */}
                <div className="bg-muted/30 rounded-lg p-4 md:p-8">
                  <h3 className="text-lg md:text-2xl font-semibold mb-4 md:mb-6 text-center">Workflow Integration</h3>
                  <div className="space-y-2 md:space-y-4">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="w-4 h-4 md:w-6 md:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs md:text-sm font-bold">1</span>
                      </div>
                      <span className="text-sm md:text-base">Connect your X account</span>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="w-4 h-4 md:w-6 md:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs md:text-sm font-bold">2</span>
                      </div>
                      <span className="text-sm md:text-base">Drop news content on ConcoreNews</span>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="w-4 h-4 md:w-6 md:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs md:text-sm font-bold">3</span>
                      </div>
                      <span className="text-sm md:text-base">Auto-categorize and track</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prominent Grab to Move Divider */}
          <div
            className={`relative group touch-none transition-all duration-200 flex items-center justify-center ${
              isDragging 
                ? 'h-12 md:h-full md:w-12 bg-blue-600 shadow-lg' 
                : 'h-10 md:h-full md:w-10 bg-gray-200 hover:bg-blue-500'
            } cursor-row-resize md:cursor-col-resize`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Prominent Grab Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Mobile: Horizontal grab button */}
              <div className="flex md:hidden items-center justify-center w-full h-full">
                <div className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isDragging 
                    ? 'bg-white/20 text-white scale-105' 
                    : 'bg-black/10 text-gray-700 hover:bg-white/80 hover:text-blue-600'
                }`}>
                  <Move className="h-4 w-4" />
                  <span className="text-xs font-semibold whitespace-nowrap">Grab to Move</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-current opacity-60" />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Desktop: Vertical grab button */}
              <div className="hidden md:flex flex-col items-center justify-center h-full">
                <div className={`flex flex-col items-center justify-center space-y-2 px-2 py-4 rounded-lg transition-all duration-200 ${
                  isDragging 
                    ? 'bg-white/20 text-white scale-105' 
                    : 'bg-black/10 text-gray-700 hover:bg-white/80 hover:text-blue-600'
                }`}>
                  <Move className="h-4 w-4" />
                  <div className="flex flex-col space-y-1 items-center">
                    <span className="text-xs font-semibold transform -rotate-90 whitespace-nowrap">Grab</span>
                    <span className="text-xs font-semibold transform -rotate-90 whitespace-nowrap">to Move</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-current opacity-60" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Touch Instructions */}
            {!isDragging && (
              <div className="absolute inset-x-0 md:inset-y-0 top-full md:top-auto md:left-full transform md:-translate-y-1/2 mt-2 md:mt-0 md:ml-3 flex md:flex-col items-center justify-center pointer-events-none">
                <div className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap font-medium opacity-0 group-hover:opacity-100 transition-opacity border border-blue-500">
                  <span className="md:hidden">👆 Hold & drag up/down to resize</span>
                  <span className="hidden md:inline">👈 Hold & drag left/right to resize</span>
                </div>
              </div>
            )}
          </div>

          {/* ConcoreNews Panel - Bottom on Mobile, Left on Desktop */}
          <div 
            className={`bg-background md:border-r border-t md:border-t-0 transition-colors w-full md:w-auto order-last md:order-first ${
              isDragOver ? 'bg-blue-50 border-blue-300' : ''
            }`}
            style={{ 
              height: `${100 - leftPanelWidth}%`,
              width: isClient && window.innerWidth >= 768 ? `${leftPanelWidth}%` : '100%'
            }}
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
                            className="text-gray-500 hover:text-blue-600"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveStock(stock.symbol);
                            }}
                            className="text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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
                      <TabsList className="grid w-full grid-cols-4 mx-2 md:mx-4 mt-2 md:mt-4">
                        <TabsTrigger value="history" className="flex items-center space-x-1 text-xs">
                          <History className="h-3 w-3" />
                          <span className="hidden sm:inline">History</span>
                        </TabsTrigger>
                        <TabsTrigger value="search" className="flex items-center space-x-1 text-xs">
                          <Search className="h-3 w-3" />
                          <span className="hidden sm:inline">Search</span>
                        </TabsTrigger>
                        <TabsTrigger value="news" className="flex items-center space-x-1 text-xs">
                          <Plus className="h-3 w-3" />
                          <span className="hidden sm:inline">Add News</span>
                        </TabsTrigger>
                        <TabsTrigger value="alerts" className="flex items-center space-x-1 text-xs">
                          <Bell className="h-3 w-3" />
                          <span className="hidden sm:inline">Alerts</span>
                        </TabsTrigger>
                      </TabsList>

                      <div className="flex-1 overflow-y-auto px-2 md:px-4 pb-2 md:pb-4">
                        <TabsContent value="history" className="mt-2 md:mt-4 h-full">
                          {renderTabContent("history", <StockNewsHistory ticker={selectedStock.symbol} refreshKey={refreshKey} />)}
                        </TabsContent>

                        <TabsContent value="search" className="mt-2 md:mt-4 h-full">
                          {renderTabContent("search", <StockNewsSearch ticker={selectedStock.symbol} />)}
                        </TabsContent>

                        <TabsContent value="news" className="mt-2 md:mt-4 h-full">
                          {renderTabContent("news", <StockManualNewsForm ticker={selectedStock.symbol} />)}
                        </TabsContent>

                        <TabsContent value="alerts" className="mt-2 md:mt-4 h-full">
                          {renderTabContent("alerts", <StockAlertTab />)}
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Selector Modal */}
      {showStockSelector && (
        <StockSelector
          isOpen={true}
          onClose={() => setShowStockSelector(false)}
          onUpdateWatchlist={handleUpdateWatchlist}
          currentStocks={watchlist}
          maxStocks={10}
          isShowingDefaults={false}
        />
      )}
    </div>
  );
} 