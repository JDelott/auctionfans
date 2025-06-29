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
    const messageToSend = message || userInput;
    if (!messageToSend.trim() || aiProcessing) return;

    setAiProcessing(true);
    setUserInput('');

    // Add user message
    const userMessage: AIMessage = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };
    setAiMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/ai/enhance-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: messageToSend,
          currentStep,
          currentFormData: formData,
          categories
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Apply form updates immediately
        if (data.formUpdates && Object.keys(data.formUpdates).length > 0) {
          setFormData(prev => ({ ...prev, ...data.formUpdates }));
          
          // Show what was updated
          const updatedFields = Object.keys(data.formUpdates);
          const updateMessage = `✅ Updated: ${updatedFields.join(', ')}`;
          
          const updateNotification: AIMessage = {
            role: 'assistant',
            content: updateMessage,
            timestamp: new Date()
          };
          setAiMessages(prev => [...prev, updateNotification]);
        }

        // Add AI response
        const aiMessage: AIMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          suggestions: data.suggestions
        };
        setAiMessages(prev => [...prev, aiMessage]);

        // Update step if needed
        if (data.nextStep && data.nextStep !== currentStep) {
          setCurrentStep(data.nextStep as FormStep);
        }
      }
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setAiProcessing(false);
    }
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

  // Step validation functions
  const validateBasicInfo = (): { isValid: boolean; missingFields: string[] } => {
    const missing: string[] = [];
    if (!formData.title.trim()) missing.push('Title');
    if (!formData.description.trim()) missing.push('Description');  
    if (!formData.category_id) missing.push('Category');
    if (!formData.condition) missing.push('Condition');
    
    return {
      isValid: missing.length === 0,
      missingFields: missing
    };
  };

  const validatePricing = (): { isValid: boolean; missingFields: string[] } => {
    const missing: string[] = [];
    if (!formData.starting_price || parseFloat(formData.starting_price) <= 0) {
      missing.push('Starting Price');
    }
    if (!formData.duration_days) missing.push('Auction Duration');
    
    return {
      isValid: missing.length === 0,
      missingFields: missing
    };
  };

  const validateImages = (): { isValid: boolean; missingFields: string[] } => {
    const missing: string[] = [];
    if (!selectedImages || selectedImages.length === 0) {
      missing.push('At least one image');
    }
    
    return {
      isValid: missing.length === 0,
      missingFields: missing
    };
  };

  // Enhanced step navigation with validation
  const nextStep = () => {
    const steps: FormStep[] = ['welcome', 'basic_info', 'pricing', 'video', 'images', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    
    // Validate current step before proceeding
    let canProceed = true;
    let validationMessage = '';

    switch (currentStep) {
      case 'basic_info':
        const basicValidation = validateBasicInfo();
        if (!basicValidation.isValid) {
          canProceed = false;
          validationMessage = `Please complete: ${basicValidation.missingFields.join(', ')}`;
        }
        break;
      case 'pricing':
        const pricingValidation = validatePricing();
        if (!pricingValidation.isValid) {
          canProceed = false;
          validationMessage = `Please complete: ${pricingValidation.missingFields.join(', ')}`;
        }
        break;
      case 'images':
        const imagesValidation = validateImages();
        if (!imagesValidation.isValid) {
          canProceed = false;
          validationMessage = `Please complete: ${imagesValidation.missingFields.join(', ')}`;
        }
        break;
    }

    if (!canProceed) {
      setError(validationMessage);
      // Send validation error to AI
      sendMessage(`I'm missing some required information: ${validationMessage}. Can you help me complete these fields?`);
      return;
    }

    setError('');
    if (currentIndex < steps.length - 1) {
      const next = steps[currentIndex + 1];
      setCurrentStep(next);
      
      // Send step transition message to AI
      sendMessage(`Great! I've completed the ${stepConfig[currentStep].title} section. Now moving to ${stepConfig[next].title}.`);
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
              {/* Progress Indicator */}
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-4">
                <div className="flex items-center justify-between text-sm">
                  {Object.entries(stepConfig).map(([step, config], index) => {
                    if (step === 'welcome') return null;
                    const isActive = currentStep === step;
                    const isCompleted = (() => {
                      switch (step) {
                        case 'basic_info': return validateBasicInfo().isValid;
                        case 'pricing': return validatePricing().isValid;
                        case 'video': return !!(formData.video_url); // Only green if actually filled out
                        case 'images': return validateImages().isValid;
                        case 'review': return false;
                        default: return false;
                      }
                    })();
                    
                    return (
                      <div key={step} className={`flex items-center ${
                        isActive ? 'text-violet-400' : 
                        isCompleted ? 'text-green-400' : 'text-zinc-500'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          isActive ? 'bg-violet-600' : 
                          isCompleted ? 'bg-green-600' : 'bg-zinc-700'
                        }`}>
                          {isCompleted ? '✓' : index}
                        </div>
                        <span className="ml-2 hidden sm:inline">{config.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Basic Info Step */}
              {currentStep === 'basic_info' && (
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Basic Information</h3>
                    <div className="text-sm text-zinc-400">
                      {validateBasicInfo().isValid ? (
                        <span className="text-green-400">✓ Complete</span>
                      ) : (
                        <span className="text-yellow-400">⚠ Incomplete</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Item Title * 
                        {!formData.title && <span className="text-red-400 ml-1">Required</span>}
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                          formData.title ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                        }`}
                        placeholder="Enter a descriptive title for your item"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Description *
                        {!formData.description && <span className="text-red-400 ml-1">Required</span>}
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors resize-none ${
                          formData.description ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                        }`}
                        placeholder="Describe your item in detail..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Category *
                          {!formData.category_id && <span className="text-red-400 ml-1">Required</span>}
                        </label>
                        <select
                          name="category_id"
                          value={formData.category_id}
                          onChange={handleInputChange}
                          className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                            formData.category_id ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                          }`}
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Condition *
                          {!formData.condition && <span className="text-red-400 ml-1">Required</span>}
                        </label>
                        <select
                          name="condition"
                          value={formData.condition}
                          onChange={handleInputChange}
                          className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                            formData.condition ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                          }`}
                        >
                          <option value="">Select condition</option>
                          <option value="New">New</option>
                          <option value="Used - Excellent">Used - Excellent</option>
                          <option value="Used - Good">Used - Good</option>
                          <option value="Used - Fair">Used - Fair</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Pricing Step */}
              {currentStep === 'pricing' && (
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Auction Pricing</h3>
                    <div className="text-sm text-zinc-400">
                      {validatePricing().isValid ? (
                        <span className="text-green-400">✓ Complete</span>
                      ) : (
                        <span className="text-yellow-400">⚠ Incomplete</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Starting Price */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Starting Price ($) *
                        {!formData.starting_price && <span className="text-red-400 ml-1">Required</span>}
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">$</div>
                        <input
                          type="number"
                          name="starting_price"
                          value={formData.starting_price}
                          onChange={handleInputChange}
                          min="0.01"
                          step="0.01"
                          className={`w-full bg-zinc-800/50 border rounded-lg pl-8 pr-4 py-3 focus:outline-none transition-colors ${
                            formData.starting_price && parseFloat(formData.starting_price) > 0 
                              ? 'border-green-600 focus:border-green-500' 
                              : 'border-zinc-700 focus:border-violet-500'
                          }`}
                          placeholder="25.00"
                        />
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">This is the minimum bid amount</p>
                    </div>

                    {/* Pricing Suggestions */}
                    {formData.starting_price && (
                      <div className="bg-violet-600/10 border border-violet-600/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-violet-300 mb-2">💡 Pricing Suggestions</h4>
                        <div className="space-y-2 text-sm text-zinc-300">
                          <p>• Reserve Price: ${(parseFloat(formData.starting_price) * 1.5).toFixed(2)} (50% higher than starting)</p>
                          <p>• Buy Now Price: ${(parseFloat(formData.starting_price) * 3).toFixed(2)} (3x starting price)</p>
                        </div>
                      </div>
                    )}

                    {/* Optional Pricing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Reserve Price ($) <span className="text-zinc-500">(Optional)</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">$</div>
                          <input
                            type="number"
                            name="reserve_price"
                            value={formData.reserve_price}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                            placeholder="50.00"
                          />
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">Minimum price to sell</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Buy Now Price ($) <span className="text-zinc-500">(Optional)</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">$</div>
                          <input
                            type="number"
                            name="buy_now_price"
                            value={formData.buy_now_price}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                            placeholder="100.00"
                          />
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">Skip bidding, buy immediately</p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Auction Duration *
                        {!formData.duration_days && <span className="text-red-400 ml-1">Required</span>}
                      </label>
                      <select
                        name="duration_days"
                        value={formData.duration_days}
                        onChange={handleInputChange}
                        className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                          formData.duration_days ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                        }`}
                      >
                        <option value="">Select duration</option>
                        <option value="1">1 Day</option>
                        <option value="3">3 Days</option>
                        <option value="7">7 Days (Recommended)</option>
                        <option value="10">10 Days</option>
                        <option value="14">14 Days</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Step (Optional) */}
              {currentStep === 'video' && (
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Video Information</h3>
                    <div className="text-sm text-zinc-400">
                      {formData.video_url ? (
                        <span className="text-green-400">✓ Complete</span>
                      ) : (
                        <span className="text-zinc-500">Optional</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Video URL <span className="text-zinc-500">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        name="video_url"
                        value={formData.video_url}
                        onChange={handleInputChange}
                        className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                          formData.video_url ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                        }`}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                      <p className="text-xs text-zinc-400 mt-1">Link to video where this item appears</p>
                    </div>

                    {formData.video_url && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Video Timestamp (seconds) <span className="text-zinc-500">(Optional)</span>
                        </label>
                        <input
                          type="number"
                          name="video_timestamp"
                          value={formData.video_timestamp}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                          placeholder="120"
                        />
                        <p className="text-xs text-zinc-400 mt-1">When the item appears in the video</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Images Step */}
              {currentStep === 'images' && (
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Images</h3>
                    <div className="text-sm text-zinc-400">
                      {validateImages().isValid ? (
                        <span className="text-green-400">✓ Complete</span>
                      ) : (
                        <span className="text-red-400">⚠ Required</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Upload Images *
                      {(!selectedImages || selectedImages.length === 0) && <span className="text-red-400 ml-1">At least 1 required</span>}
                    </label>
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

              {/* Review Step */}
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
                ) : currentStep === 'welcome' ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep('basic_info')}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Get Started
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
                  <p className="text-xs text-zinc-400">{stepConfig[currentStep]?.title || 'Welcome'}</p>
                </div>
              </div>

              {/* Voice Transcript Display */}
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
