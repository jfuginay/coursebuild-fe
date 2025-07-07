-- ListPro/Katalyst AI Database Schema for Supabase

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For AI embeddings

-- Users profile table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  seller_rating DECIMAL(3,2) DEFAULT 0.00,
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0.00,
  preferred_marketplaces TEXT[] DEFAULT '{}',
  notification_settings JSONB DEFAULT '{"email": true, "push": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ai_description TEXT, -- AI generated description
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  images TEXT[] NOT NULL,
  video_url TEXT,
  category TEXT,
  subcategory TEXT,
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  brand TEXT,
  model TEXT,
  size TEXT,
  color TEXT,
  material TEXT,
  dimensions JSONB, -- {length, width, height, weight}
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'sold', 'deleted', 'reserved')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  
  -- AI-generated metadata
  ai_metadata JSONB DEFAULT '{}'::jsonb, -- Store all AI insights
  ai_suggested_price DECIMAL(10,2),
  ai_confidence_score DECIMAL(3,2), -- 0-1 confidence in AI suggestions
  ai_detected_items JSONB, -- Items detected in images
  ai_processing_status TEXT DEFAULT 'pending',
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'D')
  ) STORED
);

-- Marketplace integrations
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings ON DELETE CASCADE NOT NULL,
  marketplace TEXT NOT NULL CHECK (marketplace IN ('ebay', 'etsy', 'facebook', 'craigslist', 'mercari', 'depop', 'poshmark', 'in_app')),
  external_id TEXT, -- ID from the marketplace
  external_url TEXT, -- Direct link to listing
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed', 'sold', 'expired', 'removed')),
  error_message TEXT,
  
  -- Sync data
  last_synced_at TIMESTAMPTZ,
  sync_data JSONB DEFAULT '{}'::jsonb, -- Marketplace-specific data
  
  -- Performance metrics
  marketplace_views INTEGER DEFAULT 0,
  marketplace_watchers INTEGER DEFAULT 0,
  marketplace_offers INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(listing_id, marketplace)
);

-- User marketplace credentials (encrypted)
CREATE TABLE IF NOT EXISTS marketplace_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  marketplace TEXT NOT NULL,
  encrypted_credentials TEXT NOT NULL, -- Encrypted with Supabase Vault
  is_active BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, marketplace)
);

-- Price history tracking
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings ON DELETE CASCADE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT
);

-- User favorites
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, listing_id)
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users,
  listing_id UUID REFERENCES listings,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_search ON listings USING GIN(search_vector);
CREATE INDEX idx_marketplace_listings_listing ON marketplace_listings(listing_id);
CREATE INDEX idx_marketplace_listings_status ON marketplace_listings(marketplace, status);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable" ON profiles
  FOR SELECT USING (true);

-- Listings
CREATE POLICY "Users can manage own listings" ON listings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Active listings are publicly viewable" ON listings
  FOR SELECT USING (status = 'active' AND visibility = 'public');

-- Marketplace listings
CREATE POLICY "Users can manage own marketplace listings" ON marketplace_listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = marketplace_listings.listing_id 
      AND listings.user_id = auth.uid()
    )
  );

-- Credentials
CREATE POLICY "Users can manage own credentials" ON marketplace_credentials
  FOR ALL USING (auth.uid() = user_id);

-- Functions and triggers

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings 
  SET view_count = view_count + 1 
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate seller rating
CREATE OR REPLACE FUNCTION update_seller_rating(seller_id UUID)
RETURNS void AS $$
DECLARE
  new_rating DECIMAL(3,2);
BEGIN
  -- Calculate based on completed sales, response time, etc.
  -- This is a placeholder - implement your rating algorithm
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE LEAST(5.0, 4.0 + (COUNT(*) * 0.1))
    END INTO new_rating
  FROM listings 
  WHERE user_id = seller_id AND status = 'sold';
  
  UPDATE profiles 
  SET seller_rating = new_rating 
  WHERE id = seller_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;