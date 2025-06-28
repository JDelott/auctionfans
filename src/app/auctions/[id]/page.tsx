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

    if (diff <= 0) return 'Auction Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const getVideoEmbedUrl = (url: string, timestamp?: number) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}${timestamp ? `?start=${timestamp}` : ''}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-heading text-gray-900 mb-4">Auction Not Found</h1>
          <Link href="/auctions" className="btn-primary">
            Browse Auctions
          </Link>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/auctions" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Auctions
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Video */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
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
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">No image available</p>
                    </div>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    auction.status === 'active' ? 'bg-green-100 text-green-800' :
                    auction.status === 'ended' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {auction.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Image Thumbnails */}
              {auction.images.length > 1 && (
                <div className="p-4 border-t">
                  <div className="flex space-x-3 overflow-x-auto">
                    {auction.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImage === index 
                            ? 'border-indigo-500' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Image
                          src={image.image_url}
                          alt={`${auction.title} view ${index + 1}`}
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

            {/* Video Section */}
            {auction.video_url && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Video</h3>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <iframe
                      src={getVideoEmbedUrl(auction.video_url, auction.video_timestamp)}
                      title="Product video"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                  {auction.video_timestamp && (
                    <p className="text-sm text-gray-600 mt-3">
                      Starts at: {Math.floor(auction.video_timestamp / 60)}:{String(auction.video_timestamp % 60).padStart(2, '0')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Item Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">CONDITION</p>
                  <p className="text-gray-900 capitalize">{auction.condition}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">STARTING PRICE</p>
                  <p className="text-gray-900">${startingPrice.toFixed(2)}</p>
                </div>
                {auction.category_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">CATEGORY</p>
                    <p className="text-gray-900">{auction.category_name}</p>
                  </div>
                )}
              </div>
              
              {auction.description && auction.description !== 'NA' && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">DESCRIPTION</p>
                  <p className="text-gray-700 leading-relaxed">{auction.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Auction Info & Bidding */}
          <div className="space-y-6">
            {/* Main Auction Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{auction.title}</h1>
                
                {/* Creator Info */}
                <Link 
                  href={`/creators/${auction.username}`}
                  className="inline-flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {auction.profile_image_url ? (
                    <Image
                      src={auction.profile_image_url}
                      alt={auction.display_name || auction.username}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {(auction.display_name || auction.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{auction.display_name || auction.username}</p>
                    <div className="flex items-center space-x-2">
                      {auction.is_verified && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>

              {/* Current Price & Time */}
              <div className="border-t border-b py-6 my-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">CURRENT BID</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ${currentPrice.toFixed(2)}
                    </p>
                    {buyNowPrice > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Buy Now: ${buyNowPrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">TIME REMAINING</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatTimeRemaining(auction.end_time)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bidding Form */}
              {isActive && !isOwner && (
                <div className="space-y-4">
                  <form onSubmit={handleBid} className="space-y-4">
                    <div>
                      <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Bid (minimum: ${(Math.max(currentPrice, startingPrice) + 0.01).toFixed(2)})
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          id="bidAmount"
                          type="number"
                          step="0.01"
                          min={Math.max(currentPrice, startingPrice) + 0.01}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="block w-full pl-7 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0.00"
                          disabled={bidding}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={bidding}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                      {bidding ? 'Placing Bid...' : 'Place Bid'}
                    </button>
                  </form>
                  
                  {bidError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-600 text-sm">{bidError}</p>
                    </div>
                  )}

                  {/* Buy Now Button */}
                  {buyNowPrice > 0 && (
                    <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors">
                      Buy Now for ${buyNowPrice.toFixed(2)}
                    </button>
                  )}
                </div>
              )}

              {!isActive && (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600">
                    {auction.status === 'ended' ? 'This auction has ended' : 'This auction is not active'}
                  </p>
                </div>
              )}

              {isOwner && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-800 text-sm font-medium">This is your auction</p>
                </div>
              )}
            </div>

            {/* Recent Bids */}
            {auction.recent_bids.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bids</h3>
                <div className="space-y-3">
                  {auction.recent_bids.map((bid) => (
                    <div key={bid.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">
                          {bid.display_name || bid.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(bid.created_at).toLocaleDateString()} at {new Date(bid.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${toNumber(bid.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
