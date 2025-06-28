import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await getUserById(tokenData.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Get creator profile if user is a creator
    let creatorProfile = null;
    if (user.is_creator) {
      const creatorResult = await query(
        'SELECT * FROM creator_profiles WHERE user_id = $1',
        [user.id]
      );
      creatorProfile = creatorResult.rows[0] || null;
    }

    // Get user statistics
    const statsResult = await query(
      `SELECT 
        (SELECT COUNT(*) FROM auction_items WHERE creator_id = $1) as auctions_created,
        (SELECT COUNT(*) FROM bids WHERE bidder_id = $1) as bids_placed,
        (SELECT COUNT(*) FROM watchlist WHERE user_id = $1) as items_watched,
        (SELECT COUNT(*) FROM transactions WHERE seller_id = $1) as items_sold,
        (SELECT COUNT(*) FROM transactions WHERE buyer_id = $1) as items_bought`,
      [user.id]
    );

    const stats = statsResult.rows[0] || {
      auctions_created: 0,
      bids_placed: 0,
      items_watched: 0,
      items_sold: 0,
      items_bought: 0
    };

    return NextResponse.json({ 
      user, 
      creatorProfile,
      stats
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await getUserById(tokenData.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      display_name, 
      bio, 
      profile_image_url,
      // Creator-specific fields
      channel_name,
      channel_url,
      platform,
      subscriber_count
    } = body;

    // Start transaction
    await query('BEGIN');

    try {
      // Update user profile
      const updatedUser = await query(
        `UPDATE users 
         SET display_name = $1, bio = $2, profile_image_url = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING id, email, username, display_name, bio, profile_image_url, is_creator, is_verified, created_at`,
        [display_name || null, bio || null, profile_image_url || null, user.id]
      );

      // Update creator profile if user is a creator
      let creatorProfile = null;
      if (user.is_creator && (channel_name || channel_url || platform || subscriber_count !== undefined)) {
        // Check if creator profile exists
        const existingCreatorResult = await query(
          'SELECT id FROM creator_profiles WHERE user_id = $1',
          [user.id]
        );

        if (existingCreatorResult.rows.length > 0) {
          // Update existing creator profile
          const updatedCreatorResult = await query(
            `UPDATE creator_profiles 
             SET channel_name = $1, channel_url = $2, platform = $3, subscriber_count = $4, updated_at = NOW()
             WHERE user_id = $5
             RETURNING *`,
            [
              channel_name || null,
              channel_url || null, 
              platform || null,
              subscriber_count || 0,
              user.id
            ]
          );
          creatorProfile = updatedCreatorResult.rows[0];
        } else {
          // Create new creator profile
          const newCreatorResult = await query(
            `INSERT INTO creator_profiles (user_id, channel_name, channel_url, platform, subscriber_count)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
              user.id,
              channel_name || null,
              channel_url || null,
              platform || null,
              subscriber_count || 0
            ]
          );
          creatorProfile = newCreatorResult.rows[0];
        }
      }

      await query('COMMIT');

      return NextResponse.json({
        message: 'Profile updated successfully',
        user: updatedUser.rows[0],
        creatorProfile
      });
    } catch (updateError) {
      await query('ROLLBACK');
      throw updateError;
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
