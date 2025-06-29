import { useState, useEffect, useRef } from 'react';

// Speech Recognition interfaces
declare global {
  interface Window {
    SpeechRecognition: new() => SpeechRecognition;
    webkitSpeechRecognition: new() => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognition = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        recognition.current = new SpeechRecognition();
        
        // Enhanced settings for longer recordings
        recognition.current.continuous = true;
        recognition.current.interimResults = true;
        recognition.current.lang = 'en-US';
        
        recognition.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';

          // Process all results to capture full transcript
          for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Combine final and interim results
          const fullTranscript = finalTranscript + interimTranscript;
          setTranscript(fullTranscript);
        };

        recognition.current.onerror = (event: Event) => {
          const speechEvent = event as unknown as SpeechRecognitionEvent & { error?: string };
          console.error('Speech recognition error:', speechEvent.error);
          setIsListening(false);
          
          // Don't show error for 'no-speech' - just stop listening
          if (speechEvent.error && speechEvent.error !== 'no-speech') {
            setError(`Speech recognition error: ${speechEvent.error}. Please try again.`);
          }
        };

        recognition.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const startListening = () => {
    if (!isSupported || !recognition.current) return;
    
    setIsListening(true);
    setTranscript(''); // Clear transcript when starting fresh
    setError(null);
    
    try {
      recognition.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
      setError('Could not start speech recognition. Please try again.');
    }
  };

  const stopListening = () => {
    if (!recognition.current) return;
    
    setIsListening(false);
    try {
      recognition.current.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    clearTranscript,
    setTranscript
  };
} 
