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
  transaction_fee?: number | string;
}

interface SalesStats {
  total_sales: number;
  total_revenue: number | string;
  total_fees: number | string;
  net_revenue: number | string;
}

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
      if (user?.is_creator) {
        const [auctionsRes, salesRes] = await Promise.all([
          fetch('/api/auctions/my-auctions'),
          fetch('/api/transactions/my-sales')
        ]);

        if (auctionsRes.ok) {
          const auctionsData = await auctionsRes.json();
          setUserAuctions(auctionsData.auctions || []);
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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="mb-16">
          <div className="w-16 h-1 bg-gradient-to-r from-violet-500 to-red-500 mb-6"></div>
          <h1 className="text-5xl font-black text-white mb-3">
            {user.display_name || user.username}
          </h1>
          <p className="text-xl text-zinc-300 font-mono uppercase tracking-wider">
            {user.is_creator ? 'CREATOR DASHBOARD' : 'COLLECTOR DASHBOARD'}
          </p>
        </div>

        {user.is_creator ? (
          // CREATOR DASHBOARD
          <>
            {/* Creator Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
              <div className="bg-zinc-900 border border-zinc-800 p-8 text-center">
                <div className="w-12 h-12 bg-violet-500 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Total Revenue</p>
                <p className="text-3xl font-black text-violet-400">${formatPrice(salesStats.total_revenue)}</p>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 p-8 text-center">
                <div className="w-12 h-12 bg-red-500 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5zM6 9a1 1 0 112 0 1 1 0 01-2 0zm6 0a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Items Sold</p>
                <p className="text-3xl font-black text-red-400">{salesStats.total_sales}</p>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 p-8 text-center">
                <div className="w-12 h-12 bg-white mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Active Auctions</p>
                <p className="text-3xl font-black text-white">
                  {userAuctions.filter(a => a.status === 'active').length}
                </p>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 p-8 text-center">
                <div className="w-12 h-12 bg-violet-500 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Net Earnings</p>
                <p className="text-3xl font-black text-violet-400">${formatPrice(salesStats.net_revenue)}</p>
              </div>
            </div>

            {/* Creator Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <Link 
                href="/creator/create-auction"
                className="bg-zinc-900 border border-zinc-800 p-8 hover:border-violet-500 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-violet-500 mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">CREATE NEW AUCTION</h3>
                <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider">List a new item from your content</p>
              </Link>
              
              <Link 
                href="/profile"
                className="bg-zinc-900 border border-zinc-800 p-8 hover:border-red-500 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-red-500 mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">CREATOR PROFILE</h3>
                <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider">Manage your creator profile and settings</p>
              </Link>
              
              <Link 
                href="/auctions"
                className="bg-zinc-900 border border-zinc-800 p-8 hover:border-white hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-white mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">BROWSE MARKET</h3>
                <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider">See what other creators are selling</p>
              </Link>
            </div>

            {/* Creator Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* My Auctions */}
              <div className="bg-zinc-900 border border-zinc-800">
                <div className="px-8 py-6 border-b border-zinc-800 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">MY AUCTIONS</h2>
                    <Link href="/creator/create-auction" className="text-violet-400 hover:text-violet-300 text-sm font-mono uppercase tracking-wider">
                      + NEW
                    </Link>
                  </div>
                </div>
                <div className="p-8">
                  {loadingData ? (
                    <div className="text-center py-12">
                      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : userAuctions.length > 0 ? (
                    <div className="space-y-6">
                      {userAuctions.slice(0, 4).map((auction) => (
                        <div key={auction.id} className="border border-zinc-800 p-6 hover:border-zinc-700 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-white mb-4">{auction.title}</h3>
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Current Price</p>
                                  <p className="text-xl font-black text-violet-400">
                                    ${formatPrice(auction.current_price)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Bids</p>
                                  <p className="text-xl font-black text-white">
                                    {auction.bid_count || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Status</p>
                                  <span className={`inline-block px-2 py-1 text-xs font-mono font-bold uppercase tracking-wider ${getStatusColor(auction.status)}`}>
                                    {auction.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-3 ml-6">
                              <Link 
                                href={`/auctions/${auction.id}`}
                                className="bg-zinc-800 border border-zinc-700 text-white font-mono text-xs px-4 py-2 hover:border-violet-500 transition-colors uppercase tracking-wider"
                              >
                                VIEW
                              </Link>
                              {(auction.status === 'draft' || auction.status === 'pending') && (
                                <button
                                  onClick={() => setShowDeleteConfirm(auction.id)}
                                  disabled={deletingId === auction.id}
                                  className="bg-red-500 text-white font-mono text-xs px-4 py-2 hover:bg-red-600 transition-colors disabled:opacity-50 uppercase tracking-wider"
                                >
                                  {deletingId === auction.id ? 'DELETING...' : 'DELETE'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-zinc-800 mx-auto mb-6 flex items-center justify-center">
                        <div className="w-6 h-6 bg-zinc-600 rounded"></div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">NO AUCTIONS YET</h3>
                      <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider mb-8">Start selling items from your content</p>
                      <Link 
                        href="/creator/create-auction"
                        className="bg-violet-500 text-white font-bold px-8 py-4 hover:bg-violet-600 transition-colors text-sm tracking-wider uppercase"
                      >
                        CREATE FIRST AUCTION
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Sales History */}
              <div className="bg-zinc-900 border border-zinc-800">
                <div className="px-8 py-6 border-b border-zinc-800 bg-gradient-to-r from-red-500/10 to-orange-500/10">
                  <h2 className="text-2xl font-bold text-white">RECENT SALES</h2>
                </div>
                <div className="p-8">
                  {loadingData ? (
                    <div className="text-center py-12">
                      <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : sales.length > 0 ? (
                    <div className="space-y-6">
                      {sales.slice(0, 4).map((sale) => (
                        <div key={sale.id} className="border border-zinc-800 p-6 hover:border-zinc-700 transition-colors">
                          <div className="flex items-start gap-4">
                            {sale.image_url && (
                              <div className="w-16 h-16 bg-zinc-800 flex-shrink-0 overflow-hidden">
                                <Image
                                  src={sale.image_url || '/placeholder-auction.jpg'}
                                  alt={sale.auction_title}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-white mb-2 truncate">
                                {sale.auction_title}
                              </h3>
                              <p className="text-sm text-zinc-400 font-mono mb-4">
                                SOLD TO @{sale.buyer_username}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                  <div>
                                    <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Sale Price</p>
                                    <p className="text-lg font-black text-red-400">
                                      ${formatPrice(sale.final_price)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Status</p>
                                    <span className={`inline-block px-2 py-1 text-xs font-mono font-bold uppercase tracking-wider ${getStatusColor(sale.shipping_status)}`}>
                                      {sale.shipping_status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-zinc-500 font-mono mt-3">
                                SOLD {new Date(sale.created_at).toLocaleDateString().toUpperCase()}
                                {sale.purchase_type === 'buy_now' && (
                                  <span className="ml-3 px-2 py-1 bg-green-500 text-white text-xs font-bold uppercase tracking-wider">
                                    BUY NOW
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-red-500/20 mx-auto mb-6 flex items-center justify-center">
                        <div className="w-6 h-6 bg-red-400 rounded"></div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">NO SALES YET</h3>
                      <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider mb-8">Start creating auctions to make your first sale</p>
                      <Link 
                        href="/creator/create-auction"
                        className="bg-red-500 text-white font-bold px-8 py-4 hover:bg-red-600 transition-colors text-sm tracking-wider uppercase"
                      >
                        CREATE AUCTION
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          // COLLECTOR DASHBOARD
          <>
            {/* Collector Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <Link 
                href="/auctions"
                className="bg-zinc-900 border border-zinc-800 p-8 hover:border-violet-500 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-violet-500 mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">BROWSE AUCTIONS</h3>
                <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider">Discover items from verified creators</p>
              </Link>
              
              <Link 
                href="/creators"
                className="bg-zinc-900 border border-zinc-800 p-8 hover:border-red-500 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-red-500 mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">DISCOVER CREATORS</h3>
                <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider">Follow your favorite content creators</p>
              </Link>
              
              <Link 
                href="/profile"
                className="bg-zinc-900 border border-zinc-800 p-8 hover:border-white hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-white mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">ACCOUNT SETTINGS</h3>
                <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider">Manage your profile and preferences</p>
              </Link>
            </div>

            {/* Collector Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Purchase History */}
              <div className="bg-zinc-900 border border-zinc-800">
                <div className="px-8 py-6 border-b border-zinc-800 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                  <h2 className="text-2xl font-bold text-white">PURCHASE HISTORY</h2>
                </div>
                <div className="p-8">
                  {loadingData ? (
                    <div className="text-center py-12">
                      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : purchases.length > 0 ? (
                    <div className="space-y-6">
                      {purchases.slice(0, 3).map((purchase) => (
                        <div key={purchase.id} className="border border-zinc-800 p-6 hover:border-zinc-700 transition-colors">
                          <div className="flex items-start gap-4">
                            {purchase.image_url && (
                              <div className="w-16 h-16 bg-zinc-800 flex-shrink-0 overflow-hidden">
                                <Image
                                  src={purchase.image_url || '/placeholder-auction.jpg'}
                                  alt={purchase.auction_title}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-white mb-2 truncate">
                                {purchase.auction_title}
                              </h3>
                              <p className="text-sm text-zinc-400 font-mono mb-4">
                                BY @{purchase.seller_username}
                                {purchase.seller_verified && <span className="text-violet-400 ml-2">✓</span>}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                  <div>
                                    <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Paid</p>
                                    <p className="text-lg font-black text-violet-400">
                                      ${formatPrice(purchase.final_price)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Status</p>
                                    <span className={`inline-block px-2 py-1 text-xs font-mono font-bold uppercase tracking-wider ${getStatusColor(purchase.shipping_status)}`}>
                                      {purchase.shipping_status}
                                    </span>
                                  </div>
                                </div>
                                <Link 
                                  href={`/auctions/${purchase.auction_id}`}
                                  className="bg-zinc-800 border border-zinc-700 text-white font-mono text-xs px-4 py-2 hover:border-violet-500 transition-colors uppercase tracking-wider"
                                >
                                  VIEW
                                </Link>
                              </div>
                              <p className="text-xs text-zinc-500 font-mono mt-3">
                                PURCHASED {new Date(purchase.created_at).toLocaleDateString().toUpperCase()}
                                {purchase.purchase_type === 'buy_now' && (
                                  <span className="ml-3 px-2 py-1 bg-green-500 text-white text-xs font-bold uppercase tracking-wider">
                                    BUY NOW
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-violet-500/20 mx-auto mb-6 flex items-center justify-center">
                        <div className="w-6 h-6 bg-violet-400 rounded"></div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">NO PURCHASES YET</h3>
                      <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider mb-8">Start bidding on items you love</p>
                      <Link 
                        href="/auctions"
                        className="bg-violet-500 text-white font-bold px-8 py-4 hover:bg-violet-600 transition-colors text-sm tracking-wider uppercase"
                      >
                        BROWSE AUCTIONS
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Watchlist */}
              <div className="bg-zinc-900 border border-zinc-800">
                <div className="px-8 py-6 border-b border-zinc-800 bg-gradient-to-r from-red-500/10 to-orange-500/10">
                  <h2 className="text-2xl font-bold text-white">WATCHLIST</h2>
                </div>
                <div className="p-8">
                  {loadingData ? (
                    <div className="text-center py-12">
                      <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : watchlist.length > 0 ? (
                    <div className="space-y-6">
                      {watchlist.slice(0, 3).map((auction) => (
                        <div key={auction.id} className="border-b border-zinc-800 pb-6 last:border-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-bold text-white mb-3">{auction.title}</h3>
                              <p className="text-2xl font-black text-red-400 mb-3">
                                ${formatPrice(auction.current_price)}
                              </p>
                              <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                                ENDS {new Date(auction.end_time).toLocaleDateString().toUpperCase()}
                              </p>
                            </div>
                            <Link 
                              href={`/auctions/${auction.id}`}
                              className="bg-zinc-800 border border-zinc-700 text-white font-mono text-xs px-4 py-2 hover:border-red-500 transition-colors uppercase tracking-wider"
                            >
                              VIEW
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-red-500/20 mx-auto mb-6 flex items-center justify-center">
                        <div className="w-6 h-6 bg-red-400 rounded"></div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">NO ITEMS WATCHED</h3>
                      <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider mb-8">Start following auctions you re interested in</p>
                      <Link 
                        href="/auctions"
                        className="bg-red-500 text-white font-bold px-8 py-4 hover:bg-red-600 transition-colors text-sm tracking-wider uppercase"
                      >
                        BROWSE AUCTIONS
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-800 p-8 max-w-md mx-4">
              <h3 className="text-2xl font-bold text-white mb-4">DELETE AUCTION</h3>
              <p className="text-zinc-300 mb-8 font-mono text-sm">
                Are you sure you want to delete this auction? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="bg-zinc-800 border border-zinc-700 text-white font-mono text-sm px-6 py-3 hover:border-zinc-600 transition-colors uppercase tracking-wider"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => handleDeleteAuction(showDeleteConfirm)}
                  disabled={deletingId === showDeleteConfirm}
                  className="bg-red-500 text-white font-mono text-sm px-6 py-3 hover:bg-red-600 transition-colors disabled:opacity-50 uppercase tracking-wider"
                >
                  {deletingId === showDeleteConfirm ? 'DELETING...' : 'DELETE'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
