'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface IDVerificationStatus {
  verified: boolean;
  status: string;
  canSubmit: boolean;
}

export default function CreatorDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [idVerificationStatus, setIdVerificationStatus] = useState<IDVerificationStatus | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(true);

  useEffect(() => {
    if (!loading && user?.is_creator) {
      checkVerificationStatus();
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
    } finally {
      setLoadingVerification(false);
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

  const isVerified = idVerificationStatus?.verified ?? false;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold">Create Auction Listing</h1>
          <p className="text-zinc-400 mt-2">Choose how you want to list your content items for auction</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* AI Voice Features Banner */}
        <div className="mb-12 bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 border border-zinc-700/50 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Content-to-Auction Assistant</h2>
              <p className="text-zinc-400">Voice-powered listing creation for content creators</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-blue-300 font-medium mb-1">Describe Your Content Item</div>
                <div className="text-zinc-400">&quot;This is the Nike hoodie I wore in my latest gaming stream, size large, worn once&quot;</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-blue-300 font-medium mb-1">Auto-Link to Content</div>
                <div className="text-zinc-400">AI connects items to your videos, streams, or social posts automatically</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-blue-300 font-medium mb-1">Fan-Focused Descriptions</div>
                <div className="text-zinc-400">Optimized listings that highlight the content connection and fan appeal</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Verified Creator Authentication */}
          <div className="bg-gradient-to-br from-violet-600/10 to-violet-800/5 border border-violet-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-600/15 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
            
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-violet-600/20 rounded-lg">
                  <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${isVerified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-violet-600/30 text-violet-300'}`}>
                    {isVerified ? 'VERIFIED CREATOR' : 'VERIFICATION AVAILABLE'}
                  </span>
                  {!loadingVerification && idVerificationStatus && (
                    <span className="text-xs text-zinc-500">
                      Status: {idVerificationStatus.status}
                    </span>
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-2">Authenticated Content Items</h3>
              <p className="text-zinc-400 mb-6 text-sm">
                {isVerified 
                  ? "Create verified listings with your authenticated creator status and provide official authenticity certificates"
                  : "Verify item ownership through creator authentication and provide official authenticity certificates to your fans"
                }
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-zinc-300">
                  <div className={`w-1.5 h-1.5 rounded-full mr-3 ${isVerified ? 'bg-emerald-400' : 'bg-violet-400'}`}></div>
                  Creator ID verification for fan trust
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className={`w-1.5 h-1.5 rounded-full mr-3 ${isVerified ? 'bg-emerald-400' : 'bg-violet-400'}`}></div>
                  Video proof of item ownership from content
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className={`w-1.5 h-1.5 rounded-full mr-3 ${isVerified ? 'bg-emerald-400' : 'bg-violet-400'}`}></div>
                  Verified creator badge increases fan confidence
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className={`w-1.5 h-1.5 rounded-full mr-3 ${isVerified ? 'bg-emerald-400' : 'bg-violet-400'}`}></div>
                  Official authenticity certificates for buyers
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className={`w-1.5 h-1.5 rounded-full mr-3 ${isVerified ? 'bg-emerald-400' : 'bg-violet-400'}`}></div>
                  Batch authenticate multiple content items
                </div>
              </div>

              <div className={`border rounded-lg p-3 mb-4 ${isVerified ? 'bg-emerald-900/20 border-emerald-700/30' : 'bg-violet-900/20 border-violet-700/30'}`}>
                <div className={`font-medium text-xs mb-1 ${isVerified ? 'text-emerald-300' : 'text-violet-300'}`}>
                  {isVerified ? 'You can now sell:' : 'Perfect For:'}
                </div>
                <p className="text-zinc-300 text-xs">
                  Clothing, accessories, gear, collectibles, or any items featured in your videos, streams, or posts
                </p>
              </div>
              
              <div className="flex gap-3">
                {loadingVerification ? (
                  <div className="bg-zinc-700/50 text-zinc-400 px-4 py-2 rounded-lg text-sm font-medium">
                    Checking status...
                  </div>
                ) : (
                <Link 
                  href="/creator/new-video-auth"
                    className={`group relative overflow-hidden px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border backdrop-blur-sm text-white hover:text-white shadow-lg ${
                      isVerified 
                        ? 'border-emerald-400/30 hover:border-emerald-300/50 bg-emerald-500/10 hover:bg-emerald-400/15 shadow-emerald-500/10 hover:shadow-emerald-400/20'
                        : 'border-violet-400/30 hover:border-violet-300/50 bg-violet-500/10 hover:bg-violet-400/15 shadow-violet-500/10 hover:shadow-violet-400/20'
                    }`}
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                  >
                    {/* Glass reflection effect */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                      isVerified 
                        ? 'bg-gradient-to-br from-emerald-400/20 via-transparent to-emerald-600/10'
                        : 'bg-gradient-to-br from-violet-400/20 via-transparent to-violet-600/10'
                    }`}></div>
                    
                    {/* Inner content */}
                    <div className="relative flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isVerified 
                          ? 'bg-emerald-300 group-hover:bg-emerald-100 group-hover:shadow-md group-hover:shadow-emerald-200/60'
                          : 'bg-violet-300 group-hover:bg-violet-100 group-hover:shadow-md group-hover:shadow-violet-200/60'
                      }`}></div>
                      <span className="tracking-wide font-mono text-xs uppercase font-bold">
                        {isVerified ? 'Create Listings' : 'Get Verified'}
                      </span>
                      <div className={`w-1 h-1 rounded-full transition-all duration-300 ${
                        isVerified 
                          ? 'bg-emerald-200 group-hover:bg-emerald-100'
                          : 'bg-violet-200 group-hover:bg-violet-100'
                      }`}></div>
                    </div>
                    
                    {/* Swiss geometric accent */}
                    <div className={`absolute top-0 right-3 w-4 h-[1px] transition-all duration-300 ${
                      isVerified 
                        ? 'bg-emerald-200/60 group-hover:bg-emerald-100/80 group-hover:w-6'
                        : 'bg-violet-200/60 group-hover:bg-violet-100/80 group-hover:w-6'
                    }`}></div>
                </Link>
                )}
              </div>
            </div>
          </div>

          {/* Standard Content Auctions */}
          <div className="bg-gradient-to-br from-emerald-600/10 to-emerald-800/5 border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-600/15 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
            
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-600/20 rounded-lg">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded-full font-medium">STANDARD</span>
              </div>
              
              <h3 className="text-xl font-bold mb-2">Quick Content Item Auctions</h3>
              <p className="text-zinc-400 mb-6 text-sm">
                Fast AI-powered auctions for items from your content - no verification needed
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                  Same AI voice-to-listing technology
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                  Link items to your YouTube, Twitch, TikTok content
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                  Fan-optimized auction descriptions
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                  Batch create multiple content item auctions
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                  Instant listing - start selling immediately
                </div>
              </div>

              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3 mb-4">
                <div className="text-emerald-300 font-medium text-xs mb-1">Great For:</div>
                <p className="text-zinc-300 text-xs">
                  Testing the waters, one-off items, or when you want to sell content items quickly without verification
                </p>
              </div>
              
              <div>
                <Link 
                  href="/creator/create-auction"
                  className="group relative overflow-hidden border border-emerald-400/30 hover:border-emerald-300/50 bg-emerald-500/10 hover:bg-emerald-400/15 text-white hover:text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/10 hover:shadow-emerald-400/20 inline-flex items-center backdrop-blur-sm"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {/* Glass reflection effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-transparent to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Inner content */}
                  <div className="relative flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-300 group-hover:bg-emerald-100 rounded-full group-hover:shadow-md group-hover:shadow-emerald-200/60 transition-all duration-300"></div>
                    <span className="tracking-wide font-mono text-xs uppercase font-bold">
                  Start Selling
                    </span>
                    <div className="w-1 h-1 bg-emerald-200 group-hover:bg-emerald-100 rounded-full transition-all duration-300"></div>
                  </div>
                  
                  {/* Swiss geometric accent */}
                  <div className="absolute top-0 right-3 w-4 h-[1px] bg-emerald-200/60 group-hover:bg-emerald-100/80 group-hover:w-6 transition-all duration-300"></div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Updated Compact Electric CTA */}
        <div className="mt-12 relative bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 text-center overflow-hidden">
          {/* Subtle electric accents */}
          <div className="absolute top-0 left-1/4 w-32 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
          <div className="absolute bottom-0 right-1/4 w-32 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
          
          <h3 className="text-2xl font-bold mb-2">Every Item Has a Story to Sell</h3>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">
            Your fans are already invested in your journey. Now let them own a piece of it.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link 
              href="/creator/new-video-auth" 
              className={`group relative overflow-hidden border backdrop-blur-sm px-6 py-3 rounded-lg transition-all duration-300 hover:scale-[1.02] ${
                isVerified 
                  ? 'border-emerald-400/20 hover:border-emerald-300/40 bg-emerald-500/5 hover:bg-emerald-400/10'
                  : 'border-violet-400/20 hover:border-violet-300/40 bg-violet-500/5 hover:bg-violet-400/10'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                isVerified ? 'from-emerald-500/5' : 'from-violet-500/5'
              }`}></div>
              <div className="relative flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isVerified 
                    ? 'bg-emerald-300 group-hover:bg-emerald-100 group-hover:shadow-md group-hover:shadow-emerald-200/60' 
                    : 'bg-violet-300 group-hover:bg-violet-100 group-hover:shadow-md group-hover:shadow-violet-200/60'
                }`}></div>
                <span className="text-zinc-100 group-hover:text-white font-mono text-xs tracking-wider transition-colors duration-300 font-bold"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                >
                  {isVerified ? 'VERIFIED' : 'GET VERIFIED'}
                </span>
                <div className={`w-3 h-[1px] transition-all duration-300 ${
                  isVerified 
                    ? 'bg-emerald-200/60 group-hover:bg-emerald-100/80' 
                    : 'bg-violet-200/60 group-hover:bg-violet-100/80'
                }`}></div>
              </div>
            </Link>
            
            <Link 
              href="/creator/create-auction" 
              className="group relative overflow-hidden border border-emerald-400/20 hover:border-emerald-300/40 bg-emerald-500/5 hover:bg-emerald-400/10 px-6 py-3 rounded-lg transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-300 group-hover:bg-emerald-100 rounded-full group-hover:shadow-md group-hover:shadow-emerald-200/60 transition-all duration-300"></div>
                <span className="text-zinc-100 group-hover:text-white font-mono text-xs tracking-wider transition-colors duration-300 font-bold"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                >STANDARD</span>
                <div className="w-3 h-[1px] bg-emerald-200/60 group-hover:bg-emerald-100/80 transition-all duration-300"></div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
