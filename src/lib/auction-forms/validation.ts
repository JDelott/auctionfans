import { AuctionFormData, ValidationResult } from './types';

export function validateBasicInfo(formData: AuctionFormData): ValidationResult {
  const missing: string[] = [];
  if (!formData.title.trim()) missing.push('Title');
  if (!formData.description.trim()) missing.push('Description');  
  if (!formData.category_id) missing.push('Category');
  if (!formData.condition) missing.push('Condition');
  
  return {
    isValid: missing.length === 0,
    missingFields: missing
  };
}

export function validatePricing(formData: AuctionFormData): ValidationResult {
  const missing: string[] = [];
  if (!formData.starting_price || parseFloat(formData.starting_price) <= 0) {
    missing.push('Starting Price');
  }
  if (!formData.duration_days) missing.push('Auction Duration');
  
  return {
    isValid: missing.length === 0,
    missingFields: missing
  };
}

export function validateImages(selectedImages: FileList | null): ValidationResult {
  const missing: string[] = [];
  if (!selectedImages || selectedImages.length === 0) {
    missing.push('At least one image');
  }
  
  return {
    isValid: missing.length === 0,
    missingFields: missing
  };
}

export function getMissingFields(formData: AuctionFormData): string[] {
  const missing = [];
  if (!formData.title) missing.push('title');
  if (!formData.description) missing.push('description');
  if (!formData.category_id) missing.push('category');
  if (!formData.condition) missing.push('condition');
  if (!formData.starting_price) missing.push('starting_price');
  return missing;
} 
