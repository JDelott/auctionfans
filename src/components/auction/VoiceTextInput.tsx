import { useState } from 'react';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';

interface VoiceTextInputProps {
  onTextUpdate: (text: string, append?: boolean) => void;
  currentText: string;
  placeholder?: string;
  className?: string;
}

export function VoiceTextInput({ 
  onTextUpdate, 
  currentText, 
  className = ""
}: VoiceTextInputProps) {
  const [showOptions, setShowOptions] = useState(false);
  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    clearTranscript
  } = useSpeechRecognition();

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      
      // Show options after stopping recording
      setTimeout(() => {
        if (transcript.trim()) {
          setShowOptions(true);
        }
      }, 500);
    } else {
      clearTranscript();
      startListening();
    }
  };

  const handleReplace = () => {
    onTextUpdate(transcript.trim());
    setShowOptions(false);
    clearTranscript();
  };

  const handleAppend = () => {
    const newText = currentText.trim() 
      ? `${currentText.trim()} ${transcript.trim()}`
      : transcript.trim();
    onTextUpdate(newText);
    setShowOptions(false);
    clearTranscript();
  };

  const handleCancel = () => {
    setShowOptions(false);
    clearTranscript();
  };

  if (!isSupported) return null;

  return (
    <div className="relative">
      <div className={`flex items-center gap-3 ${className}`}>
        <button
          type="button"
          onClick={handleMicClick}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 animate-pulse scale-110'
              : 'bg-violet-600 hover:bg-violet-700 hover:scale-105'
          } text-white shadow-lg relative`}
          title={isListening ? 'Stop recording' : 'Start voice input'}
        >
          {isListening ? (
            <div className="flex items-center justify-center">
              <span className="text-lg">⏹</span>
              <div className="absolute -inset-1 rounded-full bg-red-500/30 animate-ping"></div>
            </div>
          ) : (
            <span className="text-lg">🎤</span>
          )}
        </button>

        <div className="flex-1 text-sm text-zinc-400">
          {isListening ? (
            <div className="text-violet-300">
              🎤 Listening... <span className="text-zinc-400">(Click stop when done)</span>
            </div>
          ) : (
            <div>
              Click the microphone to add text using voice input
            </div>
          )}
        </div>
      </div>

      {/* Live transcript preview */}
      {isListening && transcript && (
        <div className="mt-3 bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
          <div className="text-xs text-violet-400 mb-1">Current transcript:</div>
          <div className="text-sm text-white italic">&quot;{transcript}&quot;</div>
        </div>
      )}

      {/* Action options after recording */}
      {showOptions && transcript && (
        <div className="mt-3 bg-zinc-900 border border-zinc-700 rounded-lg p-4">
          <div className="text-sm text-white mb-3">
            <div className="text-xs text-zinc-400 mb-2">Recorded text:</div>
            <div className="italic bg-zinc-800 rounded p-2">&quot;{transcript}&quot;</div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleReplace}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              Replace All Text
            </button>
            <button
              onClick={handleAppend}
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              Add to Existing
            </button>
            <button
              onClick={handleCancel}
              className="bg-zinc-600 hover:bg-zinc-500 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
