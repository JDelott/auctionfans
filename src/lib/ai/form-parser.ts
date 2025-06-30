import { AuctionFormData, Category } from '../auction-forms/types';
import Anthropic from '@anthropic-ai/sdk';
import { parseVoiceInputWithKeywords } from './enhanced-field-parser';

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
  
  console.log('extractFormUpdates called with:', { userMessage, currentStep });

  // Use the enhanced keyword-based parser
  try {
    const updates = await parseVoiceInputWithKeywords(userMessage, currentFormData, categories);
    
    if (Object.keys(updates).length > 0) {
      return updates;
    }
  } catch (error) {
    console.error('Enhanced parser failed, falling back:', error);
  }

  // Fallback to step-specific parsing if enhanced parser fails
  switch (currentStep) {
    case 'pricing':
      return await extractPricingInfoWithAI(userMessage, currentFormData);
    case 'video':
      return await extractVideoInfoWithAI(userMessage, currentFormData);
    case 'review_edit':
    case 'basic_info':
    default:
      return await extractGeneralUpdatesWithAI(userMessage, currentFormData, categories);
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

    const categoryList = categories.map(c => `- ${c.name} (id: ${c.id})`).join('\n');

    const prompt = `Parse this auction item description from speech: "${userMessage}"

Extract and auto-populate these auction fields from the user's description:

TITLE: Extract a clear, marketable title (max 8 words)
DESCRIPTION: Create a detailed description for auction
CATEGORY: Select the best matching category from the list below
CONDITION: Determine item condition based on description
STARTING_PRICE: Extract any price mentioned
RESERVE_PRICE: Extract reserve/minimum price if mentioned  
BUY_NOW_PRICE: Extract buy-it-now price if mentioned
VIDEO_TIMESTAMP: Convert time references to seconds ("2 minutes" = 120, "1:30" = 90)
DURATION_DAYS: Extract auction duration (1, 3, 5, 7, 10, 14 days)

Available categories:
${categoryList}

Condition options: new, like-new, good, fair, poor

Current data context:
- Current title: "${currentFormData.title || 'untitled'}"
- Current category: "${currentFormData.category_id || 'none selected'}"
- Current condition: "${currentFormData.condition || 'new'}"

Voice input patterns to recognize:
- Item type identification → category selection
- Condition words ("new", "used", "vintage", "mint") → condition
- Time references ("starts at 2 minutes", "begin at 1:30") → video_timestamp in seconds
- Duration ("7 day auction", "one week") → duration_days
- Prices ("starting at 25", "reserve 50", "buy now 100") → pricing fields

Return ONLY valid JSON with fields that should be updated:
{
  "title": "Short marketable title",
  "description": "Detailed description", 
  "category_id": "matching-category-id",
  "condition": "appropriate-condition",
  "starting_price": "25.00",
  "reserve_price": "50.00", 
  "buy_now_price": "100.00",
  "video_timestamp": "120",
  "duration_days": "7"
}

Only include fields that can be determined from the input. If unclear, omit the field.`;

    const completion = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 400,
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
      
      // Validate category_id exists in the provided categories
      if (parsed.category_id && !categories.find(c => c.id === parsed.category_id)) {
        // Fallback: find category by name matching
        const categoryName = parsed.category_id.toLowerCase();
        const matchedCategory = categories.find(c => 
          c.name.toLowerCase().includes(categoryName) || 
          categoryName.includes(c.name.toLowerCase())
        );
        if (matchedCategory) {
          parsed.category_id = matchedCategory.id;
        } else {
          delete parsed.category_id; // Remove invalid category
        }
      }
      
      // Validate condition
      const validConditions = ['new', 'like-new', 'good', 'fair', 'poor'];
      if (parsed.condition && !validConditions.includes(parsed.condition)) {
        // Try to map common condition descriptions
        const conditionMap: Record<string, string> = {
          'mint': 'new',
          'excellent': 'like-new', 
          'very good': 'good',
          'decent': 'good',
          'worn': 'fair',
          'damaged': 'poor',
          'used': 'good'
        };
        
        const mappedCondition = conditionMap[parsed.condition.toLowerCase()];
        if (mappedCondition) {
          parsed.condition = mappedCondition;
        } else {
          delete parsed.condition;
        }
      }
      
      // Validate numeric fields
      if (parsed.starting_price) {
        const price = parseFloat(parsed.starting_price);
        if (isNaN(price) || price <= 0) delete parsed.starting_price;
        else parsed.starting_price = price.toFixed(2);
      }
      
      if (parsed.reserve_price) {
        const price = parseFloat(parsed.reserve_price);
        if (isNaN(price) || price <= 0) delete parsed.reserve_price;
        else parsed.reserve_price = price.toFixed(2);
      }
      
      if (parsed.buy_now_price) {
        const price = parseFloat(parsed.buy_now_price);
        if (isNaN(price) || price <= 0) delete parsed.buy_now_price;
        else parsed.buy_now_price = price.toFixed(2);
      }
      
      if (parsed.video_timestamp) {
        const timestamp = parseInt(parsed.video_timestamp);
        if (isNaN(timestamp) || timestamp < 0) delete parsed.video_timestamp;
        else parsed.video_timestamp = timestamp.toString();
      }
      
      if (parsed.duration_days) {
        const validDurations = ['1', '3', '5', '7', '10', '14'];
        if (!validDurations.includes(parsed.duration_days)) {
          delete parsed.duration_days;
        }
      }

      console.log('AI extracted and validated updates:', parsed);
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
