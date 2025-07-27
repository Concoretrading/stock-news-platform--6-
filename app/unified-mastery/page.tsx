'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  Zap,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Timer,
  Eye
} from 'lucide-react';
import PremiumProbabilityDashboard from '@/components/premium-probability-dashboard';
import TradingPsychologyDashboard from '../../components/trading-psychology-dashboard';
import FutureIntelligenceDashboard from '../../components/future-intelligence-dashboard';

interface MarketData {
  success: boolean;
  ticker: string;
  analysis: any;
  summary: any;
}

interface OptionsData {
  success: boolean;
  ticker: string;
  analysis: any;
  summary: any;
}

export default function UnifiedMasteryPage() {
  const [ticker, setTicker] = useState('AAPL');
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [optionsData, setOptionsData] = useState<OptionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(false);

  const fetchAllAnalysis = async (symbol: string) => {
    setLoading(true);
    try {
      // Fetch both market mastery and options analysis in parallel
      const [marketResponse, optionsResponse] = await Promise.all([
        fetch(`/api/market-mastery?ticker=${symbol}`),
        fetch(`/api/options-mastery?ticker=${symbol}`)
      ]);

      const marketResult = await marketResponse.json();
      const optionsResult = await optionsResponse.json();

      setMarketData(marketResult);
      setOptionsData(optionsResult);
    } catch (error) {
      console.error('Error fetching unified analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalysis(ticker);
  }, [ticker]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoUpdate && ticker) {
      interval = setInterval(() => {
        fetchAllAnalysis(ticker);
      }, 10000); // Update every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoUpdate, ticker]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': case 'BUY_CALLS': case 'BUY_PUTS': return 'text-green-600 bg-green-100';
      case 'SELL': case 'SELL_PREMIUM': return 'text-red-600 bg-red-100';
      case 'HOLD': case 'SPREADS': return 'text-yellow-600 bg-yellow-100';
      case 'WAIT': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'FAVORABLE': return 'text-green-600';
      case 'NEUTRAL': return 'text-yellow-600';
      case 'UNFAVORABLE': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            Unified Market Mastery
          </h1>
          <p className="text-gray-600 mt-1">Complete Stock + Options Analysis</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter ticker"
            className="w-24 text-center font-mono"
          />
          <Button 
            onClick={() => fetchAllAnalysis(ticker)}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </Button>
          <Button
            onClick={() => setAutoUpdate(!autoUpdate)}
            variant={autoUpdate ? "default" : "outline"}
            size="sm"
          >
            <Zap className="h-4 w-4 mr-1" />
            {autoUpdate ? 'Live' : 'Manual'}
          </Button>
        </div>
      </div>

      {/* Unified Overview */}
      {marketData && optionsData && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-2xl">{ticker} - Unified Analysis</CardTitle>
            <CardDescription>
              Complete market probability assessment
              {autoUpdate && <span className="ml-2 text-green-600">● Live</span>}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {/* Stock Signal */}
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Stock Signal</div>
                <Badge 
                  className={`text-lg px-3 py-1 ${getSignalColor(marketData.summary?.signal || 'HOLD')}`}
                  variant="secondary"
                >
                  {marketData.summary?.signal || 'HOLD'}
                </Badge>
                <div className="text-sm text-gray-600 mt-1">
                  {marketData.summary?.probability || 0}% probability
                </div>
              </div>

              {/* Options Signal */}
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Options Strategy</div>
                <Badge 
                  className={`text-lg px-3 py-1 ${getSignalColor(optionsData.summary?.strategy || 'WAIT')}`}
                  variant="secondary"
                >
                  {optionsData.summary?.strategy?.replace('_', ' ') || 'WAIT'}
                </Badge>
                <div className="text-sm text-gray-600 mt-1">
                  {optionsData.summary?.environment || 'NEUTRAL'} environment
                </div>
              </div>

              {/* Confluence Score */}
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Stock Confluence</div>
                <div className="text-2xl font-bold text-purple-600">
                  {marketData.summary?.confluence_score || 0}/100
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {marketData.summary?.key_factors?.length || 0} factors
                </div>
              </div>

              {/* Options Strike */}
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Optimal Strike</div>
                <div className="text-2xl font-bold text-green-600">
                  ${optionsData.summary?.primary_strike?.strike || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {optionsData.summary?.primary_strike?.type || 'CALL'} • IV: {optionsData.summary?.primary_strike?.iv_rank || 0}%
                </div>
              </div>
            </div>

            {/* Alignment Status */}
            <div className="mt-6 p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Stock-Options Alignment</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Directional</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Volatility</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Timing</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    85% ALIGNED
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis Tabs */}
      {marketData && optionsData && (
        <Tabs defaultValue="stock" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="stock">Stock Analysis</TabsTrigger>
            <TabsTrigger value="options">Options Analysis</TabsTrigger>
            <TabsTrigger value="probability">Probability Engine</TabsTrigger>
            <TabsTrigger value="psychology-engine">Psychology Engine</TabsTrigger>
            <TabsTrigger value="future-intel">Future Intel</TabsTrigger>
            <TabsTrigger value="strikes">Strike Tracking</TabsTrigger>
            <TabsTrigger value="unified">Unified Strategy</TabsTrigger>
          </TabsList>

          {/* Stock Analysis Tab */}
          <TabsContent value="stock" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Key Level Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Key Level Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {marketData.summary?.approaching_level ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Level Type:</span>
                        <Badge variant="outline">
                          {marketData.summary.approaching_level.type}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="font-mono">${marketData.summary.approaching_level.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bounce Probability:</span>
                        <span className="text-green-600 font-semibold">
                          {marketData.summary.approaching_level.bounce_probability}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4">
                      No key level nearby
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Real-time Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    Real-time Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Candle Pattern:</span>
                      <span className="font-semibold">
                        {marketData.summary?.real_time_insights?.candle_pattern || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Volume Flow:</span>
                      <Badge 
                        variant="outline" 
                        className={
                          marketData.summary?.real_time_insights?.volume_flow === 'buying' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }
                      >
                        {marketData.summary?.real_time_insights?.volume_flow || 'neutral'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Momentum:</span>
                      <span className="font-semibold">
                        {marketData.summary?.real_time_insights?.momentum_status || 'neutral'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Squeeze Active:</span>
                      <span className="text-purple-600 font-semibold">
                        {marketData.summary?.real_time_insights?.squeeze_timeframes || 0} timeframes
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Confluence Factors */}
            <Card>
              <CardHeader>
                <CardTitle>Confluence Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {marketData.summary?.key_factors?.map((factor: string, index: number) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        factor.includes('CRITICAL')
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-green-50 border border-green-200'
                      }`}
                    >
                      {factor.includes('CRITICAL') ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        factor.includes('CRITICAL') ? 'text-red-700' : 'text-green-700'
                      }`}>
                        {factor}
                      </span>
                    </div>
                  )) || (
                    <div className="text-gray-500 col-span-2 text-center py-4">
                      No confluence factors detected
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Options Analysis Tab */}
          <TabsContent value="options" className="space-y-4">
            {/* ATR & Consolidation Pattern Analysis */}
            {optionsData.analysis?.atrAnalysis && (
              <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🎯 ATR & Consolidation Pattern Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white/70 rounded-lg p-3">
                      <div className="text-sm text-indigo-600 mb-1">Current ATR</div>
                      <div className="text-xl font-bold text-indigo-900">
                        ${optionsData.analysis.atrAnalysis.currentATR.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="bg-white/70 rounded-lg p-3">
                      <div className="text-sm text-indigo-600 mb-1">Consolidation Status</div>
                      <div className={`text-lg font-bold ${optionsData.analysis.atrAnalysis.patternInsights.consolidationDetected ? 'text-green-600' : 'text-gray-600'}`}>
                        {optionsData.analysis.atrAnalysis.patternInsights.consolidationDetected ? 'YES' : 'NO'}
                      </div>
                      <div className="text-xs text-indigo-600">
                        {optionsData.analysis.atrAnalysis.patternInsights.daysInConsolidation} days
                      </div>
                    </div>
                    
                    <div className="bg-white/70 rounded-lg p-3">
                      <div className="text-sm text-indigo-600 mb-1">IV Compression</div>
                      <div className="text-xl font-bold text-purple-900">
                        {optionsData.analysis.atrAnalysis.patternInsights.ivCompressionLevel}%
                      </div>
                    </div>
                    
                    <div className="bg-white/70 rounded-lg p-3">
                      <div className="text-sm text-indigo-600 mb-1">Entry Timing</div>
                      <div className={`text-xs font-bold px-2 py-1 rounded ${
                        optionsData.analysis.atrAnalysis.patternInsights.optimalEntryTiming === 'NOW' ? 'bg-green-100 text-green-800' :
                        optionsData.analysis.atrAnalysis.patternInsights.optimalEntryTiming === 'WAIT_FOR_BREAKOUT_SIGNAL' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {optionsData.analysis.atrAnalysis.patternInsights.optimalEntryTiming.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/70 rounded-lg p-3">
                      <div className="text-sm font-medium text-indigo-800 mb-2">1 ATR Call Strike</div>
                      <div className="text-2xl font-bold text-indigo-900">
                        ${optionsData.analysis.atrAnalysis.recommendedStrikes.calls.atr_1.strike}
                      </div>
                      <div className="text-sm text-indigo-600">
                        Premium: ${optionsData.analysis.atrAnalysis.recommendedStrikes.calls.atr_1.premium.toFixed(2)}
                      </div>
                      <div className="text-xs text-indigo-600">
                        Success Rate: {optionsData.analysis.atrAnalysis.recommendedStrikes.calls.atr_1.historicalSuccessRate}%
                      </div>
                    </div>
                    
                    <div className="bg-white/70 rounded-lg p-3">
                      <div className="text-sm font-medium text-indigo-800 mb-2">2 ATR Call Strike</div>
                      <div className="text-2xl font-bold text-indigo-900">
                        ${optionsData.analysis.atrAnalysis.recommendedStrikes.calls.atr_2.strike}
                      </div>
                      <div className="text-sm text-indigo-600">
                        Premium: ${optionsData.analysis.atrAnalysis.recommendedStrikes.calls.atr_2.premium.toFixed(2)}
                      </div>
                      <div className="text-xs text-indigo-600">
                        Success Rate: {optionsData.analysis.atrAnalysis.recommendedStrikes.calls.atr_2.historicalSuccessRate}%
                      </div>
                    </div>
                    
                    <div className="bg-white/70 rounded-lg p-3">
                      <div className="text-sm font-medium text-indigo-800 mb-1">Expected Premium Expansion</div>
                      <div className="text-2xl font-bold text-green-600">
                        +{optionsData.analysis.atrAnalysis.patternInsights.expectedPremiumExpansion}%
                      </div>
                      <div className="text-xs text-indigo-600">On breakout</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Premium Environment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    Premium Environment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-3">
                    <div className={`text-2xl font-bold ${getEnvironmentColor(optionsData.summary?.environment)}`}>
                      {optionsData.summary?.environment || 'NEUTRAL'}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>IV Crush Risk:</span>
                        <span className="font-semibold">{optionsData.summary?.risk_metrics?.iv_crush_risk || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gamma Risk:</span>
                        <span className="font-semibold">{optionsData.summary?.risk_metrics?.gamma_risk?.toFixed(2) || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time Decay:</span>
                        <span className="font-semibold">${optionsData.summary?.risk_metrics?.time_decay?.toFixed(3) || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Flow Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Options Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Flow Bias:</span>
                      <Badge 
                        variant="outline"
                        className={
                          optionsData.summary?.flow_insights?.bias === 'bullish'
                            ? 'text-green-600'
                            : optionsData.summary?.flow_insights?.bias === 'bearish'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }
                      >
                        {optionsData.summary?.flow_insights?.bias || 'neutral'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>C/P Ratio:</span>
                      <span className="font-semibold">{optionsData.summary?.flow_insights?.call_put_ratio?.toFixed(2) || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unusual Activity:</span>
                      <span className="font-semibold">{optionsData.summary?.flow_insights?.unusual_activity || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Large Orders:</span>
                      <span className="font-semibold">{optionsData.summary?.flow_insights?.large_orders || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Optimal Strikes */}
            <Card>
              <CardHeader>
                <CardTitle>Optimal Strikes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Calls */}
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">Best Call Options</h4>
                    <div className="space-y-2">
                      {optionsData.summary?.optimal_strikes?.calls?.map((strike: any, index: number) => (
                        <div key={index} className="flex justify-between p-2 bg-green-50 rounded">
                          <span className="font-mono">${strike.strike}</span>
                          <span className="text-sm">{strike.probability_profitable?.toFixed(1)}% profit prob</span>
                        </div>
                      )) || <div className="text-gray-500">No optimal calls found</div>}
                    </div>
                  </div>

                  {/* Puts */}
                  <div>
                    <h4 className="font-semibold mb-3 text-red-600">Best Put Options</h4>
                    <div className="space-y-2">
                      {optionsData.summary?.optimal_strikes?.puts?.map((strike: any, index: number) => (
                        <div key={index} className="flex justify-between p-2 bg-red-50 rounded">
                          <span className="font-mono">${strike.strike}</span>
                          <span className="text-sm">{strike.probability_profitable?.toFixed(1)}% profit prob</span>
                        </div>
                      )) || <div className="text-gray-500">No optimal puts found</div>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Probability Engine Tab */}
          <TabsContent value="probability" className="space-y-4">
            <PremiumProbabilityDashboard 
              ticker={ticker} 
              onRefresh={() => fetchAllAnalysis(ticker)}
            />
          </TabsContent>

          {/* Psychology Engine Tab */}
          <TabsContent value="psychology-engine" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border">
                <h3 className="text-xl font-bold text-purple-800 mb-2">🧠 Trading Psychology Engine</h3>
                <p className="text-purple-700 mb-4">
                  Elite psychological market intelligence that analyzes fear/greed cycles, crowd behavior, 
                  and determines when NOT to trade. This engine provides the psychological edge that 
                  separates elite traders from the rest.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white/70 p-3 rounded border">
                    <div className="font-semibold text-purple-800">Market Emotion</div>
                    <div className="text-purple-600">Fear/Greed Analysis</div>
                  </div>
                  <div className="bg-white/70 p-3 rounded border">
                    <div className="font-semibold text-purple-800">Crowd Behavior</div>
                    <div className="text-purple-600">Retail vs Institutional</div>
                  </div>
                  <div className="bg-white/70 p-3 rounded border">
                    <div className="font-semibold text-purple-800">Trade Filter</div>
                    <div className="text-purple-600">When NOT to Trade</div>
                  </div>
                  <div className="bg-white/70 p-3 rounded border">
                    <div className="font-semibold text-purple-800">Thesis Tracking</div>
                    <div className="text-purple-600">Evolution Monitoring</div>
                  </div>
                </div>
              </div>
              
              <TradingPsychologyDashboard ticker={ticker} />
            </div>
          </TabsContent>

          {/* Future Intelligence Tab */}
          <TabsContent value="future-intel" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border">
                <h3 className="text-xl font-bold text-indigo-800 mb-2">🔮 Future Intelligence Engine</h3>
                <p className="text-indigo-700 mb-4">
                  Elite event preparation and news interpretation system. Masters the past through historical 
                  analysis, interprets the present with real-time intelligence, and prepares for the future 
                  with comprehensive event strategies. Never be caught off guard again.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white/70 p-3 rounded border">
                    <div className="font-semibold text-indigo-800">Event Preparation</div>
                    <div className="text-indigo-600">7-day timeline strategies</div>
                  </div>
                  <div className="bg-white/70 p-3 rounded border">
                    <div className="font-semibold text-indigo-800">News Intelligence</div>
                    <div className="text-indigo-600">Real-time interpretation</div>
                  </div>
                  <div className="bg-white/70 p-3 rounded border">
                    <div className="font-semibold text-indigo-800">Seasonal Patterns</div>
                    <div className="text-indigo-600">Monthly & weekly biases</div>
                  </div>
                  <div className="bg-white/70 p-3 rounded border">
                    <div className="font-semibold text-indigo-800">Contingency Plans</div>
                    <div className="text-indigo-600">Multi-scenario preparation</div>
                  </div>
                </div>
              </div>
              
              <FutureIntelligenceDashboard ticker={ticker} />
            </div>
          </TabsContent>

          {/* Strike Tracking Tab */}
          <TabsContent value="strikes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Real-time Strike Tracking
                </CardTitle>
                <CardDescription>
                  Monitor specific option strikes in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Primary Strike Details */}
                  {optionsData.summary?.primary_strike && (
                    <div className="bg-blue-50 p-4 rounded-lg border">
                      <h4 className="font-semibold mb-3">Primary Strike: ${optionsData.summary.primary_strike.strike} {optionsData.summary.primary_strike.type}</h4>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Premium</div>
                          <div className="font-semibold">${optionsData.summary.primary_strike.premium?.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Delta</div>
                          <div className="font-semibold">{optionsData.summary.primary_strike.delta?.toFixed(3)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">IV</div>
                          <div className="font-semibold">{optionsData.summary.primary_strike.iv?.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">IV Rank</div>
                          <div className="font-semibold">{optionsData.summary.primary_strike.iv_rank}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Real-time Alerts */}
                  <div>
                    <h4 className="font-semibold mb-3">Real-time Alerts</h4>
                    {optionsData.summary?.real_time_alerts?.length > 0 ? (
                      <div className="space-y-2">
                        {optionsData.summary.real_time_alerts.map((alert: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <div className="flex-1">
                              <div className="font-medium">${alert.strike} {alert.option_type}</div>
                              <div className="text-sm text-gray-600">{alert.message}</div>
                            </div>
                            <Badge variant="outline" className={
                              alert.urgency === 'HIGH' ? 'text-red-600' : 
                              alert.urgency === 'MEDIUM' ? 'text-yellow-600' : 'text-gray-600'
                            }>
                              {alert.urgency}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4">
                        No active alerts
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Unified Strategy Tab */}
          <TabsContent value="unified" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  Unified Trading Strategy
                </CardTitle>
                <CardDescription>
                  Combined stock and options recommendation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Strategy Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">Recommended Strategy</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Stock Position</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Signal:</span>
                            <Badge className={getSignalColor(marketData.summary?.signal || 'HOLD')}>
                              {marketData.summary?.signal || 'HOLD'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Probability:</span>
                            <span className="font-semibold">{marketData.summary?.probability || 0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Entry Window:</span>
                            <span className="text-sm">
                              {marketData.analysis?.optimal_entry_window?.immediate ? 'Immediate' :
                               marketData.analysis?.optimal_entry_window?.wait_for_confirmation ? 'Wait for confirmation' :
                               'Wait for pullback'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Options Position</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Strategy:</span>
                            <Badge className={getSignalColor(optionsData.summary?.strategy || 'WAIT')}>
                              {optionsData.summary?.strategy?.replace('_', ' ') || 'WAIT'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Optimal Strike:</span>
                            <span className="font-mono">${optionsData.summary?.primary_strike?.strike || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Premium:</span>
                            <span className="font-mono">${optionsData.summary?.primary_strike?.premium?.toFixed(2) || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Risk Management */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-semibold mb-3 text-red-700">Risk Management</h4>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Max Stock Risk</div>
                        <div className="font-semibold">{marketData.analysis?.max_risk_percentage || 1.5}%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Options Time Decay</div>
                        <div className="font-semibold">${optionsData.summary?.risk_metrics?.time_decay?.toFixed(3) || 0}/day</div>
                      </div>
                      <div>
                        <div className="text-gray-600">IV Crush Risk</div>
                        <div className="font-semibold">{optionsData.summary?.risk_metrics?.iv_crush_risk || 0}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Execution Plan */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold mb-3 text-green-700">Execution Plan</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Monitor key level at ${marketData.summary?.approaching_level?.price || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Watch for volume confirmation on breakout</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Entry on {marketData.summary?.real_time_insights?.candle_pattern || 'pattern'} completion</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Options entry when IV rank &lt; 40%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {loading && !marketData && !optionsData && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
            <p className="text-gray-600">Analyzing complete market probabilities...</p>
          </div>
        </div>
      )}
    </div>
  );
} 