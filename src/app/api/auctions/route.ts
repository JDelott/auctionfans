import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'active';
    
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT 
        ai.id, ai.title, ai.description, ai.current_price, ai.starting_price,
        ai.buy_now_price, ai.condition, ai.status, ai.start_time, ai.end_time,
        ai.video_url, ai.video_timestamp, ai.created_at,
        u.username, u.display_name, u.is_verified,
        c.name as category_name,
        (SELECT image_url FROM auction_item_images WHERE auction_item_id = ai.id AND is_primary = true LIMIT 1) as primary_image,
        (SELECT COUNT(*) FROM bids WHERE auction_item_id = ai.id) as bid_count
      FROM auction_items ai
      JOIN users u ON ai.creator_id = u.id
      LEFT JOIN categories c ON ai.category_id = c.id
      WHERE ai.status = $1
    `;

    const params: (string | number)[] = [status];
    let paramCount = 1;

    if (category) {
      paramCount++;
      queryText += ` AND ai.category_id = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      queryText += ` AND (ai.title ILIKE $${paramCount} OR ai.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    queryText += ` ORDER BY ai.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM auction_items ai
      WHERE ai.status = $1
    `;
    const countParams = [status];
    
    if (category) {
      countQuery += ` AND ai.category_id = $2`;
      countParams.push(category);
    }
    
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      auctions: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch auctions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auctions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await getUserById(decoded.userId);
    if (!user || !user.is_creator) {
      return NextResponse.json({ error: 'Only creators can create auctions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title, description, category_id, video_url, video_timestamp,
      starting_price, buy_now_price, reserve_price, condition, duration_days
    } = body;

    // Validation
    if (!title || !description || !starting_price || !condition || !video_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (duration_days * 24 * 60 * 60 * 1000));

    const result = await query(
      `INSERT INTO auction_items (
        creator_id, category_id, title, description, video_url, video_timestamp,
        starting_price, current_price, buy_now_price, reserve_price, condition,
        status, start_time, end_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10, 'active', $11, $12)
       RETURNING *`,
      [
        user.id, category_id, title, description, video_url, video_timestamp,
        starting_price, buy_now_price, reserve_price, condition, startTime, endTime
      ]
    );

    return NextResponse.json({
      auction: result.rows[0],
      message: 'Auction created successfully'
    });
  } catch (error) {
    console.error('Failed to create auction:', error);
    return NextResponse.json(
      { error: 'Failed to create auction' },
      { status: 500 }
    );
  }
} 
