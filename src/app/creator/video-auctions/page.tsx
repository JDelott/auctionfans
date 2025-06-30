'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import VideoUpload from '@/components/video-auctions/VideoUpload';
import VideoPlayer from '@/components/video-auctions/VideoPlayer';
import ItemDetection from '@/components/video-auctions/ItemDetection';
import ItemReview from '@/components/video-auctions/ItemReview';
import AuctionSetup from '@/components/video-auctions/AuctionSetup';
import CodeVerification from '@/components/verification/CodeVerification';

type VideoAuctionStep = 
  | 'welcome' 
  | 'upload' 
  | 'screenshots' 
  | 'ai_detection' 
  | 'review_items' 
  | 'auction_setup'
  | 'verification' 
  | 'publish_success';

interface VideoSession {
  id: string;
  video_url: string;
}

interface Screenshot {
  id: string;
  timestamp: number;
  imageUrl: string;
}

interface DetectedItem {
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

interface PublishedAuction {
  id: string;
  item_name: string;
  certificate: {
    certificate_hash: string;
    video_session_id: string;
    verification_code: string;
    item_timestamp: number;
    auction_id: string;
    authenticated_at: string;
  };
}

export default function VideoAuctionCreatorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<VideoAuctionStep>('welcome');
  const [videoSession, setVideoSession] = useState<VideoSession | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [approvedItems, setApprovedItems] = useState<DetectedItem[]>([]);
  const [auctionConfigs, setAuctionConfigs] = useState<AuctionConfig[]>([]);
  const [publishedAuctions, setPublishedAuctions] = useState<PublishedAuction[]>([]);

  const stepConfig = {
    welcome: { title: 'Welcome', description: 'Video-to-auctions authentication system' },
    upload: { title: 'Upload Video', description: 'Upload your video file' },
    screenshots: { title: 'Capture Screenshots', description: 'Capture frames where items appear' },
    ai_detection: { title: 'AI Item Detection', description: 'AI analyzes screenshots for sellable items' },
    review_items: { title: 'Review Items', description: 'Edit and confirm detected items' },
    auction_setup: { title: 'Auction Setup', description: 'Configure pricing for each item' },
    verification: { title: 'Authentication', description: 'Verify authenticity with handwritten code' },
    publish_success: { title: 'Published!', description: 'All auctions are now live' }
  };

  const steps: VideoAuctionStep[] = ['welcome', 'upload', 'screenshots', 'ai_detection', 'review_items', 'auction_setup', 'verification', 'publish_success'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleVideoUpload = (session: VideoSession) => {
    setVideoSession(session);
    setCurrentStep('screenshots');
  };

  const handleScreenshotCaptured = (screenshot: Screenshot) => {
    setScreenshots(prev => [...prev, screenshot]);
  };

  const handleDetectionComplete = (items: DetectedItem[]) => {
    setDetectedItems(items);
    setCurrentStep('review_items');
  };

  const handleItemsApproved = (items: DetectedItem[]) => {
    setApprovedItems(items);
    setCurrentStep('auction_setup');
  };

  const handleAuctionSetup = (configs: AuctionConfig[]) => {
    setAuctionConfigs(configs);
    setCurrentStep('verification');
  };

  const handleVerificationComplete = async () => {
    // Publish auctions
    try {
      const response = await fetch('/api/video-sessions/publish-auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoSessionId: videoSession?.id,
          auctionConfigs
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setPublishedAuctions(data.publishedAuctions);
        setCurrentStep('publish_success');
      } else {
        console.error('Failed to publish auctions:', data.error);
      }
    } catch (error) {
      console.error('Publishing error:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  if (!user?.is_creator) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Video Authentication System</h1>
              <p className="text-zinc-400 text-sm">Turn your video into multiple authenticated auctions</p>
            </div>
            <button
              onClick={() => router.push('/creator')}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {currentStep !== 'welcome' && currentStep !== 'publish_success' && (
        <div className="border-b border-zinc-800/50 bg-zinc-900/20">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-300">
                Step {currentStepIndex + 1} of {steps.length}: {stepConfig[currentStep].title}
              </span>
              <span className="text-sm text-zinc-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div 
                className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Welcome Step */}
        {currentStep === 'welcome' && (
          <div className="text-center max-w-2xl mx-auto">
            <div className="p-4 bg-violet-600/20 rounded-2xl w-fit mx-auto mb-8">
              <svg className="w-16 h-16 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold mb-4">Video Authentication System</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Upload one video and create multiple authenticated auctions. AI detects items, you verify authenticity, and all auctions go live together.
            </p>

            <button
              onClick={() => setCurrentStep('upload')}
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              Start Video Upload Process
            </button>
          </div>
        )}

        {/* Upload Step */}
        {currentStep === 'upload' && (
          <VideoUpload onUploadComplete={handleVideoUpload} />
        )}

        {/* Screenshots Step */}
        {currentStep === 'screenshots' && videoSession && (
          <div>
            <VideoPlayer
              videoUrl={videoSession.video_url}
              videoSessionId={videoSession.id}
              onScreenshotCaptured={handleScreenshotCaptured}
              screenshots={screenshots}
            />
            
            {screenshots.length > 0 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setCurrentStep('ai_detection')}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
                >
                  Continue with {screenshots.length} Screenshot{screenshots.length !== 1 ? 's' : ''} →
                </button>
              </div>
            )}
          </div>
        )}

        {/* AI Detection Step */}
        {currentStep === 'ai_detection' && videoSession && (
          <ItemDetection
            videoSessionId={videoSession.id}
            screenshotCount={screenshots.length}
            onDetectionComplete={handleDetectionComplete}
          />
        )}

        {/* Review Items Step */}
        {currentStep === 'review_items' && (
          <ItemReview
            detectedItems={detectedItems}
            onItemsApproved={handleItemsApproved}
          />
        )}

        {/* Auction Setup Step */}
        {currentStep === 'auction_setup' && (
          <AuctionSetup
            items={approvedItems}
            onSetupComplete={handleAuctionSetup}
          />
        )}

        {/* Verification Step */}
        {currentStep === 'verification' && videoSession && (
          <div className="max-w-md mx-auto">
            <CodeVerification
              videoSessionId={videoSession.id}
              onVerified={handleVerificationComplete}
              onCancel={() => setCurrentStep('auction_setup')}
            />
          </div>
        )}

        {/* Success Step */}
        {currentStep === 'publish_success' && (
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-green-400 text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold mb-4">Auctions Published!</h2>
            <p className="text-zinc-400 mb-8">
              Successfully published {publishedAuctions.length} authenticated auctions. All items are now live with authentication certificates.
            </p>
            
            <div className="bg-zinc-900/50 rounded-xl p-6 mb-8">
              <h3 className="text-white font-medium mb-4">Published Auctions:</h3>
              <div className="space-y-2">
                {publishedAuctions.map((auction) => (
                  <div key={auction.id} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{auction.item_name}</span>
                    <span className="text-violet-400">Certificate: {auction.certificate.certificate_hash}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-medium transition-colors"
              >
                View My Auctions
              </button>
              <button
                onClick={() => {
                  // Reset state for another session
                  setCurrentStep('welcome');
                  setVideoSession(null);
                  setScreenshots([]);
                  setDetectedItems([]);
                  setApprovedItems([]);
                  setAuctionConfigs([]);
                  setPublishedAuctions([]);
                }}
                className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium transition-colors"
              >
                Create Another Video Session
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
