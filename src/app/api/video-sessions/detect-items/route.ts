import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';
import path from 'path';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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

    const user = await getUserById(decoded.userId);
    if (!user || !user.is_creator) {
      return NextResponse.json({ error: 'Only creators can detect items' }, { status: 403 });
    }

    const body = await request.json();
    const { videoSessionId } = body;

    if (!videoSessionId) {
      return NextResponse.json({ error: 'Video session ID required' }, { status: 400 });
    }

    // Verify video session belongs to user
    const sessionResult = await query(
      'SELECT id FROM video_sessions WHERE id = $1 AND creator_id = $2',
      [videoSessionId, user.id]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Video session not found' }, { status: 404 });
    }

    // Get all screenshots for this video session
    const screenshotsResult = await query(
      'SELECT id, image_path, timestamp_seconds FROM video_screenshots WHERE video_session_id = $1 ORDER BY timestamp_seconds',
      [videoSessionId]
    );

    const screenshots = screenshotsResult.rows;
    
    if (screenshots.length === 0) {
      return NextResponse.json({ error: 'No screenshots found' }, { status: 400 });
    }

    // Get categories for AI reference
    const categoriesResult = await query('SELECT id, name FROM categories');
    const categories = categoriesResult.rows;

    const detectedItems = [];

    // Process each screenshot with AI
    for (const screenshot of screenshots) {
      try {
        // Read the image file
        const imagePath = path.resolve(screenshot.image_path);
        const imageBuffer = await readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // Send to Claude Vision for item detection
        const completion = await anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: base64Image
                  }
                },
                {
                  type: 'text',
                  text: `Analyze this image and identify any sellable items/products that could be auctioned. 

For each item you find, provide:
- Item name (concise, marketable)
- Description (detailed, appealing for buyers)
- Suggested category from this list: ${categories.map(c => c.name).join(', ')}
- Estimated condition (new, like_new, good, fair, poor)
- Confidence score (0.0 to 1.0)

Return your response as a JSON array like this:
[
  {
    "name": "Vintage Leather Jacket",
    "description": "Classic brown leather jacket with quilted lining, appears to be in excellent condition with minimal wear",
    "category": "Clothing",
    "condition": "good",
    "confidence": 0.85
  }
]

If no sellable items are clearly visible, return an empty array: []`
                }
              ]
            }
          ]
        });

        const aiResponse = completion.content[0].type === 'text' ? completion.content[0].text.trim() : '';
        
        try {
          const items = JSON.parse(aiResponse);
          
          // Save detected items to database
          for (const item of items) {
            if (item.confidence >= 0.5) { // Only save items with decent confidence
              const categoryResult = categories.find(c => 
                c.name.toLowerCase().includes(item.category.toLowerCase()) ||
                item.category.toLowerCase().includes(c.name.toLowerCase())
              );

              const insertResult = await query(
                `INSERT INTO detected_items (
                  video_session_id, screenshot_id, item_name, item_description, 
                  suggested_category_id, confidence_score, ai_analysis, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING id, item_name, item_description, confidence_score`,
                [
                  videoSessionId,
                  screenshot.id,
                  item.name,
                  item.description,
                  categoryResult?.id || null,
                  item.confidence,
                  JSON.stringify(item),
                  'detected'
                ]
              );

              detectedItems.push({
                ...insertResult.rows[0],
                screenshot_timestamp: screenshot.timestamp_seconds,
                suggested_category: categoryResult?.name || 'Other',
                condition: item.condition
              });
            }
          }
        } catch (parseError) {
          console.error('Failed to parse AI response for screenshot:', screenshot.id, parseError);
        }

      } catch (error) {
        console.error('Error processing screenshot:', screenshot.id, error);
      }
    }

    // Update video session status
    await query(
      'UPDATE video_sessions SET status = $1 WHERE id = $2',
      ['items_detected', videoSessionId]
    );

    return NextResponse.json({
      success: true,
      detectedItems,
      message: `Found ${detectedItems.length} sellable items`
    });

  } catch (error) {
    console.error('Item detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect items' },
      { status: 500 }
    );
  }
}
