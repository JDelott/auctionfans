import { AuctionFormData, Category } from '../auction-forms/types';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Field keyword mappings for voice input detection
const FIELD_KEYWORDS = {
  title: [
    'title', 'name', 'call it', 'named', 'item title', 'auction title'
  ],
  description: [
    'description', 'describe', 'details', 'about', 'explain', 'condition details'
  ],
  category: [
    'category', 'type', 'kind of', 'genre', 'section', 'classified as'
  ],
  condition: [
    'condition', 'quality', 'state', 'new', 'used', 'mint', 'excellent', 'good', 'fair', 'poor', 'vintage', 'worn'
  ],
  starting_price: [
    'starting', 'start at', 'starting price', 'starting bid', 'minimum bid', 'begin at', 'opening bid'
  ],
  reserve_price: [
    'reserve', 'reserve price', 'minimum', 'minimum price', 'won\'t sell below', 'reserve at'
  ],
  buy_now_price: [
    'buy now', 'buy it now', 'instant', 'immediate purchase', 'fixed price', 'outright'
  ],
  duration_days: [
    'duration', 'days', 'length', 'how long', 'auction length', 'week', 'day auction'
  ],
  video_url: [
    'video', 'youtube', 'vimeo', 'link', 'url', 'watch at'
  ],
  video_timestamp: [
    'timestamp', 'starts at', 'begin at', 'time', 'minutes', 'seconds', 'video starts'
  ]
};

// Enhanced field detection with keyword matching
export function detectRelevantFields(userMessage: string): string[] {
  const message = userMessage.toLowerCase();
  const relevantFields: string[] = [];

  for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
    const hasKeyword = keywords.some(keyword => 
      message.includes(keyword.toLowerCase())
    );
    
    if (hasKeyword) {
      relevantFields.push(field);
    }
  }

  // Special detection for numbers that might be prices
  const hasNumbers = /\d+/.test(message);
  const hasDollar = message.includes('dollar') || message.includes('$');
  const hasPrice = message.includes('price') || message.includes('cost');
  
  if ((hasNumbers && hasDollar) || hasPrice) {
    if (!relevantFields.includes('starting_price')) {
      relevantFields.push('starting_price');
    }
  }

  // Special detection for time references
  const hasTimeRef = message.includes('minute') || message.includes('second') || 
                    message.includes(':') || /\d+\s*(min|sec)/.test(message);
  if (hasTimeRef && !relevantFields.includes('video_timestamp')) {
    relevantFields.push('video_timestamp');
  }

  console.log('Detected relevant fields:', relevantFields, 'from message:', message);
  return relevantFields;
}

// Process specific field with AI
export async function processFieldWithAI(
  fieldName: string,
  userMessage: string,
  currentFormData: AuctionFormData,
  categories: Category[]
): Promise<string | null> {
  
  try {
    let prompt = '';
    
    switch (fieldName) {
      case 'title':
        prompt = `Extract or generate a clear auction title from: "${userMessage}"
        
Rules:
- Maximum 8 words
- Clear and marketable
- Include main item type
- Don't include condition unless it's key (like "Vintage")

Current title: "${currentFormData.title || ''}"

Return ONLY the title:`;
        break;

      case 'description':
        prompt = `Extract or enhance the item description from: "${userMessage}"
        
Rules:
- Clear and detailed
- Include condition, features, benefits
- Professional auction language
- 20-100 words

Current description: "${currentFormData.description || ''}"

Return ONLY the description:`;
        break;

      case 'category_id':
        const categoryList = categories.map(c => `${c.id}: ${c.name}`).join('\n');
        prompt = `Select the best category ID for this item: "${userMessage}"

Available categories:
${categoryList}

Rules:
- Return ONLY the category ID (not the name)
- Choose the most specific match
- If unclear, choose the broader category

Return ONLY the category ID:`;
        break;

      case 'condition':
        prompt = `Determine the item condition from: "${userMessage}"

Valid conditions: new, like-new, good, fair, poor

Rules:
- "mint", "excellent", "perfect" → like-new
- "vintage", "used but good" → good  
- "worn", "some wear" → fair
- "damaged", "broken" → poor
- Default to "good" if unclear

Return ONLY the condition:`;
        break;

      case 'starting_price':
        prompt = `Extract the starting price from: "${userMessage}"

Rules:
- Return ONLY the numeric value (no $ sign)
- Convert words to numbers ("twenty-five" → "25")
- Look for "starting", "start at", "beginning bid"
- Format as decimal (25.00)

Return ONLY the price number:`;
        break;

      case 'reserve_price':
        prompt = `Extract the reserve price from: "${userMessage}"

Rules:
- Return ONLY the numeric value (no $ sign)
- Look for "reserve", "minimum", "won't sell below"
- Convert words to numbers
- Format as decimal (50.00)

Return ONLY the price number:`;
        break;

      case 'buy_now_price':
        prompt = `Extract the buy now price from: "${userMessage}"

Rules:
- Return ONLY the numeric value (no $ sign)
- Look for "buy now", "buy it now", "instant purchase"
- Convert words to numbers
- Format as decimal (150.00)

Return ONLY the price number:`;
        break;

      case 'duration_days':
        prompt = `Extract the auction duration from: "${userMessage}"

Rules:
- Return ONLY the number of days
- Convert "week" → 7, "two weeks" → 14
- Valid values: 1, 3, 5, 7, 10, 14
- Default to 7 if unclear

Return ONLY the number:`;
        break;

      case 'video_url':
        prompt = `Extract and clean the video URL from: "${userMessage}"

Rules:
- Add https:// if missing
- Clean up the URL format
- Support YouTube, Vimeo, etc.
- Return full URL

Return ONLY the URL:`;
        break;

      case 'video_timestamp':
        prompt = `Convert the time reference to seconds from: "${userMessage}"

Rules:
- "2 minutes" → 120
- "1 minute 30 seconds" → 90
- "1:30" → 90
- "2:15" → 135
- Return ONLY the number of seconds

Return ONLY the seconds number:`;
        break;

      default:
        return null;
    }

    const completion = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const result = completion.content[0].type === 'text' ? completion.content[0].text.trim() : '';
    
    // Validate result
    return validateFieldValue(fieldName, result, categories);
    
  } catch (error) {
    console.error(`Error processing field ${fieldName}:`, error);
    return null;
  }
}

// Validate extracted field values
function validateFieldValue(fieldName: string, value: string, categories: Category[]): string | null {
  if (!value || value.trim() === '') return null;
  
  switch (fieldName) {
    case 'title':
      // Max 8 words, clean up
      const words = value.trim().split(' ').filter(w => w.length > 0);
      return words.slice(0, 8).join(' ');
      
    case 'description':
      // Clean up description
      return value.trim().length > 10 ? value.trim() : null;
      
    case 'category_id':
      // Validate category ID exists
      return categories.find(c => c.id === value) ? value : null;
      
    case 'condition':
      const validConditions = ['new', 'like-new', 'good', 'fair', 'poor'];
      return validConditions.includes(value.toLowerCase()) ? value.toLowerCase() : null;
      
    case 'starting_price':
    case 'reserve_price':  
    case 'buy_now_price':
      // Validate price format
      const price = parseFloat(value.replace(/[^\d.]/g, ''));
      return !isNaN(price) && price > 0 ? price.toFixed(2) : null;
      
    case 'duration_days':
      const validDurations = ['1', '3', '5', '7', '10', '14'];
      return validDurations.includes(value) ? value : null;
      
    case 'video_url':
      // Basic URL validation
      try {
        new URL(value.startsWith('http') ? value : `https://${value}`);
        return value.startsWith('http') ? value : `https://${value}`;
      } catch {
        return null;
      }
      
    case 'video_timestamp':
      const timestamp = parseInt(value);
      return !isNaN(timestamp) && timestamp >= 0 ? timestamp.toString() : null;
      
    default:
      return value.trim();
  }
}

// Main enhanced parsing function
export async function parseVoiceInputWithKeywords(
  userMessage: string,
  currentFormData: AuctionFormData,
  categories: Category[]
): Promise<Record<string, string>> {
  
  console.log('Enhanced parsing for:', userMessage);
  
  // 1. Detect which fields are relevant
  const relevantFields = detectRelevantFields(userMessage);
  
  if (relevantFields.length === 0) {
    console.log('No relevant fields detected, falling back to general extraction');
    // If no specific fields detected, try general item description
    relevantFields.push('title', 'description', 'category_id', 'condition');
  }
  
  // 2. Process each relevant field
  const formUpdates: Record<string, string> = {};
  
  for (const fieldName of relevantFields) {
    // Skip if field already has a value and we're not specifically updating it
    const hasExistingValue = currentFormData[fieldName as keyof AuctionFormData];
    const isSpecificUpdate = userMessage.toLowerCase().includes(fieldName) || 
                           FIELD_KEYWORDS[fieldName as keyof typeof FIELD_KEYWORDS]
                             ?.some(kw => userMessage.toLowerCase().includes(kw.toLowerCase()));
    
    if (hasExistingValue && !isSpecificUpdate) {
      console.log(`Skipping ${fieldName} - already has value and not specifically mentioned`);
      continue;
    }
    
    const extractedValue = await processFieldWithAI(fieldName, userMessage, currentFormData, categories);
    
    if (extractedValue) {
      formUpdates[fieldName] = extractedValue;
      console.log(`✅ Extracted ${fieldName}: ${extractedValue}`);
    } else {
      console.log(`❌ Could not extract ${fieldName} from input`);
    }
  }
  
  console.log('Final form updates:', formUpdates);
  return formUpdates;
} 
