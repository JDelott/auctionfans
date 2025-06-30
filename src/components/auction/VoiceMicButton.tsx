import { useState } from 'react';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import { AuctionFormData, Category } from '@/lib/auction-forms/types';
import { AIContextManager } from '@/lib/ai/context-manager';

interface VoiceMicButtonProps {
  onFormUpdate: (updates: Partial<AuctionFormData>) => void;
  categories: Category[];
  currentFormData: AuctionFormData;
  currentStep?: string;
  contextManager?: AIContextManager;
  initialDescription?: string;
  itemId?: string;
}

export function VoiceMicButton({ 
  onFormUpdate, 
  categories, 
  currentFormData, 
  currentStep,
  contextManager,
  initialDescription,
  itemId
}: VoiceMicButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastGoodFormData, setLastGoodFormData] = useState<AuctionFormData | null>(null);
  
  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    clearTranscript
  } = useSpeechRecognition();

  const handleMicClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isListening) {
      stopListening();
      
      setTimeout(async () => {
        if (transcript.trim()) {
          setIsProcessing(true);
          setLastGoodFormData({ ...currentFormData });
          
          try {
            if (contextManager) {
              // Use contextual API parsing
              const response = await fetch('/api/ai/contextual-parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userInput: transcript,
                  currentFormData,
                  categories: categories.map(c => ({ id: c.id, name: c.name })),
                  contextData: contextManager.serializeContext(),
                  initialDescription,
                  itemId
                })
              });

              if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                  // Merge both formUpdates and fieldUpdates
                  const allUpdates: Record<string, string> = {
                    ...data.formUpdates
                  };
                  
                  // Add fieldUpdates to the same object
                  if (data.fieldUpdates && Array.isArray(data.fieldUpdates)) {
                    data.fieldUpdates.forEach((update: { field: string; value: string }) => {
                      allUpdates[update.field] = update.value;
                    });
                  }
                  
                  // Apply the merged updates
                  if (Object.keys(allUpdates).length > 0) {
                    onFormUpdate(allUpdates);
                  }
                  
                  // Update context manager
                  if (data.updatedContext && contextManager) {
                    try {
                      const updatedManager = AIContextManager.fromSerialized(data.updatedContext);
                      Object.assign(contextManager, updatedManager);
                    } catch (error) {
                      console.warn('Failed to update context manager:', error);
                    }
                  }
                } else {
                  throw new Error('Contextual parsing returned failure');
                }
              } else {
                throw new Error('Contextual parsing HTTP failed');
              }
            } else {
              // Fallback to regular API
              const response = await fetch('/api/ai/enhance-listing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userMessage: transcript,
                  currentFormData,
                  currentStep: currentStep || 'review_edit',
                  categories: categories.map(c => ({ id: c.id, name: c.name })),
                  rejectedFields: []
                })
              });

              if (response.ok) {
                const data = await response.json();
                const formUpdates = data.formUpdates || {};
                if (Object.keys(formUpdates).length > 0) {
                  onFormUpdate(formUpdates);
                }
              }
            }
            
          } catch (error) {
            console.error('Error processing voice input:', error);
            
            // Try fallback if contextual fails
            try {
              const response = await fetch('/api/ai/enhance-listing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userMessage: transcript,
                  currentFormData,
                  currentStep: currentStep || 'review_edit',
                  categories: categories.map(c => ({ id: c.id, name: c.name })),
                  rejectedFields: []
                })
              });

              if (response.ok) {
                const data = await response.json();
                const formUpdates = data.formUpdates || {};
                if (Object.keys(formUpdates).length > 0) {
                  onFormUpdate(formUpdates);
                }
              }
            } catch (fallbackError) {
              console.error('Fallback also failed:', fallbackError);
            }
          } finally {
            setIsProcessing(false);
            clearTranscript();
          }
        }
      }, 500);
    } else {
      startListening();
    }
  };

  const handleRecovery = () => {
    if (lastGoodFormData) {
      onFormUpdate(lastGoodFormData);
    }
  };

  if (!isSupported) return null;

  const getTooltip = () => {
    switch (currentStep) {
      case 'review_edit':
        return 'Voice input: "Nike shoes in excellent condition, starting at 50 dollars, 7 day auction"';
      case 'basic_info':
        return 'Describe your item: type, condition, category details';
      case 'pricing':
        return 'Voice pricing: "starting price 25, reserve 50, buy now 100, 7 days"';
      case 'video':
        return 'Video details: "YouTube link..." or "starts at 2 minutes 30 seconds"';
      default:
        return 'Voice input to auto-fill multiple fields with AI';
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleMicClick}
          disabled={isProcessing}
          className={`group relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25 scale-105'
              : isProcessing
              ? 'bg-violet-500/50 cursor-not-allowed'
              : 'bg-violet-500 hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-500/25 hover:scale-105'
          } text-white border border-white/10 backdrop-blur-sm`}
          title={isListening ? 'Stop recording and auto-fill fields' : isProcessing ? 'Processing with AI...' : getTooltip()}
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : isListening ? (
            <div className="relative flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
              <div className="absolute -inset-1 rounded-lg bg-red-400/30 animate-ping"></div>
            </div>
          ) : (
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Recovery button */}
        {lastGoodFormData && (
          <button
            type="button"
            onClick={handleRecovery}
            className="group w-7 h-7 rounded-lg bg-zinc-600 hover:bg-zinc-500 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 border border-white/10 backdrop-blur-sm"
            title="Restore last good state"
          >
            <svg className="w-3 h-3 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
} 
