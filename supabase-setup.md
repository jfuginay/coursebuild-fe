# Supabase Setup for ListPro/Katalyst AI

## 🚀 Quick Start (5 minutes)

### 1. Create Supabase Project
```bash
# Visit https://app.supabase.com
# Create new project "listpro-prod"
# Save your credentials:
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### 2. Database Schema
```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  seller_rating DECIMAL(3,2) DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings table
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  images TEXT[], -- Array of image URLs
  category TEXT,
  condition TEXT,
  status TEXT DEFAULT 'draft', -- draft, active, sold, deleted
  ai_generated JSONB, -- Store AI suggestions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace integrations
CREATE TABLE marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings NOT NULL,
  marketplace TEXT NOT NULL, -- ebay, etsy, facebook, etc
  external_id TEXT, -- ID from the marketplace
  url TEXT, -- Link to the listing
  status TEXT, -- active, pending, error, sold
  sync_data JSONB, -- Marketplace-specific data
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User marketplace credentials
CREATE TABLE marketplace_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  marketplace TEXT NOT NULL,
  credentials JSONB, -- Encrypted OAuth tokens
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, marketplace)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can CRUD own listings" ON listings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view active listings" ON listings
  FOR SELECT USING (status = 'active');
```

### 3. Storage Buckets
```sql
-- Create storage buckets via Supabase Dashboard
-- 1. listing-images (public)
-- 2. user-avatars (public)
-- 3. temp-uploads (private)
```

### 4. Edge Functions for AI Processing
```typescript
// supabase/functions/process-image/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { image_url } = await req.json()
  
  // Call Vision API
  const items = await detectItems(image_url)
  
  // Generate descriptions with GPT-4
  const descriptions = await generateDescriptions(items)
  
  // Suggest pricing
  const pricing = await suggestPricing(items)
  
  return new Response(JSON.stringify({
    items,
    descriptions,
    pricing
  }))
})
```

### 5. Realtime Subscriptions
```javascript
// Listen for listing updates
const subscription = supabase
  .channel('listing-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'marketplace_listings'
  }, (payload) => {
    console.log('Marketplace sync update:', payload)
  })
  .subscribe()
```

## 🔥 MVP Implementation Plan

### Phase 1: Core Tables (1 hour)
- Run schema SQL
- Set up RLS policies
- Create storage buckets

### Phase 2: Authentication (30 mins)
- Enable email/password auth
- Add OAuth providers (Google, Apple)
- Set up magic links

### Phase 3: API Endpoints (2 hours)
```javascript
// Using Supabase client
const supabase = createClient(url, key)

// Create listing
const { data, error } = await supabase
  .from('listings')
  .insert({
    title: 'Vintage Camera',
    price: 150.00,
    images: ['url1', 'url2']
  })

// Sync to marketplaces
const { data } = await supabase.functions.invoke('sync-to-marketplace', {
  body: { listing_id, marketplace: 'ebay' }
})
```

### Phase 4: Image Processing (1 hour)
- Set up image upload to storage
- Create edge function for AI processing
- Store results in listing record

## 🎯 Advantages of Supabase

1. **Built-in Auth**: No need to build authentication
2. **Realtime**: Instant updates across devices
3. **Storage**: S3-compatible file storage included
4. **Edge Functions**: Run AI processing at edge
5. **PostgreSQL**: Full SQL capabilities
6. **Open Source**: Can self-host later

## 🔗 Quick Integration

```bash
npm install @supabase/supabase-js

# iOS
pod 'Supabase'

# Android
implementation 'io.github.jan-tennert.supabase:supabase-android:1.0.0'
```

## 📱 Mobile SDK Usage

```swift
// Swift
let listing = Listing(
  title: "Vintage Camera",
  price: 150.00
)
try await supabase.from("listings").insert(listing).execute()
```

```kotlin
// Kotlin
val listing = Listing(
  title = "Vintage Camera",
  price = 150.00
)
supabase.from("listings").insert(listing)
```

This gives us everything Firebase would, plus:
- Better pricing at scale
- SQL flexibility
- Built-in vector search for AI
- No vendor lock-in