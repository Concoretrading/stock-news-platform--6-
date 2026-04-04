"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { uploadImageToStorage } from "@/lib/firebase-services"
import { useAuth } from "@/components/auth-provider"

export function StockManualNewsForm({ 
  ticker, 
  onSuccess, 
  onClose,
  defaultDate
}: { 
  ticker: string
  onSuccess?: () => void
  onClose?: () => void
  defaultDate?: string
}) {
  const [formData, setFormData] = useState({
    headline: "",
    date: defaultDate || new Date().toISOString().split("T")[0],
    source: "",
    priceBefore: "",
    priceAfter: "",
    notes: "",
    image: null as File | null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Debug: Check if user is authenticated
      console.log('Current user:', user);
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please make sure you are logged in before adding a news catalyst.",
          variant: "destructive",
        })
        setIsSubmitting(false);
        return;
      }

      let imagePath = null
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop();
        const filePath = `manual-news-images/${user.uid}_${Date.now()}.${fileExt}`;
        console.log('Uploading image to:', filePath);
        await uploadImageToStorage(formData.image, filePath);
        imagePath = filePath; // Store the storage path
      }
      
      // Prepare the data for API submission
      const submissionData = {
        stockSymbol: ticker,
        headline: formData.headline,
        body: formData.notes || formData.headline, // Use notes as body, fallback to headline
        date: formData.date,
        imagePath: imagePath, // Now set to uploaded image path or null
        priceBefore: formData.priceBefore || null,
        priceAfter: formData.priceAfter || null,
        source: formData.source || null,
      }

      console.log('Submitting data:', submissionData);

      // Call the API
      const response = await fetchWithAuth('/api/manual-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      console.log('API Response status:', response.status);
      const result = await response.json()
      console.log('API Response data:', result);

      if (result.success) {
        toast({
          title: "✅ Success! News Catalyst Saved",
          description: `Your news catalyst for ${ticker} has been successfully added to the timeline!`,
          duration: 5000, // Show for 5 seconds instead of default
        })

        // Reset form
        setFormData({
          headline: "",
          date: defaultDate || new Date().toISOString().split("T")[0],
          source: "",
          priceBefore: "",
          priceAfter: "",
          notes: "",
          image: null,
        })

        // Call success callback to notify parent component
        if (onSuccess) {
          onSuccess()
        }
      } else {
        throw new Error(result.error || 'Failed to add news catalyst')
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add news catalyst. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }))
    }
  }

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add News Catalyst for {ticker}</span>
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
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value }))}
                placeholder="e.g., Reuters, Bloomberg, Company PR"
              />
            </div>

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

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Adding Catalyst..." : "Add News Catalyst"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
