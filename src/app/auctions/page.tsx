'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';

interface AuctionItem {
  id: string;
  title: string;
  description: string;
  current_price: number | string;
  starting_price: number | string;
  buy_now_price?: number | string;
  condition: string;
  status: string;
  end_time: string;
  username: string;
  display_name?: string;
  is_verified: boolean;
  category_name?: string;
  primary_image?: string;
  bid_count: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

export default function AuctionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Initialize from URL params
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || '';
    const urlPage = parseInt(searchParams.get('page') || '1');

    setSearch(urlSearch);
    setSelectedCategory(urlCategory);
    setCurrentPage(urlPage);
  }, [searchParams]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchAuctions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12'
      });

      if (selectedCategory) params.append('category', selectedCategory);
      if (search) params.append('search', search);

      const response = await fetch(`/api/auctions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAuctions(data.auctions);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Update URL when filters change
  const updateURL = (newSearch: string, newCategory: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newSearch) params.set('search', newSearch);
    if (newCategory) params.set('category', newCategory);
    if (newPage > 1) params.set('page', newPage.toString());

    const paramString = params.toString();
    const newUrl = paramString ? `/auctions?${paramString}` : '/auctions';
    router.push(newUrl, { scroll: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newPage = 1;
    setCurrentPage(newPage);
    updateURL(search, selectedCategory, newPage);
  };

  const handleCategoryChange = (newCategory: string) => {
    const newPage = 1;
    setSelectedCategory(newCategory);
    setCurrentPage(newPage);
    updateURL(search, newCategory, newPage);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateURL(search, selectedCategory, newPage);
  };

  const formatPrice = (price: number | string | null | undefined): string => {
    const numPrice = Number(price) || 0;
    return numPrice.toFixed(2);
  };

  const formatTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'ENDED';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}D ${hours}H`;
    if (hours > 0) return `${hours}H ${minutes}M`;
    return `${minutes}M`;
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
        <div className="absolute top-40 right-0 w-1/4 h-px bg-gradient-to-l from-transparent via-emerald-400/20 to-transparent"></div>
        <div className="absolute bottom-1/3 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-16">
        {/* Electric Header */}
        <header className="mb-16">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-1 h-16 bg-gradient-to-b from-violet-400 to-purple-500"></div>
            <div>
              <h1 className="text-5xl font-black text-white tracking-tight mb-2">
                LIVE AUCTIONS
              </h1>
              <p className="text-zinc-400 font-mono text-sm tracking-[0.2em] uppercase">
                AUTHENTIC ITEMS FROM VERIFIED CREATORS
              </p>
            </div>
          </div>
        </header>

        {/* Electric Filters */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl p-8 mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            <form onSubmit={handleSearch} className="md:col-span-2">
              <label htmlFor="search" className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-[0.2em]">
                SEARCH AUCTIONS
              </label>
              <div className="flex space-x-4">
                <input
                  id="search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-6 py-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 font-mono text-sm backdrop-blur-sm focus:outline-none focus:border-violet-400/50 focus:bg-zinc-800/70 transition-all duration-300"
                  placeholder="SEARCH BY TITLE OR DESCRIPTION..."
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
              <label htmlFor="category" className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-[0.2em]">
                CATEGORY
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-6 py-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white font-mono text-sm backdrop-blur-sm focus:outline-none focus:border-violet-400/50 focus:bg-zinc-800/70 transition-all duration-300"
              >
                <option value="">ALL CATEGORIES</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Auctions Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="relative">
              <div className="w-12 h-12 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 border border-violet-400/10 rounded-full animate-ping"></div>
            </div>
          </div>
        ) : auctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {auctions.map((auction) => (
              <Link
                key={auction.id}
                href={`/auctions/${auction.id}`}
                className="group relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl hover:border-zinc-600/50 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Image Container */}
                <div className="relative aspect-square bg-zinc-800/30 overflow-hidden">
                  {auction.primary_image ? (
                    <Image
                      src={auction.primary_image}
                      alt={auction.title}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-zinc-700/50 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <div className="w-6 h-6 bg-zinc-600/50 rounded-lg"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="relative p-6">
                  {/* Fixed Height Category & Status Row */}
                  <div className="h-8 flex items-start justify-between mb-4">
                    <span className="text-xs text-zinc-500 uppercase font-mono tracking-[0.15em] leading-tight">
                      {auction.category_name || 'UNCATEGORIZED'}
                    </span>
                    <div className={`px-2 py-1 rounded-lg text-xs font-mono tracking-[0.1em] border backdrop-blur-sm flex-shrink-0 ${
                      auction.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      auction.status === 'ended' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                      'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                    }`}>
                      {auction.status.toUpperCase()}
                    </div>
                  </div>

                  {/* Clean One-Line Title */}
                  <h3 className="text-white font-bold text-lg mb-6 truncate transition-colors">
                    {auction.title}
                  </h3>

                  {/* Price & Subtle Timer */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-xs text-zinc-500 mb-2 font-mono tracking-[0.1em]">CURRENT PRICE</p>
                      <p className="text-2xl font-black text-white">
                        ${formatPrice(auction.current_price)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs font-mono tracking-[0.1em]">
                      <span className="text-zinc-400">
                        {auction.bid_count} BID{auction.bid_count !== 1 ? 'S' : ''}
                      </span>
                      
                      {/* Subtle Accented Timer */}
                      <span className={`font-bold ${
                        auction.status === 'active' && formatTimeRemaining(auction.end_time) !== 'ENDED'
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}>
                        ENDS {formatTimeRemaining(auction.end_time)}
                      </span>
                    </div>
                  </div>

                  {/* Creator - Clean with Icon Badge */}
                  <div className="pt-6 border-t border-zinc-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Link 
                          href={`/creators/${auction.username}`}
                          className="text-sm text-zinc-300 font-mono tracking-[0.1em] hover:text-violet-300 transition-colors duration-300 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {auction.display_name || auction.username}
                        </Link>
                        {/* Small verified icon badge */}
                        {auction.is_verified && (
                          <div className="w-5 h-5 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-zinc-800/50 rounded-full mx-auto mb-8 flex items-center justify-center backdrop-blur-sm">
              <div className="w-12 h-12 bg-zinc-700/50 rounded-2xl"></div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">NO AUCTIONS FOUND</h3>
            <p className="text-zinc-400 font-mono text-sm tracking-[0.15em]">TRY ADJUSTING YOUR SEARCH OR FILTER CRITERIA</p>
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
