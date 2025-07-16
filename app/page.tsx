'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🚀 AI Breakout Analyzer
        </h1>
        
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Advanced AI-powered stock analysis system for detecting breakouts, momentum patterns, and trading opportunities using real-time market data.
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          <a
            href="/api/polygon/test"
            className="group p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Test API Connection</h3>
            <p className="text-sm text-gray-600">
              Verify live market data connection and API functionality
            </p>
          </a>

          <a
            href="/api/breakout?ticker=AAPL"
            className="group p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="text-3xl mb-3">📈</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Analyze AAPL</h3>
            <p className="text-sm text-gray-600">
              Run comprehensive breakout analysis on Apple stock
            </p>
          </a>

          <a
            href="/api/breakout?ticker=TSLA"
            className="group p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Analyze TSLA</h3>
            <p className="text-sm text-gray-600">
              Detect momentum and volatility patterns in Tesla stock
            </p>
          </a>

          <a
            href="/chart-analysis"
            className="group p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-300"
          >
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Chart Analysis</h3>
            <p className="text-sm text-gray-600">
              Upload charts for AI-powered pattern recognition
            </p>
          </a>

          <a
            href="/premium"
            className="group p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-300"
          >
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Premium & Squeeze Pro</h3>
            <p className="text-sm text-gray-600">
              Advanced options analysis with squeeze indicators
            </p>
          </a>
        </div>

        <div className="bg-gray-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🎯 Breakout Detection</h3>
              <p className="text-sm text-gray-600">
                Advanced algorithms detect consolidation periods and breakout signals with confidence scoring
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">💰 Premium Analysis</h3>
              <p className="text-sm text-gray-600">
                Options chain analysis, volatility skew, and institutional flow tracking for premium insights
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🎢 Squeeze Pro</h3>
              <p className="text-sm text-gray-600">
                Bollinger vs Keltner band analysis for volatility compression and momentum detection
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🤖 AI Integration</h3>
              <p className="text-sm text-gray-600">
                Machine learning models process chart patterns and market data for intelligent trading insights
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Powered by Polygon API • Built with Next.js & TypeScript</p>
        </div>
      </div>
    </main>
  );
}
