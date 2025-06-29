import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

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

    const result = await query(
      `SELECT 
        ai.id, 
        ai.title, 
        ai.description, 
        ai.current_price, 
        ai.starting_price, 
        ai.status,
        ai.start_time, 
        ai.end_time, 
        ai.created_at,
        (SELECT COUNT(*) FROM bids WHERE auction_item_id = ai.id) as bid_count,
        (
          SELECT image_url 
          FROM auction_item_images 
          WHERE auction_item_id = ai.id AND is_primary = true 
          LIMIT 1
        ) as primary_image,
        (
          SELECT image_url 
          FROM auction_item_images 
          WHERE auction_item_id = ai.id 
          ORDER BY created_at ASC 
          LIMIT 1
        ) as image_url
       FROM auction_items ai
       WHERE ai.creator_id = $1 
       ORDER BY ai.created_at DESC`,
      [decoded.userId]
    );

    return NextResponse.json({
      auctions: result.rows
    });
  } catch (error) {
    console.error('Failed to fetch user auctions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auctions' },
      { status: 500 }
    );
  }
} 
