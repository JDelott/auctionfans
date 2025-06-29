import { useState } from 'react';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import { AuctionFormData, Category } from '@/lib/auction-forms/types';

interface VoiceFormFillerProps {
  onFormUpdate: (updates: Partial<AuctionFormData>) => void;
  categories: Category[];
  currentFormData: AuctionFormData;
}

export function VoiceFormFiller({ onFormUpdate, categories, currentFormData }: VoiceFormFillerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    clearTranscript
  } = useSpeechRecognition();

  const processVoiceInput = async () => {
    if (!transcript.trim()) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai/enhance-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: transcript,
          currentFormData,
          categories: categories.map(c => ({ id: c.id, name: c.name }))
        })
      });

      const data = await response.json();
      if (data.formUpdates) {
        onFormUpdate(data.formUpdates);
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
    } finally {
      setIsProcessing(false);
      clearTranscript();
    }
  };

  if (!isSupported) return null;

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full flex items-center justify-center">
          <span className="text-sm">🎤</span>
        </div>
        <div>
          <h3 className="font-medium text-white">Voice Input</h3>
          <p className="text-xs text-zinc-400">Describe your item to auto-fill the form</p>
        </div>
      </div>

      {isListening && (
        <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 text-red-400">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Listening... Describe your item</span>
          </div>
        </div>
      )}

      {transcript && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 mb-3">
          <p className="text-sm text-zinc-200">{transcript}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-violet-600 hover:bg-violet-700 text-white'
          }`}
        >
          {isListening ? '⏹️ Stop Recording' : '🎤 Start Recording'}
        </button>

        {transcript && (
          <button
            onClick={processVoiceInput}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              '✨ Fill Form'
            )}
          </button>
        )}
      </div>
    </div>
  );
} 
