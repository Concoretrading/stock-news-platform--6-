'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Eye, X, Upload, FileText, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Section {
  name: string;
  content: string;
  images: Array<{
    url: string;
    altText: string;
  }>;
}

interface TradeReview {
  id: string;
  ticker: string;
  tradeDate: string;
  positionType: 'LONG' | 'SHORT';
  status: string;
  totalSections: number;
  sections: Array<{
    id: string;
    sectionName: string;
    content: string;
    images: Array<{
      id: string;
      imageUrl: string;
      altText: string;
    }>;
  }>;
}

export default function EditTradeReviewPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [ticker, setTicker] = useState('');
  const [tradeDate, setTradeDate] = useState('');
  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG');
  const [sections, setSections] = useState<Section[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<{url: string; altText: string} | null>(null);
  const [activeSectionForPaste, setActiveSectionForPaste] = useState<number | null>(null);

  useEffect(() => {
    if (user && params.id) {
      loadTradeReview();
    }
  }, [user, params.id]);

  const loadTradeReview = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`/api/trade-reviews/${params.id}`);
      const result = await response.json();
      
      if (result.success) {
        const review: TradeReview = result.data;
        setTicker(review.ticker);
        setTradeDate(review.tradeDate);
        setPositionType(review.positionType);
        
        // Convert sections to the format expected by the form
        const formattedSections: Section[] = review.sections.map(section => ({
          name: section.sectionName,
          content: section.content,
          images: section.images.map(img => ({
            url: img.imageUrl,
            altText: img.altText
          }))
        }));
        
        setSections(formattedSections);
      } else {
        toast({
          title: "Error",
          description: "Failed to load trade review",
          variant: "destructive",
        });
        router.push('/trade-reviews');
      }
    } catch (error) {
      console.error('Error loading trade review:', error);
      toast({
        title: "Error",
        description: "Failed to load trade review",
        variant: "destructive",
      });
      router.push('/trade-reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const addSection = (sectionName: string) => {
    if (sections.length < 8) {
      setSections([...sections, { name: sectionName, content: '', images: [] }]);
    }
  };

  const updateSection = (index: number, field: keyof Section, value: any) => {
    const newSections = [...sections];
    if (field === 'images') {
      newSections[index].images = value;
    } else {
      newSections[index][field] = value;
    }
    setSections(newSections);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const addImageToSection = (sectionIndex: number, imageUrl: string, altText: string = '') => {
    const newSections = [...sections];
    if (newSections[sectionIndex].images.length < 4) {
      newSections[sectionIndex].images.push({ url: imageUrl, altText });
      setSections(newSections);
    }
  };

  const removeImageFromSection = (sectionIndex: number, imageIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].images = newSections[sectionIndex].images.filter((_, i) => i !== imageIndex);
    setSections(newSections);
  };

  const handleImageUpload = (sectionIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        addImageToSection(sectionIndex, result, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasteImage = useCallback(async (e: ClipboardEvent) => {
    // Don't process paste if user is typing in an input/textarea
    const target = e.target as HTMLElement;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
      return;
    }

    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = Array.from(clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    
    if (imageItem && activeSectionForPaste !== null) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        
        // Check if section has space for more images
        if (sections[activeSectionForPaste].images.length >= 4) {
          toast({
            title: "Image limit reached",
            description: "This section already has the maximum of 4 images.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Image pasted!",
          description: "Processing your pasted image...",
        });

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          addImageToSection(activeSectionForPaste, result, `pasted-image-${Date.now()}.png`);
        };
        reader.readAsDataURL(file);
      }
    }
  }, [activeSectionForPaste, sections, toast, addImageToSection]);

  // Set up paste event listener
  useEffect(() => {
    document.addEventListener('paste', handlePasteImage);
    
    return () => {
      document.removeEventListener('paste', handlePasteImage);
    };
  }, [handlePasteImage]);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to update your trade review.",
        variant: "destructive",
      });
      return;
    }

    if (!ticker || !tradeDate || sections.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and add at least one section.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth(`/api/trade-reviews/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker,
          tradeDate,
          positionType,
          sections,
        }),
      });

      if (response.ok) {
        toast({
          title: "Trade review updated",
          description: "Your trade review has been updated successfully.",
        });
        router.push(`/trade-reviews/${params.id}`);
      } else {
        throw new Error('Failed to update trade review');
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was an error updating your trade review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/trade-reviews" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Reviews</span>
              </Link>
              <h1 className="text-2xl font-bold">Edit Trade Review</h1>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Updating...' : 'Update Review'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel - Trade Info & Sections */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Trade Information */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Trade Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ticker</label>
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="AAPL"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Trade Date</label>
                  <input
                    type="date"
                    value={tradeDate}
                    onChange={(e) => setTradeDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Position</label>
                  <select
                    value={positionType}
                    onChange={(e) => setPositionType(e.target.value as 'LONG' | 'SHORT')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="LONG">Long</option>
                    <option value="SHORT">Short</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Sections ({sections.length}/8)</h2>
                <button
                  onClick={() => addSection('')}
                  disabled={sections.length >= 8}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add New Section
                </button>
              </div>

              {sections.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No sections added yet</h3>
                  <p className="text-muted-foreground">
                    Add sections to start building your trade review
                  </p>
                  <button
                    onClick={() => addSection('')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add First Section
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <div 
                      key={index} 
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        activeSectionForPaste === index 
                          ? 'border-blue-500 bg-blue-50/50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      tabIndex={0}
                      onFocus={() => setActiveSectionForPaste(index)}
                      onBlur={() => setActiveSectionForPaste(null)}
                      onClick={() => setActiveSectionForPaste(index)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <input
                          type="text"
                          value={section.name}
                          onChange={e => updateSection(index, 'name', e.target.value)}
                          placeholder="Section Headline"
                          className="text-lg font-semibold w-full max-w-xs border-b focus:outline-none focus:border-blue-500 bg-transparent"
                        />
                        {sections.length > 1 && (
                          <button
                            onClick={() => removeSection(index)}
                            className="text-red-500 hover:text-red-700 ml-4"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Notes</label>
                          <textarea
                            value={section.content}
                            onChange={e => updateSection(index, 'content', e.target.value)}
                            placeholder="Add your notes here..."
                            rows={4}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Images ({section.images.length}/4)
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            {section.images.map((image, imgIndex) => (
                              <div key={imgIndex} className="relative group">
                                <img
                                  src={image.url}
                                  alt={image.altText}
                                  className="w-full h-24 object-cover rounded-lg cursor-pointer"
                                  onClick={() => setEnlargedImage(image)}
                                />
                                <button
                                  onClick={() => removeImageFromSection(index, imgIndex)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {section.images.length < 4 && (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center">
                                <label className="cursor-pointer text-gray-500 hover:text-gray-700">
                                  <Upload className="h-6 w-6 mx-auto mb-1" />
                                  <span className="text-xs">Upload</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(index, e)}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                          {activeSectionForPaste === index && (
                            <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                              💡 This section is active for image pasting. Copy an image and press Ctrl+V to paste it here.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Preview</h2>
              <div className="space-y-4">
                <div className="text-sm">
                  <span className="font-medium">Ticker:</span> {ticker || 'Not set'}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Date:</span> {tradeDate || 'Not set'}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Position:</span> {positionType}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Sections:</span> {sections.length}
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Update Review</span>
                </button>
                <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Enlargement Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={enlargedImage.url}
              alt={enlargedImage.altText}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-4 right-4 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 