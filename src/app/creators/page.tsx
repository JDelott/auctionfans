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
    const icons: { [key: string]: string } = {
      'youtube': 'YT',
      'twitch': 'TW',
      'tiktok': 'TT',
      'instagram': 'IG',
      'twitter': 'X',
    };
    return icons[platform?.toLowerCase()] || 'WEB';
  };

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      'youtube': 'bg-red-500',
      'twitch': 'bg-violet-500',
      'tiktok': 'bg-zinc-700',
      'instagram': 'bg-red-400',
      'twitter': 'bg-zinc-600',
    };
    return colors[platform?.toLowerCase()] || 'bg-zinc-500';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="mb-16">
          <div className="w-16 h-1 bg-gradient-to-r from-violet-500 to-red-500 mb-6"></div>
          <h1 className="text-6xl font-black text-white mb-6">DISCOVER CREATORS</h1>
          <p className="text-xl text-zinc-200 max-w-3xl font-light leading-relaxed">
            Explore verified content creators selling authentic items from their content. Own pieces of your favorite creator&apos;s journey.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form onSubmit={handleSearch} className="lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-mono text-violet-400 mb-3 uppercase tracking-wider">
                SEARCH CREATORS
              </label>
              <div className="flex space-x-4">
                <input
                  id="search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 text-white px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="Search by name or username..."
                />
                <button type="submit" className="bg-violet-500 text-white font-bold px-8 py-3 hover:bg-violet-600 transition-colors">
                  SEARCH
                </button>
              </div>
            </form>

            <div>
              <label htmlFor="platform" className="block text-sm font-mono text-violet-400 mb-3 uppercase tracking-wider">
                PLATFORM
              </label>
              <select
                id="platform"
                value={selectedPlatform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
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
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : creators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {creators.map((creator) => (
              <Link
                key={creator.id}
                href={`/creators/${creator.username}`}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="p-6">
                  {/* Profile Section */}
                  <div className="text-center mb-6">
                    {creator.profile_image_url ? (
                      <Image
                        src={creator.profile_image_url}
                        alt={creator.display_name || creator.username}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full mx-auto mb-4"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {(creator.display_name || creator.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <h3 className="text-lg font-bold text-white mb-1">
                      {creator.display_name || creator.username}
                    </h3>
                    <p className="text-sm font-mono text-zinc-400 mb-3">@{creator.username}</p>
                    
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      {creator.is_verified && (
                        <span className="bg-violet-500 text-white text-xs px-2 py-1 font-mono font-bold uppercase tracking-wider">
                          VERIFIED
                        </span>
                      )}
                      {creator.platform && (
                        <span className={`${getPlatformColor(creator.platform)} text-white text-xs px-2 py-1 font-mono font-bold`}>
                          {getPlatformIcon(creator.platform)}
                        </span>
                      )}
                    </div>

                    {creator.bio && (
                      <p className="text-sm text-zinc-300 line-clamp-2 mb-4">{creator.bio}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="border-t border-zinc-800 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-center mb-4">
                      <div>
                        <p className="text-lg font-bold text-violet-400">{creator.auction_count}</p>
                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Auctions</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{creator.total_sales}</p>
                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Sales</p>
                      </div>
                    </div>
                    
                    {creator.subscriber_count > 0 && (
                      <div className="text-center mb-3">
                        <p className="text-sm text-zinc-400 font-mono">
                          {formatSubscriberCount(creator.subscriber_count)} subscribers
                        </p>
                      </div>
                    )}

                    {creator.active_auction_count > 0 && (
                      <div className="text-center">
                        <span className="bg-red-500 text-white text-xs px-3 py-1 font-mono font-bold uppercase tracking-wider">
                          {creator.active_auction_count} ACTIVE
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-zinc-800 rounded-full mx-auto mb-6 flex items-center justify-center">
              <div className="w-8 h-8 bg-zinc-600 rounded"></div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">NO CREATORS FOUND</h3>
            <p className="text-zinc-400 font-mono uppercase tracking-wider">Try adjusting your search criteria</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <div className="flex space-x-2">
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="px-6 py-3 text-zinc-300 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white transition-colors font-mono uppercase tracking-wider"
                >
                  Previous
                </button>
              )}
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-3 font-mono uppercase tracking-wider transition-colors ${
                    page === currentPage
                      ? 'bg-violet-500 text-white'
                      : 'text-zinc-300 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-6 py-3 text-zinc-300 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white transition-colors font-mono uppercase tracking-wider"
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
