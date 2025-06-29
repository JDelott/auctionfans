import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import { useEffect } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  isIterating?: boolean;
  iteratingField?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Tell me about your item...",
  isIterating = false,
  iteratingField
}: ChatInputProps) {
  const {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening
  } = useSpeechRecognition();

  // Update input value when speech recognition produces transcript
  useEffect(() => {
    if (transcript) {
      onChange(transcript);
    }
  }, [transcript, onChange]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isListening) {
      e.preventDefault();
      onSend();
    }
  };

  const getPlaceholder = () => {
    if (isListening) return "🎤 Listening...";
    if (isIterating && iteratingField) {
      return `🎤 Tell me how to improve the ${iteratingField.toLowerCase()}...`;
    }
    return placeholder;
  };

  return (
    <div className="space-y-3">
      {/* Speech Status Indicator */}
      {isListening && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-600/10 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          <span>Listening... Click stop when finished</span>
        </div>
      )}

      {/* Iteration Context */}
      {isIterating && iteratingField && (
        <div className="bg-yellow-600/10 border border-yellow-600/20 px-3 py-2 rounded-lg">
          <div className="text-xs text-yellow-200 flex items-center gap-2">
            <span>🔄</span>
            <span>Revising: <strong>{iteratingField}</strong></span>
          </div>
        </div>
      )}
      
      {/* Input Row */}
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getPlaceholder()}
            className={`w-full bg-zinc-800/50 border rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors resize-none min-h-[42px] max-h-24 leading-normal ${
              isListening 
                ? 'border-red-500 focus:border-red-400 bg-red-600/5' 
                : isIterating 
                ? 'border-yellow-500 focus:border-yellow-400 bg-yellow-600/5'
                : 'border-zinc-700 focus:border-violet-500'
            }`}
            onKeyPress={handleKeyPress}
            disabled={isListening || disabled}
            rows={1}
            style={{ 
              overflow: 'hidden',
              lineHeight: '1.4'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = '42px';
              target.style.height = `${Math.min(target.scrollHeight, 96)}px`;
            }}
          />
        </div>
        
        {/* Voice Button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={!isSupported || disabled}
          className={`w-10 h-10 rounded-lg transition-colors flex items-center justify-center flex-shrink-0 ${
            isListening 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : isIterating
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white disabled:text-zinc-500'
          }`}
          title={isListening ? "Stop recording" : "Voice input"}
        >
          <span className="text-sm">
            {isListening ? '⏹️' : '🎤'}
          </span>
        </button>
        
        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled || isListening}
          className={`px-4 h-10 rounded-lg transition-colors text-sm font-medium flex items-center justify-center flex-shrink-0 ${
            isIterating
              ? 'bg-yellow-600 hover:bg-yellow-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white'
              : 'bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white'
          }`}
        >
          {disabled ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isIterating ? (
            'Revise'
          ) : (
            'Send'
          )}
        </button>
      </div>
      
      {/* Helper text */}
      <p className="text-xs text-zinc-500">
        {isIterating && iteratingField
          ? `🔄 Revising ${iteratingField.toLowerCase()}. Be specific about what you want changed.`
          : isListening 
          ? "Speak naturally - I'll capture your description. Click stop when done."
          : "💡 Tip: Use voice input for detailed descriptions or type normally. Press Enter to send."
        }
      </p>

      {/* Error display */}
      {error && (
        <div className="text-xs text-red-400 bg-red-600/10 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
} 
