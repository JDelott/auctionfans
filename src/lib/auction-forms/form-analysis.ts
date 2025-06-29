import { AuctionFormData, FormAnalysis } from './types';
import { getMissingFields } from './validation';

export function analyzeFormState(formData: AuctionFormData): FormAnalysis {
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

export function getFieldDisplayName(field: string): string {
  const fieldNames: Record<string, string> = {
    'title': 'Title',
    'description': 'Description', 
    'category_id': 'Category',
    'condition': 'Condition',
    'starting_price': 'Starting Price',
    'reserve_price': 'Reserve Price',
    'buy_now_price': 'Buy Now Price',
    'duration_days': 'Auction Duration',
    'video_url': 'Video URL',
    'video_timestamp': 'Video Timestamp'
  };
  return fieldNames[field] || field;
} 
