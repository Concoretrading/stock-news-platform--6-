'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Twitter, Calendar, BarChart3, TrendingUp } from 'lucide-react';

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
      <div className="flex h-screen">
        {/* Left Panel - ConcoreNews */}
        <div className="w-1/2 bg-white border-r border-gray-200">
          <div className="h-full flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">ConcoreNews</h2>
            </div>
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Features</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Earnings calendar integration</li>
                    <li>• News analysis and tracking</li>
                    <li>• Stock history management</li>
                    <li>• AI-powered content processing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Twitter */}
        <div className="w-1/2 bg-white">
          <div className="h-full flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center space-x-2">
                <Twitter className="h-6 w-6 text-blue-400" />
                <h2 className="text-xl font-semibold text-gray-900">Twitter Integration</h2>
              </div>
            </div>
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Capabilities</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Full Twitter functionality</li>
                    <li>• Drag and drop from Twitter</li>
                    <li>• Copy-paste URL import</li>
                    <li>• AI ticker detection</li>
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