import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const platform = searchParams.get('platform') || '';
    
    const offset = (page - 1) * limit;

    // Build the query
    let whereClause = 'WHERE u.is_creator = true';
    const queryParams: (string | number)[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (u.username ILIKE $${paramCount} OR u.display_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (platform) {
      paramCount++;
      whereClause += ` AND cp.platform = $${paramCount}`;
      queryParams.push(platform);
    }

    // Add pagination parameters
    const limitParam = paramCount + 1;
    const offsetParam = paramCount + 2;
    queryParams.push(limit, offset);

    // Get creators with their stats
    const creatorsQuery = `
      SELECT 
        u.id, u.username, u.display_name, u.bio, u.profile_image_url, 
        u.is_verified, u.created_at,
        cp.channel_name, cp.channel_url, cp.platform, cp.subscriber_count, cp.verification_status,
        COALESCE(stats.auction_count, 0) as auction_count,
        COALESCE(stats.active_auction_count, 0) as active_auction_count,
        COALESCE(stats.total_sales, 0) as total_sales
      FROM users u
      LEFT JOIN creator_profiles cp ON u.id = cp.user_id
      LEFT JOIN (
        SELECT 
          creator_id,
          COUNT(*) as auction_count,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_auction_count,
          COUNT(CASE WHEN status = 'ended' AND winner_id IS NOT NULL THEN 1 END) as total_sales
        FROM auction_items
        GROUP BY creator_id
      ) stats ON u.id = stats.creator_id
      ${whereClause}
      ORDER BY u.is_verified DESC, cp.subscriber_count DESC NULLS LAST, u.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const creatorsResult = await query(creatorsQuery, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN creator_profiles cp ON u.id = cp.user_id
      ${whereClause}
    `;

    const countResult = await query(countQuery, queryParams.slice(0, -2)); // Remove limit and offset
    const totalCreators = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalCreators / limit);

    return NextResponse.json({
      creators: creatorsResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCreators,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Failed to fetch creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
} 
