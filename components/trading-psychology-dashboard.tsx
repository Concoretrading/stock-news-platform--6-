'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Brain, TrendingUp, TrendingDown, Eye, Clock, DollarSign } from 'lucide-react';

interface PsychologyAnalysis {
  market_emotional_state: {
    primary_emotion: string;
    intensity_level: number;
    duration_days: number;
    historical_context: string;
    regime_shift_probability: number;
  };
  crowd_behavior: {
    retail_sentiment: {
      bullish_percentage: number;
      put_call_ratio: number;
      social_media_sentiment: string;
      retail_flow: string;
      capitulation_signals: string[];
    };
    institutional_behavior: {
      smart_money_flow: string;
      dark_pool_activity: string;
      insider_activity: string;
      hedge_fund_positioning: string;
    };
    divergence_score: number;
  };
  market_regime: {
    current_regime: string;
    regime_confidence: number;
    regime_age_days: number;
    transition_probability: {
      to_bull: number;
      to_bear: number;
      to_sideways: number;
    };
    supporting_factors: string[];
    contradicting_factors: string[];
  };
  trading_environment: {
    overall_rating: string;
    score: number;
    factors: {
      volatility_environment: string;
      trend_clarity: string;
      volume_quality: string;
      correlation_breakdown: boolean;
      sector_rotation_health: string;
    };
    reasoning: string[];
  };
  trade_filter: {
    should_trade: boolean;
    confidence_level: number;
    primary_concerns: string[];
    recommended_action: string;
    time_horizon_adjustment: string;
    position_sizing_modifier: number;
  };
  key_insights: string[];
  actionable_intelligence: string[];
}

interface TradingPsychologyDashboardProps {
  ticker?: string;
}

export default function TradingPsychologyDashboard({ ticker = 'SPY' }: TradingPsychologyDashboardProps) {
  const [analysis, setAnalysis] = useState<PsychologyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPsychologyAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/trading-psychology?ticker=${ticker}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Failed to fetch analysis');
      }
    } catch (err) {
      setError('Failed to fetch psychology analysis');
      console.error('Psychology analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPsychologyAnalysis();
    // Refresh every 5 minutes
    const interval = setInterval(fetchPsychologyAnalysis, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [ticker]);

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'fear': return 'text-red-600';
      case 'panic': return 'text-red-800';
      case 'greed': return 'text-green-600';
      case 'euphoria': return 'text-green-800';
      case 'complacency': return 'text-yellow-600';
      case 'uncertainty': return 'text-gray-600';
      default: return 'text-gray-500';
    }
  };

  const getEnvironmentColor = (rating: string) => {
    switch (rating) {
      case 'PRIME': return 'bg-green-600';
      case 'EXCELLENT': return 'bg-green-500';
      case 'GOOD': return 'bg-blue-500';
      case 'POOR': return 'bg-yellow-500';
      case 'AVOID': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'aggressive': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'normal': return <Eye className="h-4 w-4 text-blue-600" />;
      case 'defensive': return <TrendingDown className="h-4 w-4 text-yellow-600" />;
      case 'cash': return <DollarSign className="h-4 w-4 text-gray-600" />;
      case 'hedge': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Trading Psychology Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Analyzing market psychology...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Trading Psychology Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <Button onClick={fetchPsychologyAnalysis} className="mt-4">
              Retry Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Main Psychology Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Trading Psychology Analysis for {ticker}
          </CardTitle>
          <CardDescription>
            Elite psychological market intelligence and trade filtering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Should Trade Decision */}
            <div className={`p-4 rounded-lg border-2 ${analysis.trade_filter.should_trade ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Trade Decision</h3>
                {analysis.trade_filter.should_trade ? 
                  <TrendingUp className="h-5 w-5 text-green-600" /> : 
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                }
              </div>
              <p className={`text-lg font-bold ${analysis.trade_filter.should_trade ? 'text-green-700' : 'text-red-700'}`}>
                {analysis.trade_filter.should_trade ? '✅ TRADE' : '🛑 AVOID'}
              </p>
              <p className="text-sm text-gray-600">
                Confidence: {analysis.trade_filter.confidence_level}%
              </p>
            </div>

            {/* Market Emotion */}
            <div className="p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Market Emotion</h3>
              <p className={`text-lg font-bold capitalize ${getEmotionColor(analysis.market_emotional_state.primary_emotion)}`}>
                {analysis.market_emotional_state.primary_emotion}
              </p>
              <Progress 
                value={analysis.market_emotional_state.intensity_level} 
                className="mt-2"
              />
              <p className="text-sm text-gray-600 mt-1">
                Intensity: {analysis.market_emotional_state.intensity_level}%
              </p>
            </div>

            {/* Trading Environment */}
            <div className="p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Environment Quality</h3>
              <Badge className={`${getEnvironmentColor(analysis.trading_environment.overall_rating)} text-white`}>
                {analysis.trading_environment.overall_rating}
              </Badge>
              <Progress 
                value={analysis.trading_environment.score} 
                className="mt-2"
              />
              <p className="text-sm text-gray-600 mt-1">
                Score: {analysis.trading_environment.score}/100
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="crowd">Crowd Behavior</TabsTrigger>
          <TabsTrigger value="regime">Market Regime</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recommended Action */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getActionIcon(analysis.trade_filter.recommended_action)}
                  Recommended Action
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-lg capitalize">
                      {analysis.trade_filter.recommended_action.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Position Size: {Math.round(analysis.trade_filter.position_sizing_modifier * 100)}% of normal
                    </p>
                  </div>
                  
                  {analysis.trade_filter.primary_concerns.length > 0 && (
                    <div>
                      <p className="font-medium text-red-600 mb-1">Primary Concerns:</p>
                      <ul className="text-sm space-y-1">
                        {analysis.trade_filter.primary_concerns.map((concern, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            {concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Time Horizon */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Horizon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold capitalize mb-2">
                  {analysis.trade_filter.time_horizon_adjustment.replace('_', ' ')}
                </p>
                <p className="text-sm text-gray-600">
                  Based on current market volatility and emotional state
                </p>
                {analysis.trade_filter.time_horizon_adjustment === 'shorten' && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      ⚠️ High volatility detected - consider shorter holding periods
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Crowd Behavior Tab */}
        <TabsContent value="crowd" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Retail Sentiment */}
            <Card>
              <CardHeader>
                <CardTitle>Retail Sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Bullish Percentage</p>
                    <Progress value={analysis.crowd_behavior.retail_sentiment.bullish_percentage} />
                    <p className="text-sm">{analysis.crowd_behavior.retail_sentiment.bullish_percentage}%</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Put/Call Ratio</p>
                    <p className="font-semibold">{analysis.crowd_behavior.retail_sentiment.put_call_ratio}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Social Media Sentiment</p>
                    <Badge variant="outline" className="capitalize">
                      {analysis.crowd_behavior.retail_sentiment.social_media_sentiment.replace('_', ' ')}
                    </Badge>
                  </div>

                  {analysis.crowd_behavior.retail_sentiment.capitulation_signals.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-600">Capitulation Signals:</p>
                      <ul className="text-sm space-y-1">
                        {analysis.crowd_behavior.retail_sentiment.capitulation_signals.map((signal, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="text-red-500">•</span>
                            {signal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Institutional Behavior */}
            <Card>
              <CardHeader>
                <CardTitle>Institutional Behavior</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Smart Money Flow</span>
                    <Badge className={analysis.crowd_behavior.institutional_behavior.smart_money_flow === 'accumulating' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {analysis.crowd_behavior.institutional_behavior.smart_money_flow}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dark Pool Activity</span>
                    <Badge variant="outline">
                      {analysis.crowd_behavior.institutional_behavior.dark_pool_activity}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Insider Activity</span>
                    <Badge className={analysis.crowd_behavior.institutional_behavior.insider_activity === 'buying' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {analysis.crowd_behavior.institutional_behavior.insider_activity}
                    </Badge>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-medium text-blue-800">
                      Retail/Institutional Divergence: {analysis.crowd_behavior.divergence_score}%
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {analysis.crowd_behavior.divergence_score > 70 ? 
                        'High divergence creates opportunity' : 
                        'Low divergence - follow the crowd'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Market Regime Tab */}
        <TabsContent value="regime" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Regime */}
            <Card>
              <CardHeader>
                <CardTitle>Market Regime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-lg capitalize">
                      {analysis.market_regime.current_regime.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Confidence: {analysis.market_regime.regime_confidence}%
                    </p>
                    <p className="text-sm text-gray-600">
                      Age: {analysis.market_regime.regime_age_days} days
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Transition Probabilities:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Bull Market</span>
                        <span className="text-sm font-medium">{analysis.market_regime.transition_probability.to_bull}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Bear Market</span>
                        <span className="text-sm font-medium">{analysis.market_regime.transition_probability.to_bear}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Sideways</span>
                        <span className="text-sm font-medium">{analysis.market_regime.transition_probability.to_sideways}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supporting/Contradicting Factors */}
            <Card>
              <CardHeader>
                <CardTitle>Regime Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-2">Supporting Factors:</p>
                    <ul className="text-sm space-y-1">
                      {analysis.market_regime.supporting_factors.map((factor, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-red-600 mb-2">Contradicting Factors:</p>
                    <ul className="text-sm space-y-1">
                      {analysis.market_regime.contradicting_factors.map((factor, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">✗</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Psychological Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.key_insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <Brain className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Actionable Intelligence */}
            <Card>
              <CardHeader>
                <CardTitle>Actionable Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.actionable_intelligence.map((intelligence, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{intelligence}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchPsychologyAnalysis} disabled={loading}>
          {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>
    </div>
  );
} 