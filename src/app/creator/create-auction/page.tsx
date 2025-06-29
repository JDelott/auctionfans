'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface AIEnhancedData {
  title?: string;
  enhanced_title?: string;
  description?: string;
  enhanced_description?: string;
  suggested_category?: string;
  suggested_condition?: string;
  suggested_starting_price?: number;
  suggested_buy_now_price?: number;
  suggested_improvements?: string[];
  marketing_keywords?: string[];
  authenticity_highlights?: string[];
  collector_appeal?: string[];
  confidence_score?: number;
  pricing_advice?: string;
}

// TypeScript interfaces for Speech Recognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResult {
  0: { transcript: string };
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// Check if browser supports speech recognition
const isSpeechRecognitionSupported = () => {
  return typeof window !== 'undefined' && 
         (window.webkitSpeechRecognition !== undefined || window.SpeechRecognition !== undefined);
};

export default function CreateAuctionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // AI Enhancement States
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIEnhancedData | null>(null);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  
  // Voice Recording States
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceProcessed, setVoiceProcessed] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    video_url: '',
    video_timestamp: '',
    starting_price: '',
    buy_now_price: '',
    reserve_price: '',
    condition: 'good',
    duration_days: '7',
    images: [] as File[]
  });

  useEffect(() => {
    if (!loading && (!user || !user.is_creator)) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchCategories();
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5);
      setFormData(prev => ({ ...prev, images: files }));
    }
  };

  // AI Enhancement Functions
  const handleAiEnhance = async () => {
    setAiEnhancing(true);
    setError('');
    
    try {
      const response = await fetch('/api/ai/enhance-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: categories.find(cat => cat.id === formData.category_id)?.name,
          condition: formData.condition,
          videoUrl: formData.video_url,
          enhancementType: 'existing_enhance'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAiSuggestions(result.data);
        setShowAiSuggestions(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to enhance listing');
      }
    } catch (error) {
      console.error('AI enhancement failed:', error);
      setError('Failed to enhance listing');
    } finally {
      setAiEnhancing(false);
    }
  };

  // Simplified voice recognition
  const startListening = () => {
    if (!speechSupported) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('Speech recognition is not available');
        return;
      }

      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      let finalTranscript = '';
      
      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setError('');
        setVoiceProcessed(false);
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart + ' ';
          } else {
            interimTranscript += transcriptPart;
          }
        }
        
        setTranscript(finalTranscript + interimTranscript);
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        // Auto-process if we have enough transcript
        if (finalTranscript.trim().length > 10) {
          setTranscript(finalTranscript.trim());
          processVoiceTranscript(finalTranscript.trim());
        }
      };
      
      recognition.start();
      recognitionRef.current = recognition;
      
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setError('Failed to start speech recognition');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Direct voice transcript processing
  const processVoiceTranscript = async (transcriptText?: string) => {
    const textToProcess = transcriptText || transcript;
    
    if (!textToProcess.trim()) {
      setError('No voice input to process');
      return;
    }

    setIsProcessingVoice(true);
    setError('');
    
    try {
      console.log('Processing transcript:', textToProcess);
      
      const response = await fetch('/api/ai/enhance-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rawInput: textToProcess,
          enhancementType: 'voice_parse'
        })
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data;
        
        console.log('AI Response:', data);
        
        // Direct form population - override existing values
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          condition: data.suggested_condition || prev.condition,
          starting_price: data.suggested_starting_price ? data.suggested_starting_price.toString() : prev.starting_price,
          buy_now_price: data.suggested_buy_now_price ? data.suggested_buy_now_price.toString() : prev.buy_now_price,
          category_id: (() => {
            if (data.suggested_category) {
              const category = categories.find(cat => 
                cat.name.toLowerCase().includes(data.suggested_category.toLowerCase()) ||
                data.suggested_category.toLowerCase().includes(cat.name.toLowerCase())
              );
              return category ? category.id : prev.category_id;
            }
            return prev.category_id;
          })(),
        }));
        
        setAiSuggestions(data);
        setShowAiSuggestions(true);
        setVoiceProcessed(true);
        setTranscript(''); // Clear transcript after successful processing
        
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to process voice input');
      }
    } catch (error) {
      console.error('Failed to process voice input:', error);
      setError('Failed to process voice input');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const clearVoiceInput = () => {
    setTranscript('');
    setAiSuggestions(null);
    setShowAiSuggestions(false);
    setVoiceProcessed(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const auctionData = {
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id,
        video_url: formData.video_url,
        video_timestamp: formData.video_timestamp ? parseInt(formData.video_timestamp) : null,
        starting_price: parseFloat(formData.starting_price),
        buy_now_price: formData.buy_now_price ? parseFloat(formData.buy_now_price) : null,
        reserve_price: formData.reserve_price ? parseFloat(formData.reserve_price) : null,
        condition: formData.condition,
        duration_days: parseInt(formData.duration_days)
      };

      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auctionData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create auction');
      }

      const result = await response.json();
      const auctionId = result.auction.id;

      if (formData.images.length > 0) {
        const imageFormData = new FormData();
        formData.images.forEach(file => {
          imageFormData.append('images', file);
        });

        await fetch(`/api/auctions/${auctionId}/images`, {
          method: 'POST',
          body: imageFormData
        });
      }

      router.push(`/auctions/${auctionId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-2 border-red-400/20 rounded-full animate-ping"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-zinc-400 hover:text-white text-sm mb-8 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          
          <div className="mb-8">
            <div className="w-12 h-1 bg-violet-400 mb-4"></div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Create New Auction
            </h1>
            <p className="text-lg text-zinc-300">
              List an authentic item from your content with AI assistance
            </p>
          </div>
        </div>

        {/* Simplified Voice Input Section */}
        <div className="bg-gradient-to-r from-violet-900/20 to-red-900/20 border border-violet-800/30 rounded-lg p-8 mb-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2 flex items-center justify-center">
              <div className="w-2 h-2 bg-violet-400 rounded-full mr-3"></div>
              🎙️ Voice to Form
            </h2>
            <p className="text-zinc-300 max-w-2xl mx-auto">
              Describe your item and let AI automatically fill out the auction form below
            </p>
          </div>

          {/* Voice Control */}
          <div className="flex flex-col items-center space-y-4">
            {speechSupported ? (
              <>
                {!isListening && !isProcessingVoice && (
                  <button
                    onClick={startListening}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-3"
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                    <span>Start Recording</span>
                  </button>
                )}
                
                {isListening && (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-400 font-mono text-lg">Recording...</span>
                    </div>
                    <button
                      onClick={stopListening}
                      className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Stop & Process
                    </button>
                  </div>
                )}
                
                {isProcessingVoice && (
                  <div className="flex items-center space-x-3 text-violet-400">
                    <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-lg">AI is processing your voice...</span>
                  </div>
                )}

                {voiceProcessed && (
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 max-w-md text-center">
                    <div className="text-green-400 mb-2">✅ Voice Processed!</div>
                    <p className="text-sm text-green-300">Check the form below - it should be automatically filled out.</p>
                    <button
                      onClick={clearVoiceInput}
                      className="mt-2 text-xs text-green-400 hover:text-green-300 underline"
                    >
                      Record Again
                    </button>
                  </div>
                )}

                {/* Live Transcript Display */}
                {transcript && !voiceProcessed && (
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 max-w-2xl w-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-400">Live Transcript:</span>
                      {!isListening && !isProcessingVoice && (
                        <button
                          onClick={() => processVoiceTranscript()}
                          className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded text-sm font-medium"
                        >
                          Process Now
                        </button>
                      )}
                    </div>
                    <p className="text-white text-sm leading-relaxed bg-zinc-900/50 p-3 rounded">
                      {transcript}
                    </p>
                  </div>
                )}

                {/* Example */}
                {!transcript && !isListening && !voiceProcessed && (
                  <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-4 max-w-2xl text-center">
                    <p className="text-zinc-400 text-sm mb-2">💡 <strong>Example:</strong></p>
                    <p className="text-zinc-300 text-sm italic">
                      &quot;This is the gaming mouse I used in my Valorant videos. It&apos;s a Logitech G Pro X Superlight, 
                      white color, in good condition. I used it for about 8 months. Start the bidding at $75.&quot;
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-zinc-400">
                <p>Voice recognition not supported in your browser.</p>
                <p className="text-sm">Please fill out the form manually below.</p>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-lg p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Show AI suggestions only as additional info */}
          {showAiSuggestions && aiSuggestions && (
            <div className="bg-violet-950/30 border border-violet-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-violet-300">
                  ✨ Additional AI Suggestions
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAiSuggestions(false)}
                  className="text-zinc-400 hover:text-white text-sm"
                >
                  Dismiss
                </button>
              </div>
              
              {aiSuggestions.authenticity_highlights && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-violet-400 mb-2">Consider Adding to Description:</h4>
                  <ul className="space-y-1">
                    {aiSuggestions.authenticity_highlights.map((highlight, index) => (
                      <li key={index} className="text-sm text-zinc-300 flex items-start">
                        <span className="text-violet-400 mr-2">•</span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSuggestions.suggested_improvements && (
                <div>
                  <h4 className="text-sm font-medium text-amber-400 mb-2">Suggestions to Improve Listing:</h4>
                  <ul className="space-y-1">
                    {aiSuggestions.suggested_improvements.map((suggestion, index) => (
                      <li key={index} className="text-sm text-zinc-300 flex items-start">
                        <span className="text-amber-400 mr-2">→</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Basic Information</h2>
              {(formData.title || formData.description) && !voiceProcessed && (
                <button
                  type="button"
                  onClick={handleAiEnhance}
                  disabled={aiEnhancing}
                  className="bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center space-x-2"
                >
                  {aiEnhancing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enhancing...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>AI Enhance</span>
                    </>
                  )}
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-2">
                  Item Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  placeholder="Gaming headset used in stream setup"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors resize-none"
                  placeholder="Describe the item's condition, usage, and any special significance..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-zinc-300 mb-2">
                    Category *
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    required
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  >
                    <option value="" className="bg-zinc-800 text-zinc-400">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id} className="bg-zinc-800 text-white">
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-zinc-300 mb-2">
                    Condition *
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    required
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  >
                    <option value="new" className="bg-zinc-800 text-white">New</option>
                    <option value="like_new" className="bg-zinc-800 text-white">Like New</option>
                    <option value="good" className="bg-zinc-800 text-white">Good</option>
                    <option value="fair" className="bg-zinc-800 text-white">Fair</option>
                    <option value="poor" className="bg-zinc-800 text-white">Poor</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Video Information */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Video Information</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="video_url" className="block text-sm font-medium text-zinc-300 mb-2">
                  Video URL *
                </label>
                <input
                  id="video_url"
                  name="video_url"
                  type="url"
                  required
                  value={formData.video_url}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  placeholder="https://youtube.com/watch?v=..."
                />
                <p className="text-sm text-zinc-500 mt-2">
                  Link to the video where this item appears
                </p>
              </div>

              <div>
                <label htmlFor="video_timestamp" className="block text-sm font-medium text-zinc-300 mb-2">
                  Video Timestamp (seconds)
                </label>
                <input
                  id="video_timestamp"
                  name="video_timestamp"
                  type="number"
                  value={formData.video_timestamp}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  placeholder="120"
                />
                <p className="text-sm text-zinc-500 mt-2">
                  When the item appears in the video (optional)
                </p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Pricing</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="starting_price" className="block text-sm font-medium text-zinc-300 mb-2">
                  Starting Price ($) *
                </label>
                <input
                  id="starting_price"
                  name="starting_price"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={formData.starting_price}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  placeholder="25.00"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="reserve_price" className="block text-sm font-medium text-zinc-300 mb-2">
                    Reserve Price ($)
                  </label>
                  <input
                    id="reserve_price"
                    name="reserve_price"
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.reserve_price}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                    placeholder="50.00"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    Minimum price to sell
                  </p>
                </div>

                <div>
                  <label htmlFor="buy_now_price" className="block text-sm font-medium text-zinc-300 mb-2">
                    Buy Now Price ($)
                  </label>
                  <input
                    id="buy_now_price"
                    name="buy_now_price"
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.buy_now_price}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                    placeholder="100.00"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    Instant purchase price
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Images & Duration */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Images & Duration</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="images" className="block text-sm font-medium text-zinc-300 mb-2">
                  Images (max 5)
                </label>
                <input
                  id="images"
                  name="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-violet-600 file:text-white hover:file:bg-violet-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                />
                {formData.images.length > 0 && (
                  <div className="mt-3 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <p className="text-green-400 text-sm">
                      {formData.images.length} file(s) selected
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="duration_days" className="block text-sm font-medium text-zinc-300 mb-2">
                  Auction Duration
                </label>
                <select
                  id="duration_days"
                  name="duration_days"
                  value={formData.duration_days}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                >
                  <option value="1" className="bg-zinc-800 text-white">1 Day</option>
                  <option value="3" className="bg-zinc-800 text-white">3 Days</option>
                  <option value="7" className="bg-zinc-800 text-white">7 Days</option>
                  <option value="10" className="bg-zinc-800 text-white">10 Days</option>
                  <option value="14" className="bg-zinc-800 text-white">14 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500 flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Auction</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
