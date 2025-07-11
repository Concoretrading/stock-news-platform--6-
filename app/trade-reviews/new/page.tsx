'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Upload, Save, Eye, FileText } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

interface Section {
  name: string;
  content: string;
  images: Array<{
    url: string;
    altText: string;
  }>;
}

const DEFAULT_SECTIONS = [
  'Overview',
  'Emotions', 
  'Momentum',
  'Key Levels',
  'Volume',
  'Keltners',
  'What I Need to Improve On',
  'Final Notes'
];

export default function NewTradeReviewPage() {
  const [ticker, setTicker] = useState('');
  const [tradeDate, setTradeDate] = useState('');
  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG');
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const addSection = (sectionName: string) => {
    if (sections.length >= 8) {
      toast({
        title: "Maximum sections reached",
        description: "You can only add up to 8 sections per review",
        variant: "destructive",
      });
      return;
    }

    setSections(prev => [...prev, {
      name: sectionName,
      content: '',
      images: []
    }]);
  };

  const updateSection = (index: number, field: keyof Section, value: any) => {
    setSections(prev => prev.map((section, i) => 
      i === index ? { ...section, [field]: value } : section
    ));
  };

  const removeSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
    if (currentSection >= sections.length - 1) {
      setCurrentSection(Math.max(0, sections.length - 2));
    }
  };

  const handleImageUpload = async (file: File, sectionIndex: number) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchWithAuth('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      updateSection(sectionIndex, 'images', [
        ...sections[sectionIndex].images,
        { url: data.url, altText: file.name }
      ]);

      toast({
        title: "Image uploaded",
        description: "Image added to section",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!ticker || !tradeDate || sections.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and add at least one section",
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
          sections
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Trade review created",
          description: "Your trade review has been saved successfully",
        });
        // Redirect to the review page
        window.location.href = `/trade-reviews/${result.data.id}`;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create trade review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/trade-reviews">
                <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold">New Trade Review</h1>
                <p className="text-sm text-muted-foreground">Analyze your trade with structured sections</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Review'}</span>
              </button>
            </div>
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
                <div className="flex items-center space-x-2">
                  {DEFAULT_SECTIONS.map((sectionName) => (
                    <button
                      key={sectionName}
                      onClick={() => addSection(sectionName)}
                      disabled={sections.length >= 8 || sections.some(s => s.name === sectionName)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sectionName}
                    </button>
                  ))}
                </div>
              </div>

              {sections.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No sections added yet</h3>
                  <p className="text-muted-foreground">
                    Add sections to start building your trade review
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">{section.name}</h3>
                        <button
                          onClick={() => removeSection(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Content</label>
                          <textarea
                            value={section.content}
                            onChange={(e) => updateSection(index, 'content', e.target.value)}
                            placeholder={`Describe your ${section.name.toLowerCase()} analysis...`}
                            rows={4}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Images ({section.images.length}/5)
                          </label>
                          <div className="grid grid-cols-5 gap-2">
                            {section.images.map((image, imgIndex) => (
                              <div key={imgIndex} className="relative">
                                <img
                                  src={image.url}
                                  alt={image.altText}
                                  className="w-full h-20 object-cover rounded border"
                                />
                                <button
                                  onClick={() => updateSection(index, 'images', 
                                    section.images.filter((_, i) => i !== imgIndex)
                                  )}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {section.images.length < 5 && (
                              <label className="w-full h-20 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center cursor-pointer hover:border-blue-300 transition-colors">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file, index);
                                  }}
                                  className="hidden"
                                />
                                <Upload className="h-6 w-6 text-muted-foreground" />
                              </label>
                            )}
                          </div>
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
    </div>
  );
} 