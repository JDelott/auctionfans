import { Category } from '../auction-forms/types';

export function findBestCategory(userMessage: string, categories: Category[]): string | null {
  const message = userMessage.toLowerCase();
  
  // More specific category matching
  const categoryMappings = [
    { keywords: ['shoes', 'sneakers', 'boots', 'sandals', 'heels'], categoryNames: ['fashion', 'clothing', 'accessories', 'footwear'] },
    { keywords: ['shirt', 'tee', 'top', 'blouse', 'tank'], categoryNames: ['fashion', 'clothing', 'apparel'] },
    { keywords: ['hat', 'cap', 'beanie'], categoryNames: ['fashion', 'accessories', 'clothing'] },
    { keywords: ['jacket', 'coat', 'hoodie', 'sweater'], categoryNames: ['fashion', 'clothing', 'apparel'] },
    { keywords: ['pants', 'jeans', 'shorts'], categoryNames: ['fashion', 'clothing', 'apparel'] },
    { keywords: ['dress', 'gown', 'skirt'], categoryNames: ['fashion', 'clothing', 'apparel'] },
    { keywords: ['jewelry', 'necklace', 'bracelet', 'ring'], categoryNames: ['accessories', 'jewelry', 'fashion'] },
    { keywords: ['book', 'novel', 'magazine'], categoryNames: ['books', 'literature', 'media'] },
    { keywords: ['phone', 'laptop', 'computer'], categoryNames: ['electronics', 'tech', 'gadgets'] },
    { keywords: ['convention', 'con', 'fest'], categoryNames: ['collectibles', 'memorabilia', 'events'] }
  ];
  
  for (const mapping of categoryMappings) {
    const hasKeyword = mapping.keywords.some(keyword => message.includes(keyword));
    if (hasKeyword) {
      // Try to find category by name
      for (const categoryName of mapping.categoryNames) {
        const category = categories.find(c => 
          c.name.toLowerCase().includes(categoryName)
        );
        if (category) return category.id;
      }
    }
  }
  
  // Default fallback
  const defaultCategory = categories.find(c => 
    c.name.toLowerCase().includes('fashion') ||
    c.name.toLowerCase().includes('collectibles') ||
    c.name.toLowerCase().includes('other')
  );
  
  return defaultCategory?.id || null;
} 
