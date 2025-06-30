'use client';

import { useState } from 'react';
import { BatchItem, Category } from '@/lib/auction-forms/types';
import { VoiceMicButton } from './VoiceMicButton';

interface BatchVoiceControlProps {
  items: BatchItem[];
  categories: Category[];
  onBatchUpdate: (updates: Partial<BatchItem>) => void;
  onItemUpdate: (itemId: string, updates: Partial<BatchItem>) => void;
}

export function BatchVoiceControl({ items, categories, onBatchUpdate, onItemUpdate }: BatchVoiceControlProps) {
  const [selectedMode, setSelectedMode] = useState<'all' | 'selected'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleVoiceUpdate = (updates: Partial<BatchItem>) => {
    if (selectedMode === 'all') {
      onBatchUpdate(updates);
    } else {
      selectedItems.forEach(itemId => {
        onItemUpdate(itemId, updates);
      });
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Create a dummy form data object for voice processing
  const dummyFormData = {
    title: '',
    description: '',
    category_id: '',
    condition: 'good',
    starting_price: '',
    reserve_price: '',
    buy_now_price: '',
    video_url: '',
    video_timestamp: '',
    duration_days: '7',
    images: true
  };

  return (
    <div className="bg-zinc-900 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Batch Voice Control</h3>
        <VoiceMicButton
          onFormUpdate={handleVoiceUpdate}
          categories={categories}
          currentFormData={dummyFormData}
          currentStep="review_edit"
        />
      </div>
      
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Update Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMode('all')}
              className={`px-4 py-2 rounded text-sm ${
                selectedMode === 'all' 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setSelectedMode('selected')}
              className={`px-4 py-2 rounded text-sm ${
                selectedMode === 'selected' 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Selected Items ({selectedItems.length})
            </button>
          </div>
        </div>
      </div>
      
      {selectedMode === 'selected' && (
        <div className="border-t border-zinc-800 pt-4">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Select Items to Update</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => toggleItemSelection(item.id)}
                className={`aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                  selectedItems.includes(item.id)
                    ? 'border-violet-500 ring-2 ring-violet-500/50'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <img 
                  src={item.imagePreview} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="text-sm text-zinc-400">
        💡 Try saying: &quot;Set starting price to 25 dollars&quot; or &quot;Change condition to like new&quot; or &quot;Update duration to 5 days&quot;
      </div>
    </div>
  );
}
