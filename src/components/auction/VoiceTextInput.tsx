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
      
      // Automatically append the transcript to existing text after stopping
      setTimeout(() => {
        if (transcript.trim()) {
          const newText = currentText.trim() 
            ? `${currentText.trim()} ${transcript.trim()}`
            : transcript.trim();
          onTextUpdate(newText);
          clearTranscript();
        }
      }, 500);
    } else {
      clearTranscript();
      startListening();
    }
  };

  if (!isSupported) return null;

  return (
    <div className="relative">
      <div className={`flex items-center gap-4 ${className}`}>
        <button
          type="button"
          onClick={handleMicClick}
          className={`group flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25 scale-105'
              : 'bg-violet-500 hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-500/25 hover:scale-105'
          } text-white border border-white/10 backdrop-blur-sm`}
          title={isListening ? 'Stop recording' : 'Start voice input'}
        >
          {isListening ? (
            <div className="relative flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              <div className="absolute -inset-1 rounded-xl bg-red-400/30 animate-ping"></div>
            </div>
          ) : (
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <div className="flex-1 text-sm">
          {isListening ? (
            <div className="flex items-center gap-2 text-violet-300">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Listening...</span>
              <span className="text-slate-400">(Click stop when done)</span>
            </div>
          ) : (
            <div className="text-slate-400">
              Click the microphone to add text using voice input
            </div>
          )}
        </div>
      </div>

      {/* Live transcript preview */}
      {isListening && transcript && (
        <div className="mt-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <div className="text-xs text-violet-400 font-medium uppercase tracking-wide">Live Transcript</div>
          </div>
          <div className="text-sm text-white bg-slate-900/50 rounded-lg p-3 italic">&quot;{transcript}&quot;</div>
        </div>
      )}
    </div>
  );
} 
