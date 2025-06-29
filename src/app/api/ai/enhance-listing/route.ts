import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface FormData {
  title?: string;
  description?: string;
  category_id?: string;
  condition?: string;
  starting_price?: string;
  reserve_price?: string;
  buy_now_price?: string;
  video_url?: string;
  video_timestamp?: string;
  duration_days?: string;
  [key: string]: string | undefined;
}

interface EnhanceListingRequest {
  userMessage?: string;
  currentStep?: string;
  currentFormData?: FormData;
  categories?: Array<{id: string, name: string}>;
}

export async function POST(request: NextRequest) {
  let currentStep = 'welcome';

  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body: EnhanceListingRequest = await request.json();
    const { 
      userMessage = '',
      currentFormData = {},
      categories = []
    } = body;

    currentStep = body.currentStep || 'welcome';

    // Analyze form completeness with strict validation
    const formAnalysis = analyzeFormState(currentFormData);
    
    const systemPrompt = `You are an AI assistant for auction listings. Your job is to:

1. Provide helpful, conversational guidance
2. Extract specific information to populate form fields
3. Guide users through: basic_info → pricing → video (optional) → images → review
4. NEVER include raw JSON or technical data in your responses
5. Be encouraging and professional

Current form analysis:
${JSON.stringify(formAnalysis, null, 2)}

Available categories: ${categories.map(c => `${c.id}: ${c.name}`).join('\n')}

Current step: ${currentStep}

Respond conversationally without any JSON or technical formatting. When you extract information, I'll handle the form updates separately.`;

    const userPrompt = `User message: "${userMessage}"

Current form data: ${JSON.stringify(currentFormData)}

Provide a helpful, conversational response to guide the user. Do NOT include any JSON or formUpdates in your response.`;

    const completion = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${userPrompt}`
        }
      ]
    });

    const aiResponse = completion.content[0].type === 'text' ? completion.content[0].text : '';

    // Enhanced parsing with better extraction
    const formUpdates = extractFormUpdates(userMessage, currentFormData, categories);
    
    // Determine what's missing and provide targeted suggestions
    const missingFields = getMissingFields({ ...currentFormData, ...formUpdates });
    const suggestions = generateSuggestions(missingFields, currentStep, formUpdates);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      formUpdates,
      nextStep: currentStep, // Keep same step until validation passes
      suggestions,
      formAnalysis
    });

  } catch (error) {
    console.error('AI Enhancement Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process AI request',
      response: 'Sorry, I encountered an error. Please try again.',
      formUpdates: {},
      nextStep: currentStep,
      suggestions: []
    }, { status: 500 });
  }
}

function analyzeFormState(formData: FormData) {
  return {
    basicInfo: {
      title: !!formData.title,
      description: !!formData.description,
      category_id: !!formData.category_id,
      condition: !!formData.condition,
      complete: !!(formData.title && formData.description && formData.category_id && formData.condition)
    },
    pricing: {
      starting_price: !!formData.starting_price,
      reserve_price: !!formData.reserve_price,
      buy_now_price: !!formData.buy_now_price,
      duration_days: !!formData.duration_days,
      complete: !!formData.starting_price
    },
    video: {
      video_url: !!formData.video_url,
      video_timestamp: !!formData.video_timestamp,
      complete: true // Optional section
    },
    missingFields: getMissingFields(formData)
  };
}

function getMissingFields(formData: FormData): string[] {
  const missing = [];
  if (!formData.title) missing.push('title');
  if (!formData.description) missing.push('description');
  if (!formData.category_id) missing.push('category');
  if (!formData.condition) missing.push('condition');
  if (!formData.starting_price) missing.push('starting_price');
  return missing;
}

function generateSuggestions(missingFields: string[], currentStep: string, formUpdates: Record<string, string>): string[] {
  const suggestions: string[] = [];
  
  if (Object.keys(formUpdates).length > 0) {
    suggestions.push("Click 'Apply to Form' above to use my suggestions");
  }
  
  if (missingFields.includes('title')) {
    suggestions.push("What should I call this item in the title?");
  }
  
  if (missingFields.includes('category')) {
    suggestions.push("What category best fits this item?");
  }
  
  if (missingFields.includes('condition')) {
    suggestions.push("What condition is the item in?");
  }
  
  if (missingFields.includes('starting_price')) {
    suggestions.push("What should the starting bid price be?");
  }
  
  return suggestions;
}

// Enhanced extraction function
function extractFormUpdates(userMessage: string, currentFormData: FormData, categories: Array<{id: string, name: string}>): Record<string, string> {
  const formUpdates: Record<string, string> = {};
  const message = userMessage.toLowerCase();

  // Extract location and context for better titles/descriptions
  let location = '';
  let context = '';
  let itemType = '';

  // Location extraction
  if (message.includes('malibu')) location = 'Malibu';
  else if (message.includes('santa monica')) location = 'Santa Monica';
  else if (message.includes('beach')) location = 'Beach';

  // Context extraction
  if (message.includes('photo shoot') || message.includes('photoshoot')) context = 'photoshoot';
  else if (message.includes('video')) context = 'video';
  else if (message.includes('vacation')) context = 'vacation';

  // Item type extraction
  if (message.includes('hat') || message.includes('cap')) itemType = 'hat';
  else if (message.includes('shirt') || message.includes('top')) itemType = 'shirt';
  else if (message.includes('sunglasses') || message.includes('glasses')) itemType = 'sunglasses';
  else if (message.includes('jewelry') || message.includes('necklace') || message.includes('bracelet')) itemType = 'jewelry';

  // Generate title if we have context
  if (!currentFormData.title && (location || context || itemType)) {
    let title = '';
    if (itemType) {
      title = itemType.charAt(0).toUpperCase() + itemType.slice(1);
      if (location) title += ` from ${location}`;
      if (context === 'photoshoot') title += ' Photoshoot';
      else if (context === 'video') title += ' Video';
    } else {
      title = 'Creator Item';
      if (location) title += ` from ${location}`;
      if (context === 'photoshoot') title += ' Photoshoot';
    }
    formUpdates.title = title;
  }

  // Generate description
  if (!currentFormData.description && (location || context)) {
    let description = `Authentic item worn by creator`;
    if (context === 'photoshoot' && location) {
      description += ` during a professional photoshoot in ${location}`;
    } else if (context === 'video') {
      description += ` in a YouTube video`;
      if (location) description += ` filmed in ${location}`;
    }
    description += '. This unique piece of creator memorabilia comes directly from their personal collection and represents a special moment captured in content.';
    formUpdates.description = description;
  }

  // Set category for clothing/accessories
  if (!currentFormData.category_id) {
    const fashionCategory = categories.find(c => 
      c.name.toLowerCase().includes('fashion') || 
      c.name.toLowerCase().includes('clothing') ||
      c.name.toLowerCase().includes('accessories')
    );
    if (fashionCategory) {
      formUpdates.category_id = fashionCategory.id;
    }
  }

  // Default condition
  if (!currentFormData.condition) {
    formUpdates.condition = 'Used - Good';
  }

  // Default starting price
  if (!currentFormData.starting_price) {
    formUpdates.starting_price = '35';
  }

  return formUpdates;
} 
