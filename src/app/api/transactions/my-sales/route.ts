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
        t.id,
        t.final_price,
        t.payment_status,
        t.shipping_status,
        t.created_at,
        t.purchase_type,
        t.transaction_fee,
        ai.id as auction_id,
        ai.title as auction_title,
        ai.description,
        ai.condition,
        buyer.username as buyer_username,
        buyer.display_name as buyer_display_name,
        buyer.email as buyer_email,
        (
          SELECT image_url 
          FROM auction_item_images 
          WHERE auction_item_id = ai.id AND is_primary = true 
          LIMIT 1
        ) as primary_image
       FROM transactions t
       JOIN auction_items ai ON t.auction_item_id = ai.id
       JOIN users buyer ON t.buyer_id = buyer.id
       WHERE t.seller_id = $1 AND t.payment_status = 'paid'
       ORDER BY t.created_at DESC`,
      [decoded.userId]
    );

    // Calculate total revenue
    const revenueResult = await query(
      `SELECT 
        COUNT(*) as total_sales,
        SUM(final_price) as total_revenue,
        SUM(transaction_fee) as total_fees,
        SUM(final_price - COALESCE(transaction_fee, 0)) as net_revenue
       FROM transactions 
       WHERE seller_id = $1 AND payment_status = 'paid'`,
      [decoded.userId]
    );

    const stats = revenueResult.rows[0] || {
      total_sales: 0,
      total_revenue: 0,
      total_fees: 0,
      net_revenue: 0
    };

    return NextResponse.json({
      sales: result.rows,
      stats
    });
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
} 
