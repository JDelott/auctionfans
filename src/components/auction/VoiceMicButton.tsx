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
    // Prevent any form submission or validation
    e.preventDefault();
    e.stopPropagation();
    
    if (isListening) {
      // Stop listening and process
      stopListening();
      
      // Wait a moment for transcript to finalize
      setTimeout(async () => {
        if (transcript.trim()) {
          setIsProcessing(true);
          try {
            const response = await fetch('/api/ai/enhance-listing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userMessage: transcript,
                currentFormData,
                currentStep: currentStep || 'basic_info', // Pass current step
                categories: categories.map(c => ({ id: c.id, name: c.name })),
                rejectedFields: []
              })
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Voice AI Response:', data); // Debug log
            
            if (data.formUpdates) {
              onFormUpdate(data.formUpdates);
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
      // Start listening
      startListening();
    }
  };

  if (!isSupported) return null;

  // Get step-specific tooltip
  const getTooltip = () => {
    switch (currentStep) {
      case 'basic_info':
        return 'Record voice input to fill basic information';
      case 'pricing':
        return 'Record pricing information: "starting price 25, reserve 50"';
      case 'video':
        return 'Record video details: "YouTube link at ..." or "start at 2 minutes"';
      case 'images':
        return 'Record description improvements for your images';
      case 'review':
        return 'Record final adjustments: "change title to..." or "update price to..."';
      default:
        return 'Record voice input to fill form';
    }
  };

  return (
    <button
      type="button" // Explicitly set as button to prevent form submission
      onClick={handleMicClick}
      disabled={isProcessing}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
        isListening
          ? 'bg-red-600 hover:bg-red-700 animate-pulse'
          : isProcessing
          ? 'bg-violet-600/50'
          : 'bg-violet-600 hover:bg-violet-700 hover:scale-105'
      } text-white shadow-lg`}
      title={isListening ? 'Stop recording and fill form' : isProcessing ? 'Processing...' : getTooltip()}
    >
      {isProcessing ? (
        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <span className="text-sm">🎤</span>
      )}
    </button>
  );
} 
