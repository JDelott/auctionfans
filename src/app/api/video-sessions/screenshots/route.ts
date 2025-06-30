import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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
      return NextResponse.json({ error: 'Only creators can capture screenshots' }, { status: 403 });
    }

    const body = await request.json();
    const { videoSessionId, timestamp, imageData } = body;

    if (!videoSessionId || timestamp === undefined || !imageData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify video session belongs to user
    const sessionResult = await query(
      'SELECT id FROM video_sessions WHERE id = $1 AND creator_id = $2',
      [videoSessionId, user.id]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Video session not found' }, { status: 404 });
    }

    // Create screenshots directory
    const screenshotDir = path.join(process.cwd(), 'public', 'uploads', 'screenshots');
    await mkdir(screenshotDir, { recursive: true });

    // Generate unique filename
    const fileName = `${videoSessionId}-${timestamp}-${Date.now()}.jpeg`;
    const filePath = path.join(screenshotDir, fileName);

    // Write image file
    const buffer = Buffer.from(imageData, 'base64');
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/screenshots/${fileName}`;

    // Save to database
    const result = await query(
      `INSERT INTO video_screenshots (video_session_id, timestamp_seconds, image_path, image_url, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, video_session_id, timestamp_seconds, image_url, created_at`,
      [videoSessionId, timestamp, filePath, imageUrl, timestamp]
    );

    const screenshot = result.rows[0];

    return NextResponse.json({
      success: true,
      screenshot
    });

  } catch (error) {
    console.error('Screenshot capture error:', error);
    return NextResponse.json(
      { error: 'Failed to capture screenshot' },
      { status: 500 }
    );
  }
}
