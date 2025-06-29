'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface AIMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  formUpdates?: Record<string, string>;
}

type FormStep = 'welcome' | 'basic_info' | 'pricing' | 'video' | 'images' | 'review';

interface FormData {
  title: string;
  description: string;
  category_id: string;
  condition: string;
  starting_price: string;
  reserve_price: string;
  buy_now_price: string;
  video_url: string;
  video_timestamp: string;
  duration_days: string;
  images: boolean;
}

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

export default function CreateAuctionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // AI Enhancement States
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [currentStep, setCurrentStep] = useState<FormStep>('welcome');
  
  // Voice Recognition States
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognition = useRef<SpeechRecognition | null>(null);

  // Form States
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category_id: '',
    condition: 'new',
    starting_price: '',
    reserve_price: '',
    buy_now_price: '',
    video_url: '',
    video_timestamp: '',
    duration_days: '7',
    images: false
  });

  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Step configuration
  const stepConfig = {
    welcome: { title: 'Welcome', progress: 0 },
    basic_info: { title: 'Basic Information', progress: 20 },
    pricing: { title: 'Pricing', progress: 40 },
    video: { title: 'Video Information', progress: 60 },
    images: { title: 'Images', progress: 80 },
    review: { title: 'Review & Submit', progress: 100 }
  };

  // Check if speech recognition is supported
  const isSpeechRecognitionSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize AI with welcome message
  useEffect(() => {
    if (user && !loading && aiMessages.length === 0) {
      setAiMessages([{
        role: 'assistant',
        content: `Hi ${user.username}! 👋 I'm your AI listing assistant. I'll guide you step-by-step to create an amazing auction listing.\n\nLet's start with the basics - what item are you looking to auction?`,
        timestamp: new Date(),
        suggestions: [
          'Gaming equipment from my videos',
          'Clothing/merch I wore in content',
          'Collectible from my collection',
          'Tech gear I used for streaming'
        ]
      }]);
    }
  }, [user, loading, aiMessages.length]);

  // Initialize speech recognition
  useEffect(() => {
    if (isSpeechRecognitionSupported) {
      const SpeechRecognitionConstructor = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (SpeechRecognitionConstructor) {
        recognition.current = new SpeechRecognitionConstructor();
        if (recognition.current) {
          recognition.current.continuous = true;
          recognition.current.interimResults = true;
          recognition.current.lang = 'en-US';

          recognition.current.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              }
            }
            if (finalTranscript) {
              setTranscript(finalTranscript);
            }
          };

          recognition.current.onerror = () => {
            setIsListening(false);
            setError('Voice recognition error. Please try again.');
          };

          recognition.current.onend = () => {
            setIsListening(false);
          };
        }
      }
    }
  }, [isSpeechRecognitionSupported]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image changes  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedImages(files);
      setFormData(prev => ({ ...prev, images: files.length > 0 }));
      
      // Create image previews
      const previews: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            previews.push(e.target.result as string);
            if (previews.length === files.length) {
              setImagePreviews(previews);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Start listening for voice input
  const startListening = () => {
    if (recognition.current && !isListening) {
      setIsListening(true);
      setTranscript('');
      recognition.current.start();
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
      setIsListening(false);
    }
  };

  // Send message to AI
  const sendMessage = async (message?: string) => {
    const messageToSend = message || userInput.trim();
    if (!messageToSend) return;

    setUserInput('');
    setAiProcessing(true);

    // Add user message
    setAiMessages(prev => [...prev, {
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    }]);

    try {
      const response = await fetch('/api/ai/enhance-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enhancementType: 'conversational_guide',
          userMessage: messageToSend,
          currentFormData: formData,
          currentStep,
          categories: categories.map(cat => ({ id: cat.id, name: cat.name }))
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add AI response
        const messageContent = result.message || result.response || 'I\'m here to help!';
        
        setAiMessages(prev => [...prev, {
          role: 'assistant',
          content: messageContent,
          timestamp: new Date(),
          suggestions: result.suggestions,
          formUpdates: result.formUpdates
        }]);

        // Apply form updates if any
        if (result.formUpdates) {
          setFormData(prev => ({ ...prev, ...result.formUpdates }));
        }

        // Progress to next step if appropriate
        if (result.nextStep && result.nextStep !== currentStep) {
          setCurrentStep(result.nextStep);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    }
    setAiProcessing(false);
  };

  // Process voice input
  const processVoiceInput = async () => {
    if (!transcript.trim()) {
      setError('No voice input detected. Please try speaking again.');
      return;
    }

    await sendMessage(transcript);
    setTranscript('');
  };

  // Move to next step
  const nextStep = () => {
    const steps: FormStep[] = ['welcome', 'basic_info', 'pricing', 'video', 'images', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      const next = steps[currentIndex + 1];
      setCurrentStep(next);
      
      // Send step transition message to AI
      sendMessage(`I'm ready to move to the ${stepConfig[next].title} section.`);
    }
  };

  // Move to previous step
  const prevStep = () => {
    const steps: FormStep[] = ['welcome', 'basic_info', 'pricing', 'video', 'images', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError('');

    try {
      // Create auction
      const auctionData = {
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id,
        condition: formData.condition,
        starting_price: parseFloat(formData.starting_price),
        reserve_price: formData.reserve_price ? parseFloat(formData.reserve_price) : null,
        buy_now_price: formData.buy_now_price ? parseFloat(formData.buy_now_price) : null,
        video_url: formData.video_url || null,
        video_timestamp: formData.video_timestamp ? parseInt(formData.video_timestamp) : null,
        duration_days: parseInt(formData.duration_days) || 7
      };

      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auctionData),
      });

      if (response.ok) {
        const { auction } = await response.json();

        // Upload images if any
        if (selectedImages && selectedImages.length > 0) {
          const imageFormData = new FormData();
          Array.from(selectedImages).forEach((file, index) => {
            imageFormData.append('images', file);
            imageFormData.append(`isPrimary_${index}`, index === 0 ? 'true' : 'false');
          });

          await fetch(`/api/auctions/${auction.id}/images`, {
            method: 'POST',
            body: imageFormData,
          });
        }

        router.push(`/auctions/${auction.id}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create auction');
      }
    } catch (error) {
      console.error('Error creating auction:', error);
      setError('Failed to create auction. Please try again.');
    }

    setSubmitting(false);
  };

  // Redirect if not authenticated
  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-zinc-400 hover:text-white transition-colors mb-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create New Auction</h1>
          <p className="text-zinc-400">List an authentic item from your content with AI assistance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form - Left Side */}
          <div className="lg:col-span-2">
            {error && (
              <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step Content */}
              {currentStep === 'welcome' && (
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🚀</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Welcome to AI-Powered Listing</h2>
                    <p className="text-zinc-400">I&apos;ll help you create an amazing auction listing step by step. Let&apos;s start by telling me about your item!</p>
                  </div>
                </div>
              )}

              {currentStep === 'basic_info' && (
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-6">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Item Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                        placeholder="Enter a descriptive title for your item"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Description *</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                        placeholder="Describe your item in detail..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Category *</label>
                        <select
                          name="category_id"
                          value={formData.category_id}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Condition *</label>
                        <select
                          name="condition"
                          value={formData.condition}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                        >
                          <option value="new">New</option>
                          <option value="like-new">Like New</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="poor">Poor</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'pricing' && (
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-6">Pricing</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Starting Price ($) *</label>
                      <input
                        type="number"
                        name="starting_price"
                        value={formData.starting_price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                        placeholder="25.00"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Reserve Price ($)</label>
                        <input
                          type="number"
                          name="reserve_price"
                          value={formData.reserve_price}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                          placeholder="50.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Buy Now Price ($)</label>
                        <input
                          type="number"
                          name="buy_now_price"
                          value={formData.buy_now_price}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                          placeholder="100.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Auction Duration</label>
                      <select
                        name="duration_days"
                        value={formData.duration_days}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                      >
                        <option value="1">1 Day</option>
                        <option value="3">3 Days</option>
                        <option value="7">7 Days</option>
                        <option value="10">10 Days</option>
                        <option value="14">14 Days</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'video' && (
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-6">Video Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Video URL</label>
                      <input
                        type="url"
                        name="video_url"
                        value={formData.video_url}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Video Timestamp (seconds)</label>
                      <input
                        type="number"
                        name="video_timestamp"
                        value={formData.video_timestamp}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                        placeholder="120"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'images' && (
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-6">Images</h3>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Upload Images</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-600 file:text-white file:cursor-pointer hover:file:bg-violet-700"
                    />

                    {imagePreviews.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              width={150}
                              height={150}
                              className="w-full h-24 object-cover rounded-lg border border-zinc-700"
                            />
                            {index === 0 && (
                              <span className="absolute top-1 left-1 bg-violet-600 text-white text-xs px-2 py-1 rounded">
                                Primary
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 'review' && (
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-6">Review & Submit</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-400">Title:</span>
                        <p className="text-white">{formData.title || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Starting Price:</span>
                        <p className="text-white">${formData.starting_price || '0.00'}</p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Category:</span>
                        <p className="text-white">{categories.find(c => c.id === formData.category_id)?.name || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Condition:</span>
                        <p className="text-white">{formData.condition}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 'welcome'}
                  className="bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Previous
                </button>

                {currentStep === 'review' ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-zinc-700 disabled:to-zinc-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
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
                ) : (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Next
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* AI Chat Assistant - Right Side */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 sticky top-8 h-fit">
              {/* Chat Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/50">
                <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-lg">🤖</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Guide</h3>
                  <p className="text-xs text-zinc-400">{stepConfig[currentStep].title}</p>
                </div>
              </div>

              {/* Voice Transcript Display (only show when we have transcript) */}
              {transcript && (
                <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <p className="text-sm text-zinc-300 mb-2">Voice Input:</p>
                  <p className="text-sm text-white">{transcript}</p>
                  <button
                    onClick={processVoiceInput}
                    disabled={aiProcessing}
                    className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 text-white px-3 py-1 rounded text-xs transition-colors"
                  >
                    {aiProcessing ? 'Processing...' : 'Process Voice Input'}
                  </button>
                </div>
              )}

              {/* Chat Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {aiMessages.map((message, index) => (
                  <div key={index} className={`${
                    message.role === 'assistant' 
                      ? 'bg-violet-600/10 border-violet-600/20' 
                      : 'bg-zinc-800/50 border-zinc-700/50'
                  } border rounded-lg p-3`}>
                    <p className="text-sm text-zinc-200 whitespace-pre-line mb-2">
                      {message.content}
                    </p>
                    {message.suggestions && (
                      <div className="space-y-1">
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => sendMessage(suggestion)}
                            disabled={aiProcessing}
                            className="block w-full text-left text-xs bg-zinc-700/50 hover:bg-zinc-700 disabled:hover:bg-zinc-700/50 text-zinc-300 hover:text-white px-2 py-1 rounded transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {aiProcessing && (
                  <div className="bg-violet-600/10 border-violet-600/20 border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></div>
                      <span className="text-sm text-zinc-300">AI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input with Microphone */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                
                {/* Microphone Button */}
                {!isListening ? (
                  <button
                    onClick={startListening}
                    disabled={!isSpeechRecognitionSupported}
                    className="bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
                    title="Voice input"
                  >
                    <span className="text-sm">🎤</span>
                  </button>
                ) : (
                  <button
                    onClick={stopListening}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center animate-pulse"
                    title="Stop recording"
                  >
                    <span className="text-sm">⏹</span>
                  </button>
                )}
                
                {/* Send Button */}
                <button
                  onClick={() => sendMessage()}
                  disabled={!userInput.trim() || aiProcessing}
                  className="bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
