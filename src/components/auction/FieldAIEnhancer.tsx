import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const menuItems = [
    { label: 'More exciting', prompt: 'Make this more exciting and engaging' },
    { label: 'Add details', prompt: 'Add more specific details' },
    { label: 'Make shorter', prompt: 'Make this more concise' },
    { label: 'Fix grammar', prompt: 'Fix grammar and improve writing' },
    { label: 'More professional', prompt: 'Make this more professional' }
  ];

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 192 // 192px = w-48
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setFocusedIndex(-1);
          buttonRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => (prev + 1) % menuItems.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => prev <= 0 ? menuItems.length - 1 : prev - 1);
          break;
        case 'Enter':
        case ' ':
          if (focusedIndex >= 0) {
            event.preventDefault();
            enhanceField(menuItems[focusedIndex].prompt);
          }
          break;
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen, focusedIndex, menuItems]);

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
      
      if (data.fieldUpdates && data.fieldUpdates.length > 0) {
        onFieldUpdate(data.fieldUpdates[0].value);
      } else if (data.formUpdates && data.formUpdates[fieldName]) {
        onFieldUpdate(data.formUpdates[fieldName]);
      }
    } catch (error) {
      console.error('Error enhancing field:', error);
    } finally {
      setIsProcessing(false);
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  const handleOpenDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateDropdownPosition();
    setIsOpen(!isOpen);
    setFocusedIndex(-1);
  };

  const fieldDisplayName = fieldName.replace('_', ' ');

  const dropdown = isOpen && !isProcessing && (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={() => {
          setIsOpen(false);
          setFocusedIndex(-1);
        }}
        aria-hidden="true"
      />
      
      {/* Dropdown */}
      <div
        ref={menuRef}
        className="fixed z-[9999] w-48 max-h-64 overflow-y-auto bg-zinc-900 border-2 border-zinc-700 rounded-lg shadow-2xl py-1"
        role="menu"
        aria-label={`AI enhancement options for ${fieldDisplayName}`}
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(0, 0, 0, 0.8)'
        }}
      >
        <div className="px-3 py-2 border-b-2 border-zinc-700 bg-zinc-800">
          <div className="text-xs text-zinc-300 uppercase tracking-wide font-medium">AI Enhance</div>
          <div className="text-sm text-white font-medium capitalize">{fieldDisplayName}</div>
        </div>
        
        <div className="py-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                enhanceField(item.prompt);
              }}
              onMouseEnter={() => setFocusedIndex(index)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 focus:outline-none ${
                focusedIndex === index 
                  ? 'bg-violet-600/30 text-violet-200' 
                  : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
              }`}
              role="menuitem"
              tabIndex={focusedIndex === index ? 0 : -1}
              title={item.prompt}
            >
              <span className="text-xs flex-shrink-0" aria-hidden="true">✨</span>
              <span className="flex-1">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleOpenDropdown}
          disabled={isProcessing}
          className="w-8 h-8 bg-violet-600/40 hover:bg-violet-600/60 border border-violet-600/60 rounded-lg flex items-center justify-center transition-all duration-200 group disabled:opacity-50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          aria-label={`AI enhance ${fieldDisplayName} field`}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          {isProcessing ? (
            <div 
              className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin"
              aria-label="Processing AI enhancement"
            />
          ) : (
            <span className="text-sm text-violet-200 group-hover:text-violet-100" aria-hidden="true">✨</span>
          )}
        </button>
      </div>

      {/* Render dropdown using Portal to escape form hierarchy */}
      {typeof window !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
    </>
  );
} 
