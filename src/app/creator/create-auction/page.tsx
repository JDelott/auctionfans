'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { type BatchItem, type Category, newStepConfig, type FormStep } from '@/lib/auction-forms/types';
import { BatchItemEditor } from '@/components/auction/BatchItemEditor';
import { BatchVoiceControl } from '@/components/auction/BatchVoiceControl';

export default function CreateAuctionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<FormStep>('upload');
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Batch/Single mode toggle
  const [batchMode, setBatchMode] = useState(false);
  const [items, setItems] = useState<BatchItem[]>([]);
  
  // Processing states
  const [analyzing, setAnalyzing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Handle image upload and AI analysis
  const handleImagesUpload = async (files: FileList) => {
    setAnalyzing(true);
    setError('');

    try {
      // Create form data for API
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      // Send to AI analysis
      const response = await fetch('/api/auctions/analyze-images', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to analyze images');
      }

      const { results } = await response.json();

      // Create batch items from results
      const newItems: BatchItem[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = results[i];
        
        // Create image preview
        const preview = URL.createObjectURL(file);
        
        // Find category ID
        const category = categories.find(cat => 
          cat.name.toLowerCase().includes(result.analysis.category.toLowerCase())
        );

        newItems.push({
          id: `item-${Date.now()}-${i}`,
          imageFile: file,
          imagePreview: preview,
          title: result.analysis.title,
          description: result.analysis.description,
          category_id: category?.id || '',
          condition: result.analysis.condition,
          starting_price: '10.00',
          reserve_price: '',
          buy_now_price: '',
          video_url: '',
          video_timestamp: '',
          duration_days: '7',
          images: true,
          aiAnalyzed: true,
          aiConfidence: result.analysis.confidence
        });
      }

      setItems(newItems);
      setBatchMode(files.length > 1);
      setCurrentStep('review_edit');
      
    } catch (error) {
      console.error('Error analyzing images:', error);
      setError('Failed to analyze images. Please try again.');
    }
    
    setAnalyzing(false);
  };

  // Handle single item updates
  const updateItem = (itemId: string, updates: Partial<BatchItem>) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  // Handle batch updates
  const updateAllItems = (updates: Partial<BatchItem>) => {
    setItems(prev => prev.map(item => ({ ...item, ...updates })));
  };

  // Handle publishing
  const handlePublish = async () => {
    setPublishing(true);
    setError('');

    try {
      const publishPromises = items.map(async (item) => {
        // Create auction
        const auctionData = {
          title: item.title,
          description: item.description,
          category_id: item.category_id,
          condition: item.condition,
          starting_price: parseFloat(item.starting_price),
          reserve_price: item.reserve_price ? parseFloat(item.reserve_price) : null,
          buy_now_price: item.buy_now_price ? parseFloat(item.buy_now_price) : null,
          video_url: item.video_url || null,
          video_timestamp: item.video_timestamp ? parseInt(item.video_timestamp) : null,
          duration_days: parseInt(item.duration_days) || 7
        };

        const response = await fetch('/api/auctions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auctionData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create auction for ${item.title}`);
        }

        const { auction } = await response.json();

        // Upload image
        const imageFormData = new FormData();
        imageFormData.append('images', item.imageFile);
        imageFormData.append('isPrimary_0', 'true');

        await fetch(`/api/auctions/${auction.id}/images`, {
          method: 'POST',
          body: imageFormData,
        });

        return auction;
      });

      const createdAuctions = await Promise.all(publishPromises);
      
      // Navigate to success or auction list
      if (createdAuctions.length === 1) {
        router.push(`/auctions/${createdAuctions[0].id}`);
      } else {
        router.push('/creator/auctions');
      }
      
    } catch (error) {
      console.error('Error publishing auctions:', error);
      setError('Failed to publish some auctions. Please try again.');
    }
    
    setPublishing(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Auction Listing</h1>
          <div className="text-zinc-400">
            {newStepConfig[currentStep].title}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-zinc-800 rounded-full h-2 mt-4">
            <div 
              className="bg-violet-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${newStepConfig[currentStep].progress}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="max-w-6xl mx-auto">
          
          {/* STEP 1: Upload Images */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">Upload Your Item Images</h2>
                <p className="text-zinc-400 mb-8">
                  Upload one image for a single auction, or multiple images to create several auctions at once.
                  Our AI will analyze each image and suggest titles, descriptions, and categories.
                </p>
              </div>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-12 text-center hover:border-violet-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && handleImagesUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                  disabled={analyzing}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="text-6xl mb-4">📸</div>
                  <h3 className="text-xl font-semibold mb-2">
                    {analyzing ? 'Analyzing Images...' : 'Drop images here or click to upload'}
                  </h3>
                  <p className="text-zinc-400">
                    Support for JPG, PNG, WebP • Max 10MB per image
                  </p>
                  {analyzing && (
                    <div className="mt-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto"></div>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: Review & Edit Items */}
          {currentStep === 'review_edit' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">
                  Review Your Items ({items.length})
                </h2>
                <div className="text-sm text-zinc-400">
                  AI analyzed • Use voice or edit any field
                </div>
              </div>

              {/* Batch Voice Control */}
              {batchMode && (
                <BatchVoiceControl
                  items={items}
                  categories={categories}
                  onBatchUpdate={updateAllItems}
                  onItemUpdate={updateItem}
                />
              )}

              {/* Items List */}
              <div className="space-y-4">
                {items.map((item) => (
                  <BatchItemEditor
                    key={item.id}
                    item={item}
                    categories={categories}
                    onItemUpdate={updateItem}
                  />
                ))}
              </div>

              <div className="flex justify-center pt-6">
                <button
                  onClick={() => setCurrentStep('publish')}
                  className="bg-violet-500 hover:bg-violet-600 px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  Review & Publish →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Publish */}
          {currentStep === 'publish' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center">Ready to Publish Your Auctions</h2>
              
              <div className="bg-zinc-900 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Summary</h3>
                <div className="grid gap-4">
                  <div className="text-sm text-zinc-400">
                    You&apos;re about to create <span className="text-white font-semibold">{items.length} auction{items.length > 1 ? 's' : ''}</span>
                  </div>
                  
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 py-2 border-b border-zinc-800 last:border-b-0">
                      <div className="w-12 h-12 relative rounded overflow-hidden">
                        <Image
                          src={item.imagePreview}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-zinc-400">
                          Starting: ${item.starting_price} • Duration: {item.duration_days} days
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setCurrentStep('review_edit')}
                  className="bg-zinc-700 hover:bg-zinc-600 px-8 py-3 rounded-lg font-semibold transition-colors"
                  disabled={publishing}
                >
                  ← Back to Review
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  {publishing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Publishing...
                    </div>
                  ) : (
                    `Publish ${items.length} Auction${items.length > 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
