'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BatchItem, Category } from '@/lib/auction-forms/types';
import { SmartFormField } from './SmartFormField';
import { VoiceMicButton } from './VoiceMicButton';
import { AIContextManager } from '@/lib/ai/context-manager';

interface BatchItemEditorProps {
  item: BatchItem;
  categories: Category[];
  onItemUpdate: (itemId: string, updates: Partial<BatchItem>) => void;
  contextManager?: AIContextManager;
  initialDescription?: string;
}

export function BatchItemEditor({ 
  item, 
  categories, 
  onItemUpdate, 
  contextManager, 
  initialDescription 
}: BatchItemEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFieldChange = (fieldName: string, value: string) => {
    onItemUpdate(item.id, { [fieldName]: value });
  };

  const handleVoiceUpdate = (updates: Partial<BatchItem>) => {
    onItemUpdate(item.id, updates);
  };

  // Convert BatchItem to AuctionFormData for compatibility
  const formData = {
    title: item.title,
    description: item.description,
    category_id: item.category_id,
    condition: item.condition,
    starting_price: item.starting_price,
    reserve_price: item.reserve_price,
    buy_now_price: item.buy_now_price,
    video_url: item.video_url,
    video_timestamp: item.video_timestamp,
    duration_days: item.duration_days,
    images: true
  };

  return (
    <div className="bg-zinc-900 rounded-lg overflow-hidden">
      {/* Header with Image and Basic Info */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex gap-4">
          <div className="w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={item.imagePreview}
              alt={item.title}
              fill
              className="object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <SmartFormField
                  label="Title"
                  name="title"
                  value={item.title}
                  onChange={(value) => handleFieldChange('title', value)}
                  categories={categories}
                  currentFormData={formData}
                  className="text-lg font-semibold"
                />
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <VoiceMicButton
                  onFormUpdate={handleVoiceUpdate}
                  categories={categories}
                  currentFormData={formData}
                  currentStep="review_edit"
                  contextManager={contextManager}
                  initialDescription={initialDescription}
                  itemId={item.id}
                />
                
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>
            </div>
            
            <div className="mt-2 text-sm text-zinc-400">
              Starting: ${item.starting_price} • {item.duration_days} days • {item.condition}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Description */}
          <div className="w-full">
            <SmartFormField
              label="Description"
              name="description"
              value={item.description}
              onChange={(value) => handleFieldChange('description', value)}
              type="textarea"
              categories={categories}
              currentFormData={formData}
            />
          </div>
          
          {/* Category and Condition Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SmartFormField
              label="Category"
              name="category_id"
              value={item.category_id}
              onChange={(value) => handleFieldChange('category_id', value)}
              type="select"
              options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
              categories={categories}
              currentFormData={formData}
            />
            
            <SmartFormField
              label="Condition"
              name="condition"
              value={item.condition}
              onChange={(value) => handleFieldChange('condition', value)}
              type="select"
              options={[
                { value: 'new', label: 'New' },
                { value: 'like-new', label: 'Like New' },
                { value: 'good', label: 'Good' },
                { value: 'fair', label: 'Fair' },
                { value: 'poor', label: 'Poor' }
              ]}
              categories={categories}
              currentFormData={formData}
            />
          </div>
          
          {/* Pricing Section */}
          <div className="border-t border-zinc-800 pt-6">
            <h4 className="text-sm font-medium text-zinc-300 mb-4">Pricing Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SmartFormField
                label="Starting Price ($)"
                name="starting_price"
                value={item.starting_price}
                onChange={(value) => handleFieldChange('starting_price', value)}
                type="number"
                categories={categories}
                currentFormData={formData}
                required
              />
              
              <SmartFormField
                label="Reserve Price ($)"
                name="reserve_price"
                value={item.reserve_price}
                onChange={(value) => handleFieldChange('reserve_price', value)}
                type="number"
                placeholder="Optional"
                categories={categories}
                currentFormData={formData}
              />
              
              <SmartFormField
                label="Buy It Now ($)"
                name="buy_now_price"
                value={item.buy_now_price}
                onChange={(value) => handleFieldChange('buy_now_price', value)}
                type="number"
                placeholder="Optional"
                categories={categories}
                currentFormData={formData}
              />
              
              <SmartFormField
                label="Duration (days)"
                name="duration_days"
                value={item.duration_days}
                onChange={(value) => handleFieldChange('duration_days', value)}
                type="select"
                options={[
                  { value: '1', label: '1 day' },
                  { value: '3', label: '3 days' },
                  { value: '5', label: '5 days' },
                  { value: '7', label: '7 days' },
                  { value: '10', label: '10 days' },
                  { value: '14', label: '14 days' }
                ]}
                categories={categories}
                currentFormData={formData}
              />
            </div>
          </div>
          
          {/* Video Section */}
          <div className="border-t border-zinc-800 pt-6">
            <h4 className="text-sm font-medium text-zinc-300 mb-4">Video (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SmartFormField
                label="Video URL"
                name="video_url"
                value={item.video_url}
                onChange={(value) => handleFieldChange('video_url', value)}
                placeholder="YouTube, Vimeo, etc."
                categories={categories}
                currentFormData={formData}
              />
              
              <SmartFormField
                label="Video Timestamp (seconds)"
                name="video_timestamp"
                value={item.video_timestamp}
                onChange={(value) => handleFieldChange('video_timestamp', value)}
                type="number"
                placeholder="Start time in seconds"
                categories={categories}
                currentFormData={formData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
