import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // First try to find existing transaction
    let result = await query(`
      SELECT 
        t.*,
        ai.title as auction_title,
        seller.username as seller_username,
        seller.email as seller_email
      FROM transactions t
      JOIN auction_items ai ON t.auction_item_id = ai.id
      JOIN users seller ON t.seller_id = seller.id
      WHERE t.stripe_session_id = $1 AND t.buyer_id = $2
    `, [sessionId, tokenData.userId]);

    // If no transaction found, create one based on the auction
    if (result.rows.length === 0) {
      console.log('No transaction found, creating one from auction data...');
      
      const auctionResult = await query(`
        SELECT 
          ai.*,
          seller.username as seller_username,
          seller.email as seller_email
        FROM auction_items ai
        JOIN users seller ON ai.creator_id = seller.id
        WHERE ai.stripe_session_id = $1 AND ai.winner_id = $2
      `, [sessionId, tokenData.userId]);

      if (auctionResult.rows.length > 0) {
        const auction = auctionResult.rows[0];
        console.log('Found auction, creating transaction:', auction.id);
        
        // Create the transaction record
        await query(`
          INSERT INTO transactions (
            auction_item_id, seller_id, buyer_id, final_price, 
            payment_status, payment_method, stripe_session_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          auction.id,
          auction.creator_id,
          tokenData.userId,
          auction.buy_now_price || auction.current_price,
          'paid',
          'card',
          sessionId
        ]);

        // Fetch the newly created transaction
        result = await query(`
          SELECT 
            t.*,
            ai.title as auction_title,
            seller.username as seller_username,
            seller.email as seller_email
          FROM transactions t
          JOIN auction_items ai ON t.auction_item_id = ai.id
          JOIN users seller ON t.seller_id = seller.id
          WHERE t.stripe_session_id = $1 AND t.buyer_id = $2
        `, [sessionId, tokenData.userId]);
      }
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transaction = result.rows[0];
    
    // Add auction_images as empty array for now (since we don't have images uploaded)
    transaction.auction_images = [];

    return NextResponse.json({ transaction });

  } catch (error) {
    console.error('Failed to fetch transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
} 
