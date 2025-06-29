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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-2 border-red-400/20 rounded-full animate-ping"></div>
        </div>
      </div>
    );
  }

  if (!user || !user.is_creator) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600/20 border border-red-600/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 text-red-400">⚠</div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-zinc-400 mb-6">You must be a verified creator to edit auctions.</p>
          <Link href="/dashboard" className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-2 border-zinc-600 rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Auction Not Found</h1>
          <p className="text-zinc-400 mb-6">The auction you&apos;re trying to edit could not be found.</p>
          <Link href="/dashboard" className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
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
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Geometric Accent Lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-32 left-0 w-64 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
        <div className="absolute top-48 right-0 w-48 h-px bg-gradient-to-l from-transparent via-red-400/20 to-transparent"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href={`/auctions/${auction.id}`} 
            className="inline-flex items-center text-zinc-400 hover:text-white text-sm mb-8 transition-colors"
          >
            ← Back to Auction
          </Link>
          
          <div className="mb-8">
            <div className="w-12 h-1 bg-violet-400 mb-4"></div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Edit Auction
            </h1>
            <p className="text-lg text-zinc-300">
              {isActive ? 'Update description and video details (auction is live)' : 'Update your auction details'}
            </p>
          </div>
          
          {/* Status Warning */}
          {isActive && (
            <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 text-amber-400 mt-0.5">⚠</div>
                <div>
                  <h3 className="text-amber-400 font-medium mb-2">Auction is Live</h3>
                  <p className="text-amber-200/80 text-sm">
                    Pricing and timing cannot be changed while the auction is active, but you can update the description and video details.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 mb-8">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Current Images Display */}
        {auction.images && auction.images.length > 0 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 mb-10">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <div className="w-2 h-2 bg-violet-400 rounded-full mr-3"></div>
              Current Images
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {auction.images.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="relative overflow-hidden rounded-lg bg-zinc-800">
                    <Image
                      src={image.image_url}
                      alt="Auction item"
                      width={200}
                      height={200}
                      className="w-full h-32 object-cover"
                    />
                    {image.is_primary && (
                      <div className="absolute top-2 left-2 bg-violet-600 text-white text-xs px-2 py-1 rounded font-mono">
                        PRIMARY
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
              <p className="text-zinc-400 text-sm font-mono">
                📷 IMAGE MANAGEMENT: Contact support to modify images
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Basic Information */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <div className="w-2 h-2 bg-violet-400 rounded-full mr-3"></div>
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
                  Auction Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={!canEditBasicInfo}
                  className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors ${
                    !canEditBasicInfo ? 'bg-zinc-900 cursor-not-allowed opacity-50' : ''
                  }`}
                  placeholder="Enter auction title"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors resize-none"
                  placeholder="Describe your item..."
                />
              </div>

              <div>
                <label htmlFor="category_id" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
                  Category *
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  required
                  value={formData.category_id}
                  onChange={handleInputChange}
                  disabled={!canEditBasicInfo}
                  className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors ${
                    !canEditBasicInfo ? 'bg-zinc-900 cursor-not-allowed opacity-50' : ''
                  }`}
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
                <label htmlFor="condition" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
                  Condition *
                </label>
                <select
                  id="condition"
                  name="condition"
                  required
                  value={formData.condition}
                  onChange={handleInputChange}
                  disabled={!canEditBasicInfo}
                  className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors ${
                    !canEditBasicInfo ? 'bg-zinc-900 cursor-not-allowed opacity-50' : ''
                  }`}
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

          {/* Pricing & Timing */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <div className="w-2 h-2 bg-violet-400 rounded-full mr-3"></div>
                Pricing & Timing
              </h3>
              {!canEditPricing && (
                <div className="bg-amber-900/30 border border-amber-800/50 rounded px-3 py-1">
                  <span className="text-amber-400 text-xs font-mono">LOCKED - AUCTION LIVE</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="starting_price" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
                  Starting Price *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-zinc-500 font-mono">$</span>
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
                    className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors font-mono ${
                      !canEditPricing ? 'bg-zinc-900 cursor-not-allowed opacity-50' : ''
                    }`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reserve_price" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
                  Reserve Price
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-zinc-500 font-mono">$</span>
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
                    className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors font-mono ${
                      !canEditPricing ? 'bg-zinc-900 cursor-not-allowed opacity-50' : ''
                    }`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="buy_now_price" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
                  Buy Now Price
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-zinc-500 font-mono">$</span>
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
                    className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors font-mono ${
                      !canEditPricing ? 'bg-zinc-900 cursor-not-allowed opacity-50' : ''
                    }`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <label htmlFor="end_time" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
                  Auction End Time *
                </label>
                <input
                  id="end_time"
                  name="end_time"
                  type="datetime-local"
                  required
                  value={formData.end_time}
                  onChange={handleInputChange}
                  disabled={!canEditPricing}
                  className={`bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors font-mono ${
                    !canEditPricing ? 'bg-zinc-900 cursor-not-allowed opacity-50' : ''
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Video Information */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <div className="w-2 h-2 bg-violet-400 rounded-full mr-3"></div>
              Video Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3">
                <label htmlFor="video_url" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
                  Video URL *
                </label>
                <input
                  id="video_url"
                  name="video_url"
                  type="url"
                  required
                  value={formData.video_url}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label htmlFor="video_timestamp" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
                  Timestamp (sec)
                </label>
                <input
                  id="video_timestamp"
                  name="video_timestamp"
                  type="number"
                  min="0"
                  value={formData.video_timestamp}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors font-mono"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-8">
            <Link
              href={`/auctions/${auction.id}`}
              className="bg-zinc-700 hover:bg-zinc-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
