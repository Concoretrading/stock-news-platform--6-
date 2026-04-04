'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap, 
  BarChart3, 
  Activity,
  Brain,
  Eye,
  Timer,
  AlertTriangle,
  CheckCircle,
  Circle
} from 'lucide-react';

interface MarketMasteryData {
  success: boolean;
  ticker: string;
  timestamp: string;
  analysis: any;
  summary: {
    signal: 'BUY' | 'SELL' | 'HOLD' | 'REDUCE';
    probability: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    confluence_score: number;
    key_factors: string[];
    approaching_level: {
      type: string;
      price: number;
      bounce_probability: number;
    } | null;
    real_time_insights: {
      candle_pattern: string;
      pattern_reliability: number;
      volume_flow: 'buying' | 'selling' | 'neutral';
      momentum_status: 'bullish' | 'bearish' | 'neutral';
      squeeze_timeframes: number;
    };
  };
}

export default function MarketMasteryDashboard() {
  const [ticker, setTicker] = useState('AAPL');
  const [data, setData] = useState<MarketMasteryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchAnalysis = async (symbol: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/market-mastery?ticker=${symbol}`);
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching market mastery analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(ticker);
  }, [ticker]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoUpdate && ticker) {
      interval = setInterval(() => {
        fetchAnalysis(ticker);
      }, 5000); // Update every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoUpdate, ticker]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-green-600 bg-green-100';
      case 'SELL': return 'text-red-600 bg-red-100';
      case 'HOLD': return 'text-yellow-600 bg-yellow-100';
      case 'REDUCE': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            Market Mastery Engine
          </h1>
          <p className="text-gray-600 mt-1">Real-time Probability-Based Trading Analysis</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Enter ticker"
              className="w-24 text-center font-mono"
            />
            <Button 
              onClick={() => fetchAnalysis(ticker)}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
          
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

      {data && (
        <>
          {/* Main Signal Card */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{data.ticker} Analysis</CardTitle>
                  <CardDescription>
                    Last updated: {lastUpdate?.toLocaleTimeString()}
                    {autoUpdate && <span className="ml-2 text-green-600">● Live</span>}
                  </CardDescription>
                </div>
                
                <div className="text-right">
                  <Badge 
                    className={`text-lg px-4 py-2 ${getSignalColor(data.summary.signal)}`}
                    variant="secondary"
                  >
                    {data.summary.signal}
                  </Badge>
                  <div className="text-sm text-gray-600 mt-1">
                    {data.summary.probability}% probability
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Overall Probability */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Overall Probability</span>
                  </div>
                  <div className={`text-3xl font-bold ${getProbabilityColor(data.summary.probability)}`}>
                    {data.summary.probability}%
                  </div>
                  <div className={`text-sm ${getConfidenceColor(data.summary.confidence)}`}>
                    {data.summary.confidence} Confidence
                  </div>
                  <Progress value={data.summary.probability} className="mt-2" />
                </div>

                {/* Confluence Score */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold">Confluence Score</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {data.summary.confluence_score}/100
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.summary.key_factors.length} factors aligned
                  </div>
                  <Progress value={data.summary.confluence_score} className="mt-2" />
                </div>

                {/* Key Level Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Key Level</span>
                  </div>
                  {data.summary.approaching_level ? (
                    <>
                      <div className="text-2xl font-bold text-green-600">
                        ${data.summary.approaching_level.price}
                      </div>
                      <div className="text-sm text-gray-600">
                        {data.summary.approaching_level.type} • {data.summary.approaching_level.bounce_probability}% bounce rate
                      </div>
                    </>
                  ) : (
                    <div className="text-lg text-gray-400">No level nearby</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Insights Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Candle Pattern */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Circle className="h-4 w-4 text-orange-600" />
                  Candle Pattern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-orange-600">
                  {data.summary.real_time_insights.candle_pattern}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {data.summary.real_time_insights.pattern_reliability}% reliable
                </div>
                <Progress value={data.summary.real_time_insights.pattern_reliability} className="mt-2" />
              </CardContent>
            </Card>

            {/* Volume Flow */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  Volume Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {data.summary.real_time_insights.volume_flow === 'buying' ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : data.summary.real_time_insights.volume_flow === 'selling' ? (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-600" />
                  )}
                  <span className="text-lg font-semibold capitalize">
                    {data.summary.real_time_insights.volume_flow}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Institutional flow direction
                </div>
              </CardContent>
            </Card>

            {/* Momentum Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  Momentum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {data.summary.real_time_insights.momentum_status === 'bullish' ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : data.summary.real_time_insights.momentum_status === 'bearish' ? (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-600" />
                  )}
                  <span className="text-lg font-semibold capitalize">
                    {data.summary.real_time_insights.momentum_status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Multi-timeframe alignment
                </div>
              </CardContent>
            </Card>

            {/* Squeeze Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Timer className="h-4 w-4 text-purple-600" />
                  Squeeze Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-purple-600">
                  {data.summary.real_time_insights.squeeze_timeframes} Active
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Timeframes in squeeze
                </div>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-2 w-4 rounded ${
                        i <= data.summary.real_time_insights.squeeze_timeframes
                          ? 'bg-purple-600'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Confluence Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Confluence Factors ({data.summary.key_factors.length})
              </CardTitle>
              <CardDescription>
                Multiple probability factors aligning for higher confidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {data.summary.key_factors.map((factor, index) => (
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
                ))}
              </div>
              
              {data.summary.key_factors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No confluence factors detected</p>
                  <p className="text-sm">Wait for multiple signals to align</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Panel */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-700">Recommended Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Entry Strategy</h4>
                  {data.analysis?.optimal_entry_window?.immediate ? (
                    <Badge variant="default" className="bg-green-600">
                      IMMEDIATE ENTRY
                    </Badge>
                  ) : data.analysis?.optimal_entry_window?.wait_for_confirmation ? (
                    <Badge variant="secondary" className="bg-yellow-600">
                      WAIT FOR CONFIRMATION
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      WAIT FOR PULLBACK
                    </Badge>
                  )}
                  <p className="text-sm text-gray-600 mt-2">
                    Estimated window: {data.analysis?.optimal_entry_window?.estimated_time_minutes || 0} minutes
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Risk Management</h4>
                  <div className="space-y-1 text-sm">
                    <div>Max Risk: {data.analysis?.max_risk_percentage || 1.5}%</div>
                    <div>R:R Ratio: {data.analysis?.risk_reward_ratio || 3.0}:1</div>
                    <div>Target Prob: {data.analysis?.target_probability || data.summary.probability}%</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Market Context</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Overall favorable for this setup</div>
                    <div>Monitor key level closely</div>
                    <div>Watch for volume confirmation</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
            <p className="text-gray-600">Analyzing market probabilities...</p>
          </div>
        </div>
      )}
    </div>
  );
} 