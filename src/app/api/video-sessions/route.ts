import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';

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
      return NextResponse.json({ error: 'Only creators can create video sessions' }, { status: 403 });
    }

    const body = await request.json();
    const { source = 'screenshots' } = body;

    // Create video session for screenshots-only uploads
    const result = await query(
      `INSERT INTO video_sessions (creator_id, video_url, video_metadata, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, creator_id, video_url, status, created_at`,
      [
        user.id,
        'screenshots-only', // This is just a placeholder, not used as UUID
        JSON.stringify({
          source,
          type: 'screenshots_upload',
          processedAt: new Date().toISOString()
        }),
        'ready' // Screenshots are immediately ready for AI detection
      ]
    );

    const videoSession = result.rows[0];

    return NextResponse.json({
      success: true,
      videoSession
    });

  } catch (error) {
    console.error('Video session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create video session' },
      { status: 500 }
    );
  }
}
