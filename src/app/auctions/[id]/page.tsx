'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface AuctionDetails {
  id: string;
  title: string;
  description: string;
  current_price: number | string;
  starting_price: number | string;
  buy_now_price?: number | string;
  reserve_price?: number | string;
  condition: string;
  status: string;
  start_time: string;
  end_time: string;
  video_url: string;
  video_timestamp?: number;
  created_at: string;
  creator_id: string;
  username: string;
  display_name?: string;
  is_verified: boolean;
  profile_image_url?: string;
  category_name?: string;
  category_description?: string;
  bid_count: number;
  highest_bid?: number | string;
  images: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  recent_bids: Array<{
    id: string;
    amount: number | string;
    created_at: string;
    username: string;
    display_name?: string;
  }>;
  winner_id?: string;
  winner_response?: 'pending' | 'accepted' | 'declined' | 'payment_expired';
  winner_response_at?: string;
  payment_status?: 'pending' | 'paid' | 'expired';
}

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);
  const [auction, setAuction] = useState<AuctionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [winnerAction, setWinnerAction] = useState<'accept' | 'decline' | null>(null);
  const [buyingNow, setBuyingNow] = useState(false);

  // Helper function to safely convert to number
  const toNumber = (value: number | string | undefined | null): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value.toString());
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchAuction = useCallback(async () => {
    try {
      const response = await fetch(`/api/auctions/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setAuction(data.auction);
        const currentPrice = toNumber(data.auction.current_price);
        const startingPrice = toNumber(data.auction.starting_price);
        const minBid = Math.max(currentPrice, startingPrice) + 0.01;
        setBidAmount(minBid.toFixed(2));
      } else if (response.status === 404) {
        router.push('/auctions');
      }
    } catch (error) {
      console.error('Failed to fetch auction:', error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id, router]);

  useEffect(() => {
    fetchAuction();
  }, [fetchAuction]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('updated') === 'true') {
      const timer = setTimeout(() => {
        console.log('Auction updated successfully!');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleWinnerResponse = async (action: 'accept' | 'decline') => {
    if (!user || !auction) return;
    setWinnerAction(action);
    try {
      const response = await fetch(`/api/auctions/${auction.id}/win`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (response.ok) {
        if (action === 'accept' && data.checkout_url) {
          window.location.href = data.checkout_url;
        } else {
          fetchAuction();
        }
      } else {
        alert(data.error || 'Failed to process response');
      }
    } catch (error) {
      console.error('Failed to process winner response:', error);
      alert('Failed to process response');
    } finally {
      setWinnerAction(null);
    }
  };

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auction) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setBidError('Please enter a valid bid amount');
      return;
    }

    const currentPrice = toNumber(auction.current_price);
    if (amount <= currentPrice) {
      setBidError(`Bid must be higher than current price of $${currentPrice.toFixed(2)}`);
      return;
    }

    setBidding(true);
    setBidError('');

    try {
      const response = await fetch(`/api/auctions/${auction.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      if (response.ok) {
        fetchAuction();
        setBidAmount('');
      } else {
        setBidError(data.error || 'Failed to place bid');
      }
    } catch {
      setBidError('Failed to place bid');
    } finally {
      setBidding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user || !auction) return;
    setBuyingNow(true);
    try {
      const response = await fetch(`/api/auctions/${auction.id}/buy-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.error || 'Failed to process buy now');
      }
    } catch (error) {
      console.error('Failed to buy now:', error);
      alert('Failed to process buy now');
    } finally {
      setBuyingNow(false);
    }
  };

  const handleDelete = async () => {
    if (!auction) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/auctions/${auction.id}`, { method: 'DELETE' });
      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete auction');
      }
    } catch (error) {
      console.error('Failed to delete auction:', error);
      alert('Failed to delete auction');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'ENDED';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}D ${hours}H`;
    if (hours > 0) return `${hours}H ${minutes}M`;
    return `${minutes}M`;
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

  if (!auction) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-black mb-6">AUCTION NOT FOUND</h1>
          <Link href="/auctions" className="text-violet-400 hover:text-violet-300 font-mono tracking-[0.15em] transition-colors">
            BROWSE AUCTIONS →
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = toNumber(auction.current_price);
  const startingPrice = toNumber(auction.starting_price);
  const buyNowPrice = toNumber(auction.buy_now_price);
  const isActive = auction.status === 'active' && new Date(auction.end_time) > new Date();
  const isEnded = auction.status === 'ended' || new Date(auction.end_time) <= new Date();
  const isOwner = user?.id === auction.creator_id;
  const isWinner = user?.id === auction.winner_id;

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

      <div className="relative max-w-7xl mx-auto px-8 py-12">
        {/* Electric Header */}
        <div className="mb-12">
          <Link 
            href="/auctions" 
            className="inline-flex items-center text-zinc-400 hover:text-white font-mono text-sm tracking-[0.15em] mb-8 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
            <span className="ml-2">BACK TO AUCTIONS</span>
          </Link>

          {/* Electric Header Card */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-xs text-zinc-500 uppercase font-mono tracking-[0.15em]">
                    {auction.category_name || 'UNCATEGORIZED'}
                  </span>
                  {auction.is_verified && (
                    <div className="px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-xl text-xs font-mono text-violet-300 tracking-[0.1em] backdrop-blur-sm">
                      VERIFIED
                    </div>
                  )}
                  <div className={`px-3 py-1 rounded-xl text-xs font-mono tracking-[0.1em] border backdrop-blur-sm ${
                    isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    isEnded ? 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' :
                    'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {auction.status.toUpperCase()}
                  </div>
                </div>
                <h1 className="text-4xl font-black text-white mb-4 tracking-tight leading-tight">{auction.title}</h1>
                <Link 
                  href={`/creators/${auction.username}`}
                  className="inline-flex items-center space-x-3 text-zinc-300 hover:text-white transition-colors group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {(auction.display_name || auction.username)[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="font-mono text-sm tracking-[0.1em] group-hover:translate-x-1 transition-transform duration-200">
                    BY {(auction.display_name || auction.username).toUpperCase()}
                  </span>
                </Link>
              </div>
              <div className="text-right ml-8">
                <div className="text-xs text-zinc-500 mb-2 font-mono tracking-[0.1em]">
                  {isEnded ? 'FINAL PRICE' : 'CURRENT BID'}
                </div>
                <div className="text-4xl font-black text-white mb-2">${currentPrice.toFixed(2)}</div>
                <div className="flex items-center space-x-4 text-xs font-mono tracking-[0.1em]">
                  <span className="text-zinc-400">
                    {auction.bid_count} BID{auction.bid_count !== 1 ? 'S' : ''}
                  </span>
                  <span className={`font-bold ${
                    isActive ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {isEnded ? 'ENDED' : `ENDS ${formatTimeRemaining(auction.end_time)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Item Display */}
          <div className="lg:col-span-3">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent"></div>
              
              {/* Image Gallery */}
              <div className="relative">
                {auction.images.length > 0 ? (
                  <div className="relative h-96 bg-zinc-800/30">
                    <Image
                      src={auction.images[selectedImage]?.image_url}
                      alt={auction.title}
                      fill
                      className="object-contain p-6"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                    
                    {/* Navigation Controls */}
                    {auction.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImage(selectedImage > 0 ? selectedImage - 1 : auction.images.length - 1)}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-xl backdrop-blur-sm border border-zinc-600/30 flex items-center justify-center text-white transition-all z-10"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => setSelectedImage(selectedImage < auction.images.length - 1 ? selectedImage + 1 : 0)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-xl backdrop-blur-sm border border-zinc-600/30 flex items-center justify-center text-white transition-all z-10"
                        >
                          →
                        </button>
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl text-white text-xs font-mono tracking-[0.1em] z-10">
                          {selectedImage + 1} / {auction.images.length}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="h-96 bg-zinc-800/30 flex items-center justify-center">
                    <div className="w-24 h-24 bg-zinc-700/50 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <div className="w-12 h-12 bg-zinc-600/50 rounded-xl"></div>
                    </div>
                  </div>
                )}
                
                {/* Thumbnail Strip */}
                {auction.images.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
                      {auction.images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition-all backdrop-blur-sm ${
                            selectedImage === index 
                              ? 'border-violet-400 ring-2 ring-violet-400/30' 
                              : 'border-white/20 hover:border-white/40'
                          }`}
                        >
                          <Image
                            src={image.image_url}
                            alt={`${auction.title} ${index + 1}`}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Content Area */}
              <div className="relative p-8">
                {/* Description */}
                <div className="mb-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-violet-400 to-purple-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-white tracking-tight">DESCRIPTION</h3>
                  </div>
                  {auction.description ? (
                    <p className="text-zinc-300 leading-relaxed pl-6">
                      {auction.description}
                    </p>
                  ) : (
                    <p className="text-zinc-500 italic pl-6 font-mono text-sm tracking-[0.1em]">
                      NO DESCRIPTION PROVIDED
                    </p>
                  )}
                </div>

                {/* Details Grid */}
                <div className="mb-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-violet-400 to-purple-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-white tracking-tight">ITEM DETAILS</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="bg-zinc-800/30 rounded-xl p-4 backdrop-blur-sm border border-zinc-700/30">
                      <div className="text-xs text-zinc-500 font-mono tracking-[0.1em] mb-1">CONDITION</div>
                      <div className="text-white font-medium capitalize">
                        {auction.condition.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="bg-zinc-800/30 rounded-xl p-4 backdrop-blur-sm border border-zinc-700/30">
                      <div className="text-xs text-zinc-500 font-mono tracking-[0.1em] mb-1">STARTING PRICE</div>
                      <div className="text-white font-medium">${startingPrice.toFixed(2)}</div>
                    </div>
                    <div className="bg-zinc-800/30 rounded-xl p-4 backdrop-blur-sm border border-zinc-700/30">
                      <div className="text-xs text-zinc-500 font-mono tracking-[0.1em] mb-1">STARTED</div>
                      <div className="text-white font-medium">
                        {new Date(auction.start_time).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="bg-zinc-800/30 rounded-xl p-4 backdrop-blur-sm border border-zinc-700/30">
                      <div className="text-xs text-zinc-500 font-mono tracking-[0.1em] mb-1">ENDS</div>
                      <div className="text-white font-medium">
                        {new Date(auction.end_time).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Section */}
                {auction.video_url && (
                  <div className="mb-8">
                    <div className="bg-zinc-800/30 rounded-xl p-6 border border-zinc-700/30 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-bold mb-2">FEATURED VIDEO</h4>
                          <p className="text-zinc-400 text-sm font-mono tracking-[0.1em]">ITEM SHOWCASE</p>
                        </div>
                        <a 
                          href={auction.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative overflow-hidden px-6 py-3 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-sm text-white font-mono text-sm tracking-[0.15em] hover:from-violet-500/20 hover:to-purple-500/20 hover:border-violet-400/50 transition-all duration-300"
                        >
                          <span className="relative">WATCH</span>
                        </a>
                      </div>
                      {auction.video_timestamp && (
                        <div className="text-xs text-zinc-500 mt-3 font-mono tracking-[0.1em]">
                          @ {auction.video_timestamp}s
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Bids */}
                {auction.recent_bids && auction.recent_bids.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-1 h-6 bg-gradient-to-b from-violet-400 to-purple-500 rounded-full"></div>
                      <h3 className="text-lg font-bold text-white tracking-tight">RECENT ACTIVITY</h3>
                    </div>
                    <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/30 backdrop-blur-sm overflow-hidden pl-6">
                      {auction.recent_bids.slice(0, 5).map((bid, index) => (
                        <div key={bid.id} className="flex items-center justify-between px-6 py-4 border-b border-zinc-700/30 last:border-b-0">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-zinc-700/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
                              <span className="text-xs text-zinc-300 font-mono">
                                {auction.recent_bids.length - index}
                              </span>
                            </div>
                            <span className="text-zinc-300 font-mono text-sm tracking-[0.1em]">
                              {bid.display_name || bid.username}
                            </span>
                          </div>
                          <span className="text-white font-bold">
                            ${toNumber(bid.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Bidding */}
          <div className="lg:col-span-2 space-y-6">
            {/* Winner Response */}
            {isWinner && isEnded && (
              <div className="relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-emerald-950/30 backdrop-blur-xl p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
                <div className="relative">
                  <h3 className="text-emerald-300 font-bold mb-4 text-lg tracking-tight">🎉 YOU WON!</h3>
                  {auction.winner_response === 'pending' && (
                    <div className="space-y-4">
                      <p className="text-sm text-emerald-300 mb-4 font-mono tracking-[0.1em]">ACCEPT WITHIN 48 HOURS</p>
                      <button
                        onClick={() => handleWinnerResponse('accept')}
                        disabled={winnerAction === 'accept'}
                        className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-mono py-4 px-6 rounded-xl transition-all disabled:opacity-50 tracking-[0.1em]"
                      >
                        {winnerAction === 'accept' ? 'PROCESSING...' : `PAY $${currentPrice.toFixed(2)}`}
                      </button>
                      <button
                        onClick={() => handleWinnerResponse('decline')}
                        disabled={winnerAction === 'decline'}
                        className="w-full bg-zinc-700/20 hover:bg-zinc-700/30 border border-zinc-600/30 text-zinc-300 font-mono py-4 px-6 rounded-xl transition-all disabled:opacity-50 tracking-[0.1em]"
                      >
                        DECLINE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Electric Bidding Panel */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent"></div>
              <div className="relative">
                <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">PLACE BID</h3>
                
                {/* Current Price Display */}
                <div className="bg-zinc-800/30 rounded-2xl p-6 mb-6 text-center border border-zinc-700/30 backdrop-blur-sm">
                  <div className="text-xs text-zinc-500 uppercase tracking-[0.2em] mb-2 font-mono">
                    {isEnded ? 'FINAL PRICE' : 'CURRENT BID'}
                  </div>
                  <div className="text-3xl font-black text-white mb-2">${currentPrice.toFixed(2)}</div>
                  <div className="text-xs text-zinc-400 font-mono tracking-[0.1em]">
                    {auction.bid_count} BID{auction.bid_count !== 1 ? 'S' : ''}
                  </div>
                </div>
                
                {/* Bidding Form */}
                {isActive && !isOwner && user && (
                  <div className="space-y-6">
                    <form onSubmit={handleBid} className="space-y-6">
                      <div>
                        <label className="block text-sm font-mono text-zinc-400 mb-3 tracking-[0.1em]">
                          YOUR BID (MIN: ${(Math.max(currentPrice, startingPrice) + 0.01).toFixed(2)})
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 font-mono">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min={Math.max(currentPrice, startingPrice) + 0.01}
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="w-full pl-10 pr-4 py-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 font-mono backdrop-blur-sm focus:outline-none focus:border-violet-400/50 focus:bg-zinc-800/70 transition-all duration-300"
                            disabled={bidding}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={bidding}
                        className="w-full bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 disabled:bg-zinc-600/20 text-white font-mono py-4 px-6 rounded-xl transition-all tracking-[0.1em]"
                      >
                        {bidding ? 'PLACING BID...' : 'PLACE BID'}
                      </button>
                    </form>
                    
                    {bidError && (
                      <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-red-200 text-sm font-mono tracking-[0.1em]">{bidError}</p>
                      </div>
                    )}

                    {buyNowPrice > 0 && (
                      <div className="pt-6 border-t border-zinc-700/30">
                        <button 
                          onClick={handleBuyNow}
                          disabled={buyingNow}
                          className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 disabled:bg-zinc-600/20 text-white font-mono py-4 px-6 rounded-xl transition-all tracking-[0.1em]"
                        >
                          {buyingNow ? 'PROCESSING...' : `BUY NOW $${buyNowPrice.toFixed(2)}`}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!user && isActive && (
                  <div className="bg-zinc-800/30 rounded-xl p-6 text-center border border-zinc-700/30 backdrop-blur-sm">
                    <p className="text-zinc-300 mb-4 font-mono tracking-[0.1em]">SIGN IN TO PLACE BIDS</p>
                    <Link 
                      href="/auth/login"
                      className="text-violet-400 hover:text-violet-300 font-mono font-bold tracking-[0.15em] transition-colors"
                    >
                      SIGN IN →
                    </Link>
                  </div>
                )}

                {!isActive && !isWinner && (
                  <div className="bg-zinc-800/30 rounded-xl p-6 text-center border border-zinc-700/30 backdrop-blur-sm">
                    <p className="text-zinc-400 font-mono tracking-[0.1em]">
                      {isEnded ? 'AUCTION ENDED' : 'NOT ACTIVE'}
                    </p>
                  </div>
                )}

                {/* Owner Actions */}
                {isOwner && (
                  <div className="space-y-4 pt-6 border-t border-zinc-700/30">
                    <Link 
                      href={`/creator/auctions/${auction.id}/edit`}
                      className="w-full bg-zinc-700/20 hover:bg-zinc-700/30 border border-zinc-600/30 text-white font-mono py-4 px-6 rounded-xl transition-all text-center block tracking-[0.1em]"
                    >
                      EDIT AUCTION
                    </Link>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 font-mono py-4 px-6 rounded-xl transition-all tracking-[0.1em]"
                    >
                      DELETE AUCTION
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Electric Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/90 backdrop-blur-xl p-8 max-w-md w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent"></div>
              <div className="relative">
                <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">DELETE AUCTION</h3>
                <p className="text-zinc-300 mb-8 leading-relaxed">
                  Are you sure you want to delete this auction? This action cannot be undone.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 font-mono py-4 px-6 rounded-xl transition-all disabled:opacity-50 tracking-[0.1em]"
                  >
                    {deleting ? 'DELETING...' : 'DELETE'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 bg-zinc-700/20 hover:bg-zinc-700/30 border border-zinc-600/30 text-zinc-300 font-mono py-4 px-6 rounded-xl transition-all tracking-[0.1em]"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
