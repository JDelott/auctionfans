import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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
      return NextResponse.json({ error: 'Only creators can create batch listings' }, { status: 403 });
    }

    const formData = await request.formData();
    const authVideoId = formData.get('auth_video_id') as string;

    if (!authVideoId) {
      return NextResponse.json({ error: 'Auth video ID is required' }, { status: 400 });
    }

    // Verify the auth video belongs to this creator and is verified
    const authVideoResult = await query(
      'SELECT * FROM auth_videos WHERE id = $1 AND creator_id = $2 AND status = $3',
      [authVideoId, user.id, 'verified']
    );

    if (authVideoResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or unverified auth video' }, { status: 400 });
    }

    // Parse listings from form data
    const listings = [];
    let index = 0;
    while (formData.has(`listings[${index}][title]`)) {
      const listing = {
        title: formData.get(`listings[${index}][title]`) as string,
        description: formData.get(`listings[${index}][description]`) as string,
        category_id: formData.get(`listings[${index}][category_id]`) as string,
        starting_price: formData.get(`listings[${index}][starting_price]`) as string,
        buy_now_price: formData.get(`listings[${index}][buy_now_price]`) as string,
        reserve_price: formData.get(`listings[${index}][reserve_price]`) as string,
        condition: formData.get(`listings[${index}][condition]`) as string,
        duration_days: parseInt(formData.get(`listings[${index}][duration_days]`) as string),
        item_position_in_video: parseInt(formData.get(`listings[${index}][item_position_in_video]`) as string),
        video_timestamp_start: formData.get(`listings[${index}][video_timestamp_start]`) as string,
        video_timestamp_end: formData.get(`listings[${index}][video_timestamp_end]`) as string,
        published_content_url: formData.get(`listings[${index}][published_content_url]`) as string,
        image_file: formData.get(`images[${index}]`) as File,
      };
      listings.push(listing);
      index++;
    }

    if (listings.length === 0) {
      return NextResponse.json({ error: 'No listings provided' }, { status: 400 });
    }

    // Create upload directory for auction images
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'auctions');
    await mkdir(uploadDir, { recursive: true });

    const createdListings = [];

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];

      // Upload product image
      let imagePath = null;
      if (listing.image_file && listing.image_file.size > 0) {
        const timestamp = Date.now();
        const fileExtension = listing.image_file.name.split('.').pop();
        const fileName = `${user.id}-${timestamp}-${i}.${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);
        
        const bytes = await listing.image_file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));
        
        imagePath = `/uploads/auctions/${fileName}`;
      }

      // Calculate auction start and end times
      const startTime = new Date(); // Start immediately
      const endTime = new Date(startTime.getTime() + (listing.duration_days * 24 * 60 * 60 * 1000)); // Add duration in milliseconds

      // Create auction item first (remove image_url from INSERT)
      const auctionResult = await query(`
        INSERT INTO auction_items (
          creator_id, title, description, category_id, starting_price, buy_now_price, 
          reserve_price, condition, start_time, end_time, status, current_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        user.id,
        listing.title,
        listing.description,
        listing.category_id || null,
        parseFloat(listing.starting_price),
        listing.buy_now_price ? parseFloat(listing.buy_now_price) : null,
        listing.reserve_price ? parseFloat(listing.reserve_price) : null,
        listing.condition,
        startTime,
        endTime,
        'active',
        parseFloat(listing.starting_price) // Set current_price to starting_price
      ]);

      const auctionItemId = auctionResult.rows[0].id;

      // Store image in auction_item_images table if uploaded
      if (imagePath) {
        await query(`
          INSERT INTO auction_item_images (
            auction_item_id, image_url, is_primary, sort_order
          ) VALUES ($1, $2, $3, $4)
        `, [
          auctionItemId,
          imagePath,
          true, // Make it the primary image
          0 // First image, sort order 0
        ]);
      }

      // Create authenticated listing linking to the auction
      const authListingResult = await query(`
        INSERT INTO authenticated_listings (
          creator_id, auth_video_id, auction_item_id, item_position_in_video,
          video_timestamp_start, video_timestamp_end, published_content_url, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        user.id,
        authVideoId,
        auctionItemId,
        listing.item_position_in_video,
        listing.video_timestamp_start ? parseInt(listing.video_timestamp_start) : null,
        listing.video_timestamp_end ? parseInt(listing.video_timestamp_end) : null,
        listing.published_content_url,
        'verified'
      ]);

      // Create authentication badge
      await query(`
        INSERT INTO listing_authentication_badges (
          listing_id, id_verified, video_authenticated, verification_date
        ) VALUES ($1, $2, $3, $4)
      `, [
        authListingResult.rows[0].id,
        true,
        true,
        new Date()
      ]);

      createdListings.push({
        auction_item_id: auctionItemId,
        authenticated_listing_id: authListingResult.rows[0].id,
        title: listing.title
      });
    }

    return NextResponse.json({
      success: true,
      listings: createdListings,
      message: `${createdListings.length} authenticated listings created successfully!`
    });

  } catch (error) {
    console.error('Batch listings error:', error);
    return NextResponse.json(
      { error: 'Failed to create batch listings' },
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

// DELETE endpoint to remove authenticated listing
export async function DELETE(request: NextRequest) {
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
      return NextResponse.json({ error: 'Only creators can delete authenticated listings' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('id');

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Get the authenticated listing and verify ownership
    const listingResult = await query(
      `SELECT al.*, ai.id as auction_item_id, ai.status as auction_status 
       FROM authenticated_listings al
       JOIN auction_items ai ON al.auction_item_id = ai.id
       WHERE al.id = $1 AND al.creator_id = $2`,
      [listingId, user.id]
    );

    if (listingResult.rows.length === 0) {
      return NextResponse.json({ error: 'Listing not found or access denied' }, { status: 404 });
    }

    const listing = listingResult.rows[0];

    // Check if auction has bids
    const bidsResult = await query(
      'SELECT COUNT(*) as count FROM bids WHERE auction_item_id = $1',
      [listing.auction_item_id]
    );

    if (parseInt(bidsResult.rows[0].count) > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete listing with active bids' 
      }, { status: 400 });
    }

    // Delete in cascade order: badges -> listings -> auction images -> auction items
    await query('DELETE FROM listing_authentication_badges WHERE listing_id = $1', [listingId]);
    await query('DELETE FROM authenticated_listings WHERE id = $1', [listingId]);
    await query('DELETE FROM auction_item_images WHERE auction_item_id = $1', [listing.auction_item_id]);
    await query('DELETE FROM auction_items WHERE id = $1', [listing.auction_item_id]);

    return NextResponse.json({
      success: true,
      message: 'Authenticated listing deleted successfully'
    });

  } catch (error) {
    console.error('Delete authenticated listing error:', error);
    return NextResponse.json(
      { error: 'Failed to delete authenticated listing' },
      { status: 500 }
    );
  }
} 
