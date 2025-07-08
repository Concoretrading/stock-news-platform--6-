import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Allow any authenticated user to upload earnings calendar
// You can restrict this to specific UIDs later if needed

export function AdminCalendarUpload() {
  const { user, firebaseUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<any[]>([]);

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

  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-4">Upload Earnings Calendar</h2>
      <div className="space-y-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        {isUploading && (
          <div className="text-sm text-muted-foreground">
            Processing screenshot...
          </div>
        )}
        {previewEvents.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Detected Events:</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {previewEvents.map((event, i) => (
                <div key={i} className="text-sm">
                  {event.companyName} ({event.stockTicker}) - {new Date(event.earningsDate).toLocaleDateString()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 