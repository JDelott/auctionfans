'use client';

import { useState, useEffect } from 'react';

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
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    }]);
  };

  const removeListing = (index: number) => {
    const newListings = listings.filter((_, i) => i !== index);
    // Update item positions
    newListings.forEach((listing, i) => {
      listing.item_position_in_video = i + 1;
    });
    setListings(newListings);
  };

  const updateListing = (index: number, field: keyof ListingItem, value: string | number | null) => {
    const newListings = [...listings];
    newListings[index] = { ...newListings[index], [field]: value };
    setListings(newListings);
  };

  const validateListings = () => {
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
      const response = await fetch('/api/creator-verification/batch-listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_video_id: authVideo.id,
          listings: listings
        }),
      });

      const data = await response.json();

      if (data.success) {
        onListingsCreated();
      } else {
        setError(data.error || 'Failed to create listings');
      }
    } catch {
      setError('Failed to create listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Create Authenticated Listings</h2>
        
        {/* Auth Video Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Authentication Video</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <video
                controls
                className="w-full rounded-lg"
                src={authVideo.video_url}
              />
            </div>
            <div>
              <p className="text-blue-800 mb-2">
                <strong>Declaration:</strong> {authVideo.declaration_text}
              </p>
              <p className="text-blue-800 mb-2">
                <strong>Items Available:</strong> {authVideo.max_items_allowed - authVideo.declared_items_count} remaining
              </p>
              <p className="text-blue-800">
                <strong>Status:</strong> <span className="capitalize">{authVideo.status}</span>
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Listings Form */}
        <div className="space-y-6">
          {listings.map((listing, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Item {index + 1}</h3>
                {listings.length > 1 && (
                  <button
                    onClick={() => removeListing(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove Item
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Title *
                  </label>
                  <input
                    type="text"
                    value={listing.title}
                    onChange={(e) => updateListing(index, 'title', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Vintage Nike Air Jordan 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={listing.category_id}
                    onChange={(e) => updateListing(index, 'category_id', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={listing.description}
                    onChange={(e) => updateListing(index, 'description', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the item's condition, size, unique features, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={listing.starting_price}
                    onChange={(e) => updateListing(index, 'starting_price', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buy Now Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={listing.buy_now_price}
                    onChange={(e) => updateListing(index, 'buy_now_price', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition *
                  </label>
                  <select
                    value={listing.condition}
                    onChange={(e) => updateListing(index, 'condition', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auction Duration
                  </label>
                  <select
                    value={listing.duration_days}
                    onChange={(e) => updateListing(index, 'duration_days', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 Day</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days</option>
                    <option value={10}>10 Days</option>
                    <option value={14}>14 Days</option>
                  </select>
                </div>

                {/* Video Timestamp Section */}
                <div className="md:col-span-2 border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Video Authentication Details</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        When does this item appear in the video? (seconds)
                      </label>
                      <input
                        type="number"
                        value={listing.video_timestamp_start || ''}
                        onChange={(e) => updateListing(index, 'video_timestamp_start', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 15"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        When does it end? (seconds)
                      </label>
                      <input
                        type="number"
                        value={listing.video_timestamp_end || ''}
                        onChange={(e) => updateListing(index, 'video_timestamp_end', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 30"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Item Button */}
        {listings.length < (authVideo.max_items_allowed - authVideo.declared_items_count) && (
          <button
            onClick={addListing}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            + Add Another Item
          </button>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || listings.length === 0}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Listings...' : `Create ${listings.length} Authenticated Listing${listings.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
} 
