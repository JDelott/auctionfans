import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';

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
      return NextResponse.json({ error: 'Only creators can create authenticated listings' }, { status: 403 });
    }

    // Check if creator can create authenticated listings
    const canCreateResult = await query(
      'SELECT can_create_authenticated_listing($1) as can_create',
      [user.id]
    );

    if (!canCreateResult.rows[0].can_create) {
      return NextResponse.json({ 
        error: 'ID verification and valid auth video required to create authenticated listings' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { listings, auth_video_id } = body;

    if (!listings || !Array.isArray(listings) || listings.length === 0) {
      return NextResponse.json({ error: 'No listings provided' }, { status: 400 });
    }

    if (!auth_video_id) {
      return NextResponse.json({ error: 'Auth video ID required' }, { status: 400 });
    }

    // Verify the auth video belongs to the creator and is verified
    const authVideoResult = await query(
      `SELECT av.*, civ.status as id_verification_status
       FROM auth_videos av
       JOIN creator_id_verification civ ON av.id_verification_id = civ.id
       WHERE av.id = $1 AND av.creator_id = $2 AND av.status = 'verified'`,
      [auth_video_id, user.id]
    );

    if (authVideoResult.rows.length === 0) {
      return NextResponse.json({ error: 'Valid auth video not found' }, { status: 404 });
    }

    const authVideo = authVideoResult.rows[0];

    // Check if we're within the item limit
    const existingListingsResult = await query(
      'SELECT COUNT(*) as count FROM authenticated_listings WHERE auth_video_id = $1',
      [auth_video_id]
    );

    const existingCount = parseInt(existingListingsResult.rows[0].count);
    const totalItems = existingCount + listings.length;

    if (totalItems > authVideo.max_items_allowed) {
      return NextResponse.json({ 
        error: `Too many items. Maximum ${authVideo.max_items_allowed} items allowed per auth video. You have ${existingCount} existing items.` 
      }, { status: 400 });
    }

    const createdListings = [];

    // Create each listing in a transaction
    await query('BEGIN');

    try {
      for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];
        const {
          title, description, category_id, starting_price, buy_now_price, 
          reserve_price, condition, duration_days, item_position_in_video,
          video_timestamp_start, video_timestamp_end
        } = listing;

        // Validate required fields
        if (!title || !description || !starting_price || !condition || !item_position_in_video) {
          throw new Error(`Listing ${i + 1}: Missing required fields`);
        }

        // Validate numeric fields
        if (isNaN(parseFloat(starting_price)) || parseFloat(starting_price) <= 0) {
          throw new Error(`Listing ${i + 1}: Invalid starting price`);
        }

        // Create the auction item first
        const durationDays = parseInt(duration_days) || 7;
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + (durationDays * 24 * 60 * 60 * 1000));

        const finalCategoryId = category_id && category_id.trim() ? category_id.trim() : null;
        const finalBuyNowPrice = buy_now_price && !isNaN(parseFloat(buy_now_price)) ? parseFloat(buy_now_price) : null;
        const finalReservePrice = reserve_price && !isNaN(parseFloat(reserve_price)) ? parseFloat(reserve_price) : null;

        const auctionResult = await query(
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
            authVideo.video_url, // Link to auth video
            video_timestamp_start || null,
            parseFloat(starting_price),
            finalBuyNowPrice,
            finalReservePrice,
            condition,
            startTime,
            endTime
          ]
        );

        const auctionItem = auctionResult.rows[0];

        // Create the authenticated listing link
        const authenticatedListingResult = await query(
          `INSERT INTO authenticated_listings (
            creator_id, auth_video_id, auction_item_id, item_position_in_video,
            video_timestamp_start, video_timestamp_end, status
          ) VALUES ($1, $2, $3, $4, $5, $6, 'verified')
           RETURNING *`,
          [
            user.id,
            auth_video_id,
            auctionItem.id,
            item_position_in_video,
            video_timestamp_start || null,
            video_timestamp_end || null
          ]
        );

        createdListings.push({
          auction_item: auctionItem,
          authenticated_listing: authenticatedListingResult.rows[0]
        });
      }

      // Update the declared items count in auth video
      await query(
        'UPDATE auth_videos SET declared_items_count = declared_items_count + $1 WHERE id = $2',
        [listings.length, auth_video_id]
      );

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        created_listings: createdListings,
        message: `Successfully created ${listings.length} authenticated listings`
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Batch listings creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create batch listings' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch authenticated listings for a creator
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

    const user = await getUserById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await query(
      `SELECT 
        al.*,
        ai.title, ai.description, ai.starting_price, ai.current_price, ai.status as auction_status,
        ai.start_time, ai.end_time, ai.condition,
        av.video_url, av.declaration_text, av.status as video_status,
        c.name as category_name,
        (SELECT COUNT(*) FROM bids WHERE auction_item_id = ai.id) as bid_count
       FROM authenticated_listings al
       JOIN auction_items ai ON al.auction_item_id = ai.id
       JOIN auth_videos av ON al.auth_video_id = av.id
       LEFT JOIN categories c ON ai.category_id = c.id
       WHERE al.creator_id = $1
       ORDER BY al.created_at DESC`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      authenticated_listings: result.rows
    });

  } catch (error) {
    console.error('Get authenticated listings error:', error);
    return NextResponse.json(
      { error: 'Failed to get authenticated listings' },
      { status: 500 }
    );
  }
} 
