'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Twitter, Calendar, BarChart3, TrendingUp } from 'lucide-react';
import { XAuth } from '@/components/twitter-auth';

export default function SplitScreenPage() {
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Split Screen Mode
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Work with X and ConcoreNews side by side
          </p>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - ConcoreNews */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">ConcoreNews</h3>
                <p className="text-sm text-gray-600">Market Analysis Platform</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Earnings Calendar</h4>
                <p className="text-sm text-blue-700">Track upcoming earnings releases and financial events</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">News Analysis</h4>
                <p className="text-sm text-green-700">AI-powered news sentiment and market impact analysis</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Stock History</h4>
                <p className="text-sm text-purple-700">Comprehensive stock data and technical analysis</p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">Market Catalysts</h4>
                <p className="text-sm text-orange-700">Track key events and catalysts affecting stock prices</p>
              </div>
            </div>
          </div>

          {/* Right Panel - X Integration */}
          <div className="bg-white rounded-lg shadow-lg p-6">
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

        {/* Integration Features */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Seamless Integration Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Data Sync</h4>
              <p className="text-sm text-gray-600">Real-time synchronization between X content and market analysis</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Market Insights</h4>
              <p className="text-sm text-gray-600">Transform social media content into actionable trading insights</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Event Tracking</h4>
              <p className="text-sm text-gray-600">Track market events and catalysts from social media</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 