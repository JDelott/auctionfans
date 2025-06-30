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
      return NextResponse.json({ error: 'Only creators can upload auth videos' }, { status: 403 });
    }

    // Check if creator has verified ID first
    const idVerificationResult = await query(
      'SELECT id FROM creator_id_verification WHERE creator_id = $1 AND status = $2',
      [user.id, 'verified']
    );

    if (idVerificationResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'ID verification required before uploading auth video' 
      }, { status: 400 });
    }

    const idVerificationId = idVerificationResult.rows[0].id;

    const formData = await request.formData();
    const file = formData.get('video') as File;
    const declarationText = formData.get('declarationText') as string;
    const declaredItemsCount = parseInt(formData.get('declaredItemsCount') as string) || 0;

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    if (!declarationText) {
      return NextResponse.json({ error: 'Declaration text is required' }, { status: 400 });
    }

    if (declaredItemsCount <= 0 || declaredItemsCount > 10) {
      return NextResponse.json({ error: 'Must declare 1-10 items' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be a video' }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'auth-videos');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const videoUrl = `/uploads/auth-videos/${fileName}`;

    // Create auth video record - AUTO-VERIFY instantly like ID verification
    const result = await query(
      `INSERT INTO auth_videos (
        creator_id, id_verification_id, video_file_path, video_url, 
        declaration_text, declared_items_count, status, verified_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, creator_id, video_url, declaration_text, declared_items_count, status, created_at, verified_at`,
      [
        user.id,
        idVerificationId,
        filePath,
        videoUrl,
        declarationText,
        declaredItemsCount,
        'verified', // Auto-verify instantly
        new Date(), // verified_at
        new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // expires in 6 months
      ]
    );

    const authVideo = result.rows[0];

    return NextResponse.json({
      success: true,
      authVideo,
      message: 'Auth video uploaded and verified successfully!'
    });

  } catch (error) {
    console.error('Auth video upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload auth video' },
      { status: 500 }
    );
  }
}

// GET endpoint to check auth video status
export async function GET(request: NextRequest) {
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
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get creator's auth videos
    const result = await query(
      `SELECT 
        av.*, 
        civ.status as id_verification_status
       FROM auth_videos av
       JOIN creator_id_verification civ ON av.id_verification_id = civ.id
       WHERE av.creator_id = $1
       ORDER BY av.created_at DESC`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      authVideos: result.rows
    });

  } catch (error) {
    console.error('Get auth videos error:', error);
    return NextResponse.json(
      { error: 'Failed to get auth videos' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove auth video
export async function DELETE(request: NextRequest) {
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
      return NextResponse.json({ error: 'Only creators can delete auth videos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Check if video belongs to this creator
    const videoResult = await query(
      'SELECT * FROM auth_videos WHERE id = $1 AND creator_id = $2',
      [videoId, user.id]
    );

    if (videoResult.rows.length === 0) {
      return NextResponse.json({ error: 'Video not found or access denied' }, { status: 404 });
    }

    // Check if video has any listings associated with it
    const listingsResult = await query(
      'SELECT COUNT(*) as count FROM authenticated_listings WHERE auth_video_id = $1',
      [videoId]
    );

    if (parseInt(listingsResult.rows[0].count) > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete video with associated listings. Delete listings first.' 
      }, { status: 400 });
    }

    // Delete the video
    await query('DELETE FROM auth_videos WHERE id = $1', [videoId]);

    return NextResponse.json({
      success: true,
      message: 'Auth video deleted successfully'
    });

  } catch (error) {
    console.error('Delete auth video error:', error);
    return NextResponse.json(
      { error: 'Failed to delete auth video' },
      { status: 500 }
    );
  }
} 
