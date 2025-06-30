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
  
  // Upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
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

  // Handle file selection (without immediate processing)
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > 10 * 1024 * 1024) return false; // 10MB limit
      return true;
    });

    if (validFiles.length !== fileArray.length) {
      setError('Some files were skipped (only images under 10MB are allowed)');
    } else {
      setError('');
    }

    // Append to existing files instead of replacing
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Update batch mode based on total files
    const totalFiles = selectedFiles.length + validFiles.length;
    setBatchMode(totalFiles > 1);
    
    // Create previews for new files and append to existing previews
    const newPreviews: string[] = [];
    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews[index] = e.target.result as string;
          if (newPreviews.filter(p => p).length === validFiles.length) {
            setImagePreviews(prev => [...prev, ...newPreviews]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Remove a specific file
  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
    setBatchMode(newFiles.length > 1);
    
    if (newFiles.length === 0) {
      setError('');
    }
  };

  // Process images with AI (when user clicks Next)
  const handleProcessImages = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      // Create form data for API
      const formData = new FormData();
      selectedFiles.forEach(file => {
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
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const result = results[i];
        const preview = imagePreviews[i];
        
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
        <div className="max-w-4xl mx-auto">
          
          {/* STEP 1: Upload Images */}
          {currentStep === 'upload' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">Upload Your Item Images</h2>
                <p className="text-zinc-400 mb-8">
                  Upload one image for a single auction, or multiple images to create several auctions at once.
                  Our AI will analyze each image and suggest titles, descriptions, and categories.
                </p>
              </div>

              {/* File Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  dragActive 
                    ? 'border-violet-500 bg-violet-500/5' 
                    : selectedFiles.length > 0 
                    ? 'border-zinc-600 bg-zinc-900/50' 
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  id="image-upload"
                  disabled={analyzing}
                />
                
                {selectedFiles.length === 0 ? (
                  <label htmlFor="image-upload" className="cursor-pointer block">
                    <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">
                      Drop images here or click to upload
                    </h3>
                    <p className="text-zinc-400">
                      JPG, PNG, WebP up to 10MB each
                    </p>
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-zinc-300">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{selectedFiles.length} image{selectedFiles.length > 1 ? 's' : ''} selected</span>
                    </div>
                    
                    <label htmlFor="image-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm cursor-pointer transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add more images
                    </label>
                  </div>
                )}
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Preview ({imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square relative rounded-lg overflow-hidden bg-zinc-900">
                          <Image
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          
                          {/* Remove button */}
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* File info */}
                        <div className="mt-2 text-xs text-zinc-400 truncate">
                          {selectedFiles[index]?.name}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mode indicator */}
                  {batchMode && (
                    <div className="bg-violet-900/20 border border-violet-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-violet-300">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Batch Mode Enabled</span>
                      </div>
                      <p className="text-sm text-violet-200 mt-1">
                        Multiple images detected. Each image will become a separate auction listing.
                      </p>
                    </div>
                  )}

                  {/* Next button */}
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleProcessImages}
                      disabled={analyzing || selectedFiles.length === 0}
                      className="bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      {analyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          Continue to Review
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
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
