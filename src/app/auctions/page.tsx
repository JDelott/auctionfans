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

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="w-12 h-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full mb-4"></div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
            LIVE AUCTIONS
          </h1>
          <p className="text-zinc-400 text-lg">Discover authentic items from verified content creators</p>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleSearch} className="md:col-span-2">
              <label htmlFor="search" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                Search Auctions
              </label>
              <div className="flex space-x-3">
                <input
                  id="search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  placeholder="Search by title or description..."
                />
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            <div>
              <label htmlFor="category" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Auctions Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : auctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {auctions.map((auction) => (
              <Link
                key={auction.id}
                href={`/auctions/${auction.id}`}
                className="group bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden hover:border-violet-500 hover:bg-zinc-900/80 transition-all duration-300"
              >
                {/* Image */}
                <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                  {auction.primary_image ? (
                    <Image
                      src={auction.primary_image}
                      alt={auction.title}
                      fill
                      className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-zinc-700 rounded-xl flex items-center justify-center">
                        <div className="w-6 h-6 bg-zinc-600 rounded"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      auction.status === 'active' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {formatTimeRemaining(auction.end_time)}
                    </span>
                  </div>

                  {/* Verified Badge */}
                  {auction.is_verified && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-violet-500/20 border border-violet-500/30 rounded text-xs font-mono text-violet-300">
                        VERIFIED
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Category */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400 uppercase tracking-wide">
                      {auction.category_name || 'Uncategorized'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      auction.status === 'active' ? 'bg-green-900 text-green-300' :
                      auction.status === 'ended' ? 'bg-red-900 text-red-300' :
                      'bg-zinc-700 text-zinc-300'
                    }`}>
                      {auction.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-white font-semibold mb-3 line-clamp-2 group-hover:text-violet-300 transition-colors">
                    {auction.title}
                  </h3>

                  {/* Price & Bids */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Current Price</p>
                      <p className="text-xl font-bold text-white">
                        ${formatPrice(auction.current_price)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">
                        {auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''}
                      </span>
                      <span className="text-zinc-400">
                        Ends {formatTimeRemaining(auction.end_time)}
                      </span>
                    </div>
                  </div>

                  {/* Creator */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-violet-600 rounded-full"></div>
                      <span className="text-xs text-zinc-300 truncate">
                        {auction.display_name || auction.username}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      {auction.condition.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-zinc-700 rounded"></div>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No auctions found</h3>
            <p className="text-zinc-400">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="px-4 py-2 text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  Previous
                </button>
              )}
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    page === currentPage
                      ? 'bg-violet-600 text-white'
                      : 'text-zinc-300 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-4 py-2 text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors"
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
