import { useState } from 'react';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import { AuctionFormData, Category } from '@/lib/auction-forms/types';

interface VoiceMicButtonProps {
  onFormUpdate: (updates: Partial<AuctionFormData>) => void;
  categories: Category[];
  currentFormData: AuctionFormData;
  currentStep?: string;
}

export function VoiceMicButton({ onFormUpdate, categories, currentFormData, currentStep }: VoiceMicButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
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
          try {
            console.log('Processing voice input:', transcript);
            console.log('Current form context:', currentFormData);
            console.log('Available categories:', categories.length);
            
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

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Voice AI Response:', data);
            
            if (data.formUpdates && Object.keys(data.formUpdates).length > 0) {
              console.log('Applying form updates:', data.formUpdates);
              onFormUpdate(data.formUpdates);
              
              // Show user feedback about what was updated
              const updatedFields = Object.keys(data.formUpdates);
              console.log(`✅ Updated fields: ${updatedFields.join(', ')}`);
            } else {
              console.log('No form updates received from AI');
            }
          } catch (error) {
            console.error('Error processing voice input:', error);
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
      <button
        type="button"
        onClick={handleMicClick}
        disabled={isProcessing}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
          isListening
            ? 'bg-red-600 hover:bg-red-700 animate-pulse scale-110'
            : isProcessing
            ? 'bg-violet-600/50 cursor-not-allowed'
            : 'bg-violet-600 hover:bg-violet-700 hover:scale-105'
        } text-white shadow-lg relative`}
        title={isListening ? 'Stop recording and auto-fill fields' : isProcessing ? 'Processing with AI...' : getTooltip()}
      >
        {isProcessing ? (
          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
        ) : isListening ? (
          <div className="flex items-center justify-center">
            <span className="text-sm">🎤</span>
            <div className="absolute -inset-1 rounded-full bg-red-500/30 animate-ping"></div>
          </div>
        ) : (
          <span className="text-sm">🎤</span>
        )}
      </button>
      
      {/* Live transcript preview */}
      {isListening && transcript && (
        <div className="absolute top-10 left-0 bg-zinc-900 border border-zinc-700 rounded-lg p-2 min-w-48 max-w-64 text-xs text-zinc-300 z-50">
          <div className="text-violet-400 mb-1">Listening...</div>
          <div className="italic">&quot;{transcript}&quot;</div>
        </div>
      )}
      
      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute top-10 left-0 bg-violet-900 border border-violet-700 rounded-lg p-2 min-w-48 text-xs text-violet-200 z-50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin"></div>
            <span>AI processing fields...</span>
          </div>
        </div>
      )}
    </div>
  );
} 
