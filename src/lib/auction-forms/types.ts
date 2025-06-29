// Shared types for auction forms and AI enhancement
export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface AuctionFormData {
  title: string;
  description: string;
  category_id: string;
  condition: string;
  starting_price: string;
  reserve_price: string;
  buy_now_price: string;
  video_url: string;
  video_timestamp: string;
  duration_days: string;
  images: boolean;
}

export interface FieldUpdate {
  field: string;
  value: string;
  reason: string;
  current?: string;
}

export interface EnhanceListingRequest {
  userMessage?: string;
  currentStep?: string;
  currentFormData?: AuctionFormData;
  categories?: Category[];
  iterationField?: string;
  rejectedFields?: string[];
}

export interface FormAnalysis {
  basicInfo: {
    title: boolean;
    description: boolean;
    category_id: boolean;
    condition: boolean;
    complete: boolean;
  };
  pricing: {
    starting_price: boolean;
    reserve_price: boolean;
    buy_now_price: boolean;
    duration_days: boolean;
    complete: boolean;
  };
  video: {
    video_url: boolean;
    video_timestamp: boolean;
    complete: boolean;
  };
  missingFields: string[];
}

export type FormStep = 'welcome' | 'basic_info' | 'pricing' | 'video' | 'images' | 'review';

export interface StepConfig {
  title: string;
  progress: number;
}

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
} 
