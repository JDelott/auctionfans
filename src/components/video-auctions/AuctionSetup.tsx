'use client';

import { useState } from 'react';

interface DetectedItem {
  id: string;
  item_name: string;
  item_description: string;
  suggested_category: string;
  condition: string;
}

interface AuctionConfig {
  itemId: string;
  starting_price: string;
  reserve_price: string;
  buy_now_price: string;
  duration_days: string;
}

interface AuctionSetupProps {
  items: DetectedItem[];
  onSetupComplete: (configs: AuctionConfig[]) => void;
}

export default function AuctionSetup({ items, onSetupComplete }: AuctionSetupProps) {
  const [configs, setConfigs] = useState<AuctionConfig[]>(
    items.map(item => ({
      itemId: item.id,
      starting_price: '',
      reserve_price: '',
      buy_now_price: '',
      duration_days: '7'
    }))
  );

  const [globalSettings, setGlobalSettings] = useState({
    apply_to_all: false,
    global_starting_price: '',
    global_reserve_price: '',
    global_buy_now_price: '',
    global_duration: '7'
  });

  const handleConfigUpdate = (itemId: string, field: string, value: string) => {
    setConfigs(prev => prev.map(config => 
      config.itemId === itemId ? { ...config, [field]: value } : config
    ));
  };

  const handleGlobalApply = () => {
    if (globalSettings.apply_to_all) {
      setConfigs(prev => prev.map(config => ({
        ...config,
        starting_price: globalSettings.global_starting_price || config.starting_price,
        reserve_price: globalSettings.global_reserve_price || config.reserve_price,
        buy_now_price: globalSettings.global_buy_now_price || config.buy_now_price,
        duration_days: globalSettings.global_duration || config.duration_days
      })));
    }
  };

  const isConfigComplete = (config: AuctionConfig) => {
    return config.starting_price && config.duration_days;
  };

  const allConfigsComplete = configs.every(isConfigComplete);

  const handleSubmit = () => {
    if (allConfigsComplete) {
      onSetupComplete(configs);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Set Up Auctions</h2>
        <p className="text-zinc-400">
          Configure pricing and auction settings for each of your {items.length} items.
        </p>
      </div>

      {/* Global Settings */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 mb-8">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="apply_to_all"
            checked={globalSettings.apply_to_all}
            onChange={(e) => setGlobalSettings(prev => ({ ...prev, apply_to_all: e.target.checked }))}
            className="mr-3"
          />
          <label htmlFor="apply_to_all" className="text-white font-medium">
            Apply same settings to all items
          </label>
        </div>

        {globalSettings.apply_to_all && (
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Starting Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={globalSettings.global_starting_price}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, global_starting_price: e.target.value }))}
                className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm w-full"
                placeholder="10.00"
              />
            </div>
            
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Reserve Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={globalSettings.global_reserve_price}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, global_reserve_price: e.target.value }))}
                className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm w-full"
                placeholder="50.00"
              />
            </div>
            
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Buy Now Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={globalSettings.global_buy_now_price}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, global_buy_now_price: e.target.value }))}
                className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm w-full"
                placeholder="100.00"
              />
            </div>
            
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Duration</label>
              <select
                value={globalSettings.global_duration}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, global_duration: e.target.value }))}
                className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm w-full"
              >
                <option value="1">1 Day</option>
                <option value="3">3 Days</option>
                <option value="7">7 Days</option>
                <option value="10">10 Days</option>
                <option value="14">14 Days</option>
              </select>
            </div>
          </div>
        )}

        {globalSettings.apply_to_all && (
          <button
            onClick={handleGlobalApply}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
          >
            Apply to All Items
          </button>
        )}
      </div>

      {/* Individual Item Configurations */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {items.map((item) => {
          const config = configs.find(c => c.itemId === item.id)!;
          const isComplete = isConfigComplete(config);
          
          return (
            <div key={item.id} className={`bg-zinc-900/50 rounded-xl border p-6 ${
              isComplete ? 'border-green-600/50' : 'border-zinc-800/50'
            }`}>
              {/* Item Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">{item.item_name}</h3>
                  <p className="text-zinc-400 text-sm">{item.suggested_category} • {item.condition}</p>
                </div>
                {isComplete && (
                  <div className="text-green-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Pricing Inputs */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Starting Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={config.starting_price}
                      onChange={(e) => handleConfigUpdate(item.id, 'starting_price', e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm w-full"
                      placeholder="10.00"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Reserve Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={config.reserve_price}
                      onChange={(e) => handleConfigUpdate(item.id, 'reserve_price', e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm w-full"
                      placeholder="50.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Buy Now Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={config.buy_now_price}
                      onChange={(e) => handleConfigUpdate(item.id, 'buy_now_price', e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm w-full"
                      placeholder="100.00"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Duration *</label>
                    <select
                      value={config.duration_days}
                      onChange={(e) => handleConfigUpdate(item.id, 'duration_days', e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm w-full"
                      required
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
            </div>
          );
        })}
      </div>

      {/* Summary & Continue */}
      <div className="bg-zinc-800/50 rounded-xl p-6 text-center">
        <div className="mb-4">
          <p className="text-white font-medium mb-2">
            {configs.filter(isConfigComplete).length} of {configs.length} items configured
          </p>
          <div className="w-full bg-zinc-700 rounded-full h-2">
            <div 
              className="bg-violet-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(configs.filter(isConfigComplete).length / configs.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!allConfigsComplete}
          className="bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
        >
          {allConfigsComplete ? 'Continue to Authentication →' : 'Complete All Items First'}
        </button>
      </div>
    </div>
  );
}
