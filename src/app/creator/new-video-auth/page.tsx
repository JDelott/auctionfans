'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AuthVideoUpload from '@/components/verification/AuthVideoUpload';
import BatchListingForm from '@/components/verification/BatchListingForm';
import NewIDVerification from '@/components/verification/NewIDVerification';

interface IDVerificationStatus {
  verified: boolean;
  status: string;
  canSubmit: boolean;
}

interface AuthVideo {
  id: string;
  video_url: string;
  declaration_text: string;
  declared_items_count: number;
  max_items_allowed: number;
  status: string;
  canCreateListings: boolean;
  itemsListedCount: number;
  maxItemsAllowed: number;
}

type Step = 'overview' | 'id-verification' | 'auth-video' | 'batch-listings';

export default function NewVideoAuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [idVerificationStatus, setIdVerificationStatus] = useState<IDVerificationStatus | null>(null);
  const [authVideos, setAuthVideos] = useState<AuthVideo[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [step, setStep] = useState<Step>('overview');

  useEffect(() => {
    if (!loading && user?.is_creator) {
      checkVerificationStatus();
      fetchAuthVideos();
    }
  }, [user, loading]);

  // Auto-advance through steps based on completion status
  useEffect(() => {
    if (step === 'overview' && idVerificationStatus && authVideos.length >= 0) {
      if (!idVerificationStatus.verified) {
        // ID not verified, start there
      } else if (!authVideos.some(v => v.status === 'verified')) {
        // ID verified but no auth video, go to video step
        setStep('auth-video');
      } else {
        // Both completed, ready for listings
        setStep('batch-listings');
      }
    }
  }, [idVerificationStatus, authVideos, step]);

  const checkVerificationStatus = async () => {
    try {
      // Mock for now since we don't have the ID verification API yet
      setIdVerificationStatus({
        verified: false,
        status: 'pending',
        canSubmit: true
      });
    } catch (error) {
      console.error('Failed to check ID verification status:', error);
    }
  };

  const fetchAuthVideos = async () => {
    try {
      const response = await fetch('/api/creator-verification/auth-video');
      const data = await response.json();
      if (data.success) {
        // Transform the data to match our interface
        const transformedVideos = data.authVideos.map((video: AuthVideo) => ({
          id: video.id,
          video_url: video.video_url || '',
          declaration_text: video.declaration_text || '',
          declared_items_count: video.declared_items_count || 0,
          max_items_allowed: video.max_items_allowed || 10,
          status: video.status || 'pending',
          canCreateListings: video.status === 'verified',
          itemsListedCount: video.declared_items_count || 0,
          maxItemsAllowed: video.max_items_allowed || 10
        }));
        setAuthVideos(transformedVideos);
      }
    } catch (error) {
      console.error('Error fetching auth videos:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleIDVerificationSubmitted = () => {
    // Refresh status and advance to next step
    checkVerificationStatus();
    setStep('auth-video');
  };

  const handleVideoUploaded = () => {
    // Refresh videos and advance to listings
    fetchAuthVideos();
    setStep('batch-listings');
  };

  const handleListingsCreated = () => {
    // Refresh data
    fetchAuthVideos();
    // Could redirect to listings page or show success
    alert('Listings created successfully!');
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
  const hasValidAuthVideo = authVideos.some(video => video.status === 'verified');
  const canCreateListings = hasVerifiedID && hasValidAuthVideo;

  // Get the verified auth video for batch listings
  const verifiedAuthVideo = authVideos.find(video => video.status === 'verified');

  if (step === 'overview') {
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
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-6">Get Started</h2>
              
              {!hasVerifiedID && (
                <div>
                  <p className="text-zinc-300 mb-6">First, verify your identity to get started with authenticated listings.</p>
                  <button
                    onClick={() => setStep('id-verification')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
                  >
                    Start ID Verification
                  </button>
                </div>
              )}

              {hasVerifiedID && !hasValidAuthVideo && (
                <div>
                  <p className="text-zinc-300 mb-6">Great! Your ID is verified. Now record your authentication video.</p>
                  <button
                    onClick={() => setStep('auth-video')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
                  >
                    Record Auth Video
                  </button>
                </div>
              )}

              {canCreateListings && (
                <div>
                  <p className="text-zinc-300 mb-6">Perfect! You&apos;re ready to create authenticated listings.</p>
                  <button
                    onClick={() => setStep('batch-listings')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
                  >
                    Create Listings
                  </button>
                </div>
              )}
            </div>
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

  return (
    <div className="min-h-screen bg-zinc-950 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => setStep('overview')}
          className="mb-6 text-violet-400 hover:text-violet-300 flex items-center gap-2"
        >
          ← Back to Overview
        </button>

        {/* Step Content */}
        {step === 'id-verification' && (
          <NewIDVerification
            onVerificationSubmitted={handleIDVerificationSubmitted}
            onCancel={() => setStep('overview')}
          />
        )}

        {step === 'auth-video' && (
          <AuthVideoUpload
            onVideoUploaded={handleVideoUploaded}
            onCancel={() => setStep('overview')}
          />
        )}

        {step === 'batch-listings' && verifiedAuthVideo && (
          <BatchListingForm
            authVideo={verifiedAuthVideo}
            onListingsCreated={handleListingsCreated}
            onCancel={() => setStep('overview')}
          />
        )}
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
