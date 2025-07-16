'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, TrendingUp, Target, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

interface HighProbabilityDashboardProps {
  ticker?: string;
}

export default function HighProbabilityDashboard({ ticker = 'AAPL' }: HighProbabilityDashboardProps) {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysis();
  }, [ticker]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/high-probability-setups?ticker=${ticker}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analysis');
      }
      
      setAnalysisData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getConfluenceColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 75) return 'text-blue-600 bg-blue-50';
    if (score >= 65) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfluenceLabel = (score: number) => {
    if (score >= 85) return 'EXCEPTIONAL';
    if (score >= 75) return 'STRONG';
    if (score >= 65) return 'MODERATE';
    return 'WEAK';
  };

  const getRiskRewardColor = (rr: string) => {
    const ratio = parseFloat(rr.split(':')[1]);
    if (ratio >= 4) return 'text-green-600';
    if (ratio >= 3) return 'text-blue-600';
    if (ratio >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Analyzing high-probability setups...</p>
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

  if (!analysisData) return null;

  return (
    <div className="space-y-6">
      {/* HEADER WITH CONFLUENCE SCORE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>High Probability Setups - {ticker}</span>
            </CardTitle>
            <CardDescription>
              Confluence-based trading opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Overall Confluence Score</span>
                <Badge className={getConfluenceColor(analysisData.confluenceCalculation.confluencePercentage)}>
                  {getConfluenceLabel(analysisData.confluenceCalculation.confluencePercentage)}
                </Badge>
              </div>
              <Progress 
                value={analysisData.confluenceCalculation.confluencePercentage} 
                className="h-2"
              />
              <p className="text-sm text-gray-600">
                {analysisData.confluenceCalculation.confluencePercentage}% - {analysisData.confluenceCalculation.interpretation}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Setup Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analysisData.setupQuality.overallQuality}%
            </div>
            <Badge variant="outline" className="mt-1">
              {analysisData.setupQuality.recommendation.replace(/_/g, ' ')}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Setups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analysisData.highProbabilitySetups.length}
            </div>
            <p className="text-sm text-gray-600">Ready to trade</p>
          </CardContent>
        </Card>
      </div>

      {/* CONFLUENCE FACTORS BREAKDOWN */}
      <Card>
        <CardHeader>
          <CardTitle>Confluence Factors</CardTitle>
          <CardDescription>Weighted scoring of technical alignment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(analysisData.confluenceFactors).map(([category, factors]: [string, any]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-semibold capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                {Object.entries(factors).map(([factor, data]: [string, any]) => (
                  <div key={factor} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">
                        {factor.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant="outline">
                        {data.score}%
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      Weight: {data.weight}%
                    </div>
                    <Progress value={data.score} className="h-1 mb-1" />
                    <p className="text-xs text-gray-500">{data.reason}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* HIGH PROBABILITY SETUPS */}
      <Card>
        <CardHeader>
          <CardTitle>High Probability Setups</CardTitle>
          <CardDescription>Actionable trading opportunities with multiple confirmations</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="0" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              {analysisData.highProbabilitySetups.map((setup: any, index: number) => (
                <TabsTrigger key={index} value={index.toString()}>
                  {setup.setupName.replace(/_/g, ' ')}
                </TabsTrigger>
              ))}
            </TabsList>

            {analysisData.highProbabilitySetups.map((setup: any, index: number) => (
              <TabsContent key={index} value={index.toString()}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* SETUP OVERVIEW */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold">Setup Overview</h4>
                        <Badge className={getConfluenceColor(setup.confluenceScore)}>
                          {setup.confluenceScore}% Confluence
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Probability</div>
                          <div className="text-lg font-semibold text-green-600">{setup.probability}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Timeframe</div>
                          <div className="text-lg font-semibold">{setup.timeframe}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Aligned Factors:</div>
                        {setup.alignedFactors.map((factor: string, i: number) => (
                          <div key={i} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RISK FACTORS */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Risk Factors</h4>
                      {analysisData.setupQuality.riskFactors.map((risk: any, i: number) => (
                        <div key={i} className="flex items-start space-x-2 mb-2">
                          <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                            risk.impact === 'HIGH' ? 'text-red-500' : 
                            risk.impact === 'MODERATE' ? 'text-yellow-500' : 
                            'text-green-500'
                          }`} />
                          <div className="text-sm">
                            <div className="font-medium">{risk.factor}</div>
                            <div className="text-gray-600">{risk.mitigation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TRADE PARAMETERS */}
                  <div className="space-y-4">
                    {/* ENTRY */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Entry Parameters
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Zone: </span>
                          <span className="font-medium">{setup.entry.zone}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Trigger: </span>
                          <span className="font-medium">{setup.entry.trigger}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Confirmation: </span>
                          <span className="font-medium">{setup.entry.confirmation}</span>
                        </div>
                      </div>
                    </div>

                    {/* TARGETS */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Targets & Stop Loss
                      </h4>
                      <div className="space-y-2">
                        {setup.targets.map((target: any, i: number) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="text-sm">Target {i + 1}: ${target.level}</span>
                            <Badge variant="outline">{target.probability}%</Badge>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm text-red-600">Stop Loss: ${setup.stopLoss.level}</span>
                          <span className="text-sm">{setup.stopLoss.maxRisk}</span>
                        </div>
                      </div>
                    </div>

                    {/* RISK/REWARD */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Risk/Reward
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(setup.riskReward).map(([key, value]: [string, any]) => (
                          <div key={key} className="text-sm">
                            <span className="text-gray-600">{key}: </span>
                            <span className={`font-medium ${getRiskRewardColor(value)}`}>
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* POSITION SIZING */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Position Sizing</h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>Conservative: {setup.positionSizing.conservative}</div>
                          <div>Moderate: {setup.positionSizing.moderate}</div>
                          <div>Aggressive: {setup.positionSizing.aggressive}</div>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Recommended: </span>
                          <Badge variant="outline">{setup.positionSizing.recommendation}</Badge>
                        </div>
                        <p className="text-xs text-gray-500">{setup.positionSizing.reasoning}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* EXECUTION PLAN */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Plan</CardTitle>
          <CardDescription>Step-by-step trading execution guide</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preparation" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="preparation">Preparation</TabsTrigger>
              <TabsTrigger value="entry">Entry</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
              <TabsTrigger value="contingency">Contingency</TabsTrigger>
            </TabsList>

            <TabsContent value="preparation">
              <div className="space-y-2">
                {analysisData.executionPlan.preparation.map((step: string, i: number) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="entry">
              <div className="space-y-2">
                {analysisData.executionPlan.entryExecution.map((step: string, i: number) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="management">
              <div className="space-y-2">
                {analysisData.executionPlan.management.map((step: string, i: number) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="contingency">
              <div className="space-y-2">
                {analysisData.executionPlan.contingencyPlans.map((step: string, i: number) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* MARKET TIMING */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Optimal Timing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysisData.marketTiming.optimalTiming.map((time: string, i: number) => (
                <div key={i} className="text-sm">{time}</div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Confluence Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                {analysisData.confluenceSummary.strengthAreas.map((strength: string, i: number) => (
                  <div key={i} className="text-sm flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{strength}</span>
                  </div>
                ))}
              </div>
              
              <div>
                <h4 className="font-medium text-yellow-600 mb-2">Watch Points</h4>
                {analysisData.confluenceSummary.watchPoints.map((point: string, i: number) => (
                  <div key={i} className="text-sm flex items-center space-x-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REFRESH BUTTON */}
      <div className="text-center">
        <Button onClick={fetchAnalysis} disabled={loading}>
          {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>
    </div>
  );
} 