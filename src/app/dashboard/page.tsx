'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AuctionItem {
  id: string;
  title: string;
  description: string;
  current_price: number;
  status: string;
  end_time: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userAuctions, setUserAuctions] = useState<AuctionItem[]>([]);
  const [watchlist, setWatchlist] = useState<AuctionItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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
      const [auctionsRes, watchlistRes] = await Promise.all([
        fetch('/api/auctions/my-auctions'),
        fetch('/api/auctions/watchlist')
      ]);

      if (auctionsRes.ok) {
        const auctionsData = await auctionsRes.json();
        setUserAuctions(auctionsData.auctions || []);
      }

      if (watchlistRes.ok) {
        const watchlistData = await watchlistRes.json();
        setWatchlist(watchlistData.auctions || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
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

        {/* Quick Actions */}
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
          
          {user.is_creator && (
            <Link 
              href="/creator/create-auction"
              className="card card-featured p-8 hover:border-purple-300 group"
            >
              <div className="w-12 h-12 bg-gradient-secondary rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="w-4 h-4 bg-white rounded"></div>
              </div>
              <h3 className="text-subheading text-gray-900 mb-2">Create Auction</h3>
              <p className="text-body text-gray-600">List a new item from your content</p>
            </Link>
          )}
          
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Creator Auctions */}
          {user.is_creator && (
            <div className="card">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <h2 className="text-subheading text-gray-900">My Auctions</h2>
              </div>
              <div className="p-8">
                {loadingData ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : userAuctions.length > 0 ? (
                  <div className="space-y-6">
                    {userAuctions.slice(0, 3).map((auction) => (
                      <div key={auction.id} className="border-b border-gray-200 pb-6 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-body text-gray-900 mb-2 font-medium">{auction.title}</h3>
                            <p className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent mb-2">
                              ${auction.current_price.toFixed(2)}
                            </p>
                            <span className={`inline-block ${
                              auction.status === 'active' ? 'status-active' :
                              auction.status === 'ended' ? 'status-ended' :
                              'status-pending'
                            }`}>
                              {auction.status}
                            </span>
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
                    {userAuctions.length > 3 && (
                      <Link 
                        href="/creator/auctions"
                        className="block text-center text-indigo-600 hover:text-indigo-700 font-medium mt-6"
                      >
                        View All Auctions →
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-primary rounded-xl mx-auto mb-6 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white rounded"></div>
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
          )}

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
                            ${auction.current_price.toFixed(2)}
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
                  <p className="text-body text-gray-600 mb-6">Start following auctions you&lsquo;re interested in</p>
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
      </div>
    </div>
  );
}
