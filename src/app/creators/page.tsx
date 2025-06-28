'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';

interface Creator {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  profile_image_url?: string;
  is_verified: boolean;
  created_at: string;
  channel_name?: string;
  channel_url?: string;
  platform?: string;
  subscriber_count: number;
  verification_status: string;
  auction_count: number;
  active_auction_count: number;
  total_sales: number;
}

export default function CreatorsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Initialize from URL params
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlPlatform = searchParams.get('platform') || '';
    const urlPage = parseInt(searchParams.get('page') || '1');

    setSearch(urlSearch);
    setSelectedPlatform(urlPlatform);
    setCurrentPage(urlPage);
  }, [searchParams]);

  const fetchCreators = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12'
      });

      if (selectedPlatform) params.append('platform', selectedPlatform);
      if (search) params.append('search', search);

      const response = await fetch(`/api/creators?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCreators(data.creators);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch creators:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedPlatform, search]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  // Update URL when filters change
  const updateURL = (newSearch: string, newPlatform: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newSearch) params.set('search', newSearch);
    if (newPlatform) params.set('platform', newPlatform);
    if (newPage > 1) params.set('page', newPage.toString());

    const paramString = params.toString();
    const newUrl = paramString ? `/creators?${paramString}` : '/creators';
    router.push(newUrl, { scroll: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newPage = 1;
    setCurrentPage(newPage);
    updateURL(search, selectedPlatform, newPage);
  };

  const handlePlatformChange = (newPlatform: string) => {
    const newPage = 1;
    setSelectedPlatform(newPlatform);
    setCurrentPage(newPage);
    updateURL(search, newPlatform, newPage);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateURL(search, selectedPlatform, newPage);
  };

  const formatSubscriberCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'youtube':
        return '📺';
      case 'twitch':
        return '🎮';
      case 'tiktok':
        return '🎵';
      case 'instagram':
        return '📷';
      case 'twitter':
        return '🐦';
      default:
        return '🌐';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="accent-bar w-16 mb-4"></div>
          <h1 className="text-heading text-gray-900 mb-4">Discover Creators</h1>
          <p className="text-lg text-gray-600">Find and follow your favorite content creators selling authentic items</p>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleSearch} className="md:col-span-2">
              <label htmlFor="search" className="block text-caption text-gray-700 mb-2">
                SEARCH CREATORS
              </label>
              <div className="flex space-x-3">
                <input
                  id="search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input flex-1"
                  placeholder="Search by name or username..."
                />
                <button type="submit" className="btn-primary">
                  Search
                </button>
              </div>
            </form>

            <div>
              <label htmlFor="platform" className="block text-caption text-gray-700 mb-2">
                PLATFORM
              </label>
              <select
                id="platform"
                value={selectedPlatform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                className="input w-full"
              >
                <option value="">All Platforms</option>
                <option value="youtube">YouTube</option>
                <option value="twitch">Twitch</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter/X</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Creators Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : creators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {creators.map((creator) => (
              <Link
                key={creator.id}
                href={`/creators/${creator.username}`}
                className="card overflow-hidden hover:border-indigo-300 group"
              >
                <div className="p-6">
                  {/* Profile Section */}
                  <div className="text-center mb-4">
                    {creator.profile_image_url ? (
                      <Image
                        src={creator.profile_image_url}
                        alt={creator.display_name || creator.username}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full mx-auto mb-3"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-primary rounded-full mx-auto mb-3 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {(creator.display_name || creator.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <h3 className="text-subheading text-gray-900 mb-1">
                      {creator.display_name || creator.username}
                    </h3>
                    <p className="text-caption text-gray-600 mb-2">@{creator.username}</p>
                    
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      {creator.is_verified && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                          VERIFIED
                        </span>
                      )}
                      {creator.platform && (
                        <span className="text-sm">
                          {getPlatformIcon(creator.platform)} {creator.platform.charAt(0).toUpperCase() + creator.platform.slice(1)}
                        </span>
                      )}
                    </div>

                    {creator.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{creator.bio}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Auctions</p>
                        <p className="font-semibold text-gray-900">{creator.auction_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Sales</p>
                        <p className="font-semibold text-gray-900">{creator.total_sales}</p>
                      </div>
                    </div>
                    
                    {creator.subscriber_count > 0 && (
                      <div className="mt-3 text-center">
                        <p className="text-sm text-gray-500">
                          {formatSubscriberCount(creator.subscriber_count)} subscribers
                        </p>
                      </div>
                    )}

                    {creator.active_auction_count > 0 && (
                      <div className="mt-3">
                        <span className="status-active text-xs">
                          {creator.active_auction_count} Active Auction{creator.active_auction_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-gray-400 rounded"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No creators found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg ${
                    page === currentPage
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
