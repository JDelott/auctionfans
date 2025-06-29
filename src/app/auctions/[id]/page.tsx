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
      // Show success message
      const timer = setTimeout(() => {
        // You could add a toast notification here
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

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Auction not found</h1>
          <Link href="/auctions" className="text-violet-400 hover:text-violet-300">
            Browse auctions →
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
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/auctions" 
            className="inline-flex items-center text-zinc-400 hover:text-white text-sm mb-4 transition-colors"
          >
            ← Back to Auctions
          </Link>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-zinc-400 font-mono">{auction.category_name}</span>
                  {auction.is_verified && (
                    <span className="px-2 py-0.5 bg-violet-500/20 border border-violet-500/30 rounded text-xs font-mono text-violet-300">
                      VERIFIED
                    </span>
                  )}
                  <div className={`px-2 py-0.5 rounded text-xs font-mono ${
                    isActive ? 'bg-green-600 text-white' :
                    isEnded ? 'bg-zinc-700 text-zinc-300' :
                    'bg-amber-600 text-white'
                  }`}>
                    {auction.status.toUpperCase()}
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">{auction.title}</h1>
                <Link 
                  href={`/creators/${auction.username}`}
                  className="text-zinc-300 hover:text-white transition-colors text-sm"
                >
                  by {auction.display_name || auction.username}
                </Link>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-400 font-mono mb-1">
                  {isEnded ? 'FINAL PRICE' : 'CURRENT BID'}
                </div>
                <div className="text-2xl font-black text-white">${currentPrice.toFixed(2)}</div>
                <div className="text-xs text-zinc-400">
                  {auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''} • {isEnded ? 'Ended' : formatTimeRemaining(auction.end_time)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Item Display (3/5 width) */}
          <div className="lg:col-span-3">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
              {/* Image Gallery - Fixed Height */}
              <div className="relative">
                {auction.images.length > 0 ? (
                  <div className="relative h-80 bg-zinc-800">
                    <Image
                      src={auction.images[selectedImage]?.image_url}
                      alt={auction.title}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                    
                    {/* Navigation and controls */}
                    {auction.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImage(selectedImage > 0 ? selectedImage - 1 : auction.images.length - 1)}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all z-10"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => setSelectedImage(selectedImage < auction.images.length - 1 ? selectedImage + 1 : 0)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all z-10"
                        >
                          →
                        </button>
                        <div className="absolute bottom-3 right-3 bg-black/70 px-3 py-1 rounded-full text-white text-xs z-10">
                          {selectedImage + 1} / {auction.images.length}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="h-80 bg-zinc-800 flex items-center justify-center">
                    <div className="w-20 h-20 bg-zinc-700 rounded-xl flex items-center justify-center">
                      <div className="w-8 h-8 bg-zinc-600 rounded"></div>
                    </div>
                  </div>
                )}
                
                {/* Thumbnail Strip - Proportional to image area */}
                {auction.images.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                      {auction.images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-14 h-14 rounded-lg border-2 overflow-hidden transition-all ${
                            selectedImage === index 
                              ? 'border-violet-400 ring-1 ring-violet-400' 
                              : 'border-white/30 hover:border-white/60'
                          }`}
                        >
                          <Image
                            src={image.image_url}
                            alt={`${auction.title} ${index + 1}`}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Content Area - Tighter layout */}
              <div className="p-4">
                {/* Description Section - Compact */}
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-0.5 h-4 bg-violet-500 rounded-full mr-2"></div>
                    <h3 className="text-sm font-semibold text-white">Description</h3>
                  </div>
                  {auction.description ? (
                    <p className="text-zinc-300 text-xs leading-relaxed pl-3">
                      {auction.description}
                    </p>
                  ) : (
                    <p className="text-zinc-500 text-xs italic pl-3">No description provided</p>
                  )}
                </div>

                {/* Details Grid - Much tighter */}
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-0.5 h-4 bg-violet-500 rounded-full mr-2"></div>
                    <h3 className="text-sm font-semibold text-white">Item Details</h3>
                  </div>
                  <div className="pl-3 space-y-1">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-400 text-xs">Condition</span>
                      <span className="text-white text-xs font-medium capitalize">
                        {auction.condition.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-400 text-xs">Starting Price</span>
                      <span className="text-white text-xs font-medium">${startingPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-400 text-xs">Started</span>
                      <span className="text-white text-xs font-medium">
                        {new Date(auction.start_time).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-400 text-xs">Ends</span>
                      <span className="text-white text-xs font-medium">
                        {new Date(auction.end_time).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Video Section - Compact */}
                {auction.video_url && (
                  <div className="mb-4">
                    <div className="bg-zinc-800/50 rounded p-3 border border-zinc-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium text-xs mb-0.5">Featured Video</h4>
                          <p className="text-zinc-400 text-xs">Item showcase</p>
                        </div>
                        <a 
                          href={auction.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-violet-600 hover:bg-violet-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Watch
                        </a>
                      </div>
                      {auction.video_timestamp && (
                        <div className="text-xs text-zinc-500 mt-1 font-mono">
                          @ {auction.video_timestamp}s
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Bids - Compact */}
                {auction.recent_bids && auction.recent_bids.length > 0 && (
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="w-0.5 h-4 bg-violet-500 rounded-full mr-2"></div>
                      <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
                    </div>
                    <div className="bg-zinc-800/50 rounded border border-zinc-700 max-h-24 overflow-y-auto">
                      {auction.recent_bids.slice(0, 3).map((bid, index) => (
                        <div key={bid.id} className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-700 last:border-b-0">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-zinc-700 rounded-full flex items-center justify-center">
                              <span className="text-xs text-zinc-300 font-mono">
                                {auction.recent_bids.length - index}
                              </span>
                            </div>
                            <span className="text-zinc-300 text-xs truncate max-w-20">
                              {bid.display_name || bid.username}
                            </span>
                          </div>
                          <span className="text-white font-semibold text-xs">
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

          {/* Right Column - Bidding (2/5 width) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Winner Response */}
            {isWinner && isEnded && (
              <div className="bg-emerald-950/50 border border-emerald-800 rounded-lg p-4">
                <h3 className="text-emerald-300 font-semibold mb-3 text-sm">🎉 You Won!</h3>
                {auction.winner_response === 'pending' && (
                  <div className="space-y-2">
                    <p className="text-xs text-emerald-300 mb-3">Accept within 48 hours</p>
                    <button
                      onClick={() => handleWinnerResponse('accept')}
                      disabled={winnerAction === 'accept'}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-3 rounded transition-colors disabled:opacity-50 text-sm"
                    >
                      {winnerAction === 'accept' ? 'Processing...' : `Pay $${currentPrice.toFixed(2)}`}
                    </button>
                    <button
                      onClick={() => handleWinnerResponse('decline')}
                      disabled={winnerAction === 'decline'}
                      className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-2.5 px-3 rounded transition-colors disabled:opacity-50 text-sm"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bidding Panel - Proportional to content */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Place Bid</h3>
              
              {/* Current Price Display */}
              <div className="bg-zinc-800/50 rounded-lg p-4 mb-4 text-center">
                <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
                  {isEnded ? 'Final Price' : 'Current Bid'}
                </div>
                <div className="text-2xl font-bold text-white">${currentPrice.toFixed(2)}</div>
                <div className="text-xs text-zinc-400 mt-1">
                  {auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''}
                </div>
              </div>
              
              {/* Bidding Form */}
              {isActive && !isOwner && user && (
                <div className="space-y-3">
                  <form onSubmit={handleBid} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Your Bid (min: ${(Math.max(currentPrice, startingPrice) + 0.01).toFixed(2)})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min={Math.max(currentPrice, startingPrice) + 0.01}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="w-full pl-8 pr-3 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                          disabled={bidding}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={bidding}
                      className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-600 text-white font-medium py-3 px-4 rounded transition-colors"
                    >
                      {bidding ? 'Placing Bid...' : 'Place Bid'}
                    </button>
                  </form>
                  
                  {bidError && (
                    <div className="bg-red-950/50 border border-red-800 rounded p-3">
                      <p className="text-red-200 text-xs">{bidError}</p>
                    </div>
                  )}

                  {buyNowPrice > 0 && (
                    <div className="pt-3 border-t border-zinc-800">
                      <button 
                        onClick={handleBuyNow}
                        disabled={buyingNow}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-600 text-white font-medium py-3 px-4 rounded transition-colors"
                      >
                        {buyingNow ? 'Processing...' : `Buy Now $${buyNowPrice.toFixed(2)}`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!user && isActive && (
                <div className="bg-zinc-800 rounded p-4 text-center">
                  <p className="text-zinc-300 text-sm mb-3">Sign in to place bids</p>
                  <Link 
                    href="/auth/login"
                    className="text-violet-400 hover:text-violet-300 font-medium"
                  >
                    Sign In →
                  </Link>
                </div>
              )}

              {!isActive && !isWinner && (
                <div className="bg-zinc-800 rounded p-4 text-center">
                  <p className="text-zinc-400">
                    {isEnded ? 'Auction ended' : 'Not active'}
                  </p>
                </div>
              )}

              {/* Owner Actions */}
              {isOwner && (
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                  <Link 
                    href={`/creator/auctions/${auction.id}/edit`}
                    className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-3 px-4 rounded transition-colors text-center block"
                  >
                    Edit Auction
                  </Link>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded transition-colors"
                  >
                    Delete Auction
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-4">Delete Auction</h3>
              <p className="text-zinc-300 mb-6">
                Are you sure you want to delete this auction? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-3 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
