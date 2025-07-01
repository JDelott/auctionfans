'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Creator {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  profile_image_url?: string;
  is_verified: boolean;
  created_at: string;
  channel_name?: string;
  channel_url?: string;
  platform?: string;
  subscriber_count: number;
  verification_status: string;
}

interface Auction {
  id: string;
  title: string;
  description: string;
  current_price: number | string;
  starting_price: number | string;
  buy_now_price?: number | string;
  condition: string;
  status: string;
  end_time: string;
  created_at: string;
  category_name?: string;
  bid_count: number;
  primary_image?: string;
}

interface CreatorStats {
  total_auctions: number;
  active_auctions: number;
  completed_sales: number;
  avg_sale_price: number | string;
  total_revenue: number | string;
}

interface Activity {
  activity_type: string;
  auction_id: string;
  auction_title: string;
  activity_date: string;
}

interface CreatorData {
  creator: Creator;
  auctions: Auction[];
  stats: CreatorStats;
  recentActivity: Activity[];
}

export default function CreatorProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [creatorData, setCreatorData] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'auctions' | 'about' | 'activity'>('auctions');

  const fetchCreatorData = useCallback(async () => {
    try {
      const response = await fetch(`/api/creators/${resolvedParams.username}`);
      if (response.ok) {
        const data = await response.json();
        setCreatorData(data);
      } else if (response.status === 404) {
        router.push('/creators');
      }
    } catch (error) {
      console.error('Failed to fetch creator:', error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.username, router]);

  useEffect(() => {
    fetchCreatorData();
  }, [fetchCreatorData]);

  const formatPrice = (price: number | string | null | undefined): string => {
    const numPrice = Number(price) || 0;
    return numPrice.toFixed(2);
  };

  const formatTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'ENDED';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}D ${hours}H`;
    if (hours > 0) return `${hours}H ${minutes}M`;
    return `${minutes}M`;
  };

  const formatSubscriberCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      'youtube': 'bg-red-500/20 text-red-300 border-red-500/30',
      'twitch': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      'tiktok': 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
      'instagram': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      'twitter': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
    return colors[platform?.toLowerCase()] || 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border border-violet-400/10 rounded-full animate-ping"></div>
        </div>
      </div>
    );
  }

  if (!creatorData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-6">CREATOR NOT FOUND</h1>
          <Link 
            href="/creators" 
            className="group relative overflow-hidden px-8 py-4 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-sm text-white font-mono text-sm tracking-[0.15em] hover:from-violet-500/20 hover:to-purple-500/20 hover:border-violet-400/50 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative">BROWSE CREATORS</span>
          </Link>
        </div>
      </div>
    );
  }

  const { creator, auctions, stats, recentActivity } = creatorData;

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Electric Grid Background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Electric Accent Lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-1/3 h-px bg-gradient-to-r from-transparent via-violet-400/20 to-transparent"></div>
        <div className="absolute top-40 right-0 w-1/4 h-px bg-gradient-to-l from-transparent via-emerald-400/20 to-transparent"></div>
        <div className="absolute bottom-1/3 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-16">
        {/* Electric Header */}
        <header className="mb-16">
          <Link 
            href="/creators" 
            className="inline-flex items-center text-zinc-400 hover:text-white font-mono text-sm tracking-[0.15em] mb-8 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
            <span className="ml-2">BACK TO CREATORS</span>
          </Link>
        </header>

        {/* Electric Profile Card */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
          <div className="relative p-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-8 lg:space-y-0 lg:space-x-12">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                {creator.profile_image_url ? (
                  <div className="relative w-32 h-32">
                    <Image
                      src={creator.profile_image_url}
                      alt={creator.display_name || creator.username}
                      fill
                      className="rounded-2xl object-cover border-2 border-zinc-700/30"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center border-2 border-zinc-700/30">
                    <span className="text-white text-4xl font-bold">
                      {(creator.display_name || creator.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="space-y-6">
                  <div>
                    <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
                      {creator.display_name || creator.username}
                    </h1>
                    <p className="text-xl font-mono text-zinc-400 mb-6 tracking-[0.1em]">@{creator.username}</p>
                    
                    <div className="flex flex-wrap gap-4 mb-8">
                      {creator.is_verified && (
                        <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 tracking-[0.1em] backdrop-blur-sm">
                          VERIFIED
                        </div>
                      )}
                      {creator.platform && (
                        <div className={`px-4 py-2 rounded-xl text-xs font-mono tracking-[0.1em] border backdrop-blur-sm ${getPlatformColor(creator.platform)}`}>
                          {creator.platform.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {creator.bio && (
                      <p className="text-zinc-300 mb-8 leading-relaxed text-lg max-w-3xl">{creator.bio}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-8 text-sm font-mono text-zinc-400 tracking-[0.1em]">
                    {creator.subscriber_count > 0 && (
                      <div>
                        <span className="text-white font-bold text-lg">{formatSubscriberCount(creator.subscriber_count)}</span>
                        <span className="ml-2 uppercase">SUBSCRIBERS</span>
                      </div>
                    )}
                    <div>
                      <span className="text-white font-bold text-lg">{new Date(creator.created_at).getFullYear()}</span>
                      <span className="ml-2 uppercase">MEMBER SINCE</span>
                    </div>
                    <div>
                      <span className="text-violet-400 font-bold text-lg">{stats.total_auctions}</span>
                      <span className="ml-2 uppercase">AUCTIONS</span>
                    </div>
                    {stats.active_auctions > 0 && (
                      <div>
                        <span className="text-emerald-400 font-bold text-lg">{stats.active_auctions}</span>
                        <span className="ml-2 uppercase">ACTIVE</span>
                      </div>
                    )}
                  </div>

                  {creator.channel_url && (
                    <a
                      href={creator.channel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative overflow-hidden inline-block px-8 py-4 rounded-xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-sm text-zinc-300 font-mono text-sm tracking-[0.15em] hover:bg-zinc-800/50 hover:text-white hover:border-zinc-600/50 transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative">VISIT CHANNEL</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Electric Tab Navigation */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl p-8 mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent"></div>
              <h2 className="text-2xl font-black text-white tracking-tight">CREATOR CONTENT</h2>
            </div>
            <div className="flex space-x-4">
              {[
                { key: 'auctions', label: 'AUCTIONS', count: auctions.length },
                { key: 'about', label: 'ABOUT', count: null },
                { key: 'activity', label: 'ACTIVITY', count: null }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'auctions' | 'about' | 'activity')}
                  className={`group relative overflow-hidden px-6 py-3 rounded-xl font-mono text-sm tracking-[0.15em] transition-all duration-300 ${
                    activeTab === tab.key
                      ? 'border border-violet-400/30 bg-gradient-to-r from-violet-500/20 to-purple-500/20 backdrop-blur-sm text-white'
                      : 'border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white hover:border-zinc-600/50'
                  }`}
                >
                  {activeTab === tab.key && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10"></div>
                  )}
                  <span className="relative">
                    {tab.label} {tab.count !== null && `(${tab.count})`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'auctions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {auctions.map((auction) => (
              <Link
                key={auction.id}
                href={`/auctions/${auction.id}`}
                className="group relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl hover:border-zinc-600/50 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Image Container */}
                <div className="relative aspect-square bg-zinc-800/30 overflow-hidden">
                  {auction.primary_image ? (
                    <Image
                      src={auction.primary_image}
                      alt={auction.title}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-zinc-700/50 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <div className="w-6 h-6 bg-zinc-600/50 rounded-lg"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="relative p-6">
                  {/* Fixed Height Category & Status Row */}
                  <div className="h-8 flex items-start justify-between mb-4">
                    <span className="text-xs text-zinc-500 uppercase font-mono tracking-[0.15em] leading-tight">
                      {auction.category_name || 'UNCATEGORIZED'}
                    </span>
                    <div className={`px-2 py-1 rounded-lg text-xs font-mono tracking-[0.1em] border backdrop-blur-sm flex-shrink-0 ${
                      auction.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      auction.status === 'ended' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                      'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                    }`}>
                      {auction.status.toUpperCase()}
                    </div>
                  </div>

                  {/* Clean One-Line Title */}
                  <h3 className="text-white font-bold text-lg mb-6 truncate transition-colors">
                    {auction.title}
                  </h3>

                  {/* Price & Stats */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-xs text-zinc-500 mb-2 font-mono tracking-[0.1em]">CURRENT PRICE</p>
                      <p className="text-2xl font-black text-white">${formatPrice(auction.current_price)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs font-mono tracking-[0.1em]">
                      <span className="text-zinc-400">
                        {auction.bid_count} BID{auction.bid_count !== 1 ? 'S' : ''}
                      </span>
                      <span className={`font-bold ${
                        auction.status === 'active' && formatTimeRemaining(auction.end_time) !== 'ENDED'
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}>
                        ENDS {formatTimeRemaining(auction.end_time)}
                      </span>
                    </div>
                  </div>

                  {/* Creator - Clean with Icon Badge */}
                  <div className="pt-6 border-t border-zinc-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-zinc-300 font-mono tracking-[0.1em]">
                          {creator.display_name || creator.username}
                        </span>
                        {/* Small verified icon badge */}
                        {creator.is_verified && (
                          <div className="w-5 h-5 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl p-12">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
            <div className="relative max-w-5xl">
              <div className="flex items-center space-x-6 mb-12">
                <div className="w-1 h-8 bg-gradient-to-b from-violet-400 to-purple-500"></div>
                <h3 className="text-3xl font-black text-white tracking-tight">
                  ABOUT {(creator.display_name || creator.username).toUpperCase()}
                </h3>
              </div>
              
              {creator.bio ? (
                <p className="text-zinc-300 leading-relaxed mb-12 text-xl">{creator.bio}</p>
              ) : (
                <p className="text-zinc-500 mb-12 font-mono text-sm tracking-[0.15em] uppercase">NO BIO PROVIDED</p>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div>
                  <h4 className="font-bold text-violet-400 mb-8 font-mono text-lg tracking-[0.1em] uppercase">Creator Details</h4>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center py-3 border-b border-zinc-700/30">
                      <span className="text-zinc-400 font-mono text-sm tracking-[0.1em] uppercase">Username</span>
                      <span className="text-white font-mono text-sm">@{creator.username}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-zinc-700/30">
                      <span className="text-zinc-400 font-mono text-sm tracking-[0.1em] uppercase">Member Since</span>
                      <span className="text-white font-mono text-sm">{new Date(creator.created_at).toLocaleDateString()}</span>
                    </div>
                    {creator.platform && (
                      <div className="flex justify-between items-center py-3 border-b border-zinc-700/30">
                        <span className="text-zinc-400 font-mono text-sm tracking-[0.1em] uppercase">Platform</span>
                        <span className="text-white font-mono text-sm uppercase">{creator.platform}</span>
                      </div>
                    )}
                    {creator.subscriber_count > 0 && (
                      <div className="flex justify-between items-center py-3 border-b border-zinc-700/30">
                        <span className="text-zinc-400 font-mono text-sm tracking-[0.1em] uppercase">Subscribers</span>
                        <span className="text-white font-mono text-sm">{formatSubscriberCount(creator.subscriber_count)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-bold text-emerald-400 mb-8 font-mono text-lg tracking-[0.1em] uppercase">Auction Activity</h4>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center py-3 border-b border-zinc-700/30">
                      <span className="text-zinc-400 font-mono text-sm tracking-[0.1em] uppercase">Total Auctions</span>
                      <span className="text-white font-mono text-sm">{stats.total_auctions}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-zinc-700/30">
                      <span className="text-zinc-400 font-mono text-sm tracking-[0.1em] uppercase">Active Auctions</span>
                      <span className="text-emerald-400 font-mono text-sm">{stats.active_auctions}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl p-12">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
            <div className="relative">
              <div className="flex items-center space-x-6 mb-12">
                <div className="w-1 h-8 bg-gradient-to-b from-violet-400 to-purple-500"></div>
                <h3 className="text-3xl font-black text-white tracking-tight">RECENT ACTIVITY</h3>
              </div>
              
              {recentActivity.length > 0 ? (
                <div className="space-y-6">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="bg-zinc-800/30 rounded-xl p-6 border border-zinc-700/30 backdrop-blur-sm">
                      <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-violet-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-white font-mono text-sm tracking-[0.1em] mb-2">
                            <span className="text-zinc-400">
                              {activity.activity_type === 'auction_created' ? 'CREATED AUCTION:' : 'AUCTION ENDED:'}
                            </span>
                            <Link 
                              href={`/auctions/${activity.auction_id}`}
                              className="text-violet-400 hover:text-violet-300 ml-2 transition-colors"
                            >
                              {activity.auction_title}
                            </Link>
                          </p>
                          <p className="text-xs text-zinc-500 font-mono tracking-[0.1em]">
                            {new Date(activity.activity_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-zinc-800/50 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <div className="w-8 h-8 bg-zinc-700/50 rounded-lg"></div>
                  </div>
                  <p className="text-zinc-500 font-mono text-sm tracking-[0.15em] uppercase">NO RECENT ACTIVITY</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
