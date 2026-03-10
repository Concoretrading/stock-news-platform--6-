'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, TrendingUp, Globe, AlertTriangle, Clock, Target } from 'lucide-react';

interface WorldIntelligenceData {
  symbol: string;
  timestamp: string;
  upcoming_events: {
    immediate: UpcomingEvent[];
    short_term: UpcomingEvent[];
    medium_term: UpcomingEvent[];
    preparation_status: PreparationStatus;
  };
  historical_intelligence: {
    similar_events: HistoricalEvent[];
    reaction_patterns: ReactionPattern[];
    market_lessons: MarketLesson[];
    predictive_insights: PredictiveInsight[];
  };
  world_context: {
    economic_environment: EconomicEnvironment;
    geopolitical_factors: GeopoliticalFactor[];
    market_relationships: MarketRelationship[];
    global_themes: GlobalTheme[];
  };
  live_intelligence: {
    breaking_news: BreakingNews[];
    market_reactions: MarketReaction[];
    sentiment_shifts: SentimentShift[];
    flow_changes: FlowChange[];
  };
  event_positioning: {
    pre_event_strategy: PreEventStrategy;
    during_event_strategy: DuringEventStrategy;
    post_event_strategy: PostEventStrategy;
    risk_management: EventRiskManagement;
  };
}

interface UpcomingEvent {
  event_id: string;
  event_type: string;
  title: string;
  date: string;
  time: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  expected_impact: {
    market_wide: number;
    sector_specific: number;
    individual_stock: number;
    volatility_increase: number;
  };
  historical_context: {
    similar_events_count: number;
    avg_move_magnitude: number;
    direction_bias: string;
    success_patterns: string[];
  };
}

interface PreparationStatus {
  events_tracked: number;
  preparation_score: number;
  risk_adjustments_made: string[];
  opportunities_identified: string[];
  hedge_coverage: number;
}

interface HistoricalEvent {
  event_id: string;
  date: string;
  event_description: string;
  pattern_significance: number;
  lessons_learned: string[];
}

interface ReactionPattern {
  pattern_type: string;
  occurrence_frequency: number;
  success_rate: number;
  conditions_required: string[];
}

interface MarketLesson {
  lesson_id: string;
  category: string;
  description: string;
  confidence_level: number;
  trading_edge: string;
}

interface PredictiveInsight {
  insight_type: string;
  prediction: string;
  probability: number;
  time_horizon: string;
  positioning_implications: string[];
}

interface EconomicEnvironment {
  cycle_stage: string;
  inflation_trend: string;
  employment_strength: number;
  consumer_health: number;
  fed_policy_stance: string;
  market_regime: string;
}

interface GeopoliticalFactor {
  factor_type: string;
  current_status: string;
  market_impact_potential: number;
  affected_sectors: string[];
}

interface MarketRelationship {
  relationship_type: string;
  strength: number;
  current_status: string;
  trading_implications: string[];
}

interface GlobalTheme {
  theme_name: string;
  strength: number;
  duration: string;
  key_drivers: string[];
  positioning_strategy: string;
}

interface BreakingNews {
  news_id: string;
  headline: string;
  source: string;
  timestamp: string;
  importance: number;
  market_relevance: number;
  immediate_impact: {
    affected_symbols: string[];
    direction: string;
    magnitude_estimate: number;
    confidence: number;
  };
}

interface MarketReaction {
  trigger: string;
  reaction_type: string;
  speed: string;
  magnitude: number;
  sustainability_indicators: string[];
}

interface SentimentShift {
  previous_sentiment: string;
  current_sentiment: string;
  shift_magnitude: number;
  key_drivers: string[];
  duration_estimate: string;
}

interface FlowChange {
  flow_type: string;
  direction: string;
  magnitude: number;
  institutional_vs_retail: string;
  implications: string[];
}

interface PreEventStrategy {
  positioning_approach: string;
  size_adjustments: string[];
  hedge_implementation: string[];
  opportunity_preparation: string[];
}

interface DuringEventStrategy {
  monitoring_priorities: string[];
  reaction_protocols: string[];
  quick_decision_framework: string[];
}

interface PostEventStrategy {
  assessment_criteria: string[];
  position_review_process: string[];
  lesson_capture_method: string[];
}

interface EventRiskManagement {
  max_event_exposure: number;
  hedge_requirements: string[];
  stop_loss_protocols: string[];
  position_sizing_rules: string[];
}

export default function WorldIntelligenceDashboard() {
  const [data, setData] = useState<WorldIntelligenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState('SPY');

  const fetchWorldIntelligence = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/world-intelligence?symbol=${symbol}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        console.error('Failed to fetch world intelligence:', result.error);
      }
    } catch (error) {
      console.error('Error fetching world intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorldIntelligence();
  }, [symbol]);

  const getImportanceBadgeColor = (importance: string) => {
    switch (importance) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Globe className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Connecting to world intelligence...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-yellow-500" />
          <p>Unable to load world intelligence data</p>
          <Button onClick={fetchWorldIntelligence} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8" />
            World Connected Intelligence
          </h2>
          <p className="text-muted-foreground">Always connected to global events that drive markets</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Last Updated: {new Date(data.timestamp).toLocaleTimeString()}
          </Badge>
          <Button onClick={fetchWorldIntelligence} size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Preparation Status Overview */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Preparation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Events Tracked</p>
              <p className="text-2xl font-bold">{data.upcoming_events.preparation_status.events_tracked}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Preparation Score</p>
              <div className="flex items-center gap-2">
                <Progress value={data.upcoming_events.preparation_status.preparation_score} className="flex-1" />
                <span className="text-sm font-bold">{data.upcoming_events.preparation_status.preparation_score}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Hedge Coverage</p>
              <div className="flex items-center gap-2">
                <Progress value={data.upcoming_events.preparation_status.hedge_coverage} className="flex-1" />
                <span className="text-sm font-bold">{data.upcoming_events.preparation_status.hedge_coverage}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Risk Adjustments</p>
              <p className="text-2xl font-bold">{data.upcoming_events.preparation_status.risk_adjustments_made.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="historical">Historical Learning</TabsTrigger>
          <TabsTrigger value="context">World Context</TabsTrigger>
          <TabsTrigger value="live">Live Intelligence</TabsTrigger>
          <TabsTrigger value="positioning">Event Positioning</TabsTrigger>
        </TabsList>

        {/* Upcoming Events */}
        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4">
            {/* Immediate Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Immediate Events (24-48 hours)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.upcoming_events.immediate.map((event) => (
                    <div key={event.event_id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.date)} at {event.time}
                          </p>
                        </div>
                        <Badge variant={getImportanceBadgeColor(event.importance)}>
                          {event.importance}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Market Impact</p>
                          <p className="font-bold">{event.expected_impact.market_wide}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Sector Impact</p>
                          <p className="font-bold">{event.expected_impact.sector_specific}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Volatility</p>
                          <p className="font-bold">{event.expected_impact.volatility_increase}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Historical Avg</p>
                          <p className="font-bold">{event.historical_context.avg_move_magnitude}%</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-1">Success Patterns:</p>
                        <div className="flex flex-wrap gap-1">
                          {event.historical_context.success_patterns.map((pattern, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Short Term Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Short Term Events (1-2 weeks)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.upcoming_events.short_term.map((event) => (
                    <div key={event.event_id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getImportanceBadgeColor(event.importance)} className="text-xs">
                          {event.importance}
                        </Badge>
                        <span className="text-sm font-bold">{event.expected_impact.market_wide}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Historical Learning */}
        <TabsContent value="historical" className="space-y-4">
          <div className="grid gap-4">
            {/* Market Lessons */}
            <Card>
              <CardHeader>
                <CardTitle>Key Market Lessons</CardTitle>
                <CardDescription>What we've learned from past events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.historical_intelligence.market_lessons.map((lesson) => (
                    <div key={lesson.lesson_id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{lesson.category}</h4>
                        <Badge variant="outline">{lesson.confidence_level}% Confidence</Badge>
                      </div>
                      <p className="text-sm mb-2">{lesson.description}</p>
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-sm font-medium text-blue-800">Trading Edge:</p>
                        <p className="text-sm text-blue-700">{lesson.trading_edge}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reaction Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Historical Reaction Patterns</CardTitle>
                <CardDescription>How markets typically react to similar events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.historical_intelligence.reaction_patterns.map((pattern, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{pattern.pattern_type}</h4>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Success Rate</p>
                          <p className="font-bold text-green-600">{Math.round(pattern.success_rate * 100)}%</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Occurred {pattern.occurrence_frequency} times in recent history
                      </p>
                      <div>
                        <p className="text-sm font-medium mb-1">Required Conditions:</p>
                        <div className="flex flex-wrap gap-1">
                          {pattern.conditions_required.map((condition, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Predictive Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Predictive Insights</CardTitle>
                <CardDescription>What we expect based on historical patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.historical_intelligence.predictive_insights.map((insight, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{insight.insight_type}</h4>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Probability</p>
                          <p className="font-bold text-blue-600">{insight.probability}%</p>
                        </div>
                      </div>
                      <p className="text-sm mb-2">{insight.prediction}</p>
                      <p className="text-xs text-muted-foreground mb-2">Timeline: {insight.time_horizon}</p>
                      <div>
                        <p className="text-sm font-medium mb-1">Positioning Implications:</p>
                        <div className="flex flex-wrap gap-1">
                          {insight.positioning_implications.map((implication, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {implication}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* World Context */}
        <TabsContent value="context" className="space-y-4">
          <div className="grid gap-4">
            {/* Economic Environment */}
            <Card>
              <CardHeader>
                <CardTitle>Economic Environment</CardTitle>
                <CardDescription>Current economic cycle and conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium">Cycle Stage</p>
                    <p className="font-bold">{data.world_context.economic_environment.cycle_stage}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Inflation Trend</p>
                    <p className="font-bold">{data.world_context.economic_environment.inflation_trend}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Employment</p>
                    <div className="flex items-center gap-2">
                      <Progress value={data.world_context.economic_environment.employment_strength} className="flex-1" />
                      <span className="text-sm font-bold">{data.world_context.economic_environment.employment_strength}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Consumer Health</p>
                    <div className="flex items-center gap-2">
                      <Progress value={data.world_context.economic_environment.consumer_health} className="flex-1" />
                      <span className="text-sm font-bold">{data.world_context.economic_environment.consumer_health}%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Fed Policy Stance</p>
                    <p className="text-sm">{data.world_context.economic_environment.fed_policy_stance}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Market Regime</p>
                    <p className="text-sm">{data.world_context.economic_environment.market_regime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Global Themes */}
            <Card>
              <CardHeader>
                <CardTitle>Global Investment Themes</CardTitle>
                <CardDescription>Major themes driving markets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.world_context.global_themes.map((theme, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{theme.theme_name}</h4>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Strength</p>
                          <p className="font-bold">{theme.strength}%</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Duration: {theme.duration}</p>
                      <div className="mb-2">
                        <p className="text-sm font-medium mb-1">Key Drivers:</p>
                        <div className="flex flex-wrap gap-1">
                          {theme.key_drivers.map((driver, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {driver}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-sm font-medium text-green-800">Strategy:</p>
                        <p className="text-sm text-green-700">{theme.positioning_strategy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Live Intelligence */}
        <TabsContent value="live" className="space-y-4">
          <div className="grid gap-4">
            {/* Breaking News */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-red-500" />
                  Breaking News & Market Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.live_intelligence.breaking_news.map((news) => (
                    <Alert key={news.news_id} className="border-red-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold">{news.headline}</p>
                            <p className="text-sm text-muted-foreground">
                              {news.source} • {new Date(news.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="destructive">
                              {news.importance}% Important
                            </Badge>
                            <Badge variant="secondary">
                              {news.market_relevance}% Relevant
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="font-medium">Direction</p>
                            <p>{news.immediate_impact.direction}</p>
                          </div>
                          <div>
                            <p className="font-medium">Magnitude</p>
                            <p>{news.immediate_impact.magnitude_estimate}%</p>
                          </div>
                          <div>
                            <p className="font-medium">Confidence</p>
                            <p>{news.immediate_impact.confidence}%</p>
                          </div>
                          <div>
                            <p className="font-medium">Affected</p>
                            <p>{news.immediate_impact.affected_symbols.join(', ')}</p>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Reactions */}
            <Card>
              <CardHeader>
                <CardTitle>Current Market Reactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.live_intelligence.market_reactions.map((reaction, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{reaction.trigger}</p>
                        <p className="text-sm text-muted-foreground">{reaction.reaction_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{reaction.magnitude}%</p>
                        <p className="text-sm text-muted-foreground">{reaction.speed}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sentiment & Flows */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Shifts</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.live_intelligence.sentiment_shifts.map((shift, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{shift.previous_sentiment}</span>
                        <span className="text-sm">→</span>
                        <span className="text-sm font-medium">{shift.current_sentiment}</span>
                      </div>
                      <Progress value={shift.shift_magnitude} />
                      <p className="text-xs text-muted-foreground">
                        Duration: {shift.duration_estimate}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Capital Flows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.live_intelligence.flow_changes.map((flow, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{flow.flow_type}</p>
                          <p className="text-sm text-muted-foreground">{flow.institutional_vs_retail}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${flow.direction === 'INFLOW' ? 'text-green-600' : 'text-red-600'}`}>
                            {flow.direction}
                          </p>
                          <p className="text-sm">{flow.magnitude}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Event Positioning */}
        <TabsContent value="positioning" className="space-y-4">
          <div className="grid gap-4">
            {/* Pre-Event Strategy */}
            <Card>
              <CardHeader>
                <CardTitle>Pre-Event Strategy</CardTitle>
                <CardDescription>How to position before major events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">Positioning Approach</p>
                    <p className="text-sm bg-blue-50 p-2 rounded">{data.event_positioning.pre_event_strategy.positioning_approach}</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium mb-2">Size Adjustments</p>
                      <div className="space-y-1">
                        {data.event_positioning.pre_event_strategy.size_adjustments.map((adjustment, index) => (
                          <Badge key={index} variant="outline" className="text-xs block w-fit">
                            {adjustment}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium mb-2">Hedge Implementation</p>
                      <div className="space-y-1">
                        {data.event_positioning.pre_event_strategy.hedge_implementation.map((hedge, index) => (
                          <Badge key={index} variant="secondary" className="text-xs block w-fit">
                            {hedge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Management */}
            <Card>
              <CardHeader>
                <CardTitle>Event Risk Management</CardTitle>
                <CardDescription>Risk parameters for event-driven trading</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm font-medium">Max Event Exposure</p>
                    <p className="text-2xl font-bold">{data.event_positioning.risk_management.max_event_exposure}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Hedge Requirements</p>
                    <p className="text-2xl font-bold">{data.event_positioning.risk_management.hedge_requirements.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Stop Protocols</p>
                    <p className="text-2xl font-bold">{data.event_positioning.risk_management.stop_loss_protocols.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Position Rules</p>
                    <p className="text-2xl font-bold">{data.event_positioning.risk_management.position_sizing_rules.length}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="font-medium mb-2">Hedge Requirements</p>
                    <div className="flex flex-wrap gap-1">
                      {data.event_positioning.risk_management.hedge_requirements.map((requirement, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {requirement}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-2">Position Sizing Rules</p>
                    <div className="flex flex-wrap gap-1">
                      {data.event_positioning.risk_management.position_sizing_rules.map((rule, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {rule}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* During & Post Event Strategy */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>During Event Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium mb-2">Monitoring Priorities</p>
                      <div className="space-y-1">
                        {data.event_positioning.during_event_strategy.monitoring_priorities.map((priority, index) => (
                          <p key={index} className="text-sm bg-yellow-50 p-1 rounded">• {priority}</p>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-medium mb-2">Reaction Protocols</p>
                      <div className="space-y-1">
                        {data.event_positioning.during_event_strategy.reaction_protocols.map((protocol, index) => (
                          <p key={index} className="text-sm bg-green-50 p-1 rounded">• {protocol}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Post Event Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium mb-2">Assessment Criteria</p>
                      <div className="space-y-1">
                        {data.event_positioning.post_event_strategy.assessment_criteria.map((criteria, index) => (
                          <p key={index} className="text-sm bg-blue-50 p-1 rounded">• {criteria}</p>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-medium mb-2">Lesson Capture</p>
                      <div className="space-y-1">
                        {data.event_positioning.post_event_strategy.lesson_capture_method.map((method, index) => (
                          <p key={index} className="text-sm bg-purple-50 p-1 rounded">• {method}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 