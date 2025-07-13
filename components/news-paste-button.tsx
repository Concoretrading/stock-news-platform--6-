import React from "react";
"use client"

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { NewsPasteArea } from './news-paste-area'

export function NewsPasteButton() {
  const [showPasteArea, setShowPasteArea] = useState(false)

  return (
    <>
      {/* Floating News Button */}
      <button
        onClick={() => setShowPasteArea(true)}
        className="fixed bottom-6 left-6 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-400"
        aria-label="Paste News Article"
        title="Paste News Article"
      >
        <FileText className="h-6 w-6" />
      </button>

      {/* News Paste Area Modal */}
      <NewsPasteArea 
        isOpen={showPasteArea}
        onClose={() => setShowPasteArea(false)}
      />
    </>
  )
} 