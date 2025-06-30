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

    // Fixed validation - video_url is now optional
    if (!title || !description || !starting_price || !condition) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, description, starting_price, and condition are required' 
      }, { status: 400 });
    }

    // Validate numeric fields
    if (isNaN(parseFloat(starting_price)) || parseFloat(starting_price) <= 0) {
      return NextResponse.json({ error: 'Starting price must be a positive number' }, { status: 400 });
    }

    if (buy_now_price && (isNaN(parseFloat(buy_now_price)) || parseFloat(buy_now_price) <= 0)) {
      return NextResponse.json({ error: 'Buy now price must be a positive number' }, { status: 400 });
    }

    if (reserve_price && (isNaN(parseFloat(reserve_price)) || parseFloat(reserve_price) <= 0)) {
      return NextResponse.json({ error: 'Reserve price must be a positive number' }, { status: 400 });
    }

    // Validate duration
    const durationDays = parseInt(duration_days) || 7;
    if (durationDays < 1 || durationDays > 14) {
      return NextResponse.json({ error: 'Duration must be between 1 and 14 days' }, { status: 400 });
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (durationDays * 24 * 60 * 60 * 1000));

    // Handle optional fields - set null if empty
    const finalVideoUrl = video_url && video_url.trim() ? video_url.trim() : null;
    const finalVideoTimestamp = video_timestamp && !isNaN(parseInt(video_timestamp)) ? parseInt(video_timestamp) : null;
    const finalCategoryId = category_id && category_id.trim() ? category_id.trim() : null;
    const finalBuyNowPrice = buy_now_price && !isNaN(parseFloat(buy_now_price)) ? parseFloat(buy_now_price) : null;
    const finalReservePrice = reserve_price && !isNaN(parseFloat(reserve_price)) ? parseFloat(reserve_price) : null;

    console.log('Creating auction with data:', {
      title,
      description: description.substring(0, 50) + '...',
      category_id: finalCategoryId,
      video_url: finalVideoUrl,
      video_timestamp: finalVideoTimestamp,
      starting_price: parseFloat(starting_price),
      buy_now_price: finalBuyNowPrice,
      reserve_price: finalReservePrice,
      condition,
      duration_days: durationDays
    });

    const result = await query(
      `INSERT INTO auction_items (
        creator_id, category_id, title, description, video_url, video_timestamp,
        starting_price, current_price, buy_now_price, reserve_price, condition,
        status, start_time, end_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10, 'active', $11, $12)
       RETURNING *`,
      [
        user.id, 
        finalCategoryId, 
        title.trim(), 
        description.trim(), 
        finalVideoUrl, 
        finalVideoTimestamp,
        parseFloat(starting_price), 
        finalBuyNowPrice, 
        finalReservePrice, 
        condition, 
        startTime, 
        endTime
      ]
    );

    return NextResponse.json({
      auction: result.rows[0],
      message: 'Auction created successfully'
    });
  } catch (error) {
    console.error('Failed to create auction:', error);
    return NextResponse.json(
      { error: 'Failed to create auction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
