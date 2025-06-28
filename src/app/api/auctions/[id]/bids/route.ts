import { NextRequest, NextResponse } from 'next/server';
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

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid bid amount' }, { status: 400 });
    }

    // Get current auction details
    const auctionResult = await query(
      `SELECT ai.id, ai.creator_id, ai.current_price, ai.starting_price, ai.status, ai.end_time,
              COALESCE(MAX(b.amount), ai.starting_price) as highest_bid
       FROM auction_items ai
       LEFT JOIN bids b ON ai.id = b.auction_item_id
       WHERE ai.id = $1 AND ai.status = 'active' AND ai.end_time > NOW()
       GROUP BY ai.id, ai.creator_id, ai.current_price, ai.starting_price, ai.status, ai.end_time`,
      [id]
    );

    if (auctionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Auction not found or not active' }, { status: 404 });
    }

    const auction = auctionResult.rows[0];

    // Prevent bidding on own auction
    if (auction.creator_id === user.id) {
      return NextResponse.json({ error: 'Cannot bid on your own auction' }, { status: 400 });
    }

    // Validate bid amount
    const minBid = Math.max(Number(auction.highest_bid), Number(auction.starting_price)) + 0.01;
    if (amount < minBid) {
      return NextResponse.json({ 
        error: `Minimum bid is $${minBid.toFixed(2)}` 
      }, { status: 400 });
    }

    // Place the bid
    await query('BEGIN');

    const bidResult = await query(
      `INSERT INTO bids (auction_item_id, bidder_id, amount)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [id, user.id, amount]
    );

    // Update current price
    await query(
      `UPDATE auction_items 
       SET current_price = $1, updated_at = NOW()
       WHERE id = $2`,
      [amount, id]
    );

    await query('COMMIT');

    return NextResponse.json({
      success: true,
      bid: bidResult.rows[0]
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Failed to place bid:', error);
    return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bidsResult = await query(
      `SELECT 
        b.id, b.amount, b.created_at,
        u.username, u.display_name
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       WHERE b.auction_item_id = $1
       ORDER BY b.amount DESC, b.created_at DESC`,
      [params.id]
    );

    return NextResponse.json({
      bids: bidsResult.rows
    });
  } catch (error) {
    console.error('Failed to fetch bids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
} 
