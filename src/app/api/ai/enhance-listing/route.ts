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

    const systemPrompt = `You are an AI that parses user descriptions of items they want to auction and extracts structured form data.

Current step: ${currentStep}
Available categories: ${categories.map(c => `${c.id}: ${c.name}`).join('\n')}

Parse the user's message and extract form field values. Respond with helpful confirmation of what you understood, then the system will auto-fill the form.

Focus on extracting:
- Item type and descriptive title
- Detailed description with context
- Appropriate category
- Reasonable condition assessment
- Any pricing mentioned`;

    const userPrompt = `Parse this item description: "${userMessage}"

Current form: ${JSON.stringify(currentFormData)}

Extract and fill appropriate form fields based on what the user described.`;

    const completion = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${userPrompt}`
        }
      ]
    });

    const aiResponse = completion.content[0].type === 'text' ? completion.content[0].text : '';

    // Comprehensive parsing and form filling
    const formUpdates = extractFormUpdates(userMessage, currentFormData, categories);
    
    return NextResponse.json({
      success: true,
      response: aiResponse,
      formUpdates,
      nextStep: currentStep,
      suggestions: [],
      formAnalysis: analyzeFormState({ ...currentFormData, ...formUpdates })
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

export function generateSuggestions(missingFields: string[], currentStep: string, formUpdates: Record<string, string>): string[] {
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

// Comprehensive extraction function
function extractFormUpdates(userMessage: string, currentFormData: FormData, categories: Array<{id: string, name: string}>): Record<string, string> {
  const formUpdates: Record<string, string> = {};
  const message = userMessage.toLowerCase();

  // Item type detection with comprehensive patterns
  let itemType = '';
  let artist = '';
  let event = '';
  let context = '';

  // Detect item types
  const itemTypes = {
    'shoes': ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'footwear'],
    'shirt': ['shirt', 'tee', 't-shirt', 'top', 'blouse', 'jersey', 'tank'],
    'hat': ['hat', 'cap', 'beanie', 'helmet', 'headwear'],
    'jacket': ['jacket', 'coat', 'hoodie', 'sweater', 'cardigan'],
    'pants': ['pants', 'jeans', 'shorts', 'trousers', 'leggings'],
    'dress': ['dress', 'gown', 'skirt'],
    'sunglasses': ['sunglasses', 'glasses', 'shades'],
    'jewelry': ['necklace', 'bracelet', 'ring', 'earrings', 'jewelry', 'watch'],
    'bag': ['bag', 'purse', 'backpack', 'tote', 'handbag']
  };

  for (const [type, patterns] of Object.entries(itemTypes)) {
    if (patterns.some(pattern => message.includes(pattern))) {
      itemType = type;
      break;
    }
  }

  // Detect artists/bands
  const artists = ['metallica', 'taylor swift', 'drake', 'beyonce', 'kanye', 'eminem', 'rihanna', 'adele', 'billie eilish', 'post malone'];
  for (const artistName of artists) {
    if (message.includes(artistName)) {
      artist = artistName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  // Detect events
  if (message.includes('summer metal festival')) event = 'Summer Metal Festival';
  else if (message.includes('coachella')) event = 'Coachella';
  else if (message.includes('lollapalooza')) event = 'Lollapalooza';

  // Detect context
  if (message.includes('concert') || message.includes('show') || message.includes('festival')) {
    context = 'concert';
  } else if (message.includes('video') || message.includes('youtube')) {
    context = 'video';
  } else if (message.includes('photo') || message.includes('shoot')) {
    context = 'photoshoot';
  }

  // Generate title
  if (!currentFormData.title || currentFormData.title === 'Creator Item') {
    let title = '';
    
    if (context === 'concert' && artist && itemType) {
      title = `${artist} Concert Worn ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
      if (event) title += ` - ${event}`;
    } else if (context === 'video' && itemType) {
      title = `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} from YouTube Video`;
    } else if (itemType) {
      title = `Creator ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
    }
    
    if (title) formUpdates.title = title;
  }

  // Generate description
  if (!currentFormData.description || currentFormData.description.includes('Authentic item worn by creator')) {
    let description = '';
    
    if (context === 'concert' && artist) {
      description = `Authentic ${itemType || 'item'} worn to ${artist} concert`;
      if (event) description += ` at ${event}`;
      description += '. This unique piece of concert memorabilia was personally worn by the creator and captured in their YouTube video coverage of the event.';
    } else if (context === 'video') {
      description = `Authentic ${itemType || 'item'} worn by creator in a YouTube video`;
      if (artist || event) {
        description += ` featuring ${artist || event}`;
      }
      description += '. This unique piece of creator memorabilia comes directly from their personal collection.';
    } else {
      description = `Authentic ${itemType || 'item'} from creator's personal collection. This unique piece of memorabilia represents a special moment and comes with the story behind it.`;
    }
    
    if (description) formUpdates.description = description;
  }

  // Set category
  if (!currentFormData.category_id) {
    let categoryName = '';
    
    if (['shoes', 'shirt', 'hat', 'jacket', 'pants', 'dress', 'sunglasses', 'jewelry', 'bag'].includes(itemType)) {
      categoryName = 'fashion';
    } else if (context === 'concert') {
      categoryName = 'music';
    }
    
    const category = categories.find(c => 
      c.name.toLowerCase().includes(categoryName) ||
      c.name.toLowerCase().includes('fashion') ||
      c.name.toLowerCase().includes('accessories') ||
      c.name.toLowerCase().includes('clothing')
    );
    
    if (category) formUpdates.category_id = category.id;
  }

  // Set condition
  if (!currentFormData.condition) {
    formUpdates.condition = 'Used - Good';
  }

  // Extract pricing if mentioned
  const priceMatch = userMessage.match(/\$(\d+)/);
  if (priceMatch && !currentFormData.starting_price) {
    formUpdates.starting_price = priceMatch[1];
  }

  return formUpdates;
} 
