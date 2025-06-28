import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Accept or decline auction win
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { action } = await request.json();
    const auctionId = params.id;

    // Get auction details
    const auctionResult = await query(
      'SELECT * FROM auctions WHERE id = $1',
      [auctionId]
    );

    if (auctionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    const auction = auctionResult.rows[0];

    // Check if auction has ended and user is the winner
    const now = new Date();
    const endTime = new Date(auction.end_time);

    if (now < endTime) {
      return NextResponse.json({ error: 'Auction has not ended yet' }, { status: 400 });
    }

    // Get highest bid to determine winner
    const bidResult = await query(
      'SELECT * FROM bids WHERE auction_id = $1 ORDER BY amount DESC LIMIT 1',
      [auctionId]
    );

    if (bidResult.rows.length === 0) {
      return NextResponse.json({ error: 'No bids found' }, { status: 400 });
    }

    const winningBid = bidResult.rows[0];

    if (winningBid.user_id !== tokenData.userId) {
      return NextResponse.json({ error: 'You are not the winner of this auction' }, { status: 403 });
    }

    if (action === 'accept') {
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: auction.title,
                description: auction.description,
              },
              unit_amount: Math.round(parseFloat(winningBid.amount) * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/auctions/${auctionId}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/auctions/${auctionId}`,
        metadata: {
          auction_id: auctionId,
          user_id: tokenData.userId,
          bid_id: winningBid.id,
        },
      });

      // Update auction status to 'accepted'
      await query(
        'UPDATE auctions SET status = $1 WHERE id = $2',
        ['payment_pending', auctionId]
      );

      return NextResponse.json({ 
        success: true, 
        checkout_url: session.url 
      });

    } else if (action === 'decline') {
      // Update auction status to 'declined'
      await query(
        'UPDATE auctions SET status = $1 WHERE id = $2',
        ['declined', auctionId]
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Auction declined successfully' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error processing auction win:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Get auction win status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const result = await query(`
      SELECT 
        ai.id,
        ai.title,
        ai.current_price,
        ai.status,
        ai.winner_id,
        ai.winner_response,
        ai.winner_response_at,
        ai.stripe_session_id,
        ai.payment_status,
        t.id as transaction_id,
        t.payment_status as transaction_payment_status,
        t.shipping_status
      FROM auction_items ai
      LEFT JOIN transactions t ON ai.id = t.auction_item_id
      WHERE ai.id = $1 AND ai.winner_id = $2
    `, [id, tokenData.userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Auction not found or you are not the winner' 
      }, { status: 404 });
    }

    return NextResponse.json({ auction: result.rows[0] });

  } catch (error) {
    console.error('Failed to get win status:', error);
    return NextResponse.json(
      { error: 'Failed to get win status' },
      { status: 500 }
    );
  }
} 
