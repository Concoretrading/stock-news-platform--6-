import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import AdminEconomicEvents from '@/components/admin-economic-events';
import { FileText, Camera, Clipboard } from 'lucide-react';

// Allow any authenticated user to upload earnings calendar
// You can restrict this to specific UIDs later if needed

export function AdminCalendarUpload() {
  const { user, firebaseUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<any[]>([]);
  const [pastedText, setPastedText] = useState('');

  // Allow any authenticated user to upload earnings calendar

  // Not logged in
  if (!user) {
    return (
      <Card className="p-4">
        <h2 className="text-xl font-bold mb-4">Please Log In</h2>
        <p>You need to be logged in to access this feature.</p>
      </Card>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai-calendar-events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await firebaseUser?.getIdToken()}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process screenshot');
      }

      // Transform events to match earnings_calendar format
      const transformedEvents = data.events.map((event: any) => ({
        ...event,
        earningsDate: event.eventDate,
        earningsType: 'BMO', // Default to Before Market Open
        isConfirmed: true,
        estimatedEPS: null,
        estimatedRevenue: null,
        conferenceCallUrl: null
      }));

      setPreviewEvents(transformedEvents);
      toast.success(`Found ${transformedEvents.length} earnings events`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process screenshot');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasteProcess = async () => {
    if (!pastedText.trim()) {
      toast.error('Please paste some text to process');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch('/api/ai-calendar-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await firebaseUser?.getIdToken()}`
        },
        body: JSON.stringify({ 
          text: pastedText.trim(),
          mode: 'text' // Indicate this is text processing, not file upload
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process pasted text');
      }

      setPreviewEvents(data.events || []);
      toast.success(`Found ${data.events?.length || 0} earnings events`);
    } catch (error) {
      console.error('Paste processing error:', error);
      toast.error('Failed to process pasted text');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setPastedText('');
    setPreviewEvents([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Admin Calendar Management</h1>
        <p className="text-muted-foreground">
          Manage your economic events and earnings calendar data
        </p>
      </div>

      <Tabs defaultValue="economic-events" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="economic-events" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Economic Events
          </TabsTrigger>
          <TabsTrigger value="earnings-screenshots" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Earnings Screenshots
          </TabsTrigger>
        </TabsList>

        <TabsContent value="economic-events">
          <AdminEconomicEvents />
        </TabsContent>

        <TabsContent value="earnings-screenshots">
          <div className="space-y-6">
            {/* File Upload Section */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Upload Earnings Calendar Screenshots
              </h2>
              <p className="text-muted-foreground mb-4">
                Upload screenshots from EarningsHub or other earnings calendars to automatically extract company earnings data
              </p>
              <div className="space-y-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {isUploading && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Processing screenshot with AI...
                  </div>
                )}
              </div>
            </Card>

            {/* Paste Text Section */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clipboard className="h-5 w-5" />
                Paste Earnings Data
              </h2>
              <p className="text-muted-foreground mb-4">
                Copy and paste earnings data from EarningsHub or other sources to automatically extract company earnings information
              </p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="earnings-text" className="block text-sm font-medium mb-2">
                    Paste Earnings Data
                  </label>
                  <Textarea
                    id="earnings-text"
                    placeholder="Paste your earnings data here...

Example:
AAPL - Apple Inc. - Earnings Call - Jan 28, 2025
MSFT - Microsoft Corporation - Earnings Report - Jan 29, 2025
GOOGL - Alphabet Inc. - Earnings Call - Feb 3, 2025
..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    rows={8}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handlePasteProcess} 
                    disabled={isProcessing || !pastedText.trim()}
                    className="flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-4 w-4" />
                        Extract Earnings
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
              </div>
            </Card>

            {/* Results Section */}
            {previewEvents.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Detected Earnings Events ({previewEvents.length}):</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  {previewEvents.map((event, i) => (
                    <div key={i} className="text-sm border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">
                      <div className="font-medium">{event.companyName} ({event.stockTicker})</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {new Date(event.earningsDate).toLocaleDateString()} - {event.earningsType}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 