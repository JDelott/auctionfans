import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';

// Generate a random verification code
function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
  const segments = [];
  
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-'); // Format: "AX7M-9K2P-5RT8"
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

    const user = await getUserById(decoded.userId);
    if (!user || !user.is_creator) {
      return NextResponse.json({ error: 'Only creators can generate codes' }, { status: 403 });
    }

    const { videoSessionId } = await request.json();

    if (!videoSessionId) {
      return NextResponse.json({ error: 'Video session ID required' }, { status: 400 });
    }

    // Verify the video session belongs to the user
    const sessionResult = await query(
      'SELECT id FROM video_sessions WHERE id = $1 AND creator_id = $2',
      [videoSessionId, user.id]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Video session not found' }, { status: 404 });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create verification session
    const verificationResult = await query(
      `INSERT INTO auth_verification_sessions (video_session_id, verification_code, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, verification_code, expires_at`,
      [videoSessionId, verificationCode, expiresAt]
    );

    const verificationSession = verificationResult.rows[0];

    return NextResponse.json({
      success: true,
      verificationSession: {
        id: verificationSession.id,
        code: verificationSession.verification_code,
        expiresAt: verificationSession.expires_at
      }
    });

  } catch (error) {
    console.error('Code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate verification code' },
      { status: 500 }
    );
  }
}
