import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await getUserById(tokenData.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Verify auction ownership
    const auctionResult = await query(
      'SELECT creator_id FROM auction_items WHERE id = $1',
      [id]
    );

    if (auctionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    if (auctionResult.rows[0].creator_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'auctions');
    await mkdir(uploadDir, { recursive: true });

    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        continue;
      }

      const fileName = `${id}-${Date.now()}-${i}.${file.type.split('/')[1]}`;
      const filePath = path.join(uploadDir, fileName);
      
      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));

      const imageUrl = `/uploads/auctions/${fileName}`;
      
      // Save to database
      const imageResult = await query(
        `INSERT INTO auction_item_images (auction_item_id, image_url, is_primary, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [id, imageUrl, i === 0, i]
      );

      uploadedImages.push({
        id: imageResult.rows[0].id,
        image_url: imageUrl,
        is_primary: i === 0,
        sort_order: i
      });
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages
    });

  } catch (error) {
    console.error('Failed to upload images:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
} 
