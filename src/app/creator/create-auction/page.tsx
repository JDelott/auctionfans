'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  description: string;
}

export default function CreateAuctionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    video_url: '',
    video_timestamp: '',
    starting_price: '',
    buy_now_price: '',
    reserve_price: '',
    condition: 'good',
    duration_days: '7',
    images: [] as File[]
  });

  useEffect(() => {
    if (!loading && (!user || !user.is_creator)) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5); // Max 5 images
      setFormData(prev => ({ ...prev, images: files }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Create the auction first
      const auctionData = {
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id,
        video_url: formData.video_url,
        video_timestamp: formData.video_timestamp ? parseInt(formData.video_timestamp) : null,
        starting_price: parseFloat(formData.starting_price),
        buy_now_price: formData.buy_now_price ? parseFloat(formData.buy_now_price) : null,
        reserve_price: formData.reserve_price ? parseFloat(formData.reserve_price) : null,
        condition: formData.condition,
        duration_days: parseInt(formData.duration_days)
      };

      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auctionData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create auction');
      }

      const result = await response.json();
      const auctionId = result.auction.id;

      // Upload images if any
      if (formData.images.length > 0) {
        const imageFormData = new FormData();
        formData.images.forEach(file => {
          imageFormData.append('images', file);
        });

        await fetch(`/api/auctions/${auctionId}/images`, {
          method: 'POST',
          body: imageFormData
        });
      }

      router.push(`/auctions/${auctionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-2 border-red-400/20 rounded-full animate-ping"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-zinc-400 hover:text-white text-sm mb-8 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          
          <div className="mb-8">
            <div className="w-12 h-1 bg-violet-400 mb-4"></div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Create New Auction
            </h1>
            <p className="text-lg text-zinc-300">
              List an authentic item from your content
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-lg p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-2">
                  Item Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  placeholder="Gaming headset used in stream setup"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors resize-none"
                  placeholder="Describe the item's condition, usage, and any special significance..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-zinc-300 mb-2">
                    Category *
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    required
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  >
                    <option value="" className="bg-zinc-800 text-zinc-400">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id} className="bg-zinc-800 text-white">
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-zinc-300 mb-2">
                    Condition *
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    required
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  >
                    <option value="new" className="bg-zinc-800 text-white">New</option>
                    <option value="like_new" className="bg-zinc-800 text-white">Like New</option>
                    <option value="good" className="bg-zinc-800 text-white">Good</option>
                    <option value="fair" className="bg-zinc-800 text-white">Fair</option>
                    <option value="poor" className="bg-zinc-800 text-white">Poor</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Video Information */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Video Information</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="video_url" className="block text-sm font-medium text-zinc-300 mb-2">
                  Video URL *
                </label>
                <input
                  id="video_url"
                  name="video_url"
                  type="url"
                  required
                  value={formData.video_url}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  placeholder="https://youtube.com/watch?v=..."
                />
                <p className="text-sm text-zinc-500 mt-2">
                  Link to the video where this item appears
                </p>
              </div>

              <div>
                <label htmlFor="video_timestamp" className="block text-sm font-medium text-zinc-300 mb-2">
                  Video Timestamp (seconds)
                </label>
                <input
                  id="video_timestamp"
                  name="video_timestamp"
                  type="number"
                  value={formData.video_timestamp}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  placeholder="120"
                />
                <p className="text-sm text-zinc-500 mt-2">
                  When the item appears in the video (optional)
                </p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Pricing</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="starting_price" className="block text-sm font-medium text-zinc-300 mb-2">
                  Starting Price ($) *
                </label>
                <input
                  id="starting_price"
                  name="starting_price"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={formData.starting_price}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  placeholder="25.00"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="reserve_price" className="block text-sm font-medium text-zinc-300 mb-2">
                    Reserve Price ($)
                  </label>
                  <input
                    id="reserve_price"
                    name="reserve_price"
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.reserve_price}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                    placeholder="50.00"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    Minimum price to sell
                  </p>
                </div>

                <div>
                  <label htmlFor="buy_now_price" className="block text-sm font-medium text-zinc-300 mb-2">
                    Buy Now Price ($)
                  </label>
                  <input
                    id="buy_now_price"
                    name="buy_now_price"
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.buy_now_price}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                    placeholder="100.00"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    Instant purchase price
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Images & Duration */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Images & Duration</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="images" className="block text-sm font-medium text-zinc-300 mb-2">
                  Images (max 5)
                </label>
                <input
                  id="images"
                  name="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-violet-600 file:text-white hover:file:bg-violet-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                />
                {formData.images.length > 0 && (
                  <div className="mt-3 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <p className="text-green-400 text-sm">
                      {formData.images.length} file(s) selected
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="duration_days" className="block text-sm font-medium text-zinc-300 mb-2">
                  Auction Duration
                </label>
                <select
                  id="duration_days"
                  name="duration_days"
                  value={formData.duration_days}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                >
                  <option value="1" className="bg-zinc-800 text-white">1 Day</option>
                  <option value="3" className="bg-zinc-800 text-white">3 Days</option>
                  <option value="7" className="bg-zinc-800 text-white">7 Days</option>
                  <option value="10" className="bg-zinc-800 text-white">10 Days</option>
                  <option value="14" className="bg-zinc-800 text-white">14 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500 flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Auction</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
