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
        className="fixed z-[9999] w-48 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/50 rounded-xl shadow-2xl shadow-black/25"
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
        <div className="px-4 py-3 border-b border-zinc-700/50 bg-gradient-to-r from-violet-600/10 to-purple-600/10 rounded-t-xl">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div>
              <div className="text-xs text-violet-300 uppercase tracking-wider font-medium">AI ENHANCE</div>
              <div className="text-sm text-white font-medium capitalize">{fieldDisplayName}</div>
            </div>
          </div>
        </div>
        
        {/* Menu Items */}
        <div className="py-2 max-h-48 overflow-y-auto">
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
              className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center gap-3 focus:outline-none ${
                focusedIndex === index 
                  ? 'bg-violet-500/20 text-violet-200 border-l-2 border-violet-400' 
                  : 'text-zinc-200 hover:bg-zinc-800/50 hover:text-white'
              }`}
              role="menuitem"
              tabIndex={focusedIndex === index ? 0 : -1}
              title={item.prompt}
            >
              <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
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
        className={`group w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-1 focus:ring-offset-zinc-900 ${
          isOpen 
            ? 'bg-violet-500/60 border border-violet-400 scale-105 shadow-lg shadow-violet-500/25' 
            : 'bg-violet-500/20 border border-violet-500/40 hover:bg-violet-500/40 hover:border-violet-400/60 hover:shadow-lg hover:shadow-violet-500/25'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} backdrop-blur-sm`}
        aria-label={`AI enhance ${fieldDisplayName} field`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={`Enhance ${fieldDisplayName} with AI`}
      >
        {isProcessing ? (
          <div 
            className="w-4 h-4 border-2 border-violet-300/50 border-t-violet-300 rounded-full animate-spin"
            aria-label="Processing AI enhancement"
          />
        ) : (
          <svg className="w-4 h-4 text-violet-200 group-hover:text-violet-100 group-hover:scale-110 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </button>

      {/* Portal the dropdown to document.body for better positioning */}
      {typeof window !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
    </>
  );
} 
