'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreatorDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
                <span className="text-xs bg-violet-600/30 text-violet-300 px-2 py-1 rounded-full font-medium">VERIFIED CREATOR</span>
              </div>
              
              <h3 className="text-xl font-bold mb-2">Authenticated Content Items</h3>
              <p className="text-zinc-400 mb-6 text-sm">
                Verify item ownership through creator authentication and provide official authenticity certificates to your fans
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                  Creator ID verification for fan trust
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                  Video proof of item ownership from content
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                  Verified creator badge increases fan confidence
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                  Official authenticity certificates for buyers
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                  Batch authenticate multiple content items
                </div>
              </div>

              <div className="bg-violet-900/20 border border-violet-700/30 rounded-lg p-3 mb-4">
                <div className="text-violet-300 font-medium text-xs mb-1">Perfect For:</div>
                <p className="text-zinc-300 text-xs">
                  Clothing, accessories, gear, collectibles, or any items featured in your videos, streams, or posts
                </p>
              </div>
              
              <div className="flex gap-3">
                <Link 
                  href="/creator/new-video-auth"
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Get Verified
                </Link>
                <Link 
                  href="/creator/auctions"
                  className="border border-violet-500/30 text-violet-400 hover:text-violet-300 hover:border-violet-500/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  View Items
                </Link>
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
              
              <div className="flex gap-3">
                <Link 
                  href="/creator/create-auction"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Start Selling
                </Link>
                <Link 
                  href="/creator/auctions"
                  className="border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  View Auctions
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Electric CTA */}
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
              className="group relative overflow-hidden border border-violet-500/30 hover:border-violet-400/60 bg-zinc-950/90 px-6 py-2.5 rounded-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-2">
                <div className="w-1 h-1 bg-violet-400 rounded-full group-hover:shadow-sm group-hover:shadow-violet-400"></div>
                <span className="text-violet-300 group-hover:text-white font-medium text-sm tracking-wider">VERIFIED</span>
              </div>
            </Link>
            
            <Link 
              href="/creator/create-auction" 
              className="group relative overflow-hidden border border-emerald-500/30 hover:border-emerald-400/60 bg-zinc-950/90 px-6 py-2.5 rounded-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-2">
                <div className="w-1 h-1 bg-emerald-400 rounded-full group-hover:shadow-sm group-hover:shadow-emerald-400"></div>
                <span className="text-emerald-300 group-hover:text-white font-medium text-sm tracking-wider">STANDARD</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
