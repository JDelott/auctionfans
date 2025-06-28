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

  // Helper function to safely convert to number
  const toNumber = (value: number | string | undefined | null): number => {
    if (value === null || value === undefined) return 0;
    return typeof value === 'string' ? parseFloat(value) || 0 : value;
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

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setBidError('');
    setBidding(true);

    try {
      const response = await fetch(`/api/auctions/${resolvedParams.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(bidAmount) })
      });

      if (response.ok) {
        await fetchAuction(); // Refresh auction data
        const startingPrice = toNumber(auction?.starting_price);
        const newMinBid = Math.max(parseFloat(bidAmount), startingPrice) + 0.01;
        setBidAmount(newMinBid.toFixed(2));
      } else {
        const errorData = await response.json();
        setBidError(errorData.error);
      }
    } catch {
      setBidError('Failed to place bid');
    } finally {
      setBidding(false);
    }
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

  const getVideoEmbedUrl = (url: string, timestamp?: number) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}${timestamp ? `?start=${timestamp}` : ''}`;
    }
    return url;
  };

  const handleDeleteAuction = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/auctions/${resolvedParams.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard?deleted=true');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete auction');
      }
    } catch (error) {
      console.error('Failed to delete auction:', error);
      alert('Failed to delete auction');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/auctions" className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Auctions
          </Link>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            auction.status === 'active' ? 'bg-green-100 text-green-800' :
            auction.status === 'ended' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {auction.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Images & Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-[4/3] bg-gray-100 relative">
                {auction.images.length > 0 ? (
                  <Image
                    src={auction.images[selectedImage]?.image_url}
                    alt={auction.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 66vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">No image</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {auction.images.length > 1 && (
                <div className="p-3 border-t bg-gray-50">
                  <div className="flex space-x-2 overflow-x-auto">
                    {auction.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 ${
                          selectedImage === index ? 'border-indigo-500' : 'border-gray-200'
                        }`}
                      >
                        <Image
                          src={image.image_url}
                          alt={`View ${index + 1}`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Title & Creator */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h1 className="text-xl font-bold text-gray-900 mb-3">{auction.title}</h1>
              
              <Link 
                href={`/creators/${auction.username}`}
                className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                {auction.profile_image_url ? (
                  <Image
                    src={auction.profile_image_url}
                    alt={auction.display_name || auction.username}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {(auction.display_name || auction.username).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{auction.display_name || auction.username}</p>
                  {auction.is_verified && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Verified</span>
                  )}
                </div>
              </Link>
            </div>

            {/* Details */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Condition</p>
                  <p className="font-medium capitalize">{auction.condition}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Starting</p>
                  <p className="font-medium">${startingPrice.toFixed(2)}</p>
                </div>
                {auction.category_name && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Category</p>
                    <p className="font-medium text-sm">{auction.category_name}</p>
                  </div>
                )}
              </div>
              
              {auction.description && auction.description !== 'NA' && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Description</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{auction.description}</p>
                </div>
              )}
            </div>

            {/* Video */}
            {auction.video_url && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-medium text-gray-900 mb-3">Video</h3>
                <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                  <iframe
                    src={getVideoEmbedUrl(auction.video_url, auction.video_timestamp)}
                    title="Product video"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Bidding */}
          <div className="space-y-4">
            {/* Price & Bidding */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 mb-1">Current Bid</p>
                <p className="text-3xl font-bold text-gray-900">${currentPrice.toFixed(2)}</p>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{auction.bid_count} bids</span>
                  <span>{formatTimeRemaining(auction.end_time)}</span>
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
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg">
                      Buy Now ${buyNowPrice.toFixed(2)}
                    </button>
                  )}
                </div>
              )}

              {!isActive && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-gray-600 text-sm">
                    {auction.status === 'ended' ? 'Auction ended' : 'Not active'}
                  </p>
                </div>
              )}

              {/* Owner Actions */}
              {isOwner && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-blue-800 font-medium text-sm mb-2">Your Auction</p>
                  <div className="flex space-x-2">
                    <Link 
                      href={`/creator/auctions/${auction.id}/edit`}
                      className="flex-1 text-center py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Edit
                    </Link>
                    {(auction.status === 'pending' || auction.status === 'active') && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex-1 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Bids */}
            {auction.recent_bids.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-medium text-gray-900 mb-3">Recent Bids</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {auction.recent_bids.slice(0, 8).map((bid, index) => (
                    <div key={bid.id} className="flex justify-between items-center text-sm py-1">
                      <div>
                        <p className="font-medium">{bid.display_name || bid.username}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(bid.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <p className={`font-semibold ${index === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        ${toNumber(bid.amount).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold mb-2">Delete Auction</h3>
              <p className="text-gray-600 mb-4">
                Delete &quot;{auction.title}&quot;? This cannot be undone.
              </p>
              
              {auction.status === 'active' && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                  <p className="text-red-800 text-sm font-medium">Warning: Active auction with {auction.bid_count} bids!</p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAuction}
                  disabled={deleting}
                  className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
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
