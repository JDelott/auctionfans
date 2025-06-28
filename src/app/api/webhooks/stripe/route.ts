import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      await handlePaymentSuccess(session);
      break;
    
    case 'checkout.session.expired':
      const expiredSession = event.data.object as Stripe.Checkout.Session;
      await handlePaymentExpired(expiredSession);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  try {
    const auctionId = session.metadata?.auction_id;
    const buyerId = session.metadata?.buyer_id;
    const sellerId = session.metadata?.seller_id;
    const purchaseType = session.metadata?.purchase_type || 'auction_win';
    const price = session.metadata?.price;

    if (!auctionId || !buyerId || !sellerId) {
      console.error('Missing metadata in session:', session.id);
      return;
    }

    // Get auction details
    const auctionResult = await query(`
      SELECT * FROM auction_items WHERE id = $1
    `, [auctionId]);

    if (auctionResult.rows.length === 0) {
      console.error('Auction not found:', auctionId);
      return;
    }

    const auction = auctionResult.rows[0];
    const finalPrice = price || auction.current_price;

    // Create transaction record
    await query(`
      INSERT INTO transactions (
        auction_item_id, seller_id, buyer_id, final_price, 
        payment_status, payment_method, transaction_fee,
        stripe_session_id, stripe_payment_intent_id, purchase_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      auctionId,
      sellerId,
      buyerId,
      finalPrice,
      'paid',
      'card',
      Math.round(parseFloat(finalPrice) * 0.029 + 0.30), // Stripe fee estimate
      session.id,
      session.payment_intent,
      purchaseType
    ]);

    // Update auction payment status
    const newStatus = purchaseType === 'buy_now' ? 'sold' : 'ended'; 
    await query(`
      UPDATE auction_items 
      SET payment_status = 'paid', payment_completed_at = NOW(), status = $2
      WHERE id = $1
    `, [auctionId, newStatus]);

    console.log('Payment processed successfully for auction:', auctionId, 'Type:', purchaseType);

  } catch (error) {
    console.error('Failed to process payment success:', error);
  }
}

async function handlePaymentExpired(session: Stripe.Checkout.Session) {
  try {
    const auctionId = session.metadata?.auction_id;
    const purchaseType = session.metadata?.purchase_type || 'auction_win';

    if (!auctionId) {
      console.error('Missing auction_id in expired session:', session.id);
      return;
    }

    // Update auction to show payment expired
    const newStatus = purchaseType === 'buy_now' ? 'active' : 'ended';
    await query(`
      UPDATE auction_items 
      SET payment_status = 'expired', winner_response = 'payment_expired', status = $2
      WHERE id = $1
    `, [auctionId, newStatus]);

    console.log('Payment expired for auction:', auctionId);

  } catch (error) {
    console.error('Failed to process payment expiration:', error);
  }
} 
