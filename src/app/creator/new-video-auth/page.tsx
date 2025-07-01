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
  const [step, setStep] = useState<Step>('overview');
  const [selectedVideoForListings, setSelectedVideoForListings] = useState<AuthVideo | null>(null);
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
    setStep('overview');
  };

  const handleVideoUploaded = () => {
    fetchAuthVideos();
    setStep('overview');
  };

  const handleCreateListingsFromVideo = (video: AuthVideo) => {
    setSelectedVideoForListings(video);
    setStep('batch-listings');
  };

  const handleListingsCreated = () => {
    fetchAuthVideos();
    fetchAuthenticatedListings();
    setSelectedVideoForListings(null);
    setStep('overview');
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const response = await fetch(`/api/creator-verification/auth-video?id=${videoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAuthVideos();
        await fetchAuthenticatedListings();
        setShowDeleteConfirm(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
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
    }
  };

  if (loading || loadingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-violet-950/20 flex items-center justify-center">
        <div className="text-white animate-pulse">Loading verification system...</div>
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
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-violet-950/20">
        {/* Floating Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-emerald-500/10 blur-3xl"></div>
          <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-8">
            <div className="text-center mb-4">
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-violet-200 to-emerald-200 bg-clip-text text-transparent">
                Verified Creator System
              </h1>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Transform your content into authenticated auctions with our verification pipeline
              </p>
            </div>

            {/* Progress Flow */}
            <div className="flex items-center justify-center space-x-8 mt-12 mb-16 max-w-4xl mx-auto">
              <ProgressNode 
                icon="👤" 
                title="Identity" 
                subtitle="Verify with ID + selfie"
                completed={hasVerifiedID}
                onClick={() => setStep('id-verification')}
              />
              <FlowArrow completed={hasVerifiedID} />
              <ProgressNode 
                icon="📹" 
                title="Videos" 
                subtitle={`${verifiedVideos.length} verified videos`}
                completed={verifiedVideos.length > 0}
                onClick={() => setStep('auth-video')}
                disabled={!hasVerifiedID}
              />
              <FlowArrow completed={canCreateListings} />
              <ProgressNode 
                icon="🚀" 
                title="Listings" 
                subtitle={`${authenticatedListings.length} active auctions`}
                completed={authenticatedListings.length > 0}
                onClick={() => setStep('batch-listings')}
                disabled={!canCreateListings}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 pb-20">
          
          {/* Identity Status Strip */}
          <div className="mb-12">
            <div className={`relative overflow-hidden rounded-2xl ${hasVerifiedID ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5' : 'bg-gradient-to-r from-zinc-800/50 to-zinc-800/20'} backdrop-blur-sm border ${hasVerifiedID ? 'border-emerald-500/20' : 'border-zinc-700/30'}`}>
              {hasVerifiedID && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent"></div>
              )}
              <div className="relative p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${hasVerifiedID ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700/50 text-zinc-400'}`}>
                    {hasVerifiedID ? '✓' : '👤'}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Identity Verification</h3>
                    <p className="text-zinc-400">
                      {hasVerifiedID ? "Your identity is verified and active" : "Upload government ID and selfie to get started"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${hasVerifiedID ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-700/50 text-zinc-400'}`}>
                    {idVerificationStatus?.status || 'Not started'}
                  </div>
                  <button
                    onClick={() => setStep('id-verification')}
                    className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg transition-all duration-200 border border-violet-500/30"
                  >
                    {hasVerifiedID ? 'View Status' : 'Start Verification'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Videos Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Authentication Videos</h2>
                  <p className="text-zinc-400">
                    {hasVerifiedID 
                      ? "Record videos declaring items for authentication"
                      : "Complete ID verification first"}
                  </p>
                </div>
                <button
                  onClick={() => setStep('auth-video')}
                  disabled={!hasVerifiedID}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${hasVerifiedID ? 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30' : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/30'}`}
                >
                  + Add Video
                </button>
              </div>

              {authVideos.length > 0 ? (
                <div className="space-y-4">
                  {authVideos.map((video, index) => {
                    const videoListings = authenticatedListings.filter(listing => listing.auth_video_id === video.id);
                    const availableSlots = video.declared_items_count - videoListings.length;
                    
                    return (
                      <div key={video.id} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                        <div className="relative bg-zinc-900/30 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-5 hover:border-zinc-600/50 transition-all duration-300">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${video.status === 'verified' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></div>
                              <div>
                                <h4 className="font-semibold text-white">Authentication Video {index + 1}</h4>
                                <p className="text-sm text-zinc-400">{video.declared_items_count} items declared</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-md text-xs ${video.status === 'verified' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                {video.status}
                              </span>
                              <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 transition-colors">
                                <span className="text-sm">▶</span>
                              </a>
                              <button
                                onClick={() => setShowDeleteConfirm({type: 'video', id: video.id})}
                                className="text-red-400 hover:text-red-300 transition-colors text-sm"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                          <div className="bg-zinc-800/50 rounded-lg p-3 mt-3 mb-3">
                            <p className="text-sm text-zinc-300 leading-relaxed">
                              {video.declaration_text.length > 120 
                                ? `${video.declaration_text.substring(0, 120)}...` 
                                : video.declaration_text}
                            </p>
                          </div>
                          
                          {/* Video Actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-zinc-700/50">
                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                              <span>{videoListings.length} active listings</span>
                              {video.status === 'verified' && (
                                <>
                                  <span>•</span>
                                  <span className={availableSlots > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                                    {availableSlots} slots available
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {video.status === 'verified' && (
                                <button
                                  onClick={() => handleCreateListingsFromVideo(video)}
                                  disabled={availableSlots <= 0}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                    availableSlots > 0
                                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-zinc-700/50 text-zinc-500 border border-zinc-700/30 cursor-not-allowed'
                                  }`}
                                >
                                  {availableSlots > 0 ? 'Create Listings' : 'All Listed'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-zinc-700/50 rounded-xl">
                  <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📹</span>
                  </div>
                  <p className="text-zinc-400 mb-4">No authentication videos yet</p>
                  <button
                    onClick={() => setStep('auth-video')}
                    disabled={!hasVerifiedID}
                    className={`px-6 py-3 rounded-lg transition-all duration-200 ${hasVerifiedID ? 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30' : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/30'}`}
                  >
                    Record Your First Video
                  </button>
                </div>
              )}
            </div>

            {/* Active Listings Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Active Auctions</h2>
                  <p className="text-zinc-400">
                    Your authenticated auction listings organized by video
                  </p>
                </div>
              </div>

              {authenticatedListings.length > 0 ? (
                <div className="space-y-6">
                  {verifiedVideos.map((video, videoIndex) => {
                    const videoListings = authenticatedListings.filter(listing => listing.auth_video_id === video.id);
                    if (videoListings.length === 0) return null;
                    
                    return (
                      <div key={video.id} className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <h3 className="font-semibold text-white">Authentication Video {videoIndex + 1}</h3>
                            <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">
                              {videoListings.length} listings
                            </span>
                          </div>
                          <a 
                            href={video.video_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-violet-400 hover:text-violet-300 transition-colors text-sm"
                          >
                            Watch Video
                          </a>
                        </div>
                        
                        <div className="space-y-3">
                          {videoListings.map((listing) => (
                            <div key={listing.id} className="group relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                              <div className="relative bg-zinc-800/30 rounded-lg p-4 hover:bg-zinc-800/50 transition-all duration-300">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${listing.auction_status === 'active' ? 'bg-green-400' : 'bg-zinc-500'} animate-pulse`}></div>
                                    <div className="flex-1">
                                      <h4 className="font-medium text-white">{listing.title}</h4>
                                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                                        <span>Item #{listing.item_position_in_video}</span>
                                        <span>•</span>
                                        <span>${listing.starting_price}</span>
                                        <span>•</span>
                                        <span>{listing.bid_count} bids</span>
                                        <span>•</span>
                                        <span className={`px-1.5 py-0.5 rounded text-xs ${listing.auction_status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-zinc-500/20 text-zinc-300'}`}>
                                          {listing.auction_status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <a href={`/auctions/${listing.auction_item_id}`} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 transition-colors text-sm">
                                      View
                                    </a>
                                    <button
                                      onClick={() => setShowDeleteConfirm({type: 'listing', id: listing.id})}
                                      className="text-red-400 hover:text-red-300 transition-colors text-sm"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300 leading-relaxed mb-2">
                                  {listing.description.length > 100 ? `${listing.description.substring(0, 100)}...` : listing.description}
                                </p>
                                {listing.video_timestamp_start && (
                                  <div className="text-xs text-zinc-500">
                                    Video: {listing.video_timestamp_start}s{listing.video_timestamp_end && ` - ${listing.video_timestamp_end}s`}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-zinc-700/50 rounded-xl">
                  <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <p className="text-zinc-400 mb-4">No active auctions yet</p>
                  <p className="text-sm text-zinc-500">Create listings from your verified videos to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-2xl p-8 max-w-md mx-4">
              <h3 className="text-xl font-bold text-white mb-4">
                Confirm Delete {showDeleteConfirm.type === 'video' ? 'Video' : 'Listing'}
              </h3>
              <p className="text-zinc-300 mb-8 leading-relaxed">
                {showDeleteConfirm.type === 'video' 
                  ? 'This will permanently delete your authentication video. Any associated listings must be deleted first.'
                  : 'This will permanently delete your authenticated listing and remove it from auction. This action cannot be undone.'
                }
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-zinc-700/50 hover:bg-zinc-700 text-white py-3 px-4 rounded-lg transition-all duration-200"
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
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 py-3 px-4 rounded-lg transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-violet-950/20 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => setStep('overview')}
          className="mb-8 text-violet-400 hover:text-violet-300 flex items-center gap-2 transition-all duration-200 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          Back to Overview
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

        {step === 'batch-listings' && selectedVideoForListings && (
          <BatchListingForm
            authVideo={selectedVideoForListings}
            onListingsCreated={handleListingsCreated}
            onCancel={() => {
              setSelectedVideoForListings(null);
              setStep('overview');
            }}
          />
        )}
      </div>
    </div>
  );
}

interface ProgressNodeProps {
  icon: string;
  title: string;
  subtitle: string;
  completed: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ProgressNode({ icon, title, subtitle, completed, onClick, disabled = false }: ProgressNodeProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative p-6 rounded-2xl transition-all duration-300 ${
        completed 
          ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 hover:border-emerald-500/50' 
          : disabled
            ? 'bg-zinc-800/30 border border-zinc-700/30 cursor-not-allowed opacity-50'
            : 'bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600/70 hover:bg-zinc-800/70'
      }`}
    >
      {completed && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl"></div>
      )}
      <div className="relative text-center">
        <div className={`text-3xl mb-3 transition-transform duration-300 ${!disabled && 'group-hover:scale-110'}`}>
          {icon}
        </div>
        <h3 className={`font-semibold text-sm mb-1 ${completed || !disabled ? 'text-white' : 'text-zinc-500'}`}>
          {title}
        </h3>
        <p className={`text-xs ${completed || !disabled ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {subtitle}
        </p>
      </div>
    </button>
  );
}

function FlowArrow({ completed }: { completed: boolean }) {
  return (
    <div className="flex items-center">
      <div className={`w-12 h-0.5 transition-all duration-700 ${completed ? 'bg-emerald-400' : 'bg-zinc-700'}`}></div>
      <div className={`w-0 h-0 border-l-4 border-t-2 border-b-2 border-t-transparent border-b-transparent transition-all duration-700 ${completed ? 'border-l-emerald-400' : 'border-l-zinc-700'}`}></div>
    </div>
  );
}
