import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query, transaction } from '@/lib/db';

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
      return NextResponse.json({ error: 'Only creators can publish auctions' }, { status: 403 });
    }

    const body = await request.json();
    const { videoSessionId, auctionConfigs } = body;

    if (!videoSessionId || !auctionConfigs || !Array.isArray(auctionConfigs)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify video session is verified
    const sessionResult = await query(
      `SELECT vs.*, avs.verification_code, avs.verified 
       FROM video_sessions vs
       LEFT JOIN auth_verification_sessions avs ON vs.id = avs.video_session_id
       WHERE vs.id = $1 AND vs.creator_id = $2`,
      [videoSessionId, user.id]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Video session not found' }, { status: 404 });
    }

    const session = sessionResult.rows[0];
    if (!session.verified) {
      return NextResponse.json({ error: 'Video session not verified' }, { status: 400 });
    }

    // Create auctions in a transaction
    const publishedAuctions = await transaction(async (client) => {
      const auctions = [];

      for (const config of auctionConfigs) {
        // Get detected item details
        const itemResult = await client.query(
          `SELECT di.*, vs.screenshot_id, vs.timestamp_seconds 
           FROM detected_items di
           LEFT JOIN video_screenshots vs ON di.screenshot_id = vs.id
           WHERE di.id = $1 AND di.video_session_id = $2`,
          [config.itemId, videoSessionId]
        );

        if (itemResult.rows.length === 0) continue;

        const item = itemResult.rows[0];

        // Create auction
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + (parseInt(config.duration_days) * 24 * 60 * 60 * 1000));

        const auctionResult = await client.query(
          `INSERT INTO auction_items (
            creator_id, category_id, title, description, video_url, video_timestamp,
            starting_price, current_price, buy_now_price, reserve_price, condition,
            status, start_time, end_time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10, 'active', $11, $12)
           RETURNING *`,
          [
            user.id,
            item.suggested_category_id,
            item.item_name,
            item.item_description,
            session.video_url,
            item.timestamp_seconds,
            parseFloat(config.starting_price),
            config.buy_now_price ? parseFloat(config.buy_now_price) : null,
            config.reserve_price ? parseFloat(config.reserve_price) : null,
            item.condition || 'good',
            startTime,
            endTime
          ]
        );

        const auction = auctionResult.rows[0];

        // Generate authentication certificate
        const certificate = {
          video_session_id: videoSessionId,
          verification_code: session.verification_code,
          item_timestamp: item.timestamp_seconds,
          auction_id: auction.id,
          authenticated_at: new Date().toISOString(),
          certificate_hash: `${videoSessionId}-${item.id}-${session.verification_code}`.substring(0, 32)
        };

        // Link item to auction with certificate
        await client.query(
          `INSERT INTO item_auction_links (detected_item_id, auction_item_id, verification_session_id, certificate_data)
           VALUES ($1, $2, $3, $4)`,
          [item.id, auction.id, session.verification_session_id, JSON.stringify(certificate)]
        );

        // Update detected item status
        await client.query(
          'UPDATE detected_items SET status = $1 WHERE id = $2',
          ['auction_created', item.id]
        );

        auctions.push({
          ...auction,
          certificate,
          item_name: item.item_name
        });
      }

      // Update video session status
      await client.query(
        'UPDATE video_sessions SET status = $1 WHERE id = $2',
        ['published', videoSessionId]
      );

      return auctions;
    });

    return NextResponse.json({
      success: true,
      publishedAuctions,
      message: `Successfully published ${publishedAuctions.length} auctions`
    });

  } catch (error) {
    console.error('Auction publishing error:', error);
    return NextResponse.json(
      { error: 'Failed to publish auctions' },
      { status: 500 }
    );
  }
}
