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
        id, title, description, current_price, starting_price, status,
        start_time, end_time, created_at,
        (SELECT COUNT(*) FROM bids WHERE auction_item_id = auction_items.id) as bid_count
       FROM auction_items 
       WHERE creator_id = $1 
       ORDER BY created_at DESC`,
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
