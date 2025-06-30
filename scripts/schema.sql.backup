-- Users table for authentication and profiles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    profile_image_url VARCHAR(500),
    is_creator BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creator profiles for additional creator-specific info
CREATE TABLE IF NOT EXISTS creator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    channel_name VARCHAR(100),
    channel_url VARCHAR(500),
    platform VARCHAR(50), -- youtube, twitch, tiktok, etc.
    subscriber_count INTEGER DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories for auction items
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auction items
CREATE TABLE IF NOT EXISTS auction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    video_url VARCHAR(500), -- URL to the video where the item was featured
    video_timestamp INTEGER, -- timestamp in seconds where item appears
    starting_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    buy_now_price DECIMAL(10,2),
    reserve_price DECIMAL(10,2),
    condition VARCHAR(20) NOT NULL, -- new, like_new, good, fair, poor
    status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, active, ended, sold, cancelled
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    winner_id UUID REFERENCES users(id),
    winner_response VARCHAR(20), -- pending, accepted, declined, payment_expired
    winner_response_at TIMESTAMP WITH TIME ZONE,
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, expired, failed, refunded
    payment_completed_at TIMESTAMP WITH TIME ZONE,
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auction item images
CREATE TABLE IF NOT EXISTS auction_item_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_item_id UUID REFERENCES auction_items(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bids on auction items
CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_item_id UUID REFERENCES auction_items(id) ON DELETE CASCADE,
    bidder_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    is_auto_bid BOOLEAN DEFAULT false,
    max_auto_bid DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT bids_amount_positive CHECK (amount > 0),
    CONSTRAINT bids_max_auto_bid_valid CHECK (max_auto_bid IS NULL OR max_auto_bid >= amount)
);

-- Watch list for users to track auctions they're interested in
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    auction_item_id UUID REFERENCES auction_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, auction_item_id)
);

-- Messages between users (for questions about items)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_item_id UUID REFERENCES auction_items(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions for completed sales
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_item_id UUID REFERENCES auction_items(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    final_price DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded, failed
    shipping_status VARCHAR(20) DEFAULT 'pending', -- pending, shipped, delivered, returned
    payment_method VARCHAR(50),
    transaction_fee DECIMAL(10,2),
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    shipping_address TEXT,
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auction ending jobs (for tracking which auctions need to be processed)
CREATE TABLE IF NOT EXISTS auction_ending_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_item_id UUID REFERENCES auction_items(id) ON DELETE CASCADE,
    scheduled_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(auction_item_id)
);

-- User addresses for shipping
CREATE TABLE IF NOT EXISTS user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video sessions for the complete video-to-auctions process
CREATE TABLE IF NOT EXISTS video_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    video_file_path VARCHAR(500),
    video_url VARCHAR(500),
    video_duration INTEGER, -- in seconds
    video_metadata JSONB,
    status VARCHAR(20) DEFAULT 'uploading', -- uploading, processing, screenshots_captured, items_detected, verification_pending, verified, published
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screenshots captured from videos
CREATE TABLE IF NOT EXISTS video_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_session_id UUID REFERENCES video_sessions(id) ON DELETE CASCADE,
    timestamp_seconds INTEGER NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authentication sessions for video verification
CREATE TABLE IF NOT EXISTS auth_verification_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_session_id UUID REFERENCES video_sessions(id) ON DELETE CASCADE,
    verification_code VARCHAR(50) NOT NULL, -- e.g., "AX7M-9K2P-5RT8"
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verification_image_path VARCHAR(500),
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detected items from AI analysis
CREATE TABLE IF NOT EXISTS detected_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_session_id UUID REFERENCES video_sessions(id) ON DELETE CASCADE,
    screenshot_id UUID REFERENCES video_screenshots(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    item_description TEXT,
    suggested_category_id UUID REFERENCES categories(id),
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    bounding_box JSONB, -- {"x": 100, "y": 50, "width": 200, "height": 150}
    ai_analysis JSONB, -- Full AI response for reference
    status VARCHAR(20) DEFAULT 'detected', -- detected, approved, rejected, auction_created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link detected items to created auctions
CREATE TABLE IF NOT EXISTS item_auction_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detected_item_id UUID REFERENCES detected_items(id) ON DELETE CASCADE,
    auction_item_id UUID REFERENCES auction_items(id) ON DELETE CASCADE,
    verification_session_id UUID REFERENCES auth_verification_sessions(id),
    certificate_data JSONB, -- Authentication certificate info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_auction_items_creator ON auction_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_auction_items_status ON auction_items(status);
CREATE INDEX IF NOT EXISTS idx_auction_items_end_time ON auction_items(end_time);
CREATE INDEX IF NOT EXISTS idx_auction_items_winner ON auction_items(winner_id);
CREATE INDEX IF NOT EXISTS idx_auction_items_payment_status ON auction_items(payment_status);
CREATE INDEX IF NOT EXISTS idx_bids_auction_item ON bids(auction_item_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON bids(created_at);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_auction_ending_jobs_status ON auction_ending_jobs(status);
CREATE INDEX IF NOT EXISTS idx_auction_ending_jobs_scheduled_end_time ON auction_ending_jobs(scheduled_end_time);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_creator ON video_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_status ON video_sessions(status);
CREATE INDEX IF NOT EXISTS idx_video_screenshots_session ON video_screenshots(video_session_id);
CREATE INDEX IF NOT EXISTS idx_auth_verification_sessions_video ON auth_verification_sessions(video_session_id);
CREATE INDEX IF NOT EXISTS idx_auth_verification_sessions_expires ON auth_verification_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_detected_items_session ON detected_items(video_session_id);
CREATE INDEX IF NOT EXISTS idx_detected_items_status ON detected_items(status);

-- Functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON creator_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auction_items_updated_at BEFORE UPDATE ON auction_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_sessions_updated_at BEFORE UPDATE ON video_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_detected_items_updated_at BEFORE UPDATE ON detected_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically end auctions
CREATE OR REPLACE FUNCTION end_auction(auction_id UUID)
RETURNS VOID AS $$
DECLARE
    highest_bid_record RECORD;
    auction_record RECORD;
BEGIN
    -- Get auction details
    SELECT * INTO auction_record FROM auction_items WHERE id = auction_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Auction not found: %', auction_id;
    END IF;
    
    -- Get the highest bid
    SELECT b.*, u.email as bidder_email, u.username as bidder_username
    INTO highest_bid_record
    FROM bids b
    JOIN users u ON b.bidder_id = u.id
    WHERE b.auction_item_id = auction_id
    ORDER BY b.amount DESC, b.created_at ASC
    LIMIT 1;
    
    -- Update auction status
    IF FOUND AND highest_bid_record.amount >= COALESCE(auction_record.reserve_price, 0) THEN
        -- Auction has a winner
        UPDATE auction_items 
        SET 
            status = 'ended',
            winner_id = highest_bid_record.bidder_id,
            winner_response = 'pending',
            current_price = highest_bid_record.amount
        WHERE id = auction_id;
    ELSE
        -- No winner (no bids or reserve not met)
        UPDATE auction_items 
        SET status = 'ended'
        WHERE id = auction_id;
    END IF;
    
    -- Mark the ending job as completed
    UPDATE auction_ending_jobs 
    SET status = 'completed', processed_at = NOW()
    WHERE auction_item_id = auction_id;
    
END;
$$ LANGUAGE plpgsql;

-- Function to create ending job when auction is scheduled
CREATE OR REPLACE FUNCTION create_auction_ending_job()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create job for active auctions with end times
    IF NEW.status = 'active' AND NEW.end_time IS NOT NULL THEN
        INSERT INTO auction_ending_jobs (auction_item_id, scheduled_end_time)
        VALUES (NEW.id, NEW.end_time)
        ON CONFLICT (auction_item_id) DO UPDATE SET
            scheduled_end_time = NEW.end_time,
            status = 'pending',
            processed_at = NULL,
            error_message = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_auction_ending_job_trigger 
    AFTER INSERT OR UPDATE ON auction_items 
    FOR EACH ROW 
    EXECUTE FUNCTION create_auction_ending_job();

-- Insert some default categories
INSERT INTO categories (name, description) VALUES 
    ('Electronics', 'Phones, cameras, gaming equipment, and other electronic devices'),
    ('Fashion & Accessories', 'Clothing, shoes, jewelry, and fashion accessories'),
    ('Home & Decor', 'Furniture, decorations, and home improvement items'),
    ('Sports & Fitness', 'Sports equipment, fitness gear, and outdoor items'),
    ('Art & Collectibles', 'Artwork, collectible items, and unique pieces'),
    ('Books & Media', 'Books, DVDs, vinyl records, and other media'),
    ('Toys & Games', 'Toys, board games, and gaming accessories'),
    ('Other', 'Items that do not fit into other categories')
ON CONFLICT DO NOTHING;
