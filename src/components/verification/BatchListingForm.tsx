'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

interface AuthVideo {
  id: string;
  video_url: string;
  declaration_text: string;
  declared_items_count: number;
  max_items_allowed: number;
  status: string;
}

interface Category {
  id: string;
  name: string;
}

interface ListingItem {
  title: string;
  description: string;
  category_id: string;
  starting_price: string;
  buy_now_price: string;
  reserve_price: string;
  condition: string;
  duration_days: number;
  item_position_in_video: number;
  video_timestamp_start: number | null;
  video_timestamp_end: number | null;
  published_content_url: string;
  product_image: File | null;
  product_image_preview: string;
}

interface BatchListingFormProps {
  authVideo: AuthVideo;
  onListingsCreated: () => void;
  onCancel: () => void;
}

export default function BatchListingForm({ authVideo, onListingsCreated, onCancel }: BatchListingFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<ListingItem[]>([
    {
      title: '',
      description: '',
      category_id: '',
      starting_price: '',
      buy_now_price: '',
      reserve_price: '',
      condition: 'good',
      duration_days: 7,
      item_position_in_video: 1,
      video_timestamp_start: null,
      video_timestamp_end: null,
      published_content_url: '',
      product_image: null,
      product_image_preview: '',
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const addListing = () => {
    if (listings.length >= authVideo.max_items_allowed - authVideo.declared_items_count) {
      setError(`Maximum ${authVideo.max_items_allowed - authVideo.declared_items_count} items allowed`);
      return;
    }

    setListings([...listings, {
      title: '',
      description: '',
      category_id: '',
      starting_price: '',
      buy_now_price: '',
      reserve_price: '',
      condition: 'good',
      duration_days: 7,
      item_position_in_video: listings.length + 1,
      video_timestamp_start: null,
      video_timestamp_end: null,
      published_content_url: '',
      product_image: null,
      product_image_preview: '',
    }]);
  };

  const removeListing = (index: number) => {
    const newListings = listings.filter((_, i) => i !== index);
    newListings.forEach((listing, i) => {
      listing.item_position_in_video = i + 1;
    });
    setListings(newListings);
    delete fileInputRefs.current[index];
  };

  const updateListing = useCallback((index: number, field: keyof ListingItem, value: string | number | null | File) => {
    setListings(prev => {
      const newListings = [...prev];
      newListings[index] = { ...newListings[index], [field]: value };
      return newListings;
    });
  }, []);

  const handleImageSelect = useCallback((index: number, file: File | null) => {
    console.log('handleImageSelect called:', { index, file: file?.name, size: file?.size });
    
    if (!file) {
      updateListing(index, 'product_image', null);
      updateListing(index, 'product_image_preview', '');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image must be smaller than 10MB');
      return;
    }

    // Clear any existing error
    setError('');
    
    // Set the file first
    updateListing(index, 'product_image', file);
    console.log('Set product_image for index', index, file.name);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      updateListing(index, 'product_image_preview', preview);
      console.log('Set preview for index', index, 'preview length:', preview.length);
    };
    reader.readAsDataURL(file);
  }, [updateListing]);

  const createRefCallback = useCallback((index: number) => {
    return (el: HTMLInputElement | null) => {
      fileInputRefs.current[index] = el;
      console.log(`Set ref for input ${index}:`, el ? 'INPUT_ELEMENT' : 'null');
    };
  }, []);

  const validateListings = () => {
    console.log('Validating listings:', listings.map(l => ({ 
      title: l.title, 
      hasImage: !!l.product_image,
      imageName: l.product_image?.name 
    })));
    
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      
      if (!listing.title.trim()) {
        setError(`Item ${i + 1}: Title is required`);
        return false;
      }
      if (!listing.description.trim()) {
        setError(`Item ${i + 1}: Description is required`);
        return false;
      }
      if (!listing.starting_price || isNaN(parseFloat(listing.starting_price)) || parseFloat(listing.starting_price) <= 0) {
        setError(`Item ${i + 1}: Valid starting price is required`);
        return false;
      }
      if (!listing.published_content_url.trim()) {
        setError(`Item ${i + 1}: Published content URL is required`);
        return false;
      }
      if (!listing.product_image) {
        console.log(`No product image for listing ${i + 1}`, listing.product_image);
        setError(`Item ${i + 1}: Product image is required`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateListings()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('auth_video_id', authVideo.id);
      
      listings.forEach((listing, index) => {
        formData.append(`listings[${index}][title]`, listing.title);
        formData.append(`listings[${index}][description]`, listing.description);
        formData.append(`listings[${index}][category_id]`, listing.category_id);
        formData.append(`listings[${index}][starting_price]`, listing.starting_price);
        formData.append(`listings[${index}][buy_now_price]`, listing.buy_now_price);
        formData.append(`listings[${index}][reserve_price]`, listing.reserve_price);
        formData.append(`listings[${index}][condition]`, listing.condition);
        formData.append(`listings[${index}][duration_days]`, listing.duration_days.toString());
        formData.append(`listings[${index}][item_position_in_video]`, listing.item_position_in_video.toString());
        formData.append(`listings[${index}][video_timestamp_start]`, listing.video_timestamp_start?.toString() || '');
        formData.append(`listings[${index}][video_timestamp_end]`, listing.video_timestamp_end?.toString() || '');
        formData.append(`listings[${index}][published_content_url]`, listing.published_content_url);
        
        if (listing.product_image) {
          formData.append(`images[${index}]`, listing.product_image);
          console.log(`Added image ${index}:`, listing.product_image.name);
        }
      });

      const response = await fetch('/api/creator-verification/batch-listings', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onListingsCreated();
      } else {
        setError(data.error || 'Failed to create listings');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to create listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 mb-8 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-32 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
        
        <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Create Authenticated Listings</h2>
        
        {/* Compact Video Info Section */}
        <div className="relative bg-violet-950/30 backdrop-blur-sm border border-violet-800/30 rounded-lg p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
          <div className="relative">
            <h3 className="font-semibold text-violet-300 mb-4 tracking-wide uppercase text-sm">Authentication Video</h3>
            
            {/* Compact horizontal layout */}
            <div className="flex gap-6 items-start">
              {/* Better sized video with proper aspect ratio */}
              <div className="flex-shrink-0">
                <video
                  controls
                  className="w-80 h-48 rounded-lg border border-violet-700/50"
                  src={authVideo.video_url}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              
              {/* Better organized video details */}
              <div className="flex-1 space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                      <p className="text-violet-300 font-medium text-xs uppercase tracking-wider">Declaration</p>
                    </div>
                    <p className="text-violet-200 text-sm leading-relaxed pl-4">{authVideo.declaration_text}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-violet-800/30">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-violet-300 font-medium text-xs uppercase tracking-wider">Available:</span>
                      <span className="text-emerald-300 text-sm font-semibold">{authVideo.max_items_allowed - authVideo.declared_items_count} items remaining</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-violet-300 font-medium text-xs uppercase tracking-wider">Status:</span>
                      <span className="text-emerald-300 text-sm font-semibold capitalize">{authVideo.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="relative bg-red-950/50 backdrop-blur-sm border border-red-800/50 rounded-lg p-4 mb-6 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent"></div>
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-300 text-xs mt-2 transition-colors duration-300"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-8">
        {listings.map((listing, index) => (
          <div key={index} className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-emerald-500/5 rounded-2xl blur-xl"></div>
            <div className="relative bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8">
              
              {/* Item Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-500/20 border border-violet-500/30 rounded-lg flex items-center justify-center">
                    <span className="text-violet-300 font-bold text-sm">{index + 1}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Item {index + 1}</h3>
                </div>
                {listings.length > 1 && (
                  <button
                    onClick={() => removeListing(index)}
                    className="group relative overflow-hidden border border-red-500/40 hover:border-red-400/80 bg-zinc-950/90 px-3 py-1 rounded-lg transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative text-red-400 group-hover:text-red-300 text-sm font-medium tracking-wider">Remove</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Details */}
                <div className="space-y-6">
                  
                  {/* Product Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-3">
                      Product Image *
                    </label>
                    
                    <input
                      type="file"
                      ref={createRefCallback(index)}
                      onChange={(e) => handleImageSelect(index, e.target.files?.[0] || null)}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {listing.product_image_preview ? (
                      <div className="relative">
                        <div className="relative w-full h-48 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700">
                          <Image
                            src={listing.product_image_preview}
                            alt={`Product ${index + 1}`}
                            fill
                            className="object-contain"
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                        <button
                          onClick={() => fileInputRefs.current[index]?.click()}
                          className="mt-3 w-full group relative overflow-hidden border border-zinc-700/50 hover:border-zinc-600/80 bg-zinc-950/90 px-4 py-2 rounded-lg transition-all duration-300 text-sm"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <span className="relative text-zinc-300 group-hover:text-white font-medium tracking-wider">CHANGE IMAGE</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRefs.current[index]?.click()}
                        className="w-full h-48 bg-zinc-900/50 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center hover:border-zinc-600 transition-colors"
                      >
                        <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-zinc-400 text-sm font-medium">Click to upload product image</p>
                        <p className="text-zinc-500 text-xs mt-1">JPG, PNG, or WebP up to 10MB</p>
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Item Title *
                    </label>
                    <input
                      type="text"
                      value={listing.title}
                      onChange={(e) => updateListing(index, 'title', e.target.value)}
                      placeholder="e.g., Vintage Nike Air Jordan 1"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={listing.category_id}
                      onChange={(e) => updateListing(index, 'category_id', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                      required
                    >
                      <option value="" className="bg-zinc-800">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id} className="bg-zinc-800">
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={listing.description}
                      onChange={(e) => updateListing(index, 'description', e.target.value)}
                      placeholder="Describe the item's condition, size, unique features, etc."
                      rows={4}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
                      required
                    />
                  </div>
                </div>

                {/* Right Column - Pricing & Authentication */}
                <div className="space-y-6">
                  
                  {/* Pricing Section */}
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                      Pricing
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                          Starting Price ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={listing.starting_price}
                          onChange={(e) => updateListing(index, 'starting_price', e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                          Buy Now Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={listing.buy_now_price}
                          onChange={(e) => updateListing(index, 'buy_now_price', e.target.value)}
                          placeholder="Optional"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Condition *
                          </label>
                          <select
                            value={listing.condition}
                            onChange={(e) => updateListing(index, 'condition', e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                            required
                          >
                            <option value="new" className="bg-zinc-800">New</option>
                            <option value="like_new" className="bg-zinc-800">Like New</option>
                            <option value="good" className="bg-zinc-800">Good</option>
                            <option value="fair" className="bg-zinc-800">Fair</option>
                            <option value="poor" className="bg-zinc-800">Poor</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Duration
                          </label>
                          <select
                            value={listing.duration_days}
                            onChange={(e) => updateListing(index, 'duration_days', parseInt(e.target.value))}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                          >
                            <option value={1} className="bg-zinc-800">1 Day</option>
                            <option value={3} className="bg-zinc-800">3 Days</option>
                            <option value={7} className="bg-zinc-800">7 Days</option>
                            <option value={10} className="bg-zinc-800">10 Days</option>
                            <option value={14} className="bg-zinc-800">14 Days</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video Authentication Details - Fixed uniform styling */}
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      Video Authentication Details
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Published Content URL - Fixed styling */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                          Published Content URL *
                        </label>
                        <input
                          type="url"
                          value={listing.published_content_url}
                          onChange={(e) => updateListing(index, 'published_content_url', e.target.value)}
                          placeholder="https://youtube.com/watch?v=... or https://twitch.tv/videos/..."
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                          required
                        />
                        <p className="text-xs text-zinc-500 mt-1">
                          Link to where this item appeared in your content
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Start (seconds)
                          </label>
                          <input
                            type="number"
                            value={listing.video_timestamp_start || ''}
                            onChange={(e) => updateListing(index, 'video_timestamp_start', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="e.g., 15"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">
                            End (seconds)
                          </label>
                          <input
                            type="number"
                            value={listing.video_timestamp_end || ''}
                            onChange={(e) => updateListing(index, 'video_timestamp_end', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="e.g., 30"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Item Button - Properly aligned */}
        {listings.length < authVideo.max_items_allowed - authVideo.declared_items_count && (
          <div className="flex justify-center">
            <button
              onClick={addListing}
              className="group relative overflow-hidden border border-violet-500/40 hover:border-violet-400/80 bg-zinc-950/90 px-6 py-3 rounded-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative text-violet-300 group-hover:text-white font-medium tracking-wider">+ Add Another Item</span>
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent rounded-2xl blur-xl"></div>
            <div className="relative bg-zinc-950/80 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Properly aligned */}
        <div className="flex gap-4 justify-center pt-8">
          <button
            onClick={onCancel}
            disabled={loading}
            className="group relative overflow-hidden border border-zinc-700/50 hover:border-zinc-600/80 bg-zinc-950/90 px-8 py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative text-zinc-300 group-hover:text-white font-medium tracking-wider">Cancel</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="group relative overflow-hidden border border-emerald-500/40 hover:border-emerald-400/80 bg-zinc-950/90 px-8 py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative text-emerald-300 group-hover:text-white font-medium tracking-wider">
              {loading ? 'Creating...' : `Create ${listings.length} Authenticated Listing${listings.length > 1 ? 's' : ''}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
} 
