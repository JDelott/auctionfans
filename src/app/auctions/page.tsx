'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

interface AuctionItem {
  id: string;
  title: string;
  description: string;
  current_price: number;
  starting_price: number;
  buy_now_price?: number;
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
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => { 
    fetchCategories();
  }, []);

  // Initialize state from URL parameters
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || '';
    const urlPage = parseInt(searchParams.get('page') || '1');

    setSearch(urlSearch);
    setSelectedCategory(urlCategory);
    setCurrentPage(urlPage);
  }, [searchParams]);

  useEffect(() => {
    fetchAuctions();
  }, [currentPage, selectedCategory, search]);

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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchAuctions = async () => {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="accent-bar w-16 mb-4"></div>
          <h1 className="text-heading text-gray-900 mb-4">Live Auctions</h1>
          <p className="text-lg text-gray-600">Discover authentic items from verified content creators</p>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleSearch} className="md:col-span-2">
              <label htmlFor="search" className="block text-caption text-gray-700 mb-2">
                SEARCH AUCTIONS
              </label>
              <div className="flex space-x-3">
                <input
                  id="search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input flex-1"
                  placeholder="Search by title or description..."
                />
                <button type="submit" className="btn-primary">
                  Search
                </button>
              </div>
            </form>

            <div>
              <label htmlFor="category" className="block text-caption text-gray-700 mb-2">
                CATEGORY
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="input w-full"
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
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : auctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {auctions.map((auction) => (
              <Link
                key={auction.id}
                href={`/auctions/${auction.id}`}
                className="card overflow-hidden hover:border-indigo-300 group"
              >
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {auction.primary_image ? (
                    <img
                      src={auction.primary_image}
                      alt={auction.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                        <div className="w-6 h-6 bg-white rounded"></div>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className="status-active">
                      {formatTimeRemaining(auction.end_time)}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-caption text-gray-600">{auction.category_name}</span>
                    {auction.is_verified && (
                      <span className="creator-badge">VERIFIED</span>
                    )}
                  </div>

                  <h3 className="text-subheading text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {auction.title}
                  </h3>

                  <p className="text-caption text-gray-600 mb-1">
                    BY {auction.display_name || auction.username}
                  </p>

                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                        ${auction.current_price.toFixed(2)}
                      </p>
                      <p className="text-caption text-gray-500">
                        {auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-caption text-gray-600 uppercase">
                        {auction.condition}
                      </p>
                      {auction.buy_now_price && (
                        <p className="text-caption text-emerald-600">
                          Buy: ${auction.buy_now_price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-primary rounded-xl mx-auto mb-6 flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded"></div>
            </div>
            <h3 className="text-subheading text-gray-900 mb-2">No auctions found</h3>
            <p className="text-body text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-caption text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
