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
          <p className="text-zinc-400 mt-2">Choose how you want to create your auctions</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Traditional Auction Creation */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 hover:border-zinc-700/50 transition-colors">
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-blue-600/20 rounded-xl">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full">CLASSIC</span>
            </div>
            
            <h3 className="text-xl font-bold mb-3">Traditional Auction</h3>
            <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
              Create a single auction the traditional way. Perfect for individual items with manual form filling and optional video showcase.
            </p>
            
            <div className="space-y-2 mb-8">
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                One item per auction
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                Manual form completion
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                AI-assisted form filling
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                Optional video showcase
              </div>
            </div>
            
            <Link 
              href="/creator/create-auction"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors"
            >
              Create Traditional Auction
            </Link>
          </div>

          {/* Video Authentication System */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 hover:border-zinc-700/50 transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-600/20 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
            
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-violet-600/20 rounded-xl">
                <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs bg-violet-600/20 text-violet-400 px-2 py-1 rounded-full">NEW</span>
            </div>
            
            <h3 className="text-xl font-bold mb-3">Video Authentication System</h3>
            <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
              Upload one video and create multiple authenticated auctions. AI detects items, you verify with handwritten code, and all auctions go live together.
            </p>
            
            <div className="space-y-2 mb-8">
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                Multiple items from one video
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                AI-powered item detection
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                Handwritten verification
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-3"></div>
                Batch auction publishing
              </div>
            </div>
            
            <Link 
              href="/creator/video-auctions"
              className="block w-full bg-violet-600 hover:bg-violet-700 text-white text-center py-3 rounded-lg font-medium transition-colors"
            >
              Try Video Authentication
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-white mb-1">0</div>
            <div className="text-zinc-400 text-sm">Active Auctions</div>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-white mb-1">0</div>
            <div className="text-zinc-400 text-sm">Total Sales</div>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-white mb-1">$0</div>
            <div className="text-zinc-400 text-sm">Revenue</div>
          </div>
        </div>
      </div>
    </div>
  );
}
