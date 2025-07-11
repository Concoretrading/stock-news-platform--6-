'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Twitter, Calendar, BarChart3, TrendingUp, ChevronRight, Star, Activity, History, Search, Plus, FileText } from 'lucide-react';
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
  
  // Mock watchlist data
  const watchlist: Stock[] = [
    { ticker: 'AAPL', name: 'Apple Inc.', price: '$175.43', change: '+2.34', changePercent: '+1.35%', isPositive: true },
    { ticker: 'TSLA', name: 'Tesla Inc.', price: '$248.50', change: '-5.67', changePercent: '-2.23%', isPositive: false },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', price: '$892.11', change: '+12.45', changePercent: '+1.41%', isPositive: true },
    { ticker: 'MSFT', name: 'Microsoft Corp.', price: '$415.22', change: '+3.21', changePercent: '+0.78%', isPositive: true },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', price: '$142.56', change: '-1.23', changePercent: '-0.85%', isPositive: false },
    { ticker: 'META', name: 'Meta Platforms', price: '$485.09', change: '+8.76', changePercent: '+1.84%', isPositive: true },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', price: '$178.12', change: '+2.89', changePercent: '+1.65%', isPositive: true },
    { ticker: 'NFLX', name: 'Netflix Inc.', price: '$612.45', change: '-4.32', changePercent: '-0.70%', isPositive: false },
  ];

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
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Split Screen Mode</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - ConcoreNews Watchlist */}
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">ConcoreNews</h3>
                <p className="text-sm text-gray-600">Your Watchlist</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Activity className="h-4 w-4" />
              <span>8 stocks • Last updated 2 min ago</span>
            </div>
          </div>

          {/* Watchlist */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {watchlist.map((stock) => (
                <div
                  key={stock.ticker}
                  onClick={() => setSelectedStock(stock)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedStock?.ticker === stock.ticker
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-700">{stock.ticker}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{stock.ticker}</div>
                        <div className="text-sm text-gray-600">{stock.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{stock.price}</div>
                      <div className={`text-sm ${stock.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.change} ({stock.changePercent})
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs text-gray-500">In watchlist</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Stock Details */}
          {selectedStock && (
            <div className="border-t border-gray-200 bg-gray-50">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-700">{selectedStock.ticker}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{selectedStock.name}</div>
                      <div className="text-sm text-gray-600">{selectedStock.ticker}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStock(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'history'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <History className="h-4 w-4" />
                  History
                </button>
                <button
                  onClick={() => setActiveTab('search')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'search'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
                <button
                  onClick={() => setActiveTab('news')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'news'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Add News
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'history' && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Stock History</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Earnings Report Q4 2024</span>
                        </div>
                        <p className="text-xs text-gray-600">Added 2 days ago</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Product Launch News</span>
                        </div>
                        <p className="text-xs text-gray-600">Added 1 week ago</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium">Market Analysis</span>
                        </div>
                        <p className="text-xs text-gray-600">Added 2 weeks ago</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'search' && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Search News</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Search for news about this stock..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="space-y-2">
                        <div className="p-3 bg-white rounded-lg border">
                          <div className="text-sm font-medium text-gray-900">Recent News</div>
                          <div className="text-xs text-gray-600 mt-1">No recent news found</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                          <div className="text-sm font-medium text-gray-900">Analyst Reports</div>
                          <div className="text-xs text-gray-600 mt-1">No analyst reports found</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'news' && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Add News</h4>
                    <div className="space-y-3">
                      <textarea
                        placeholder="Paste or type news content here..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700">
                          Add to History
                        </button>
                        <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-700">
                          Analyze
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - X Integration */}
        <div className="w-1/2 bg-white">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <Twitter className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">X Integration</h3>
                <p className="text-sm text-gray-600">Social Media & Content Analysis</p>
              </div>
            </div>
            
            {/* X Authentication Component */}
            <div className="mb-6">
              <XAuth />
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Content Import</h4>
                <p className="text-sm text-gray-600">Drag & drop, copy-paste, or upload screenshots from X</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">AI Ticker Detection</h4>
                <p className="text-sm text-blue-700">Automatically detect and analyze stock mentions</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Sentiment Analysis</h4>
                <p className="text-sm text-green-700">Real-time sentiment tracking for market insights</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Direct Posting</h4>
                <p className="text-sm text-purple-700">Share analysis and insights directly to X</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 