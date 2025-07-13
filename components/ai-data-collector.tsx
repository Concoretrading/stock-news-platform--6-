import React from "react";
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, Globe, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

interface DataCollectionResults {
  ownData: { processed: number; eventsFound: number };
  websiteScan: { processed: number; eventsFound: number };
  earningsTranscripts: { processed: number; eventsFound: number };
  totalEvents: number;
}

interface MonitoringStock {
  stockTicker: string;
  isActive: boolean;
  createdAt: string;
}

export default function AIDataCollector() {
  const { user, firebaseUser } = useAuth();
  const [monitoringStocks, setMonitoringStocks] = useState<MonitoringStock[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionResults, setCollectionResults] = useState<Record<string, DataCollectionResults>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchMonitoringStocks = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await fetch('/api/ai-monitoring', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMonitoringStocks(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Error fetching monitoring stocks:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMonitoringStocks();
    }
  }, [user, fetchMonitoringStocks]);

  const collectDataForStock = async (stockTicker: string) => {
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await fetch('/api/ai-data-collector', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stockTicker })
      });

      if (response.ok) {
        const data = await response.json();
        setCollectionResults(prev => ({
          ...prev,
          [stockTicker]: data.results
        }));
        setSuccess(`Data collection completed for ${stockTicker}`);
        return data.results;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to collect data');
      }
    } catch (error) {
      console.error('Error collecting data:', error);
      setError(`Failed to collect data for ${stockTicker}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  const collectDataForAllStocks = async () => {
    setIsCollecting(true);
    setError(null);
    setSuccess(null);

    const activeStocks = monitoringStocks.filter(stock => stock.isActive);
    
    if (activeStocks.length === 0) {
      setError('No active AI monitoring stocks found');
      setIsCollecting(false);
      return;
    }

    try {
      for (const stock of activeStocks) {
        console.log(`Collecting data for ${stock.stockTicker}...`);
        await collectDataForStock(stock.stockTicker);
        // Small delay between stocks to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setSuccess(`Data collection completed for all ${activeStocks.length} stocks`);
    } catch (error) {
      console.error('Error in bulk data collection:', error);
    } finally {
      setIsCollecting(false);
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'ownData': return <Database className="h-4 w-4" />;
      case 'websiteScan': return <Globe className="h-4 w-4" />;
      case 'earningsTranscripts': return <FileText className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getPhaseName = (phase: string) => {
    switch (phase) {
      case 'ownData': return 'Our Data';
      case 'websiteScan': return 'Website Scan';
      case 'earningsTranscripts': return 'Earnings Transcripts';
      default: return phase;
    }
  };

  if (!user || user.email !== 'handrigannick@gmail.com') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            AI Data Collector
          </CardTitle>
          <CardDescription>
            Admin access required to manage AI data collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This feature is only available to administrators.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            AI Data Collector
          </CardTitle>
          <CardDescription>
            Collect and process data from multiple sources for AI event detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Active Monitoring Stocks</p>
              <p className="text-sm text-muted-foreground">
                {monitoringStocks.filter(s => s.isActive).length} stocks being monitored
              </p>
            </div>
            <Button 
              onClick={collectDataForAllStocks} 
              disabled={isCollecting || monitoringStocks.filter(s => s.isActive).length === 0}
              className="flex items-center gap-2"
            >
              {isCollecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Collecting...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Collect All Data
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {isCollecting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing data collection...</span>
                <span className="text-muted-foreground">This may take a few minutes</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Stock Results */}
      {Object.keys(collectionResults).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Collection Results</h3>
          {Object.entries(collectionResults).map(([stockTicker, results]) => (
            <Card key={stockTicker}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{stockTicker}</span>
                  <Badge variant="secondary">
                    {results.totalEvents} events found
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(results).filter(([key]) => key !== 'totalEvents').map(([phase, data]) => (
                    <div key={phase} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {getPhaseIcon(phase)}
                        {getPhaseName(phase)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>Processed: {data.processed}</div>
                        <div>Events: {data.eventsFound}</div>
                      </div>
                      {data.eventsFound > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {data.eventsFound} events detected
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Active Monitoring Stocks List */}
      {monitoringStocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active AI Monitoring Stocks</CardTitle>
            <CardDescription>
              Stocks currently being monitored for AI event detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {monitoringStocks.filter(stock => stock.isActive).map(stock => (
                <div key={stock.stockTicker} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{stock.stockTicker}</span>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 