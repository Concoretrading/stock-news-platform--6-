"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImageToStorage, getUserStocks, saveNewsCatalyst } from '@/lib/firebase-services';
import { getAuth } from 'firebase/auth';

interface Stock {
  id: string;
  ticker: string;
}

interface FormData {
  headline: string;
  date: string;
  priceBefore: string;
  priceAfter: string;
  notes: string;
  image: File | null;
}

interface AddCatalystFormProps {
  selectedStockSymbol: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  userWatchlist?: string[];
}

function AddCatalystForm({ 
  selectedStockSymbol, 
  onSuccess, 
  onCancel, 
  userWatchlist = []
}: AddCatalystFormProps) {
  const [formData, setFormData] = useState<FormData>({
    headline: '',
    date: new Date().toISOString().split('T')[0],
    priceBefore: '',
    priceAfter: '',
    notes: '',
    image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFormData((prev) => ({ ...prev, image: file }));
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const user = getAuth().currentUser;
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in to add catalysts.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }
    const watchlist = userWatchlist && userWatchlist.length > 0
      ? userWatchlist.map(t => t.toUpperCase())
      : (await getUserStocks()).map((stock: any) => (stock.ticker || stock.id || '').toUpperCase());
    const inWatchlist = watchlist.includes(selectedStockSymbol.toUpperCase());
    if (!inWatchlist) {
      toast({ title: 'Not in Watchlist', description: `Please add ${selectedStockSymbol.toUpperCase()} to your watchlist first.`, variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }
    let imagePath = '';
    if (formData.image) {
      const filePath = `users/${user.uid}/stocks/${selectedStockSymbol}/catalysts/${Date.now()}_${formData.image.name}`;
      await uploadImageToStorage(formData.image, filePath);
      imagePath = filePath;
    }
    const catalystData = {
      headline: formData.headline,
      body: formData.notes,
      date: formData.date,
      imageUrl: imagePath,
      priceBefore: formData.priceBefore === '' ? undefined : Number(formData.priceBefore),
      priceAfter: formData.priceAfter === '' ? undefined : Number(formData.priceAfter),
    };
    const catalystId = await saveNewsCatalyst(selectedStockSymbol, catalystData);
    if (catalystId) {
      toast({ title: 'Catalyst saved successfully!' });
      setFormData({
        headline: '',
        date: new Date().toISOString().split('T')[0],
        priceBefore: '',
        priceAfter: '',
        notes: '',
        image: null,
      });
      onSuccess?.();
    } else {
      toast({ title: 'Failed to save catalyst. Please try again.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add News Catalyst for {selectedStockSymbol}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headline">Headline *</Label>
              <Input
                id="headline"
                value={formData.headline}
                onChange={(e) => setFormData((prev) => ({ ...prev, headline: e.target.value }))}
                placeholder="Enter news headline"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
          </div>
          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>Add Image</Label>
            {!formData.image ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">Upload an image for this news catalyst</p>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  Choose Image
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">{formData.image.name}</span>
                <Button type="button" variant="ghost" size="sm" onClick={removeImage}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price Tracking (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="priceBefore" className="text-xs text-muted-foreground">Price Before</Label>
                  <Input
                    id="priceBefore"
                    type="number"
                    step="0.01"
                    value={formData.priceBefore}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priceBefore: e.target.value }))}
                    placeholder="e.g., 150.25"
                  />
                </div>
                <div>
                  <Label htmlFor="priceAfter" className="text-xs text-muted-foreground">Price After</Label>
                  <Input
                    id="priceAfter"
                    type="number"
                    step="0.01"
                    value={formData.priceAfter}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priceAfter: e.target.value }))}
                    placeholder="e.g., 155.50"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this news catalyst..."
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Adding Catalyst..." : "Add News Catalyst"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="w-full">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default AddCatalystForm;
