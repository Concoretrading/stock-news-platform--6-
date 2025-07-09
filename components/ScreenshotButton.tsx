"use client";
import { useState, useRef } from "react";
import { ScreenshotAnalyzer } from "@/components/screenshot-analyzer";
import { Camera, TestTube } from "lucide-react";

export default function ScreenshotButton({ onCatalystAdded }: { onCatalystAdded?: () => void }) {
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [externalFile, setExternalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simple mobile detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleButtonClick = () => {
    if (isMobile) {
      fileInputRef.current?.click();
    } else {
      setShowAnalyzer(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('📁 File selected via camera button:', file.name, file.type);
      setExternalFile(file);
      setShowAnalyzer(true);
    }
  };

  const handleTestClick = () => {
    console.log('🧪 Test button clicked - forcing analyzer open');
    setShowAnalyzer(true);
  };

  return (
    <>
      {/* Floating Screenshot Button */}
      <button
        onClick={handleButtonClick}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Open Screenshot Analyzer"
      >
        <Camera className="h-6 w-6" />
      </button>
      
      {/* Test Button for debugging */}
      <button
        onClick={handleTestClick}
        className="fixed bottom-20 right-6 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg p-3 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-400"
        aria-label="Test Screenshot Analyzer"
      >
        <TestTube className="h-5 w-5" />
      </button>
      
      {/* Hidden file input for mobile photo picker */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      {/* Screenshot Analyzer Modal */}
      {showAnalyzer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-2xl w-full relative">
            <button
              onClick={() => { setShowAnalyzer(false); setExternalFile(null); }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
              aria-label="Close"
            >
              ×
            </button>
            <ScreenshotAnalyzer
              externalFile={externalFile}
              onExternalFileHandled={() => setExternalFile(null)}
              onCatalystAdded={() => {
                console.log('🎉 Catalyst added - closing analyzer');
                setShowAnalyzer(false);
                setExternalFile(null);
                onCatalystAdded?.();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
} 