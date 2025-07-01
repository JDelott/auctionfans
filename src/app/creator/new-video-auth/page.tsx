'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  image_url?: string;
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

  if (step === 'overview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-violet-950/20">
        {/* Compact Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-emerald-500/10 blur-3xl"></div>
          <div className="relative max-w-7xl mx-auto px-6 pt-8 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-violet-200 to-emerald-200 bg-clip-text text-transparent">
                  Verified Creator System
                </h1>
                <p className="text-zinc-400">
                  Transform your content into authenticated auctions
                </p>
              </div>
              
              {/* Compact Progress Indicators */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${hasVerifiedID ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                    {hasVerifiedID ? '✓' : '1'}
                  </div>
                  <span className="text-sm text-zinc-400">ID Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${verifiedVideos.length > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                    {verifiedVideos.length}
                  </div>
                  <span className="text-sm text-zinc-400">Videos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${authenticatedListings.length > 0 ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                    {authenticatedListings.length}
                  </div>
                  <span className="text-sm text-zinc-400">Auctions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-12">
          
          {/* Identity Status Bar */}
          <div className="mb-8">
            <div className={`relative overflow-hidden rounded-xl ${hasVerifiedID ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5' : 'bg-gradient-to-r from-zinc-800/50 to-zinc-800/20'} backdrop-blur-sm border ${hasVerifiedID ? 'border-emerald-500/20' : 'border-zinc-700/30'} p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasVerifiedID ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700/50 text-zinc-400'}`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Identity Verification</h3>
                    <p className="text-sm text-zinc-400">
                      {hasVerifiedID ? "Your identity is verified and active" : "Upload government ID and selfie to get started"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${hasVerifiedID ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-700/50 text-zinc-400'}`}>
                    {idVerificationStatus?.status || 'Not started'}
                  </span>
                  <button
                    onClick={() => setStep('id-verification')}
                    className="px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg transition-all duration-200 border border-violet-500/30 text-sm"
                  >
                    {hasVerifiedID ? 'View' : 'Start'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Horizontal Layout */}
          <div className="space-y-8">
            
            {/* Videos Section - Horizontal */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Authentication Videos</h2>
                <button
                  onClick={() => setStep('auth-video')}
                  disabled={!hasVerifiedID}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm ${hasVerifiedID ? 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30' : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/30'}`}
                >
                  + Add Video
                </button>
              </div>

              {authVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {authVideos.map((video, index) => {
                    const videoListings = authenticatedListings.filter(listing => listing.auth_video_id === video.id);
                    const availableSlots = video.declared_items_count - videoListings.length;
                    
                    return (
                      <div key={video.id} className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-700/30 rounded-xl overflow-hidden hover:border-zinc-600/50 transition-all duration-300 group">
                        {/* Header with Status */}
                        <div className="relative bg-gradient-to-r from-zinc-800/50 to-zinc-800/20 p-4 border-b border-zinc-700/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${video.status === 'verified' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></div>
                              <div>
                                <h4 className="font-semibold text-white">Authentication Video {index + 1}</h4>
                                <p className="text-xs text-zinc-400">{video.declared_items_count} items declared</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${video.status === 'verified' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/20 text-amber-300 border border-amber-500/20'}`}>
                                {video.status}
                              </span>
                              <div className="flex items-center gap-1">
                                <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 transition-colors p-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                  </svg>
                                </a>
                                <button
                                  onClick={() => setShowDeleteConfirm({type: 'video', id: video.id})}
                                  className="text-red-400 hover:text-red-300 transition-colors p-1"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Video Declaration */}
                        <div className="p-5">
                          <div className="mb-4">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">Declaration</label>
                            <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/30">
                              <p className="text-sm text-zinc-300 leading-relaxed">
                                {video.declaration_text}
                              </p>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-4 mb-5">
                            <div className="text-center">
                              <div className="text-lg font-bold text-white">{video.declared_items_count}</div>
                              <div className="text-xs text-zinc-500">Items Declared</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-emerald-400">{videoListings.length}</div>
                              <div className="text-xs text-zinc-500">Currently Listed</div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-zinc-500">Listing Progress</span>
                              <span className="text-xs text-zinc-400">
                                {videoListings.length} / {video.declared_items_count}
                              </span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5">
                              <div 
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${video.declared_items_count > 0 ? (videoListings.length / video.declared_items_count) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Action Button */}
                          {video.status === 'verified' && (
                            <button
                              onClick={() => handleCreateListingsFromVideo(video)}
                              className="w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 group-hover:bg-emerald-500/25"
                            >
                              {availableSlots > 0 ? `Create ${availableSlots} More Listings` : 'Add More Items'}
                            </button>
                          )}
                          
                          {video.status !== 'verified' && (
                            <div className="w-full px-4 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-center">
                              <span className="text-zinc-500 text-sm">Awaiting verification</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-zinc-700/50 rounded-xl">
                  <div className="w-16 h-16 bg-zinc-800/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No Authentication Videos</h3>
                  <p className="text-zinc-400 mb-4">Record your first video to start creating verified listings</p>
                  <button
                    onClick={() => setStep('auth-video')}
                    disabled={!hasVerifiedID}
                    className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium ${hasVerifiedID ? 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30' : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/30'}`}
                  >
                    {hasVerifiedID ? 'Record Your First Video' : 'Complete ID Verification First'}
                  </button>
                </div>
              )}
            </div>

            {/* Active Auctions Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Active Auctions</h2>
                <div className="text-sm text-zinc-400">
                  {authenticatedListings.length} total listings
                </div>
              </div>

              {authenticatedListings.length > 0 ? (
                <div className="space-y-8">
                  {verifiedVideos.map((video, videoIndex) => {
                    const videoListings = authenticatedListings.filter(listing => listing.auth_video_id === video.id);
                    if (videoListings.length === 0) return null;
                    
                    return (
                      <div key={video.id}>
                        {/* Compact Video Header */}
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-700/30">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <h3 className="font-semibold text-white">Authentication Video {videoIndex + 1}</h3>
                            <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">
                              {videoListings.length} items
                            </span>
                          </div>
                          <a 
                            href={video.video_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-violet-400 hover:text-violet-300 transition-colors text-xs flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                            </svg>
                            Watch
                          </a>
                        </div>
                        
                        {/* Compact Grid - More Items Per Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                          {videoListings.map((listing) => (
                            <div key={listing.id} className="bg-zinc-900/40 rounded-lg overflow-hidden hover:bg-zinc-800/60 transition-all duration-200 group border border-zinc-700/20 hover:border-zinc-600/40">
                              {/* Compact Image */}
                              <div className="relative h-28 bg-zinc-800">
                                {listing.image_url ? (
                                  <Image
                                    src={listing.image_url}
                                    alt={listing.title}
                                    fill
                                    className="object-contain p-1.5"
                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                                    onError={() => console.log('Auction image failed to load:', listing.image_url)}
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 bg-zinc-600 rounded flex items-center justify-center">
                                      <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                                {/* Status and Actions Overlay */}
                                <div className="absolute top-1 right-1 flex items-center gap-1">
                                  <div className={`w-1.5 h-1.5 rounded-full ${listing.auction_status === 'active' ? 'bg-green-400' : 'bg-zinc-500'}`}></div>
                                </div>
                                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <a href={`/auctions/${listing.auction_item_id}`} target="_blank" rel="noopener noreferrer" className="bg-black/60 text-violet-300 hover:text-violet-200 p-1 rounded transition-colors">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-1a1 1 0 10-2 0v1H5V7h1a1 1 0 000-2H5z" />
                                    </svg>
                                  </a>
                                  <button
                                    onClick={() => setShowDeleteConfirm({type: 'listing', id: listing.id})}
                                    className="bg-black/60 text-red-300 hover:text-red-200 p-1 rounded transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {/* Compact Info */}
                              <div className="p-2.5">
                                <h4 className="font-medium text-white text-xs leading-tight mb-1.5 group-hover:text-violet-200 transition-colors">
                                  {listing.title.length > 18 ? `${listing.title.substring(0, 18)}...` : listing.title}
                                </h4>
                                
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-emerald-400 font-semibold text-sm">${listing.starting_price}</span>
                                  <span className="text-xs text-zinc-500">{listing.bid_count} bids</span>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs">
                                  <span className="bg-zinc-700/50 text-zinc-300 px-1.5 py-0.5 rounded">#{listing.item_position_in_video}</span>
                                  {listing.video_timestamp_start && (
                                    <span className="text-zinc-500 text-xs">
                                      {listing.video_timestamp_start}s
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-zinc-700/50 rounded-xl max-w-md mx-auto">
                  <div className="w-16 h-16 bg-zinc-800/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No Active Auctions</h3>
                  <p className="text-zinc-400 mb-2">Create listings from your verified videos</p>
                  <p className="text-sm text-zinc-500">Your authenticated items will appear here</p>
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
