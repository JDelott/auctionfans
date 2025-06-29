import { AuctionFormData, Category, FieldUpdate } from '../auction-forms/types';
import { extractFormUpdates } from './form-parser';
import { findBestCategory } from './category-matcher';

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

export function extractFormUpdatesWithReasons(
  userMessage: string, 
  currentFormData: AuctionFormData, 
  categories: Category[], 
  currentStep: string,
  iterationField?: string,
  rejectedFields: string[] = []
): { formUpdates: Record<string, string>; fieldUpdates: FieldUpdate[] } {
  
  const formUpdates: Record<string, string> = {};
  const fieldUpdates: FieldUpdate[] = [];

  // Handle field iteration
  if (iterationField) {
    const updatedValue = iterateOnField(userMessage, iterationField, currentFormData, categories);
    if (updatedValue) {
      formUpdates[iterationField] = updatedValue.value;
      fieldUpdates.push({
        field: iterationField,
        value: updatedValue.value,
        reason: updatedValue.reason,
        current: currentFormData[iterationField as keyof AuctionFormData] as string
      });
    }
    return { formUpdates, fieldUpdates };
  }

  // Simple extraction
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
