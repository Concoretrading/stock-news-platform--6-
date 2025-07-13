'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, FileText, Calendar, TrendingUp, TrendingDown, Search, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval } from 'date-fns';

interface TradeReview {
  id: string;
  ticker: string;
  tradeDate: string;
  positionType: 'LONG' | 'SHORT';
  status: string;
  totalSections: number;
  createdAt: string;
  sections?: Array<{
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

export default function TradeReviewsPage() {
  const [tradeReviews, setTradeReviews] = useState<TradeReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<TradeReview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTradeReviews();
    } else {
      // If no user, still set loading to false to show the page
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Filter reviews based on search query
    if (!searchQuery.trim()) {
      setFilteredReviews(tradeReviews);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = tradeReviews.filter(review => 
        review.ticker.toLowerCase().includes(query) ||
        review.sections?.some(section => 
          section.sectionName.toLowerCase().includes(query) ||
          section.content.toLowerCase().includes(query)
        )
      );
      setFilteredReviews(filtered);
    }
  }, [searchQuery, tradeReviews]);

  const loadTradeReviews = async () => {
    if (!user) return;
    
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trade review?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/trade-reviews/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Trade review deleted successfully",
        });
        loadTradeReviews();
      } else {
        throw new Error('Failed to delete trade review');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete trade review",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      if (regex.test(part)) {
        return <mark key={i} className="bg-yellow-200 px-1 rounded font-medium">{part}</mark>;
      }
      return part;
    });
  };

  // Generate the default 12 months
  const generateDefault12Months = () => {
    const months = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthDate);
    }

    return months;
  };

  const getAllVisibleMonths = () => {
    const defaultMonths = generateDefault12Months();
    return defaultMonths.sort((a, b) => b.getTime() - a.getTime());
  };

  const toggleMonth = (monthKey: string) => {
    const newOpenMonths = new Set(openMonths);
    if (newOpenMonths.has(monthKey)) {
      newOpenMonths.delete(monthKey);
      // Also close all weeks in this month
      const newOpenWeeks = new Set(openWeeks);
      Array.from(openWeeks).forEach((weekKey) => {
        if (weekKey.startsWith(monthKey)) {
          newOpenWeeks.delete(weekKey);
        }
      });
      setOpenWeeks(newOpenWeeks);
    } else {
      newOpenMonths.add(monthKey);
    }
    setOpenMonths(newOpenMonths);
  };

  const toggleWeek = (weekKey: string) => {
    const newOpenWeeks = new Set(openWeeks);
    if (newOpenWeeks.has(weekKey)) {
      newOpenWeeks.delete(weekKey);
    } else {
      newOpenWeeks.add(weekKey);
    }
    setOpenWeeks(newOpenWeeks);
  };

  const getReviewsForWeek = (weekStart: Date, weekEnd: Date) => {
    return filteredReviews.filter((review) => {
      const reviewDate = new Date(review.tradeDate);
      return isWithinInterval(reviewDate, { start: weekStart, end: weekEnd });
    });
  };

  const getReviewsForMonth = (monthDate: Date) => {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    return filteredReviews.filter((review) => {
      const reviewDate = new Date(review.tradeDate);
      return isWithinInterval(reviewDate, { start: monthStart, end: monthEnd });
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
              <h1 className="text-2xl font-bold">Trade Journal</h1>
            </div>
            <Link href="/trade-reviews/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Review
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="container mx-auto px-4 py-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search trade reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            Found {filteredReviews.length} result{filteredReviews.length !== 1 ? 's' : ''} for "{searchQuery}"
          </p>
        )}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-8">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No reviews found' : 'No trade reviews yet'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Create your first trade review to start tracking your trading performance'
              }
            </p>
            {!searchQuery && (
              <Link href="/trade-reviews/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Review
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {getAllVisibleMonths().map((monthDate) => {
              const monthKey = format(monthDate, 'yyyy-MM');
              const monthReviews = getReviewsForMonth(monthDate);
              
              if (monthReviews.length === 0) return null;

              const isMonthOpen = openMonths.has(monthKey);
              const weeks = eachWeekOfInterval(
                {
                  start: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
                  end: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
                },
                { weekStartsOn: 1 }
              );

              return (
                <Card key={monthKey} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleMonth(monthKey)}
                    >
                      <div className="flex items-center space-x-2">
                        {isMonthOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <CardTitle className="text-lg">
                          {format(monthDate, 'MMMM yyyy')}
                        </CardTitle>
                        <Badge variant="secondary">
                          {monthReviews.length} review{monthReviews.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isMonthOpen && (
                    <CardContent>
                      <div className="space-y-4">
                        {weeks.map((weekStart) => {
                          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                          const weekKey = `${monthKey}-${format(weekStart, 'yyyy-MM-dd')}`;
                          const weekReviews = getReviewsForWeek(weekStart, weekEnd);
                          
                          if (weekReviews.length === 0) return null;

                          const isWeekOpen = openWeeks.has(weekKey);

                          return (
                            <div key={weekKey} className="border rounded-lg">
                              <div 
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                                onClick={() => toggleWeek(weekKey)}
                              >
                                <div className="flex items-center space-x-2">
                                  {isWeekOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <span className="font-medium">
                                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {weekReviews.length}
                                  </Badge>
                                </div>
                              </div>
                              
                              {isWeekOpen && (
                                <div className="p-3 pt-0 space-y-3">
                                  {weekReviews.map((review) => (
                                    <Card key={review.id} className="hover:shadow-md transition-shadow">
                                      <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <Link href={`/trade-reviews/${review.id}`}>
                                              <CardTitle className="text-base hover:text-blue-600 cursor-pointer">
                                                {highlightMatch(review.ticker, searchQuery)}
                                              </CardTitle>
                                            </Link>
                                            <Badge variant={review.positionType === 'LONG' ? 'default' : 'destructive'}>
                                              {review.positionType === 'LONG' ? (
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                              ) : (
                                                <TrendingDown className="h-3 w-3 mr-1" />
                                              )}
                                              {review.positionType}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Link href={`/trade-reviews/${review.id}/edit`}>
                                              <Button variant="ghost" size="sm">
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                            </Link>
                                            <Button 
                                              variant="ghost" 
                                              size="sm"
                                              onClick={() => handleDelete(review.id)}
                                              className="text-red-600 hover:text-red-700"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-2">
                                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                            <div className="flex items-center space-x-1">
                                              <Calendar className="h-3 w-3" />
                                              <span>{formatDate(review.tradeDate)}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                              <FileText className="h-3 w-3" />
                                              <span>{review.totalSections} section{review.totalSections !== 1 ? 's' : ''}</span>
                                            </div>
                                          </div>
                                          {review.sections && review.sections.length > 0 && (
                                            <div className="text-sm">
                                              <p className="text-muted-foreground">
                                                {highlightMatch(
                                                  review.sections[0].content.length > 100 
                                                    ? review.sections[0].content.substring(0, 100) + '...'
                                                    : review.sections[0].content,
                                                  searchQuery
                                                )}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 