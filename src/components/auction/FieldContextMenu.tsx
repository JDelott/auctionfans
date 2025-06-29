import { useState, useRef, useEffect, ReactNode } from 'react';
import { AuctionFormData, Category } from '@/lib/auction-forms/types';

interface FieldContextMenuProps {
  fieldName: string;
  onFieldUpdate: (value: string) => void;
  categories: Category[];
  currentFormData: AuctionFormData;
  children: ReactNode;
}

export function FieldContextMenu({ 
  fieldName, 
  onFieldUpdate, 
  categories, 
  currentFormData,
  children
}: FieldContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };

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
          iterationField: fieldName
        })
      });

      const data = await response.json();
      if (data.fieldUpdates && data.fieldUpdates.length > 0) {
        onFieldUpdate(data.fieldUpdates[0].value);
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
    <div onContextMenu={handleContextMenu} className="relative">
      {children}
      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg py-2 min-w-48"
          style={{
            left: `${Math.min(position.x, window.innerWidth - 200)}px`,
            top: `${Math.min(position.y, window.innerHeight - 300)}px`
          }}
        >
          <div className="px-3 py-2 border-b border-zinc-700">
            <div className="text-xs text-zinc-400">AI Enhance</div>
            <div className="text-sm text-white font-medium">{fieldName}</div>
          </div>
          
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => enhanceField(item.prompt)}
              disabled={isProcessing}
              className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                item.label
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 
