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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.display_name || user.username}!
            </h1>
            <p className="mt-2 text-gray-600">
              {user.is_creator ? 'Manage your auctions and track your sales' : 'Track your bids and discover new items'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link 
              href="/auctions"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900">Browse Auctions</h3>
              <p className="text-gray-600">Discover items from your favorite creators</p>
            </Link>
            
            {user.is_creator && (
              <Link 
                href="/creator/create-auction"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-2">➕</div>
                <h3 className="text-lg font-semibold text-gray-900">Create Auction</h3>
                <p className="text-gray-600">List a new item from your videos</p>
              </Link>
            )}
            
            <Link 
              href="/profile"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">👤</div>
              <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
              <p className="text-gray-600">Update your account information</p>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User's Auctions (if creator) */}
            {user.is_creator && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">My Auctions</h2>
                </div>
                <div className="p-6">
                  {loadingData ? (
                    <div className="text-center py-4">Loading auctions...</div>
                  ) : userAuctions.length > 0 ? (
                    <div className="space-y-4">
                      {userAuctions.slice(0, 3).map((auction) => (
                        <div key={auction.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{auction.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Current bid: ${auction.current_price.toFixed(2)}
                              </p>
                              <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                                auction.status === 'active' ? 'bg-green-100 text-green-800' :
                                auction.status === 'ended' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {auction.status}
                              </span>
                            </div>
                            <Link 
                              href={`/auctions/${auction.id}`}
                              className="text-indigo-600 hover:text-indigo-500 text-sm"
                            >
                              View →
                            </Link>
                          </div>
                        </div>
                      ))}
                      {userAuctions.length > 3 && (
                        <Link 
                          href="/creator/auctions"
                          className="block text-center text-indigo-600 hover:text-indigo-500 mt-4"
                        >
                          View all auctions →
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📦</div>
                      <h3 className="text-lg font-medium text-gray-900">No auctions yet</h3>
                      <p className="text-gray-600 mb-4">Start selling items from your videos</p>
                      <Link 
                        href="/creator/create-auction"
                        className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        Create Your First Auction
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Watchlist */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Watchlist</h2>
              </div>
              <div className="p-6">
                {loadingData ? (
                  <div className="text-center py-4">Loading watchlist...</div>
                ) : watchlist.length > 0 ? (
                  <div className="space-y-4">
                    {watchlist.slice(0, 3).map((auction) => (
                      <div key={auction.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{auction.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Current bid: ${auction.current_price.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Ends: {new Date(auction.end_time).toLocaleDateString()}
                            </p>
                          </div>
                          <Link 
                            href={`/auctions/${auction.id}`}
                            className="text-indigo-600 hover:text-indigo-500 text-sm"
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">👀</div>
                    <h3 className="text-lg font-medium text-gray-900">No items in watchlist</h3>
                    <p className="text-gray-600 mb-4">Start following auctions you&apos;re interested in</p>
                    <Link 
                      href="/auctions"
                      className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
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
    </div>
  );
}
