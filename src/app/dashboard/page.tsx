'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AuctionItem {
  id: string;
  title: string;
  description: string;
  current_price: number | string;
  status: string;
  end_time: string;
  created_at: string;
  bid_count?: number;
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
  primary_image?: string;
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
  primary_image?: string;
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

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (user?.is_creator) {
        // Creator dashboard data
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
          setSalesStats(salesData.stats || salesStats);
        }
      } else {
        // Customer dashboard data
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
  };

  const handleDeleteAuction = async (auctionId: string) => {
    try {
      setDeletingId(auctionId);
      const response = await fetch(`/api/auctions/${auctionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the auction from the local state
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="accent-bar w-16 mb-4"></div>
          <h1 className="text-heading text-gray-900 mb-2">
            {user.display_name || user.username}
          </h1>
          <p className="text-lg text-gray-600">
            {user.is_creator ? 'Creator Dashboard' : 'Collector Dashboard'}
          </p>
        </div>

        {user.is_creator ? (
          // CREATOR DASHBOARD
          <>
            {/* Creator Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="card p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-green-600 text-xl">💰</span>
                </div>
                <h3 className="text-sm text-gray-500 mb-1">Total Revenue</h3>
                <p className="text-2xl font-bold text-gray-900">${formatPrice(salesStats.total_revenue)}</p>
              </div>
              
              <div className="card p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📦</span>
                </div>
                <h3 className="text-sm text-gray-500 mb-1">Items Sold</h3>
                <p className="text-2xl font-bold text-gray-900">{salesStats.total_sales}</p>
              </div>
              
              <div className="card p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-purple-600 text-xl">📈</span>
                </div>
                <h3 className="text-sm text-gray-500 mb-1">Active Auctions</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {userAuctions.filter(a => a.status === 'active').length}
                </p>
              </div>
              
              <div className="card p-6 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-emerald-600 text-xl">💵</span>
                </div>
                <h3 className="text-sm text-gray-500 mb-1">Net Earnings</h3>
                <p className="text-2xl font-bold text-gray-900">${formatPrice(salesStats.net_revenue)}</p>
              </div>
            </div>

            {/* Creator Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Link 
                href="/creator/create-auction"
                className="card card-featured p-8 hover:border-purple-300 group"
              >
                <div className="w-12 h-12 bg-gradient-secondary rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-xl">🚀</span>
                </div>
                <h3 className="text-subheading text-gray-900 mb-2">Create New Auction</h3>
                <p className="text-body text-gray-600">List a new item from your content</p>
              </Link>
              
              <Link 
                href="/profile"
                className="card p-8 hover:border-indigo-300 group"
              >
                <div className="w-12 h-12 bg-gradient-primary rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-xl">⚙️</span>
                </div>
                <h3 className="text-subheading text-gray-900 mb-2">Creator Profile</h3>
                <p className="text-body text-gray-600">Manage your creator profile and settings</p>
              </Link>
              
              <Link 
                href="/auctions"
                className="card p-8 hover:border-emerald-300 group"
              >
                <div className="w-12 h-12 bg-gradient-accent rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-xl">🔍</span>
                </div>
                <h3 className="text-subheading text-gray-900 mb-2">Browse Market</h3>
                <p className="text-body text-gray-600">See what other creators are selling</p>
              </Link>
            </div>

            {/* Creator Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* My Auctions */}
              <div className="card">
                <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex justify-between items-center">
                    <h2 className="text-subheading text-gray-900">My Auctions</h2>
                    <Link href="/creator/create-auction" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      + New
                    </Link>
                  </div>
                </div>
                <div className="p-8">
                  {loadingData ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : userAuctions.length > 0 ? (
                    <div className="space-y-6">
                      {userAuctions.slice(0, 4).map((auction) => (
                        <div key={auction.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{auction.title}</h3>
                              <div className="flex items-center gap-4 mb-3">
                                <div>
                                  <p className="text-sm text-gray-500 mb-1">Current Price</p>
                                  <p className="text-xl font-bold text-green-600">
                                    ${formatPrice(auction.current_price)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500 mb-1">Bids</p>
                                  <p className="text-xl font-bold text-gray-900">
                                    {auction.bid_count || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500 mb-1">Status</p>
                                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                    auction.status === 'active' ? 'bg-green-100 text-green-800' :
                                    auction.status === 'ended' ? 'bg-gray-100 text-gray-800' :
                                    'bg-orange-100 text-orange-800'
                                  }`}>
                                    {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Link 
                                href={`/auctions/${auction.id}`}
                                className="btn-secondary px-4 py-2 text-center text-sm"
                              >
                                VIEW
                              </Link>
                              {(auction.status === 'draft' || auction.status === 'pending') && (
                                <button
                                  onClick={() => setShowDeleteConfirm(auction.id)}
                                  disabled={deletingId === auction.id}
                                  className="px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 text-sm"
                                >
                                  {deletingId === auction.id ? 'Deleting...' : 'DELETE'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
                        <span className="text-gray-400 text-2xl">📦</span>
                      </div>
                      <h3 className="text-subheading text-gray-900 mb-2">No auctions yet</h3>
                      <p className="text-body text-gray-600 mb-6">Start selling items from your content</p>
                      <Link 
                        href="/creator/create-auction"
                        className="btn-primary"
                      >
                        Create First Auction
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Sales History */}
              <div className="card">
                <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                  <h2 className="text-subheading text-gray-900">Recent Sales</h2>
                </div>
                <div className="p-8">
                  {loadingData ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : sales.length > 0 ? (
                    <div className="space-y-6">
                      {sales.slice(0, 4).map((sale) => (
                        <div key={sale.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
                          <div className="flex items-start gap-4">
                            {sale.primary_image && (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                <img 
                                  src={sale.primary_image} 
                                  alt={sale.auction_title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                                {sale.auction_title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                Sold to @{sale.buyer_username}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500">Sale Price</p>
                                    <p className="text-lg font-bold text-green-600">
                                      ${formatPrice(sale.final_price)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                      sale.shipping_status === 'delivered' ? 'bg-green-100 text-green-800' :
                                      sale.shipping_status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                      'bg-orange-100 text-orange-800'
                                    }`}>
                                      {sale.shipping_status.charAt(0).toUpperCase() + sale.shipping_status.slice(1)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Sold {new Date(sale.created_at).toLocaleDateString()}
                                {sale.purchase_type === 'buy_now' && (
                                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                    Buy Now
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
                        <span className="text-green-400 text-2xl">💰</span>
                      </div>
                      <h3 className="text-subheading text-gray-900 mb-2">No sales yet</h3>
                      <p className="text-body text-gray-600 mb-6">Start creating auctions to make your first sale</p>
                      <Link 
                        href="/creator/create-auction"
                        className="btn-primary"
                      >
                        Create Auction
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          // CUSTOMER DASHBOARD (unchanged)
          <>
            {/* Customer Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Link 
                href="/auctions"
                className="card p-8 hover:border-indigo-300 group"
              >
                <div className="w-12 h-12 bg-gradient-primary rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-4 h-4 bg-white rounded"></div>
                </div>
                <h3 className="text-subheading text-gray-900 mb-2">Browse Auctions</h3>
                <p className="text-body text-gray-600">Discover items from verified creators</p>
              </Link>
              
              <Link 
                href="/creators"
                className="card p-8 hover:border-purple-300 group"
              >
                <div className="w-12 h-12 bg-gradient-secondary rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-4 h-4 bg-white rounded"></div>
                </div>
                <h3 className="text-subheading text-gray-900 mb-2">Discover Creators</h3>
                <p className="text-body text-gray-600">Follow your favorite content creators</p>
              </Link>
              
              <Link 
                href="/profile"
                className="card p-8 hover:border-emerald-300 group"
              >
                <div className="w-12 h-12 bg-gradient-accent rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-4 h-4 bg-white rounded"></div>
                </div>
                <h3 className="text-subheading text-gray-900 mb-2">Account Settings</h3>
                <p className="text-body text-gray-600">Manage your profile and preferences</p>
              </Link>
            </div>

            {/* Customer Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Purchase History */}
              <div className="card">
                <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                  <h2 className="text-subheading text-gray-900">Purchase History</h2>
                </div>
                <div className="p-8">
                  {loadingData ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : purchases.length > 0 ? (
                    <div className="space-y-6">
                      {purchases.slice(0, 3).map((purchase) => (
                        <div key={purchase.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
                          <div className="flex items-start gap-4">
                            {purchase.primary_image && (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                <img 
                                  src={purchase.primary_image} 
                                  alt={purchase.auction_title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                                {purchase.auction_title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                by @{purchase.seller_username}
                                {purchase.seller_verified && <span className="text-blue-500 ml-1">✓</span>}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500">Paid</p>
                                    <p className="text-lg font-bold text-green-600">
                                      ${formatPrice(purchase.final_price)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                      purchase.shipping_status === 'delivered' ? 'bg-green-100 text-green-800' :
                                      purchase.shipping_status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                      'bg-orange-100 text-orange-800'
                                    }`}>
                                      {purchase.shipping_status.charAt(0).toUpperCase() + purchase.shipping_status.slice(1)}
                                    </span>
                                  </div>
                                </div>
                                <Link 
                                  href={`/auctions/${purchase.auction_id}`}
                                  className="btn-secondary px-3 py-1 text-sm"
                                >
                                  VIEW
                                </Link>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Purchased {new Date(purchase.created_at).toLocaleDateString()}
                                {purchase.purchase_type === 'buy_now' && (
                                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                    Buy Now
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-purple-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
                        <div className="w-6 h-6 bg-purple-400 rounded"></div>
                      </div>
                      <h3 className="text-subheading text-gray-900 mb-2">No purchases yet</h3>
                      <p className="text-body text-gray-600 mb-6">Start bidding on items you love</p>
                      <Link 
                        href="/auctions"
                        className="btn-primary"
                      >
                        Browse Auctions
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Watchlist */}
              <div className="card">
                <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50">
                  <h2 className="text-subheading text-gray-900">Watchlist</h2>
                </div>
                <div className="p-8">
                  {loadingData ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : watchlist.length > 0 ? (
                    <div className="space-y-6">
                      {watchlist.slice(0, 3).map((auction) => (
                        <div key={auction.id} className="border-b border-gray-200 pb-6 last:border-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-body text-gray-900 mb-2 font-medium">{auction.title}</h3>
                              <p className="text-lg font-semibold bg-gradient-secondary bg-clip-text text-transparent mb-2">
                                ${formatPrice(auction.current_price)}
                              </p>
                              <p className="text-caption text-gray-500">
                                Ends {new Date(auction.end_time).toLocaleDateString()}
                              </p>
                            </div>
                            <Link 
                              href={`/auctions/${auction.id}`}
                              className="btn-secondary px-4 py-2"
                            >
                              VIEW
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-secondary rounded-xl mx-auto mb-6 flex items-center justify-center">
                        <div className="w-6 h-6 bg-white rounded"></div>
                      </div>
                      <h3 className="text-subheading text-gray-900 mb-2">No items watched</h3>
                      <p className="text-body text-gray-600 mb-6">Start following auctions you&apos;re interested in</p>
                      <Link 
                        href="/auctions"
                        className="btn-accent"
                      >
                        Browse Auctions
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Auction</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this auction? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteAuction(showDeleteConfirm)}
                  disabled={deletingId === showDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deletingId === showDeleteConfirm ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
