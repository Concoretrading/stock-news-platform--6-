'use client';

import React, { useState, useEffect } from 'react';
import { Save, Eye, X, Upload, FileText, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Section {
  name: string;
  content: string;
  images: Array<{
    url: string;
    altText: string;
  }>;
}

export default function NewTradeReviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ticker, setTicker] = useState('');
  const [tradeDate, setTradeDate] = useState('');
  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG');
  const [sections, setSections] = useState<Section[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<{url: string; altText: string} | null>(null);
  const [activeSectionForPaste, setActiveSectionForPaste] = useState<number | null>(null);

  // Set up paste event listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => handlePasteImage(e);
    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [activeSectionForPaste, sections]);

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

  const handleImageUpload = async (file: File, sectionIndex: number) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sectionIndex', sectionIndex.toString());

      const response = await fetchWithAuth('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const newImage = {
          url: data.url,
          altText: file.name
        };
        
        const newSections = [...sections];
        newSections[sectionIndex].images.push(newImage);
        setSections(newSections);
        
        toast({
          title: "Image uploaded successfully",
          description: "Your image has been added to the section.",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasteImage = async (e: ClipboardEvent) => {
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

        await handleImageUpload(file, activeSectionForPaste);
      }
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save your trade review.",
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
      const response = await fetchWithAuth('/api/trade-reviews', {
        method: 'POST',
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
        const data = await response.json();
        toast({
          title: "Trade review saved",
          description: "Your trade review has been saved successfully.",
        });
        // Redirect to the saved review
        window.location.href = `/trade-reviews/${data.id}`;
      } else {
        throw new Error('Failed to save trade review');
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your trade review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Review'}</span>
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
                          <div className="grid grid-cols-2 gap-2">
                            {section.images.map((image, imgIndex) => (
                              <div key={imgIndex} className="relative group">
                                <img
                                  src={image.url}
                                  alt={image.altText}
                                  className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setEnlargedImage(image)}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-xs font-medium">
                                    Click to enlarge
                                  </div>
                                </div>
                                <button
                                  onClick={() => updateSection(index, 'images', 
                                    section.images.filter((_, i) => i !== imgIndex)
                                  )}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {section.images.length < 4 && (
                              <label className="w-full h-20 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center cursor-pointer hover:border-blue-300 transition-colors">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file, index);
                                  }}
                                  className="hidden"
                                />
                                <Upload className="h-6 w-6 text-muted-foreground" />
                              </label>
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
                  <span>Save Review</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={enlargedImage.url}
              alt={enlargedImage.altText}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
} 