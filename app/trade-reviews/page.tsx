'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, FileText, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useToast } from '@/hooks/use-toast';

interface TradeReview {
  id: string;
  ticker: string;
  tradeDate: string;
  positionType: 'LONG' | 'SHORT';
  status: string;
  totalSections: number;
  createdAt: string;
}

export default function TradeReviewsPage() {
  const [tradeReviews, setTradeReviews] = useState<TradeReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTradeReviews();
    }
  }, [user]);

  const loadTradeReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth('/api/trade-reviews');
      const result = await response.json();
      
      if (result.success) {
        setTradeReviews(result.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load trade reviews",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading trade reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load trade reviews",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold">Trade Reviews</h1>
                <p className="text-sm text-muted-foreground">Analyze and learn from your trades</p>
              </div>
            </div>
            <Link 
              href="/trade-reviews/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Review</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* My Trade Reviews */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Trade Reviews</h2>
              <span className="text-sm text-muted-foreground">{tradeReviews.length} reviews</span>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : tradeReviews.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No trade reviews yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start analyzing your trades to improve your performance
                </p>
                <Link 
                  href="/trade-reviews/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create First Review</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {tradeReviews.map((review) => (
                  <Link 
                    key={review.id}
                    href={`/trade-reviews/${review.id}`}
                    className="block p-4 border rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          review.positionType === 'LONG' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {review.positionType === 'LONG' ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{review.ticker}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(review.tradeDate)} • {review.positionType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {review.totalSections} sections
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* New Trade Review */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">New Trade Review</h2>
            
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-blue-300 transition-colors">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plus className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Create a New Trade Review</h3>
                  <p className="text-muted-foreground mb-6">
                    Analyze your trades with structured sections including overview, emotions, 
                    momentum, key levels, volume analysis, and improvement areas.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Trade Date</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Up to 8 Sections</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Position Type</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>5 Images per Section</span>
                  </div>
                </div>

                <Link 
                  href="/trade-reviews/new"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Start New Review</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 