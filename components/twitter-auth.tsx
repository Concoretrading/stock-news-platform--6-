"use client"

import React from "react";

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import Image from "next/image"

// TypeScript declaration for Twitter widgets
declare global {
  interface Window {
    twttr: {
      widgets: {
        load: () => void;
      };
    };
  }
}

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
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Load Twitter widgets script when user is authenticated
  useEffect(() => {
    if (xUser && typeof window !== 'undefined') {
      // Load Twitter widgets script
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      
      script.onload = () => {
        // Reinitialize Twitter widgets
        if (window.twttr && window.twttr.widgets) {
          window.twttr.widgets.load();
        }
      };
      
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [xUser]);

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
      <div className="h-full flex flex-col">
        {/* User Profile Header */}
        <div className="p-4 border-b bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <Image 
              src={xUser.profileImageUrl} 
              alt={xUser.displayName}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="flex-1">
              <p className="font-semibold flex items-center gap-2">
                {xUser.displayName}
                {xUser.verified && <span className="text-blue-500">✓</span>}
              </p>
              <p className="text-sm text-muted-foreground">@{xUser.username}</p>
            </div>
            <Button 
              onClick={handleXLogout} 
              variant="outline" 
              size="sm"
            >
              Disconnect
            </Button>
          </div>
        </div>

        {/* Twitter Timeline Embed */}
        <div className="flex-1 overflow-hidden">
          <div className="w-full h-full">
            {/* Twitter Timeline Widget */}
            <div 
              className="w-full h-full"
              dangerouslySetInnerHTML={{
                __html: `
                  <a 
                    class="twitter-timeline" 
                    data-height="100%" 
                    data-theme="light" 
                    href="https://twitter.com/${xUser.username}?ref_src=twsrc%5Etfw"
                  >
                    Tweets by @${xUser.username}
                  </a>
                  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
                `
              }}
            />
          </div>
        </div>

        {/* Alternative: Custom Twitter Feed */}
        {/* 
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Twitter Timeline</h3>
            <p className="text-muted-foreground">
              Your personalized Twitter feed will appear here
            </p>
          </div>
        </div>
        */}
      </div>
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