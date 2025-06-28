import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Get creator details
    const creatorResult = await query(
      `SELECT 
        u.id, u.email, u.username, u.display_name, u.bio, u.profile_image_url,
        u.is_creator, u.is_verified, u.created_at,
        cp.channel_name, cp.channel_url, cp.platform, cp.subscriber_count, cp.verification_status
       FROM users u
       LEFT JOIN creator_profiles cp ON u.id = cp.user_id
       WHERE u.username = $1 AND u.is_creator = true`,
      [username]
    );

    if (creatorResult.rows.length === 0) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const creator = creatorResult.rows[0];

    // Get creator's auctions
    const auctionsResult = await query(
      `SELECT 
        ai.id, ai.title, ai.description, ai.current_price, ai.starting_price,
        ai.buy_now_price, ai.condition, ai.status, ai.end_time, ai.created_at,
        c.name as category_name,
        (SELECT COUNT(*) FROM bids WHERE auction_item_id = ai.id) as bid_count,
        (SELECT image_url FROM auction_item_images WHERE auction_item_id = ai.id AND is_primary = true LIMIT 1) as primary_image
       FROM auction_items ai
       LEFT JOIN categories c ON ai.category_id = c.id
       WHERE ai.creator_id = $1
       ORDER BY ai.created_at DESC
       LIMIT 20`,
      [creator.id]
    );

    // Get creator statistics
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_auctions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_auctions,
        COUNT(CASE WHEN status = 'ended' AND winner_id IS NOT NULL THEN 1 END) as completed_sales,
        COALESCE(AVG(CASE WHEN status = 'ended' AND winner_id IS NOT NULL THEN current_price END), 0) as avg_sale_price,
        COALESCE(SUM(CASE WHEN status = 'ended' AND winner_id IS NOT NULL THEN current_price END), 0) as total_revenue
       FROM auction_items
       WHERE creator_id = $1`,
      [creator.id]
    );

    const stats = statsResult.rows[0] || {
      total_auctions: 0,
      active_auctions: 0,
      completed_sales: 0,
      avg_sale_price: 0,
      total_revenue: 0
    };

    // Get recent activity (recent auctions and bids)
    const recentActivityResult = await query(
      `SELECT 
        'auction_created' as activity_type,
        ai.id as auction_id,
        ai.title as auction_title,
        ai.created_at as activity_date
       FROM auction_items ai
       WHERE ai.creator_id = $1
       UNION ALL
       SELECT 
        'auction_ended' as activity_type,
        ai.id as auction_id,
        ai.title as auction_title,
        ai.end_time as activity_date
       FROM auction_items ai
       WHERE ai.creator_id = $1 AND ai.status = 'ended' AND ai.end_time > NOW() - INTERVAL '30 days'
       ORDER BY activity_date DESC
       LIMIT 10`,
      [creator.id]
    );

    return NextResponse.json({
      creator,
      auctions: auctionsResult.rows,
      stats: {
        ...stats,
        avg_sale_price: parseFloat(stats.avg_sale_price) || 0,
        total_revenue: parseFloat(stats.total_revenue) || 0
      },
      recentActivity: recentActivityResult.rows
    });
  } catch (error) {
    console.error('Failed to fetch creator:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creator' },
      { status: 500 }
    );
  }
} 
