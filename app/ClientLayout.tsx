"use client";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import ScreenshotButton from "@/components/ScreenshotButton";
import React, { useEffect } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  return (
    <AuthProvider>
      {children}
      <Toaster />
      <ScreenshotButton />
    </AuthProvider>
  );
} 