'use client';

import { useState } from 'react';

interface DetectedItem {
  id: string;
  item_name: string;
  item_description: string;
  confidence_score: number;
  screenshot_timestamp: number;
  suggested_category: string;
  condition: string;
}

interface ItemDetectionProps {
  videoSessionId: string;
  screenshotCount: number;
  onDetectionComplete: (items: DetectedItem[]) => void;
}

export default function ItemDetection({ videoSessionId, screenshotCount, onDetectionComplete }: ItemDetectionProps) {
  const [detecting, setDetecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const startDetection = async () => {
    setDetecting(true);
    setProgress(0);
    setCurrentStep('Analyzing screenshots with AI...');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 800);

      const response = await fetch('/api/video-sessions/detect-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoSessionId })
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (response.ok) {
        setCurrentStep(`Found ${data.detectedItems.length} sellable items!`);
        setTimeout(() => {
          onDetectionComplete(data.detectedItems);
        }, 1500);
      } else {
        setCurrentStep('Detection failed. Please try again.');
      }

    } catch (error) {
      setCurrentStep('Detection failed. Please try again.');
      console.error('Detection error:', error);
    } finally {
      setTimeout(() => setDetecting(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800/50">
        <div className="mb-8">
          <div className="p-4 bg-violet-600/20 rounded-2xl w-fit mx-auto mb-6">
            <svg className="w-12 h-12 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">AI Item Detection</h2>
          <p className="text-zinc-400 mb-6">
            Our AI will analyze your {screenshotCount} screenshots to identify sellable items automatically.
          </p>
        </div>

        {!detecting ? (
          <div className="space-y-6">
            <div className="bg-zinc-800/50 rounded-xl p-6 text-left">
              <h3 className="text-white font-medium mb-3">What AI looks for:</h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                  Products and items clearly visible in screenshots
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                  Item names, descriptions, and categories
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                  Estimated condition and marketability
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                  Confidence scores for each detection
                </li>
              </ul>
            </div>

            <button
              onClick={startDetection}
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              🔍 Start AI Detection
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto">
              <svg className="w-20 h-20 text-violet-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            
            <div>
              <p className="text-white font-medium mb-3">{currentStep}</p>
              <div className="w-full bg-zinc-800 rounded-full h-3">
                <div 
                  className="bg-violet-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-zinc-400 text-sm mt-2">{progress}%</p>
            </div>

            <div className="text-xs text-zinc-500">
              <p>AI is analyzing each screenshot for sellable items...</p>
              <p>This may take a few moments depending on the number of screenshots.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
