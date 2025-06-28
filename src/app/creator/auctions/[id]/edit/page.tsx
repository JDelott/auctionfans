'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface AuctionImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

interface AuctionData {
  id: string;
  title: string;
  description: string;
  starting_price: number;
  buy_now_price?: number;
  reserve_price?: number;
  condition: string;
  status: string;
  end_time: string;
  video_url: string;
  video_timestamp?: number;
  category_id: string;
  creator_id: string;
  images: AuctionImage[];
}

export default function EditAuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);
  
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    starting_price: '',
    buy_now_price: '',
    reserve_price: '',
    condition: 'new',
    category_id: '',
    video_url: '',
    video_timestamp: '',
    end_time: ''
  });

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch auction data
  useEffect(() => {
    const fetchAuction = async () => {
      if (!mounted || authLoading || !user) return;

      try {
        console.log('Fetching auction for user:', user);
        const response = await fetch(`/api/auctions/${resolvedParams.id}`);
        if (response.ok) {
          const data = await response.json();
          const auctionData = data.auction;
          
          console.log('Auction data:', auctionData);
          console.log('User data:', user);
          // Check if user owns this auction
          const userId = user.id;
          if (userId && auctionData.creator_id !== userId) {
            console.log('User does not own auction, redirecting to dashboard');
            router.push('/dashboard');
            return;
          }
          
          console.log('Auction status:', auctionData.status);
          
          // Only allow editing of pending, active, or draft auctions (not ended auctions)
          if (auctionData.status === 'ended' || auctionData.status === 'cancelled') {
            console.log('Auction is ended/cancelled, redirecting to auction view');
            router.push(`/auctions/${resolvedParams.id}`);
            return;
          }
          
          setAuction(auctionData);
          
          // Populate form with existing data
          setFormData({
            title: auctionData.title || '',
            description: auctionData.description || '',
            starting_price: auctionData.starting_price?.toString() || '',
            buy_now_price: auctionData.buy_now_price?.toString() || '',
            reserve_price: auctionData.reserve_price?.toString() || '',
            condition: auctionData.condition || 'new',
            category_id: auctionData.category_id || '',
            video_url: auctionData.video_url || '',
            video_timestamp: auctionData.video_timestamp?.toString() || '',
            end_time: auctionData.end_time ? new Date(auctionData.end_time).toISOString().slice(0, 16) : ''
          });
        } else {
          console.log('Failed to fetch auction, redirecting to dashboard');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to fetch auction:', error);
        setError('Failed to load auction data');
      } finally {
        setLoading(false);
      }
    };

    fetchAuction();
  }, [mounted, user, authLoading, resolvedParams.id, router]);

  // Fetch categories
  useEffect(() => {
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

    if (mounted) {
      fetchCategories();
    }
  }, [mounted]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        starting_price: parseFloat(formData.starting_price),
        buy_now_price: formData.buy_now_price ? parseFloat(formData.buy_now_price) : null,
        reserve_price: formData.reserve_price ? parseFloat(formData.reserve_price) : null,
        condition: formData.condition,
        category_id: formData.category_id,
        video_url: formData.video_url,
        video_timestamp: formData.video_timestamp ? parseInt(formData.video_timestamp) : null,
        end_time: formData.end_time
      };

      const response = await fetch(`/api/auctions/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        router.push(`/auctions/${resolvedParams.id}?updated=true`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update auction');
      }
    } catch (error) {
      console.error('Failed to update auction:', error);
      setError('Failed to update auction');
    } finally {
      setSaving(false);
    }
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !user.is_creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-heading text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You must be a verified creator to edit auctions.</p>
          <Link href="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-heading text-gray-900 mb-4">Auction Not Found</h1>
          <p className="text-gray-600 mb-6">The auction you&apos;re trying to edit could not be found.</p>
          <Link href="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Determine what can be edited based on auction status
  const isActive = auction.status === 'active';
  const isPending = auction.status === 'pending';
  const canEditPricing = isPending; // Only allow pricing changes for pending auctions
  const canEditBasicInfo = isPending || isActive; // Allow basic info changes for pending and active

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link 
            href={`/auctions/${auction.id}`} 
            className="text-caption text-gray-600 hover:text-indigo-600 mb-4 inline-block"
          >
            ← BACK TO AUCTION
          </Link>
          <div className="accent-bar w-16 mb-4"></div>
          <h1 className="text-heading text-gray-900 mb-2">Edit Auction</h1>
          <p className="text-lg text-gray-600">
            {isActive ? 'Update description and video details (auction is live)' : 'Update your auction details'}
          </p>
          
          {/* Status Warning */}
          {isActive && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-orange-800">
                  <strong>Auction is live:</strong> Pricing and timing cannot be changed, but you can update the description and video details.
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Current Images Display */}
        {auction.images && auction.images.length > 0 && (
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {auction.images.map((image) => (
                <div key={image.id} className="relative">
                  <Image
                    src={image.image_url}
                    alt="Auction item"
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {image.is_primary && (
                    <span className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Note: Image management will be available in a future update. Contact support to change images.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-caption text-gray-700 mb-2">
                  AUCTION TITLE *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={!canEditBasicInfo}
                  className={`input w-full ${!canEditBasicInfo ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter auction title"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-caption text-gray-700 mb-2">
                  DESCRIPTION
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input w-full resize-none"
                  placeholder="Describe your item..."
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
                  disabled={!canEditBasicInfo}
                  className={`input w-full ${!canEditBasicInfo ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                  disabled={!canEditBasicInfo}
                  className={`input w-full ${!canEditBasicInfo ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Pricing & Timing
              {!canEditPricing && <span className="text-sm text-gray-500 ml-2">(Cannot be changed - auction is live)</span>}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="starting_price" className="block text-caption text-gray-700 mb-2">
                  STARTING PRICE *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    id="starting_price"
                    name="starting_price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.starting_price}
                    onChange={handleInputChange}
                    disabled={!canEditPricing}
                    className={`input w-full pl-7 ${!canEditPricing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reserve_price" className="block text-caption text-gray-700 mb-2">
                  RESERVE PRICE (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    id="reserve_price"
                    name="reserve_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.reserve_price}
                    onChange={handleInputChange}
                    disabled={!canEditPricing}
                    className={`input w-full pl-7 ${!canEditPricing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="buy_now_price" className="block text-caption text-gray-700 mb-2">
                  BUY NOW PRICE (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    id="buy_now_price"
                    name="buy_now_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.buy_now_price}
                    onChange={handleInputChange}
                    disabled={!canEditPricing}
                    className={`input w-full pl-7 ${!canEditPricing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <label htmlFor="end_time" className="block text-caption text-gray-700 mb-2">
                  AUCTION END TIME *
                </label>
                <input
                  id="end_time"
                  name="end_time"
                  type="datetime-local"
                  required
                  value={formData.end_time}
                  onChange={handleInputChange}
                  disabled={!canEditPricing}
                  className={`input w-full md:w-auto ${!canEditPricing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Video Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3">
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
                  TIMESTAMP (seconds)
                </label>
                <input
                  id="video_timestamp"
                  name="video_timestamp"
                  type="number"
                  min="0"
                  value={formData.video_timestamp}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href={`/auctions/${auction.id}`}
              className="btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
