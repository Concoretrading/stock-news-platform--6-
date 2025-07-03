"use client";
import { useState } from "react";
import { ScreenshotAnalyzer } from "@/components/screenshot-analyzer";
import { Camera } from "lucide-react";

export default function ScreenshotButton({ onCatalystAdded }: { onCatalystAdded?: () => void }) {
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  return (
    <>
      {/* Floating Screenshot Button */}
      <button
        onClick={() => setShowAnalyzer(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Open Screenshot Analyzer"
      >
        <Camera className="h-6 w-6" />
      </button>
      {/* Screenshot Analyzer Modal */}
      {showAnalyzer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-2xl w-full relative">
            <button
              onClick={() => setShowAnalyzer(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
              aria-label="Close"
            >
              ×
            </button>
            <ScreenshotAnalyzer onCatalystAdded={() => {
              setShowAnalyzer(false);
              onCatalystAdded?.();
            }} />
          </div>
        </div>
      )}
    </>
  );
} 