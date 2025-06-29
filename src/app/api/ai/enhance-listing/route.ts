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

    // Enhanced system prompt based on current step
    const getSystemPrompt = (step: string) => {
      const basePrompt = `You are an AI assistant that helps users create auction listings from voice input.`;
      
      switch (step) {
        case 'basic_info':
          return `${basePrompt}

Current step: Basic Information
Parse the user's description and extract:
- Item type and create a clear title (max 8 words)
- Enhanced description with details
- Appropriate category from available options
- Estimated condition

Available categories: ${categories.map(c => `${c.id}: ${c.name}`).join('\n')}

Focus on extracting basic item information.`;

        case 'pricing':
          return `${basePrompt}

Current step: Pricing
Parse the user's pricing information and extract:
- Starting price (starting bid amount)
- Reserve price (minimum sale price, optional)
- Buy now price (instant purchase price, optional)
- Auction duration if mentioned

Look for phrases like:
- "starting price 25" or "start at 25 dollars"
- "reserve 50" or "reserve price fifty"
- "buy now 100" or "buy it now one hundred"
- "7 days" or "one week auction"

Extract numeric values and convert words to numbers.`;

        case 'video':
          return `${basePrompt}

Current step: Video Information
Parse the user's video information and extract:
- Video URL (YouTube, Vimeo, etc.)
- Video timestamp in seconds (when they mention "start at X minutes")

Look for:
- URLs: "youtube.com/watch?v=" or "youtu.be/" or "vimeo.com"
- Time references: "start at 2 minutes" = 120 seconds, "begin at 1:30" = 90 seconds

Convert time mentions to seconds.`;

        case 'images':
          return `${basePrompt}

Current step: Images
While users upload images manually, help enhance their description based on what they say about the images or item appearance.

Focus on improving the description with visual details they mention.`;

        case 'review':
          return `${basePrompt}

Current step: Review & Final Adjustments
Parse requests for final changes to any field:
- "change title to..." - update title
- "update price to..." - update pricing
- "fix description..." - improve description
- "set reserve to..." - update reserve price

Make targeted updates based on specific requests.`;

        default:
          return basePrompt;
      }
    };

    // For general form filling, use the enhanced AI flow
    const systemPrompt = getSystemPrompt(currentStep);

    // Enhanced user prompt based on step
    const getUserPrompt = (step: string, message: string) => {
      switch (step) {
        case 'pricing':
          return `Parse this pricing information: "${message}"

Extract pricing values and convert to numbers:
- Starting price/bid
- Reserve price (minimum sale amount)
- Buy now price (instant purchase)
- Duration in days

Convert words to numbers (e.g., "twenty-five" → "25", "fifty" → "50").
Respond with extracted pricing information.`;

        case 'video':
          return `Parse this video information: "${message}"

Extract:
- Video URL (clean and format properly)
- Timestamp in seconds (convert "2 minutes" to 120, "1:30" to 90)

Respond with extracted video details.`;

        default:
          return `Parse this item description: "${message}"

For basic info: Extract item type, create title, enhance description, determine category and condition.
For other steps: Extract relevant information for the current step.

Provide helpful confirmation of what you understood.`;
      }
    };

    const userPrompt = getUserPrompt(currentStep, userMessage);

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

    // Enhanced parsing with step-specific field updates
    const { formUpdates, fieldUpdates } = await extractFormUpdatesWithReasons(
      userMessage, 
      currentFormData, 
      categories, 
      currentStep, 
      iterationField, 
      rejectedFields
    );
    
    console.log('AI Enhancement Result:', { formUpdates, fieldUpdates, currentStep });
    
    return NextResponse.json({
      success: true,
      response: aiResponse,
      formUpdates,
      fieldUpdates,
      nextStep: currentStep,
      suggestions: generateSuggestions([], currentStep, formUpdates),
      formAnalysis: analyzeFormState({ ...currentFormData, ...formUpdates })
    });

  } catch (error: unknown) {
    console.error('AI Enhancement Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process AI enhancement',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 
