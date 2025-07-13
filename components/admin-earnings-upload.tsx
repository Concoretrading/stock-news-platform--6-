import React from "react";
import { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Copy, MousePointer } from 'lucide-react';

export function AdminEarningsUpload() {
  const [bulkPaste, setBulkPaste] = useState("");
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [bulkPasteSummary, setBulkPasteSummary] = useState<{added: number, skipped: any[]} | null>(null);
  const [tickers, setTickers] = useState<{ticker: string, logoUrl: string | null}[]>([]);
  const [logoUploading, setLogoUploading] = useState<string | null>(null);
  const [logoPreviews, setLogoPreviews] = useState<{[ticker: string]: string}>({});
  const [dragOverTicker, setDragOverTicker] = useState<string | null>(null);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const fileInputRefs = useRef<{[ticker: string]: HTMLInputElement | null}>({});

  // Fetch tickers in use (from API or static for now)
  useEffect(() => {
    async function fetchTickers() {
      const res = await fetch('/api/list-earnings');
      const data = await res.json();
      if (data.earnings) {
        // Unique tickers
        const unique = Array.from(new Set(data.earnings.map((e: any) => e.stockTicker)));
        setTickers((unique as string[]).map((ticker) => ({ ticker, logoUrl: data.earnings.find((e: any) => e.stockTicker === ticker)?.logoUrl || null })));
      }
    }
    fetchTickers();
  }, []);

  // Handle clipboard paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file && dragOverTicker) {
            handleLogoUpload(dragOverTicker, file);
            setDragOverTicker(null);
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [dragOverTicker]);

  const handleBulkPaste = async () => {
    if (!bulkPaste.trim()) return;
    setIsBulkSaving(true);
    setBulkPasteSummary(null);
    try {
      const response = await fetch('/api/admin-earnings-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkPaste })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process pasted earnings');
      toast.success(`✅ Successfully added ${data.added || 0} earnings events!`);
      setBulkPasteSummary({ added: data.added || 0, skipped: data.skipped || [] });
      setBulkPaste("");
    } catch (error) {
      toast.error('Failed to process pasted earnings');
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleLogoUpload = async (ticker: string, file: File) => {
    setLogoUploading(ticker);
    const formData = new FormData();
    formData.append('ticker', ticker);
    formData.append('file', file);
    
    try {
      console.log('Uploading logo for ticker:', ticker, 'File:', file.name, 'Size:', file.size);
      
      const res = await fetch('/api/upload-logo', { 
        method: 'POST', 
        body: formData 
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Upload failed:', data);
        throw new Error(data.error || 'Upload failed');
      }
      
      console.log('Upload successful:', data);
      toast.success(`Logo updated for ${ticker}`);
      setLogoPreviews(prev => ({ ...prev, [ticker]: data.logoUrl }));
      setTickers(tickers => tickers.map(t => 
        t.ticker === ticker ? { ...t, logoUrl: data.logoUrl } : t
      ));
    } catch (e: any) {
      console.error('Logo upload error:', e);
      toast.error(`Failed to upload logo for ${ticker}: ${e.message}`);
    } finally {
      setLogoUploading(null);
    }
  };

  const handleDragOver = (e: React.DragEvent, ticker: string) => {
    e.preventDefault();
    setDragOverTicker(ticker);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTicker(null);
  };

  const handleDrop = (e: React.DragEvent, ticker: string) => {
    e.preventDefault();
    setDragOverTicker(null);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleLogoUpload(ticker, file);
      } else {
        toast.error('Please drop an image file');
      }
    }
  };

  const handleCopyLogo = async (ticker: string) => {
    const logoUrl = logoPreviews[ticker] || tickers.find(t => t.ticker === ticker)?.logoUrl;
    if (!logoUrl || logoUrl === '/images/placeholder-logo.png') {
      toast.error('No logo to copy');
      return;
    }

    try {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      toast.success(`Logo for ${ticker} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy logo');
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span className="text-xl font-light tracking-wide text-blue-800">
            Admin Earnings Bulk Upload & Logo Manager
          </span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
            Admin
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Bulk Paste Earnings Section */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Bulk Paste Earnings</h3>
          <textarea
            className="w-full min-h-[120px] rounded border border-blue-300 p-2 text-sm font-mono mb-2"
            placeholder="nvda 7/23/25 AMC\naapl 7/25/25 BMO\nmsft 7/26/25"
            value={bulkPaste}
            onChange={e => setBulkPaste(e.target.value)}
            disabled={isBulkSaving}
          />
          <Button onClick={handleBulkPaste} disabled={isBulkSaving || !bulkPaste.trim()}>
            {isBulkSaving ? 'Saving...' : 'Submit'}
          </Button>
          {bulkPasteSummary && (
            <div className="mt-4">
              <div className="text-green-700 font-medium">Added: {bulkPasteSummary.added}</div>
              {bulkPasteSummary.skipped.length > 0 && (
                <div className="text-red-700 mt-2">
                  <div>Skipped lines:</div>
                  <ul className="list-disc list-inside text-xs">
                    {bulkPasteSummary.skipped.map((s, i) => (
                      <li key={i}>{s.line} <span className="text-gray-500">({s.reason})</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logo Manager Section */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Logo Manager</h3>
          <div className="flex items-center gap-4 mb-4">
            <p className="text-xs text-blue-700 flex-1">
              Upload logos via file input, drag & drop, or copy/paste. Logos auto-resize to 64x64px.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasteHint(!showPasteHint)}
              className="text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              Paste Help
            </Button>
          </div>
          
          {showPasteHint && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <p className="font-medium mb-1">How to paste images:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Copy an image from anywhere (screenshot, browser, etc.)</li>
                <li>Click on any logo box below to focus it</li>
                <li>Press Ctrl+V (or Cmd+V on Mac) to paste</li>
                <li>Or drag & drop images directly onto the logo boxes</li>
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {tickers.map(({ ticker, logoUrl }) => (
              <div
                key={ticker}
                className={`flex flex-col items-center gap-2 p-3 bg-white rounded shadow border-2 transition-all duration-200 ${
                  dragOverTicker === ticker 
                    ? 'border-blue-400 bg-blue-50 scale-105' 
                    : 'border-blue-100 hover:border-blue-300'
                }`}
                onDragOver={(e) => handleDragOver(e, ticker)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, ticker)}
                onClick={() => setDragOverTicker(ticker)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRefs.current[ticker]?.click();
                  }
                }}
              >
                <div className="relative w-16 h-16 flex items-center justify-center bg-blue-50 rounded">
                  <img
                    src={logoPreviews[ticker] || logoUrl || '/images/placeholder-logo.png'}
                    alt={ticker}
                    className="w-12 h-12 object-contain"
                  />
                  {dragOverTicker === ticker && (
                    <div className="absolute inset-0 bg-blue-200 bg-opacity-50 rounded flex items-center justify-center">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                </div>
                
                <div className="font-mono text-xs text-blue-900">{ticker}</div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-6 px-2"
                    disabled={logoUploading === ticker}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRefs.current[ticker]?.click();
                    }}
                  >
                    <Upload className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-6 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLogo(ticker);
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>

                <Input
                  ref={(el) => {
                    fileInputRefs.current[ticker] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={logoUploading === ticker}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file type
                      if (!file.type.startsWith('image/')) {
                        toast.error('Please select an image file');
                        return;
                      }
                      
                      // Validate file size (max 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('File size must be less than 5MB');
                        return;
                      }
                      
                      handleLogoUpload(ticker, file);
                    }
                    // Reset the input
                    e.target.value = '';
                  }}
                />
                
                {logoUploading === ticker && (
                  <span className="text-xs text-blue-600">Uploading...</span>
                )}
                
                {dragOverTicker === ticker && (
                  <div className="absolute inset-0 bg-blue-100 bg-opacity-20 rounded pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 