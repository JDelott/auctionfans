import { AuctionFormData, Category, FieldUpdate } from '../auction-forms/types';
import { extractFormUpdates } from './form-parser';
import { findBestCategory } from './category-matcher';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export function getSimpleReason(field: string): string {
  const reasons: Record<string, string> = {
    'title': 'Generated title from your description',
    'description': 'Enhanced your description',
    'category_id': 'Selected matching category',
    'condition': 'Set condition based on item type',
    'starting_price': 'Used price from your input',
    'reserve_price': 'Set reserve price',
    'buy_now_price': 'Added buy now option',
    'duration_days': 'Set auction duration'
  };
  
  return reasons[field] || 'Updated from your input';
}

async function enhanceFieldWithAI(
  userMessage: string,
  fieldName: string, 
  currentValue: string,
  fullFormData: AuctionFormData
): Promise<{ value: string; reason: string } | null> {
  
  try {
    let prompt = '';
    
    if (fieldName === 'title') {
      // For title, use description as context
      const description = fullFormData.description || '';
      
      if (!description.trim()) {
        // If no description, fall back to enhancing current title
        if (!currentValue.trim()) return null;
        prompt = `Make this auction title ${userMessage.toLowerCase()}: "${currentValue}"

Return only the improved title (max 8 words):`;
      } else {
        // Use description as context for title generation
        prompt = `Based on this item description: "${description}"

Create a ${userMessage.toLowerCase()} auction title for this item.

Current title: "${currentValue || 'untitled'}"

Return only the new title (max 8 words):`;
      }
    } else if (fieldName === 'description') {
      // For description, work with current content
      if (!currentValue.trim()) return null;
      prompt = `Make this auction description ${userMessage.toLowerCase()}: "${currentValue}"

Return only the improved description (max 50 words):`;
    } else {
      // For other fields, use current value
      if (!currentValue.trim()) return null;
      prompt = `Make this ${fieldName.replace('_', ' ')} ${userMessage.toLowerCase()}: "${currentValue}"

Return only the improved text:`;
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

    const enhancedText = completion.content[0].type === 'text' ? completion.content[0].text.trim() : '';
    
    if (enhancedText && enhancedText !== currentValue) {
      return {
        value: enhancedText,
        reason: fieldName === 'title' 
          ? `AI generated title from description: ${userMessage.toLowerCase()}`
          : `AI enhanced: ${userMessage.toLowerCase()}`
      };
    }
    
    return null;
  } catch (error) {
    console.error('AI Field Enhancement Error:', error);
    return null;
  }
}

export async function extractFormUpdatesWithReasons(
  userMessage: string, 
  currentFormData: AuctionFormData, 
  categories: Category[], 
  currentStep: string,
  iterationField?: string,
  rejectedFields: string[] = []
): Promise<{ formUpdates: Record<string, string>; fieldUpdates: FieldUpdate[] }> {
  
  const formUpdates: Record<string, string> = {};
  const fieldUpdates: FieldUpdate[] = [];

  // Handle field iteration with real AI enhancement
  if (iterationField) {
    const currentValue = currentFormData[iterationField as keyof AuctionFormData] as string;
    const updatedValue = await enhanceFieldWithAI(userMessage, iterationField, currentValue, currentFormData);
    if (updatedValue) {
      formUpdates[iterationField] = updatedValue.value;
      fieldUpdates.push({
        field: iterationField,
        value: updatedValue.value,
        reason: updatedValue.reason,
        current: currentValue
      });
    }
    return { formUpdates, fieldUpdates };
  }

  // Simple extraction for initial form filling
  const updates = extractFormUpdates(userMessage, currentFormData, categories);
  
  // Convert to field updates with simple reasons
  Object.entries(updates).forEach(([field, value]) => {
    if (!rejectedFields.includes(field)) {
      formUpdates[field] = value;
      fieldUpdates.push({
        field,
        value,
        reason: getSimpleReason(field),
        current: currentFormData[field as keyof AuctionFormData] as string
      });
    }
  });

  return { formUpdates, fieldUpdates };
}

// Keep the old iterateOnField function as fallback but it won't be used now
export function iterateOnField(
  userMessage: string, 
  field: string, 
  currentFormData: AuctionFormData,
  categories: Category[]
): { value: string; reason: string } | null {
  
  const message = userMessage.toLowerCase();
  
  switch (field) {
    case 'title':
      if (message.includes('shorter') || message.includes('brief')) {
        const words = (currentFormData.title || '').split(' ');
        return {
          value: words.slice(0, Math.max(3, words.length - 2)).join(' '),
          reason: 'Made title more concise as requested'
        };
      }
      if (message.includes('exciting') || message.includes('catchy')) {
        return {
          value: `Amazing ${currentFormData.title || 'Item'}`,
          reason: 'Added excitement to title'
        };
      }
      break;
      
    case 'description':
      const currentDesc = currentFormData.description || '';
      if (message.includes('more detail') || message.includes('specific')) {
        return {
          value: currentDesc + ' Additional details about condition, history, and unique features make this item special.',
          reason: 'Added more specific details as requested'
        };
      }
      if (message.includes('shorter') || message.includes('concise')) {
        const sentences = currentDesc.split('.');
        return {
          value: sentences.slice(0, 2).join('.') + '.',
          reason: 'Made description more concise'
        };
      }
      break;
      
    case 'category_id':
      // Use categories to find better match based on user feedback
      if (message.includes('different') || message.includes('change')) {
        const category = findBestCategory(userMessage, categories);
        if (category) {
          return {
            value: category,
            reason: 'Updated category based on your feedback'
          };
        }
      }
      break;
  }
  
  return null;
} 
