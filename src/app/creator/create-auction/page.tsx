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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="text-caption text-gray-600 hover:text-indigo-600 mb-4 inline-block">
            ← BACK TO DASHBOARD
          </Link>
          <div className="accent-bar w-16 mb-4"></div>
          <h1 className="text-heading text-gray-900 mb-2">Create New Auction</h1>
          <p className="text-lg text-gray-600">List an authentic item from your content</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-caption text-gray-700 mb-2">
                  ITEM TITLE *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Gaming headset used in stream setup"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-caption text-gray-700 mb-2">
                  DESCRIPTION *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input w-full resize-none"
                  placeholder="Describe the item's condition, usage, and any special significance..."
                />
              </div>

              <div>
                <label htmlFor="category_id" className="block text-caption text-gray-700 mb-2">
                  CATEGORY *
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  required
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="condition" className="block text-caption text-gray-700 mb-2">
                  CONDITION *
                </label>
                <select
                  id="condition"
                  name="condition"
                  required
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div>
                <label htmlFor="images" className="block text-caption text-gray-700 mb-2">
                  IMAGES (MAX 5)
                </label>
                <input
                  id="images"
                  name="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="input w-full"
                />
                {formData.images.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {formData.images.length} file(s) selected
                  </p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label htmlFor="video_url" className="block text-caption text-gray-700 mb-2">
                  VIDEO URL *
                </label>
                <input
                  id="video_url"
                  name="video_url"
                  type="url"
                  required
                  value={formData.video_url}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label htmlFor="video_timestamp" className="block text-caption text-gray-700 mb-2">
                  VIDEO TIMESTAMP (SECONDS)
                </label>
                <input
                  id="video_timestamp"
                  name="video_timestamp"
                  type="number"
                  value={formData.video_timestamp}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="120"
                />
              </div>

              <div>
                <label htmlFor="starting_price" className="block text-caption text-gray-700 mb-2">
                  STARTING PRICE ($) *
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
                  className="input w-full"
                  placeholder="25.00"
                />
              </div>

              <div>
                <label htmlFor="reserve_price" className="block text-caption text-gray-700 mb-2">
                  RESERVE PRICE ($)
                </label>
                <input
                  id="reserve_price"
                  name="reserve_price"
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.reserve_price}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="50.00"
                />
              </div>

              <div>
                <label htmlFor="buy_now_price" className="block text-caption text-gray-700 mb-2">
                  BUY NOW PRICE ($)
                </label>
                <input
                  id="buy_now_price"
                  name="buy_now_price"
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.buy_now_price}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="100.00"
                />
              </div>

              <div>
                <label htmlFor="duration_days" className="block text-caption text-gray-700 mb-2">
                  AUCTION DURATION
                </label>
                <select
                  id="duration_days"
                  name="duration_days"
                  value={formData.duration_days}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  <option value="1">1 Day</option>
                  <option value="3">3 Days</option>
                  <option value="7">7 Days</option>
                  <option value="10">10 Days</option>
                  <option value="14">14 Days</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/dashboard"
              className="btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? 'Creating Auction...' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
