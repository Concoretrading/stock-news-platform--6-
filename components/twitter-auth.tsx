"use client"

import React from "react";

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import Image from "next/image"

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

  // Check for stored Twitter user data on component mount
  useEffect(() => {
    const storedXUser = localStorage.getItem('xUser');
    if (storedXUser) {
      try {
        setXUser(JSON.parse(storedXUser));
      } catch (error) {
        console.error('Error parsing stored X user data:', error);
        localStorage.removeItem('xUser');
      }
    }
  }, []);

  // Handle OAuth callback from Twitter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      setError('Twitter authentication was denied or failed');
      return;
    }

    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, []);

  const handleOAuthCallback = async (code: string, state: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/twitter/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json();

      if (data.success) {
        const userData: XUser = {
          id: data.user.id,
          username: data.user.username,
          displayName: data.user.name,
          profileImageUrl: data.user.profile_image_url || '/placeholder-user.jpg',
          verified: data.user.verified || false
        };
        
        setXUser(userData);
        localStorage.setItem('xUser', JSON.stringify(userData));
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleXLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get Twitter OAuth URL from our backend
      const response = await fetch('/api/twitter/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirectUrl: window.location.origin + window.location.pathname
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Twitter OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || 'Failed to initiate Twitter authentication');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to X. Please try again.');
      setIsLoading(false);
    }
  };

  const handleXLogout = () => {
    setXUser(null);
    setError(null);
    localStorage.removeItem('xUser');
  };

  if (xUser) {
    return (
      <Card className="w-full mx-auto shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Image src="/images/x-logo.svg" alt="X" width={32} height={32} />
            Connected to X
          </CardTitle>
          <CardDescription className="text-lg">
            Successfully connected as @{xUser.username}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 mb-8">
            <Image 
              src={xUser.profileImageUrl} 
              alt={xUser.displayName}
              width={60}
              height={60}
              className="rounded-full"
            />
            <div>
              <p className="font-semibold flex items-center gap-2 text-xl">
                {xUser.displayName}
                {xUser.verified && <span className="text-blue-500 text-2xl">✓</span>}
              </p>
              <p className="text-lg text-muted-foreground">@{xUser.username}</p>
            </div>
          </div>
          <Button 
            onClick={handleXLogout} 
            variant="outline" 
            className="w-full h-14 text-lg"
          >
            Disconnect X Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mx-auto shadow-lg">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <Image src="/images/x-logo.svg" alt="X" width={32} height={32} />
          X Integration
        </CardTitle>
        <CardDescription className="text-lg">
          Sign in with your X account to enable advanced features.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-lg text-red-600">{error}</p>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="text-lg">Connecting to X...</span>
          </div>
        ) : (
          <Button 
            onClick={handleXLogin} 
            className="w-full h-16 bg-black text-white hover:bg-gray-900 flex items-center gap-3 text-lg font-semibold" 
            aria-label="Sign in with X"
          >
            <Image src="/images/x-logo.svg" alt="X" width={24} height={24} />
            Sign in with X
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 