import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get auction details
    const auctionResult = await query(
      `SELECT 
        ai.id, ai.title, ai.description, ai.current_price, ai.starting_price,
        ai.buy_now_price, ai.reserve_price, ai.condition, ai.status, 
        ai.start_time, ai.end_time, ai.video_url, ai.video_timestamp, ai.created_at,
        u.id as creator_id, u.username, u.display_name, u.is_verified, u.profile_image_url,
        c.name as category_name, c.description as category_description,
        (SELECT COUNT(*) FROM bids WHERE auction_item_id = ai.id) as bid_count,
        (SELECT MAX(amount) FROM bids WHERE auction_item_id = ai.id) as highest_bid
      FROM auction_items ai
      JOIN users u ON ai.creator_id = u.id
      LEFT JOIN categories c ON ai.category_id = c.id
      WHERE ai.id = $1`,
      [id]
    );

    if (auctionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    const auction = auctionResult.rows[0];

    // Get auction images
    const imagesResult = await query(
      `SELECT id, image_url, is_primary, sort_order
       FROM auction_item_images
       WHERE auction_item_id = $1
       ORDER BY is_primary DESC, sort_order ASC`,
      [id]
    );

    // Get recent bids
    const bidsResult = await query(
      `SELECT 
        b.id, b.amount, b.created_at,
        u.username, u.display_name
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       WHERE b.auction_item_id = $1
       ORDER BY b.amount DESC, b.created_at DESC
       LIMIT 10`,
      [id]
    );

    return NextResponse.json({
      auction: {
        ...auction,
        images: imagesResult.rows,
        recent_bids: bidsResult.rows
      }
    });
  } catch (error) {
    console.error('Failed to fetch auction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auction' },
      { status: 500 }
    );
  }
} 
