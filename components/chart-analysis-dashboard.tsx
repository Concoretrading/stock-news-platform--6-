'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Upload, TrendingUp, BarChart3, Target, Activity, Zap } from 'lucide-react';

interface PatternAnalysis {
  pattern: string;
  confidence: number;
  keyLevels: number[];
  breakoutProbability: number;
  volume: 'high' | 'medium' | 'low';
  momentum: 'building' | 'firing' | 'cooling';
}

interface AIFeedback {
  alignment: number;
  suggestions: string[];
  confidence: number;
  patterns: string[];
}

export default function ChartAnalysisDashboard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<PatternAnalysis>({
    pattern: '',
    confidence: 75,
    keyLevels: [],
    breakoutProbability: 65,
    volume: 'medium',
    momentum: 'building'
  });
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [newLevel, setNewLevel] = useState('');
  const [notes, setNotes] = useState('');

  const patterns = [
    'Bullish Flag',
    'Bear Flag', 
    'Triangle Consolidation',
    'Rectangle Range',
    'Ascending Triangle',
    'Descending Triangle'
  ];

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const addKeyLevel = () => {
    if (newLevel && !isNaN(Number(newLevel))) {
      setAnalysis(prev => ({
        ...prev,
        keyLevels: [...prev.keyLevels, Number(newLevel)].sort((a, b) => b - a)
      }));
      setNewLevel('');
    }
  };

  const removeKeyLevel = (level: number) => {
    setAnalysis(prev => ({
      ...prev,
      keyLevels: prev.keyLevels.filter(l => l !== level)
    }));
  };

  const submitAnalysis = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('chart', selectedFile);
      formData.append('analysis', JSON.stringify({ ...analysis, notes }));

      const response = await fetch('/api/analyze-chart', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setAiFeedback(data.aiFeedback);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    }
    setLoading(false);
  };

  const generateMockFeedback = () => {
    const mockFeedback: AIFeedback = {
      alignment: Math.round(75 + Math.random() * 20),
      suggestions: [
        'Consider the volume confirmation at breakout level',
        'Monitor RSI for momentum divergence',
        'Watch for institutional accumulation patterns'
      ],
      confidence: Math.round(65 + Math.random() * 25),
      patterns: ['Bullish Flag', 'Volume Expansion']
    };
    setAiFeedback(mockFeedback);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">AI Chart Analysis</h1>
        <p className="text-gray-600">Upload charts and get AI-powered breakout analysis</p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Chart Analysis</TabsTrigger>
          <TabsTrigger value="feedback">AI Feedback</TabsTrigger>
          <TabsTrigger value="history">Analysis History</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Chart
                </CardTitle>
                <CardDescription>
                  Select a chart screenshot for analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="chart-upload"
                  />
                  <label
                    htmlFor="chart-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="h-12 w-12 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : 'Click to upload chart image'}
                    </div>
                  </label>
                </div>

                {selectedFile && (
                  <div className="text-sm text-green-600 font-medium">
                    ✓ {selectedFile.name} selected
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pattern Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Pattern Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pattern Type</Label>
                  <Select 
                    value={analysis.pattern} 
                    onValueChange={(value) => setAnalysis(prev => ({...prev, pattern: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      {patterns.map(pattern => (
                        <SelectItem key={pattern} value={pattern}>{pattern}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Confidence: {analysis.confidence}%</Label>
                  <Slider
                    value={[analysis.confidence]}
                    onValueChange={(value) => setAnalysis(prev => ({...prev, confidence: value[0]}))}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Breakout Probability: {analysis.breakoutProbability}%</Label>
                  <Slider
                    value={[analysis.breakoutProbability]}
                    onValueChange={(value) => setAnalysis(prev => ({...prev, breakoutProbability: value[0]}))}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Levels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Key Price Levels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter price level (e.g., 208.50)"
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyLevel()}
                />
                <Button onClick={addKeyLevel}>Add Level</Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {analysis.keyLevels.map((level, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => removeKeyLevel(level)}
                  >
                    ${level.toFixed(2)} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Volume & Momentum */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Volume Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={analysis.volume} 
                  onValueChange={(value: 'high' | 'medium' | 'low') => 
                    setAnalysis(prev => ({...prev, volume: value}))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Volume</SelectItem>
                    <SelectItem value="medium">Medium Volume</SelectItem>
                    <SelectItem value="low">Low Volume</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Momentum State
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={analysis.momentum} 
                  onValueChange={(value: 'building' | 'firing' | 'cooling') => 
                    setAnalysis(prev => ({...prev, momentum: value}))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="firing">Firing</SelectItem>
                    <SelectItem value="cooling">Cooling</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any additional observations or context..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button 
              onClick={submitAnalysis} 
              disabled={!selectedFile || loading}
              className="flex-1"
            >
              {loading ? 'Analyzing...' : 'Submit for AI Analysis'}
            </Button>
            <Button 
              onClick={generateMockFeedback} 
              variant="outline"
            >
              Generate Demo Feedback
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {aiFeedback ? (
            <div className="space-y-6">
              {/* AI Alignment Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    AI Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{aiFeedback.alignment}%</div>
                      <div className="text-sm text-gray-600">AI Alignment</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{aiFeedback.confidence}%</div>
                      <div className="text-sm text-gray-600">AI Confidence</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>AI Identified Patterns</Label>
                    <div className="flex flex-wrap gap-2">
                      {aiFeedback.patterns.map((pattern, index) => (
                        <Badge key={index} variant="outline">{pattern}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>AI Suggestions</Label>
                    <ul className="space-y-1">
                      {aiFeedback.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Submit a chart analysis to see AI feedback</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analysis History</CardTitle>
              <CardDescription>Your recent chart analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { ticker: 'AAPL', pattern: 'Bullish Flag', confidence: 85, date: '2024-01-15' },
                  { ticker: 'TSLA', pattern: 'Triangle Consolidation', confidence: 72, date: '2024-01-14' },
                  { ticker: 'NVDA', pattern: 'Ascending Triangle', confidence: 91, date: '2024-01-13' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{item.ticker} - {item.pattern}</div>
                      <div className="text-sm text-gray-600">{item.date}</div>
                    </div>
                    <Badge variant={item.confidence > 80 ? 'default' : 'secondary'}>
                      {item.confidence}% confidence
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 