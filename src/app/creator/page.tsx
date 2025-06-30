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
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-zinc-400 mt-2">AI-powered auction creation with voice assistance</p>
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
              <h2 className="text-xl font-bold">AI Voice Assistant</h2>
              <p className="text-zinc-400">Available with both auction creation methods</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-blue-300 font-medium mb-1">Conversational Creation</div>
                <div className="text-zinc-400">&quot;Sell my vintage Nike shoes, size 10, good condition, starting at $150&quot;</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-blue-300 font-medium mb-1">Smart Form Filling</div>
                <div className="text-zinc-400">AI automatically populates title, description, category, and pricing</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-blue-300 font-medium mb-1">Voice Editing</div>
                <div className="text-zinc-400">&quot;Change the price to $200&quot; or &quot;Add that it includes original box&quot;</div>
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
                <span className="text-xs bg-violet-600/30 text-violet-300 px-2 py-1 rounded-full font-medium">VERIFIED</span>
              </div>
              
              <h3 className="text-xl font-bold mb-2">Verified Creator Listings</h3>
              <p className="text-zinc-400 mb-6 text-sm">
                AI voice assistance + creator verification + authenticity certificates
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                  ID verification with government documents
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                  Video authentication of item ownership
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                  Verified creator badge on all listings
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                  Authenticity certificates for buyers
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                  Batch create up to 10 items per video
                </div>
              </div>
              
              <div className="flex gap-3">
                <Link 
                  href="/creator/new-video-auth"
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Start Verification
                </Link>
                <Link 
                  href="/creator/auctions"
                  className="border border-violet-500/30 text-violet-400 hover:text-violet-300 hover:border-violet-500/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  View Listings
                </Link>
              </div>
            </div>
          </div>

          {/* Standard AI-Powered Auctions */}
          <div className="bg-gradient-to-br from-emerald-600/10 to-emerald-800/5 border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-600/15 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
            
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-600/20 rounded-lg">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded-full font-medium">STANDARD</span>
              </div>
              
              <h3 className="text-xl font-bold mb-2">Standard AI-Powered Auctions</h3>
              <p className="text-zinc-400 mb-6 text-sm">
                Full AI voice assistance for quick auction creation
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                  Same AI voice conversation features
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                  Intelligent form auto-completion
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                  Voice-powered editing and corrections
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                  Batch creation in voice sessions
                </div>
                <div className="flex items-center text-sm text-zinc-300">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3"></div>
                  No verification requirements
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/30 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                  <span className="text-amber-400 font-medium text-xs">Note</span>
                </div>
                <p className="text-zinc-400 text-xs">
                  Standard listings don&apos;t include verification badges or authenticity certificates
                </p>
              </div>
              
              <div className="flex gap-3">
                <Link 
                  href="/creator/create-auction"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Create Auction
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
      </div>
    </div>
  );
}
