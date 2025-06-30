import { AuctionFormData, Category } from '../auction-forms/types';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function extractFormUpdates(
  userMessage: string, 
  currentFormData: AuctionFormData, 
  categories: Category[],
  currentStep: string = 'basic_info'
): Promise<Record<string, string>> {
  console.log('extractFormUpdates called:', { userMessage, currentStep });
  
  // Step-specific extraction
  switch (currentStep) {
    case 'basic_info':
      return extractBasicInfo(userMessage, currentFormData, categories);
    
    case 'pricing':
      return await extractPricingInfoWithAI(userMessage, currentFormData);
    
    case 'video':
      return await extractVideoInfoWithAI(userMessage, currentFormData);
    
    case 'images':
    case 'review':
    case 'review_edit': // Add the new step from batch system
      // Use AI-powered extraction for review steps
      return await extractGeneralUpdatesWithAI(userMessage, currentFormData, categories);
    
    default:
      return extractBasicInfo(userMessage, currentFormData, categories);
  }
}

// AI-powered pricing extraction
export async function extractPricingInfoWithAI(
  userMessage: string, 
  currentFormData: AuctionFormData
): Promise<Record<string, string>> {
  const formUpdates: Record<string, string> = {};
  
  try {
    console.log('Using AI to extract pricing from:', userMessage);

    const prompt = `Parse this auction pricing information from speech: "${userMessage}"

Extract the following pricing details and return as JSON:
- starting_price: The starting bid amount (required)
- reserve_price: The minimum sale price (optional)
- buy_now_price: The instant purchase price (optional)  
- duration_days: Auction duration in days (optional, common values: 1, 3, 7, 10, 14)

Instructions:
- Extract only numeric values (no dollar signs)
- If someone says "twenty-five" convert to "25"
- Handle speech recognition errors (e.g. "their price" might mean "reserve price")
- If a field isn't mentioned, don't include it in the response
- For duration, convert "week" to 7 days

Current form data context:
- Current starting price: "${currentFormData.starting_price || 'not set'}"
- Current reserve price: "${currentFormData.reserve_price || 'not set'}"
- Current buy now price: "${currentFormData.buy_now_price || 'not set'}"
- Current duration: "${currentFormData.duration_days || '7'}" days

Return ONLY valid JSON like: {"starting_price": "25", "reserve_price": "50"}`;

    const completion = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const aiResponse = completion.content[0].type === 'text' ? completion.content[0].text.trim() : '';
    console.log('AI pricing response:', aiResponse);

    // Parse the JSON response
    try {
      const parsed = JSON.parse(aiResponse);
      
      // Only update fields that aren't already set
      if (parsed.starting_price && !currentFormData.starting_price) {
        formUpdates.starting_price = parsed.starting_price;
      }
      if (parsed.reserve_price && !currentFormData.reserve_price) {
        formUpdates.reserve_price = parsed.reserve_price;
      }
      if (parsed.buy_now_price && !currentFormData.buy_now_price) {
        formUpdates.buy_now_price = parsed.buy_now_price;
      }
      if (parsed.duration_days && (!currentFormData.duration_days || currentFormData.duration_days === '7')) {
        formUpdates.duration_days = parsed.duration_days;
      }

      console.log('AI extracted pricing:', formUpdates);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      
      // Fallback: extract any numbers mentioned
      const numbers = userMessage.match(/\d+/g);
      if (numbers && numbers.length > 0 && !currentFormData.starting_price) {
        formUpdates.starting_price = numbers[0];
        console.log('Fallback: extracted starting price:', numbers[0]);
      }
    }

  } catch (error) {
    console.error('AI pricing extraction error:', error);
    
    // Ultimate fallback: basic number extraction
    const numbers = userMessage.match(/\d+/g);
    if (numbers && numbers.length > 0 && !currentFormData.starting_price) {
      formUpdates.starting_price = numbers[0];
      console.log('Fallback: extracted starting price:', numbers[0]);
    }
  }

  return formUpdates;
}

// AI-powered video extraction
export async function extractVideoInfoWithAI(
  userMessage: string, 
  currentFormData: AuctionFormData
): Promise<Record<string, string>> {
  const formUpdates: Record<string, string> = {};
  
  try {
    console.log('Using AI to extract video info from:', userMessage);

    const prompt = `Parse this video information from speech: "${userMessage}"

Extract video details and return as JSON:
- video_url: Any YouTube, Vimeo, or other video URL mentioned
- video_timestamp: Start time in seconds (convert "2 minutes" to 120, "1:30" to 90)

Instructions:
- Clean up URLs (add https:// if missing)
- Convert time references to seconds
- If no video info is mentioned, return empty object {}

Return ONLY valid JSON like: {"video_url": "https://youtube.com/watch?v=abc123", "video_timestamp": "120"}`;

    const completion = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const aiResponse = completion.content[0].type === 'text' ? completion.content[0].text.trim() : '';
    console.log('AI video response:', aiResponse);

    try {
      const parsed = JSON.parse(aiResponse);
      
      if (parsed.video_url && !currentFormData.video_url) {
        formUpdates.video_url = parsed.video_url;
      }
      if (parsed.video_timestamp && !currentFormData.video_timestamp) {
        formUpdates.video_timestamp = parsed.video_timestamp;
      }

      console.log('AI extracted video info:', formUpdates);
    } catch (parseError) {
      console.error('Failed to parse AI video response:', parseError);
    }

  } catch (error) {
    console.error('AI video extraction error:', error);
  }

  return formUpdates;
}

function extractBasicInfo(
  userMessage: string, 
  currentFormData: AuctionFormData, 
  categories: Category[]
): Record<string, string> {
  const formUpdates: Record<string, string> = {};

  // Simple title extraction
  if (!currentFormData.title) {
    const title = extractSimpleTitle(userMessage);
    if (title) formUpdates.title = title;
  }

  // Simple description enhancement
  if (!currentFormData.description) {
    const description = enhanceDescription(userMessage);
    if (description) formUpdates.description = description;
  }

  // Simple category matching
  if (!currentFormData.category_id) {
    const categoryId = findSimpleCategory(userMessage, categories);
    if (categoryId) formUpdates.category_id = categoryId;
  }

  // Simple condition
  if (!currentFormData.condition || currentFormData.condition === 'new') {
    const condition = extractCondition(userMessage);
    if (condition) formUpdates.condition = condition;
  }

  return formUpdates;
}

// NEW: AI-powered general extraction for review step
async function extractGeneralUpdatesWithAI(
  userMessage: string, 
  currentFormData: AuctionFormData, 
  categories: Category[]
): Promise<Record<string, string>> {
  try {
    console.log('Using AI to extract general updates from:', userMessage);

    const prompt = `Parse this auction update request from speech: "${userMessage}"

The user wants to update their auction listing. Extract any field updates mentioned and return as JSON.

Possible fields to update:
- title: Item title/name
- description: Item description  
- starting_price: Starting bid price (numbers only, no $)
- reserve_price: Reserve price (numbers only, no $)
- buy_now_price: Buy it now price (numbers only, no $)
- condition: Item condition (new, like-new, good, fair, poor)
- duration_days: Auction duration (1, 3, 5, 7, 10, 14)

Current auction data:
- Title: "${currentFormData.title || 'untitled'}"
- Description: "${currentFormData.description || 'no description'}"
- Starting price: "$${currentFormData.starting_price || '0'}"
- Condition: "${currentFormData.condition || 'new'}"

Natural language patterns to recognize:
- "I need the title to be..." → update title
- "Change the title to..." → update title  
- "Set title as..." → update title
- "Make the price..." → update starting_price
- "The condition should be..." → update condition
- "Update description to..." → update description

Return ONLY valid JSON with fields that need updating. If no updates needed, return {}.

Example: {"title": "Sneaker.io AR Shoes Snapchat Conference 2025"}`;

    const completion = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const aiResponse = completion.content[0].type === 'text' ? completion.content[0].text.trim() : '';
    console.log('AI general updates response:', aiResponse);

    try {
      const parsed = JSON.parse(aiResponse);
      console.log('AI extracted general updates:', parsed);
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse AI general updates response:', parseError);
      // Fallback to old method
      return extractGeneralUpdates(userMessage, currentFormData, categories);
    }

  } catch (error) {
    console.error('AI general extraction error:', error);
    // Fallback to old method
    return extractGeneralUpdates(userMessage, currentFormData, categories);
  }
}

function extractCondition(userMessage: string): string | null {
  const message = userMessage.toLowerCase();
  
  if (message.includes('new') || message.includes('brand new')) return 'New';
  if (message.includes('excellent')) return 'Used - Excellent';
  if (message.includes('good') || message.includes('decent')) return 'Used - Good';
  if (message.includes('fair') || message.includes('worn')) return 'Used - Fair';
  
  return 'Used - Good'; // Default
}

export function extractSimpleTitle(userMessage: string): string | null {
  // Find item type
  const words = userMessage.toLowerCase().split(' ');
  const commonItems = ['shoes', 'shirt', 'hat', 'jacket', 'pants', 'dress', 'watch', 'bag', 'book', 'phone', 'headphones'];
  
  let itemType = '';
  for (const item of commonItems) {
    if (words.includes(item) || words.includes(item + 's')) {
      itemType = item;
      break;
    }
  }
  
  if (itemType) {
    // Look for descriptive words
    const descriptors = [];
    if (userMessage.toLowerCase().includes('vintage')) descriptors.push('Vintage');
    if (userMessage.toLowerCase().includes('rare')) descriptors.push('Rare');
    if (userMessage.toLowerCase().includes('signed')) descriptors.push('Signed');
    
    const title = descriptors.join(' ') + (descriptors.length ? ' ' : '') + 
                  itemType.charAt(0).toUpperCase() + itemType.slice(1);
    
    return title;
  }
  
  return null;
}

export function enhanceDescription(userMessage: string): string | null {
  // Clean up and enhance the user's description
  let description = userMessage.trim();
  
  // Capitalize first letter
  description = description.charAt(0).toUpperCase() + description.slice(1);
  
  // Add period if missing
  if (!description.endsWith('.') && !description.endsWith('!') && !description.endsWith('?')) {
    description += '.';
  }
  
  // Add a simple enhancement
  if (description.length > 10) {
    description += ' This item is from my personal collection.';
  }
  
  return description;
}

export function findSimpleCategory(userMessage: string, categories: Category[]): string | null {
  const message = userMessage.toLowerCase();
  
  // Simple keyword matching
  const categoryKeywords = {
    'fashion': ['shoes', 'shirt', 'hat', 'jacket', 'pants', 'dress', 'clothing'],
    'electronics': ['phone', 'laptop', 'headphones', 'camera'],
    'books': ['book', 'novel', 'magazine'],
    'collectibles': ['vintage', 'rare', 'signed', 'limited'],
    'accessories': ['watch', 'jewelry', 'bag', 'sunglasses']
  };
  
  for (const [categoryType, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      const category = categories.find(c => 
        c.name.toLowerCase().includes(categoryType)
      );
      if (category) return category.id;
    }
  }
  
  return null;
}

// Keep the old function as fallback
function extractGeneralUpdates(
  userMessage: string, 
  currentFormData: AuctionFormData, 
  categories: Category[]
): Record <string, string> {
  const formUpdates: Record<string, string> = {};
  const message = userMessage.toLowerCase();

  // Handle field-specific update requests with more patterns
  if (message.includes('title')) {
    // More patterns for title updates
    const titlePatterns = [
      /(?:change|update|set|make)\s+(?:the\s+)?title\s+(?:to\s+|as\s+)(.+)/i,
      /(?:i\s+need|i\s+want)\s+(?:the\s+)?title\s+(?:to\s+be\s+|as\s+)(.+)/i,
      /title\s+(?:should\s+be\s+|is\s+)(.+)/i
    ];
    
    for (const pattern of titlePatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        formUpdates.title = match[1].trim().replace(/[.,!?]+$/, ''); // Remove trailing punctuation
        break;
      }
    }
  }

  if (message.includes('price')) {
    const priceMatch = message.match(/(?:change|update|set|make)\s+(?:the\s+)?price\s+(?:to\s+)?\$?(\d+(?:\.\d{2})?)/i);
    if (priceMatch) {
      formUpdates.starting_price = priceMatch[1];
    }
  }

  if (message.includes('condition')) {
    const condition = extractCondition(userMessage);
    if (condition) formUpdates.condition = condition;
  }

  if (message.includes('description')) {
    const descMatch = message.match(/(?:change|update|set|make)\s+(?:the\s+)?description\s+(?:to\s+)(.+)/i);
    if (descMatch) {
      formUpdates.description = descMatch[1].trim();
    }
  }

  // If no specific patterns matched, try basic extraction
  if (Object.keys(formUpdates).length === 0) {
    const basicUpdates = extractBasicInfo(userMessage, currentFormData, categories);
    return basicUpdates;
  }

  return formUpdates;
} 
