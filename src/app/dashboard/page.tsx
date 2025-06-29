'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AuctionItem {
  id: string;
  title: string;
  description: string;
  current_price: number | string;
  status: string;
  end_time: string;
  created_at: string;
  bid_count?: number;
  image_url?: string;
  primary_image?: string;
}

interface PurchasedItem {
  id: string;
  final_price: number | string;
  payment_status: string;
  shipping_status: string;
  created_at: string;
  purchase_type: string;
  auction_id: string;
  auction_title: string;
  description: string;
  condition: string;
  seller_username: string;
  seller_display_name?: string;
  seller_verified: boolean;
  image_url?: string;
  primary_image?: string;
  title?: string;
}

interface SoldItem {
  id: string;
  final_price: number | string;
  payment_status: string;
  shipping_status: string;
  created_at: string;
  purchase_type: string;
  auction_id: string;
  auction_title: string;
  description: string;
  condition: string;
  buyer_username: string;
  buyer_display_name?: string;
  buyer_email: string;
  image_url?: string;
  primary_image?: string;
  transaction_fee?: number | string;
  title?: string;
}

interface SalesStats {
  total_sales: number;
  total_revenue: number | string;
  total_fees: number | string;
  net_revenue: number | string;
}

// Union type for all possible item types
type DashboardItem = AuctionItem | PurchasedItem | SoldItem;

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userAuctions, setUserAuctions] = useState<AuctionItem[]>([]);
  const [watchlist, setWatchlist] = useState<AuctionItem[]>([]);
  const [purchases, setPurchases] = useState<PurchasedItem[]>([]);
  const [sales, setSales] = useState<SoldItem[]>([]);
  const [salesStats, setSalesStats] = useState<SalesStats>({
    total_sales: 0,
    total_revenue: 0,
    total_fees: 0,
    net_revenue: 0
  });
  const [loadingData, setLoadingData] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingData(true);
      if (user?.is_creator) {
        const [auctionsRes, salesRes] = await Promise.all([
          fetch('/api/auctions/my-auctions'),
          fetch('/api/transactions/my-sales')
        ]);

        if (auctionsRes.ok) {
          const auctionsData = await auctionsRes.json();
          console.log('Auctions data:', auctionsData); // Debug log
          setUserAuctions(auctionsData.auctions || []);
        } else {
          console.error('Failed to fetch auctions:', await auctionsRes.text());
        }

        if (salesRes.ok) {
          const salesData = await salesRes.json();
          setSales(salesData.sales || []);
          setSalesStats(salesData.stats || {
            total_sales: 0,
            total_revenue: 0,
            total_fees: 0,
            net_revenue: 0
          });
        }
      } else {
        const [watchlistRes, purchasesRes] = await Promise.all([
          fetch('/api/auctions/watchlist'),
          fetch('/api/transactions/my-purchases')
        ]);

        if (watchlistRes.ok) {
          const watchlistData = await watchlistRes.json();
          setWatchlist(watchlistData.auctions || []);
        }

        if (purchasesRes.ok) {
          const purchasesData = await purchasesRes.json();
          setPurchases(purchasesData.purchases || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  }, [user?.is_creator]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const handleDeleteAuction = async (auctionId: string) => {
    try {
      setDeletingId(auctionId);
      const response = await fetch(`/api/auctions/${auctionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUserAuctions(prev => prev.filter(auction => auction.id !== auctionId));
        setShowDeleteConfirm(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete auction');
      }
    } catch (error) {
      console.error('Failed to delete auction:', error);
      alert('Failed to delete auction');
    } finally {
      setDeletingId(null);
    }
  };

  const formatPrice = (price: number | string | null | undefined): string => {
    const numPrice = Number(price) || 0;
    return numPrice.toFixed(2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600 text-white border-green-500';
      case 'ended':
        return 'bg-zinc-700 text-zinc-100 border-zinc-600';
      case 'shipped':
        return 'bg-violet-600 text-white border-violet-500';
      case 'delivered':
        return 'bg-emerald-600 text-white border-emerald-500';
      case 'pending':
        return 'bg-amber-600 text-white border-amber-500';
      default:
        return 'bg-zinc-600 text-white border-zinc-500';
    }
  };

  // Helper function to get item ID
  const getItemId = (item: DashboardItem): string => {
    if ('id' in item && item.id) return item.id;
    if ('auction_id' in item && item.auction_id) return item.auction_id;
    return 'unknown';
  };

  // Helper function to get item title
  const getItemTitle = (item: DashboardItem): string => {
    if ('title' in item && item.title) return item.title;
    if ('auction_title' in item && item.auction_title) return item.auction_title;
    return 'unknown';
  };

  // Improved image URL helper with better debugging
  const getImageUrl = (item: DashboardItem): string | null => {
    // Check for primary_image first (preferred)
    const imageUrl = item.primary_image || item.image_url;
    
    if (!imageUrl) {
      console.log('No image URL found for item:', {
        id: getItemId(item),
        title: getItemTitle(item),
        primary_image: item.primary_image,
        image_url: item.image_url
      });
      return null;
    }
    
    console.log('Image URL found:', imageUrl); // Debug log
    
    // Handle relative URLs - ensure they start with /
    if (imageUrl.startsWith('/')) {
      return imageUrl;
    }
    
    // Handle full URLs
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Handle uploads path - ensure proper formatting
    if (imageUrl.includes('uploads/')) {
      const cleanUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
      return cleanUrl;
    }
    
    // Default case - add leading slash if missing
    return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  };

  // Better image component with improved error handling
  const ItemImage = ({ item, size = 64, className = "" }: { 
    item: DashboardItem; 
    size?: number; 
    className?: string; 
  }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const imageUrl = getImageUrl(item);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      console.error('Image failed to load:', {
        url: imageUrl,
        error: e,
        item: {
          id: getItemId(item),
          title: getItemTitle(item)
        }
      });
      setImageError(true);
      setImageLoading(false);
    };

    const handleLoad = () => {
      console.log('Image loaded successfully:', imageUrl);
      setImageLoading(false);
      setImageError(false);
    };

    const getTitle = (item: DashboardItem): string => {
      return getItemTitle(item);
    };

    if (!imageUrl || imageError) {
      return (
        <div className={`bg-zinc-800 border border-zinc-700 flex items-center justify-center ${className}`}>
          <div className="flex flex-col items-center justify-center p-2">
            <div className="w-4 h-4 border border-zinc-600 rounded mb-1"></div>
            <div className="text-[10px] text-zinc-500 font-mono text-center">
              {!imageUrl ? 'NO IMG' : 'FAILED'}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative overflow-hidden bg-zinc-900 ${className}`}>
        {imageLoading && (
          <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center z-10">
            <div className="w-3 h-3 border border-zinc-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <Image
          src={imageUrl}
          alt={getTitle(item)}
          fill
          className="object-cover"
          onError={handleError}
          onLoad={handleLoad}
          sizes={`${size}px`}
          unoptimized={false} // Allow Next.js optimization
        />
      </div>
    );
  };

  // Calculate active auctions count properly
  const activeAuctionsCount = userAuctions.filter(auction => {
    const now = new Date();
    const endTime = new Date(auction.end_time);
    return auction.status === 'active' && endTime > now;
  }).length;

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-2 border-red-400/20 rounded-full animate-ping"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Geometric Accent Lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-32 left-0 w-64 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
        <div className="absolute top-48 right-0 w-48 h-px bg-gradient-to-l from-transparent via-red-400/20 to-transparent"></div>
        <div className="absolute bottom-1/3 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-violet-500/20 to-transparent"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-16">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-1 h-16 bg-violet-400"></div>
                <div>
                  <h1 className="text-5xl font-black text-white tracking-tight">
                    {user?.display_name || user?.username}
                  </h1>
                  <p className="text-sm text-zinc-400 font-mono uppercase tracking-[0.2em] mt-2">
                    {user?.is_creator ? 'CREATOR INTERFACE' : 'COLLECTOR INTERFACE'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500 font-mono mb-1">SYSTEM STATUS</div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-zinc-300 font-mono">ONLINE</span>
              </div>
            </div>
          </div>
        </header>

        {user?.is_creator ? (
          // CREATOR DASHBOARD
          <div className="space-y-16">
            {/* Performance Grid */}
            <section>
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-8 h-px bg-violet-400"></div>
                <h2 className="text-2xl font-bold text-white">PERFORMANCE METRICS</h2>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent rounded-lg"></div>
                  <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-lg p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-3 h-3 bg-violet-400 rounded-full"></div>
                      <div className="text-xs text-zinc-500 font-mono">SALES</div>
                    </div>
                    <div className="text-3xl font-black text-white mb-1">{salesStats.total_sales}</div>
                    <div className="text-xs text-zinc-400 font-mono">TOTAL TRANSACTIONS</div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-lg"></div>
                  <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-lg p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <div className="text-xs text-zinc-500 font-mono">REVENUE</div>
                    </div>
                    <div className="text-3xl font-black text-white mb-1">${formatPrice(salesStats.total_revenue)}</div>
                    <div className="text-xs text-zinc-400 font-mono">GROSS EARNINGS</div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent rounded-lg"></div>
                  <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-lg p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="text-xs text-zinc-500 font-mono">FEES</div>
                    </div>
                    <div className="text-3xl font-black text-red-400 mb-1">${formatPrice(salesStats.total_fees)}</div>
                    <div className="text-xs text-zinc-400 font-mono">PLATFORM DEDUCTION</div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-lg"></div>
                  <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-lg p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                      <div className="text-xs text-zinc-500 font-mono">NET</div>
                    </div>
                    <div className="text-3xl font-black text-emerald-400 mb-1">${formatPrice(salesStats.net_revenue)}</div>
                    <div className="text-xs text-zinc-400 font-mono">NET PROFIT</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Active Auctions - IMPROVED LAYOUT */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-px bg-violet-400"></div>
                  <h2 className="text-2xl font-bold text-white">MY AUCTIONS</h2>
                  <div className="px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded text-xs font-mono text-violet-300">
                    {userAuctions.length} TOTAL
                  </div>
                  {activeAuctionsCount > 0 && (
                    <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs font-mono text-green-300">
                      {activeAuctionsCount} ACTIVE
                    </div>
                  )}
                </div>
                <Link 
                  href="/creator/create-auction"
                  className="group relative overflow-hidden bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-violet-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative">CREATE NEW</span>
                </Link>
              </div>

              {loadingData ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
                  <div className="relative w-8 h-8 mx-auto mb-4">
                    <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-zinc-400 font-mono text-sm">Loading data...</p>
                </div>
              ) : userAuctions.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="w-8 h-8 border-2 border-zinc-600 rounded-full"></div>
                  </div>
                  <p className="text-zinc-300 text-lg mb-4 font-medium">No auctions found</p>
                  <p className="text-zinc-500 text-sm mb-6 font-mono">Create your first auction</p>
                  <Link 
                    href="/creator/create-auction"
                    className="inline-flex items-center text-violet-400 hover:text-violet-300 font-mono text-sm"
                  >
                    Create Auction →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userAuctions.map((auction, index) => {
                    const now = new Date();
                    const endTime = new Date(auction.end_time);
                    const isActive = auction.status === 'active' && endTime > now;
                    const isExpired = auction.status === 'active' && endTime <= now;
                    const isPending = auction.status === 'pending';
                    
                    return (
                      <div key={auction.id} className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-lg p-6 backdrop-blur-sm">
                          {/* IMPROVED GRID LAYOUT */}
                          <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Index + Image */}
                            <div className="col-span-1 flex items-center justify-center">
                              <div className="text-xs text-zinc-500 font-mono">
                                {String(index + 1).padStart(2, '0')}
                              </div>
                            </div>
                            
                            <div className="col-span-1">
                              <ItemImage 
                                item={auction}
                                size={64}
                                className="w-16 h-16 rounded-lg"
                              />
                            </div>
                            
                            {/* Title - Fixed width to prevent shifting */}
                            <div className="col-span-4">
                              <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
                                {auction.title}
                              </h3>
                            </div>
                            
                            {/* Stats - Fixed width columns */}
                            <div className="col-span-1 text-center">
                              <div className="text-xs text-zinc-500 font-mono mb-1">BID</div>
                              <div className="text-white font-mono text-sm">${formatPrice(auction.current_price)}</div>
                            </div>
                            
                            <div className="col-span-1 text-center">
                              <div className="text-xs text-zinc-500 font-mono mb-1">BIDS</div>
                              <div className="text-white font-mono text-sm">{auction.bid_count || 0}</div>
                            </div>
                            
                            <div className="col-span-1 text-center">
                              <div className="text-xs text-zinc-500 font-mono mb-1">ENDS</div>
                              <div className="text-white font-mono text-xs">
                                {new Date(auction.end_time).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </div>
                            
                            <div className="col-span-1 flex justify-center">
                              <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-mono ${
                                isActive ? 'bg-green-600 text-white' :
                                isExpired ? 'bg-amber-600 text-white' :
                                getStatusColor(auction.status)
                              }`}>
                                {isActive ? 'ACTIVE' : isExpired ? 'EXPIRED' : auction.status.toUpperCase()}
                              </div>
                            </div>
                            
                            {/* Actions - Fixed width */}
                            <div className="col-span-2 flex items-center justify-end space-x-3">
                              <Link 
                                href={`/auctions/${auction.id}`}
                                className="text-xs text-zinc-400 hover:text-white font-mono transition-colors"
                              >
                                VIEW
                              </Link>
                              {(isActive || isPending) && (
                                <>
                                  <div className="w-px h-4 bg-zinc-700"></div>
                                  <Link 
                                    href={`/creator/auctions/${auction.id}/edit`}
                                    className="text-xs text-zinc-400 hover:text-white font-mono transition-colors"
                                  >
                                    EDIT
                                  </Link>
                                  <button
                                    onClick={() => setShowDeleteConfirm(auction.id)}
                                    className="text-xs text-red-400 hover:text-red-300 font-mono transition-colors"
                                    disabled={deletingId === auction.id}
                                  >
                                    {deletingId === auction.id ? 'DEL...' : 'DELETE'}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {showDeleteConfirm === auction.id && (
                            <div className="mt-6 p-4 bg-red-950/50 border border-red-800/50 rounded-lg">
                              <p className="text-red-200 mb-4 font-mono text-sm">Confirm deletion - This action is irreversible</p>
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleDeleteAuction(auction.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-mono text-xs transition-colors"
                                  disabled={deletingId === auction.id}
                                >
                                  {deletingId === auction.id ? 'DELETING...' : 'CONFIRM'}
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded font-mono text-xs transition-colors"
                                >
                                  CANCEL
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Sales History - IMPROVED LAYOUT */}
            <section>
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-8 h-px bg-violet-400"></div>
                <h2 className="text-2xl font-bold text-white">SALES HISTORY</h2>
                <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-mono text-emerald-300">
                  {sales.length}
                </div>
              </div>
              
              {sales.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="w-8 h-8 border-2 border-zinc-600 rounded-full"></div>
                  </div>
                  <p className="text-zinc-400 font-mono text-sm">No sales recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sales.slice(0, 5).map((sale, index) => (
                    <div key={sale.id} className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 backdrop-blur-sm">
                      {/* IMPROVED SALES GRID */}
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-1 flex items-center justify-center">
                          <div className="text-xs text-zinc-500 font-mono">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                        </div>
                        
                        <div className="col-span-1">
                          <ItemImage 
                            item={sale}
                            size={48}
                            className="w-12 h-12 rounded"
                          />
                        </div>
                        
                        <div className="col-span-5">
                          <h4 className="text-white font-medium leading-tight line-clamp-1">{sale.auction_title}</h4>
                          <p className="text-xs text-zinc-400 font-mono">
                            BUYER: {sale.buyer_display_name || sale.buyer_username}
                          </p>
                        </div>
                        
                        <div className="col-span-2 text-center">
                          <div className="text-xs text-zinc-500 font-mono mb-1">FINAL PRICE</div>
                          <div className="text-emerald-400 font-mono text-lg">${formatPrice(sale.final_price)}</div>
                        </div>
                        
                        <div className="col-span-2 text-center">
                          <div className="text-xs text-zinc-500 font-mono mb-1">DATE</div>
                          <div className="text-zinc-300 font-mono text-sm">
                            {new Date(sale.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        
                        <div className="col-span-1 flex justify-center">
                          <div className={`px-2 py-1 rounded text-xs font-mono ${getStatusColor(sale.shipping_status)}`}>
                            {sale.shipping_status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          // COLLECTOR DASHBOARD
          <div className="space-y-16">
            {/* Watchlist */}
            <section>
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-8 h-px bg-violet-400"></div>
                <h2 className="text-2xl font-bold text-white">WATCHLIST</h2>
                <div className="px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded text-xs font-mono text-violet-300">
                  {watchlist.length}
                </div>
              </div>
              
              {loadingData ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
                  <div className="relative w-8 h-8 mx-auto mb-4">
                    <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-zinc-400 font-mono text-sm">Loading watchlist...</p>
                </div>
              ) : watchlist.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="w-8 h-8 border-2 border-zinc-600 rounded-full"></div>
                  </div>
                  <p className="text-zinc-300 text-lg mb-4 font-medium">Watchlist empty</p>
                  <p className="text-zinc-500 text-sm mb-6 font-mono">Discover auctions</p>
                  <Link 
                    href="/auctions"
                    className="inline-flex items-center text-violet-400 hover:text-violet-300 font-mono text-sm"
                  >
                    Browse Auctions →
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {watchlist.map((auction, index) => (
                    <div key={auction.id} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-lg p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-4">
                              <div className="text-xs text-zinc-500 font-mono w-8">
                                {String(index + 1).padStart(2, '0')}
                              </div>
                              <ItemImage 
                                item={auction}
                                size={64}
                                className="w-16 h-16 rounded-lg flex-shrink-0"
                              />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-white mb-2">{auction.title}</h3>
                              <div className="grid grid-cols-3 gap-8 text-sm">
                                <div>
                                  <div className="text-xs text-zinc-500 font-mono mb-1">CURRENT BID</div>
                                  <div className="text-white font-mono">${formatPrice(auction.current_price)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-zinc-500 font-mono mb-1">ENDS</div>
                                  <div className="text-white font-mono text-sm">
                                    {new Date(auction.end_time).toLocaleDateString()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-zinc-500 font-mono mb-1">STATUS</div>
                                  <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-mono ${getStatusColor(auction.status)}`}>
                                    {auction.status.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Link 
                            href={`/auctions/${auction.id}`}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-mono text-xs transition-colors transform hover:scale-105"
                          >
                            VIEW AUCTION
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Purchase History */}
            <section>
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-8 h-px bg-violet-400"></div>
                <h2 className="text-2xl font-bold text-white">PURCHASE HISTORY</h2>
                <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-mono text-emerald-300">
                  {purchases.length}
                </div>
              </div>
              
              {purchases.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="w-8 h-8 border-2 border-zinc-600 rounded-full"></div>
                  </div>
                  <p className="text-zinc-400 font-mono text-sm">No purchases recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchases.map((purchase, index) => (
                    <div key={purchase.id} className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-xs text-zinc-500 font-mono w-8">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          <ItemImage 
                            item={purchase}
                            size={48}
                            className="w-12 h-12 rounded"
                          />
                          <div>
                            <h4 className="text-white font-medium">{purchase.auction_title}</h4>
                            <p className="text-xs text-zinc-400 font-mono">
                              FROM: {purchase.seller_display_name || purchase.seller_username}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-8">
                          <div className="text-right">
                            <div className="text-xs text-zinc-500 font-mono">PAID</div>
                            <div className="text-white font-mono text-lg">${formatPrice(purchase.final_price)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-zinc-500 font-mono">DATE</div>
                            <div className="text-zinc-300 font-mono text-sm">
                              {new Date(purchase.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-mono ${getStatusColor(purchase.shipping_status)}`}>
                            {purchase.shipping_status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
