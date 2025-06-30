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
        
        <div className="relative bg-violet-950/30 backdrop-blur-sm border border-violet-800/30 rounded-lg p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
          <div className="relative">
            <h3 className="font-semibold text-violet-300 mb-3 tracking-wide uppercase text-sm">Authentication Video</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <video
                  controls
                  className="w-full rounded-lg border border-violet-700/50"
                  src={authVideo.video_url}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-violet-400 rounded-full"></div>
                  <p className="text-violet-200 text-sm">
                    <span className="text-violet-300 font-medium">Declaration:</span> {authVideo.declaration_text}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                  <p className="text-violet-200 text-sm">
                    <span className="text-violet-300 font-medium">Items Available:</span> {authVideo.max_items_allowed - authVideo.declared_items_count} remaining
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                  <p className="text-violet-200 text-sm">
                    <span className="text-violet-300 font-medium">Status:</span> <span className="capitalize text-emerald-300">{authVideo.status}</span>
                  </p>
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

      <div className="space-y-6">
        {listings.map((listing, index) => (
          <div key={index} className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 overflow-hidden">
            <div className="absolute top-0 right-1/4 w-16 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white tracking-tight">Item {index + 1}</h3>
              {listings.length > 1 && (
                <button
                  onClick={() => removeListing(index)}
                  className="text-red-400 hover:text-red-300 text-sm transition-colors duration-300"
                >
                  Remove Item
                </button>
              )}
            </div>

            <div className="grid gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-3 tracking-wide uppercase">
                  Product Image *
                  {listing.product_image && (
                    <span className="text-emerald-400 text-xs ml-2">
                      ✓ {listing.product_image.name} ({Math.round(listing.product_image.size / 1024)}KB)
                    </span>
                  )}
                </label>
                <div
                  onClick={() => {
                    console.log('Div clicked, triggering file input', index);
                    fileInputRefs.current[index]?.click();
                  }}
                  className="group relative border-2 border-dashed border-zinc-700/50 hover:border-emerald-500/50 rounded-lg p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {listing.product_image_preview ? (
                    <div className="relative">
                      <Image 
                        src={listing.product_image_preview} 
                        alt="Product preview" 
                        width={200}
                        height={200}
                        className="max-h-48 mx-auto rounded-lg border border-zinc-700/50 object-contain"
                        unoptimized
                      />
                      <div className="mt-3 text-emerald-400 text-sm font-medium tracking-wide">
                        Image uploaded - click to change
                      </div>
                    </div>
                  ) : (
                    <div className="relative space-y-3">
                      <div className="w-4 h-4 bg-emerald-500/40 rounded-full mx-auto group-hover:bg-emerald-400/60 transition-colors duration-300"></div>
                      <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 tracking-wide">
                        Click to upload product image
                      </p>
                      <p className="text-zinc-600 text-xs">JPG, PNG, or GIF up to 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={createRefCallback(index)}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    console.log(`File input ${index} changed:`, file?.name);
                    handleImageSelect(index, file);
                  }}
                  className="hidden"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 tracking-wide uppercase">
                    Item Title *
                  </label>
                  <input
                    type="text"
                    value={listing.title}
                    onChange={(e) => updateListing(index, 'title', e.target.value)}
                    className="w-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
                    placeholder="e.g., Vintage Nike Air Jordan 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 tracking-wide uppercase">
                    Category
                  </label>
                  <select
                    value={listing.category_id}
                    onChange={(e) => updateListing(index, 'category_id', e.target.value)}
                    className="w-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-2 tracking-wide uppercase">
                    Description *
                  </label>
                  <textarea
                    value={listing.description}
                    onChange={(e) => updateListing(index, 'description', e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
                    placeholder="Describe the item's condition, size, unique features, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 tracking-wide uppercase">
                    Starting Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={listing.starting_price}
                    onChange={(e) => updateListing(index, 'starting_price', e.target.value)}
                    className="w-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 tracking-wide uppercase">
                    Buy Now Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={listing.buy_now_price}
                    onChange={(e) => updateListing(index, 'buy_now_price', e.target.value)}
                    className="w-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 tracking-wide uppercase">
                    Condition *
                  </label>
                  <select
                    value={listing.condition}
                    onChange={(e) => updateListing(index, 'condition', e.target.value)}
                    className="w-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
                  >
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 tracking-wide uppercase">
                    Auction Duration
                  </label>
                  <select
                    value={listing.duration_days}
                    onChange={(e) => updateListing(index, 'duration_days', parseInt(e.target.value))}
                    className="w-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
                  >
                    <option value={1}>1 Day</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days</option>
                    <option value={10}>10 Days</option>
                    <option value={14}>14 Days</option>
                  </select>
                </div>

                <div className="md:col-span-2 border-t border-zinc-700/50 pt-4 mt-4">
                  <h4 className="font-medium text-white mb-3 tracking-wide uppercase text-sm">Video Authentication Details</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">
                        When does this item appear in the video? (seconds)
                      </label>
                      <input
                        type="number"
                        value={listing.video_timestamp_start || ''}
                        onChange={(e) => updateListing(index, 'video_timestamp_start', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-300"
                        placeholder="e.g., 15"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">
                        When does it end? (seconds)
                      </label>
                      <input
                        type="number"
                        value={listing.video_timestamp_end || ''}
                        onChange={(e) => updateListing(index, 'video_timestamp_end', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-300"
                        placeholder="e.g., 30"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {listings.length < (authVideo.max_items_allowed - authVideo.declared_items_count) && (
        <button
          onClick={addListing}
          className="w-full border-2 border-dashed border-zinc-700/50 hover:border-emerald-500/50 rounded-lg py-6 text-zinc-400 hover:text-emerald-300 transition-all duration-300"
        >
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-emerald-500/40 rounded-full"></div>
            <span className="font-medium tracking-wide">Add Another Item</span>
          </div>
        </button>
      )}

      <div className="flex gap-4 mt-8">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 hover:border-zinc-600/50 text-white rounded-lg transition-all duration-300 tracking-wide"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || listings.length === 0}
          className="flex-1 group relative overflow-hidden border border-emerald-500/40 hover:border-emerald-400/80 bg-zinc-950/90 disabled:border-zinc-700/50 disabled:bg-zinc-800/50 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className={`relative tracking-wider ${loading || listings.length === 0 ? 'text-zinc-500' : 'text-emerald-300 group-hover:text-white'}`}>
            {loading ? 'Creating Listings...' : `Create ${listings.length} Authenticated Listing${listings.length > 1 ? 's' : ''}`}
          </span>
        </button>
      </div>
    </div>
  );
} 
