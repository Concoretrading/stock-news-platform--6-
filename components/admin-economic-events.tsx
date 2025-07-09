'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, FileText, CheckCircle } from 'lucide-react';

interface ProcessedEvent {
  date: string;
  time: string;
  event_name: string;
  description: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
}

export default function AdminEconomicEvents() {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedEvent[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleProcess = async () => {
    if (!text.trim()) {
      setError('Please paste some text to process');
      return;
    }

    setIsProcessing(true);
    setError('');
    setResults([]);
    setMessage('');

    try {
      const response = await fetch('/api/process-economic-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process events');
      }

      setResults(data.events || []);
      setMessage(data.message || 'Events processed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setText('');
    setResults([]);
    setMessage('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Economic Events Text Processor
          </CardTitle>
          <CardDescription>
            Copy and paste MarketWatch economic calendar articles or text to automatically extract and add events to your calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="economic-text" className="block text-sm font-medium mb-2">
              Paste MarketWatch Article or Economic Calendar Text
            </label>
            <Textarea
              id="economic-text"
              placeholder="Paste your MarketWatch economic calendar article or text here...

Example:
This Week's Major U.S. Economic Reports & Fed Speakers
Time (ET)	Report	Period	Actual	Median Forecast	Previous
TUESDAY, JULY 15
8:30 am	Consumer price index	June	0.1%
8:30 am	CPI year over year	2.3%
2:00 pm	Fed Beige Book
..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleProcess} 
              disabled={isProcessing || !text.trim()}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Extract Events
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={isProcessing}
            >
              Clear
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Events ({results.length})</CardTitle>
            <CardDescription>
              These events have been added to your Events calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((event, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{event.event_name}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          event.importance === 'HIGH' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : event.importance === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {event.importance}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{event.date}</span> at {event.time}
                      </div>
                      <div className="text-sm mt-1">{event.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 