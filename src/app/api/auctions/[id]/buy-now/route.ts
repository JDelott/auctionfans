import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import Stripe from 'stripe';

// Check if Stripe key exists before initializing
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Add this debug line temporarily
    console.log('Stripe key exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Stripe key length:', process.env.STRIPE_SECRET_KEY?.length);
    console.log('Stripe key starts with sk_test:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'));
    
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: auctionId } = await params;

    // Get auction details
    const auctionResult = await query(
      `SELECT ai.*, u.username as seller_username 
       FROM auction_items ai
       JOIN users u ON ai.creator_id = u.id
       WHERE ai.id = $1`,
      [auctionId]
    );

    if (auctionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    const auction = auctionResult.rows[0];

    // Validate buy now conditions
    if (auction.status !== 'active') {
      return NextResponse.json({ error: 'Auction is not active' }, { status: 400 });
    }

    if (!auction.buy_now_price || auction.buy_now_price <= 0) {
      return NextResponse.json({ error: 'Buy Now not available for this auction' }, { status: 400 });
    }

    if (auction.creator_id === tokenData.userId) {
      return NextResponse.json({ error: 'Cannot buy your own auction' }, { status: 400 });
    }

    // Check if auction has already ended
    const now = new Date();
    const endTime = new Date(auction.end_time);
    if (now >= endTime) {
      return NextResponse.json({ error: 'Auction has already ended' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${auction.title} (Buy Now)`,
              description: auction.description,
            },
            unit_amount: Math.round(parseFloat(auction.buy_now_price) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/auctions/${auctionId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/auctions/${auctionId}`,
      metadata: {
        auction_id: auctionId,
        buyer_id: tokenData.userId,
        seller_id: auction.creator_id,
        purchase_type: 'buy_now',
        price: auction.buy_now_price,
      },
    });

    // Mark auction as sold via buy now
    await query(
      `UPDATE auction_items 
       SET winner_id = $1, winner_response = 'accepted', 
           winner_response_at = NOW(), status = 'buy_now_purchased',
           payment_status = 'pending', stripe_session_id = $2
       WHERE id = $3`,
      [tokenData.userId, session.id, auctionId]
    );

    return NextResponse.json({ 
      success: true, 
      checkout_url: session.url 
    });

  } catch (error) {
    console.error('Error processing buy now:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 
