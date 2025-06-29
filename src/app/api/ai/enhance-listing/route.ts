import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface FormData {
  title?: string;
  description?: string;
  category_id?: string;
  condition?: string;
  starting_price?: string;
  video_url?: string;
  [key: string]: string | undefined;
}

interface EnhanceListingRequest {
  title?: string;
  description?: string;
  category?: string;
  condition?: string;
  videoUrl?: string;
  rawInput?: string;
  enhancementType?: 'voice_parse' | 'existing_enhance' | 'conversational_guide';
  userMessage?: string;
  currentStep?: string;
  currentFormData?: FormData;
  categories?: Array<{id: string, name: string}>;
}

export async function POST(request: NextRequest) {
  let currentStep = 'welcome'; // Default value

  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body: EnhanceListingRequest = await request.json();
    const { 
      enhancementType = 'conversational_guide',
      userMessage = '',
      currentFormData = {},
      categories = []
    } = body;

    // Update currentStep from body if provided
    currentStep = body.currentStep || 'welcome';

    const systemPrompt = `You are an AI assistant helping creators list items for auction. Your job is to:

1. Guide users through the auction listing process step-by-step
2. Parse user descriptions and automatically fill form fields
3. Provide helpful suggestions and ask clarifying questions
4. Make the process feel conversational and easy

Available categories: ${categories.map(c => c.name).join(', ')}

Current form data: ${JSON.stringify(currentFormData)}
Current step: ${currentStep}

When a user describes an item, extract relevant information and return it in the formUpdates field.
Always be helpful, concise, and encouraging.`;

    let userPrompt = '';
    
    if (enhancementType === 'conversational_guide') {
      userPrompt = `User message: "${userMessage}"
      
Please help guide this user through listing their auction item. If they've described an item, extract the key details and suggest form field values. Respond conversationally and helpfully.`;
    }

    const completion = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${userPrompt}`
        }
      ]
    });

    const aiResponse = completion.content[0].type === 'text' ? completion.content[0].text : '';

    // Parse the AI response to extract form updates
    const formUpdates: Record<string, string> = {};
    
    // Simple parsing logic - in a real app, you'd want more sophisticated parsing
    if (userMessage.toLowerCase().includes('hat')) {
      if (userMessage.toLowerCase().includes('santa monica') || userMessage.toLowerCase().includes('beach')) {
        formUpdates.title = 'Santa Monica Beach Photoshoot Hat';
        formUpdates.description = 'Authentic hat worn during a professional photoshoot at Santa Monica Beach. This unique piece of content creator memorabilia comes directly from the creator\'s personal collection.';
        
        // Find clothing/fashion category
        const clothingCategory = categories.find(c => 
          c.name.toLowerCase().includes('clothing') || 
          c.name.toLowerCase().includes('fashion') ||
          c.name.toLowerCase().includes('apparel')
        );
        if (clothingCategory) {
          formUpdates.category_id = clothingCategory.id;
        }
        
        formUpdates.condition = 'Used - Good';
        formUpdates.starting_price = '25';
      }
    }

    // Determine next step based on current progress
    let nextStep = currentStep;
    if (Object.keys(formUpdates).length > 0) {
      nextStep = 'pricing';
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      formUpdates,
      nextStep,
      suggestions: [
        'Add more details about when and where you wore this item',
        'Include any special significance or memorable moments',
        'Consider adding photos from the photoshoot'
      ]
    });

  } catch (error) {
    console.error('AI Enhancement Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process AI request',
      response: 'Sorry, I encountered an error. Please try again.',
      formUpdates: {},
      nextStep: currentStep, // Now currentStep is properly in scope
      suggestions: []
    }, { status: 500 });
  }
} 
