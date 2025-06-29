import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface EnhanceListingRequest {
  title?: string;
  description?: string;
  category?: string;
  condition?: string;
  videoUrl?: string;
  rawInput?: string; // For voice-to-text input from browser
  enhancementType?: 'voice_parse' | 'existing_enhance';
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body: EnhanceListingRequest = await request.json();
    
    // Get available categories for context
    const { query } = await import('@/lib/db');
    const categoriesResult = await query('SELECT id, name, description FROM categories ORDER BY name');
    const categories = categoriesResult.rows.map(cat => `- ${cat.name}: ${cat.description}`).join('\n');

    let prompt = '';
    const systemPrompt = `You are an AI assistant helping content creators list items for auction on FanVault, a platform where creators sell authentic items from their content to collectors. Your goal is to make listings appealing, professional, and trustworthy while emphasizing the item's authenticity and connection to the creator.

Available categories:
${categories}

Always respond with valid JSON only, no additional text or markdown formatting.`;
    
    if (body.rawInput && body.enhancementType === 'voice_parse') {
      // Process voice-to-text input
      prompt = `A content creator has described an item they want to auction using voice. Here's what they said:

"${body.rawInput}"

Extract and structure this information into a proper auction listing. Return a JSON object with:
{
  "title": "Compelling, concise title (max 80 characters)",
  "description": "Detailed, engaging description (2-3 paragraphs) that highlights authenticity and collector value",
  "suggested_category": "Most appropriate category name from the available list",
  "suggested_condition": "One of: new, like_new, good, fair, poor",
  "suggested_starting_price": "Reasonable starting price as a number",
  "suggested_buy_now_price": "Buy-now price as a number (50-100% higher than starting)",
  "confidence_score": "Your confidence in these suggestions (0-100)",
  "authenticity_highlights": ["Array of points emphasizing creator connection and authenticity"],
  "collector_appeal": ["Array of points about why collectors would want this item"]
}

Focus on the item's story, its appearance in content, condition, and what makes it special to collectors.`;

    } else {
      // Enhance existing listing data
      prompt = `Help improve this auction listing for a content creator. Current information:

Title: ${body.title || 'Not provided'}
Description: ${body.description || 'Not provided'}
Category: ${body.category || 'Not provided'}
Condition: ${body.condition || 'Not provided'}
Video URL: ${body.videoUrl || 'Not provided'}

Return a JSON object with:
{
  "enhanced_title": "Improved, compelling title (max 80 characters)",
  "enhanced_description": "More engaging description that highlights authenticity and collector value",
  "suggested_improvements": ["Array of specific suggestions for the creator"],
  "marketing_keywords": ["Array of relevant keywords for searchability"],
  "authenticity_highlights": ["Array of points emphasizing creator connection"],
  "pricing_advice": "Brief advice about pricing strategy",
  "collector_appeal": ["Array of points about why collectors would want this item"]
}

Make the listing more professional and appealing while maintaining honesty about the item.`;
    }

    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = completion.content[0].type === 'text' ? completion.content[0].text : '';
    
    // Parse the JSON response
    let enhancedData;
    try {
      enhancedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', responseText);
      return NextResponse.json({ error: 'Failed to process AI response' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: enhancedData,
      usage: {
        input_tokens: completion.usage.input_tokens,
        output_tokens: completion.usage.output_tokens
      }
    });

  } catch (error) {
    console.error('AI enhancement error:', error);
    return NextResponse.json(
      { error: 'Failed to enhance listing' },
      { status: 500 }
    );
  }
} 
