import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper function to get proper media type
function getMediaType(file: File): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  const type = file.type.toLowerCase();
  if (type === 'image/jpeg' || type === 'image/jpg') return 'image/jpeg';
  if (type === 'image/png') return 'image/png';
  if (type === 'image/gif') return 'image/gif';
  if (type === 'image/webp') return 'image/webp';
  
  // Default to jpeg for unknown types
  return 'image/jpeg';
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

    const formData = await request.formData();
    const images = formData.getAll('images') as File[];

    if (images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    const results = [];

    for (const image of images) {
      try {
        // Convert image to base64
        const bytes = await image.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        
        // Get proper media type
        const mediaType = getMediaType(image);
        
        console.log(`Processing image: ${image.name}, type: ${image.type}, normalized: ${mediaType}`);

        // Analyze with Claude Vision
        const completion = await anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64
                  }
                },
                {
                  type: 'text',
                  text: `Analyze this image and identify the main sellable item for an auction listing.

RESPOND WITH ONLY VALID JSON:
{
  "title": "Short, marketable item name",
  "description": "Detailed description for auction listing (50-100 words)",
  "category": "appropriate category (electronics, clothing, collectibles, home-garden, sports, books, etc.)",
  "condition": "new, like-new, good, fair, or poor",
  "confidence": 0.95
}

Be specific and detailed in the description. Focus on the main item, ignore backgrounds.`
                }
              ]
            }
          ]
        });

        const responseText = completion.content[0].type === 'text' ? completion.content[0].text : '';
        
        try {
          const analysis = JSON.parse(responseText);
          results.push({
            filename: image.name,
            analysis: {
              title: analysis.title || 'Untitled Item',
              description: analysis.description || 'No description available',
              category: analysis.category || 'other',
              condition: analysis.condition || 'good',
              confidence: analysis.confidence || 0.7
            }
          });
        } catch {
          // Fallback if AI doesn't return JSON
          results.push({
            filename: image.name,
            analysis: {
              title: 'Item from image',
              description: 'Please add description for this item',
              category: 'other',
              condition: 'good',
              confidence: 0.5
            }
          });
        }
      } catch (error) {
        console.error('Error analyzing image:', error);
        results.push({
          filename: image.name,
          analysis: {
            title: 'Item from image',
            description: 'Please add description for this item',
            category: 'other',
            condition: 'good',
            confidence: 0.3
          }
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in analyze-images:', error);
    return NextResponse.json({ error: 'Failed to analyze images' }, { status: 500 });
  }
}
