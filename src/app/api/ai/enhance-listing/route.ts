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

    const systemPrompt = `You are an AI that helps users create auction listings. You can:
1. Parse initial item descriptions and fill form fields
2. Handle revisions and updates to existing fields
3. Focus on step-specific information

Current step: ${currentStep}
Available categories: ${categories.map(c => `${c.id}: ${c.name}`).join('\n')}

STEP FOCUS:
${currentStep === 'basic_info' ? 'Focus on: title, description, category, condition' : 
  currentStep === 'pricing' ? 'Focus on: starting_price, reserve_price, buy_now_price, duration_days' :
  currentStep === 'video' ? 'Focus on: video_url, video_timestamp' :
  currentStep === 'images' ? 'Focus on: image-related guidance' :
  'Focus on: final review and validation'}

Parse the user's message for:
- New information to add
- Revisions/changes to existing fields
- Step-specific details

Respond conversationally and confirm what changes you're making.`;

    const userPrompt = `User message: "${userMessage}"
Current step: ${currentStep}
Current form data: ${JSON.stringify(currentFormData)}

Parse for new data or revisions appropriate for the current step.`;

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

    // Enhanced parsing with step awareness and revision detection
    const formUpdates = extractFormUpdates(userMessage, currentFormData, categories, currentStep);
    
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

// General-purpose extraction function
function extractFormUpdates(userMessage: string, currentFormData: FormData, categories: Array<{id: string, name: string}>, currentStep: string): Record<string, string> {
  const formUpdates: Record<string, string> = {};

  // Detect revision keywords
  const isRevision = /\b(change|update|modify|make|set|actually|instead|rather|correction|fix)\b/.test(userMessage.toLowerCase());
  
  // STEP-SPECIFIC PARSING
  if (currentStep === 'basic_info') {
    Object.assign(formUpdates, parseBasicInfo(userMessage, currentFormData, categories, isRevision));
  } else if (currentStep === 'pricing') {
    Object.assign(formUpdates, parsePricing(userMessage, currentFormData));
  } else if (currentStep === 'video') {
    Object.assign(formUpdates, parseVideo(userMessage));
  }

  return formUpdates;
}

function parseBasicInfo(userMessage: string, currentFormData: FormData, categories: Array<{id: string, name: string}>, isRevision: boolean): Record<string, string> {
  const updates: Record<string, string> = {};
  const message = userMessage.toLowerCase();

  // Handle direct field updates
  if (isRevision) {
    // Title changes
    if (message.includes('title') || message.includes('name')) {
      const titleMatch = userMessage.match(/(?:title|name)\s+(?:to\s+|is\s+)?["']([^"']+)["']|(?:title|name)\s+(?:to\s+|is\s+)?([^.,!?\n]+)/i);
      if (titleMatch) {
        updates.title = (titleMatch[1] || titleMatch[2]).trim();
      }
    }
    
    // Description changes
    if (message.includes('description')) {
      const descMatch = userMessage.match(/description\s+(?:to\s+|is\s+)?["']([^"']+)["']|description\s+(?:to\s+|is\s+)?([^.,!?\n]+)/i);
      if (descMatch) {
        updates.description = (descMatch[1] || descMatch[2]).trim();
      }
    }
    
    // Condition changes
    const conditions = ['new', 'used - excellent', 'used - good', 'used - fair'];
    for (const condition of conditions) {
      if (message.includes(condition.toLowerCase())) {
        updates.condition = condition.charAt(0).toUpperCase() + condition.slice(1);
        break;
      }
    }
  }

  // Initial parsing for empty fields
  if (!currentFormData.title || currentFormData.title === 'Creator Item') {
    const extractedTitle = extractTitle(userMessage);
    if (extractedTitle) updates.title = extractedTitle;
  }

  if (!currentFormData.description || currentFormData.description.includes('Authentic item worn by creator')) {
    const extractedDesc = extractDescription(userMessage);
    if (extractedDesc) updates.description = extractedDesc;
  }

  if (!currentFormData.category_id) {
    const categoryId = findBestCategory(userMessage, categories);
    if (categoryId) updates.category_id = categoryId;
  }

  if (!currentFormData.condition) {
    updates.condition = 'Used - Good'; // Default
  }

  return updates;
}

function extractTitle(userMessage: string): string | null {
  // Look for common item descriptors
  const words = userMessage.toLowerCase().split(' ');
  const itemKeywords = ['pair', 'set', 'collection', 'vintage', 'original', 'signed', 'rare', 'limited'];
  const itemTypes = ['book', 'shirt', 'shoes', 'hat', 'jacket', 'watch', 'phone', 'laptop', 'guitar', 'camera', 'art', 'poster', 'card', 'coin', 'toy', 'game'];
  
  // Find the main item type
  let mainItem = '';
  for (const type of itemTypes) {
    if (words.includes(type) || words.includes(type + 's')) {
      mainItem = type;
      break;
    }
  }
  
  if (mainItem) {
    // Look for descriptive words before the item
    const itemIndex = words.findIndex(word => word === mainItem || word === mainItem + 's');
    const descriptors = words.slice(Math.max(0, itemIndex - 3), itemIndex)
      .filter(word => itemKeywords.includes(word) || /\d{4}/.test(word)); // Include years
    
    const title = descriptors.concat([mainItem]).join(' ');
    return title.charAt(0).toUpperCase() + title.slice(1);
  }
  
  return null;
}

function extractDescription(userMessage: string): string | null {
  // Clean up the message and use it as description if it's descriptive enough
  const cleaned = userMessage.trim();
  if (cleaned.length > 20) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) + 
           (cleaned.endsWith('.') ? '' : '.');
  }
  return null;
}

function findBestCategory(userMessage: string, categories: Array<{id: string, name: string}>): string | null {
  const message = userMessage.toLowerCase();
  
  // Try to match categories by keywords
  const categoryKeywords = {
    'fashion': ['shirt', 'shoes', 'hat', 'jacket', 'pants', 'dress', 'clothing', 'wear'],
    'electronics': ['phone', 'laptop', 'computer', 'camera', 'headphones', 'tech'],
    'collectibles': ['card', 'coin', 'figurine', 'vintage', 'rare', 'signed', 'limited'],
    'books': ['book', 'novel', 'textbook', 'magazine', 'comic'],
    'art': ['painting', 'artwork', 'poster', 'print', 'canvas'],
    'music': ['guitar', 'piano', 'drum', 'vinyl', 'cd', 'record'],
    'games': ['game', 'console', 'controller', 'board game'],
    'home': ['furniture', 'lamp', 'chair', 'table', 'decor']
  };
  
  for (const [categoryType, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      const category = categories.find(c => 
        c.name.toLowerCase().includes(categoryType) ||
        keywords.some(k => c.name.toLowerCase().includes(k))
      );
      if (category) return category.id;
    }
  }
  
  return null;
}

function parsePricing(userMessage: string, currentFormData: FormData): Record<string, string> {
  const updates: Record<string, string> = {};

  // Extract all price mentions
  const priceMatches = userMessage.match(/\$(\d+(?:\.\d{2})?)/g);
  if (priceMatches) {
    const prices = priceMatches.map(p => p.replace('$', ''));
    
    // Smart assignment based on context and values
    if (prices.length === 1) {
      if (!currentFormData.starting_price) {
        updates.starting_price = prices[0];
      }
    } else if (prices.length >= 2) {
      const sortedPrices = prices.map(Number).sort((a, b) => a - b);
      if (!currentFormData.starting_price) updates.starting_price = sortedPrices[0].toString();
      if (!currentFormData.reserve_price && sortedPrices.length > 1) updates.reserve_price = sortedPrices[1].toString();
      if (!currentFormData.buy_now_price && sortedPrices.length > 2) updates.buy_now_price = sortedPrices[2].toString();
    }
  }

  // Duration extraction
  const durationMatch = userMessage.match(/(\d+)\s*days?/i);
  if (durationMatch && !currentFormData.duration_days) {
    updates.duration_days = durationMatch[1];
  }

  return updates;
}

function parseVideo(userMessage: string): Record<string, string> {
  const updates: Record<string, string> = {};

  // URL extraction
  const urlMatch = userMessage.match(/(https?:\/\/[^\s]+)/i);
  if (urlMatch) {
    updates.video_url = urlMatch[1];
  }

  // Timestamp extraction - handle various formats
  const timestampMatch = userMessage.match(/(\d+:\d+|\d+\s*(?:seconds?|minutes?|mins?))/i);
  if (timestampMatch) {
    const timestamp = timestampMatch[1];
    if (timestamp.includes(':')) {
      const [min, sec] = timestamp.split(':').map(Number);
      updates.video_timestamp = String(min * 60 + (sec || 0));
    } else {
      const number = parseInt(timestamp);
      updates.video_timestamp = timestamp.includes('min') ? String(number * 60) : String(number);
    }
  }

  return updates;
} 
