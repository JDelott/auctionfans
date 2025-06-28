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
        // Set minimum bid amount
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (action === 'accept' && data.checkout_url) {
          // Redirect to Stripe checkout
          window.location.href = data.checkout_url;
        } else {
          // Refresh auction data
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      
      if (response.ok) {
        fetchAuction(); // Refresh auction data
        setBidAmount(''); // Reset bid amount
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
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.error || 'Failed to process Buy Now');
      }
    } catch (error) {
      console.error('Failed to process Buy Now:', error);
      alert('Failed to process Buy Now');
    } finally {
      setBuyingNow(false);
    }
  };

  const handleDelete = async () => {
    if (!auction) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/auctions/${auction.id}`, {
        method: 'DELETE',
      });

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Auction Not Found</h1>
          <Link href="/auctions" className="btn-primary">Browse Auctions</Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === auction.creator_id;
  const isActive = auction.status === 'active' && new Date() < new Date(auction.end_time);
  const currentPrice = toNumber(auction.current_price);
  const startingPrice = toNumber(auction.starting_price);
  const buyNowPrice = toNumber(auction.buy_now_price);
  const reservePrice = toNumber(auction.reserve_price);
  const isEnded = auction.status === 'ended';
  const isWinner = user?.id === auction.winner_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/auctions" className="text-caption text-gray-600 hover:text-indigo-600">
            ← BACK TO AUCTIONS
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Images */}
            <div className="card overflow-hidden mb-6">
              <div className="aspect-square bg-gray-100 relative">
                {auction.images.length > 0 ? (
                  <Image
                    src={auction.images[selectedImage]?.image_url}
                    alt={auction.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                    <div className="w-24 h-24 bg-white/20 rounded-xl flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded"></div>
                    </div>
                  </div>
                )}
              </div>
              
              {auction.images.length > 1 && (
                <div className="p-4 bg-white border-t">
                  <div className="flex space-x-2 overflow-x-auto">
                    {auction.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden ${
                          selectedImage === index ? 'border-indigo-600' : 'border-gray-200'
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

            {/* Details */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-caption text-gray-600">{auction.category_name}</span>
                <div className="flex items-center space-x-3">
                  {auction.is_verified && (
                    <span className="creator-badge">VERIFIED</span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isActive ? 'bg-green-100 text-green-800' :
                    isEnded ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
                  </span>
                </div>
              </div>

              <h1 className="text-heading text-gray-900 mb-4">{auction.title}</h1>
              
              <div className="flex items-center space-x-4 mb-6">
                <Link 
                  href={`/creators/${auction.username}`}
                  className="flex items-center space-x-2 hover:text-indigo-600"
                >
                  <span className="text-caption text-gray-600">BY</span>
                  <span className="font-semibold">
                    {auction.display_name || auction.username}
                  </span>
                </Link>
              </div>

              {auction.description && (
                <div className="mb-6">
                  <p className="text-body text-gray-700 whitespace-pre-wrap">{auction.description}</p>
                </div>
              )}

              {auction.video_url && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Associated Video</h3>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <a 
                      href={auction.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View Video →
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Winner Response Section */}
            {isWinner && isEnded && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎉 Congratulations!</h3>
                <p className="text-gray-600 mb-4">You won this auction!</p>
                
                {auction.winner_response === 'pending' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 mb-4">
                      Please accept or decline this win within 48 hours.
                    </p>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleWinnerResponse('accept')}
                        disabled={winnerAction === 'accept'}
                        className="btn-primary w-full disabled:opacity-50"
                      >
                        {winnerAction === 'accept' ? 'Processing...' : `Accept & Pay $${currentPrice.toFixed(2)}`}
                      </button>
                      <button
                        onClick={() => handleWinnerResponse('decline')}
                        disabled={winnerAction === 'decline'}
                        className="btn-secondary w-full disabled:opacity-50"
                      >
                        {winnerAction === 'decline' ? 'Processing...' : 'Decline'}
                      </button>
                    </div>
                  </div>
                )}

                {auction.winner_response === 'accepted' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800">
                      ✅ Win accepted! {auction.payment_status === 'paid' ? 'Payment completed.' : 'Processing payment...'}
                    </p>
                  </div>
                )}

                {auction.winner_response === 'declined' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-800">You declined this win.</p>
                  </div>
                )}

                {auction.winner_response === 'payment_expired' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">Payment expired. The win has been forfeited.</p>
                  </div>
                )}
              </div>
            )}

            {/* Price & Bidding */}
            <div className="card p-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 mb-1">
                  {isEnded ? 'Final Price' : 'Current Bid'}
                </p>
                <p className="text-3xl font-bold text-gray-900">${currentPrice.toFixed(2)}</p>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''}</span>
                  <span>
                    {isEnded ? 'Ended' : formatTimeRemaining(auction.end_time)}
                  </span>
                </div>
              </div>

              {/* Bidding Form */}
              {isActive && !isOwner && (
                <div className="space-y-3">
                  <form onSubmit={handleBid} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Bid (min: ${(Math.max(currentPrice, startingPrice) + 0.01).toFixed(2)})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min={Math.max(currentPrice, startingPrice) + 0.01}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          disabled={bidding}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={bidding}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg"
                    >
                      {bidding ? 'Placing...' : 'Place Bid'}
                    </button>
                  </form>
                  
                  {bidError && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-red-600 text-sm">{bidError}</p>
                    </div>
                  )}

                  {buyNowPrice > 0 && (
                    <button 
                      onClick={handleBuyNow}
                      disabled={buyingNow}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg"
                    >
                      {buyingNow ? 'Processing...' : `Buy Now $${buyNowPrice.toFixed(2)}`}
                    </button>
                  )}
                </div>
              )}

              {!isActive && !isWinner && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-gray-600 text-sm">
                    {isEnded ? 'Auction ended' : 'Not active'}
                  </p>
                </div>
              )}

              {/* Owner Actions */}
              {isOwner && (
                <div className="mt-4 space-y-2">
                  <Link 
                    href={`/creator/auctions/${auction.id}/edit`}
                    className="btn-secondary w-full text-center block"
                  >
                    Edit Auction
                  </Link>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    Delete Auction
                  </button>
                </div>
              )}
            </div>

            {/* Auction Info */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Auction Details</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Starting Price:</span>
                  <span className="font-semibold">${startingPrice.toFixed(2)}</span>
                </div>
                
                {reservePrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reserve Price:</span>
                    <span className="font-semibold">${reservePrice.toFixed(2)}</span>
                  </div>
                )}
                
                {buyNowPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buy Now Price:</span>
                    <span className="font-semibold">${buyNowPrice.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Ends:</span>
                  <span className="font-semibold">
                    {new Date(auction.end_time).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Delete &quot;{auction.title}&quot;? This cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg flex-1"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
