import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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

  const menuItems = useMemo(() => [
    { label: 'More exciting', prompt: 'Make this more exciting and engaging' },
    { label: 'Add details', prompt: 'Add more specific details' },
    { label: 'Make shorter', prompt: 'Make this more concise' },
    { label: 'Fix grammar', prompt: 'Fix grammar and improve writing' },
    { label: 'More professional', prompt: 'Make this more professional' }
  ], []);

  const updateDropdownPosition = useCallback(() => {
    if (!buttonRef.current || !isOpen) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    
    // Get the actual viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Dropdown dimensions
    const dropdownWidth = 192; // w-48 = 12rem = 192px
    const dropdownHeight = 240; // approximate height
    const gap = 8; // gap between button and dropdown
    
    let left = 0;
    let top = 0;
    
    // Try to position to the right of the button first
    const rightEdge = rect.right + gap + dropdownWidth;
    const leftEdge = rect.left - gap - dropdownWidth;
    
    if (rightEdge <= viewportWidth) {
      // Position to the right
      left = rect.right + gap;
    } else if (leftEdge >= 0) {
      // Position to the left
      left = rect.left - gap - dropdownWidth;
    } else {
      // Center on button if neither side has space
      left = Math.max(gap, Math.min(rect.left - dropdownWidth / 2, viewportWidth - dropdownWidth - gap));
    }
    
    // Vertical positioning - try to align with button top
    const bottomEdge = rect.top + dropdownHeight;
    
    if (bottomEdge <= viewportHeight) {
      // Position aligned with button top
      top = rect.top;
    } else {
      // Position above button if no space below
      top = Math.max(gap, rect.bottom - dropdownHeight);
    }
    
    console.log('Button rect:', rect);
    console.log('Calculated position:', { top, left });
    console.log('Viewport:', { viewportWidth, viewportHeight });
    
    setDropdownPosition({ top, left });
  }, [isOpen]);

  const enhanceField = useCallback(async (prompt: string) => {
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
  }, [currentFormData, categories, fieldName, onFieldUpdate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && 
          menuRef.current && 
          !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && 
          !buttonRef.current.contains(event.target as Node)) {
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
        // Update position on scroll
        requestAnimationFrame(updateDropdownPosition);
      }
    };

    const handleResize = () => {
      if (isOpen) {
        requestAnimationFrame(updateDropdownPosition);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      // Update position immediately
      requestAnimationFrame(updateDropdownPosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, focusedIndex, menuItems, enhanceField, updateDropdownPosition]);

  const handleOpenDropdown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    setFocusedIndex(-1);
    
    if (newIsOpen) {
      // Force position update after state change
      setTimeout(() => {
        updateDropdownPosition();
      }, 0);
    }
  }, [isOpen, updateDropdownPosition]);

  const fieldDisplayName = fieldName.replace('_', ' ');

  const dropdown = isOpen && !isProcessing && (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/5" 
        onClick={() => {
          setIsOpen(false);
          setFocusedIndex(-1);
        }}
        aria-hidden="true"
      />
      
      {/* Dropdown */}
      <div
        ref={menuRef}
        className="fixed z-[9999] w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl"
        role="menu"
        aria-label={`AI enhancement options for ${fieldDisplayName}`}
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          transform: 'translateZ(0)', // Force hardware acceleration
          willChange: 'transform' // Optimize for position changes
        }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-zinc-700 bg-zinc-800 rounded-t-lg">
          <div className="text-xs text-zinc-400 uppercase tracking-wide font-medium">AI ENHANCE</div>
          <div className="text-sm text-white font-medium capitalize">{fieldDisplayName}</div>
        </div>
        
        {/* Menu Items */}
        <div className="py-1 max-h-48 overflow-y-auto">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                enhanceField(item.prompt);
              }}
              onMouseEnter={() => setFocusedIndex(index)}
              onMouseLeave={() => setFocusedIndex(-1)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2 focus:outline-none ${
                focusedIndex === index 
                  ? 'bg-violet-600/20 text-violet-200' 
                  : 'text-zinc-200 hover:bg-zinc-800/50 hover:text-white'
              }`}
              role="menuitem"
              tabIndex={focusedIndex === index ? 0 : -1}
              title={item.prompt}
            >
              <span className="text-violet-400 flex-shrink-0" aria-hidden="true">✨</span>
              <span className="flex-1">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpenDropdown}
        disabled={isProcessing}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-1 focus:ring-offset-zinc-900 ${
          isOpen 
            ? 'bg-violet-600/60 border border-violet-500 scale-105' 
            : 'bg-violet-600/20 border border-violet-600/40 hover:bg-violet-600/40 hover:border-violet-500/60'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        aria-label={`AI enhance ${fieldDisplayName} field`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={`Enhance ${fieldDisplayName} with AI`}
      >
        {isProcessing ? (
          <div 
            className="w-3 h-3 border border-violet-300 border-t-transparent rounded-full animate-spin"
            aria-label="Processing AI enhancement"
          />
        ) : (
          <span className="text-violet-200 group-hover:text-violet-100" aria-hidden="true">✨</span>
        )}
      </button>

      {/* Portal the dropdown to document.body for better positioning */}
      {typeof window !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
    </>
  );
} 
