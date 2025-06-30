-- New Video Authentication System - 6 Step Workflow
-- 1. Onboard: Creator verified with ID + selfie
-- 2. Auth Video: Creator records 1 video declaring multiple items
-- 3. Batch Listings: Items added via form, linked to video
-- 4. Buyer Purchase: Sees badge + proof, buys item
-- 5. Shipping + Cert: Creator ships, buyer gets cert after delay
-- 6. Anti-Fraud: Only verified creators can post authenticated listings

-- First, create helper functions
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    certificate_num VARCHAR(50);
    exists_check INTEGER;
BEGIN
    LOOP
        certificate_num := 'CERT-' || 
                          TO_CHAR(NOW(), 'YYYY') || '-' ||
                          UPPER(substring(md5(random()::text), 1, 8));
        
        -- Check if exists (but table might not exist yet, so handle gracefully)
        BEGIN
            SELECT COUNT(*) INTO exists_check 
            FROM authenticity_certificates 
            WHERE certificate_number = certificate_num;
        EXCEPTION
            WHEN undefined_table THEN
                exists_check := 0;
        END;
        
        EXIT WHEN exists_check = 0;
    END LOOP;
    
    RETURN certificate_num;
END;
$$ LANGUAGE plpgsql;

-- Step 1: ID Verification System
CREATE TABLE IF NOT EXISTS creator_id_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- ID Document verification
    id_document_type VARCHAR(50) NOT NULL, -- driver_license, passport, national_id
    id_document_front_path VARCHAR(500) NOT NULL,
    id_document_back_path VARCHAR(500), -- For driver's license
    
    -- Selfie verification  
    selfie_image_path VARCHAR(500) NOT NULL,
    selfie_with_id_path VARCHAR(500), -- Selfie holding ID
    
    -- Verification status
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, verified, rejected
    admin_notes TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- ID verification expiry
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Auth Videos (One video per creator declaring multiple items)
CREATE TABLE IF NOT EXISTS auth_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    id_verification_id UUID REFERENCES creator_id_verification(id) ON DELETE CASCADE,
    
    -- Video details
    video_file_path VARCHAR(500) NOT NULL,
    video_url VARCHAR(500),
    video_duration INTEGER, -- in seconds
    declaration_text TEXT, -- What the creator said in the video
    
    -- Items declared in this video
    declared_items_count INTEGER DEFAULT 0,
    max_items_allowed INTEGER DEFAULT 10, -- Limit items per video
    
    -- Verification status
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, verified, rejected
    admin_notes TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '6 months'), -- Videos expire
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Authenticated Listings (Batch listings linked to auth video)
CREATE TABLE IF NOT EXISTS authenticated_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    auth_video_id UUID REFERENCES auth_videos(id) ON DELETE CASCADE,
    
    -- Link to regular auction item
    auction_item_id UUID REFERENCES auction_items(id) ON DELETE CASCADE,
    
    -- Authentication details
    item_position_in_video INTEGER, -- Which item # in the video declaration
    video_timestamp_start INTEGER, -- When item appears in video (seconds)
    video_timestamp_end INTEGER, -- When item ends in video (seconds)
    
    -- Verification status
    status VARCHAR(20) DEFAULT 'pending', -- pending, verified, published, sold
    
    -- New column
    published_content_url VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Authenticity Certificates (Generated after purchase)
CREATE TABLE IF NOT EXISTS authenticity_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES authenticated_listings(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    
    -- Certificate details
    certificate_number VARCHAR(50) UNIQUE NOT NULL DEFAULT generate_certificate_number(),
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Certificate data
    creator_info JSONB, -- Creator verification info snapshot
    item_info JSONB, -- Item details snapshot
    video_proof JSONB, -- Video authentication proof
    blockchain_hash VARCHAR(255), -- Optional blockchain verification
    
    -- Certificate status
    status VARCHAR(20) DEFAULT 'pending', -- pending, issued, revoked
    issued_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authentication Badge System
CREATE TABLE IF NOT EXISTS listing_authentication_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES authenticated_listings(id) ON DELETE CASCADE,
    
    -- Badge types
    id_verified BOOLEAN DEFAULT false,
    video_authenticated BOOLEAN DEFAULT false,
    face_matched BOOLEAN DEFAULT false,
    
    -- Badge metadata
    verification_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    badge_score DECIMAL(3,2) DEFAULT 1.00,
    
    -- Display settings
    show_video_proof BOOLEAN DEFAULT true,
    show_id_verification BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_id_verification_creator ON creator_id_verification(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_id_verification_status ON creator_id_verification(status);
CREATE INDEX IF NOT EXISTS idx_auth_videos_creator ON auth_videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_auth_videos_status ON auth_videos(status);
CREATE INDEX IF NOT EXISTS idx_authenticated_listings_creator ON authenticated_listings(creator_id);
CREATE INDEX IF NOT EXISTS idx_authenticated_listings_auth_video ON authenticated_listings(auth_video_id);
CREATE INDEX IF NOT EXISTS idx_authenticity_certificates_listing ON authenticity_certificates(listing_id);

-- Update triggers
CREATE TRIGGER update_creator_id_verification_updated_at BEFORE UPDATE ON creator_id_verification FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auth_videos_updated_at BEFORE UPDATE ON auth_videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_authenticated_listings_updated_at BEFORE UPDATE ON authenticated_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_authenticity_certificates_updated_at BEFORE UPDATE ON authenticity_certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to check if creator can create authenticated listings
CREATE OR REPLACE FUNCTION can_create_authenticated_listing(creator_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    id_verified BOOLEAN := false;
    has_valid_auth_video BOOLEAN := false;
BEGIN
    -- Check ID verification
    SELECT EXISTS(
        SELECT 1 FROM creator_id_verification 
        WHERE creator_id = creator_user_id 
        AND status = 'verified'
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO id_verified;
    
    -- Check valid auth video
    SELECT EXISTS(
        SELECT 1 FROM auth_videos av
        JOIN creator_id_verification civ ON av.id_verification_id = civ.id
        WHERE av.creator_id = creator_user_id 
        AND av.status = 'verified'
        AND av.expires_at > NOW()
        AND civ.status = 'verified'
    ) INTO has_valid_auth_video;
    
    RETURN id_verified AND has_valid_auth_video;
END;
$$ LANGUAGE plpgsql; 
