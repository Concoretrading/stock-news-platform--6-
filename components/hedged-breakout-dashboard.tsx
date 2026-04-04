'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HedgedStrategyData {
  breakoutAnalysis: {
    currentPrice: number;
    overallBias: string;
    confidence: number;
    probabilityScores: {
      bullishProbability: number;
      bearishProbability: number;
    };
    keyLevels: {
      resistance: number;
      support: number;
      distanceToResistance: string;
      distanceToSupport: string;
    };
  };
  positionStrategy: {
    totalPositionSize: number;
    cashReserved: number;
    allocationRatio: string;
    primaryPosition: any;
    hedgePosition: any;
    strikes: any;
  };
  tradeRecommendations: {
    trades: any[];
    scenarios: any[];
    entryConditions: string[];
    exitStrategy: string[];
  };
}

export default function HedgedBreakoutDashboard() {
  const [data, setData] = useState<HedgedStrategyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticker, setTicker] = useState('AAPL');
  const [capital, setCapital] = useState('10000');
  const [riskTolerance, setRiskTolerance] = useState('3');

  const loadStrategy = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/hedged-breakout-strategy?ticker=${ticker}&capital=${capital}&riskTolerance=${parseFloat(riskTolerance) / 100}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error('Error loading hedged strategy:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStrategy();
  }, []);

  const getBiasColor = (bias: string) => {
    return bias === 'BULLISH' ? 'text-green-600' : 'text-red-600';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 30) return 'text-green-600';
    if (confidence > 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Hedged Breakout Strategy</h1>
        <p className="text-gray-600 mb-6">
          Position heavier on your conviction side while maintaining downside protection through hedging
        </p>
        
        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
          <div>
            <Label htmlFor="ticker">Symbol</Label>
            <Input 
              id="ticker"
              value={ticker} 
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="AAPL"
            />
          </div>
          <div>
            <Label htmlFor="capital">Capital ($)</Label>
            <Input 
              id="capital"
              value={capital} 
              onChange={(e) => setCapital(e.target.value)}
              placeholder="10000"
            />
          </div>
          <div>
            <Label htmlFor="risk">Max Risk (%)</Label>
            <Input 
              id="risk"
              value={riskTolerance} 
              onChange={(e) => setRiskTolerance(e.target.value)}
              placeholder="3"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={loadStrategy} disabled={loading} className="w-full">
              {loading ? 'Analyzing...' : 'Analyze Strategy'}
            </Button>
          </div>
        </div>
      </div>

      {data && (
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analysis">Breakout Analysis</TabsTrigger>
            <TabsTrigger value="position">Position Sizing</TabsTrigger>
            <TabsTrigger value="trades">Trade Plan</TabsTrigger>
            <TabsTrigger value="scenarios">Outcome Scenarios</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            {/* Market Analysis Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Current Price</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${data.breakoutAnalysis.currentPrice}</div>
                  <div className="text-xs text-gray-500">
                    R: ${data.breakoutAnalysis.keyLevels.resistance} ({data.breakoutAnalysis.keyLevels.distanceToResistance})
                  </div>
                  <div className="text-xs text-gray-500">
                    S: ${data.breakoutAnalysis.keyLevels.support} ({data.breakoutAnalysis.keyLevels.distanceToSupport})
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Direction Bias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getBiasColor(data.breakoutAnalysis.overallBias)}`}>
                    {data.breakoutAnalysis.overallBias}
                  </div>
                  <div className="text-xs text-gray-500">
                    {data.breakoutAnalysis.probabilityScores.bullishProbability}% Bull / {data.breakoutAnalysis.probabilityScores.bearishProbability}% Bear
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Confidence Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getConfidenceColor(data.breakoutAnalysis.confidence)}`}>
                    {data.breakoutAnalysis.confidence}%
                  </div>
                  <Progress value={data.breakoutAnalysis.confidence} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Probability Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Probability Analysis</CardTitle>
                <CardDescription>Factors contributing to directional bias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">Bullish Factors</h4>
                    <Progress value={data.breakoutAnalysis.probabilityScores.bullishProbability} className="mb-2" />
                    <div className="text-sm text-gray-600">
                      {data.breakoutAnalysis.probabilityScores.bullishProbability}% probability
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-red-600">Bearish Factors</h4>
                    <Progress value={data.breakoutAnalysis.probabilityScores.bearishProbability} className="mb-2" />
                    <div className="text-sm text-gray-600">
                      {data.breakoutAnalysis.probabilityScores.bearishProbability}% probability
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="position" className="space-y-6">
            {/* Position Allocation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Capital Allocation</CardTitle>
                  <CardDescription>How your ${parseInt(capital).toLocaleString()} is positioned</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Position Size:</span>
                      <span className="font-bold">${data.positionStrategy.totalPositionSize.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Cash Reserved:</span>
                      <span className="font-bold">${data.positionStrategy.cashReserved.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="text-sm font-semibold mb-2">Allocation Ratio:</div>
                      <div className="text-lg font-bold text-blue-600">
                        {data.positionStrategy.allocationRatio}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Strike Selection</CardTitle>
                  <CardDescription>Optimal strikes based on confidence level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 border rounded bg-green-50">
                      <div className="font-semibold text-green-800">Primary Position</div>
                      <div>{data.positionStrategy.strikes.primary.direction}: ${data.positionStrategy.strikes.primary.strike}</div>
                      <div className="text-xs text-green-600">
                        {data.positionStrategy.strikes.primary.distanceFromCurrent}
                      </div>
                    </div>
                    <div className="p-3 border rounded bg-orange-50">
                      <div className="font-semibold text-orange-800">Hedge Position</div>
                      <div>{data.positionStrategy.strikes.hedge.direction}: ${data.positionStrategy.strikes.hedge.strike}</div>
                      <div className="text-xs text-orange-600">
                        {data.positionStrategy.strikes.hedge.distanceFromCurrent}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Position Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Position Details</CardTitle>
                <CardDescription>Primary and hedge position specifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg bg-green-50">
                    <h4 className="font-bold text-green-800 mb-3">
                      Primary Position ({data.positionStrategy.primaryPosition.direction})
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Allocation:</strong> ${data.positionStrategy.primaryPosition.allocation.toLocaleString()}</div>
                      <div><strong>Strategy:</strong> {data.positionStrategy.primaryPosition.suggestedStrategy}</div>
                      <div><strong>Reasoning:</strong> {data.positionStrategy.primaryPosition.reasoning}</div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-orange-50">
                    <h4 className="font-bold text-orange-800 mb-3">
                      Hedge Position ({data.positionStrategy.hedgePosition.direction})
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Allocation:</strong> ${data.positionStrategy.hedgePosition.allocation.toLocaleString()}</div>
                      <div><strong>Strategy:</strong> {data.positionStrategy.hedgePosition.suggestedStrategy}</div>
                      <div><strong>Reasoning:</strong> {data.positionStrategy.hedgePosition.reasoning}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trades" className="space-y-6">
            {/* Trade Execution Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Trade Execution Plan</CardTitle>
                <CardDescription>Specific trades to execute simultaneously</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.tradeRecommendations.trades.map((trade, index) => (
                    <div key={index} className={`p-4 border rounded-lg ${
                      trade.type === 'PRIMARY_POSITION' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-lg">{trade.action}</div>
                          <div className="text-sm text-gray-600">{trade.type.replace('_', ' ')}</div>
                        </div>
                        <Badge variant={trade.type === 'PRIMARY_POSITION' ? 'default' : 'secondary'}>
                          Strike: ${trade.strike}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Allocation:</strong> {trade.allocation}
                        </div>
                        <div>
                          <strong>Expected Move:</strong> {trade.expectedMove}
                        </div>
                        <div>
                          <strong>Timing:</strong> {trade.timing}
                        </div>
                        <div>
                          <strong>Expiration:</strong> {trade.expiration}
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-white rounded border">
                        <strong>Rationale:</strong> {trade.rationale}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Entry and Exit Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Entry Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.tradeRecommendations.entryConditions.map((condition, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-sm">{condition}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exit Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.tradeRecommendations.exitStrategy.map((strategy, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">→</span>
                        <span className="text-sm">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            {/* Outcome Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle>Potential Outcomes</CardTitle>
                <CardDescription>How the hedged strategy performs in different scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.tradeRecommendations.scenarios.map((scenario, index) => (
                    <div key={index} className={`p-4 border rounded-lg ${
                      scenario.scenario === 'CORRECT DIRECTION' ? 'bg-green-50 border-green-200' :
                      scenario.scenario === 'WRONG DIRECTION' ? 'bg-orange-50 border-orange-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg">{scenario.scenario}</h4>
                          <div className="text-sm text-gray-600">{scenario.priceMove}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            scenario.netResult.startsWith('+') ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {scenario.netResult}
                          </div>
                          <div className="text-xs text-gray-500">{scenario.probability}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Primary Position:</strong> {scenario.primaryOutcome}
                        </div>
                        <div>
                          <strong>Hedge Position:</strong> {scenario.hedgeOutcome}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk-Reward Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Risk-Reward Analysis</CardTitle>
                <CardDescription>Expected outcomes weighted by probability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded bg-green-50">
                    <div className="text-2xl font-bold text-green-600">
                      {data.tradeRecommendations.scenarios[0]?.netResult || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Best Case</div>
                  </div>
                  <div className="text-center p-4 border rounded bg-orange-50">
                    <div className="text-2xl font-bold text-orange-600">
                      {data.tradeRecommendations.scenarios[1]?.netResult || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Wrong Direction</div>
                  </div>
                  <div className="text-center p-4 border rounded bg-gray-50">
                    <div className="text-2xl font-bold text-gray-600">
                      {data.tradeRecommendations.scenarios[2]?.netResult || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Sideways</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 