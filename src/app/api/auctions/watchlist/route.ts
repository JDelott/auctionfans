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
        ai.id, ai.title, ai.description, ai.current_price, ai.status,
        ai.end_time, ai.created_at
       FROM auction_items ai
       JOIN watchlist w ON ai.id = w.auction_item_id
       WHERE w.user_id = $1 AND ai.status = 'active'
       ORDER BY w.created_at DESC`,
      [decoded.userId]
    );

    return NextResponse.json({
      auctions: result.rows
    });
  } catch (error) {
    console.error('Failed to fetch watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
} 
