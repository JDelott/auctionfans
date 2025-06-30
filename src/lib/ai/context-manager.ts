export interface AIInteraction {
  id: string;
  timestamp: Date;
  userInput: string;
  aiResponse: string;
  fieldChanges: Record<string, { from: string; to: string; reason: string }>;
  context: 'upload' | 'item_analysis' | 'field_update' | 'batch_operation';
}

export interface ItemContext {
  itemId: string;
  imageAnalysis?: string;
  userDescription?: string;
  interactions: AIInteraction[];
  inferredAttributes: {
    category?: string;
    brand?: string;
    itemType?: string;
    era?: string;
    condition?: string;
    specialFeatures?: string[];
  };
  confidenceScores: Record<string, number>;
}

export interface UserPreferences {
  defaultDuration?: number;
  preferredCategories?: string[];
  priceRanges?: { min: number; max: number };
}

export interface AuctionSessionContext {
  sessionId: string;
  startTime: Date;
  initialDescription: string;
  items: Map<string, ItemContext>;
  globalContext: {
    userPreferences: UserPreferences;
    commonCategories: string[];
    pricePatterns: Record<string, number>;
  };
  conversationHistory: AIInteraction[];
}

// Define a proper type for serialized context
export interface SerializedAuctionSessionContext {
  sessionId: string;
  startTime: string; // Date serialized as string
  initialDescription: string;
  items: Record<string, ItemContext>; // Map serialized as object
  globalContext: {
    userPreferences: UserPreferences;
    commonCategories: string[];
    pricePatterns: Record<string, number>;
  };
  conversationHistory: AIInteraction[];
}

export class AIContextManager {
  private context: AuctionSessionContext;

  constructor(initialDescription: string = '') {
    this.context = {
      sessionId: `session-${Date.now()}`,
      startTime: new Date(),
      initialDescription,
      items: new Map(),
      globalContext: {
        userPreferences: {},
        commonCategories: [],
        pricePatterns: {}
      },
      conversationHistory: []
    };
  }

  // Add item context from image analysis
  addItemContext(itemId: string, imageAnalysis: string, userDescription?: string): void {
    const itemContext: ItemContext = {
      itemId,
      imageAnalysis,
      userDescription: userDescription || this.context.initialDescription,
      interactions: [],
      inferredAttributes: {},
      confidenceScores: {}
    };

    this.context.items.set(itemId, itemContext);
    this.updateInferredAttributes(itemId);
  }

  // Record AI interaction
  recordInteraction(interaction: Omit<AIInteraction, 'id' | 'timestamp'>): void {
    const fullInteraction: AIInteraction = {
      ...interaction,
      id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.context.conversationHistory.push(fullInteraction);

    // Also add to specific item if it's item-specific
    if (interaction.context === 'field_update' || interaction.context === 'item_analysis') {
      // Try to determine which item this relates to
      const relatedItemId = this.findRelatedItem(interaction.userInput);
      if (relatedItemId) {
        const itemContext = this.context.items.get(relatedItemId);
        if (itemContext) {
          itemContext.interactions.push(fullInteraction);
          this.updateInferredAttributes(relatedItemId);
        }
      }
    }
  }

  // Serialize context for API calls (Map cannot be JSON.stringified)
  serializeContext(): SerializedAuctionSessionContext {
    return {
      ...this.context,
      startTime: this.context.startTime.toISOString(),
      items: Object.fromEntries(this.context.items.entries())
    };
  }

  // Restore context from serialized data
  static fromSerialized(data: SerializedAuctionSessionContext): AIContextManager {
    const manager = new AIContextManager();
    manager.context = {
      ...data,
      startTime: new Date(data.startTime),
      items: new Map(Object.entries(data.items || {}))
    };
    return manager;
  }

  // Get rich context for AI processing
  getContextForAI(itemId?: string): string {
    let contextText = `Session Context:\n`;
    contextText += `- Initial Description: "${this.context.initialDescription}"\n`;
    contextText += `- Session Duration: ${Math.round((Date.now() - this.context.startTime.getTime()) / 1000)} seconds\n`;
    contextText += `- Total Items: ${this.context.items.size}\n`;

    if (itemId && this.context.items.has(itemId)) {
      const itemContext = this.context.items.get(itemId)!;
      contextText += `\nItem-Specific Context:\n`;
      contextText += `- Image Analysis: ${itemContext.imageAnalysis}\n`;
      contextText += `- User Description: ${itemContext.userDescription}\n`;
      contextText += `- Previous Interactions: ${itemContext.interactions.length}\n`;
      
      if (Object.keys(itemContext.inferredAttributes).length > 0) {
        contextText += `- Inferred Attributes: ${JSON.stringify(itemContext.inferredAttributes, null, 2)}\n`;
      }

      // Add recent interactions context
      const recentInteractions = itemContext.interactions.slice(-3);
      if (recentInteractions.length > 0) {
        contextText += `\nRecent Interactions:\n`;
        recentInteractions.forEach((interaction, i) => {
          contextText += `${i + 1}. User: "${interaction.userInput}" → Changes: ${JSON.stringify(interaction.fieldChanges)}\n`;
        });
      }
    }

    // Add conversation history context
    const recentHistory = this.context.conversationHistory.slice(-5);
    if (recentHistory.length > 0) {
      contextText += `\nRecent Conversation:\n`;
      recentHistory.forEach((interaction, i) => {
        contextText += `${i + 1}. "${interaction.userInput}" → ${Object.keys(interaction.fieldChanges).join(', ')}\n`;
      });
    }

    return contextText;
  }

  // Get context for specific field update
  getFieldContext(fieldName: string, itemId?: string): string {
    let context = `Field Update Context for "${fieldName}":\n`;
    
    // Add field-specific patterns from history
    const fieldUpdates = this.context.conversationHistory
      .filter(i => fieldName in i.fieldChanges)
      .slice(-3);

    if (fieldUpdates.length > 0) {
      context += `Previous ${fieldName} updates:\n`;
      fieldUpdates.forEach((update, i) => {
        const change = update.fieldChanges[fieldName];
        context += `${i + 1}. "${update.userInput}" → "${change.to}" (${change.reason})\n`;
      });
    }

    // Add item-specific context if available
    if (itemId && this.context.items.has(itemId)) {
      const itemContext = this.context.items.get(itemId)!;
      context += `\nItem Context:\n`;
      context += `- Type: ${itemContext.inferredAttributes.itemType || 'unknown'}\n`;
      context += `- Category: ${itemContext.inferredAttributes.category || 'unknown'}\n`;
      context += `- Brand: ${itemContext.inferredAttributes.brand || 'unknown'}\n`;
    }

    return context;
  }

  // Update inferred attributes based on interactions
  private updateInferredAttributes(itemId: string): void {
    const itemContext = this.context.items.get(itemId);
    if (!itemContext) return;

    // Analyze all interactions to infer attributes
    const allText = [
      itemContext.imageAnalysis,
      itemContext.userDescription,
      ...itemContext.interactions.map(i => i.userInput)
    ].filter(Boolean).join(' ').toLowerCase();

    // Update inferred attributes based on text analysis
    itemContext.inferredAttributes = {
      ...itemContext.inferredAttributes,
      ...this.extractAttributesFromText(allText)
    };

    // Update confidence scores
    itemContext.confidenceScores = this.calculateConfidenceScores(itemContext);
  }

  // Extract attributes from text
  private extractAttributesFromText(text: string): Partial<ItemContext['inferredAttributes']> {
    const attributes: Partial<ItemContext['inferredAttributes']> = {};

    // Brand detection
    const brands = ['nike', 'adidas', 'apple', 'sony', 'pokemon', 'disney', 'lego', 'rolex'];
    const foundBrand = brands.find(brand => text.includes(brand));
    if (foundBrand) attributes.brand = foundBrand;

    // Item type detection
    const itemTypes = ['shoes', 'sneakers', 'shirt', 'phone', 'watch', 'card', 'book', 'hat'];
    const foundType = itemTypes.find(type => text.includes(type));
    if (foundType) attributes.itemType = foundType;

    // Era detection
    if (text.includes('vintage') || /19[0-9]{2}/.test(text)) attributes.era = 'vintage';
    if (text.includes('retro')) attributes.era = 'retro';
    if (text.includes('modern') || text.includes('2020') || text.includes('2021')) attributes.era = 'modern';

    // Condition detection
    if (text.includes('mint') || text.includes('new')) attributes.condition = 'new';
    if (text.includes('excellent')) attributes.condition = 'like-new';
    if (text.includes('good') || text.includes('decent')) attributes.condition = 'good';
    if (text.includes('worn') || text.includes('used')) attributes.condition = 'fair';

    // Special features
    const features = [];
    if (text.includes('signed')) features.push('signed');
    if (text.includes('rare')) features.push('rare');
    if (text.includes('limited')) features.push('limited edition');
    if (text.includes('collector')) features.push('collectible');
    if (features.length > 0) attributes.specialFeatures = features;

    return attributes;
  }

  // Calculate confidence scores for attributes
  private calculateConfidenceScores(itemContext: ItemContext): Record<string, number> {
    const scores: Record<string, number> = {};
    
    // Base confidence on number of confirmations and sources
    Object.entries(itemContext.inferredAttributes).forEach(([key, value]) => {
      if (!value) return;
      
      let confidence = 0.5; // Base confidence
      
      // Increase confidence based on multiple sources
      if (itemContext.imageAnalysis?.toLowerCase().includes(value.toString().toLowerCase())) {
        confidence += 0.2;
      }
      if (itemContext.userDescription?.toLowerCase().includes(value.toString().toLowerCase())) {
        confidence += 0.2;
      }
      
      // Increase confidence based on user confirmations
      const confirmations = itemContext.interactions.filter(i => 
        i.userInput.toLowerCase().includes(value.toString().toLowerCase())
      ).length;
      confidence += confirmations * 0.1;
      
      scores[key] = Math.min(confidence, 0.95); // Cap at 95%
    });
    
    return scores;
  }

  // Find which item a user input relates to
  private findRelatedItem(userInput: string): string | null {
    const input = userInput.toLowerCase();
    
    // Look for item indicators in the input
    for (const [itemId, itemContext] of this.context.items) {
      const itemType = itemContext.inferredAttributes.itemType;
      const brand = itemContext.inferredAttributes.brand;
      
      if (itemType && input.includes(itemType)) return itemId;
      if (brand && input.includes(brand)) return itemId;
      
      // Check if input contains words from image analysis
      const analysisWords = itemContext.imageAnalysis?.toLowerCase().split(' ') || [];
      const matchingWords = analysisWords.filter(word => 
        word.length > 3 && input.includes(word)
      );
      
      if (matchingWords.length >= 2) return itemId;
    }
    
    return null;
  }

  // Get current context state
  getContext(): AuctionSessionContext {
    return this.context;
  }

  // Export context for debugging
  exportContext(): string {
    return JSON.stringify(this.serializeContext(), null, 2);
  }
} 
 