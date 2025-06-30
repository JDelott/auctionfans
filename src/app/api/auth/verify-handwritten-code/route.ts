import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
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
      return NextResponse.json({ error: 'Only creators can verify codes' }, { status: 403 });
    }

    const body = await request.json();
    const { imageData, sessionId } = body;

    if (!imageData || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the verification session
    const sessionResult = await query(
      `SELECT avs.*, vs.creator_id 
       FROM auth_verification_sessions avs
       JOIN video_sessions vs ON avs.video_session_id = vs.id
       WHERE avs.id = $1 AND vs.creator_id = $2`,
      [sessionId, user.id]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Verification session not found' }, { status: 404 });
    }

    const session = sessionResult.rows[0];

    // Check if session has expired
    if (new Date() > new Date(session.expires_at)) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Check if already verified
    if (session.verified) {
      return NextResponse.json({ error: 'Code already verified' }, { status: 400 });
    }

    // Check attempt limits
    if (session.attempts >= session.max_attempts) {
      return NextResponse.json({ error: 'Maximum verification attempts exceeded' }, { status: 400 });
    }

    // Increment attempt count
    await query(
      'UPDATE auth_verification_sessions SET attempts = attempts + 1 WHERE id = $1',
      [sessionId]
    );

    // Use Claude Vision to read the handwritten code
    const completion = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageData
              }
            },
            {
              type: 'text',
              text: `Please read any handwritten text or code visible in this image. 
              Look specifically for alphanumeric verification codes in the format like "AX7M-9K2P-5RT8".
              
              The code should be:
              - Handwritten on paper
              - Held by a person (selfie style)
              - Clearly visible and readable
              
              Return only the exact code you can read, or "NONE" if no readable code is found.
              Do not include any other text or explanations.`
            }
          ]
        }
      ]
    });

    const aiResponse = completion.content[0].type === 'text' ? completion.content[0].text.trim() : '';
    const readCode = aiResponse.replace(/[^A-Z0-9-]/g, ''); // Clean up the response

    console.log('AI Vision Response:', aiResponse);
    console.log('Cleaned Code:', readCode);
    console.log('Expected Code:', session.verification_code);

    // Check if the code matches
    const isValid = readCode === session.verification_code;

    if (isValid) {
      // Mark as verified
      await query(
        `UPDATE auth_verification_sessions 
         SET verified = true, verified_at = NOW(), verification_image_path = $1 
         WHERE id = $2`,
        [`/verification-images/${sessionId}-${Date.now()}.jpg`, sessionId]
      );

      // Update video session status
      await query(
        'UPDATE video_sessions SET status = $1 WHERE id = $2',
        ['verified', session.video_session_id]
      );

      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Code verified successfully!'
      });
    } else {
      return NextResponse.json({
        success: false,
        verified: false,
        message: 'Code verification failed. Please try again.',
        readCode: readCode.length > 0 ? readCode : 'No code detected',
        attemptsRemaining: session.max_attempts - (session.attempts + 1)
      });
    }

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
