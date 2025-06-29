import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { 
  EnhanceListingRequest,
  AuctionFormData
} from '@/lib/auction-forms/types';
import { extractFormUpdatesWithReasons } from '@/lib/ai/field-updater';
import { analyzeFormState } from '@/lib/auction-forms/form-analysis';
import { generateSuggestions } from '@/lib/ai/suggestions';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  let currentStep = 'welcome';

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
    console.log('AI Enhancement Request:', body);
    
    const { 
      userMessage = '',
      currentFormData = {} as AuctionFormData,
      categories = [],
      iterationField,
      rejectedFields = []
    } = body;

    currentStep = body.currentStep || 'welcome';

    // If this is a field iteration, skip the general AI response
    if (iterationField) {
      const { formUpdates, fieldUpdates } = await extractFormUpdatesWithReasons(
        userMessage, 
        currentFormData, 
        categories, 
        currentStep, 
        iterationField, 
        rejectedFields
      );
      
      console.log('AI Enhancement Result:', { formUpdates, fieldUpdates });
      
      return NextResponse.json({
        success: true,
        response: `Enhanced ${iterationField} successfully!`,
        formUpdates,
        fieldUpdates,
        nextStep: currentStep,
        suggestions: [],
        formAnalysis: analyzeFormState({ ...currentFormData, ...formUpdates } as AuctionFormData)
      });
    }

    // For general form filling, use the regular AI flow
    const systemPrompt = `You are an AI assistant that helps users create auction listings from voice input.

Parse the user's description and extract basic information to fill form fields.
Keep responses simple and helpful.

Current step: ${currentStep}
Available categories: ${categories.map(c => `${c.id}: ${c.name}`).join('\n')}

Extract and enhance the basic information provided.`;

    const userPrompt = `Parse this item description: "${userMessage}"

Extract:
- Item type and create a clear title
- Enhanced description 
- Appropriate category
- Estimated condition

Provide helpful confirmation of what you understood.`;

    const completion = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${userPrompt}`
        }
      ]
    });

    const aiResponse = completion.content[0].type === 'text' ? completion.content[0].text : '';

    // Enhanced parsing with field-specific updates
    const { formUpdates, fieldUpdates } = await extractFormUpdatesWithReasons(
      userMessage, 
      currentFormData, 
      categories, 
      currentStep, 
      iterationField, 
      rejectedFields
    );
    
    console.log('AI Enhancement Result:', { formUpdates, fieldUpdates });
    
    return NextResponse.json({
      success: true,
      response: aiResponse,
      formUpdates,
      fieldUpdates,
      nextStep: currentStep,
      suggestions: generateSuggestions([], currentStep, formUpdates),
      formAnalysis: analyzeFormState({ ...currentFormData, ...formUpdates } as AuctionFormData)
    });

  } catch (error) {
    console.error('AI Enhancement Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process AI request',
      response: 'Sorry, I encountered an error. Please try again.',
      formUpdates: {},
      fieldUpdates: [],
      nextStep: currentStep,
      suggestions: []
    }, { status: 500 });
  }
} 
