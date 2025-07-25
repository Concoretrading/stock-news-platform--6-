'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  TrendingUp,
  Shield,
  BarChart2,
  Scale,
  Zap
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ProbabilityAnalysis {
  ticker: string;
  price: number;
  analysis: {
    consolidation: {
      isConsolidating: boolean;
      duration: number;
      compressionScore: number;
      breakoutProbability: number;
      expectedDirection: 'bullish' | 'bearish' | 'neutral';
    };
    premiumSetup: {
      ivPercentile: number;
      ivCompressionScore: number;
      optimalStrikes: {
        atr1: {
          strike: number;
          premium: number;
          probability: number;
          historicalSuccess: number;
        };
        atr2: {
          strike: number;
          premium: number;
          probability: number;
          historicalSuccess: number;
        };
      };
    };
    volumeProfile: {
      accumulation: boolean;
      distribution: boolean;
      unusualActivity: {
        calls: boolean;
        puts: boolean;
        ratio: number;
      };
    };
    probabilityAssessment: {
      breakoutProbability: number;
      expectedMoveSize: number;
      confidenceScore: number;
      keyRisks: string[];
    };
    recommendedStrategy: {
      entryStages: {
        initial: {
          size: number;
          trigger: string;
          strike: string;
        };
        scaling: {
          size: number;
          trigger: string;
          strike: string;
        }[];
      };
      exitStages: {
        targets: {
          percentage: number;
          size: number;
          adjustStopTo: number;
        }[];
        finalTarget: {
          percentage: number;
          condition: string;
        };
      };
      hedgeRules: {
        initialHedge: {
          type: string;
          strike: string;
          size: number;
          when: string;
        };
        adjustHedge: {
          trigger: string;
          action: string;
        }[];
      };
    };
  };
}

export default function PremiumProbabilityDashboard({
  ticker,
  onRefresh
}: {
  ticker: string;
  onRefresh?: () => void;
}) {
  const [analysis, setAnalysis] = useState<ProbabilityAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ticker) {
      fetchAnalysis();
    }
  }, [ticker]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/premium-probability?ticker=${ticker}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch analysis');
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-gray-600">Analyzing probabilities and scaling strategies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-8 text-gray-500">
        Select a ticker to view probability analysis
      </div>
    );
  }

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish': return 'text-green-600 bg-green-100';
      case 'bearish': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Probability Overview */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Probability Analysis
          </CardTitle>
          <CardDescription>
            Complete breakout probability assessment with scaling strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Breakout Probability */}
            <div className="bg-white/70 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-2">Breakout Probability</div>
              <div className="text-2xl font-bold text-blue-900">
                {analysis.analysis.probabilityAssessment.breakoutProbability.toFixed(1)}%
              </div>
              <Progress 
                value={analysis.analysis.probabilityAssessment.breakoutProbability} 
                className="mt-2"
              />
            </div>

            {/* Expected Direction */}
            <div className="bg-white/70 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-2">Expected Direction</div>
              <Badge 
                className={`text-lg ${getDirectionColor(analysis.analysis.consolidation.expectedDirection)}`}
              >
                {analysis.analysis.consolidation.expectedDirection.toUpperCase()}
                {analysis.analysis.consolidation.expectedDirection === 'bullish' && <ArrowUpRight className="inline ml-1" />}
                {analysis.analysis.consolidation.expectedDirection === 'bearish' && <ArrowDownRight className="inline ml-1" />}
              </Badge>
            </div>

            {/* Confidence Score */}
            <div className="bg-white/70 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-2">Confidence Score</div>
              <div className={`text-2xl font-bold ${getConfidenceColor(analysis.analysis.probabilityAssessment.confidenceScore)}`}>
                {analysis.analysis.probabilityAssessment.confidenceScore.toFixed(1)}%
              </div>
              <Progress 
                value={analysis.analysis.probabilityAssessment.confidenceScore} 
                className="mt-2"
              />
            </div>

            {/* Expected Move */}
            <div className="bg-white/70 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-2">Expected Move</div>
              <div className="text-2xl font-bold text-green-600">
                +{analysis.analysis.probabilityAssessment.expectedMoveSize.toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Setup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Premium Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">IV Compression</div>
                <Progress value={analysis.analysis.premiumSetup.ivCompressionScore} className="mb-1" />
                <div className="text-sm">
                  {analysis.analysis.premiumSetup.ivCompressionScore}% compressed (IV {analysis.analysis.premiumSetup.ivPercentile.toFixed(1)} percentile)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-purple-800 mb-2">1 ATR Strike</div>
                  <div className="text-xl font-bold text-purple-900">
                    ${analysis.analysis.premiumSetup.optimalStrikes.atr1.strike}
                  </div>
                  <div className="text-sm text-purple-600">
                    {analysis.analysis.premiumSetup.optimalStrikes.atr1.historicalSuccess}% success rate
                  </div>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-purple-800 mb-2">2 ATR Strike</div>
                  <div className="text-xl font-bold text-purple-900">
                    ${analysis.analysis.premiumSetup.optimalStrikes.atr2.strike}
                  </div>
                  <div className="text-sm text-purple-600">
                    {analysis.analysis.premiumSetup.optimalStrikes.atr2.historicalSuccess}% success rate
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-600" />
              Volume Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Flow Bias</div>
                  <Badge 
                    variant="outline"
                    className={
                      analysis.analysis.volumeProfile.accumulation
                        ? 'text-green-600'
                        : analysis.analysis.volumeProfile.distribution
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }
                  >
                    {analysis.analysis.volumeProfile.accumulation ? 'ACCUMULATION' :
                     analysis.analysis.volumeProfile.distribution ? 'DISTRIBUTION' : 'NEUTRAL'}
                  </Badge>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">C/P Ratio</div>
                  <div className="font-semibold">
                    {analysis.analysis.volumeProfile.unusualActivity.ratio.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2">Unusual Activity</div>
                <div className="space-y-1">
                  {analysis.analysis.volumeProfile.unusualActivity.calls && (
                    <Badge variant="outline" className="text-green-600">
                      Unusual Call Volume
                    </Badge>
                  )}
                  {analysis.analysis.volumeProfile.unusualActivity.puts && (
                    <Badge variant="outline" className="text-red-600">
                      Unusual Put Volume
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scaling Strategy */}
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-green-600" />
            Elite Scaling Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Entry Stages */}
            <div>
              <h4 className="font-medium text-green-800 mb-3">Entry Strategy</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-800 mb-1">Initial Entry</div>
                  <div className="text-xl font-bold text-green-900">
                    {(analysis.analysis.recommendedStrategy.entryStages.initial.size * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-green-600">
                    {analysis.analysis.recommendedStrategy.entryStages.initial.strike}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {analysis.analysis.recommendedStrategy.entryStages.initial.trigger}
                  </div>
                </div>

                {analysis.analysis.recommendedStrategy.entryStages.scaling.map((stage, i) => (
                  <div key={i} className="bg-white/70 rounded-lg p-3">
                    <div className="text-sm font-medium text-green-800 mb-1">Scale In {i + 1}</div>
                    <div className="text-xl font-bold text-green-900">
                      {(stage.size * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-green-600">
                      {stage.strike}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {stage.trigger}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exit Strategy */}
            <div>
              <h4 className="font-medium text-blue-800 mb-3">Exit Strategy</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {analysis.analysis.recommendedStrategy.exitStages.targets.map((target, i) => (
                  <div key={i} className="bg-white/70 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-800 mb-1">Target {i + 1}</div>
                    <div className="text-xl font-bold text-blue-900">
                      +{target.percentage}%
                    </div>
                    <div className="text-sm text-blue-600">
                      Scale {(target.size * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Move stop to +{target.adjustStopTo}%
                    </div>
                  </div>
                ))}

                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-800 mb-1">Final Target</div>
                  <div className="text-xl font-bold text-blue-900">
                    +{analysis.analysis.recommendedStrategy.exitStages.finalTarget.percentage}%
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {analysis.analysis.recommendedStrategy.exitStages.finalTarget.condition}
                  </div>
                </div>
              </div>
            </div>

            {/* Hedge Rules */}
            <div>
              <h4 className="font-medium text-purple-800 mb-3">Hedge Strategy</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-sm font-medium text-purple-800 mb-1">Initial Hedge</div>
                  <div className="text-xl font-bold text-purple-900">
                    {(analysis.analysis.recommendedStrategy.hedgeRules.initialHedge.size * 100).toFixed(0)}% {analysis.analysis.recommendedStrategy.hedgeRules.initialHedge.type}
                  </div>
                  <div className="text-sm text-purple-600">
                    {analysis.analysis.recommendedStrategy.hedgeRules.initialHedge.strike}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    When: {analysis.analysis.recommendedStrategy.hedgeRules.initialHedge.when}
                  </div>
                </div>

                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-sm font-medium text-purple-800 mb-1">Hedge Adjustments</div>
                  <div className="space-y-2">
                    {analysis.analysis.recommendedStrategy.hedgeRules.adjustHedge.map((rule, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-purple-600">When {rule.trigger}:</span>
                        <br />
                        <span className="font-medium">{rule.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Risks */}
      {analysis.analysis.probabilityAssessment.keyRisks.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Key Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.analysis.probabilityAssessment.keyRisks.map((risk, i) => (
                <div key={i} className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 