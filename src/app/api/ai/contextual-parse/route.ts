import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { AuctionFormData, Category } from '@/lib/auction-forms/types';
import { AIContextManager, SerializedAuctionSessionContext } from '@/lib/ai/context-manager';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ContextualParseRequest {
  userInput: string;
  currentFormData: AuctionFormData;
  categories: Category[];
  contextData?: SerializedAuctionSessionContext;
  initialDescription?: string;
  itemId?: string;
  specificField?: string;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body: ContextualParseRequest = await request.json();
    const { userInput, currentFormData, categories, contextData, initialDescription, itemId, specificField } = body;

    console.log('🤖 Contextual Parse Request:', { userInput, itemId, specificField, hasInitialDescription: !!initialDescription });

    // Restore context manager if provided
    let contextManager: AIContextManager;
    if (contextData) {
      contextManager = AIContextManager.fromSerialized(contextData);
    } else {
      // Use the initial description when creating a new context manager
      contextManager = new AIContextManager(initialDescription || '');
    }

    // Get rich context for AI
    const contextText = contextManager.getContextForAI(itemId);
    const fieldContext = specificField ? contextManager.getFieldContext(specificField, itemId) : '';

    // Build comprehensive prompt
    const prompt = buildContextualPrompt(
      userInput,
      currentFormData,
      categories,
      contextText,
      fieldContext,
      specificField
    );

    try {
      const completion = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 600,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const aiResponse = completion.content[0].type === 'text' ? completion.content[0].text.trim() : '';
      console.log('🤖 AI Response:', aiResponse);

      // Parse the structured response
      const parsed = parseAIResponse(aiResponse, categories);
      
      // Record this interaction
      const fieldChanges = convertToFieldChanges(parsed.formUpdates, currentFormData);
      contextManager.recordInteraction({
        userInput,
        aiResponse,
        fieldChanges,
        context: specificField ? 'field_update' : 'item_analysis'
      });

      return NextResponse.json({
        success: true,
        formUpdates: parsed.formUpdates,
        fieldUpdates: parsed.fieldUpdates,
        contextUsed: contextText,
        updatedContext: contextManager.serializeContext()
      });

    } catch (error) {
      console.error('❌ AI Parsing Error:', error);
      return NextResponse.json({
        success: false,
        formUpdates: {},
        fieldUpdates: [],
        contextUsed: contextText,
        error: 'AI processing failed'
      });
    }

  } catch (error) {
    console.error('❌ Contextual Parse API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function buildContextualPrompt(
  userInput: string,
  currentFormData: AuctionFormData,
  categories: Category[],
  contextText: string,
  fieldContext: string,
  specificField?: string
): string {
  const categoryList = categories.map(c => `${c.id}: ${c.name}`).join('\n');
  
  const basePrompt = `You are an AI assistant that helps create auction listings. You have access to rich context about the user's session and items.

CONTEXT INFORMATION:
${contextText}

${fieldContext ? `FIELD-SPECIFIC CONTEXT:\n${fieldContext}\n` : ''}

CURRENT FORM DATA:
${JSON.stringify(currentFormData, null, 2)}

AVAILABLE CATEGORIES:
${categoryList}

USER INPUT: "${userInput}"

TASK: ${specificField ? 
  `Update the specific field "${specificField}" based on the user's input and context.` :
  `Parse the user's input and determine which fields should be updated based on the full context.`
}

PARSING RULES:
1. Use the session context to understand the item better
2. Consider previous interactions and user patterns
3. Maintain consistency with inferred attributes
4. Only update fields that are clearly indicated by the user input
5. Provide confidence scores based on context strength

RESPONSE FORMAT:
Return a JSON object with this structure:
{
  "formUpdates": {
    "field_name": "new_value"
  },
  "fieldUpdates": [
    {
      "field": "field_name",
      "value": "new_value", 
      "reason": "Context-aware explanation",
      "confidence": 0.85
    }
  ],
  "reasoning": "Explanation of how context influenced the decision"
}

FIELD VALIDATION:
- title: max 8 words, clear and marketable
- description: detailed, 20-100 words  
- category_id: must be valid ID from available categories
- condition: new, like-new, good, fair, poor
- starting_price: numeric, format as decimal (25.00)
- reserve_price: numeric, format as decimal (50.00)
- buy_now_price: numeric, format as decimal (150.00)
- duration_days: 1, 3, 5, 7, 10, or 14
- video_timestamp: seconds as integer
- video_url: valid URL with https://

Use the context to make informed decisions!`;

  return basePrompt;
}

function parseAIResponse(aiResponse: string, categories: Category[]): {
  formUpdates: Record<string, string>;
  fieldUpdates: Array<{
    field: string;
    value: string;
    reason: string;
    confidence: number;
  }>;
} {
  try {
    const parsed = JSON.parse(aiResponse);
    
    // Validate and clean the response
    const formUpdates: Record<string, string> = {};
    const fieldUpdates: Array<{
      field: string;
      value: string;
      reason: string;
      confidence: number;
    }> = [];

    if (parsed.formUpdates) {
      Object.entries(parsed.formUpdates).forEach(([field, value]) => {
        const validatedValue = validateFieldValue(field, value as string, categories);
        if (validatedValue) {
          formUpdates[field] = validatedValue;
        }
      });
    }
    if (parsed.fieldUpdates && Array.isArray(parsed.fieldUpdates)) {
      parsed.fieldUpdates.forEach((update: { field: string; value: string; reason?: string; confidence?: number }) => {
        const validatedValue = validateFieldValue(update.field, update.value, categories);
        if (update.field && validatedValue) {
          fieldUpdates.push({
            field: update.field,
            value: validatedValue,
            reason: update.reason || 'AI context analysis',
            confidence: Math.min(Math.max(update.confidence || 0.7, 0), 1)
          });
        }
      });
    }

    return { formUpdates, fieldUpdates };

  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return { formUpdates: {}, fieldUpdates: [] };
  }
}

function validateFieldValue(field: string, value: string, categories: Category[]): string | null {
  if (!value || typeof value !== 'string') return null;
  
  switch (field) {
    case 'title':
      const words = value.trim().split(' ').filter(w => w.length > 0);
      return words.slice(0, 8).join(' ');
      
    case 'description':
      return value.trim().length > 10 ? value.trim() : null;
      
    case 'category_id':
      return categories.find(c => c.id === value) ? value : null;
      
    case 'condition':
      const validConditions = ['new', 'like-new', 'good', 'fair', 'poor'];
      const lowercaseValue = value.toLowerCase();
      return validConditions.includes(lowercaseValue) ? lowercaseValue : null;
      
    case 'starting_price':
    case 'reserve_price':  
    case 'buy_now_price':
      const price = parseFloat(value.replace(/[^\d.]/g, ''));
      return !isNaN(price) && price > 0 ? price.toFixed(2) : null;
      
    case 'duration_days':
      const validDurations = ['1', '3', '5', '7', '10', '14'];
      return validDurations.includes(value) ? value : null;
      
    case 'video_url':
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

function convertToFieldChanges(
  formUpdates: Record<string, string>,
  currentFormData: AuctionFormData
): Record<string, { from: string; to: string; reason: string }> {
  const fieldChanges: Record<string, { from: string; to: string; reason: string }> = {};
  
  Object.entries(formUpdates).forEach(([field, newValue]) => {
    const currentValue = (currentFormData[field as keyof AuctionFormData] as string) || '';
    fieldChanges[field] = {
      from: currentValue,
      to: newValue,
      reason: 'AI context analysis'
    };
  });
  
  return fieldChanges;
} 
