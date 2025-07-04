'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BatchItem, Category } from '@/lib/auction-forms/types';
import { VoiceMicButton } from './VoiceMicButton';
import { AIContextManager } from '@/lib/ai/context-manager';

interface BatchVoiceControlProps {
  items: BatchItem[];
  categories: Category[];
  onBatchUpdate: (updates: Partial<BatchItem>) => void;
  onItemUpdate: (itemId: string, updates: Partial<BatchItem>) => void;
  contextManager?: AIContextManager;
}

export function BatchVoiceControl({ 
  items, 
  categories, 
  onBatchUpdate, 
  onItemUpdate,
  contextManager 
}: BatchVoiceControlProps) {
  const [selectedMode, setSelectedMode] = useState<'all' | 'selected'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleVoiceUpdate = (updates: Partial<BatchItem>) => {
    console.log('Batch voice update:', updates);
    
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

  // Create representative form data for voice processing
  const representativeFormData = {
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
    <div className="bg-zinc-900 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Batch Voice Control</h3>
        <VoiceMicButton
          onFormUpdate={handleVoiceUpdate}
          categories={categories}
          currentFormData={representativeFormData}
          currentStep="review_edit"
          contextManager={contextManager}
        />
      </div>
      
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Update Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMode('all')}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                selectedMode === 'all' 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setSelectedMode('selected')}
              className={`px-4 py-2 rounded text-sm transition-colors ${
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
                className={`aspect-square rounded-lg border-2 overflow-hidden transition-all relative ${
                  selectedItems.includes(item.id)
                    ? 'border-violet-500 ring-2 ring-violet-500/50'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <Image 
                  src={item.imagePreview} 
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
        <div className="text-sm font-medium text-zinc-300">💡 Enhanced Voice Commands:</div>
        <div className="text-xs text-zinc-400 space-y-1">
          <div><strong>Comprehensive:</strong> &quot;Nike Air Max shoes, excellent condition, sneakers category, starting at 75 dollars, reserve 100, 7 day auction&quot;</div>
          <div><strong>Category:</strong> &quot;This is electronics category&quot; or &quot;clothing and fashion item&quot;</div>
          <div><strong>Condition:</strong> &quot;mint condition&quot; | &quot;used but good&quot; | &quot;vintage worn&quot;</div>
          <div><strong>Pricing:</strong> &quot;starting price 50, reserve 75, buy now 150&quot;</div>
          <div><strong>Duration:</strong> &quot;5 day auction&quot; | &quot;one week duration&quot;</div>
          <div><strong>Video timing:</strong> &quot;starts at 2 minutes 30 seconds&quot; → auto-converts to 150 seconds</div>
        </div>
      </div>
    </div>
  );
}
