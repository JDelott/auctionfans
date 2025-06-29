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
  current_price: number;
  starting_price: number;
  buy_now_price?: number;
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
  avg_sale_price: number;
  total_revenue: number;
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

  const getPlatformInfo = (platform: string) => {
    const platforms: { [key: string]: { name: string; color: string } } = {
      'youtube': { name: 'YOUTUBE', color: 'bg-red-500' },
      'twitch': { name: 'TWITCH', color: 'bg-violet-500' },
      'tiktok': { name: 'TIKTOK', color: 'bg-zinc-700' },
      'instagram': { name: 'INSTAGRAM', color: 'bg-red-400' },
      'twitter': { name: 'TWITTER', color: 'bg-zinc-600' },
    };
    return platforms[platform?.toLowerCase()] || { name: 'OTHER', color: 'bg-zinc-500' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!creatorData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-6">CREATOR NOT FOUND</h1>
          <Link href="/creators" className="bg-violet-500 text-white font-bold px-8 py-4 hover:bg-violet-600 transition-colors">
            BROWSE CREATORS
          </Link>
        </div>
      </div>
    );
  }

  const { creator, auctions, stats, recentActivity } = creatorData;
  const platformInfo = getPlatformInfo(creator.platform || '');

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/creators" className="text-sm font-mono text-violet-400 hover:text-violet-300 uppercase tracking-wider">
            ← BACK TO CREATORS
          </Link>
        </div>

        {/* Creator Profile Header */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-8 lg:space-y-0 lg:space-x-12">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {creator.profile_image_url ? (
                <Image
                  src={creator.profile_image_url}
                  alt={creator.display_name || creator.username}
                  width={120}
                  height={120}
                  className="w-30 h-30 rounded-full"
                />
              ) : (
                <div className="w-30 h-30 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
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
                  <h1 className="text-4xl font-black text-white mb-2">
                    {creator.display_name || creator.username}
                  </h1>
                  <p className="text-lg font-mono text-zinc-400 mb-4">@{creator.username}</p>
                  
                  <div className="flex flex-wrap gap-3 mb-6">
                    {creator.is_verified && (
                      <span className="bg-violet-500 text-white text-xs px-3 py-1 font-mono font-bold uppercase tracking-wider">
                        VERIFIED
                      </span>
                    )}
                    {creator.platform && (
                      <span className={`${platformInfo.color} text-white text-xs px-3 py-1 font-mono font-bold uppercase tracking-wider`}>
                        {platformInfo.name}
                      </span>
                    )}
                  </div>

                  {creator.bio && (
                    <p className="text-zinc-200 mb-6 leading-relaxed max-w-2xl">{creator.bio}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-6 text-sm font-mono text-zinc-400">
                  {creator.subscriber_count > 0 && (
                    <div>
                      <span className="text-white font-bold">{formatSubscriberCount(creator.subscriber_count)}</span> SUBSCRIBERS
                    </div>
                  )}
                  <div>
                    MEMBER SINCE <span className="text-white font-bold">{new Date(creator.created_at).getFullYear()}</span>
                  </div>
                </div>

                {creator.channel_url && (
                  <a
                    href={creator.channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block border-2 border-zinc-600 text-white font-bold px-6 py-3 hover:border-violet-400 hover:text-violet-300 transition-all duration-300 text-sm tracking-wider uppercase"
                  >
                    VISIT CHANNEL
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 p-6 text-center">
            <p className="text-3xl font-black text-violet-400 mb-2">{stats.total_auctions}</p>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Total Auctions</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 text-center">
            <p className="text-3xl font-black text-red-400 mb-2">{stats.active_auctions}</p>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Active Now</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 text-center">
            <p className="text-3xl font-black text-white mb-2">{stats.completed_sales}</p>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Sales</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 text-center">
            <p className="text-3xl font-black text-violet-400 mb-2">${formatPrice(stats.avg_sale_price)}</p>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Avg Price</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-800 mb-8">
          <nav className="flex space-x-12">
            {['auctions', 'about', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'auctions' | 'about' | 'activity')}
                className={`py-4 font-mono text-sm uppercase tracking-wider transition-colors ${
                  activeTab === tab
                    ? 'text-violet-400 border-b-2 border-violet-400'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab} {tab === 'auctions' ? `(${auctions.length})` : ''}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'auctions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <Link
                key={auction.id}
                href={`/auctions/${auction.id}`}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                  {auction.primary_image ? (
                    <Image
                      src={auction.primary_image}
                      alt={auction.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                      <div className="w-16 h-16 bg-zinc-700 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-6 bg-zinc-500 rounded"></div>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 text-xs font-mono font-bold uppercase tracking-wider ${
                      auction.status === 'active' ? 'bg-red-500 text-white' :
                      auction.status === 'ended' ? 'bg-zinc-700 text-zinc-300' :
                      'bg-zinc-600 text-white'
                    }`}>
                      {auction.status === 'active' ? formatTimeRemaining(auction.end_time) : auction.status}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3 line-clamp-2">{auction.title}</h3>
                  <div className="flex justify-between items-center mb-4 text-sm font-mono text-zinc-400 uppercase tracking-wider">
                    <span>{auction.category_name}</span>
                    <span>{auction.condition}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Current Price</p>
                      <p className="text-xl font-black text-violet-400">${formatPrice(auction.current_price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{auction.bid_count} BIDS</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-zinc-900 border border-zinc-800 p-8">
            <div className="max-w-4xl">
              <h3 className="text-2xl font-bold text-white mb-6">ABOUT {(creator.display_name || creator.username).toUpperCase()}</h3>
              {creator.bio ? (
                <p className="text-zinc-200 leading-relaxed mb-8 text-lg">{creator.bio}</p>
              ) : (
                <p className="text-zinc-400 mb-8 font-mono uppercase tracking-wider">No bio provided.</p>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <h4 className="font-bold text-violet-400 mb-6 font-mono uppercase tracking-wider">Creator Details</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-mono uppercase tracking-wider">Username:</span>
                      <span className="text-white font-mono">@{creator.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-mono uppercase tracking-wider">Member since:</span>
                      <span className="text-white font-mono">{new Date(creator.created_at).toLocaleDateString()}</span>
                    </div>
                    {creator.platform && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-mono uppercase tracking-wider">Platform:</span>
                        <span className="text-white font-mono uppercase">{creator.platform}</span>
                      </div>
                    )}
                    {creator.subscriber_count > 0 && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-mono uppercase tracking-wider">Subscribers:</span>
                        <span className="text-white font-mono">{formatSubscriberCount(creator.subscriber_count)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-bold text-violet-400 mb-6 font-mono uppercase tracking-wider">Auction Stats</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-mono uppercase tracking-wider">Total Auctions:</span>
                      <span className="text-white font-mono">{stats.total_auctions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-mono uppercase tracking-wider">Completed Sales:</span>
                      <span className="text-white font-mono">{stats.completed_sales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-mono uppercase tracking-wider">Total Revenue:</span>
                      <span className="text-white font-mono">${formatPrice(stats.total_revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-mono uppercase tracking-wider">Average Sale:</span>
                      <span className="text-white font-mono">${formatPrice(stats.avg_sale_price)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-zinc-900 border border-zinc-800 p-8">
            <h3 className="text-2xl font-bold text-white mb-8 font-mono uppercase tracking-wider">Recent Activity</h3>
            {recentActivity.length > 0 ? (
              <div className="space-y-6">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-6 bg-zinc-800 border border-zinc-700">
                    <div className="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-white font-mono">
                        {activity.activity_type === 'auction_created' ? 'CREATED AUCTION:' : 'AUCTION ENDED:'}
                        <Link 
                          href={`/auctions/${activity.auction_id}`}
                          className="text-violet-400 hover:text-violet-300 ml-2"
                        >
                          {activity.auction_title}
                        </Link>
                      </p>
                      <p className="text-sm text-zinc-400 font-mono mt-1">
                        {new Date(activity.activity_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400 font-mono uppercase tracking-wider">No recent activity.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
