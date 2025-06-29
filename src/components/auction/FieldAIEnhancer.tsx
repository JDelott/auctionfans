import { useState, useRef, useEffect } from 'react';
import { AuctionFormData, Category } from '@/lib/auction-forms/types';

interface FieldAIEnhancerProps {
  fieldName: string;
  onFieldUpdate: (value: string) => void;
  categories: Category[];
  currentFormData: AuctionFormData;
}

export function FieldAIEnhancer({ 
  fieldName, 
  onFieldUpdate, 
  categories, 
  currentFormData
}: FieldAIEnhancerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const enhanceField = async (prompt: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai/enhance-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: prompt,
          currentFormData,
          categories: categories.map(c => ({ id: c.id, name: c.name })),
          iterationField: fieldName,
          rejectedFields: []
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('AI Enhancement Response:', data); // Debug log
      
      if (data.fieldUpdates && data.fieldUpdates.length > 0) {
        onFieldUpdate(data.fieldUpdates[0].value);
      } else if (data.formUpdates && data.formUpdates[fieldName]) {
        // Fallback to formUpdates
        onFieldUpdate(data.formUpdates[fieldName]);
      } else {
        console.warn('No field updates received from AI');
      }
    } catch (error) {
      console.error('Error enhancing field:', error);
    } finally {
      setIsProcessing(false);
      setIsOpen(false);
    }
  };

  const menuItems = [
    { label: 'Make it more exciting', prompt: 'Make this more exciting and engaging' },
    { label: 'Add more details', prompt: 'Add more specific details and information' },
    { label: 'Make it shorter', prompt: 'Make this more concise and brief' },
    { label: 'Improve grammar', prompt: 'Fix grammar and improve the writing' },
    { label: 'Make it professional', prompt: 'Make this sound more professional' }
  ];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isProcessing}
        className="w-7 h-7 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/30 rounded-md flex items-center justify-center transition-colors group disabled:opacity-50"
        title="AI Enhancement"
      >
        {isProcessing ? (
          <div className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <span className="text-xs text-violet-400 group-hover:text-violet-300">✨</span>
        )}
      </button>

      {isOpen && !isProcessing && (
        <div
          ref={menuRef}
          className="absolute right-0 top-8 z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-1 min-w-[200px] backdrop-blur-sm"
        >
          <div className="px-3 py-2 border-b border-zinc-700">
            <div className="text-xs text-zinc-400">AI Enhance</div>
            <div className="text-sm text-white font-medium capitalize">{fieldName.replace('_', ' ')}</div>
          </div>
          
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => enhanceField(item.prompt)}
              className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors flex items-center gap-2"
            >
              <span className="text-xs">✨</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 
