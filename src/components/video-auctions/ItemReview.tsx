'use client';


import { useState } from 'react';

interface DetectedItem {
  id: string;
  item_name: string;
  item_description: string;
  confidence_score: number;
  screenshot_timestamp: number;
  suggested_category: string;
  condition: string;
}

interface ItemReviewProps {
  detectedItems: DetectedItem[];
  onItemsApproved: (approvedItems: DetectedItem[]) => void;
}

export default function ItemReview({ detectedItems, onItemsApproved }: ItemReviewProps) {
  const [items, setItems] = useState(detectedItems);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const handleItemUpdate = (itemId: string, field: string, value: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';  
    return 'Low';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Review Detected Items</h2>
        <p className="text-zinc-400">
          AI found {items.length} sellable items. Review, edit, or remove items before setting up auctions.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-zinc-500 text-6xl mb-4">📦</div>
          <h3 className="text-white font-medium mb-2">No items to review</h3>
          <p className="text-zinc-400">All items have been removed or none were detected.</p>
        </div>
      ) : (
        <>
          {/* Items Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {items.map((item) => (
              <div key={item.id} className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
                {/* Item Header */}
                <div className="p-4 border-b border-zinc-800/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {editingItem === item.id ? (
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => handleItemUpdate(item.id, 'item_name', e.target.value)}
                          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1 text-white text-sm w-full"
                          onBlur={() => setEditingItem(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingItem(null)}
                          autoFocus
                        />
                      ) : (
                        <h3 
                          className="text-white font-medium cursor-pointer hover:text-violet-400 transition-colors"
                          onClick={() => setEditingItem(item.id)}
                        >
                          {item.item_name}
                        </h3>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors ml-2"
                      title="Remove item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">@ {formatTime(item.screenshot_timestamp)}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${getConfidenceColor(item.confidence_score)}`}>
                        {getConfidenceLabel(item.confidence_score)}
                      </span>
                      <span className="text-zinc-500">
                        {Math.round(item.confidence_score * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Item Details */}
                <div className="p-4 space-y-3">
                  {/* Description */}
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Description</label>
                    <textarea
                      value={item.item_description}
                      onChange={(e) => handleItemUpdate(item.id, 'item_description', e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm w-full resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Category & Condition */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Category</label>
                      <input
                        type="text"
                        value={item.suggested_category}
                        onChange={(e) => handleItemUpdate(item.id, 'suggested_category', e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1 text-white text-sm w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Condition</label>
                      <select
                        value={item.condition}
                        onChange={(e) => handleItemUpdate(item.id, 'condition', e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1 text-white text-sm w-full"
                      >
                        <option value="new">New</option>
                        <option value="like_new">Like New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Continue Button */}
          <div className="text-center">
            <button
              onClick={() => onItemsApproved(items)}
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              Continue with {items.length} Item{items.length !== 1 ? 's' : ''} →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
