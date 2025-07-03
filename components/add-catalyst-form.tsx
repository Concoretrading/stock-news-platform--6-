"use client"

import React, { useState } from 'react';
import { saveNewsCatalyst, uploadImageToStorage, getUserStocks } from '@/lib/firebase-services';
import { getAuth } from "firebase/auth";

function AddCatalystForm({ 
  selectedStockSymbol, 
  onSuccess, 
  onCancel, 
  userWatchlist = []
}: { 
  selectedStockSymbol: string
  onSuccess?: () => void
  onCancel?: () => void
  userWatchlist?: string[]
}) {
  const [headline, setHeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [priceBefore, setPriceBefore] = useState<number | ''>('');
  const [priceAfter, setPriceAfter] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const user = getAuth().currentUser;
    if (!user) {
      alert("You must be logged in to upload images.");
      setIsSubmitting(false);
      return;
    }
    const watchlist = userWatchlist && userWatchlist.length > 0
      ? userWatchlist.map(t => t.toUpperCase())
      : (await getUserStocks()).map((s: any) => (s.ticker || s.id).toUpperCase());
    const inWatchlist = watchlist.includes(selectedStockSymbol.toUpperCase());
    if (!inWatchlist) {
      alert(`You can only upload catalysts for stocks in your watchlist. Please add ${selectedStockSymbol.toUpperCase()} to your watchlist first.`);
      setIsSubmitting(false);
      return;
    }

    let imagePath = '';
    if (image) {
      const fileExt = image.name.split('.').pop();
      const filePath = `users/${user.uid}/stocks/${selectedStockSymbol}/catalysts/${Date.now()}_${image.name}`;
      await uploadImageToStorage(image, filePath);
      imagePath = filePath;
    }

    const catalystData = {
      title: headline,
      description: notes,
      imagePath,
      date,
      priceBefore: priceBefore === '' ? null : Number(priceBefore),
      priceAfter: priceAfter === '' ? null : Number(priceAfter),
    };

    const catalystId = await saveNewsCatalyst(selectedStockSymbol, catalystData);

    if (catalystId) {
      alert('Catalyst saved successfully!');
      setHeadline('');
      setNotes('');
      setImage(null);
      setDate('');
      setPriceBefore('');
      setPriceAfter('');
      onSuccess?.();
    } else {
      alert('Failed to save catalyst. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input 
          type="text" 
          value={headline} 
          onChange={(e) => setHeadline(e.target.value)} 
          placeholder="Headline" 
          className="w-full px-3 py-2 border rounded-md"
          required 
        />
        <textarea 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          placeholder="Notes (optional)"
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
        />
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload}
          className="w-full"
        />
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          className="w-full px-3 py-2 border rounded-md"
        />
        <div className="grid grid-cols-2 gap-2">
          <input 
            type="number" 
            value={priceBefore} 
            onChange={(e) => setPriceBefore(e.target.value ? parseFloat(e.target.value) : '')} 
            placeholder="Price Before (optional)" 
            className="w-full px-3 py-2 border rounded-md"
          />
          <input 
            type="number" 
            value={priceAfter} 
            onChange={(e) => setPriceAfter(e.target.value ? parseFloat(e.target.value) : '')} 
            placeholder="Price After (optional)" 
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="flex gap-2">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Catalyst"}
          </button>
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default AddCatalystForm;
