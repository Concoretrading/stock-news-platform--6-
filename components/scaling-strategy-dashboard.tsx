'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ScalingData {
  position: {
    totalContracts: number;
    entryPrice: number;
    currentPrice: number;
    currentGain: string;
    totalValue: string;
  };
  scalingPlan: {
    currentMetrics: any;
    scalingLevels: any[];
    executionStatus: any;
    recommendations: any[];
  };
  scalingScenarios: any[];
  riskManagement: any;
}

export default function ScalingStrategyDashboard() {
  const [data, setData] = useState<ScalingData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form inputs
  const [ticker, setTicker] = useState('AAPL');
  const [contracts, setContracts] = useState('10');
  const [entryPrice, setEntryPrice] = useState('2.50');
  const [currentPrice, setCurrentPrice] = useState('4.20');
  const [totalCapital, setTotalCapital] = useState('25000');

  const loadStrategy = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/scaling-strategy?ticker=${ticker}&contracts=${contracts}&entryPrice=${entryPrice}&currentPrice=${currentPrice}&totalCapital=${totalCapital}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error('Error loading scaling strategy:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStrategy();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FREE_TRADE': return 'bg-green-100 text-green-800 border-green-200';
      case 'SCALING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LEGENDARY': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ACTIVE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'SUCCESS': return 'bg-green-500';
      case 'HIGH': return 'bg-red-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Advanced Scaling Strategy</h1>
        <p className="text-gray-600 mb-6">
          Optimize profit taking with systematic contract scaling - lock in gains while leaving runners for maximum upside
        </p>
        
        {/* Input Controls */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
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
            <Label htmlFor="contracts">Contracts</Label>
            <Input 
              id="contracts"
              value={contracts} 
              onChange={(e) => setContracts(e.target.value)}
              placeholder="10"
            />
          </div>
          <div>
            <Label htmlFor="entry">Entry Price</Label>
            <Input 
              id="entry"
              value={entryPrice} 
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="2.50"
            />
          </div>
          <div>
            <Label htmlFor="current">Current Price</Label>
            <Input 
              id="current"
              value={currentPrice} 
              onChange={(e) => setCurrentPrice(e.target.value)}
              placeholder="4.20"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={loadStrategy} disabled={loading} className="w-full">
              {loading ? 'Calculating...' : 'Update Strategy'}
            </Button>
          </div>
        </div>
      </div>

      {data && (
        <Tabs defaultValue="position" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="position">Current Position</TabsTrigger>
            <TabsTrigger value="scaling">Scaling Plan</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="risk">Risk Management</TabsTrigger>
          </TabsList>

          <TabsContent value="position" className="space-y-6">
            {/* Position Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Contracts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.position.totalContracts}</div>
                  <div className="text-xs text-gray-500">
                    Entry: ${data.position.entryPrice} → Current: ${data.position.currentPrice}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Current Gain</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{data.position.currentGain}</div>
                  <div className="text-xs text-gray-500">Unrealized</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Position Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${data.position.totalValue}</div>
                  <div className="text-xs text-gray-500">Current Market Value</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Trade Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={data.scalingPlan.executionStatus.isTradeFree ? 
                    'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                    {data.scalingPlan.executionStatus.isTradeFree ? 'FREE TRADE' : 'ACTIVE'}
                  </Badge>
                  {data.scalingPlan.executionStatus.guaranteedProfit > 0 && (
                    <div className="text-xs text-green-600 mt-1">
                      Guaranteed: ${data.scalingPlan.executionStatus.guaranteedProfit}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Execution Status */}
            <Card>
              <CardHeader>
                <CardTitle>Execution Status</CardTitle>
                <CardDescription>Current scaling progress and next actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Contracts Sold</h4>
                    <div className="text-2xl font-bold text-blue-600">
                      {data.scalingPlan.executionStatus.contractsSold}
                    </div>
                    <div className="text-sm text-gray-500">
                      Proceeds: ${data.scalingPlan.executionStatus.proceedsCollected}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Contracts Remaining</h4>
                    <div className="text-2xl font-bold text-green-600">
                      {data.scalingPlan.executionStatus.contractsRemaining}
                    </div>
                    <div className="text-sm text-gray-500">Active runners</div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Levels Triggered</h4>
                    <div className="text-2xl font-bold text-purple-600">
                      {data.scalingPlan.executionStatus.triggeredLevels} / 4
                    </div>
                    <Progress 
                      value={(data.scalingPlan.executionStatus.triggeredLevels / 4) * 100} 
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Current Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.scalingPlan.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${getUrgencyColor(rec.urgency)}`}></div>
                      <div className="flex-1">
                        <div className="font-semibold">{rec.action.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-600">{rec.message}</div>
                      </div>
                      <Badge variant="outline">{rec.urgency}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scaling" className="space-y-6">
            {/* Scaling Levels */}
            <Card>
              <CardHeader>
                <CardTitle>Scaling Levels Plan</CardTitle>
                <CardDescription>Systematic profit taking at key gain levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.scalingPlan.scalingLevels.map((level, index) => {
                    const isTriggered = parseFloat(data.scalingPlan.currentMetrics.currentGainPercent) >= level.triggerGain;
                    const targetPrice = data.position.entryPrice * (1 + level.triggerGain / 100);
                    
                    return (
                      <div key={index} className={`p-4 border rounded-lg ${
                        isTriggered ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-lg">Level {level.level}</h4>
                            <div className="text-sm text-gray-600">{level.reasoning}</div>
                          </div>
                          <div className="text-right">
                            <Badge className={isTriggered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {isTriggered ? 'TRIGGERED' : 'PENDING'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <strong>Trigger:</strong> {level.triggerGain}% gain
                          </div>
                          <div>
                            <strong>Target Price:</strong> ${targetPrice.toFixed(2)}
                          </div>
                          <div>
                            <strong>Contracts to Sell:</strong> {level.contractsToSell}
                          </div>
                          <div>
                            <strong>Action:</strong> {level.action.replace('_', ' ')}
                          </div>
                        </div>
                        
                        {isTriggered && (
                          <div className="mt-3 p-2 bg-green-100 rounded text-sm text-green-800">
                            ✅ This level has been triggered - profits should be taken
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            {/* Scaling Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle>Scaling Scenarios</CardTitle>
                <CardDescription>How the position evolves as profits are taken</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.scalingScenarios.map((scenario, index) => (
                    <div key={index} className={`p-4 border rounded-lg ${getStatusColor(scenario.status)}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold">{scenario.scenario.replace('_', ' ')}</h4>
                          <div className="text-sm">
                            Price: ${scenario.price} ({scenario.gainPercent}% gain)
                          </div>
                        </div>
                        <Badge className={getStatusColor(scenario.status)}>
                          {scenario.status?.replace('_', ' ') || 'PENDING'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {scenario.contractsSold && (
                          <div>
                            <strong>Contracts Sold:</strong> {scenario.contractsSold}
                          </div>
                        )}
                        <div>
                          <strong>Contracts Remaining:</strong> {scenario.contractsRemaining}
                        </div>
                        {scenario.proceedsFromSale && (
                          <div>
                            <strong>Sale Proceeds:</strong> ${scenario.proceedsFromSale}
                          </div>
                        )}
                        <div>
                          <strong>Remaining Value:</strong> ${scenario.remainingValue || scenario.totalValue}
                        </div>
                      </div>
                      
                      {scenario.isTradeFree && (
                        <div className="mt-3 p-2 bg-green-100 rounded text-sm text-green-800">
                          🎉 TRADE IS FREE - Playing with house money!
                        </div>
                      )}
                      
                      {scenario.guaranteedProfit && parseFloat(scenario.guaranteedProfit.replace(/,/g, '')) > 0 && (
                        <div className="mt-2 text-sm text-green-600">
                          💰 Guaranteed Profit: ${scenario.guaranteedProfit}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            {/* Risk Management */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Management</CardTitle>
                <CardDescription>Stop losses and position protection strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Stop Loss Levels</h4>
                    <div className="space-y-3">
                      {data.riskManagement.stopLossLevels.map((stop, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="font-medium">{stop.type.replace('_', ' ')}</div>
                          <div className="text-lg font-bold">${stop.level.toFixed(2)}</div>
                          <div className="text-sm text-gray-600">{stop.reasoning}</div>
                          <Badge variant={stop.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                            {stop.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Trailing Stops</h4>
                    <div className="space-y-3">
                      {data.riskManagement.trailingStops.map((trail, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="font-medium">{trail.type.replace('_', ' ')}</div>
                          <div className="text-lg font-bold">{trail.percentage}% Trail</div>
                          <div className="text-sm text-gray-600">{trail.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {data.riskManagement.riskMetrics.currentRisk}
                    </div>
                    <div className="text-sm text-gray-500">Current Risk Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {data.riskManagement.riskMetrics.maxLossFromCurrent}
                    </div>
                    <div className="text-sm text-gray-500">Max Loss From Current</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {data.riskManagement.riskMetrics.rewardPotential}
                    </div>
                    <div className="text-sm text-gray-500">Reward Potential</div>
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