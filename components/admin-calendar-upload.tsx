import { useState, useRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import AdminEconomicEvents from '@/components/admin-economic-events';
import { AdminEarningsUpload } from '@/components/admin-earnings-upload';
import { FileText, Camera, Clipboard, Image } from 'lucide-react';

// Allow any authenticated user to upload earnings calendar
// You can restrict this to specific UIDs later if needed

export function AdminCalendarUpload() {
  const { user, firebaseUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<any[]>([]);
  const [pastedText, setPastedText] = useState('');
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

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

  const handleScreenshotPaste = async (imageBlob: Blob) => {
    try {
      setIsPasting(true);
      const formData = new FormData();
      formData.append('file', imageBlob, 'screenshot.png');

      const response = await fetch('/api/ai-calendar-events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await firebaseUser?.getIdToken()}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process pasted screenshot');
      }

      setPreviewEvents(data.events || []);
      toast.success(`Found ${data.events?.length || 0} earnings events`);
    } catch (error) {
      console.error('Screenshot paste error:', error);
      toast.error('Failed to process pasted screenshot');
    } finally {
      setIsPasting(false);
    }
  };

  const handlePasteAreaClick = () => {
    pasteAreaRef.current?.focus();
  };

  const handlePasteAreaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleClipboardPaste();
    }
  };

  const handleClipboardPaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            setPastedImage(URL.createObjectURL(blob));
            await handleScreenshotPaste(blob);
            return;
          }
        }
      }
      
      // If no image found, try to get text
      const text = await navigator.clipboard.readText();
      if (text) {
        setPastedText(text);
        toast.info('Text pasted. Click "Extract Earnings" to process.');
      } else {
        toast.error('No image or text found in clipboard');
      }
    } catch (error) {
      console.error('Clipboard paste error:', error);
      toast.error('Failed to access clipboard. Try uploading a file instead.');
    }
  };

  const handleClear = () => {
    setPastedText('');
    setPastedImage(null);
    setPreviewEvents([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          <AdminEarningsUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
} 