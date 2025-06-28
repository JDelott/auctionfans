'use client';

import { useState, useEffect, use } from 'react';
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

  useEffect(() => {
    fetchCreatorData();
  }, [resolvedParams.username]);

  const fetchCreatorData = async () => {
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
  };

  const formatPrice = (price: number | string | null | undefined): string => {
    const numPrice = Number(price) || 0;
    return numPrice.toFixed(2);
  };

  const formatTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatSubscriberCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'youtube':
        return '📺';
      case 'twitch':
        return '🎮';
      case 'tiktok':
        return '🎵';
      case 'instagram':
        return '📷';
      case 'twitter':
        return '🐦';
      default:
        return '🌐';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!creatorData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Creator Not Found</h1>
          <Link href="/creators" className="btn-primary">Browse Creators</Link>
        </div>
      </div>
    );
  }

  const { creator, auctions, stats, recentActivity } = creatorData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/creators" className="text-caption text-gray-600 hover:text-indigo-600">
            ← BACK TO CREATORS
          </Link>
        </div>

        {/* Creator Profile Header */}
        <div className="card p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
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
                <div className="w-30 h-30 bg-gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {(creator.display_name || creator.username).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-heading text-gray-900">
                  {creator.display_name || creator.username}
                </h1>
                {creator.is_verified && (
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-semibold">
                    VERIFIED
                  </span>
                )}
              </div>
              <p className="text-caption text-gray-600 mb-4">@{creator.username}</p>
              
              {creator.bio && (
                <p className="text-gray-700 mb-4 leading-relaxed">{creator.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 mb-4">
                {creator.platform && (
                  <div className="flex items-center space-x-2">
                    <span>{getPlatformIcon(creator.platform)}</span>
                    <span className="text-sm text-gray-600">
                      {creator.platform.charAt(0).toUpperCase() + creator.platform.slice(1)}
                    </span>
                  </div>
                )}
                {creator.subscriber_count > 0 && (
                  <div className="text-sm text-gray-600">
                    {formatSubscriberCount(creator.subscriber_count)} subscribers
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  Member since {new Date(creator.created_at).toLocaleDateString()}
                </div>
              </div>

              {creator.channel_url && (
                <a
                  href={creator.channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-block"
                >
                  Visit Channel
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{stats.total_auctions}</p>
            <p className="text-sm text-gray-600">Total Auctions</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.active_auctions}</p>
            <p className="text-sm text-gray-600">Active Auctions</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.completed_sales}</p>
            <p className="text-sm text-gray-600">Sales</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">${formatPrice(stats.avg_sale_price)}</p>
            <p className="text-sm text-gray-600">Avg Sale Price</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('auctions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'auctions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Auctions ({auctions.length})
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'about'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Activity
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'auctions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <Link
                key={auction.id}
                href={`/auctions/${auction.id}`}
                className="card overflow-hidden hover:border-indigo-300 group"
              >
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {auction.primary_image ? (
                    <Image
                      src={auction.primary_image}
                      alt={auction.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                        <div className="w-6 h-6 bg-white rounded"></div>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      auction.status === 'active' ? 'bg-green-100 text-green-800' :
                      auction.status === 'ended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {auction.status === 'active' ? formatTimeRemaining(auction.end_time) : auction.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{auction.title}</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">{auction.category_name}</span>
                    <span className="text-sm text-gray-500 capitalize">{auction.condition}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Current Price</p>
                      <p className="text-xl font-bold text-green-600">${formatPrice(auction.current_price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{auction.bid_count} bids</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="card p-8">
            <div className="max-w-3xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About {creator.display_name || creator.username}</h3>
              {creator.bio ? (
                <p className="text-gray-700 leading-relaxed mb-6">{creator.bio}</p>
              ) : (
                <p className="text-gray-500 mb-6">No bio provided.</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Creator Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Username:</span>
                      <span className="text-gray-900">@{creator.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Member since:</span>
                      <span className="text-gray-900">{new Date(creator.created_at).toLocaleDateString()}</span>
                    </div>
                    {creator.platform && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platform:</span>
                        <span className="text-gray-900 capitalize">{creator.platform}</span>
                      </div>
                    )}
                    {creator.subscriber_count > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subscribers:</span>
                        <span className="text-gray-900">{formatSubscriberCount(creator.subscriber_count)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Auction Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Auctions:</span>
                      <span className="text-gray-900">{stats.total_auctions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed Sales:</span>
                      <span className="text-gray-900">{stats.completed_sales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Revenue:</span>
                      <span className="text-gray-900">${formatPrice(stats.total_revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Sale Price:</span>
                      <span className="text-gray-900">${formatPrice(stats.avg_sale_price)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="card p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-gray-900">
                        {activity.activity_type === 'auction_created' ? 'Created auction:' : 'Auction ended:'}
                        <Link 
                          href={`/auctions/${activity.auction_id}`}
                          className="text-indigo-600 hover:text-indigo-700 ml-1"
                        >
                          {activity.auction_title}
                        </Link>
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(activity.activity_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent activity.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
