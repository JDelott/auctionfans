'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { VoiceMicButton } from '@/components/auction/VoiceMicButton';
import { SmartFormField } from '@/components/auction/SmartFormField';
import { useFormSteps } from '@/lib/hooks/useFormSteps';
import { validateBasicInfo, validatePricing, validateImages } from '@/lib/auction-forms/validation';
import { type AuctionFormData, type Category } from '@/lib/auction-forms/types';

export default function CreateAuctionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { currentStep, nextStep, prevStep, stepConfig } = useFormSteps();

  // Form States
  const [formData, setFormData] = useState<AuctionFormData>({
    title: '',
    description: '',
    category_id: '',
    condition: 'new',
    starting_price: '',
    reserve_price: '',
    buy_now_price: '',
    video_url: '',
    video_timestamp: '',
    duration_days: '7',
    images: false
  });

  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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

  // Handle input changes
  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form updates from voice input
  const handleFormUpdate = (updates: Partial<AuctionFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear any validation errors when voice input successfully updates the form
    if (Object.keys(updates).length > 0) {
      setError('');
    }
  };

  // Handle image changes  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedImages(files);
      setFormData(prev => ({ ...prev, images: files.length > 0 }));
      
      // Create image previews
      const previews: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            previews.push(e.target.result as string);
            if (previews.length === files.length) {
              setImagePreviews(previews);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Enhanced nextStep function with step-specific validation
  const handleNextStep = () => {
    const validation = (() => {
      switch (currentStep) {
        case 'basic_info': return validateBasicInfo(formData);
        case 'pricing': return validatePricing(formData);
        case 'video': return { isValid: true, missingFields: [] }; // Optional
        case 'images': return validateImages(selectedImages);
        default: return { isValid: true, missingFields: [] };
      }
    })();

    if (!validation.isValid) {
      setError(`Please complete the required fields: ${validation.missingFields.join(', ')}`);
      return;
    }

    setError('');
    nextStep();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError('');

    try {
      // Create auction
      const auctionData = {
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id,
        condition: formData.condition,
        starting_price: parseFloat(formData.starting_price),
        reserve_price: formData.reserve_price ? parseFloat(formData.reserve_price) : null,
        buy_now_price: formData.buy_now_price ? parseFloat(formData.buy_now_price) : null,
        video_url: formData.video_url || null,
        video_timestamp: formData.video_timestamp ? parseInt(formData.video_timestamp) : null,
        duration_days: parseInt(formData.duration_days) || 7
      };

      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auctionData),
      });

      if (response.ok) {
        const { auction } = await response.json();

        // Upload images if any
        if (selectedImages && selectedImages.length > 0) {
          const imageFormData = new FormData();
          Array.from(selectedImages).forEach((file, index) => {
            imageFormData.append('images', file);
            imageFormData.append(`isPrimary_${index}`, index === 0 ? 'true' : 'false');
          });

          await fetch(`/api/auctions/${auction.id}/images`, {
            method: 'POST',
            body: imageFormData,
          });
        }

        router.push(`/auctions/${auction.id}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create auction');
      }
    } catch (error) {
      console.error('Error creating auction:', error);
      setError('Failed to create auction. Please try again.');
    }

    setSubmitting(false);
  };

  // Redirect if not authenticated
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
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-zinc-400 hover:text-white transition-colors mb-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create New Auction</h1>
          <p className="text-zinc-400">List an authentic item from your content</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Progress Indicator */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-4">
            <div className="flex items-center justify-between text-sm">
              {Object.entries(stepConfig).map(([step, config], index) => {
                if (step === 'welcome') return null;
                const isActive = currentStep === step;
                const isCompleted = (() => {
                  switch (step) {
                    case 'basic_info': return validateBasicInfo(formData).isValid;
                    case 'pricing': return validatePricing(formData).isValid;
                    case 'video': return !!formData.video_url;
                    case 'images': return validateImages(selectedImages).isValid;
                    case 'review': return false;
                    default: return false;
                  }
                })();
                
                return (
                  <div key={step} className={`flex items-center ${
                    isActive ? 'text-violet-400' : 
                    isCompleted ? 'text-green-400' : 'text-zinc-500'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isActive ? 'bg-violet-600' : 
                      isCompleted ? 'bg-green-600' : 'bg-zinc-700'
                    }`}>
                      {isCompleted ? '✓' : index}
                    </div>
                    <span className="ml-2 hidden sm:inline">{config.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form sections */}
          {currentStep === 'basic_info' && (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 relative">
              {/* Voice Mic Button in corner */}
              <div className="absolute top-4 right-4">
                <VoiceMicButton 
                  onFormUpdate={handleFormUpdate}
                  categories={categories}
                  currentFormData={formData}
                />
              </div>

              <h3 className="text-xl font-semibold mb-6">Basic Information</h3>
              
              <div className="space-y-4">
                <SmartFormField
                  label="Item Title"
                  name="title"
                  value={formData.title}
                  onChange={(value) => handleInputChange('title', value)}
                  placeholder="Enter a descriptive title for your item"
                  required
                  categories={categories}
                  currentFormData={formData}
                />

                <SmartFormField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={(value) => handleInputChange('description', value)}
                  type="textarea"
                  placeholder="Describe your item in detail - what is it, where did you get it, what makes it special?"
                  required
                  categories={categories}
                  currentFormData={formData}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SmartFormField
                    label="Category"
                    name="category_id"
                    value={formData.category_id}
                    onChange={(value) => handleInputChange('category_id', value)}
                    type="select"
                    required
                    options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                    categories={categories}
                    currentFormData={formData}
                  />

                  <SmartFormField
                    label="Condition"
                    name="condition"
                    value={formData.condition}
                    onChange={(value) => handleInputChange('condition', value)}
                    type="select"
                    required
                    options={[
                      { value: 'New', label: 'New' },
                      { value: 'Used - Excellent', label: 'Used - Excellent' },
                      { value: 'Used - Good', label: 'Used - Good' },
                      { value: 'Used - Fair', label: 'Used - Fair' }
                    ]}
                    categories={categories}
                    currentFormData={formData}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pricing Step */}
          {currentStep === 'pricing' && (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-6">Auction Pricing</h3>
              
              <div className="space-y-4">
                <SmartFormField
                  label="Starting Price ($)"
                  name="starting_price"
                  value={formData.starting_price}
                  onChange={(value) => handleInputChange('starting_price', value)}
                  type="number"
                  placeholder="25.00"
                  required
                  categories={categories}
                  currentFormData={formData}
                />

                <SmartFormField
                  label="Reserve Price ($)"
                  name="reserve_price"
                  value={formData.reserve_price}
                  onChange={(value) => handleInputChange('reserve_price', value)}
                  type="number"
                  placeholder="50.00"
                  categories={categories}
                  currentFormData={formData}
                />

                <SmartFormField
                  label="Buy Now Price ($)"
                  name="buy_now_price"
                  value={formData.buy_now_price}
                  onChange={(value) => handleInputChange('buy_now_price', value)}
                  type="number"
                  placeholder="100.00"
                  categories={categories}
                  currentFormData={formData}
                />

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Auction Duration
                  </label>
                  <select
                    name="duration_days"
                    value={formData.duration_days}
                    onChange={(e) => handleInputChange('duration_days', e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
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
          )}

          {/* Video Information Step */}
          {currentStep === 'video' && (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-6">Video Information (Optional)</h3>
              
              <div className="space-y-4">
                <SmartFormField
                  label="Video URL"
                  name="video_url"
                  value={formData.video_url}
                  onChange={(value) => handleInputChange('video_url', value)}
                  placeholder="https://youtube.com/watch?v=..."
                  categories={categories}
                  currentFormData={formData}
                />

                <SmartFormField
                  label="Video Timestamp (seconds)"
                  name="video_timestamp"
                  value={formData.video_timestamp}
                  onChange={(value) => handleInputChange('video_timestamp', value)}
                  type="number"
                  placeholder="120"
                  categories={categories}
                  currentFormData={formData}
                />
              </div>
            </div>
          )}

          {/* Images Step */}
          {currentStep === 'images' && (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-6">Images</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Upload Images *
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-32 object-cover rounded-lg border border-zinc-700"
                        />
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-violet-600 text-white text-xs px-2 py-1 rounded">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-6">Review & Submit</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Title:</span>
                    <p className="text-white">{formData.title || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Starting Price:</span>
                    <p className="text-white">${formData.starting_price || '0.00'}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Category:</span>
                    <p className="text-white">{categories.find(c => c.id === formData.category_id)?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Condition:</span>
                    <p className="text-white">{formData.condition}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 'basic_info'}
              className="bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
            >
              Previous
            </button>

            {currentStep === 'review' ? (
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-zinc-700 disabled:to-zinc-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
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
            ) : (
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
