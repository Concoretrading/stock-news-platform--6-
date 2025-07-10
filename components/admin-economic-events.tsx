'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { parseMarketWatchData, validateMarketWatchData, EconomicEvent } from '@/lib/services/economic-events-parser';

interface PreviewEvent {
  id: string;
  date: string;
  time: string;
  event: string;
  country: string;
  currency: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  iconUrl?: string;
}

export default function AdminEconomicEvents() {
  const [rawData, setRawData] = useState('');
  const [previewEvents, setPreviewEvents] = useState<PreviewEvent[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    events?: PreviewEvent[];
  } | null>(null);

  const handlePreview = () => {
    console.log('🔍 Preview button clicked');
    console.log('📝 Raw data:', rawData);
    
    if (!rawData.trim()) {
      console.log('❌ No raw data');
      setValidationErrors(['Please enter MarketWatch economic calendar data']);
      setPreviewEvents([]);
      return;
    }

    console.log('✅ Raw data exists, validating...');
    const validation = validateMarketWatchData(rawData);
    console.log('🔍 Validation result:', validation);
    
    if (!validation.isValid) {
      console.log('❌ Validation failed:', validation.errors);
      setValidationErrors(validation.errors);
      setPreviewEvents([]);
      return;
    }

    console.log('✅ Validation passed, parsing events...');
    const events = parseMarketWatchData(rawData);
    console.log('📊 Parsed events:', events);
    
    setPreviewEvents(events);
    setValidationErrors([]);
    console.log('✅ Preview events set:', events.length, 'events');
  };

  const handleUpload = async () => {
    if (previewEvents.length === 0) {
      setValidationErrors(['Please preview events before uploading']);
      return;
    }

    setIsProcessing(true);
    setUploadResult(null);

    try {
      const response = await fetch('/api/process-economic-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawData }),
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          message: result.message,
          events: result.events
        });
        setRawData('');
        setPreviewEvents([]);
      } else {
        setUploadResult({
          success: false,
          message: result.error || 'Upload failed'
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Network error occurred'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Economic Events Upload
          </CardTitle>
          <CardDescription>
            Paste MarketWatch economic calendar data to automatically parse and upload events to the calendar.
            The data should be tab-separated with columns: Date/Time, Event, Country, Currency, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">MarketWatch Economic Calendar Data</label>
            <Textarea
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              placeholder="Paste MarketWatch economic calendar data here...
Example format:
Monday, Jan 15, 2024 8:30 AM	Consumer Price Index	United States	USD	0.3%	0.2%	0.1%
Monday, Jan 15, 2024 10:00 AM	Retail Sales	United States	USD	0.4%	0.3%	0.2%"
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={handlePreview} disabled={!rawData.trim()}>
              Preview Events
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={previewEvents.length === 0 || isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Events
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {uploadResult && (
        <Alert variant={uploadResult.success ? "default" : "destructive"}>
          {uploadResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{uploadResult.message}</AlertDescription>
        </Alert>
      )}

      {previewEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Events ({previewEvents.length})</CardTitle>
            <CardDescription>
              Review the parsed events before uploading to the calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {previewEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {event.iconUrl && (
                      <img 
                        src={event.iconUrl} 
                        alt={event.event}
                        className="w-8 h-8 rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <div className="font-medium">{event.event}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(event.date)} at {event.time} • {event.country} ({event.currency})
                      </div>
                    </div>
                  </div>
                  <Badge className={getImportanceColor(event.importance)}>
                    {event.importance}
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