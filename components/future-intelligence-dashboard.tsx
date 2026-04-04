'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Calendar, TrendingUp, Clock, Eye, Zap, Target, Shield } from 'lucide-react';

interface UpcomingEvent {
  date: string;
  time?: string;
  event_type: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affected_assets: string[];
  historical_impact: {
    average_move: number;
    direction_bias: string;
    volatility_expansion: number;
    duration_of_impact: string;
  };
  preparation_requirements: {
    position_adjustments: string[];
    hedge_recommendations: string[];
    liquidity_considerations: string[];
    timing_considerations: string[];
  };
}

interface NewsAnalysis {
  headline: string;
  timestamp: string;
  news_type: string;
  sentiment: string;
  credibility_score: number;
  market_impact_score: number;
  affected_sectors: string[];
  immediate_actions: {
    position_adjustments: string[];
    new_opportunities: string[];
    risk_changes: string[];
  };
  historical_context: {
    similar_events: string[];
    typical_market_reaction: string;
    fade_or_follow: string;
  };
}

interface FutureIntelligence {
  upcoming_events: UpcomingEvent[];
  news_analysis: NewsAnalysis[];
  preparation_strategies: any[];
  seasonal_intelligence: any;
  elite_recommendations: string[];
}

interface FutureIntelligenceDashboardProps {
  ticker?: string;
}

export default function FutureIntelligenceDashboard({ ticker = 'AAPL' }: FutureIntelligenceDashboardProps) {
  const [intelligence, setIntelligence] = useState<FutureIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFutureIntelligence = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/future-intelligence?ticker=${ticker}`);
      const data = await response.json();
      
      if (data.success) {
        setIntelligence(data.future_intelligence);
      } else {
        setError(data.error || 'Failed to fetch analysis');
      }
    } catch (err) {
      setError('Failed to fetch future intelligence');
      console.error('Future intelligence error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFutureIntelligence();
    // Refresh every 15 minutes for latest intelligence
    const interval = setInterval(fetchFutureIntelligence, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [ticker]);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'CRITICAL': return 'bg-red-600';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'very_bullish': return 'text-green-700 bg-green-100';
      case 'bullish': return 'text-green-600 bg-green-50';
      case 'neutral': return 'text-gray-600 bg-gray-100';
      case 'bearish': return 'text-red-600 bg-red-50';
      case 'very_bearish': return 'text-red-700 bg-red-100';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'earnings': return <TrendingUp className="h-4 w-4" />;
      case 'fed_meeting': return <Target className="h-4 w-4" />;
      case 'economic_data': return <Eye className="h-4 w-4" />;
      case 'option_expiry': return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Future Intelligence Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Analyzing future market intelligence...</p>
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
            <Calendar className="h-5 w-5" />
            Future Intelligence Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <Button onClick={fetchFutureIntelligence} className="mt-4">
              Retry Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!intelligence) return null;

  return (
    <div className="space-y-6">
      {/* Elite Recommendations Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Elite Intelligence Summary for {ticker}
          </CardTitle>
          <CardDescription>
            Advanced event preparation and news interpretation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Critical Events Count */}
            <div className="p-4 rounded-lg border bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-red-800">Critical Events</h3>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-700">
                {intelligence.upcoming_events.filter(e => e.importance === 'CRITICAL').length}
              </p>
              <p className="text-sm text-red-600">Requiring immediate preparation</p>
            </div>

            {/* High Impact Events */}
            <div className="p-4 rounded-lg border bg-gradient-to-r from-orange-50 to-yellow-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-orange-800">High Impact</h3>
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-700">
                {intelligence.upcoming_events.filter(e => e.importance === 'HIGH').length}
              </p>
              <p className="text-sm text-orange-600">Events to monitor closely</p>
            </div>

            {/* News Sentiment */}
            <div className="p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-800">News Sentiment</h3>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-blue-700 capitalize">
                {intelligence.news_analysis.length > 0 ? 
                  intelligence.news_analysis[0].sentiment.replace('_', ' ') : 'Neutral'}
              </p>
              <p className="text-sm text-blue-600">Current market bias</p>
            </div>

            {/* Preparation Status */}
            <div className="p-4 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-green-800">Preparation</h3>
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-lg font-bold text-green-700">
                {intelligence.preparation_strategies.length > 0 ? 'Required' : 'Current'}
              </p>
              <p className="text-sm text-green-600">Position adjustments needed</p>
            </div>
          </div>

          {/* Elite Recommendations */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3 text-gray-800">🎯 Elite Recommendations</h3>
            <div className="space-y-2">
              {intelligence.elite_recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded">
                  <Zap className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-purple-800">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Upcoming Events</TabsTrigger>
          <TabsTrigger value="news">News Analysis</TabsTrigger>
          <TabsTrigger value="preparation">Preparation</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Intel</TabsTrigger>
        </TabsList>

        {/* Upcoming Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="grid gap-4">
            {intelligence.upcoming_events.map((event, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.event_type)}
                      <span className="capitalize">{event.event_type.replace('_', ' ')}</span>
                    </div>
                    <Badge className={`${getImportanceColor(event.importance)} text-white`}>
                      {event.importance}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {new Date(event.date).toLocaleDateString()} {event.time && `at ${event.time}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Historical Impact */}
                    <div>
                      <h4 className="font-semibold mb-3">Historical Impact</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Average Move:</span>
                          <span className="font-medium">{(event.historical_impact.average_move * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Direction Bias:</span>
                          <Badge variant="outline" className="capitalize">
                            {event.historical_impact.direction_bias}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Volatility Expansion:</span>
                          <span className="font-medium">{(event.historical_impact.volatility_expansion * 100 - 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Impact Duration:</span>
                          <span className="font-medium capitalize">{event.historical_impact.duration_of_impact}</span>
                        </div>
                      </div>
                    </div>

                    {/* Preparation Requirements */}
                    <div>
                      <h4 className="font-semibold mb-3">Preparation Strategy</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Position Adjustments:</p>
                          <ul className="text-sm space-y-1">
                            {event.preparation_requirements.position_adjustments.slice(0, 2).map((adj, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                {adj}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Hedge Recommendations:</p>
                          <ul className="text-sm space-y-1">
                            {event.preparation_requirements.hedge_recommendations.slice(0, 2).map((hedge, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1">•</span>
                                {hedge}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Affected Assets */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Affected Assets:</p>
                    <div className="flex flex-wrap gap-2">
                      {event.affected_assets.map((asset, i) => (
                        <Badge key={i} variant="outline">{asset}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* News Analysis Tab */}
        <TabsContent value="news" className="space-y-4">
          <div className="grid gap-4">
            {intelligence.news_analysis.map((news, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">{news.headline}</CardTitle>
                  <CardDescription>
                    {new Date(news.timestamp).toLocaleString()} • {news.news_type.toUpperCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sentiment & Scores */}
                    <div>
                      <h4 className="font-semibold mb-3">Analysis Scores</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Sentiment</span>
                            <Badge className={getSentimentColor(news.sentiment)}>
                              {news.sentiment.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Credibility</span>
                            <span className="font-medium">{news.credibility_score}%</span>
                          </div>
                          <Progress value={news.credibility_score} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Market Impact</span>
                            <span className="font-medium">{news.market_impact_score}%</span>
                          </div>
                          <Progress value={news.market_impact_score} className="h-2" />
                        </div>
                      </div>
                    </div>

                    {/* Immediate Actions */}
                    <div>
                      <h4 className="font-semibold mb-3">Immediate Actions</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-green-700 mb-1">Opportunities:</p>
                          <ul className="text-sm space-y-1">
                            {news.immediate_actions.new_opportunities.slice(0, 2).map((opp, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
                                {opp}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-1">Position Adjustments:</p>
                          <ul className="text-sm space-y-1">
                            {news.immediate_actions.position_adjustments.slice(0, 2).map((adj, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                {adj}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Historical Context */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-2">Historical Context</h4>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Typical Reaction:</strong> {news.historical_context.typical_market_reaction}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Strategy:</strong> <Badge variant="outline" className="capitalize">
                          {news.historical_context.fade_or_follow}
                        </Badge> the initial move
                      </p>
                    </div>
                  </div>

                  {/* Affected Sectors */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Affected Sectors:</p>
                    <div className="flex flex-wrap gap-2">
                      {news.affected_sectors.map((sector, i) => (
                        <Badge key={i} variant="outline">{sector}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Preparation Tab */}
        <TabsContent value="preparation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Position Preparation Strategy</CardTitle>
              <CardDescription>
                Timeline and actions for upcoming events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {intelligence.preparation_strategies.length > 0 ? (
                <div className="space-y-6">
                  {intelligence.preparation_strategies.map((strategy, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4 text-lg">
                        {strategy.event.event_type.replace('_', ' ').toUpperCase()} Preparation
                      </h3>
                      
                      {/* Timeline */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {Object.entries(strategy.preparation_timeline.days_before).map(([timeframe, actions]) => (
                          <div key={timeframe} className="p-3 border rounded">
                            <h4 className="font-medium mb-2 text-center capitalize">
                              {timeframe.replace('_', ' ')}
                            </h4>
                            <ul className="text-sm space-y-1">
                              {(actions as string[]).slice(0, 2).map((action, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {/* Contingency Plans */}
                      <div>
                        <h4 className="font-semibold mb-3">Contingency Plans</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(strategy.contingency_plans).map(([scenario, actions]) => (
                            <div key={scenario} className="p-3 bg-gray-50 rounded">
                              <h5 className="font-medium mb-2 capitalize text-center">
                                {scenario.replace('_', ' ')} Scenario
                              </h5>
                              <ul className="text-sm space-y-1">
                                {(actions as string[]).slice(0, 2).map((action, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">•</span>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No immediate preparation required</p>
                  <p className="text-sm text-gray-500">Clear path ahead for current positions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seasonal Intelligence Tab */}
        <TabsContent value="seasonal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Market Intelligence</CardTitle>
              <CardDescription>
                Current period: {intelligence.seasonal_intelligence.current_period}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Patterns */}
                <div>
                  <h4 className="font-semibold mb-3">Monthly Patterns</h4>
                  <div className="space-y-3">
                    {intelligence.seasonal_intelligence.seasonal_biases.monthly_patterns.map((pattern: any, index: number) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{pattern.month}</span>
                          <span className={`text-sm font-medium ${pattern.typical_performance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(pattern.typical_performance * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {pattern.key_factors.slice(0, 2).map((factor: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Seasonal Events */}
                <div>
                  <h4 className="font-semibold mb-3">Upcoming Seasonal Events</h4>
                  <div className="space-y-3">
                    {intelligence.seasonal_intelligence.upcoming_seasonal_events.map((event: any, index: number) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-blue-800">{event.event}</span>
                          <span className="text-sm text-blue-600">{event.date}</span>
                        </div>
                        <p className="text-sm text-blue-700 mb-2">{event.historical_impact}</p>
                        <p className="text-xs text-blue-600">{event.preparation_strategy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchFutureIntelligence} disabled={loading}>
          {loading ? 'Analyzing...' : 'Refresh Intelligence'}
        </Button>
      </div>
    </div>
  );
} 