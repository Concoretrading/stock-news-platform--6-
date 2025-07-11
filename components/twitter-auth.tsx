'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Twitter, LogOut, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from './auth-provider';

interface XUser {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string;
  verified: boolean;
}

export function XAuth() {
  const [xUser, setXUser] = useState<XUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleXLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate X OAuth login
      // In a real implementation, this would redirect to X OAuth
      console.log('🔄 Initiating X OAuth login...');
      
      // For demo purposes, simulate a successful login
      setTimeout(() => {
        setXUser({
          id: 'x_user_123',
          username: 'trader_pro',
          displayName: 'Trader Pro',
          profileImageUrl: '/placeholder-user.jpg',
          verified: true
        });
        setIsLoading(false);
      }, 2000);
      
    } catch (err) {
      setError('Failed to connect to X. Please try again.');
      setIsLoading(false);
    }
  };

  const handleXLogout = () => {
    setXUser(null);
    setError(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Twitter className="h-5 w-5 text-blue-400" />
          X Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!xUser ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Connect your X account to enable seamless content sharing and analysis.
            </div>
            
            <Button 
              onClick={handleXLogin}
              disabled={isLoading}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Connecting to X...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Sign in with X
                </div>
              )}
            </Button>
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <img 
                src={xUser.profileImageUrl} 
                alt={xUser.displayName}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{xUser.displayName}</span>
                  {xUser.verified && (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  @{xUser.username}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Connected features:
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Post content directly to X
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Import posts for analysis
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Auto-detect stock tickers
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleXLogout}
              variant="outline"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect X
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 