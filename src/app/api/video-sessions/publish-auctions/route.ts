import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query, transaction } from '@/lib/db';

interface DetectedItem {
  id: string;
  item_name: string;
  item_description: string;
  suggested_category: string;
  condition: string;
}

interface AuctionConfig {
  itemId: string;
  starting_price: string;
  reserve_price?: string;
  buy_now_price?: string;
  duration_days: string;
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
      return NextResponse.json({ error: 'Only creators can publish auctions' }, { status: 403 });
    }

    const body = await request.json();
    const { videoSessionId, items, auctionConfigs }: {
      videoSessionId: string;
      items: DetectedItem[];
      auctionConfigs: AuctionConfig[];
    } = body;

    if (!videoSessionId || !items || !auctionConfigs || !Array.isArray(auctionConfigs)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get video session (no verification check needed)
    const sessionResult = await query(
      `SELECT * FROM video_sessions WHERE id = $1 AND creator_id = $2`,
      [videoSessionId, user.id]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Video session not found' }, { status: 404 });
    }

    const session = sessionResult.rows[0];

    // Create auctions in a transaction
    const publishedAuctions = await transaction(async (client) => {
      const auctions = [];

      for (const config of auctionConfigs) {
        // Find the corresponding item
        const item = items.find((item: DetectedItem) => item.id === config.itemId);
        if (!item) continue;

        // Get screenshots for this video session to use as auction images
        const screenshotsResult = await client.query(
          `SELECT image_url FROM video_screenshots 
           WHERE video_session_id = $1 
           ORDER BY timestamp_seconds`,
          [videoSessionId]
        );

        const screenshots = screenshotsResult.rows;

        // Get timestamp from first screenshot if available
        const timestampResult = await client.query(
          `SELECT timestamp_seconds FROM video_screenshots 
           WHERE video_session_id = $1 
           ORDER BY timestamp_seconds 
           LIMIT 1`,
          [videoSessionId]
        );

        const timestamp = timestampResult.rows[0]?.timestamp_seconds || 0;

        // Create auction
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + (parseInt(config.duration_days) * 24 * 60 * 60 * 1000));

        const auctionResult = await client.query(
          `INSERT INTO auction_items (
            creator_id, title, description, video_url, video_timestamp,
            starting_price, current_price, buy_now_price, reserve_price, condition,
            status, start_time, end_time, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, 'active', $10, $11, NOW(), NOW())
           RETURNING *`,
          [
            user.id,
            item.item_name,
            item.item_description,
            session.video_url,
            timestamp,
            parseFloat(config.starting_price),
            config.buy_now_price ? parseFloat(config.buy_now_price) : null,
            config.reserve_price ? parseFloat(config.reserve_price) : null,
            item.condition || 'good',
            startTime,
            endTime
          ]
        );

        const auction = auctionResult.rows[0];

        // Add screenshots as auction images
        for (let i = 0; i < screenshots.length; i++) {
          const screenshot = screenshots[i];
          await client.query(
            `INSERT INTO auction_item_images (
              auction_item_id, image_url, is_primary, sort_order, created_at
            ) VALUES ($1, $2, $3, $4, NOW())`,
            [
              auction.id,
              screenshot.image_url,
              i === 0, // First image is primary
              i
            ]
          );
        }

        // Create a simple certificate (no verification needed)
        const certificate = {
          video_session_id: videoSessionId,
          item_timestamp: timestamp,
          auction_id: auction.id,
          created_at: new Date().toISOString(),
          certificate_hash: `${videoSessionId}-${item.id}-${Date.now()}`.substring(0, 32)
        };

        auctions.push({
          ...auction,
          certificate,
          item_name: item.item_name,
          images: screenshots.map(s => s.image_url) // Include images in response
        });
      }

      // Update video session status
      await client.query(
        'UPDATE video_sessions SET status = $1, updated_at = NOW() WHERE id = $2',
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to publish auctions: ' + errorMessage },
      { status: 500 }
    );
  }
}
