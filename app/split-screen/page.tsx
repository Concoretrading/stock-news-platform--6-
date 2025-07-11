'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Twitter, Calendar, BarChart3, TrendingUp, ChevronRight, Star, Activity, History, Search, Plus, FileText, Upload, X, GripVertical, Bell, PlusCircle, Trash2, Edit2 } from 'lucide-react';
import { XAuth } from '@/components/twitter-auth';
import { StockNewsHistory } from '@/components/stock-news-history';
import { StockNewsSearch } from '@/components/stock-news-search';
import { StockManualNewsForm } from '@/components/stock-manual-news-form';
import { StockAlertTab } from '@/components/stock-alert-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth-provider';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

interface Stock {
  id?: string;
  symbol: string;
  name: string;
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
      console.log('Files dropped:', files);
      // Here you would process the files like in the main dashboard
    }
  }, []);

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
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold">Split Screen Mode</h1>
                <p className="text-sm text-muted-foreground">ConcoreNews + X Integration</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/calendar">
                <Calendar className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              </Link>
              <Link href="/stocks">
                <BarChart3 className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Split Screen Container */}
      <div 
        id="split-container"
        className="flex h-[calc(100vh-80px)] relative"
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
                  <p className="text-lg font-semibold text-blue-700">Drop news anywhere on the screen</p>
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
                <p className="text-xs text-muted-foreground">Drop news anywhere on the screen</p>
              </div>
            )}

            {/* Stock Watchlist Management */}
            <div className="flex-1 overflow-y-auto p-4">
              <h2 className="text-lg font-semibold mb-4">Watchlist</h2>
              {/* Add Stock Form */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Symbol"
                  value={newStockSymbol}
                  onChange={e => setNewStockSymbol(e.target.value)}
                  className="border rounded px-2 py-1 text-xs w-20"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  value={newStockName}
                  onChange={e => setNewStockName(e.target.value)}
                  className="border rounded px-2 py-1 text-xs flex-1"
                />
                <button
                  onClick={handleAddStock}
                  className="bg-blue-500 text-white rounded px-2 py-1 text-xs flex items-center gap-1 hover:bg-blue-600"
                  aria-label="Add Stock"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add
                </button>
              </div>
              {/* Edit Stock Form */}
              {editingStock && (
                <div className="flex gap-2 mb-4 bg-blue-50 p-2 rounded">
                  <input
                    type="text"
                    placeholder="Symbol"
                    value={editStockSymbol}
                    onChange={e => setEditStockSymbol(e.target.value)}
                    className="border rounded px-2 py-1 text-xs w-20"
                  />
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={editStockName}
                    onChange={e => setEditStockName(e.target.value)}
                    className="border rounded px-2 py-1 text-xs flex-1"
                  />
                  <button
                    onClick={handleSaveEditStock}
                    className="bg-green-500 text-white rounded px-2 py-1 text-xs flex items-center gap-1 hover:bg-green-600"
                    aria-label="Save"
                  >
                    <Edit2 className="h-4 w-4" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-300 text-gray-700 rounded px-2 py-1 text-xs flex items-center gap-1 hover:bg-gray-400"
                    aria-label="Cancel"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {/* Watchlist Items */}
              {isLoadingStocks ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {watchlist.map((stock) => (
                    <div
                      key={stock.symbol}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedStock?.symbol === stock.symbol 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                          : 'border-border hover:border-blue-300'
                      }`}
                      onClick={() => handleStockClick(stock)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center overflow-hidden">
                            {/* Show logo if available, otherwise fallback to first letter */}
                            <img
                              src={`/images/logos/${stock.symbol.toUpperCase()}.png`}
                              alt={stock.symbol}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/placeholder-logo.png';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">{stock.symbol}</div>
                            <div className="text-sm text-muted-foreground truncate">{stock.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={e => { e.stopPropagation(); handleEditStock(stock); }}
                            className="text-blue-500 hover:text-blue-700"
                            aria-label="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleRemoveStock(stock.symbol); }}
                            className="text-red-500 hover:text-red-700"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Stock Details */}
            {selectedStock && (
              <div className="border-t bg-muted/30">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedStock.symbol}</h3>
                      <p className="text-sm text-muted-foreground">{selectedStock.name}</p>
                    </div>
                    <button
                      onClick={handlePushBack}
                      className="p-2 hover:bg-background rounded transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Tabs */}
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
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

                    <div className="h-64 overflow-y-auto">
                      <TabsContent value="history" className="mt-0">
                        {renderTabContent("history", <StockNewsHistory ticker={selectedStock.symbol} refreshKey={refreshKey} />)}
                      </TabsContent>

                      <TabsContent value="search" className="mt-0">
                        {renderTabContent("search", <StockNewsSearch ticker={selectedStock.symbol} />)}
                      </TabsContent>

                      <TabsContent value="news" className="mt-0">
                        {renderTabContent("news", <StockManualNewsForm ticker={selectedStock.symbol} />)}
                      </TabsContent>

                      <TabsContent value="alerts" className="mt-0">
                        {renderTabContent("alerts", <StockAlertTab />)}
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </div>
            )}
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
          <div className="h-full flex flex-col">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Twitter className="h-6 w-6 text-blue-400" />
                <h2 className="text-xl font-semibold">X Integration</h2>
              </div>
              
              <XAuth />
              
              <div className="mt-8 space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">AI-Powered Features</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Automatic ticker detection from X posts</li>
                    <li>• Content categorization and analysis</li>
                    <li>• Drag & drop screenshots from X</li>
                    <li>• Copy-paste article processing</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">Workflow Integration</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Seamless data flow between X and ConcoreNews</li>
                    <li>• Real-time market analysis</li>
                    <li>• Automated news processing</li>
                    <li>• Unified trading calendar</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 