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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_sessions_creator ON video_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_status ON video_sessions(status);
CREATE INDEX IF NOT EXISTS idx_video_screenshots_session ON video_screenshots(video_session_id);
CREATE INDEX IF NOT EXISTS idx_auth_verification_sessions_video ON auth_verification_sessions(video_session_id);
CREATE INDEX IF NOT EXISTS idx_auth_verification_sessions_expires ON auth_verification_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_detected_items_session ON detected_items(video_session_id);
CREATE INDEX IF NOT EXISTS idx_detected_items_status ON detected_items(status);

-- Add update triggers
CREATE TRIGGER update_video_sessions_updated_at BEFORE UPDATE ON video_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_detected_items_updated_at BEFORE UPDATE ON detected_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
