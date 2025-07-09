"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uploadImageToStorage, saveNewsCatalyst } from '@/lib/firebase-services';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useToast } from "@/hooks/use-toast"

interface CatalystFormData {
  ticker: string
  headline: string
  description: string
  date: string
  priceBefore: string
  priceAfter: string
  source: string
  imageFile?: File
}

interface CatalystFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddCatalystForm({ isOpen, onClose, onSuccess }: CatalystFormProps) {
  const [formData, setFormData] = useState<CatalystFormData>({
    ticker: '',
    headline: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    priceBefore: '',
    priceAfter: '',
    source: '',
  })
  const [loading, setLoading] = useState(false)
  const [userStocks, setUserStocks] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadUserStocks()
    }
  }, [isOpen])

  const loadUserStocks = async () => {
    try {
      const response = await fetchWithAuth('/api/watchlist')
      const result = await response.json()
      
      if (result.success) {
        const stockTickers = result.data.map((stock: any) => stock.ticker.toUpperCase())
        setUserStocks(stockTickers)
      } else {
        // Fallback to empty array if API call fails
        setUserStocks([])
      }
    } catch (error) {
      console.error('Error loading user stocks:', error)
      setUserStocks([])
    }
  }

  const handleInputChange = (field: keyof CatalystFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.ticker || !formData.headline || !formData.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      let imageUrl: string | undefined = undefined
      if (formData.imageFile) {
        const filePath = `users/temp/${Date.now()}_${formData.imageFile.name}`
        imageUrl = await uploadImageToStorage(formData.imageFile, filePath)
      }

      const catalystData = {
        headline: formData.headline,
        body: formData.description,
        date: formData.date,
        imageUrl: imageUrl,
        priceBefore: formData.priceBefore ? Number(formData.priceBefore) : undefined,
        priceAfter: formData.priceAfter ? Number(formData.priceAfter) : undefined,
        source: formData.source || 'Manual Entry',
      }

      const result = await saveNewsCatalyst(formData.ticker.toUpperCase(), catalystData)
      
      if (result.success) {
        toast({
          title: "Success",
          description: "News catalyst added successfully",
        })
        
        // Reset form
        setFormData({
          ticker: '',
          headline: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          priceBefore: '',
          priceAfter: '',
          source: '',
        })
        
        onSuccess()
        onClose()
      } else {
        throw new Error(result.error || 'Failed to save catalyst')
      }
      
    } catch (error) {
      console.error('Error saving catalyst:', error)
      toast({
        title: "Error",
        description: "Failed to save news catalyst",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Add News Catalyst</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticker">Stock Ticker *</Label>
                <Select value={formData.ticker} onValueChange={(value) => handleInputChange('ticker', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {userStocks.map(ticker => (
                      <SelectItem key={ticker} value={ticker}>
                        {ticker}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">Headline *</Label>
              <Input
                id="headline"
                value={formData.headline}
                onChange={(e) => handleInputChange('headline', e.target.value)}
                placeholder="Enter news headline"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter additional details"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceBefore">Price Before</Label>
                <Input
                  id="priceBefore"
                  type="number"
                  step="0.01"
                  value={formData.priceBefore}
                  onChange={(e) => handleInputChange('priceBefore', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priceAfter">Price After</Label>
                <Input
                  id="priceAfter"
                  type="number"
                  step="0.01"
                  value={formData.priceAfter}
                  onChange={(e) => handleInputChange('priceAfter', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                placeholder="Enter news source"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image (optional)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Catalyst'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
