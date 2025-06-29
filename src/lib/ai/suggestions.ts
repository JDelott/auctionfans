export function generateSuggestions(
  missingFields: string[], 
  currentStep: string, 
  formUpdates: Record<string, string>
): string[] {
  const suggestions: string[] = [];
  
  if (Object.keys(formUpdates).length > 0) {
    suggestions.push("Click 'Apply to Form' above to use my suggestions");
  }
  
  if (missingFields.includes('title')) {
    suggestions.push("What should I call this item in the title?");
  }
  
  if (missingFields.includes('category')) {
    suggestions.push("What category best fits this item?");
  }
  
  if (missingFields.includes('condition')) {
    suggestions.push("What condition is the item in?");
  }
  
  if (missingFields.includes('starting_price')) {
    suggestions.push("What should the starting bid price be?");
  }
  
  return suggestions;
} 
