'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Auction {
  id: string;
  title: string;
  description: string;
  starting_price: number;
  current_price: number;
  buy_now_price?: number;
  condition: string;
  status: string;
  start_time: string;
  end_time: string;
  video_url?: string;
  video_timestamp?: number;
  primary_image?: string;
  image_url?: string;
  bid_count: number;
  watchers_count?: number;
}

export default function CreatorAuctionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loadingAuctions, setLoadingAuctions] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');

  useEffect(() => {
    if (!loading && user?.is_creator) {
      fetchAuctions();
    }
  }, [loading, user]);

  const fetchAuctions = async () => {
    try {
      const response = await fetch('/api/auctions/my-auctions');
      const data = await response.json();
      
      if (response.ok) {
        setAuctions(data.auctions || []);
      }
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
    } finally {
      setLoadingAuctions(false);
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

  const filteredAuctions = auctions.filter(auction => {
    if (filter === 'all') return true;
    if (filter === 'active') return auction.status === 'active';
    if (filter === 'ended') return auction.status === 'ended';
    return true;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'ended': return 'text-zinc-400';
      case 'sold': return 'text-blue-400';
      default: return 'text-zinc-400';
    }
  };

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Auctions</h1>
            <p className="text-zinc-400">Manage your auction listings</p>
          </div>
          
          <div className="flex gap-4">
            <Link
              href="/creator/create-auction"
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Auction
            </Link>
            <Link
              href="/creator/video-auctions"
              className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Video Auctions
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6">
          {(['all', 'active', 'ended'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                filter === tab
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tab} ({auctions.filter(a => tab === 'all' || a.status === tab).length})
            </button>
          ))}
        </div>

        {/* Auctions Grid */}
        {loadingAuctions ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading your auctions...</p>
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-zinc-500 text-6xl mb-4">📦</div>
            <h3 className="text-white font-medium mb-2">No auctions found</h3>
            <p className="text-zinc-400 mb-6">
              {filter === 'all' 
                ? "You haven't created any auctions yet." 
                : `No ${filter} auctions found.`}
            </p>
            <Link
              href="/creator/create-auction"
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Your First Auction
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map((auction) => {
              // Use primary_image first, fallback to image_url
              const imageUrl = auction.primary_image || auction.image_url;
              
              return (
                <div key={auction.id} className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden hover:border-zinc-700/50 transition-colors">
                  {/* Auction Image */}
                  <div className="aspect-video bg-zinc-800 relative">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={auction.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-zinc-500 text-4xl">📦</div>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full bg-black/50 backdrop-blur-sm ${getStatusColor(auction.status)}`}>
                        {auction.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Auction Info */}
                  <div className="p-4">
                    <h3 className="text-white font-medium mb-2 line-clamp-2">
                      {auction.title}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-zinc-400">Current Bid</p>
                        <p className="text-white font-medium">{formatPrice(auction.current_price)}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400">Time Left</p>
                        <p className="text-white font-medium">{getTimeRemaining(auction.end_time)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-4">
                      <span>{auction.bid_count || 0} bids</span>
                      <span>{auction.watchers_count || 0} watching</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/auctions/${auction.id}`}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-center py-2 rounded-lg font-medium transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/creator/auctions/${auction.id}/edit`}
                        className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-center py-2 rounded-lg font-medium transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
