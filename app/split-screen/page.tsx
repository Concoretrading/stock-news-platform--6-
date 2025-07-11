'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Twitter, Calendar, BarChart3, TrendingUp, ChevronRight, Star, Activity, History, Search, Plus, FileText, Upload, X, GripVertical } from 'lucide-react';
import { XAuth } from '@/components/twitter-auth';

interface Stock {
  ticker: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
}

export default function SplitScreenPage() {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'search' | 'news'>('history');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Default percentage
  const [isDragging, setIsDragging] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);
  
  // Load saved width from localStorage on component mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('split-screen-width');
    if (savedWidth) {
      const width = parseFloat(savedWidth);
      if (width >= 20 && width <= 80) {
        setLeftPanelWidth(width);
      }
    }
  }, []);

  // Save width to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('split-screen-width', leftPanelWidth.toString());
  }, [leftPanelWidth]);
  
  // Mock watchlist data
  const watchlist: Stock[] = [
    { ticker: 'AAPL', name: 'Apple Inc.', price: '$175.43', change: '+2.34', changePercent: '+1.35%', isPositive: true },
    { ticker: 'TSLA', name: 'Tesla Inc.', price: '$248.50', change: '-5.67', changePercent: '-2.23%', isPositive: false },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', price: '$892.11', change: '+12.45', changePercent: '+1.41%', isPositive: true },
    { ticker: 'MSFT', name: 'Microsoft Corp.', price: '$415.22', change: '+3.78', changePercent: '+0.92%', isPositive: true },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', price: '$142.56', change: '-1.23', changePercent: '-0.85%', isPositive: false },
    { ticker: 'META', name: 'Meta Platforms', price: '$485.09', change: '+8.91', changePercent: '+1.87%', isPositive: true },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', price: '$178.12', change: '+2.15', changePercent: '+1.22%', isPositive: true },
    { ticker: 'NFLX', name: 'Netflix Inc.', price: '$612.45', change: '-4.32', changePercent: '-0.70%', isPositive: false },
  ];

  // Drag and drop handlers
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
    console.log('Files dropped:', files);
    
    // Add files to uploaded list
    setUploadedFiles(prev => [...prev, ...files]);
  }, []);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Resizable divider handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const container = document.getElementById('split-container');
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Limit width between 20% and 80%
      const clampedWidth = Math.max(20, Math.min(80, newWidth));
      setLeftPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900">Split Screen Mode</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>ConcoreNews</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Twitter className="h-4 w-4" />
              <span>X Integration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Container */}
      <div 
        id="split-container"
        className="flex h-[calc(100vh-80px)] relative"
        style={{ cursor: isDragging ? 'col-resize' : 'default' }}
      >
        {/* Left Panel - ConcoreNews */}
        <div 
          className="bg-white border-r border-gray-200 flex flex-col"
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* Drag & Drop Zone */}
          <div
            className={`p-4 border-b border-gray-200 transition-colors ${
              isDragOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-center py-6 border-2 border-dashed border-gray-300 rounded-lg bg-white">
              <div className="text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Drag & drop screenshots or articles here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports images, PDFs, and text content
                </p>
              </div>
            </div>
            
            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Watchlist */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Watchlist</h2>
              <div className="space-y-2">
                {watchlist.map((stock) => (
                  <div
                    key={stock.ticker}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 ${
                      selectedStock?.ticker === stock.ticker ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                    }`}
                    onClick={() => setSelectedStock(stock)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">{stock.ticker[0]}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{stock.ticker}</div>
                          <div className="text-sm text-gray-500">{stock.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{stock.price}</div>
                        <div className={`text-sm ${stock.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change} ({stock.changePercent})
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Stock Details */}
          {selectedStock && (
            <div className="border-t border-gray-200 bg-gray-50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedStock.ticker} - {selectedStock.name}
                  </h3>
                  <button
                    onClick={() => setSelectedStock(null)}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span>Push Back</span>
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 mb-4">
                  {[
                    { id: 'history', label: 'History', icon: History },
                    { id: 'search', label: 'Search', icon: Search },
                    { id: 'news', label: 'Add News', icon: Plus }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  {activeTab === 'history' && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Stock History</h4>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">Q4 Earnings Beat Expectations</div>
                            <div className="text-xs text-gray-500">2 hours ago</div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">New Product Launch Announced</div>
                            <div className="text-xs text-gray-500">1 day ago</div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">Analyst Upgrade to Buy</div>
                            <div className="text-xs text-gray-500">3 days ago</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'search' && (
                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          placeholder="Search news about this stock..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Recent News</h4>
                        <div className="space-y-2">
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="text-sm font-medium text-gray-900">Market Analysis: Growth Prospects</div>
                            <div className="text-xs text-gray-500">Bloomberg • 1 hour ago</div>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="text-sm font-medium text-gray-900">Technical Analysis Update</div>
                            <div className="text-xs text-gray-500">CNBC • 3 hours ago</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'news' && (
                    <div className="space-y-4">
                      <div>
                        <textarea
                          placeholder="Paste or type news content here..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          Add to History
                        </button>
                        <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                          Analyze
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resizable Divider */}
        <div
          ref={dividerRef}
          className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize relative group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 bg-transparent" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-6 w-6 text-gray-400" />
          </div>
        </div>

        {/* Right Panel - X Integration */}
        <div 
          className="bg-white flex flex-col"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          <div className="p-6">
            <div className="text-center">
              <Twitter className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">X Integration</h2>
              <p className="text-gray-600 mb-6">
                Connect your X account to browse, post, and analyze content alongside your stock research.
              </p>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Features Available:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Browse X feed and trending topics</li>
                    <li>• Post updates and analysis</li>
                    <li>• Drag & drop content from X to ConcoreNews</li>
                    <li>• AI-powered content analysis</li>
                  </ul>
                </div>
                
                <XAuth />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 