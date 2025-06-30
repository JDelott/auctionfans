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
          {/* Header with electric accents */}
          <div className="text-center mb-12 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
              Verified Creator System
            </h1>
            <p className="text-xl text-zinc-300 max-w-2xl mx-auto font-light">
              Three-step verification process for authenticated listings
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-12 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-emerald-500/5 rounded-2xl blur-xl"></div>
            <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8">
              <div className="flex items-center justify-between max-w-3xl mx-auto">
                <StepIndicator
                  number={1}
                  title="Identity"
                  description="Verify with ID + selfie"
                  completed={hasVerifiedID}
                  active={!hasVerifiedID}
                />
                <div className="flex-1 h-[2px] bg-zinc-800 mx-6 relative overflow-hidden">
                  <div 
                    className={`absolute inset-0 transition-all duration-700 ${hasVerifiedID ? 'bg-gradient-to-r from-violet-500 to-violet-400 w-full' : 'bg-transparent w-0'}`}
                  />
                </div>
                <StepIndicator
                  number={2}
                  title="Declaration"
                  description="Record authentication video"
                  completed={hasValidAuthVideo}
                  active={hasVerifiedID && !hasValidAuthVideo}
                />
                <div className="flex-1 h-[2px] bg-zinc-800 mx-6 relative overflow-hidden">
                  <div 
                    className={`absolute inset-0 transition-all duration-700 ${canCreateListings ? 'bg-gradient-to-r from-violet-500 to-emerald-500 w-full' : 'bg-transparent w-0'}`}
                  />
                </div>
                <StepIndicator
                  number={3}
                  title="Listings"
                  description="Create verified auctions"
                  completed={false}
                  active={canCreateListings}
                />
              </div>
            </div>
          </div>

          {/* Current Step Content */}
          <div className="relative bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-2xl"></div>
            <div className="relative text-center">
              <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Get Started</h2>
              
              {!hasVerifiedID && (
                <div>
                  <p className="text-zinc-300 mb-8 max-w-md mx-auto leading-relaxed">
                    Begin your verification journey to unlock authenticated listing capabilities.
                  </p>
                  <button
                    onClick={() => setStep('id-verification')}
                    className="group relative overflow-hidden border border-violet-500/40 hover:border-violet-400/80 bg-zinc-950/90 px-8 py-4 rounded-lg transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full group-hover:shadow-lg group-hover:shadow-violet-400/50"></div>
                      <span className="text-violet-300 group-hover:text-white font-medium tracking-wider">START VERIFICATION</span>
                    </div>
                  </button>
                </div>
              )}

              {hasVerifiedID && !hasValidAuthVideo && (
                <div>
                  <p className="text-zinc-300 mb-8 max-w-md mx-auto leading-relaxed">
                    Identity verified. Record your authentication video to continue.
                  </p>
                  <button
                    onClick={() => setStep('auth-video')}
                    className="group relative overflow-hidden border border-violet-500/40 hover:border-violet-400/80 bg-zinc-950/90 px-8 py-4 rounded-lg transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full group-hover:shadow-lg group-hover:shadow-violet-400/50"></div>
                      <span className="text-violet-300 group-hover:text-white font-medium tracking-wider">RECORD VIDEO</span>
                    </div>
                  </button>
                </div>
              )}

              {canCreateListings && (
                <div>
                  <p className="text-zinc-300 mb-8 max-w-md mx-auto leading-relaxed">
                    Verification complete. Ready to create authenticated listings.
                  </p>
                  <button
                    onClick={() => setStep('batch-listings')}
                    className="group relative overflow-hidden border border-emerald-500/40 hover:border-emerald-400/80 bg-zinc-950/90 px-8 py-4 rounded-lg transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full group-hover:shadow-lg group-hover:shadow-emerald-400/50"></div>
                      <span className="text-emerald-300 group-hover:text-white font-medium tracking-wider">CREATE LISTINGS</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <BenefitCard
              title="Trust Protocol"
              description="Verified creator badges build buyer confidence and command premium prices"
            />
            <BenefitCard
              title="Batch Processing"
              description="One verification unlocks unlimited authenticated listings with minimal friction"
            />
            <BenefitCard
              title="Market Position"
              description="Stand out in the marketplace with official verification status"
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
          className="mb-6 text-violet-400 hover:text-violet-300 flex items-center gap-2 transition-colors duration-300"
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
    <div className="text-center relative">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mb-4 transition-all duration-500 relative overflow-hidden ${
        completed 
          ? 'bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/30' 
          : active 
            ? 'bg-zinc-950 border-2 border-violet-500/60 text-violet-400' 
            : 'bg-zinc-900 border border-zinc-700 text-zinc-500'
      }`}>
        {completed && (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-400/20 to-transparent"></div>
        )}
        <span className="relative">{completed ? '✓' : number}</span>
      </div>
      <h3 className={`font-medium mb-2 text-sm tracking-wider uppercase ${active || completed ? 'text-white' : 'text-zinc-500'}`}>
        {title}
      </h3>
      <p className={`text-xs leading-relaxed ${active || completed ? 'text-zinc-300' : 'text-zinc-600'}`}>
        {description}
      </p>
    </div>
  );
}

interface BenefitCardProps {
  title: string;
  description: string;
}

function BenefitCard({ title, description }: BenefitCardProps) {
  return (
    <div className="group relative bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 text-center transition-all duration-300 hover:border-zinc-700/50">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="w-3 h-3 bg-violet-500/40 rounded-full mx-auto mb-4 group-hover:bg-violet-400/60 transition-colors duration-300"></div>
      <h3 className="text-white font-bold mb-3 tracking-tight">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
