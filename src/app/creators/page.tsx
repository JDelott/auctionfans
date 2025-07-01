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
      'youtube': 'bg-red-500/20 text-red-300 border-red-500/30',
      'twitch': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      'tiktok': 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
      'instagram': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      'twitter': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
    return colors[platform?.toLowerCase()] || 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Electric Grid Background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Electric Accent Lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-1/3 h-px bg-gradient-to-r from-transparent via-violet-400/20 to-transparent"></div>
        <div className="absolute top-40 right-0 w-1/4 h-px bg-gradient-to-l from-transparent via-red-400/20 to-transparent"></div>
        <div className="absolute bottom-1/3 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-emerald-400/20 to-transparent"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-16">
        {/* Electric Header */}
        <header className="mb-16">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-1 h-20 bg-gradient-to-b from-violet-400 via-red-400 to-pink-500"></div>
            <div>
              <h1 className="text-6xl font-black text-white tracking-tight mb-4">
                DISCOVER CREATORS
              </h1>
              <p className="text-zinc-400 font-mono text-sm tracking-[0.2em] uppercase max-w-3xl">
                VERIFIED CONTENT CREATORS SELLING AUTHENTIC ITEMS
              </p>
            </div>
          </div>
        </header>

        {/* Electric Filters */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl p-8 mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-red-500/5"></div>
          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form onSubmit={handleSearch} className="lg:col-span-2">
              <label htmlFor="search" className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-[0.2em]">
                SEARCH CREATORS
              </label>
              <div className="flex space-x-4">
                <input
                  id="search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-6 py-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 font-mono text-sm backdrop-blur-sm focus:outline-none focus:border-violet-400/50 focus:bg-zinc-800/70 transition-all duration-300"
                  placeholder="SEARCH BY NAME OR USERNAME..."
                />
                <button 
                  type="submit" 
                  className="group relative overflow-hidden px-8 py-4 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-sm text-white font-mono text-sm tracking-[0.15em] hover:from-violet-500/20 hover:to-purple-500/20 hover:border-violet-400/50 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">SEARCH</span>
                </button>
              </div>
            </form>

            <div>
              <label htmlFor="platform" className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-[0.2em]">
                PLATFORM
              </label>
              <select
                id="platform"
                value={selectedPlatform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                className="w-full px-6 py-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white font-mono text-sm backdrop-blur-sm focus:outline-none focus:border-violet-400/50 focus:bg-zinc-800/70 transition-all duration-300"
              >
                <option value="">ALL PLATFORMS</option>
                <option value="youtube">YOUTUBE</option>
                <option value="twitch">TWITCH</option>
                <option value="tiktok">TIKTOK</option>
                <option value="instagram">INSTAGRAM</option>
                <option value="twitter">TWITTER/X</option>
                <option value="other">OTHER</option>
              </select>
            </div>
          </div>
        </div>

        {/* Creators Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="relative">
              <div className="w-12 h-12 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 border border-violet-400/10 rounded-full animate-ping"></div>
            </div>
          </div>
        ) : creators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {creators.map((creator) => {
              return (
                <Link
                  key={creator.id}
                  href={`/creators/${creator.username}`}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl hover:border-zinc-600/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-8">
                    {/* Profile Section */}
                    <div className="text-center mb-8">
                      {creator.profile_image_url ? (
                        <div className="relative w-20 h-20 mx-auto mb-6">
                          <Image
                            src={creator.profile_image_url}
                            alt={creator.display_name || creator.username}
                            fill
                            className="rounded-full object-cover border-2 border-zinc-700/30"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center border-2 border-zinc-700/30">
                          <span className="text-white text-2xl font-bold">
                            {(creator.display_name || creator.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
                        {creator.display_name || creator.username}
                      </h3>
                      <p className="text-sm font-mono text-zinc-500 mb-4 tracking-[0.1em]">@{creator.username}</p>
                      
                      <div className="flex items-center justify-center space-x-3 mb-6">
                        {creator.is_verified && (
                          <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 tracking-[0.1em] backdrop-blur-sm">
                            VERIFIED
                          </div>
                        )}
                        {creator.platform && (
                          <div className={`px-3 py-1 rounded-xl text-xs font-mono tracking-[0.1em] border backdrop-blur-sm ${getPlatformColor(creator.platform)}`}>
                            {getPlatformIcon(creator.platform)}
                          </div>
                        )}
                      </div>

                      {creator.bio && (
                        <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">{creator.bio}</p>
                      )}
                    </div>

                    {/* Electric Stats */}
                    <div className="border-t border-zinc-700/30 pt-6">
                      <div className="grid grid-cols-2 gap-6 text-center mb-6">
                        <div className="bg-zinc-800/30 rounded-xl p-4 backdrop-blur-sm border border-zinc-700/30">
                          <p className="text-2xl font-black text-violet-400 mb-1">{creator.auction_count}</p>
                          <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.1em]">AUCTIONS</p>
                        </div>
                        <div className="bg-zinc-800/30 rounded-xl p-4 backdrop-blur-sm border border-zinc-700/30">
                          <p className="text-2xl font-black text-white mb-1">{creator.total_sales}</p>
                          <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.1em]">SALES</p>
                        </div>
                      </div>
                      
                      {creator.subscriber_count > 0 && (
                        <div className="text-center mb-4">
                          <p className="text-sm text-zinc-400 font-mono tracking-[0.1em]">
                            {formatSubscriberCount(creator.subscriber_count)} SUBSCRIBERS
                          </p>
                        </div>
                      )}

                      {creator.active_auction_count > 0 && (
                        <div className="text-center">
                          <div className="inline-flex items-center px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-xl text-xs font-mono text-violet-300 tracking-[0.1em] backdrop-blur-sm animate-pulse">
                            {creator.active_auction_count} ACTIVE
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-zinc-800/50 rounded-full mx-auto mb-8 flex items-center justify-center backdrop-blur-sm">
              <div className="w-12 h-12 bg-zinc-700/50 rounded-2xl"></div>
            </div>
            <h3 className="text-3xl font-black text-white mb-6">NO CREATORS FOUND</h3>
            <p className="text-zinc-400 font-mono text-sm tracking-[0.15em]">TRY ADJUSTING YOUR SEARCH CRITERIA</p>
          </div>
        )}

        {/* Electric Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-16">
            <div className="flex items-center space-x-3">
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="group relative overflow-hidden px-6 py-3 rounded-xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-sm text-zinc-300 font-mono text-sm tracking-[0.15em] hover:bg-zinc-800/50 hover:text-white hover:border-zinc-600/50 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">PREVIOUS</span>
                </button>
              )}
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`group relative overflow-hidden px-4 py-3 rounded-xl font-mono text-sm tracking-[0.15em] transition-all duration-300 ${
                    page === currentPage
                      ? 'border border-violet-400/30 bg-gradient-to-r from-violet-500/20 to-purple-500/20 backdrop-blur-sm text-white'
                      : 'border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white hover:border-zinc-600/50'
                  }`}
                >
                  {page === currentPage && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10"></div>
                  )}
                  <span className="relative">{page}</span>
                </button>
              ))}
              
              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="group relative overflow-hidden px-6 py-3 rounded-xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-sm text-zinc-300 font-mono text-sm tracking-[0.15em] hover:bg-zinc-800/50 hover:text-white hover:border-zinc-600/50 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">NEXT</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
