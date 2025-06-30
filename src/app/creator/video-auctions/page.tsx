'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import VideoUpload from '@/components/video-auctions/VideoUpload';
import VideoPlayer from '@/components/video-auctions/VideoPlayer';
import ItemDetection from '@/components/video-auctions/ItemDetection';
import ItemReview from '@/components/video-auctions/ItemReview';
import AuctionSetup from '@/components/video-auctions/AuctionSetup';

type VideoAuctionStep = 
  | 'welcome' 
  | 'upload' 
  | 'screenshots' 
  | 'ai_detection' 
  | 'review_items' 
  | 'auction_setup'
  | 'publish'
  | 'success';

interface VideoSession {
  id: string;
  creator_id: string;
  video_url: string;
  status: string;
  created_at: string;
}

interface Screenshot {
  id: string;
  timestamp: number;
  imageUrl: string;
}

// Match ItemDetection component interface
interface DetectedItemFromAI {
  id: string;
  item_name: string;
  item_description: string;
  confidence_score: number;
  screenshot_timestamp: number;
  suggested_category: string;
  condition: string;
}

interface AuctionConfig {
  itemId: string;
  starting_price: string;
  reserve_price: string;
  buy_now_price: string;
  duration_days: string;
}

export default function VideoAuctionCreatorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState<VideoAuctionStep>('welcome');
  const [videoSession, setVideoSession] = useState<VideoSession | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [detectedItems, setDetectedItems] = useState<DetectedItemFromAI[]>([]);
  const [finalItems, setFinalItems] = useState<DetectedItemFromAI[]>([]);
  const [auctionConfigs, setAuctionConfigs] = useState<AuctionConfig[]>([]);
  const [publishing, setPublishing] = useState(false);

  // Flags to track completion of each step
  const [uploadComplete, setUploadComplete] = useState(false);
  const [screenshotsComplete, setScreenshotsComplete] = useState(false);
  const [detectionComplete, setDetectionComplete] = useState(false);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  if (!user?.is_creator) {
    router.push('/auth/login');
    return null;
  }

  const handleVideoUpload = (session: VideoSession) => {
    setVideoSession(session);
    setUploadComplete(true);
  };

  const handleScreenshotsUpload = (session: VideoSession, screenshots: Screenshot[]) => {
    setVideoSession(session);
    setScreenshots(screenshots);
    setScreenshotsComplete(true);
  };

  const handleScreenshotCaptured = (screenshot: Screenshot) => {
    setScreenshots(prev => [...prev, screenshot]);
  };

  const handleItemsDetected = (items: DetectedItemFromAI[]) => {
    setDetectedItems(items);
    setFinalItems(items);
    setDetectionComplete(true);
  };

  const handleItemsApproved = (items: DetectedItemFromAI[]) => {
    setFinalItems(items);
    setReviewComplete(true);
  };

  const handleAuctionSetup = (configs: AuctionConfig[]) => {
    setAuctionConfigs(configs);
    setSetupComplete(true);
  };

  const handlePublish = async () => {
    if (!videoSession || finalItems.length === 0 || auctionConfigs.length === 0) {
      alert('Missing required data to publish auctions');
      return;
    }

    setPublishing(true);

    try {
      const response = await fetch('/api/video-sessions/publish-auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoSessionId: videoSession.id,
          items: finalItems,
          auctionConfigs: auctionConfigs
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep('success');
      } else {
        throw new Error(data.error || 'Failed to publish auctions');
      }
    } catch (error) {
      console.error('Publication error:', error);
      alert(`Failed to publish auctions: ${error}`);
    } finally {
      setPublishing(false);
    }
  };

  const stepTitles = {
    welcome: 'Video Auctions',
    upload: 'Upload Video',
    screenshots: 'Capture Screenshots',
    ai_detection: 'AI Item Detection',
    review_items: 'Review Items',
    auction_setup: 'Setup Auctions',
    publish: 'Ready to Publish',
    success: 'Success!'
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">{stepTitles[currentStep]}</h1>
            <button
              onClick={() => router.push('/creator')}
              className="text-zinc-400 hover:text-white text-sm"
            >
              ← Back to Creator Dashboard
            </button>
          </div>
          
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {['upload', 'screenshots', 'ai_detection', 'review_items', 'auction_setup', 'publish'].map((step, index) => {
              const completedSteps = ['upload', 'screenshots', 'ai_detection', 'review_items', 'auction_setup'].indexOf(currentStep);
              const isCompleted = index < completedSteps;
              const isCurrent = step === currentStep;
              
              return (
                <div key={step} className="flex items-center flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    isCompleted ? 'bg-green-600 text-white' :
                    isCurrent ? 'bg-violet-600 text-white' :
                    'bg-zinc-700 text-zinc-400'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  {index < 5 && (
                    <div className={`w-8 h-0.5 ${isCompleted ? 'bg-green-600' : 'bg-zinc-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
          
          {/* Welcome */}
          {currentStep === 'welcome' && (
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold text-white mb-4">Create Multiple Auctions from One Video</h2>
              <p className="text-zinc-300 mb-8 max-w-2xl mx-auto">
                Upload your video, capture screenshots of items, let AI detect them, and create multiple auction listings in one process.
              </p>
              <button
                onClick={() => setCurrentStep('upload')}
                className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
              >
                Start Creating Auctions
              </button>
            </div>
          )}

          {/* Upload Video */}
          {currentStep === 'upload' && (
            <div>
              <VideoUpload 
                onVideoUploadComplete={handleVideoUpload}
                onScreenshotsUploadComplete={handleScreenshotsUpload}
              />
              
              {uploadComplete && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setCurrentStep('screenshots')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Continue to Screenshots →
                  </button>
                </div>
              )}

              {screenshotsComplete && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setCurrentStep('ai_detection')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Continue to AI Detection →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Screenshot Capture */}
          {currentStep === 'screenshots' && videoSession && (
            <div>
              <VideoPlayer
                videoUrl={videoSession.video_url}
                videoSessionId={videoSession.id}
                onScreenshotCaptured={handleScreenshotCaptured}
                screenshots={screenshots}
              />
              
              {screenshots.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setCurrentStep('ai_detection')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Continue with {screenshots.length} Screenshot{screenshots.length !== 1 ? 's' : ''} →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AI Detection */}
          {currentStep === 'ai_detection' && videoSession && screenshots.length > 0 && (
            <div>
              <ItemDetection
                videoSessionId={videoSession.id}
                screenshotCount={screenshots.length}
                onDetectionComplete={handleItemsDetected}
              />
              
              {detectionComplete && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setCurrentStep('review_items')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Review {detectedItems.length} Detected Items →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Review Items */}
          {currentStep === 'review_items' && (
            <div>
              <ItemReview
                detectedItems={detectedItems}
                onItemsApproved={handleItemsApproved}
              />
              
              {reviewComplete && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setCurrentStep('auction_setup')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Setup Auctions for {finalItems.length} Items →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Auction Setup */}
          {currentStep === 'auction_setup' && (
            <div>
              <AuctionSetup
                items={finalItems.map(item => ({
                  id: item.id,
                  item_name: item.item_name,
                  item_description: item.item_description,
                  suggested_category: item.suggested_category,
                  condition: item.condition
                }))}
                onSetupComplete={handleAuctionSetup}
              />
              
              {setupComplete && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setCurrentStep('publish')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Ready to Publish {finalItems.length} Auctions →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Publishing */}
          {currentStep === 'publish' && (
            <div className="text-center py-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-4">Ready to Publish!</h3>
                <div className="bg-zinc-800/50 rounded-lg p-4 mb-6">
                  <p className="text-zinc-300 mb-2">
                    You&apos;re about to create <span className="text-violet-400 font-bold">{finalItems.length}</span> auction listings from your video.
                  </p>
                  <p className="text-zinc-400 text-sm">
                    Each item will be published as a separate auction with the pricing and details you configured.
                  </p>
                </div>
              </div>
              
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors flex items-center justify-center mx-auto"
              >
                {publishing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Publishing {finalItems.length} Auctions...
                  </>
                ) : (
                  `🚀 Publish ${finalItems.length} Auctions`
                )}
              </button>
            </div>
          )}

          {/* Success */}
          {currentStep === 'success' && (
            <div className="text-center py-8">
              <div className="text-green-400 text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-white mb-4">Auctions Published Successfully!</h3>
              <p className="text-zinc-300 mb-6">
                {finalItems.length} auction listings have been created and are now live.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/creator/auctions')}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  View My Auctions
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-zinc-600 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create More
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
