'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  Activity, 
  Timer, 
  BarChart3,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Shield,
  Lightbulb
} from 'lucide-react';

interface ScenarioIntelligenceData {
  success: boolean;
  scenario_analysis: {
    primary_scenarios: any[];
    scenario_tree: any;
    position_mappings: any[];
    trading_recommendations: any;
    real_time_monitoring: any;
  };
  trading_intelligence: any;
  elite_insights: any;
  system_info: any;
}

export function ScenarioIntelligenceDashboard({ ticker = 'AAPL' }: { ticker?: string }) {
  const [data, setData] = useState<ScenarioIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchScenarioData = useCallback(async () => {
    try {
      const response = await fetch(`/api/scenario-intelligence?ticker=${ticker}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Failed to fetch scenario data:', error);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    fetchScenarioData();
  }, [fetchScenarioData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchScenarioData, 30000); // 30 second updates
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchScenarioData]);

  const handleManualRefresh = () => {
    setLoading(true);
    fetchScenarioData();
  };

  const getScenarioIcon = (scenario: any) => {
    if (scenario.scenario_name.toLowerCase().includes('bullish') || scenario.scenario_name.toLowerCase().includes('breakout')) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (scenario.scenario_name.toLowerCase().includes('bearish') || scenario.scenario_name.toLowerCase().includes('reversal')) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <BarChart3 className="h-4 w-4 text-blue-500" />;
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 60) return 'bg-green-500';
    if (probability >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceColor = (confidence: string) => {
    if (confidence === 'HIGH') return 'bg-green-100 text-green-800';
    if (confidence === 'MEDIUM') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getEvolutionIcon = (evolution: string) => {
    if (evolution === 'STRENGTHENING') return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (evolution === 'WEAKENING') return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Activity className="h-3 w-3 text-blue-500" />;
  };

  const getAlertLevelColor = (level: string) => {
    if (level === 'HIGH') return 'border-red-500 bg-red-50';
    if (level === 'MEDIUM') return 'border-yellow-500 bg-yellow-50';
    return 'border-blue-500 bg-blue-50';
  };

  if (loading && !data) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading Scenario Intelligence...</span>
        </div>
      </Card>
    );
  }

  if (!data || !data.success) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load scenario intelligence data. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { scenario_analysis, trading_intelligence, elite_insights } = data;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle className="text-xl">Scenario Intelligence Engine</CardTitle>
              <CardDescription>
                Elite "If-Then" Probabilistic Analysis for {ticker}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Updated: {lastUpdate}</span>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center space-x-1"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Dominant Scenario Alert */}
      <Alert className="border-purple-200 bg-purple-50">
        <Target className="h-4 w-4" />
        <AlertDescription className="font-medium">
          <div className="flex items-center justify-between">
            <span>
              Dominant Scenario: <strong>{trading_intelligence.dominant_scenario.name}</strong> 
              ({trading_intelligence.dominant_scenario.probability}% probability)
            </span>
            <Badge className={getConfidenceColor(trading_intelligence.dominant_scenario.confidence)}>
              {trading_intelligence.dominant_scenario.confidence} CONFIDENCE
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="scenarios" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="triggers">Triggers</TabsTrigger>
          <TabsTrigger value="recommendations">Actions</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid gap-4">
            {scenario_analysis.primary_scenarios.map((scenario: any, index: number) => (
              <Card key={scenario.scenario_id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getScenarioIcon(scenario)}
                      <CardTitle className="text-lg">{scenario.scenario_name}</CardTitle>
                      {getEvolutionIcon(scenario.scenario_evolution)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getConfidenceColor(scenario.confidence_level)}>
                        {scenario.confidence_level}
                      </Badge>
                      <Badge variant="outline" className="text-lg font-bold">
                        {scenario.probability}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={scenario.probability} 
                    className="h-2"
                    style={{
                      backgroundColor: '#f1f5f9'
                    }}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Trigger Conditions */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Trigger Conditions
                    </h4>
                    <div className="space-y-2">
                      {scenario.trigger_conditions.map((condition: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="flex-1">{condition.condition}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">
                              {condition.current_value} / {condition.threshold_value}
                            </span>
                            <Badge 
                              variant={condition.status === 'MET' ? 'default' : 'outline'}
                              className={
                                condition.status === 'MET' ? 'bg-green-100 text-green-800' :
                                condition.status === 'APPROACHING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {condition.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expected Outcomes */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      Expected Outcomes
                    </h4>
                    <div className="space-y-2">
                      {scenario.expected_outcomes.map((outcome: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <span>{outcome.asset}</span>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="outline"
                              className={
                                outcome.direction === 'UP' ? 'border-green-500 text-green-700' :
                                outcome.direction === 'DOWN' ? 'border-red-500 text-red-700' :
                                'border-blue-500 text-blue-700'
                              }
                            >
                              {outcome.direction} {(outcome.magnitude * 100).toFixed(1)}%
                            </Badge>
                            <span className="text-gray-600">{outcome.probability}% likely</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          <div className="grid gap-4">
            {scenario_analysis.position_mappings.map((position: any, index: number) => (
              <Card key={position.position_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{position.instrument}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span className={`font-bold ${position.current_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${position.current_pnl}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Expected PnL:</span>
                      <span className={`ml-2 font-semibold ${position.probability_weighted_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${position.probability_weighted_pnl}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Best Case:</span>
                      <span className="ml-2 font-semibold text-green-600">{position.optimal_scenario}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-semibold">Scenario Outcomes:</h5>
                    {position.scenario_outcomes.map((outcome: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="flex-1">{outcome.scenario_id.replace(/_/g, ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold ${outcome.expected_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${outcome.expected_pnl}
                          </span>
                          <Badge 
                            variant="outline"
                            className={
                              outcome.risk_level === 'LOW' ? 'border-green-500 text-green-700' :
                              outcome.risk_level === 'MEDIUM' ? 'border-yellow-500 text-yellow-700' :
                              'border-red-500 text-red-700'
                            }
                          >
                            {outcome.risk_level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Triggers Tab */}
        <TabsContent value="triggers" className="space-y-4">
          <div className="grid gap-4">
            {trading_intelligence.scenario_triggers_watch.map((trigger: any, index: number) => (
              <Card key={index} className={getAlertLevelColor(trigger.alert_level)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className={`h-4 w-4 ${
                        trigger.alert_level === 'HIGH' ? 'text-red-500' :
                        trigger.alert_level === 'MEDIUM' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`} />
                      <span className="font-medium">{trigger.condition}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {trigger.proximity}% to trigger
                      </Badge>
                      <Badge 
                        className={
                          trigger.alert_level === 'HIGH' ? 'bg-red-100 text-red-800' :
                          trigger.alert_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }
                      >
                        {trigger.alert_level}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress value={trigger.proximity} className="h-2" />
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Current: {trigger.current_value} | Threshold: {trigger.threshold}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {/* Immediate Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                  Immediate Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trading_intelligence.immediate_actions.map((action: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{action.position}</span>
                      <span className="ml-2 text-gray-600">→ {action.action.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-semibold ${action.expected_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${action.expected_pnl}
                      </span>
                      <Badge variant="outline">{action.risk_level}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Contingency Plans */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-500" />
                  Contingency Plans ({trading_intelligence.contingency_readiness} scenarios ready)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {scenario_analysis.trading_recommendations.contingency_plans.map((plan: any, index: number) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{plan.scenario}</span>
                      <Badge variant="outline">{plan.probability}% probability</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Watching:</strong> {plan.trigger_watch.join(', ')}
                    </div>
                    <div className="text-sm">
                      <strong>Prepared Action:</strong> {plan.prepared_action.replace(/_/g, ' ')}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4">
            {/* Real-Time Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-500" />
                  Real-Time Monitoring Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span>Monitoring Active:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {elite_insights.real_time_status.monitoring_active ? 'YES' : 'NO'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Update Frequency:</span>
                    <span className="font-semibold">{elite_insights.real_time_status.update_frequency}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Triggers Approaching:</span>
                    <Badge variant="outline">{elite_insights.real_time_status.triggers_approaching}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Auto-Adjustments:</span>
                    <Badge className={elite_insights.real_time_status.auto_adjustments_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {elite_insights.real_time_status.auto_adjustments_enabled ? 'ENABLED' : 'DISABLED'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Intelligence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-purple-500" />
                  Elite Intelligence Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {data.system_info.intelligence_features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Position Exposure Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                  Position Exposure Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Expected PnL:</span>
                    <span className={`ml-2 font-bold text-lg ${elite_insights.position_exposure.total_expected_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${elite_insights.position_exposure.total_expected_pnl}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Profit Probability:</span>
                    <span className="ml-2 font-bold text-lg text-blue-600">
                      {elite_insights.position_exposure.probability_of_profit}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Best Case:</span>
                    <span className="ml-2 font-semibold text-green-600">
                      {elite_insights.position_exposure.best_case_scenario}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Worst Case:</span>
                    <span className="ml-2 font-semibold text-red-600">
                      {elite_insights.position_exposure.worst_case_scenario}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 