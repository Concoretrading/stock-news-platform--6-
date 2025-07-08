import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Star, Save, Eye, Clipboard } from 'lucide-react';

export function AdminEarningsUpload() {
  const { user, firebaseUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<any[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  const isAdmin = user?.email === 'handrigannick@gmail.com';

  if (!isAdmin) {
    return null; // Don't render anything for non-admin users
  }

  // Add paste event listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleImageUpload(blob);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handleImageUpload = async (file: File) => {
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setUploadedImage(previewUrl);

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin-earnings-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await firebaseUser?.getIdToken()}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process earnings screenshot');
      }

      setPreviewEvents(data.events || []);
      toast.success(`✨ Processed pasted screenshot - found ${data.events?.length || 0} earnings events`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process earnings screenshot');
      setUploadedImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleImageUpload(file);
  };

  const handleSaveEarnings = async () => {
    if (previewEvents.length === 0) {
      toast.error('No earnings events to save');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/save-earnings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await firebaseUser?.getIdToken()}`
        },
        body: JSON.stringify({ events: previewEvents })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save earnings');
      }

      toast.success(`Successfully saved ${previewEvents.length} earnings events for all users to see!`);
      setPreviewEvents([]);
      setUploadedImage(null);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save earnings events');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg">
            <Star className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-light tracking-wide text-amber-800">
            Admin Earnings Upload
          </span>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
            Elite Access
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Paste Area */}
        <div 
          ref={pasteAreaRef}
          className="bg-gradient-to-br from-white to-amber-50 rounded-lg p-8 border-2 border-dashed border-amber-300 hover:border-amber-400 focus:border-amber-500 focus:outline-none transition-colors cursor-pointer"
          tabIndex={0}
          onClick={() => pasteAreaRef.current?.focus()}
        >
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
              <Clipboard className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-amber-800 mb-2">Copy & Paste Earnings Screenshot</h3>
              <p className="text-amber-600 text-sm">
                Copy a screenshot to your clipboard and press <kbd className="px-2 py-1 bg-amber-100 rounded text-xs">Ctrl+V</kbd> or <kbd className="px-2 py-1 bg-amber-100 rounded text-xs">Cmd+V</kbd>
              </p>
            </div>
            {isUploading && (
              <div className="text-sm text-amber-600 flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
                Processing earnings screenshot...
              </div>
            )}
          </div>
        </div>

        {/* Alternative File Upload */}
        <div className="bg-white rounded-lg p-4 border border-amber-200">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Upload className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Or upload a file</span>
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="border-amber-200 focus:border-amber-400 text-sm"
            />
          </div>
        </div>

        {uploadedImage && (
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Uploaded Image Preview
            </h4>
            <img 
              src={uploadedImage} 
              alt="Earnings Screenshot" 
              className="max-w-full h-auto rounded-lg border border-gray-200"
              style={{ maxHeight: '300px' }}
            />
          </div>
        )}

        {previewEvents.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <h4 className="font-medium text-amber-800 mb-3">Detected Earnings Events:</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {previewEvents.map((event, i) => (
                <div key={i} className="text-sm p-2 bg-amber-50 rounded border border-amber-100">
                  <span className="font-medium">{event.companyName}</span> 
                  <span className="text-amber-600"> ({event.stockTicker})</span>
                  <span className="text-gray-600"> - {new Date(event.earningsDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-amber-200">
              <Button 
                onClick={handleSaveEarnings}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save & Make Visible to All Users
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
          <strong>Admin Instructions:</strong> Copy screenshots to clipboard and paste them here, or upload files. Review detected events and click save to make them visible to all users in the earnings calendar.
        </div>
      </CardContent>
    </Card>
  );
} 