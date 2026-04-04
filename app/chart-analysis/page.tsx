'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface PatternLearningData {
  summary: {
    totalBreakouts: number;
    successfulBreakouts: number;
    successRate: number;
    averageGain: number;
    averageLoss: number;
  };
  patternCombinations: any[];
  successFactors: any[];
  failurePatterns: any[];
  topPerformingCombinations: any[];
  criticalInsights: any[];
}

interface CorrelationData {
  summary: {
    totalBreakouts: number;
    totalIndicators: number;
    strongCombinations: number;
    avgSuccessRate: number;
  };
  correlationMatrix: any;
  strongestCombinations: any[];
  indicatorHierarchy: any[];
  keyFindings: any[];
}

export default function ChartAnalysisPage() {
  const [patternData, setPatternData] = useState<PatternLearningData | null>(null);
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('SPX');
  const [loading, setLoading] = useState(false);

  const loadPatternAnalysis = async (symbol: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ai-pattern-learning?symbol=${symbol}&lookback=1460`);
      const data = await response.json();
      if (data.success) {
        setPatternData(data);
      }
    } catch (error) {
      console.error('Error loading pattern analysis:', error);
    }
    setLoading(false);
  };

  const loadCorrelationAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-correlation-matrix?symbols=SPX,NDX&minOccurrences=10');
      const data = await response.json();
      if (data.success) {
        setCorrelationData(data);
      }
    } catch (error) {
      console.error('Error loading correlation analysis:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPatternAnalysis(selectedSymbol);
    loadCorrelationAnalysis();
  }, [selectedSymbol]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AI Breakout Pattern Learning System</h1>
        <p className="text-gray-600 mb-6">
          Comprehensive analysis of NDX and SPX historical breakouts to identify which indicators occur together in successful patterns
        </p>
        
        <div className="flex gap-4 mb-6">
          <Button 
            variant={selectedSymbol === 'SPX' ? 'default' : 'outline'}
            onClick={() => setSelectedSymbol('SPX')}
          >
            SPX Analysis
          </Button>
          <Button 
            variant={selectedSymbol === 'NDX' ? 'default' : 'outline'}
            onClick={() => setSelectedSymbol('NDX')}
          >
            NDX Analysis
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              loadPatternAnalysis(selectedSymbol);
              loadCorrelationAnalysis();
            }}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Refresh Analysis'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patterns">Pattern Learning</TabsTrigger>
          <TabsTrigger value="correlations">Correlation Matrix</TabsTrigger>
          <TabsTrigger value="combinations">Best Combinations</TabsTrigger>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-6">
          {patternData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Breakouts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{patternData.summary.totalBreakouts}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{patternData.summary.successRate}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Avg Gain</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">+{patternData.summary.averageGain}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Avg Loss</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">-{patternData.summary.averageLoss}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Success Factors */}
              <Card>
                <CardHeader>
                  <CardTitle>Success Factors Ranked by Importance</CardTitle>
                  <CardDescription>Which indicators most strongly correlate with successful breakouts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {patternData.successFactors.map((factor, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-semibold">{factor.factor}</div>
                          <Badge variant={factor.importance === 'CRITICAL' ? 'destructive' : 
                                        factor.importance === 'HIGH' ? 'default' : 'secondary'}>
                            {factor.importance}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{factor.successRate}%</div>
                          <Progress value={factor.successRate} className="w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Combinations */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Common Indicator Combinations</CardTitle>
                  <CardDescription>Which indicators occurred together in historical breakouts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patternData.patternCombinations.slice(0, 10).map((combo, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{combo.combination}</div>
                          <div className="text-xs text-gray-500">{combo.occurrences} occurrences</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${combo.successRate >= 70 ? 'text-green-600' : 
                                                     combo.successRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {combo.successRate}%
                          </div>
                          <div className="text-xs text-gray-500">
                            Risk/Reward: {combo.riskRewardRatio?.toFixed(2) || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="correlations" className="space-y-6">
          {correlationData && (
            <>
              {/* Correlation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Indicators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{correlationData.summary.totalIndicators}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Strong Combinations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{correlationData.summary.strongCombinations}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Breakouts Analyzed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{correlationData.summary.totalBreakouts}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Avg Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{correlationData.summary.avgSuccessRate}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Indicator Hierarchy */}
              <Card>
                <CardHeader>
                  <CardTitle>Indicator Hierarchy (Single Indicators)</CardTitle>
                  <CardDescription>Individual indicators ranked by success rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {correlationData.indicatorHierarchy.slice(0, 15).map((indicator, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{indicator.indicator.replace(/_/g, ' ')}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={indicator.importance === 'CRITICAL' ? 'destructive' : 
                                          indicator.importance === 'HIGH' ? 'default' : 
                                          indicator.importance === 'MEDIUM' ? 'secondary' : 'outline'}>
                              {indicator.importance}
                            </Badge>
                            <span className="text-xs text-gray-500">{indicator.occurrences} times</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${indicator.successRate >= 80 ? 'text-green-600' : 
                                                             indicator.successRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {indicator.successRate}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="combinations" className="space-y-6">
          {correlationData && (
            <Card>
              <CardHeader>
                <CardTitle>Strongest Indicator Combinations</CardTitle>
                <CardDescription>Multi-indicator combinations that occurred together and their effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {correlationData.strongestCombinations.slice(0, 15).map((combo, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-sm mb-2">
                            {combo.indicators.map((ind: string) => ind.replace(/_/g, ' ')).join(' + ')}
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={combo.type === 'THREE_INDICATOR' ? 'default' : 'secondary'}>
                              {combo.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500">{combo.occurrences} occurrences</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            Strength: {combo.combinedStrength}
                          </div>
                          {combo.individual1 !== undefined && (
                            <div className="text-xs text-gray-500">
                              Individual: {combo.individual1} + {combo.individual2}
                              {combo.indicators.length > 2 && ' + ...'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pattern Learning Insights */}
            {patternData && (
              <Card>
                <CardHeader>
                  <CardTitle>Pattern Learning Insights</CardTitle>
                  <CardDescription>Key discoveries from {selectedSymbol} breakout analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {patternData.criticalInsights.map((insight, index) => (
                      <div key={index} className="p-3 border-l-4 border-blue-500 bg-blue-50">
                        <div className="font-semibold text-sm">{insight.type.replace('_', ' ')}</div>
                        <div className="text-sm mt-1">{insight.insight}</div>
                        <div className="text-xs text-blue-600 mt-2 font-medium">
                          Action: {insight.actionable}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Correlation Insights */}
            {correlationData && (
              <Card>
                <CardHeader>
                  <CardTitle>Correlation Matrix Insights</CardTitle>
                  <CardDescription>Key findings from cross-symbol analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {correlationData.keyFindings.map((finding, index) => (
                      <div key={index} className="p-3 border-l-4 border-green-500 bg-green-50">
                        <div className="font-semibold text-sm">{finding.type.replace('_', ' ')}</div>
                        <div className="text-sm mt-1">{finding.finding}</div>
                        <div className="text-xs text-green-600 mt-2 font-medium">
                          Action: {finding.actionable}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Top Performing Combinations from Pattern Learning */}
          {patternData && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Pattern Combinations</CardTitle>
                <CardDescription>Highest success rate combinations with sufficient sample size</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patternData.topPerformingCombinations.slice(0, 6).map((combo, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
                      <div className="font-semibold text-sm mb-2">{combo.combination}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Success Rate: <span className="font-bold text-green-600">{combo.successRate}%</span></div>
                        <div>Occurrences: <span className="font-bold">{combo.occurrences}</span></div>
                        <div>Avg Gain: <span className="font-bold text-green-600">+{combo.avgGain?.toFixed(1)}%</span></div>
                        <div>Risk/Reward: <span className="font-bold">{combo.riskRewardRatio?.toFixed(2)}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 