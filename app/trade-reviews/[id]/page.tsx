'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, Download, Share, Calendar, TrendingUp, TrendingDown, FileText, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useToast } from '@/hooks/use-toast';

interface TradeReviewSection {
  id: string;
  sectionName: string;
  content: string;
  images: Array<{
    id: string;
    imageUrl: string;
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
  createdAt: string;
  sections: TradeReviewSection[];
}

export default function TradeReviewPage({ params }: { params: { id: string } }) {
  const [tradeReview, setTradeReview] = useState<TradeReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

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
        setTradeReview(result.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load trade review",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading trade review:', error);
      toast({
        title: "Error",
        description: "Failed to load trade review",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (!tradeReview) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Trade Review Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The trade review you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link 
              href="/trade-reviews"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Trade Reviews
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                <h1 className="text-xl font-semibold">Trade Review</h1>
                <p className="text-sm text-muted-foreground">
                  {tradeReview.ticker} • {formatDate(tradeReview.tradeDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link 
                href={`/trade-reviews/${params.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Resume-like Layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section with Concore Branding */}
          <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {/* Concore Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img 
                    src="/images/concore-logo.png" 
                    alt="Concore" 
                    className="w-12 h-12 object-contain"
                  />
                  <div>
                    <h1 className="text-2xl font-bold">Concore</h1>
                    <p className="text-blue-100">Professional Trade Analysis</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm">Prepared by</p>
                  <p className="font-semibold">{user?.displayName || user?.email || 'Trader'}</p>
                  <p className="text-blue-100 text-sm">{formatDate(tradeReview.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Trade Information */}
            <div className="p-8 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                    tradeReview.positionType === 'LONG' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {tradeReview.positionType === 'LONG' ? (
                      <TrendingUp className="h-8 w-8" />
                    ) : (
                      <TrendingDown className="h-8 w-8" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">{tradeReview.ticker}</h3>
                  <p className="text-muted-foreground">{tradeReview.positionType} Position</p>
                </div>
                <div className="text-center">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold">Trade Date</h3>
                  <p className="text-muted-foreground">{formatDate(tradeReview.tradeDate)}</p>
                </div>
                <div className="text-center">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold">Analysis Sections</h3>
                  <p className="text-muted-foreground">{tradeReview.totalSections} Sections</p>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Trade Analysis</h2>
              <div className="space-y-8">
                {tradeReview.sections.map((section, index) => (
                  <div key={section.id} className="border-l-4 border-blue-500 pl-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {section.sectionName || `Section ${index + 1}`}
                      </h3>
                      {section.content && (
                        <div className="prose max-w-none">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {section.content}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Images */}
                    {section.images && section.images.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Supporting Images ({section.images.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {section.images.map((image) => (
                            <div key={image.id} className="relative group">
                              <img
                                src={image.imageUrl}
                                alt={image.altText}
                                className="w-full h-32 object-cover rounded-lg border shadow-sm group-hover:shadow-md transition-shadow"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="bg-white text-gray-800 px-2 py-1 rounded text-xs">
                                    View
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img 
                    src="/images/concore-logo.png" 
                    alt="Concore" 
                    className="w-8 h-8 object-contain"
                  />
                  <p className="text-sm text-gray-600">
                    Generated by Concore Trading Platform
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-600 hover:text-gray-800 p-2 rounded">
                    <Download className="h-4 w-4" />
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 p-2 rounded">
                    <Share className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 