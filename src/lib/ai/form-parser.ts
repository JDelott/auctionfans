import { AuctionFormData, Category } from '../auction-forms/types';

export function extractFormUpdates(
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
