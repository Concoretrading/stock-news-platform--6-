'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign, BarChart3, Globe, Target } from 'lucide-react';

interface MarketContextDashboardProps {
  ticker?: string;
}

export default function MarketContextDashboard({ ticker = 'SPY' }: MarketContextDashboardProps) {
  const [contextData, setContextData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContext();
  }, [ticker]);

  const fetchContext = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/market-context?ticker=${ticker}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch market context');
      }
      
      setContextData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 1.1) return 'text-green-600';
    if (strength >= 1.0) return 'text-blue-600';
    if (strength >= 0.9) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'RISING':
      case 'BULLISH':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'FALLING':
      case 'BEARISH':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Analyzing market context...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!contextData) return null;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Market Context Analysis</span>
            </CardTitle>
            <CardDescription>
              Your systematic daily routine: News → Economic Data → Rotation → Ratios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Current Regime</span>
                <Badge variant="outline">
                  {contextData.currentRegime.type}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                {contextData.currentRegime.tradingApproach}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Risk Appetite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {contextData.keyRatios.riskAppetite['VIX/SPY'].trend}
            </div>
            <p className="text-sm text-gray-600">VIX/SPY Trending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Market Breadth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {contextData.keyRatios.marketInternals['ADVN/DECN'].current}
            </div>
            <p className="text-sm text-gray-600">Advance/Decline</p>
          </CardContent>
        </Card>
      </div>

      {/* MAIN ANALYSIS TABS */}
      <Card>
        <CardHeader>
          <CardTitle>Market Context Analysis</CardTitle>
          <CardDescription>Following your systematic approach</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="news" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="news">News & Economic</TabsTrigger>
              <TabsTrigger value="rotation">Sector Rotation</TabsTrigger>
              <TabsTrigger value="ratios">Key Ratios</TabsTrigger>
              <TabsTrigger value="strength">Relative Strength</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            </TabsList>

            {/* NEWS & ECONOMIC DATA */}
            <TabsContent value="news">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Today's Market-Moving Events
                  </h4>
                  <div className="space-y-3">
                    {contextData.newsAndEconomic.marketMovingNews.map((news: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium">{news.event}</span>
                            <Badge className={`ml-2 ${getImpactColor(news.impact)}`}>
                              {news.impact}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">{news.time}</span>
                        </div>
                        {news.actual && (
                          <div className="text-sm mb-1">
                            <span className="text-gray-600">Actual: </span>
                            <span className="font-medium">{news.actual}</span>
                            {news.expected && (
                              <>
                                <span className="text-gray-600 ml-2">Expected: </span>
                                <span>{news.expected}</span>
                              </>
                            )}
                          </div>
                        )}
                        <div className="text-sm">
                          <span className="font-medium">{news.interpretation}</span>
                        </div>
                        {news.marketReaction && (
                          <div className="text-sm text-green-600 mt-1">
                            Market: {news.marketReaction}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Economic Data Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(contextData.newsAndEconomic.economicDataSummary).map(([key, value]: [string, any]) => (
                      <div key={key} className="border rounded-lg p-3">
                        <div className="font-medium capitalize">{key}</div>
                        <div className="text-sm text-gray-600">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* SECTOR ROTATION */}
            <TabsContent value="rotation">
              <div className="space-y-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-800">
                    {contextData.sectorRotation.rotationSummary.trend}
                  </div>
                  <div className="text-sm text-blue-600">
                    {contextData.sectorRotation.rotationSummary.interpretation}
                  </div>
                  <div className="text-sm font-medium text-blue-700 mt-1">
                    Trading: {contextData.sectorRotation.rotationSummary.tradingImplication}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* STRONGEST SECTORS */}
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">💪 Strongest Sectors</h4>
                    <div className="space-y-3">
                      {contextData.sectorRotation.strongest.map((sector: any, index: number) => (
                        <div key={index} className="border border-green-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{sector.sector}</span>
                            <span className={`font-bold ${getStrengthColor(sector.relativeStrength)}`}>
                              {sector.relativeStrength}x
                            </span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>Performance: <span className="text-green-600 font-medium">{sector.performance}</span></div>
                            <div>Volume: <span className="font-medium">{sector.volume}</span></div>
                            <div>Money Flow: <span className="font-medium">{sector.moneyFlow}</span></div>
                          </div>
                          <div className="mt-2">
                            <div className="text-xs text-gray-600 mb-1">Leading Stocks:</div>
                            <div className="flex space-x-1">
                              {sector.leadingStocks.map((stock: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {stock}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                            {sector.interpretation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WEAKEST SECTORS */}
                  <div>
                    <h4 className="font-semibold mb-3 text-red-600">📉 Weakest Sectors</h4>
                    <div className="space-y-3">
                      {contextData.sectorRotation.weakest.map((sector: any, index: number) => (
                        <div key={index} className="border border-red-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{sector.sector}</span>
                            <span className={`font-bold ${getStrengthColor(sector.relativeStrength)}`}>
                              {sector.relativeStrength}x
                            </span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>Performance: <span className="text-red-600 font-medium">{sector.performance}</span></div>
                            <div>Volume: <span className="font-medium">{sector.volume}</span></div>
                            <div>Money Flow: <span className="font-medium">{sector.moneyFlow}</span></div>
                          </div>
                          <div className="mt-2 text-sm text-red-700 bg-red-50 p-2 rounded">
                            {sector.interpretation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* KEY RATIOS */}
            <TabsContent value="ratios">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* RISK APPETITE */}
                  <div>
                    <h4 className="font-semibold mb-3">Risk Appetite</h4>
                    {Object.entries(contextData.keyRatios.riskAppetite).map(([ratio, data]: [string, any]) => (
                      <div key={ratio} className="border rounded-lg p-3 mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{ratio}</span>
                          {getTrendIcon(data.trend)}
                        </div>
                        <div className="text-lg font-bold">{data.current}</div>
                        <div className="text-xs text-gray-600">{data.interpretation}</div>
                      </div>
                    ))}
                  </div>

                  {/* SECTOR LEADERSHIP */}
                  <div>
                    <h4 className="font-semibold mb-3">Sector Leadership</h4>
                    {Object.entries(contextData.keyRatios.sectorLeadership).map(([ratio, data]: [string, any]) => (
                      <div key={ratio} className="border rounded-lg p-3 mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{ratio}</span>
                          {getTrendIcon(data.trend)}
                        </div>
                        <div className={`text-lg font-bold ${getStrengthColor(data.current)}`}>
                          {data.current}
                        </div>
                        <div className="text-xs text-gray-600">{data.interpretation}</div>
                      </div>
                    ))}
                  </div>

                  {/* MARKET INTERNALS */}
                  <div>
                    <h4 className="font-semibold mb-3">Market Internals</h4>
                    {Object.entries(contextData.keyRatios.marketInternals).map(([ratio, data]: [string, any]) => (
                      <div key={ratio} className="border rounded-lg p-3 mb-2">
                        <div className="text-sm font-medium mb-1">{ratio}</div>
                        <div className="text-lg font-bold text-blue-600">{data.current}</div>
                        <div className="text-xs text-gray-600">{data.interpretation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* RELATIVE STRENGTH */}
            <TabsContent value="strength">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* STRENGTH IN WEAKNESS */}
                <div>
                  <h4 className="font-semibold mb-3 text-green-600">💪 Strong When Market Weak</h4>
                  <div className="space-y-3">
                    {contextData.strengthInWeakness.whenMarketWeak.map((item: any, index: number) => (
                      <div key={index} className="border border-green-200 rounded-lg p-4">
                        <div className="font-medium text-green-800">{item.asset}</div>
                        <div className="text-sm text-gray-600 mb-2">{item.reason}</div>
                        <div className="text-sm font-medium text-green-700 bg-green-50 p-2 rounded">
                          Action: {item.actionable}
                        </div>
                        <Badge className="mt-2 bg-green-100 text-green-800">
                          {item.relativeStrength}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AVOID WHEN WEAK */}
                <div>
                  <h4 className="font-semibold mb-3 text-red-600">⚠️ Avoid When Market Weak</h4>
                  <div className="space-y-3">
                    {contextData.strengthInWeakness.avoidWhenWeak.map((item: any, index: number) => (
                      <div key={index} className="border border-red-200 rounded-lg p-4">
                        <div className="font-medium text-red-800">{item.asset}</div>
                        <div className="text-sm text-gray-600 mb-2">{item.reason}</div>
                        <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                          Signal: {item.signal}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* HIGH-PROBABILITY OPPORTUNITIES */}
            <TabsContent value="opportunities">
              <div className="space-y-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-800">
                    Trading Environment Score: {contextData.confluenceAnalysis.tradingEnvironment.score}%
                  </div>
                  <div className="text-sm text-blue-600">
                    {contextData.confluenceAnalysis.tradingEnvironment.interpretation}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {contextData.highProbabilityPlays.map((play: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-blue-800">{play.setup}</h4>
                        <Badge className="bg-blue-100 text-blue-800">
                          {play.probability} Probability
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-1">Confluence Factors:</div>
                          {play.confluence.map((factor: string, i: number) => (
                            <div key={i} className="text-sm text-gray-700 flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              {factor}
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="font-medium text-blue-800">Action Plan:</div>
                          <div className="text-sm text-blue-700">{play.action}</div>
                          <div className="text-xs text-blue-600 mt-1">
                            Timeframe: {play.timeframe}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* REFRESH BUTTON */}
      <div className="text-center">
        <Button onClick={fetchContext} disabled={loading}>
          {loading ? 'Analyzing...' : 'Refresh Market Context'}
        </Button>
      </div>
    </div>
  );
} 