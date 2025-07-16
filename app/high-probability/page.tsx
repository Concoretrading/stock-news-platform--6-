'use client';

import React from 'react';
import HighProbabilityDashboard from '@/components/high-probability-dashboard';

export default function HighProbabilityPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">High Probability Setups</h1>
        <p className="text-gray-600">
          Confluence-based trading opportunities where multiple factors align for consistent profits.
          The more things that line up, the better the setup.
        </p>
      </div>
      
      <HighProbabilityDashboard ticker="AAPL" />
    </div>
  );
} 