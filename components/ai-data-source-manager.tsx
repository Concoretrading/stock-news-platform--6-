"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Twitter, Globe, Calendar, FileText, Settings, RefreshCw } from "lucide-react";

interface DataSource {
  id: string;
  stockTicker: string;
  sourceType: string;
  sourceName: string;
  sourceUrl?: string;
  sourceIdentifier?: string;
  reliabilityScore: number;
  isActive: boolean;
  lastChecked?: string;
  checkFrequencyMinutes: number;
}

interface QueueItem {
  id: string;
  stockTicker: string;
  contentType: string;
  processingStatus: string;
  createdAt: string;
  processedAt?: string;
  confidenceScore?: number;
  eventsFound?: number;
}

export function AIDataSourceManager() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSource, setAddingSource] = useState(false);
  const { toast } = useToast();

  // Form state for adding new source
  const [newSource, setNewSource] = useState({
    stockTicker: "",
    sourceType: "",
    sourceName: "",
    sourceUrl: "",
    sourceIdentifier: "",
    reliabilityScore: 0.8
  });

  useEffect(() => {
    loadDataSources();
    loadQueueItems();
  }, []);

  const loadDataSources = async () => {
    try {
      const response = await fetchWithAuth('/api/ai-data-sources');
      if (response.ok) {
        const data = await response.json();
        setDataSources(data.sources || []);
      }
    } catch (error) {
      console.error('Error loading data sources:', error);
      toast({
        title: "Error",
        description: "Failed to load data sources",
        variant: "destructive",
      });
    }
  };

  const loadQueueItems = async () => {
    try {
      const response = await fetchWithAuth('/api/ai-process-content');
      if (response.ok) {
        const data = await response.json();
        setQueueItems(data.queueItems || []);
      }
    } catch (error) {
      console.error('Error loading queue items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDataSource = async () => {
    try {
      setAddingSource(true);
      const response = await fetchWithAuth('/api/ai-data-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message,
        });
        setNewSource({
          stockTicker: "",
          sourceType: "",
          sourceName: "",
          sourceUrl: "",
          sourceIdentifier: "",
          reliabilityScore: 0.8
        });
        loadDataSources();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding data source:', error);
      toast({
        title: "Error",
        description: "Failed to add data source",
        variant: "destructive",
      });
    } finally {
      setAddingSource(false);
    }
  };

  const removeDataSource = async (sourceId: string) => {
    try {
      const response = await fetchWithAuth(`/api/ai-data-sources?id=${sourceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message,
        });
        loadDataSources();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing data source:', error);
      toast({
        title: "Error",
        description: "Failed to remove data source",
        variant: "destructive",
      });
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'twitter_handle': return <Twitter className="h-4 w-4" />;
      case 'company_website': return <Globe className="h-4 w-4" />;
      case 'earnings_calendar': return <Calendar className="h-4 w-4" />;
      case 'press_release': return <FileText className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'processing': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      case 'no_events_found': return 'bg-gray-600';
      default: return 'bg-blue-600';
    }
  };

  const groupedSources = dataSources.reduce((acc, source) => {
    if (!acc[source.stockTicker]) {
      acc[source.stockTicker] = [];
    }
    acc[source.stockTicker].push(source);
    return acc;
  }, {} as Record<string, DataSource[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading AI data sources...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-200">AI Data Source Manager</h2>
          <p className="text-gray-400">Manage data sources for AI-powered event detection</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Data Source
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Data Source</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="stockTicker">Stock Ticker</Label>
                <Input
                  id="stockTicker"
                  value={newSource.stockTicker}
                  onChange={(e) => setNewSource({...newSource, stockTicker: e.target.value.toUpperCase()})}
                  placeholder="AAPL"
                />
              </div>
              <div>
                <Label htmlFor="sourceType">Source Type</Label>
                <Select value={newSource.sourceType} onValueChange={(value) => setNewSource({...newSource, sourceType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter_handle">Twitter Handle</SelectItem>
                    <SelectItem value="company_website">Company Website</SelectItem>
                    <SelectItem value="earnings_calendar">Earnings Calendar</SelectItem>
                    <SelectItem value="press_release">Press Release</SelectItem>
                    <SelectItem value="sec_filing">SEC Filing</SelectItem>
                    <SelectItem value="analyst_report">Analyst Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sourceName">Source Name</Label>
                <Input
                  id="sourceName"
                  value={newSource.sourceName}
                  onChange={(e) => setNewSource({...newSource, sourceName: e.target.value})}
                  placeholder="Apple Newsroom"
                />
              </div>
              <div>
                <Label htmlFor="sourceUrl">Source URL (Optional)</Label>
                <Input
                  id="sourceUrl"
                  value={newSource.sourceUrl}
                  onChange={(e) => setNewSource({...newSource, sourceUrl: e.target.value})}
                  placeholder="https://www.apple.com/newsroom/"
                />
              </div>
              <div>
                <Label htmlFor="sourceIdentifier">Source Identifier (Optional)</Label>
                <Input
                  id="sourceIdentifier"
                  value={newSource.sourceIdentifier}
                  onChange={(e) => setNewSource({...newSource, sourceIdentifier: e.target.value})}
                  placeholder="@Apple or RSS feed URL"
                />
              </div>
              <div>
                <Label htmlFor="reliabilityScore">Reliability Score (0-1)</Label>
                <Input
                  id="reliabilityScore"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={newSource.reliabilityScore}
                  onChange={(e) => setNewSource({...newSource, reliabilityScore: parseFloat(e.target.value)})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setAddingSource(false)}>
                  Cancel
                </Button>
                <Button onClick={addDataSource} disabled={addingSource}>
                  {addingSource ? 'Adding...' : 'Add Source'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="sources" className="w-full">
        <TabsList>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="queue">Processing Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          {Object.entries(groupedSources).map(([ticker, sources]) => (
            <Card key={ticker}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{ticker}</span>
                  <Badge variant="outline">{sources.length} sources</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {sources.map((source) => (
                    <div key={source.id} className="flex items-center justify-between p-3 bg-gray-800/60 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getSourceIcon(source.sourceType)}
                        <div>
                          <div className="font-semibold text-gray-200">{source.sourceName}</div>
                          <div className="text-sm text-gray-400">{source.sourceType.replace('_', ' ')}</div>
                          {source.sourceUrl && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">{source.sourceUrl}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {(source.reliabilityScore * 100).toFixed(0)}% reliable
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDataSource(source.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Processing Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {queueItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800/60 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-200">{item.stockTicker}</div>
                      <div className="text-sm text-gray-400">{item.contentType}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(item.processingStatus)}>
                        {item.processingStatus}
                      </Badge>
                      {item.confidenceScore && (
                        <Badge variant="secondary">
                          {(item.confidenceScore * 100).toFixed(0)}% confidence
                        </Badge>
                      )}
                      {item.eventsFound !== undefined && (
                        <Badge variant="outline">
                          {item.eventsFound} events found
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {queueItems.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    No items in processing queue
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 