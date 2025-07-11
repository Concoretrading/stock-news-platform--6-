'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Twitter, LogOut, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from './auth-provider';
import Image from "next/image";

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
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image src="/images/x-logo.svg" alt="X" width={20} height={20} />
          X Integration
        </CardTitle>
        <CardDescription>
          Sign in with your X account to enable advanced features.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* X sign-in button and logic remain unchanged */}
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Connecting to X...
          </div>
        ) : (
          <Button onClick={handleXLogin} className="w-full bg-black text-white hover:bg-gray-900 flex items-center gap-2" aria-label="Sign in with X">
            <Image src="/images/x-logo.svg" alt="X" width={16} height={16} />
            Sign in with X
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 