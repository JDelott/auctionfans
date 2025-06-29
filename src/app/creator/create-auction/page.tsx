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
  const [currentStep, setCurrentStep] = useState<FormStep>('basic_info');
  
  // Voice Recognition States
  const [isListening, setIsListening] = useState(false);
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
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);

  // Add state for pending AI suggestions
  const [pendingAiUpdates, setPendingAiUpdates] = useState<Record<string, string> | null>(null);
  const [showApplyPrompt, setShowApplyPrompt] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<typeof formData | null>(null);

  // Initialize AI with welcome message
  useEffect(() => {
    if (user && !loading && aiMessages.length === 0) {
      setAiMessages([{
        role: 'assistant',
        content: `Hi ${user.username}! 👋 I'm your AI listing assistant. Let's create an amazing auction listing together.

I'll help you fill out the Basic Information section. Tell me about the item you want to auction - what is it, where did you get it, and what makes it special?`,
        timestamp: new Date()
      }]);
    }
  }, [user, loading, aiMessages.length]);

  // Enhanced speech recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSpeechRecognitionSupported(true);
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
          
          // Update user input with full text
          setUserInput(fullTranscript);
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
          // Don't auto-send on end - let user control when to send
        };
      }
    }
  }, []); // Empty dependency array

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

  const startListening = () => {
    if (!isSpeechRecognitionSupported || !recognition.current) return;
    
    setIsListening(true);
    setUserInput(''); // Clear input when starting fresh
    
    try {
      recognition.current.start();
      setError(''); // Clear any previous errors
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

  // Updated sendMessage function - stays on current step
  const sendMessage = async (message?: string) => {
    const messageToSend = message || userInput;
    if (!messageToSend.trim() || aiProcessing) return;

    setAiProcessing(true);
    setUserInput('');

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
          currentStep, // Always stay on current step
          currentFormData: formData,
          categories: categories.map(c => ({ id: c.id, name: c.name }))
        })
      });

      const data = await response.json();
      
      if (data.response) {
        const aiMessage: AIMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setAiMessages(prev => [...prev, aiMessage]);
      }

      // Auto-apply form updates if any were extracted
      if (data.formUpdates && Object.keys(data.formUpdates).length > 0) {
        // Store original form data for potential revert
        setOriginalFormData(formData);
        
        // Store pending updates
        setPendingAiUpdates(data.formUpdates);
        
        // Auto-apply the updates
        setFormData(prev => ({
          ...prev,
          ...data.formUpdates
        }));
        
        // Show accept/reject prompt
        setShowApplyPrompt(true);
        setError(''); // Clear any existing errors
      }
    } catch (err) {
      console.error('AI Error:', err);
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Please try again.',
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setAiProcessing(false);
    }
  };

  // Accept AI suggestions - stay on current step for continued refinement
  const acceptAiSuggestions = () => {
    setShowApplyPrompt(false);
    setPendingAiUpdates(null);
    setOriginalFormData(null);
    
    // Add confirmation message encouraging further refinement
    const confirmMessage: AIMessage = {
      role: 'assistant',
      content: `✅ Perfect! I've updated your form. 

Feel free to:
• Make any manual adjustments to the fields
• Ask me to revise specific details
• Tell me if anything needs changes
• Click "Next" when you're satisfied with this section

What would you like to adjust or shall we refine anything else?`,
      timestamp: new Date()
    };
    setAiMessages(prev => [...prev, confirmMessage]);
  };

  // Reject AI suggestions and encourage more details
  const rejectAiSuggestions = () => {
    if (originalFormData) {
      setFormData(originalFormData);
    }
    setShowApplyPrompt(false);
    setPendingAiUpdates(null);
    setOriginalFormData(null);
    
    // Add rejection message asking for more specific details
    const rejectMessage: AIMessage = {
      role: 'assistant',
      content: `No problem! I've reverted the changes. 

Let me try again with more specific details. Could you tell me:
• More about the item's appearance or features
• The specific context of when/where you used it
• Any unique characteristics that make it special
• How you'd like to describe it to potential buyers

The more details you give me, the better I can help!`,
      timestamp: new Date()
    };
    setAiMessages(prev => [...prev, rejectMessage]);
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

  // Enhanced nextStep function with step-specific guidance
  const nextStep = () => {
    const validation = (() => {
      switch (currentStep) {
        case 'basic_info': return validateBasicInfo();
        case 'pricing': return validatePricing();
        case 'video': return { isValid: true, missingFields: [] }; // Optional
        case 'images': return validateImages();
        default: return { isValid: true, missingFields: [] };
      }
    })();

    if (!validation.isValid) {
      setError(`Please complete the required fields: ${validation.missingFields.join(', ')}`);
      
      // AI helps with missing fields
      const helpMessage: AIMessage = {
        role: 'assistant',
        content: `I notice you're missing: ${validation.missingFields.join(', ')}

Let me help you complete these fields. What additional information can you provide?`,
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, helpMessage]);
      return;
    }

    setError('');
    
    // Save current section data (auto-save functionality)
    console.log(`Saving ${currentStep} data:`, formData);
    
    // Move to next step
    const steps: FormStep[] = ['basic_info', 'pricing', 'video', 'images', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      const newStep = steps[currentIndex + 1];
      setCurrentStep(newStep);
      
      // Clear any pending AI updates when moving to new step
      setShowApplyPrompt(false);
      setPendingAiUpdates(null);
      setOriginalFormData(null);
      
      // AI provides guidance for the new step
      const stepGuidance = getStepGuidance(newStep);
      const guidanceMessage: AIMessage = {
        role: 'assistant',
        content: stepGuidance,
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, guidanceMessage]);
    }
  };

  // Step-specific AI guidance
  const getStepGuidance = (step: FormStep): string => {
    switch (step) {
      case 'pricing':
        return `Great job on the basic information! 💰

Now let's set up your auction pricing. I'll help you determine:

• **Starting Price**: What's a good minimum bid to attract interest?
• **Reserve Price** (optional): What's the lowest you'd accept?
• **Buy Now Price** (optional): Want to allow instant purchases?
• **Duration**: How long should the auction run?

For creator items, I typically recommend starting lower to generate buzz, then letting bidding drive the price up. What price range were you thinking?`;

      case 'video':
        return `Perfect pricing setup! 📹

This section is optional but can really boost authenticity and value. If this item appeared in any of your videos:

• **Video URL**: Link to where viewers can see the item
• **Timestamp**: When in the video it appears

This helps verify authenticity and lets fans connect the item to specific content they remember. Do you have a video featuring this item?`;

      case 'images':
        return `Excellent! Now for the visual appeal 📸

High-quality images are crucial for auction success. I recommend:

• **Multiple angles**: Front, back, sides, close-ups of details
• **Good lighting**: Natural light works best
• **Clean background**: Let the item be the focus
• **Condition details**: Show any wear or unique features

The first image becomes your main thumbnail, so make it count! Ready to upload some photos?`;

      case 'review':
        return `Almost there! 🎉

Let's review everything before we publish your auction. Double-check:

• All information is accurate
• Photos look great
• Pricing feels right
• Description tells the full story

Once you're satisfied, I'll help you create this listing. Any final adjustments needed?`;

      default:
        return 'Let me know how I can help with this section!';
    }
  };

  // Updated prevStep to also provide guidance
  const prevStep = () => {
    const steps: FormStep[] = ['basic_info', 'pricing', 'video', 'images', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      const newStep = steps[currentIndex - 1];
      setCurrentStep(newStep);
      
      // Clear any pending AI updates when moving steps
      setShowApplyPrompt(false);
      setPendingAiUpdates(null);
      setOriginalFormData(null);
      
      // Provide guidance for returning to previous step
      const returnMessage: AIMessage = {
        role: 'assistant',
        content: `Back to ${stepConfig[newStep]?.title}! 

Let me know what you'd like to revise or improve in this section.`,
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, returnMessage]);
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

      {/* AI Auto-Apply Prompt - Fixed messaging */}
      {showApplyPrompt && pendingAiUpdates && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg shadow-2xl border border-violet-400/20 p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🤖</span>
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-white mb-1">AI Updated Your Form</h4>
              <p className="text-sm text-violet-100 mb-3">
                {(() => {
                  const count = Object.keys(pendingAiUpdates).length;
                  return `I updated ${count} ${count === 1 ? 'field' : 'fields'} based on your description. Continue chatting to refine further.`;
                })()}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={acceptAiSuggestions}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                >
                  ✅ Accept
                </button>
                <button
                  onClick={rejectAiSuggestions}
                  className="bg-red-500/20 hover:bg-red-500/30 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                        case 'video': return !!formData.video_url; // Only green if actually filled
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

              {/* Form sections with visual indication of AI updates */}
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
                    <div className="relative">
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
                          pendingAiUpdates?.title ? 'border-violet-500 ring-2 ring-violet-500/20' :
                          formData.title ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                        }`}
                        placeholder="Enter a descriptive title for your item"
                      />
                      {pendingAiUpdates?.title && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full animate-pulse"></div>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Description *
                        {!formData.description && <span className="text-red-400 ml-1">Required</span>}
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors resize-none min-h-[120px] leading-relaxed ${
                          pendingAiUpdates?.description ? 'border-violet-500 ring-2 ring-violet-500/20' :
                          formData.description ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                        }`}
                        placeholder="Describe your item in detail - what is it, where did you get it, what makes it special? The more details, the better!"
                        rows={6}
                        style={{ 
                          lineHeight: '1.6',
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}
                      />
                      {pendingAiUpdates?.description && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full animate-pulse"></div>
                      )}
                      <div className="mt-1 text-xs text-zinc-500">
                        {formData.description.length > 0 && (
                          <span className="mr-3">{formData.description.length} characters</span>
                        )}
                        Include details about condition, origin, and what makes this item special
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Category *
                          {!formData.category_id && <span className="text-red-400 ml-1">Required</span>}
                        </label>
                        <select
                          name="category_id"
                          value={formData.category_id}
                          onChange={handleInputChange}
                          className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                            pendingAiUpdates?.category_id ? 'border-violet-500 ring-2 ring-violet-500/20' :
                            formData.category_id ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                          }`}
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                        {pendingAiUpdates?.category_id && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full animate-pulse"></div>
                        )}
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Condition *
                          {!formData.condition && <span className="text-red-400 ml-1">Required</span>}
                        </label>
                        <select
                          name="condition"
                          value={formData.condition}
                          onChange={handleInputChange}
                          className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                            pendingAiUpdates?.condition ? 'border-violet-500 ring-2 ring-violet-500/20' :
                            formData.condition ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                          }`}
                        >
                          <option value="">Select condition</option>
                          <option value="New">New</option>
                          <option value="Used - Excellent">Used - Excellent</option>
                          <option value="Used - Good">Used - Good</option>  
                          <option value="Used - Fair">Used - Fair</option>
                        </select>
                        {pendingAiUpdates?.condition && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Step */}
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
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Starting Price ($) *
                        {!formData.starting_price && <span className="text-red-400 ml-1">Required</span>}
                      </label>
                      <input
                        type="number"
                        name="starting_price"
                        value={formData.starting_price}
                        onChange={handleInputChange}
                        min="0.01"
                        step="0.01"
                        className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                          pendingAiUpdates?.starting_price ? 'border-violet-500 ring-2 ring-violet-500/20' :
                          formData.starting_price ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                        }`}
                        placeholder="25.00"
                      />
                      <p className="text-xs text-zinc-400 mt-1">The minimum bid amount to start the auction</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Reserve Price ($)
                        <span className="text-zinc-400 ml-1">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        name="reserve_price"
                        value={formData.reserve_price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                          pendingAiUpdates?.reserve_price ? 'border-violet-500 ring-2 ring-violet-500/20' :
                          formData.reserve_price ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                        }`}
                        placeholder="50.00"
                      />
                      <p className="text-xs text-zinc-400 mt-1">Minimum price you&apos;re willing to accept (hidden from bidders)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Buy Now Price ($)
                        <span className="text-zinc-400 ml-1">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        name="buy_now_price"
                        value={formData.buy_now_price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                          pendingAiUpdates?.buy_now_price ? 'border-violet-500 ring-2 ring-violet-500/20' :
                          formData.buy_now_price ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                        }`}
                        placeholder="100.00"
                      />
                      <p className="text-xs text-zinc-400 mt-1">Allow buyers to purchase immediately at this price</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Auction Duration
                      </label>
                      <select
                        name="duration_days"
                        value={formData.duration_days}
                        onChange={handleInputChange}
                        className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                          pendingAiUpdates?.duration_days ? 'border-violet-500 ring-2 ring-violet-500/20' :
                          formData.duration_days ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                        }`}
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

              {/* Video Information Step */}
              {currentStep === 'video' && (
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Video Information</h3>
                    <div className="text-sm text-zinc-400">
                      <span className="text-blue-400">📺 Optional</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Video URL
                        <span className="text-zinc-400 ml-1">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        name="video_url"
                        value={formData.video_url}
                        onChange={handleInputChange}
                        className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                          pendingAiUpdates?.video_url ? 'border-violet-500 ring-2 ring-violet-500/20' :
                          formData.video_url ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                        }`}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                      <p className="text-xs text-zinc-400 mt-1">Link to the video where this item appears</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Video Timestamp (seconds)
                        <span className="text-zinc-400 ml-1">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        name="video_timestamp"
                        value={formData.video_timestamp}
                        onChange={handleInputChange}
                        min="0"
                        className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                          pendingAiUpdates?.video_timestamp ? 'border-violet-500 ring-2 ring-violet-500/20' :
                          formData.video_timestamp ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                        }`}
                        placeholder="120"
                      />
                      <p className="text-xs text-zinc-400 mt-1">When the item appears in the video (optional)</p>
                    </div>
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
                        <span className="text-yellow-400">⚠ Incomplete</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Upload Images *
                        {imagePreviews.length === 0 && <span className="text-red-400 ml-1">Required</span>}
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className={`w-full bg-zinc-800/50 border rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                          pendingAiUpdates?.images ? 'border-violet-500 ring-2 ring-violet-500/20' :
                          selectedImages ? 'border-green-600 focus:border-green-500' : 'border-zinc-700 focus:border-violet-500'
                        }`}
                      />
                      <p className="text-xs text-zinc-400 mt-1">Upload high-quality images of your item. The first image will be the main thumbnail.</p>
                    </div>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              width={200}
                              height={200}
                              className="w-full h-32 object-cover rounded-lg border border-zinc-700"
                            />
                            {index === 0 && (
                              <div className="absolute top-2 left-2 bg-violet-600 text-white text-xs px-2 py-1 rounded">
                                Main
                              </div>
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
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Review & Submit</h3>
                    <p className="text-zinc-400">Please review all information before creating your auction</p>
                  </div>
                  
                  <div className="space-y-6">
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

              {/* Navigation Buttons - Enhanced with validation feedback */}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 'basic_info'}
                  className="bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Previous
                </button>

                {error && (
                  <div className="flex-1 mx-4 text-center">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

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
                  <p className="text-xs text-zinc-400">{stepConfig[currentStep]?.title || 'Basic Information'}</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {aiMessages.map((message, index) => (
                  <div key={index} className={`${
                    message.role === 'assistant' 
                      ? 'bg-violet-600/10 border-violet-600/20' 
                      : 'bg-zinc-800/50 border-zinc-700/50'
                  } border rounded-lg p-3`}>
                    <p className="text-sm text-zinc-200 whitespace-pre-line">
                      {message.content}
                    </p>
                  </div>
                ))}
                
                {aiProcessing && (
                  <div className="bg-violet-600/10 border-violet-600/20 border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></div>
                      <span className="text-sm text-zinc-300">AI is analyzing and updating your form...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Chat Input - Perfect Alignment */}
              <div className="space-y-3">
                {/* Speech Status Indicator */}
                {isListening && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-600/10 px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <span>Listening... Click stop when finished</span>
                  </div>
                )}
                
                {/* Input Row - Fixed Alignment */}
                <div className="flex gap-2 items-start">
                  {/* Text Input */}
                  <div className="flex-1">
                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder={isListening ? "🎤 Listening..." : "Tell me about your item..."}
                      className={`w-full bg-zinc-800/50 border rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors resize-none min-h-[42px] max-h-24 leading-normal ${
                        isListening 
                          ? 'border-red-500 focus:border-red-400 bg-red-600/5' 
                          : 'border-zinc-700 focus:border-violet-500'
                      }`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !isListening) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      disabled={isListening}
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
                    disabled={!isSpeechRecognitionSupported}
                    className={`w-10 h-10 rounded-lg transition-colors flex items-center justify-center flex-shrink-0 ${
                      isListening 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
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
                    onClick={() => sendMessage()}
                    disabled={!userInput.trim() || aiProcessing || isListening}
                    className="bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white px-4 h-10 rounded-lg transition-colors text-sm font-medium flex items-center justify-center flex-shrink-0"
                  >
                    {aiProcessing ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
                
                {/* Helper text */}
                <p className="text-xs text-zinc-500">
                  {isListening 
                    ? "Speak naturally - I'll capture your description. Click stop when done."
                    : "💡 Tip: Use voice input for detailed descriptions or type normally. Press Enter to send."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
