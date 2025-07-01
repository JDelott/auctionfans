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
  starting_price: number | string;
  current_price: number | string;
  buy_now_price?: number | string;
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
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border border-violet-400/10 rounded-full animate-ping"></div>
        </div>
      </div>
    );
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

  const formatPrice = (price: number | string) => {
    const numPrice = Number(price) || 0;
    return numPrice.toFixed(2);
  };

  const getTimeRemaining = (endTime: string) => {
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
          <div className="flex items-center space-x-6">
            <div className="w-1 h-20 bg-gradient-to-b from-violet-400 to-purple-500"></div>
            <div>
              <h1 className="text-6xl font-black text-white tracking-tight mb-4">
                MY AUCTIONS
              </h1>
              <p className="text-zinc-400 font-mono text-sm tracking-[0.2em] uppercase">
                MANAGE YOUR AUCTION LISTINGS
              </p>
            </div>
          </div>
        </header>

        {/* Electric Filter Tabs */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl p-8 mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent"></div>
              <h2 className="text-2xl font-black text-white tracking-tight">FILTER AUCTIONS</h2>
            </div>
            <div className="flex space-x-4">
              {(['all', 'active', 'ended'] as const).map((tab) => {
                const count = auctions.filter(a => tab === 'all' || a.status === tab).length;
                return (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`group relative overflow-hidden px-6 py-3 rounded-xl font-mono text-sm tracking-[0.15em] transition-all duration-300 ${
                      filter === tab
                        ? 'border border-violet-400/30 bg-gradient-to-r from-violet-500/20 to-purple-500/20 backdrop-blur-sm text-white'
                        : 'border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white hover:border-zinc-600/50'
                    }`}
                  >
                    {filter === tab && (
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10"></div>
                    )}
                    <span className="relative">{tab.toUpperCase()} ({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Auctions Grid */}
        {loadingAuctions ? (
          <div className="text-center py-24">
            <div className="relative mb-8">
              <div className="w-12 h-12 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 w-12 h-12 border border-violet-400/10 rounded-full animate-ping mx-auto"></div>
            </div>
            <p className="text-zinc-400 font-mono text-sm tracking-[0.15em]">LOADING AUCTIONS...</p>
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-zinc-800/50 rounded-full mx-auto mb-8 flex items-center justify-center backdrop-blur-sm">
              <div className="w-12 h-12 bg-zinc-700/50 rounded-2xl"></div>
            </div>
            <h3 className="text-3xl font-black text-white mb-6">NO AUCTIONS FOUND</h3>
            <p className="text-zinc-400 font-mono text-sm tracking-[0.15em] mb-8">
              {filter === 'all' 
                ? "YOU HAVEN'T CREATED ANY AUCTIONS YET" 
                : `NO ${filter.toUpperCase()} AUCTIONS FOUND`}
            </p>
            <Link
              href="/creator/create-auction"
              className="group relative overflow-hidden px-8 py-4 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-sm text-white font-mono text-sm tracking-[0.15em] hover:from-violet-500/20 hover:to-purple-500/20 hover:border-violet-400/50 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative">CREATE YOUR FIRST AUCTION</span>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAuctions.map((auction) => {
              const imageUrl = auction.primary_image || auction.image_url;
              
              return (
                <div key={auction.id} className="group relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl hover:border-zinc-600/50 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Image Container */}
                  <div className="relative aspect-square bg-zinc-800/30 overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
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
                    {/* Title and Status */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-white font-bold text-lg truncate group-hover:text-violet-300 transition-colors flex-1 mr-3">
                        {auction.title}
                      </h3>
                      <div className={`text-xs font-mono tracking-[0.1em] font-bold flex-shrink-0 ${
                        auction.status === 'active' ? 'text-emerald-400' :
                        auction.status === 'ended' ? 'text-zinc-400' :
                        auction.status === 'sold' ? 'text-blue-400' :
                        'text-zinc-400'
                      }`}>
                        {auction.status.toUpperCase()}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-zinc-500 mb-2 font-mono tracking-[0.1em]">CURRENT BID</p>
                        <p className="text-xl font-black text-white">${formatPrice(auction.current_price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-2 font-mono tracking-[0.1em]">TIME LEFT</p>
                        <p className="text-xl font-black text-white">{getTimeRemaining(auction.end_time)}</p>
                      </div>
                    </div>

                    {/* Activity Stats */}
                    <div className="flex items-center justify-between text-xs font-mono tracking-[0.1em] mb-6">
                      <span className="text-zinc-400">
                        {auction.bid_count || 0} BID{(auction.bid_count || 0) !== 1 ? 'S' : ''}
                      </span>
                      <span className="text-zinc-400">
                        {auction.watchers_count || 0} WATCHING
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Link
                        href={`/auctions/${auction.id}`}
                        className="flex-1 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/30 text-zinc-300 hover:text-white text-center py-3 rounded-xl font-mono text-xs tracking-[0.1em] transition-all duration-300"
                      >
                        VIEW
                      </Link>
                      <Link
                        href={`/creator/auctions/${auction.id}/edit`}
                        className="flex-1 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 hover:text-white text-center py-3 rounded-xl font-mono text-xs tracking-[0.1em] transition-all duration-300"
                      >
                        EDIT
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
