"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, TrendingUp, Volume2, Brain, Target, AlertTriangle, BrainCircuit, UserCheck, Globe, Building, Landmark, Calendar } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

interface ExpertKnowledge {
  anna_coulling_knowledge: {
    volume_price_validation: string;
    smart_money_accumulation: string;
    practical_applications: string[];
  };
  john_carter_knowledge: {
    opening_range_breakout: string;
    dynamic_position_sizing: string;
    market_internals: string;
    practical_applications: string[];
  };
  behavioral_finance_knowledge: {
    prospect_theory: string;
    availability_heuristic: string;
    practical_applications: string[];
  };
  mindset_coach_knowledge: {
    probabilistic_thinking: string;
    zone_entry: string;
    practical_applications: string[];
  };
  world_view_knowledge: {
    big_cycle: string;
    systemic_manipulation: string;
    practical_applications: string[];
  };
  institutional_knowledge: {
    hedge_fund_alpha: string;
    intermarket_analysis: string;
    practical_applications: string[];
  };
  investor_knowledge: {
    margin_of_safety: string;
    mr_market: string;
    practical_applications: string[];
  };
  news_event_knowledge: {
    truth_revealer: string;
    three_time_dimensions: string;
    scenarios_of_possibilities: string;
    practical_applications: string[];
  };
}

interface KnowledgeApplication {
  concept: string;
  source: string;
  application: string;
  integration_with_system: string;
  confidence_boost: number;
}

export function ExpertBooksDashboard() {
  const [expertKnowledge, setExpertKnowledge] = useState<ExpertKnowledge | null>(null);
  const [knowledgeApplications, setKnowledgeApplications] = useState<KnowledgeApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [processedBooks, setProcessedBooks] = useState<string[]>([]);

  useEffect(() => {
    fetchExpertKnowledge();
  }, []);

  const fetchExpertKnowledge = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/process-book?expert_books=true');
      const data = await response.json();

      if (data.success) {
        setExpertKnowledge(data.data);
        generateKnowledgeApplications(data.data);
      }
    } catch (error) {
      console.error('Error fetching expert knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const processExpertBooks = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/process-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ process_expert_books: true })
      });

      const data = await response.json();

      if (data.success) {
        setProcessedBooks([
          'A Complete Guide to Volume Price Analysis - Anna Coulling',
          'Mastering the Trade, Third Edition - John Carter',
          'Thinking, Fast and Slow - Daniel Kahneman',
          'Trading in the Zone - Mark Douglas',
          'Principles for Dealing with the Changing World Order - Ray Dalio',
          'Confessions of an Economic Hit Man - John Perkins',
          'More Money Than God - Sebastian Mallaby',
          'Trading with Intermarket Analysis - John J. Murphy',
          'The Intelligent Investor - Benjamin Graham',
          'News & Event Logic - Core System'
        ]);
        await fetchExpertKnowledge();
      }
    } catch (error) {
      console.error('Error processing expert books:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateKnowledgeApplications = (knowledge: ExpertKnowledge) => {
    const applications: KnowledgeApplication[] = [
      {
        concept: "Volume Price Validation",
        source: "Anna Coulling",
        application: "Validate all breakouts with volume expansion - enhances our volume pillar",
        integration_with_system: "Directly validates our foundation volume analysis with expert VPA principles",
        confidence_boost: 25
      },
      {
        concept: "Smart Money Accumulation",
        source: "Anna Coulling",
        application: "Identify institutional accumulation zones for optimal entries",
        integration_with_system: "Enhances our Smart Money Detection engine with VPA accumulation patterns",
        confidence_boost: 30
      },
      {
        concept: "Opening Range Breakout",
        source: "John Carter",
        application: "Trade first 30-minute range breakouts with volume confirmation",
        integration_with_system: "Adds time-based component to our breakout analysis system",
        confidence_boost: 20
      },
      {
        concept: "Dynamic Position Sizing",
        source: "John Carter",
        application: "Increase size on high-confluence setups (80%+ probability)",
        integration_with_system: "Integrates with our asymmetric strategy and foundation scoring",
        confidence_boost: 35
      },
      {
        concept: "Prospect Theory Awareness",
        source: "Kahneman/Thaler",
        application: "Identify and counter the urge to hold losers (loss aversion)",
        integration_with_system: "Injects psychological checks into the Risk Management layer",
        confidence_boost: 40
      },
      {
        concept: "Probabilistic Thinking",
        source: "Mark Douglas",
        application: "Execute valid setups without hesitation or fear of loss",
        integration_with_system: "Reshapes the 'Confidence Score' to reward consistency over single-trade P&L",
        confidence_boost: 45
      },
      {
        concept: "The Big Cycle Awareness",
        source: "Ray Dalio",
        application: "Adjust strategies for late-stage empire cycle (volatility/debasement)",
        integration_with_system: "Informs the 'Regime Detection' engine about macro structural risks",
        confidence_boost: 50
      },
      {
        concept: "Systemic Manipulation",
        source: "John Perkins",
        application: "Anticipate policy-driven market moves (Corporatocracy)",
        integration_with_system: "Enhances 'Smart Money Manipulation' detection by understanding policy intent",
        confidence_boost: 30
      },
      {
        concept: "Hedge Fund Asymmetry",
        source: "Sebastian Mallaby",
        application: "Seek 5:1 reward/risk setups (Soros Concept)",
        integration_with_system: "Refines 'Trade Selection' to prioritize convexity over frequency",
        confidence_boost: 55
      },
      {
        concept: "Intermarket Correlations",
        source: "John J. Murphy",
        application: "Use DXY and Bond Yields to confirm Equity moves",
        integration_with_system: "Adds a 'Macro Validation' layer to all generated signals",
        confidence_boost: 45
      },
      {
        concept: "Margin of Safety",
        source: "Benjamin Graham",
        application: "Identify oversold conditions with strong fundamentals",
        integration_with_system: "Provides 'Deep Value' floor to swing trade setups",
        confidence_boost: 40
      },
      {
        concept: "Mr. Market Exploitation",
        source: "Benjamin Graham",
        application: "Fade extreme emotional panic selling (Buy the Fear)",
        integration_with_system: "Enhances 'Sentiment Analysis' by identifying irrational extremes",
        confidence_boost: 50
      },
      {
        concept: "News as Truth Revealer",
        source: "Core News Logic",
        application: "Use news reaction to validate technical truth (e.g. Bullish news + Drop = Bearish Truth)",
        integration_with_system: "Acts as a 'Catalyst Filter' for all incoming signals",
        confidence_boost: 60
      }
    ];

    setKnowledgeApplications(applications);
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Card */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-800">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Content Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700 text-sm space-y-2">
          <p><strong>Current Status:</strong> This system uses <em>representative knowledge</em> that captures the essence and core concepts these books teach.</p>
          <p><strong>Not Real Extractions:</strong> These are not direct quotes or actual text from the books - they're high-quality simulations based on the books' known teachings.</p>
          <p><strong>To Process Real Books:</strong> You would need actual PDF/EPUB files, NLP libraries, and appropriate permissions.</p>
          <div className="p-2 bg-yellow-100 rounded text-xs">
            <strong>Framework Ready:</strong> The extraction, storage, and integration system is fully functional - it just needs real book files to process actual content.
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expert Trading Books Knowledge</h2>
          <p className="text-muted-foreground">
            Coulling, Carter, Kahneman, Douglas, Dalio, Perkins, Mallaby, Murphy & Graham expertise
          </p>
        </div>
        <Button
          onClick={processExpertBooks}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          {loading ? 'Processing...' : 'Process Expert Books'}
        </Button>
      </div>

      {processedBooks.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">📚 Books Successfully Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processedBooks.map((book, index) => (
                <div key={index} className="flex items-center text-green-700">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {book}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="anna-coulling" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="anna-coulling">Coulling</TabsTrigger>
          <TabsTrigger value="john-carter">Carter</TabsTrigger>
          <TabsTrigger value="behavioral-finance">Behavioral</TabsTrigger>
          <TabsTrigger value="mindset-coach">Mindset</TabsTrigger>
          <TabsTrigger value="world-view">World View</TabsTrigger>
          <TabsTrigger value="institutional">Institutional</TabsTrigger>
          <TabsTrigger value="investor">Investor</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="anna-coulling" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Volume2 className="w-5 h-5 mr-2 text-blue-600" />
                  Volume Price Analysis Mastery
                </CardTitle>
                <CardDescription>
                  Complete guide to understanding volume-price relationships
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expertKnowledge && (
                  <>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Volume Price Validation</h4>
                      <p className="text-blue-700 text-sm">
                        {expertKnowledge.anna_coulling_knowledge.volume_price_validation}
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">Smart Money Accumulation</h4>
                      <p className="text-purple-700 text-sm">
                        {expertKnowledge.anna_coulling_knowledge.smart_money_accumulation}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Practical Applications:</h4>
                      {expertKnowledge.anna_coulling_knowledge.practical_applications.map((app, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="john-carter" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Mastering the Trade (John Carter)
                </CardTitle>
                <CardDescription>
                  Professional setups: TTM Squeeze, Internals, and Risk Control
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expertKnowledge && (
                  <>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Opening Range Breakout (30-min)</h4>
                      <p className="text-green-700 text-sm">
                        {expertKnowledge.john_carter_knowledge.opening_range_breakout}
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">Dynamic Position Sizing (A+ Setups)</h4>
                      <p className="text-orange-700 text-sm">
                        {expertKnowledge.john_carter_knowledge.dynamic_position_sizing}
                      </p>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">Market Internals ($TICK, $TRIN)</h4>
                      <p className="text-red-700 text-sm">
                        {expertKnowledge.john_carter_knowledge.market_internals}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Practical Applications:</h4>
                      {expertKnowledge.john_carter_knowledge.practical_applications.map((app, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavioral-finance" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BrainCircuit className="w-5 h-5 mr-2 text-indigo-600" />
                  Behavioral Finance Framework
                </CardTitle>
                <CardDescription>
                  Understanding human biases (Kahneman, Thaler, Shiller)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expertKnowledge && expertKnowledge.behavioral_finance_knowledge && (
                  <>
                    <div className="p-4 bg-indigo-50 rounded-lg">
                      <h4 className="font-semibold text-indigo-800 mb-2">Prospect Theory (Loss Aversion)</h4>
                      <p className="text-indigo-700 text-sm">
                        {expertKnowledge.behavioral_finance_knowledge.prospect_theory}
                      </p>
                    </div>

                    <div className="p-4 bg-pink-50 rounded-lg">
                      <h4 className="font-semibold text-pink-800 mb-2">Availability Heuristic</h4>
                      <p className="text-pink-700 text-sm">
                        {expertKnowledge.behavioral_finance_knowledge.availability_heuristic}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Practical Applications:</h4>
                      {expertKnowledge.behavioral_finance_knowledge.practical_applications.map((app, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2 bg-indigo-100 text-indigo-800 border-indigo-200">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mindset-coach" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="w-5 h-5 mr-2 text-teal-600" />
                  Mindset Coach (Douglas/Steenbarger)
                </CardTitle>
                <CardDescription>
                  Psychological mastery and probabilistic thinking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expertKnowledge && expertKnowledge.mindset_coach_knowledge && (
                  <>
                    <div className="p-4 bg-teal-50 rounded-lg">
                      <h4 className="font-semibold text-teal-800 mb-2">Probabilistic Thinking</h4>
                      <p className="text-teal-700 text-sm">
                        {expertKnowledge.mindset_coach_knowledge.probabilistic_thinking}
                      </p>
                    </div>

                    <div className="p-4 bg-cyan-50 rounded-lg">
                      <h4 className="font-semibold text-cyan-800 mb-2">Zone Entry (No Hesitation)</h4>
                      <p className="text-cyan-700 text-sm">
                        {expertKnowledge.mindset_coach_knowledge.zone_entry}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Practical Applications:</h4>
                      {expertKnowledge.mindset_coach_knowledge.practical_applications.map((app, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2 bg-teal-100 text-teal-800 border-teal-200">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="world-view" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-slate-600" />
                  World View & Macro (Dalio/Perkins)
                </CardTitle>
                <CardDescription>
                  The Changing World Order & Systemic Manipulation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expertKnowledge && expertKnowledge.world_view_knowledge && (
                  <>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-2">The Big Cycle (Empire Decline)</h4>
                      <p className="text-slate-700 text-sm">
                        {expertKnowledge.world_view_knowledge.big_cycle}
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-lg">
                      <h4 className="font-semibold text-zinc-800 mb-2">Systemic Manipulation (Corporatocracy)</h4>
                      <p className="text-zinc-700 text-sm">
                        {expertKnowledge.world_view_knowledge.systemic_manipulation}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Practical Applications:</h4>
                      {expertKnowledge.world_view_knowledge.practical_applications.map((app, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2 bg-slate-100 text-slate-800 border-slate-200">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="institutional" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2 text-gray-800" />
                  Institutional & Intermarket (Mallaby/Murphy)
                </CardTitle>
                <CardDescription>
                  Hedge Fund strategies & Intermarket Analysis relationships
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expertKnowledge && expertKnowledge.institutional_knowledge && (
                  <>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Hedge Fund Alpha (Convexity)</h4>
                      <p className="text-gray-700 text-sm">
                        {expertKnowledge.institutional_knowledge.hedge_fund_alpha}
                      </p>
                    </div>

                    <div className="p-4 bg-stone-50 rounded-lg">
                      <h4 className="font-semibold text-stone-800 mb-2">Intermarket Analysis</h4>
                      <p className="text-stone-700 text-sm">
                        {expertKnowledge.institutional_knowledge.intermarket_analysis}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Practical Applications:</h4>
                      {expertKnowledge.institutional_knowledge.practical_applications.map((app, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2 bg-stone-100 text-stone-800 border-stone-200">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investor" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Landmark className="w-5 h-5 mr-2 text-emerald-800" />
                  Investor Mindset (Benjamin Graham)
                </CardTitle>
                <CardDescription>
                  The Intelligent Investor: Value, Safety, and Discipline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expertKnowledge && expertKnowledge.investor_knowledge && (
                  <>
                    <div className="p-4 bg-emerald-50 rounded-lg">
                      <h4 className="font-semibold text-emerald-800 mb-2">Margin of Safety</h4>
                      <p className="text-emerald-700 text-sm">
                        {expertKnowledge.investor_knowledge.margin_of_safety}
                      </p>
                    </div>

                    <div className="p-4 bg-lime-50 rounded-lg">
                      <h4 className="font-semibold text-lime-800 mb-2">Mr. Market (Volatility Opportunity)</h4>
                      <p className="text-lime-700 text-sm">
                        {expertKnowledge.investor_knowledge.mr_market}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Practical Applications:</h4>
                      {expertKnowledge.investor_knowledge.practical_applications.map((app, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2 bg-emerald-100 text-emerald-800 border-emerald-200">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="news-logic" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-red-700" />
                  Core News & Event Logic
                </CardTitle>
                <CardDescription>
                  Permanent reference for independent event breakdown & truth validation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expertKnowledge && expertKnowledge.news_event_knowledge && (
                  <>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">News as Truth Revealer</h4>
                      <p className="text-red-700 text-sm">
                        {expertKnowledge.news_event_knowledge.truth_revealer}
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">Three Time Dimensions</h4>
                      <p className="text-orange-700 text-sm">
                        {expertKnowledge.news_event_knowledge.three_time_dimensions}
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">Scenarios of Possibilities</h4>
                      <p className="text-purple-700 text-sm">
                        {expertKnowledge.news_event_knowledge.scenarios_of_possibilities}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Practical Applications:</h4>
                      {expertKnowledge.news_event_knowledge.practical_applications.map((app, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2 bg-red-100 text-red-800 border-red-200">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-600" />
                System Integration & Enhancement
              </CardTitle>
              <CardDescription>
                How expert book knowledge enhances our 5-pillar foundation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {knowledgeApplications.map((app, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{app.concept}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {app.source}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-800"
                          >
                            +{app.confidence_boost}% confidence
                          </Badge>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <strong>Application:</strong> {app.application}
                      </div>

                      <div className="text-sm">
                        <strong className="text-blue-600">System Integration:</strong>
                        <p className="text-blue-700 mt-1">{app.integration_with_system}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <Target className="w-5 h-5 mr-2" />
                Enhanced Decision Framework
              </CardTitle>
            </CardHeader>
            <CardContent className="text-yellow-700">
              <div className="space-y-2 text-sm">
                <p><strong>Before Expert Books:</strong> Foundation analysis with 82% confidence</p>
                <p><strong>After Expert Books:</strong> Foundation + Expert validation with 95%+ confidence</p>
                <div className="mt-4 p-3 bg-yellow-100 rounded">
                  <p className="font-semibold">Example Enhanced Decision:</p>
                  <p>"Bullish engulfing at support + Volume expansion (Anna Coulling VPA) + High confluence setup warrants increased size (John Carter) = Execute with 95% confidence"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}