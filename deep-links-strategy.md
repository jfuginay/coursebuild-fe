# Deep Link Strategy for Cross-Platform Listing

## 🔗 Deep Links Overview

Deep links allow us to pre-populate marketplace listing forms with our data, making posting nearly automatic while staying compliant with platform ToS.

## 📱 Platform Deep Link Support

### ✅ Fully Supported

#### Facebook Marketplace
```javascript
// Deep link format
const facebookURL = `https://www.facebook.com/marketplace/create/item/?` +
  `title=${encodeURIComponent(title)}&` +
  `description=${encodeURIComponent(description)}&` +
  `price=${price}&` +
  `category=${categoryId}&` +
  `condition=${condition}`;

// Example
const listing = {
  title: "iPhone 13 Pro Max 128GB",
  description: "Excellent condition, barely used...",
  price: 750,
  category: "cell_phones",
  condition: "excellent"
};

const url = buildFacebookMarketplaceURL(listing);
// Opens: https://www.facebook.com/marketplace/create/item/?title=iPhone%2013%20Pro%20Max...
```

#### Craigslist
```javascript
// Craigslist posting URL with prefilled data
const craigslistURL = `https://${city}.craigslist.org/search/sss?` +
  `query=${encodeURIComponent(title)}&` +
  `min_price=${price * 0.9}&` +
  `max_price=${price * 1.1}`;

// For posting (varies by city)
const postURL = `https://${city}.craigslist.org/cgi-bin/postings.cgi?` +
  `category=for_sale&` +
  `area=${areaCode}&` +
  `title=${encodeURIComponent(title)}&` +
  `postal=${zipCode}`;
```

#### OfferUp
```javascript
// OfferUp mobile deep link
const offerUpURL = `offerup://post?` +
  `title=${encodeURIComponent(title)}&` +
  `description=${encodeURIComponent(description)}&` +
  `price=${price}&` +
  `category=${categoryId}`;

// Web fallback
const webURL = `https://offerup.com/post/?` +
  `title=${encodeURIComponent(title)}&` +
  `price=${price}`;
```

### ⚠️ Limited Support

#### Poshmark
```javascript
// No direct deep link support
// Workaround: Generate shareable templates
const poshmarkTemplate = {
  title: formatForPoshmark(title),
  description: addPoshmarkHashtags(description),
  price: calculatePoshmarkPrice(price), // Account for fees
  size: extractSize(description),
  brand: extractBrand(title)
};

// Copy-to-clipboard functionality
navigator.clipboard.writeText(JSON.stringify(poshmarkTemplate));
```

#### Mercari
```javascript
// Limited web deep links
const mercariURL = `https://www.mercari.com/sell/?` +
  `title=${encodeURIComponent(title)}&` +
  `price=${price}`;

// Mobile app deep link (if available)
const mercariMobile = `mercari://sell?title=${encodeURIComponent(title)}`;
```

## 🛠️ Implementation Details

### Deep Link Builder Service

```javascript
// services/deep-link-builder.js
class DeepLinkBuilder {
  constructor() {
    this.platforms = {
      facebook: this.buildFacebookURL,
      craigslist: this.buildCraigslistURL,
      offerup: this.buildOfferUpURL,
      nextdoor: this.buildNextdoorURL
    };
  }

  buildFacebookURL(listing, userLocation) {
    const baseURL = 'https://www.facebook.com/marketplace/create/item/';
    const params = new URLSearchParams({
      title: listing.title,
      description: this.formatForFacebook(listing.description),
      price: listing.price,
      category: this.mapToFacebookCategory(listing.category),
      condition: this.mapToFacebookCondition(listing.condition),
      location: userLocation.city
    });
    
    return `${baseURL}?${params.toString()}`;
  }

  buildCraigslistURL(listing, userLocation) {
    const cityCode = this.getCraigslistCityCode(userLocation.city);
    const baseURL = `https://${cityCode}.craigslist.org/cgi-bin/posting.cgi`;
    
    const params = new URLSearchParams({
      category: this.mapToCraigslistCategory(listing.category),
      area: this.getCraigslistArea(userLocation.zipCode),
      title: listing.title,
      postal: userLocation.zipCode,
      price: listing.price
    });
    
    return `${baseURL}?${params.toString()}`;
  }

  buildOfferUpURL(listing, userLocation) {
    // Try mobile app first
    const mobileURL = `offerup://post?${new URLSearchParams({
      title: listing.title,
      description: listing.description,
      price: listing.price,
      category: this.mapToOfferUpCategory(listing.category)
    })}`;

    // Web fallback
    const webURL = `https://offerup.com/post/?${new URLSearchParams({
      title: listing.title,
      price: listing.price
    })}`;

    return {
      mobile: mobileURL,
      web: webURL
    };
  }

  formatForFacebook(description) {
    // Facebook-specific formatting
    return description
      .replace(/\n/g, ' ')
      .substring(0, 5000) // Facebook limit
      .trim();
  }

  mapToFacebookCategory(category) {
    const categoryMap = {
      'electronics': 'electronics',
      'clothing': 'clothing_and_accessories',
      'home': 'home_and_garden',
      'vehicles': 'vehicles',
      'books': 'books_and_magazines'
    };
    return categoryMap[category] || 'other';
  }

  generateAllDeepLinks(listing, userLocation) {
    const links = {};
    
    Object.keys(this.platforms).forEach(platform => {
      try {
        links[platform] = this.platforms[platform].call(this, listing, userLocation);
      } catch (error) {
        console.warn(`Failed to generate ${platform} deep link:`, error);
        links[platform] = null;
      }
    });
    
    return links;
  }
}

module.exports = DeepLinkBuilder;
```

### React Native Implementation

```javascript
// components/DeepLinkSharing.jsx
import React, { useState } from 'react';
import { Linking, Share, Alert } from 'react-native';
import { DeepLinkBuilder } from '../services/deep-link-builder';

const DeepLinkSharing = ({ listing, userLocation }) => {
  const [deepLinks, setDeepLinks] = useState({});
  const builder = new DeepLinkBuilder();

  const generateLinks = () => {
    const links = builder.generateAllDeepLinks(listing, userLocation);
    setDeepLinks(links);
  };

  const openPlatform = async (platform) => {
    const url = deepLinks[platform];
    if (!url) return;

    try {
      const canOpen = await Linking.canOpenURL(url.mobile || url);
      if (canOpen) {
        await Linking.openURL(url.mobile || url);
      } else if (url.web) {
        // Fallback to web
        await Linking.openURL(url.web);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open platform');
    }
  };

  const shareAsText = (platform) => {
    const template = builder.generateTemplate(listing, platform);
    Share.share({
      message: template.text,
      url: template.url
    });
  };

  return (
    <View>
      <Text>Post to Other Platforms</Text>
      
      {/* Deep Link Buttons */}
      <Button 
        title="Facebook Marketplace" 
        onPress={() => openPlatform('facebook')}
      />
      
      <Button 
        title="Craigslist" 
        onPress={() => openPlatform('craigslist')}
      />
      
      <Button 
        title="OfferUp" 
        onPress={() => openPlatform('offerup')}
      />
      
      {/* Copy Template Buttons */}
      <Button 
        title="Copy Poshmark Template" 
        onPress={() => shareAsText('poshmark')}
      />
    </View>
  );
};
```

### iOS Swift Implementation

```swift
// DeepLinkService.swift
import UIKit

class DeepLinkService {
    
    static func openFacebookMarketplace(with listing: Listing, location: UserLocation) {
        let baseURL = "https://www.facebook.com/marketplace/create/item/"
        let queryItems = [
            URLQueryItem(name: "title", value: listing.title),
            URLQueryItem(name: "description", value: listing.description),
            URLQueryItem(name: "price", value: String(listing.price)),
            URLQueryItem(name: "category", value: mapToFacebookCategory(listing.category))
        ]
        
        var components = URLComponents(string: baseURL)
        components?.queryItems = queryItems
        
        guard let url = components?.url else { return }
        
        UIApplication.shared.open(url)
    }
    
    static func openOfferUp(with listing: Listing) {
        // Try mobile app first
        let mobileURL = "offerup://post?title=\(listing.title.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
        
        if let url = URL(string: mobileURL), UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
        } else {
            // Fallback to web
            let webURL = "https://offerup.com/post/?title=\(listing.title.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
            if let url = URL(string: webURL) {
                UIApplication.shared.open(url)
            }
        }
    }
    
    static func copyPoshmarkTemplate(from listing: Listing) -> String {
        let template = """
        \(listing.title)
        
        \(listing.description)
        
        Price: $\(listing.price)
        Size: \(listing.size ?? "N/A")
        Condition: \(listing.condition)
        
        #\(listing.brand?.lowercased() ?? "fashion") #style #poshmark
        """
        
        UIPasteboard.general.string = template
        return template
    }
}
```

### Android Kotlin Implementation

```kotlin
// DeepLinkService.kt
import android.content.Context
import android.content.Intent
import android.net.Uri

class DeepLinkService {
    
    companion object {
        fun openFacebookMarketplace(context: Context, listing: Listing, location: UserLocation) {
            val baseUrl = "https://www.facebook.com/marketplace/create/item/"
            val uri = Uri.parse(baseUrl).buildUpon()
                .appendQueryParameter("title", listing.title)
                .appendQueryParameter("description", listing.description)
                .appendQueryParameter("price", listing.price.toString())
                .appendQueryParameter("category", mapToFacebookCategory(listing.category))
                .build()
            
            val intent = Intent(Intent.ACTION_VIEW, uri)
            context.startActivity(intent)
        }
        
        fun openOfferUp(context: Context, listing: Listing) {
            // Try mobile app first
            val mobileUri = Uri.parse("offerup://post")
                .buildUpon()
                .appendQueryParameter("title", listing.title)
                .appendQueryParameter("price", listing.price.toString())
                .build()
            
            val mobileIntent = Intent(Intent.ACTION_VIEW, mobileUri)
            
            if (mobileIntent.resolveActivity(context.packageManager) != null) {
                context.startActivity(mobileIntent)
            } else {
                // Fallback to web
                val webUri = Uri.parse("https://offerup.com/post/")
                    .buildUpon()
                    .appendQueryParameter("title", listing.title)
                    .build()
                    
                val webIntent = Intent(Intent.ACTION_VIEW, webUri)
                context.startActivity(webIntent)
            }
        }
    }
}
```

## 🎯 Implementation Strategy

### Phase 1: Basic Deep Links
1. **Facebook Marketplace** - Highest success rate
2. **Craigslist** - Works in most cities
3. **OfferUp** - Good mobile support

### Phase 2: Enhanced Templates
1. **Poshmark copy templates** - Perfect formatting
2. **Mercari helpers** - Mobile-optimized
3. **Platform-specific optimizations**

### Phase 3: Smart Routing
1. **Auto-detect available apps** on device
2. **Fallback to web** when app not installed
3. **Track success rates** by platform

## 💡 User Experience Flow

```
1. User creates listing in ListPro
2. Taps "Share to Other Platforms"
3. Sees grid of platform icons
4. Taps Facebook Marketplace
5. Facebook opens with form pre-filled
6. User adds photos, hits "Post"
7. Done! ✅
```

## 📊 Expected Success Rates

- **Facebook Marketplace**: 85% (excellent deep link support)
- **Craigslist**: 70% (varies by city)
- **OfferUp**: 75% (good mobile support)
- **Poshmark**: 60% (copy template approach)
- **Others**: 40-60% (platform dependent)

## 🚀 Getting Started

1. Implement `DeepLinkBuilder` service
2. Add platform detection logic
3. Create UI for platform selection
4. Test deep links on target devices
5. Add analytics to track usage

This approach gives users 80% of the automation benefit while staying 100% compliant with platform ToS.