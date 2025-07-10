import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function AdminEarningsUpload() {
  const [bulkPaste, setBulkPaste] = useState("");
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [bulkPasteSummary, setBulkPasteSummary] = useState<{added: number, skipped: any[]} | null>(null);
  const [tickers, setTickers] = useState<{ticker: string, logoUrl: string | null}[]>([]);
  const [logoUploading, setLogoUploading] = useState<string | null>(null);
  const [logoPreviews, setLogoPreviews] = useState<{[ticker: string]: string}>({});

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
      const res = await fetch('/api/upload-logo', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      toast.success(`Logo updated for ${ticker}`);
      setLogoPreviews(prev => ({ ...prev, [ticker]: data.logoUrl }));
      setTickers(tickers => tickers.map(t => t.ticker === ticker ? { ...t, logoUrl: data.logoUrl } : t));
    } catch (e) {
      toast.error('Failed to upload logo');
    } finally {
      setLogoUploading(null);
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
          <p className="text-xs text-blue-700 mb-4">Upload a logo for any ticker below. Logos will be automatically resized to 64x64px and update instantly on the calendar.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {tickers.map(({ ticker, logoUrl }) => (
              <div key={ticker} className="flex flex-col items-center gap-2 p-3 bg-white rounded shadow border border-blue-100">
                <div className="w-16 h-16 flex items-center justify-center bg-blue-50 rounded">
                  <img
                    src={logoPreviews[ticker] || logoUrl || '/images/placeholder-logo.png'}
                    alt={ticker}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div className="font-mono text-xs text-blue-900">{ticker}</div>
                <Input
                  type="file"
                  accept="image/*"
                  className="text-xs"
                  disabled={logoUploading === ticker}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(ticker, file);
                  }}
                />
                {logoUploading === ticker && <span className="text-xs text-blue-600">Uploading...</span>}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 