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

interface AuthenticatedListing {
  id: string;
  auth_video_id: string;
  auction_item_id: string;
  item_position_in_video: number;
  video_timestamp_start: number | null;
  video_timestamp_end: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  starting_price: number;
  current_price: number;
  auction_status: string;
  start_time: string;
  end_time: string;
  condition: string;
  video_url: string;
  declaration_text: string;
  video_status: string;
  category_name: string | null;
  bid_count: number;
}

type Step = 'overview' | 'id-verification' | 'auth-video' | 'batch-listings';

export default function NewVideoAuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [idVerificationStatus, setIdVerificationStatus] = useState<IDVerificationStatus | null>(null);
  const [authVideos, setAuthVideos] = useState<AuthVideo[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [step, setStep] = useState<Step>('overview'); // Always start with overview
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{type: 'video' | 'listing', id: string} | null>(null);
  const [authenticatedListings, setAuthenticatedListings] = useState<AuthenticatedListing[]>([]);

  useEffect(() => {
    if (!loading && user?.is_creator) {
      checkVerificationStatus();
      fetchAuthVideos();
      fetchAuthenticatedListings();
    }
  }, [user, loading]);

  const checkVerificationStatus = async () => {
    try {
      const response = await fetch('/api/creator-verification/id-verification');
      const data = await response.json();
      
      if (response.ok) {
        setIdVerificationStatus({
          verified: data.verified,
          status: data.status,
          canSubmit: data.canSubmit
        });
      } else {
        setIdVerificationStatus({
          verified: false,
          status: 'none',
          canSubmit: true
        });
      }
    } catch (error) {
      console.error('Failed to check ID verification status:', error);
      setIdVerificationStatus({
        verified: false,
        status: 'error',
        canSubmit: true
      });
    }
  };

  const fetchAuthVideos = async () => {
    try {
      const response = await fetch('/api/creator-verification/auth-video');
      const data = await response.json();
      if (data.success) {
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

  const fetchAuthenticatedListings = async () => {
    try {
      const response = await fetch('/api/creator-verification/batch-listings');
      const data = await response.json();
      if (data.success) {
        setAuthenticatedListings(data.authenticated_listings);
      }
    } catch (error) {
      console.error('Error fetching authenticated listings:', error);
    }
  };

  const handleIDVerificationSubmitted = () => {
    checkVerificationStatus();
    setStep('overview'); // Return to overview to see updated status
  };

  const handleVideoUploaded = () => {
    fetchAuthVideos();
    setStep('overview'); // Return to overview to see new video
  };

  const handleListingsCreated = () => {
    fetchAuthVideos();
    setStep('overview'); // Return to overview
  };

  const handleDeleteVideo = async (videoId: string) => {
    setDeletingVideoId(videoId);
    try {
      const response = await fetch(`/api/creator-verification/auth-video?id=${videoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAuthVideos();
        await fetchAuthenticatedListings(); // Refresh listings too
        setShowDeleteConfirm(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    } finally {
      setDeletingVideoId(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    setDeletingListingId(listingId);
    try {
      const response = await fetch(`/api/creator-verification/batch-listings?id=${listingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAuthenticatedListings();
        setShowDeleteConfirm(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing');
    } finally {
      setDeletingListingId(null);
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
  const verifiedVideos = authVideos.filter(video => video.status === 'verified');
  const canCreateListings = hasVerifiedID && verifiedVideos.length > 0;

  if (step === 'overview') {
    return (
      <div className="min-h-screen bg-zinc-950 py-8">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
              Verified Creator System
            </h1>
            <p className="text-xl text-zinc-300 max-w-2xl mx-auto font-light">
              Manage your verification status and authenticated videos
            </p>
          </div>

          {/* Progress Overview */}
          <div className="mb-12 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-emerald-500/5 rounded-2xl blur-xl"></div>
            <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8">
              <div className="flex items-center justify-between max-w-3xl mx-auto">
                <StepIndicator
                  number={1}
                  title="Identity"
                  description="Verify with ID + selfie"
                  completed={hasVerifiedID}
                  active={false}
                />
                <div className="flex-1 h-[2px] bg-zinc-800 mx-6 relative overflow-hidden">
                  <div 
                    className={`absolute inset-0 transition-all duration-700 ${hasVerifiedID ? 'bg-gradient-to-r from-violet-500 to-violet-400 w-full' : 'bg-transparent w-0'}`}
                  />
                </div>
                <StepIndicator
                  number={2}
                  title="Videos"
                  description={`${verifiedVideos.length} verified videos`}
                  completed={verifiedVideos.length > 0}
                  active={false}
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

          {/* Action Cards */}
          <div className="grid gap-6">
            
            {/* ID Verification Card */}
            <div className="relative bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-2xl"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${hasVerifiedID ? 'bg-emerald-400' : 'bg-zinc-600'}`}></div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Identity Verification</h3>
                  </div>
                  <p className="text-zinc-300 mb-4">
                    {hasVerifiedID 
                      ? "✓ Your identity is verified and active" 
                      : "Upload government ID and selfie photos for verification"}
                  </p>
                  <div className="text-sm text-zinc-400">
                    Status: <span className={hasVerifiedID ? 'text-emerald-400' : 'text-zinc-300'}>{idVerificationStatus?.status || 'Not started'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep('id-verification')}
                  className={`group relative overflow-hidden border px-6 py-3 rounded-lg transition-all duration-300 ${
                    hasVerifiedID 
                      ? 'border-emerald-500/40 hover:border-emerald-400/80 bg-zinc-950/90'
                      : 'border-violet-500/40 hover:border-violet-400/80 bg-zinc-950/90'
                  }`}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    hasVerifiedID 
                      ? 'bg-gradient-to-r from-emerald-500/10 to-transparent'
                      : 'bg-gradient-to-r from-violet-500/10 to-transparent'
                  }`}></div>
                  <span className={`relative font-medium tracking-wider ${
                    hasVerifiedID 
                      ? 'text-emerald-300 group-hover:text-white'
                      : 'text-violet-300 group-hover:text-white'
                  }`}>
                    {hasVerifiedID ? 'VIEW STATUS' : 'START VERIFICATION'}
                  </span>
                </button>
              </div>
            </div>

            {/* Auth Videos Card */}
            <div className="relative bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${verifiedVideos.length > 0 ? 'bg-emerald-400' : 'bg-zinc-600'}`}></div>
                      <h3 className="text-xl font-bold text-white tracking-tight">Authentication Videos</h3>
                    </div>
                    <p className="text-zinc-300">
                      {hasVerifiedID 
                        ? `Record videos declaring items for authentication. You have ${verifiedVideos.length} verified videos.`
                        : "Complete ID verification first to upload videos"}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep('auth-video')}
                    disabled={!hasVerifiedID}
                    className={`group relative overflow-hidden border px-6 py-3 rounded-lg transition-all duration-300 ${
                      hasVerifiedID
                        ? 'border-emerald-500/40 hover:border-emerald-400/80 bg-zinc-950/90'
                        : 'border-zinc-700/50 bg-zinc-800/50 cursor-not-allowed'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className={`relative font-medium tracking-wider ${
                      hasVerifiedID
                        ? 'text-emerald-300 group-hover:text-white'
                        : 'text-zinc-500'
                    }`}>
                      {verifiedVideos.length > 0 ? 'ADD VIDEO' : 'RECORD VIDEO'}
                    </span>
                  </button>
                </div>

                {/* Videos List with Labels and View Buttons */}
                {authVideos.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h4 className="text-sm font-medium text-zinc-400 tracking-wide uppercase">Your Videos</h4>
                    {authVideos.map((video, index) => (
                      <div key={video.id} className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${video.status === 'verified' ? 'bg-emerald-400' : 'bg-yellow-400'}`}></div>
                            <div>
                              <h5 className="text-sm font-medium text-white">
                                Authentication Video {index + 1}
                              </h5>
                              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                                <span>{video.declared_items_count} items declared</span>
                                <span>•</span>
                                <span className={`px-2 py-0.5 rounded ${
                                  video.status === 'verified' 
                                    ? 'bg-emerald-900/50 text-emerald-300' 
                                    : 'bg-yellow-900/50 text-yellow-300'
                                }`}>
                                  {video.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={video.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-violet-400 hover:text-violet-300 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 rounded transition-colors"
                            >
                              Watch Video
                            </a>
                            <button
                              onClick={() => setShowDeleteConfirm({type: 'video', id: video.id})}
                              disabled={deletingVideoId === video.id}
                              className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded transition-colors"
                            >
                              {deletingVideoId === video.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                        
                        {/* Declaration Text */}
                        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <div className="text-xs text-zinc-500 font-mono uppercase tracking-wide flex-shrink-0 mt-0.5">
                              Declaration:
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed">
                              {video.declaration_text.length > 200 
                                ? `${video.declaration_text.substring(0, 200)}...` 
                                : video.declaration_text
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Batch Listings Card */}
            <div className="relative bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-2xl"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${canCreateListings ? 'bg-violet-400' : 'bg-zinc-600'}`}></div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Create Listings</h3>
                  </div>
                  <p className="text-zinc-300 mb-4">
                    {canCreateListings 
                      ? "Create authenticated auction listings from your verified videos"
                      : "Complete verification and record videos to create listings"}
                  </p>
                  <div className="text-sm text-zinc-400">
                    Available videos: <span className="text-white">{verifiedVideos.length}</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep('batch-listings')}
                  disabled={!canCreateListings}
                  className={`group relative overflow-hidden border px-6 py-3 rounded-lg transition-all duration-300 ${
                    canCreateListings
                      ? 'border-violet-500/40 hover:border-violet-400/80 bg-zinc-950/90'
                      : 'border-zinc-700/50 bg-zinc-800/50 cursor-not-allowed'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className={`relative font-medium tracking-wider ${
                    canCreateListings
                      ? 'text-violet-300 group-hover:text-white'
                      : 'text-zinc-500'
                  }`}>
                    CREATE LISTINGS
                  </span>
                </button>
              </div>
            </div>

            {/* Authenticated Listings Display */}
            {authenticatedListings.length > 0 && (
              <div className="relative bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-violet-400"></div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Active Authenticated Listings</h3>
                    <div className="px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded text-xs font-mono text-violet-300">
                      {authenticatedListings.length} LISTINGS
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {authenticatedListings.map((listing) => (
                      <div key={listing.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                              listing.auction_status === 'active' ? 'bg-green-400' : 
                              listing.auction_status === 'ended' ? 'bg-zinc-500' : 'bg-yellow-400'
                            }`}></div>
                            <div>
                              <h4 className="text-sm font-medium text-white">{listing.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                                <span>Item #{listing.item_position_in_video}</span>
                                <span>•</span>
                                <span>${listing.starting_price}</span>
                                <span>•</span>
                                <span>{listing.bid_count} bids</span>
                                <span>•</span>
                                <span className={`px-2 py-0.5 rounded ${
                                  listing.auction_status === 'active' ? 'bg-green-900/50 text-green-300' :
                                  listing.auction_status === 'ended' ? 'bg-zinc-700/50 text-zinc-300' :
                                  'bg-yellow-900/50 text-yellow-300'
                                }`}>
                                  {listing.auction_status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                              href={`/auctions/${listing.auction_item_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-violet-400 hover:text-violet-300 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 rounded transition-colors"
                            >
                              View Auction
                            </a>
                            <button
                              onClick={() => setShowDeleteConfirm({type: 'listing', id: listing.id})}
                              disabled={deletingListingId === listing.id}
                              className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded transition-colors"
                            >
                              {deletingListingId === listing.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                        
                        {/* Item Description Preview */}
                        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                          <p className="text-sm text-zinc-300 leading-relaxed">
                            {listing.description.length > 150 
                              ? `${listing.description.substring(0, 150)}...` 
                              : listing.description
                            }
                          </p>
                          {listing.video_timestamp_start && (
                            <div className="mt-2 text-xs text-zinc-500 font-mono">
                              Video timestamp: {listing.video_timestamp_start}s
                              {listing.video_timestamp_end && ` - ${listing.video_timestamp_end}s`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md mx-4">
                <h3 className="text-lg font-bold text-white mb-4">
                  Confirm Delete {showDeleteConfirm.type === 'video' ? 'Video' : 'Listing'}
                </h3>
                <p className="text-zinc-300 mb-6">
                  {showDeleteConfirm.type === 'video' 
                    ? 'This will permanently delete your authentication video. Any associated listings must be deleted first.'
                    : 'This will permanently delete your authenticated listing and remove it from auction. This action cannot be undone.'
                  }
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (showDeleteConfirm.type === 'video') {
                        handleDeleteVideo(showDeleteConfirm.id);
                      } else {
                        handleDeleteListing(showDeleteConfirm.id);
                      }
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
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

        {step === 'batch-listings' && verifiedVideos.length > 0 && (
          <BatchListingForm
            authVideo={verifiedVideos[0]} // For now, use first verified video
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
