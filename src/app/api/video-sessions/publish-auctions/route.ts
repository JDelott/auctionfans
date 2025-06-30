import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { query, transaction } from '@/lib/db';

interface DetectedItem {
  id: string;
  item_name: string;
  item_description: string;
  suggested_category: string;
  condition: string;
  confidence_score?: number;
  screenshot_timestamp?: number;
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

    // Get video session
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

        // Get the specific detected item from database to find its screenshot
        const detectedItemResult = await client.query(
          `SELECT di.*, vs.image_url, vs.timestamp_seconds 
           FROM detected_items di
           JOIN video_screenshots vs ON di.screenshot_id = vs.id
           WHERE di.id = $1 AND di.video_session_id = $2`,
          [item.id, videoSessionId]
        );

        if (detectedItemResult.rows.length === 0) {
          console.warn(`No detected item found for ID: ${item.id}`);
          continue;
        }

        const detectedItemData = detectedItemResult.rows[0];

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
            detectedItemData.timestamp_seconds,
            parseFloat(config.starting_price),
            config.buy_now_price ? parseFloat(config.buy_now_price) : null,
            config.reserve_price ? parseFloat(config.reserve_price) : null,
            item.condition || 'good',
            startTime,
            endTime
          ]
        );

        const auction = auctionResult.rows[0];

        // Add the specific screenshot as the auction image
        await client.query(
          `INSERT INTO auction_item_images (
            auction_item_id, image_url, is_primary, sort_order, created_at
          ) VALUES ($1, $2, true, 0, NOW())`,
          [
            auction.id,
            detectedItemData.image_url
          ]
        );

        // Create item-auction link
        await client.query(
          `INSERT INTO item_auction_links (
            detected_item_id, auction_item_id, created_at
          ) VALUES ($1, $2, NOW())`,
          [detectedItemData.id, auction.id]
        );

        // Update detected item status
        await client.query(
          'UPDATE detected_items SET status = $1, updated_at = NOW() WHERE id = $2',
          ['auction_created', detectedItemData.id]
        );

        auctions.push({
          ...auction,
          item_name: item.item_name,
          image_url: detectedItemData.image_url,
          timestamp: detectedItemData.timestamp_seconds
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
