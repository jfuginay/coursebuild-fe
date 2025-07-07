const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Helper functions for ListPro

async function createListing(userId, listingData) {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      user_id: userId,
      ...listingData,
      ai_generated: {
        generated_at: new Date().toISOString(),
        model: 'gpt-4-vision'
      }
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function syncToMarketplace(listingId, marketplace, credentials) {
  // Create marketplace listing record
  const { data: marketplaceListing, error } = await supabase
    .from('marketplace_listings')
    .insert({
      listing_id: listingId,
      marketplace: marketplace,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  // Call edge function to sync
  const { data: syncResult } = await supabase.functions.invoke('sync-listing', {
    body: { 
      listing_id: listingId, 
      marketplace: marketplace,
      credentials: credentials 
    }
  });

  return { marketplaceListing, syncResult };
}

async function uploadImage(file, userId) {
  const fileName = `${userId}/${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('listing-images')
    .upload(fileName, file);

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('listing-images')
    .getPublicUrl(fileName);

  return publicUrl;
}

async function processImageWithAI(imageUrl) {
  const { data, error } = await supabase.functions.invoke('process-image', {
    body: { image_url: imageUrl }
  });

  if (error) throw error;
  return data;
}

// Realtime subscriptions
function subscribeToListingUpdates(userId, callback) {
  return supabase
    .channel(`user-${userId}-listings`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'listings',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
}

module.exports = {
  supabase,
  createListing,
  syncToMarketplace,
  uploadImage,
  processImageWithAI,
  subscribeToListingUpdates
};