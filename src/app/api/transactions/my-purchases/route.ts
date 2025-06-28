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
        ai.id as auction_id,
        ai.title as auction_title,
        ai.description,
        ai.condition,
        seller.username as seller_username,
        seller.display_name as seller_display_name,
        seller.is_verified as seller_verified,
        (
          SELECT image_url 
          FROM auction_item_images 
          WHERE auction_item_id = ai.id AND is_primary = true 
          LIMIT 1
        ) as primary_image
       FROM transactions t
       JOIN auction_items ai ON t.auction_item_id = ai.id
       JOIN users seller ON t.seller_id = seller.id
       WHERE t.buyer_id = $1 AND t.payment_status = 'paid'
       ORDER BY t.created_at DESC`,
      [decoded.userId]
    );

    return NextResponse.json({
      purchases: result.rows
    });
  } catch (error) {
    console.error('Failed to fetch purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
} 
