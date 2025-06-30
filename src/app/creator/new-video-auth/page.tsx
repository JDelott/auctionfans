'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface IDVerificationStatus {
  verified: boolean;
  status: string;
  canSubmit: boolean;
}

interface AuthVideo {
  id: string;
  status: string;
  canCreateListings: boolean;
  itemsListedCount: number;
  maxItemsAllowed: number;
}

export default function NewVideoAuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [idVerificationStatus, setIdVerificationStatus] = useState<IDVerificationStatus | null>(null);
  const [authVideos, setAuthVideos] = useState<AuthVideo[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    if (!loading && user?.is_creator) {
      checkVerificationStatus();
      fetchAuthVideos();
    }
  }, [user, loading]);

  const checkVerificationStatus = async () => {
    try {
      const response = await fetch('/api/creator-verification/id-verification');
      const data = await response.json();
      setIdVerificationStatus(data);
    } catch (error) {
      console.error('Failed to check ID verification status:', error);
    }
  };

  const fetchAuthVideos = async () => {
    try {
      const response = await fetch('/api/creator-verification/auth-video');
      const data = await response.json();
      setAuthVideos(data.authVideos || []);
    } catch (error) {
      console.error('Failed to fetch auth videos:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  if (loading || loadingStatus) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user?.is_creator) {
    router.push('/auth/login');
    return null;
  }

  const hasVerifiedID = idVerificationStatus?.verified ?? false;
  const hasValidAuthVideo = authVideos.some(video => video.canCreateListings);
  const canCreateListings = hasVerifiedID && hasValidAuthVideo;

  return (
    <div className="min-h-screen bg-zinc-950 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-4">
            New Video Authentication System
          </h1>
          <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
            Streamlined 6-step process for authenticated item listings
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <StepIndicator
              number={1}
              title="ID Verification"
              description="Verify identity with ID + selfie"
              completed={hasVerifiedID}
              active={!hasVerifiedID}
            />
            <div className="flex-1 h-1 bg-zinc-800 mx-4">
              <div 
                className={`h-full transition-all duration-500 ${hasVerifiedID ? 'bg-violet-500 w-full' : 'bg-transparent w-0'}`}
              />
            </div>
            <StepIndicator
              number={2}
              title="Auth Video"
              description="Record video declaring items"
              completed={hasValidAuthVideo}
              active={hasVerifiedID && !hasValidAuthVideo}
            />
            <div className="flex-1 h-1 bg-zinc-800 mx-4">
              <div 
                className={`h-full transition-all duration-500 ${canCreateListings ? 'bg-violet-500 w-full' : 'bg-transparent w-0'}`}
              />
            </div>
            <StepIndicator
              number={3}
              title="Create Listings"
              description="Add items via form"
              completed={false}
              active={canCreateListings}
            />
          </div>
        </div>

        {/* Current Step Content */}
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8">
          {!hasVerifiedID && (
            <IDVerificationStep 
              status={idVerificationStatus}
              onVerificationSubmitted={() => {
                checkVerificationStatus();
              }}
            />
          )}

          {hasVerifiedID && !hasValidAuthVideo && (
            <AuthVideoStep 
              onVideoUploaded={() => {
                fetchAuthVideos();
              }}
            />
          )}

          {canCreateListings && (
            <BatchListingsStep 
              authVideos={authVideos.filter(v => v.canCreateListings)}
              onListingsCreated={() => {
                // Handle listings created
                fetchAuthVideos();
              }}
            />
          )}
        </div>

        {/* Benefits Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <BenefitCard
            icon="🛡️"
            title="Enhanced Trust"
            description="Buyers see verified creator badges and authentication certificates"
          />
          <BenefitCard
            icon="⚡"
            title="Batch Efficiency"
            description="Create multiple authenticated listings from one verification video"
          />
          <BenefitCard
            icon="🏆"
            title="Premium Positioning"
            description="Authenticated items stand out and command higher prices"
          />
        </div>
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  number: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

function StepIndicator({ number, title, description, completed, active }: StepIndicatorProps) {
  return (
    <div className="text-center">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-3 transition-all duration-300 ${
        completed 
          ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' 
          : active 
            ? 'bg-violet-600/20 border-2 border-violet-500 text-violet-400' 
            : 'bg-zinc-800 text-zinc-500'
      }`}>
        {completed ? '✓' : number}
      </div>
      <h3 className={`font-medium mb-1 ${active || completed ? 'text-white' : 'text-zinc-500'}`}>
        {title}
      </h3>
      <p className={`text-sm ${active || completed ? 'text-zinc-300' : 'text-zinc-600'}`}>
        {description}
      </p>
    </div>
  );
}

interface IDVerificationStepProps {
  status: IDVerificationStatus | null;
  onVerificationSubmitted: () => void;
}

function IDVerificationStep({ status, onVerificationSubmitted }: IDVerificationStepProps) {
  const handleStartVerification = () => {
    window.location.href = '/creator/id-verification';
    onVerificationSubmitted();
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-4">Step 1: ID Verification</h2>
      <p className="text-zinc-300 mb-8">
        Verify your identity with a government-issued ID and selfie photos
      </p>

      {status?.verified ? (
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-6">
          <div className="text-green-400 text-4xl mb-4">✓</div>
          <h3 className="text-green-400 text-xl font-bold mb-2">ID Verified!</h3>
          <p className="text-green-300">Your identity has been successfully verified.</p>
        </div>
      ) : status?.canSubmit ? (
        <button
          onClick={handleStartVerification}
          className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
        >
          Start ID Verification
        </button>
      ) : (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-6">
          <h3 className="text-amber-400 font-medium mb-2">Verification In Progress</h3>
          <p className="text-amber-300">
            Your ID verification is being reviewed. This typically takes 1-3 business days.
          </p>
        </div>
      )}
    </div>
  );
}

interface AuthVideoStepProps {
  onVideoUploaded: () => void;
}

function AuthVideoStep({ onVideoUploaded }: AuthVideoStepProps) {
  const handleRecordVideo = () => {
    window.location.href = '/creator/auth-video-upload';
    onVideoUploaded();
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-4">Step 2: Authentication Video</h2>
      <p className="text-zinc-300 mb-8">
        Record a video declaring the items you want to sell
      </p>

      <div className="bg-violet-900/20 border border-violet-700/30 rounded-lg p-6 mb-8">
        <h3 className="text-white font-medium mb-4">Video Requirements:</h3>
        <ul className="text-zinc-300 text-left space-y-2">
          <li>• Clearly state how many items you&apos;re declaring</li>
          <li>• Show your face throughout the video</li>
          <li>• Speak clearly and mention each item category</li>
          <li>• Keep video under 5 minutes</li>
        </ul>
      </div>

      <button
        onClick={handleRecordVideo}
        className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
      >
        Record Authentication Video
      </button>
    </div>
  );
}

interface BatchListingsStepProps {
  authVideos: AuthVideo[];
  onListingsCreated: () => void;
}

function BatchListingsStep({ authVideos, onListingsCreated }: BatchListingsStepProps) {
  const validVideo = authVideos[0];
  
  const handleCreateListings = () => {
    window.location.href = '/creator/batch-listings';
    onListingsCreated();
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-4">Step 3: Create Batch Listings</h2>
      <p className="text-zinc-300 mb-8">
        Add your items using the form-based listing system
      </p>

      {validVideo && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-6 mb-8">
          <h3 className="text-green-400 font-medium mb-2">Ready to Create Listings!</h3>
          <p className="text-green-300 mb-4">
            You can create up to {validVideo.maxItemsAllowed - validVideo.itemsListedCount} more authenticated listings.
          </p>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div 
              className="bg-violet-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(validVideo.itemsListedCount / validVideo.maxItemsAllowed) * 100}%` }}
            />
          </div>
          <p className="text-zinc-400 text-sm mt-2">
            {validVideo.itemsListedCount} / {validVideo.maxItemsAllowed} items used
          </p>
        </div>
      )}

      <button
        onClick={handleCreateListings}
        className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
      >
        Create Batch Listings
      </button>
    </div>
  );
}

interface BenefitCardProps {
  icon: string;
  title: string;
  description: string;
}

function BenefitCard({ icon, title, description }: BenefitCardProps) {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-white font-bold mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm">{description}</p>
    </div>
  );
} 
