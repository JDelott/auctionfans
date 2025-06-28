import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

interface JWTPayload {
  userId: string;
  username: string;
  isCreator: boolean;
}

async function getUserFromToken(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fix: Await params before accessing properties
    const { id: auctionId } = await params;
    const body = await request.json();

    // Validate required fields
    const {
      title,
      description,
      starting_price,
      buy_now_price,
      reserve_price,
      condition,
      category_id,
      video_url,
      video_timestamp,
      end_time
    } = body;

    if (!title || !starting_price || !condition || !category_id || !video_url || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the auction exists and belongs to the user
    const auctionResult = await client.query(
      'SELECT * FROM auction_items WHERE id = $1 AND creator_id = $2',
      [auctionId, user.userId]
    );

    if (auctionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Auction not found or unauthorized' },
        { status: 404 }
      );
    }

    const auction = auctionResult.rows[0];

    // Only allow editing of pending, active, or draft auctions (not ended auctions)
    if (auction.status === 'ended' || auction.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot edit ended or cancelled auctions' },
        { status: 400 }
      );
    }

    // For active auctions, only allow certain fields to be updated
    const isActive = auction.status === 'active';

    let updatedAuction;

    // Validate that critical fields aren't changed for active auctions
    if (isActive) {
      // For active auctions, don't allow changing prices or timing
      const updateQuery = `
        UPDATE auction_items 
        SET 
          title = $1,
          description = $2,
          condition = $3,
          category_id = $4,
          video_url = $5,
          video_timestamp = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7 AND creator_id = $8
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [
        title,
        description || null,
        condition,
        category_id,
        video_url,
        video_timestamp || null,
        auctionId,
        user.userId
      ]);

      updatedAuction = updateResult.rows[0];
    } else {
      // For pending auctions, allow full updates
      const updateQuery = `
        UPDATE auction_items 
        SET 
          title = $1,
          description = $2,
          starting_price = $3,
          buy_now_price = $4,
          reserve_price = $5,
          condition = $6,
          category_id = $7,
          video_url = $8,
          video_timestamp = $9,
          end_time = $10,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11 AND creator_id = $12
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [
        title,
        description || null,
        starting_price,
        buy_now_price || null,
        reserve_price || null,
        condition,
        category_id,
        video_url,
        video_timestamp || null,
        end_time,
        auctionId,
        user.userId
      ]);

      updatedAuction = updateResult.rows[0];
    }

    return NextResponse.json({
      message: 'Auction updated successfully',
      auction: updatedAuction
    });
  } catch (error) {
    console.error('Error updating auction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fix: Await params before accessing properties
    const { id: auctionId } = await params;

    // First, check if the auction exists and belongs to the user
    const auctionResult = await client.query(
      'SELECT * FROM auction_items WHERE id = $1 AND creator_id = $2',
      [auctionId, user.userId]
    );

    if (auctionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Auction not found or unauthorized' },
        { status: 404 }
      );
    }

    const auction = auctionResult.rows[0];

    // Allow deletion of pending and active auctions (not ended or cancelled)
    if (auction.status === 'ended' || auction.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot delete ended or cancelled auctions' },
        { status: 400 }
      );
    }

    // Start a transaction to ensure all deletes happen together
    await client.query('BEGIN');

    try {
      // Delete related records first (due to foreign key constraints)
      // Note: Using correct table names from schema
      await client.query('DELETE FROM auction_item_images WHERE auction_item_id = $1', [auctionId]);
      await client.query('DELETE FROM bids WHERE auction_item_id = $1', [auctionId]);
      await client.query('DELETE FROM watchlist WHERE auction_item_id = $1', [auctionId]);
      await client.query('DELETE FROM messages WHERE auction_item_id = $1', [auctionId]);
      await client.query('DELETE FROM transactions WHERE auction_item_id = $1', [auctionId]);

      // Finally delete the auction
      await client.query('DELETE FROM auction_items WHERE id = $1', [auctionId]);

      // Commit the transaction
      await client.query('COMMIT');

      return NextResponse.json({ 
        message: 'Auction deleted successfully',
        deletedStatus: auction.status 
      });
    } catch (transactionError) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('Transaction error:', transactionError);
      throw transactionError;
    }
  } catch (error) {
    console.error('Error deleting auction:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
} 
