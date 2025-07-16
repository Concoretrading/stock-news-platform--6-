'use client';

import React, { useState, useEffect } from 'react';

interface OptionsContract {
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  premium: number;
  intrinsicValue: number;
  timeValue: number;
  moneyness: 'ITM' | 'ATM' | 'OTM';
}

interface OptionsChain {
  ticker: string;
  expirationDate: string;
  calls: OptionsContract[];
  puts: OptionsContract[];
  totalVolume: number;
  putCallRatio: number;
  maxPain: number;
  gammaExposure: number;
}

interface SqueezeIndicator {
  state: 'building' | 'firing' | 'cooling';
  strength: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  momentum: number;
  keltnerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  isInSqueeze: boolean;
  squeezeDuration: number;
}

interface PremiumAnalysis {
  ticker: string;
  currentPrice: number;
  optionsChains: OptionsChain[];
  volatilitySmile: number[];
  skew: number;
  termStructure: number[];
  flowAnalysis: {
    callBias: number;
    putBias: number;
    unusualActivity: OptionsContract[];
    darkPoolFlow: number;
  };
  recommendations: {
    strategy: string;
    reasoning: string;
    targetStrikes: number[];
    expectedMove: number;
  };
}

interface BreakoutSignal {
  ticker: string;
  confidence: number;
  direction: 'bullish' | 'bearish';
  squeeze: SqueezeIndicator;
  premium: PremiumAnalysis;
  keyLevels: {
    support: number[];
    resistance: number[];
    breakoutLevel: number;
  };
}

export default function PremiumDashboard() {
  const [ticker, setTicker] = useState('AAPL');
  const [analysisData, setAnalysisData] = useState<BreakoutSignal | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('squeeze');

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/breakout?ticker=${ticker}`);
      const data = await response.json();
      if (data.success && data.signals.length > 0) {
        setAnalysisData(data.signals[0]);
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [ticker]);

  const getSqueezeStateColor = (state: string) => {
    switch (state) {
      case 'building': return 'text-yellow-600 bg-yellow-50';
      case 'firing': return 'text-green-600 bg-green-50';
      case 'cooling': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🎯 Premium & Squeeze Pro Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <select
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="AAPL">AAPL</option>
              <option value="TSLA">TSLA</option>
              <option value="NVDA">NVDA</option>
              <option value="SPY">SPY</option>
              <option value="QQQ">QQQ</option>
            </select>
            <button
              onClick={fetchAnalysis}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Analyzing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'squeeze', label: '📊 Squeeze Pro', icon: '🎢' },
              { id: 'premium', label: '💰 Premium Analysis', icon: '⚡' },
              { id: 'chains', label: '🔗 Options Chains', icon: '📈' },
              { id: 'flow', label: '🌊 Order Flow', icon: '💹' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">Analyzing {ticker}...</span>
          </div>
        ) : analysisData ? (
          <div className="space-y-6">
            {/* Squeeze Pro Tab */}
            {activeTab === 'squeeze' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Squeeze State */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Squeeze State</span>
                      <span className="text-lg">🎢</span>
                    </div>
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-2 ${getSqueezeStateColor(analysisData.squeeze.state)}`}>
                      {analysisData.squeeze.state.toUpperCase()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {analysisData.squeeze.isInSqueeze ? 'Volatility Compression' : 'Volatility Expansion'}
                    </p>
                  </div>

                  {/* Direction */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Direction</span>
                      <span className="text-lg">🧭</span>
                    </div>
                    <div className={`text-lg font-bold mt-2 ${getDirectionColor(analysisData.squeeze.direction)}`}>
                      {analysisData.squeeze.direction.toUpperCase()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Momentum: {analysisData.squeeze.momentum.toFixed(3)}
                    </p>
                  </div>

                  {/* Strength */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Strength</span>
                      <span className="text-lg">💪</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mt-2">
                      {analysisData.squeeze.strength.toFixed(1)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, analysisData.squeeze.strength)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Confidence</span>
                      <span className="text-lg">🎯</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 mt-2">
                      {analysisData.confidence.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Breakout Probability
                    </p>
                  </div>
                </div>

                {/* Bollinger vs Keltner Bands */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">📏</span>
                    Band Analysis (Squeeze Detection)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">Bollinger Bands (20, 2)</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Upper:</span>
                          <span className="font-medium">{formatCurrency(analysisData.squeeze.bollingerBands.upper)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Middle (SMA):</span>
                          <span className="font-medium">{formatCurrency(analysisData.squeeze.bollingerBands.middle)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Lower:</span>
                          <span className="font-medium">{formatCurrency(analysisData.squeeze.bollingerBands.lower)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-700 mb-2">Keltner Channels (20, 1.5)</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Upper:</span>
                          <span className="font-medium">{formatCurrency(analysisData.squeeze.keltnerBands.upper)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Middle (EMA):</span>
                          <span className="font-medium">{formatCurrency(analysisData.squeeze.keltnerBands.middle)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Lower:</span>
                          <span className="font-medium">{formatCurrency(analysisData.squeeze.keltnerBands.lower)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Premium Analysis Tab */}
            {activeTab === 'premium' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current Price</span>
                      <span className="text-lg">💰</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900 mt-2">
                      {formatCurrency(analysisData.premium.currentPrice)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">IV Skew</span>
                      <span className="text-lg">📐</span>
                    </div>
                    <div className="text-xl font-bold text-purple-600 mt-2">
                      {formatPercentage(analysisData.premium.skew)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Put vs Call IV</p>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Expected Move</span>
                      <span className="text-lg">📊</span>
                    </div>
                    <div className="text-xl font-bold text-orange-600 mt-2">
                      {formatPercentage(analysisData.premium.recommendations.expectedMove / analysisData.premium.currentPrice)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ±{formatCurrency(analysisData.premium.recommendations.expectedMove)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Dark Pool Flow</span>
                      <span className="text-lg">🌊</span>
                    </div>
                    <div className="text-xl font-bold text-red-600 mt-2">
                      {formatPercentage(analysisData.premium.flowAnalysis.darkPoolFlow)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Off-Exchange Volume</p>
                  </div>
                </div>

                {/* Strategy Recommendation */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">🎯</span>
                    AI Strategy Recommendation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-indigo-700 mb-2">Recommended Strategy</h4>
                      <p className="text-lg font-semibold text-gray-900">
                        {analysisData.premium.recommendations.strategy}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {analysisData.premium.recommendations.reasoning}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-indigo-700 mb-2">Target Strikes</h4>
                      <div className="flex space-x-4">
                        {analysisData.premium.recommendations.targetStrikes.map((strike, index) => (
                          <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                            {formatCurrency(strike)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Options Chains Tab */}
            {activeTab === 'chains' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Volume</span>
                      <span className="text-lg">📊</span>
                    </div>
                    <div className="text-xl font-bold text-green-600 mt-2">
                      {analysisData.premium.optionsChains[0]?.totalVolume.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Put/Call Ratio</span>
                      <span className="text-lg">⚖️</span>
                    </div>
                    <div className="text-xl font-bold text-red-600 mt-2">
                      {analysisData.premium.optionsChains[0]?.putCallRatio.toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Max Pain</span>
                      <span className="text-lg">🎯</span>
                    </div>
                    <div className="text-xl font-bold text-blue-600 mt-2">
                      {formatCurrency(analysisData.premium.optionsChains[0]?.maxPain || 0)}
                    </div>
                  </div>
                </div>

                {/* Options Chain Table */}
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="px-6 py-4 border-b bg-gray-50">
                    <h3 className="text-lg font-semibold">Options Chain - {analysisData.premium.optionsChains[0]?.expirationDate}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calls</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strike</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puts</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analysisData.premium.optionsChains[0]?.calls.slice(0, 5).map((call, index) => {
                          const put = analysisData.premium.optionsChains[0]?.puts[index];
                          return (
                            <tr key={index} className={call.moneyness === 'ATM' ? 'bg-yellow-50' : ''}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                {formatCurrency(call.lastPrice)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {call.volume.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                {formatCurrency(call.strike)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {put?.volume.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                {formatCurrency(put?.lastPrice || 0)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Order Flow Tab */}
            {activeTab === 'flow' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <span className="mr-2">📈</span>
                      Call vs Put Bias
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Call Bias</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatPercentage(analysisData.premium.flowAnalysis.callBias)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-green-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${analysisData.premium.flowAnalysis.callBias * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Put Bias</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatPercentage(analysisData.premium.flowAnalysis.putBias)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-red-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${analysisData.premium.flowAnalysis.putBias * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <span className="mr-2">🌊</span>
                      Institutional Flow
                    </h3>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {formatPercentage(analysisData.premium.flowAnalysis.darkPoolFlow)}
                      </div>
                      <p className="text-sm text-gray-600">Dark Pool Activity</p>
                      <div className="mt-4 text-xs text-gray-500">
                        High dark pool flow indicates institutional positioning
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Levels */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">🎯</span>
                    Key Price Levels
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium text-red-700 mb-2">Support Levels</h4>
                      {analysisData.keyLevels.support.map((level, index) => (
                        <div key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded mb-1 text-sm">
                          {formatCurrency(level)}
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">Breakout Level</h4>
                      <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-bold">
                        {formatCurrency(analysisData.keyLevels.breakoutLevel)}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Resistance Levels</h4>
                      {analysisData.keyLevels.resistance.map((level, index) => (
                        <div key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded mb-1 text-sm">
                          {formatCurrency(level)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No analysis data available. Click "Refresh" to analyze {ticker}.</p>
          </div>
        )}
      </div>
    </div>
  );
} 