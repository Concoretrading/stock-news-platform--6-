'use client';

import React from 'react';

export function SplitScreenLayout() {
  console.log('🔄 SplitScreenLayout component rendering...');
  
  return (
    <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-xl font-bold text-red-800 mb-4">Split Screen Layout</h3>
      <p className="text-red-700">This is a test of the SplitScreenLayout component.</p>
      <p className="text-sm text-red-600 mt-2">If you can see this, the component is working!</p>
    </div>
  );
} 