// Deep Link Builder Service for ListPro/Katalyst AI
// Generates pre-filled URLs for marketplace posting

class DeepLinkBuilder {
  constructor() {
    this.platforms = {
      facebook: this.buildFacebookURL,
      craigslist: this.buildCraigslistURL,
      offerup: this.buildOfferUpURL,
      nextdoor: this.buildNextdoorURL,
      mercari: this.buildMercariURL
    };

    // Category mappings for each platform
    this.categoryMaps = {
      facebook: {
        'electronics': 'electronics',
        'clothing': 'clothing_and_accessories',
        'home': 'home_and_garden',
        'vehicles': 'vehicles',
        'books': 'books_and_magazines',
        'collectibles': 'collectibles',
        'sports': 'sports_and_outdoors',
        'toys': 'toys_and_games'
      },
      craigslist: {
        'electronics': 'ele',
        'clothing': 'clo',
        'home': 'hsg',
        'vehicles': 'cta',
        'books': 'bks',
        'collectibles': 'clt',
        'sports': 'spo',
        'toys': 'tag'
      },
      offerup: {
        'electronics': 'electronics',
        'clothing': 'clothing-shoes-accessories',
        'home': 'home-garden',
        'vehicles': 'cars-trucks',
        'books': 'books-movies-music',
        'collectibles': 'antiques-collectibles',
        'sports': 'sporting-goods',
        'toys': 'toys-games'
      }
    };
  }

  // Main method - generate all deep links for a listing
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

  // Facebook Marketplace deep link
  buildFacebookURL(listing, userLocation) {
    const baseURL = 'https://www.facebook.com/marketplace/create/item/';
    const params = new URLSearchParams({
      title: listing.title,
      description: this.formatForFacebook(listing.description),
      price: listing.price,
      category: this.mapCategory('facebook', listing.category),
      condition: this.mapCondition('facebook', listing.condition)
    });
    
    if (userLocation?.city) {
      params.append('location', userLocation.city);
    }
    
    return `${baseURL}?${params.toString()}`;
  }

  // Craigslist deep link
  buildCraigslistURL(listing, userLocation) {
    const cityCode = this.getCraigslistCityCode(userLocation?.city || 'newyork');
    const baseURL = `https://${cityCode}.craigslist.org/cgi-bin/posting.cgi`;
    
    const params = new URLSearchParams({
      category: this.mapCategory('craigslist', listing.category),
      title: listing.title,
      price: listing.price
    });
    
    if (userLocation?.zipCode) {
      params.append('postal', userLocation.zipCode);
      params.append('area', this.getCraigslistArea(userLocation.zipCode));
    }
    
    return `${baseURL}?${params.toString()}`;
  }

  // OfferUp deep link
  buildOfferUpURL(listing, userLocation) {
    // Mobile app deep link
    const mobileParams = new URLSearchParams({
      title: listing.title,
      description: listing.description.substring(0, 500), // OfferUp limit
      price: listing.price,
      category: this.mapCategory('offerup', listing.category)
    });
    
    const mobileURL = `offerup://post?${mobileParams.toString()}`;

    // Web fallback
    const webParams = new URLSearchParams({
      title: listing.title,
      price: listing.price
    });
    
    const webURL = `https://offerup.com/post/?${webParams.toString()}`;

    return {
      mobile: mobileURL,
      web: webURL,
      preferred: 'mobile'
    };
  }

  // Nextdoor deep link (limited support)
  buildNextdoorURL(listing, userLocation) {
    const baseURL = 'https://nextdoor.com/for_sale_and_free/';
    const params = new URLSearchParams({
      title: listing.title,
      price: listing.price
    });
    
    return `${baseURL}?${params.toString()}`;
  }

  // Mercari web deep link
  buildMercariURL(listing, userLocation) {
    const baseURL = 'https://www.mercari.com/sell/';
    const params = new URLSearchParams({
      title: listing.title,
      price: listing.price
    });
    
    return `${baseURL}?${params.toString()}`;
  }

  // Platform-specific formatting
  formatForFacebook(description) {
    return description
      .replace(/\n\n/g, '\n') // Reduce double line breaks
      .substring(0, 5000) // Facebook limit
      .trim();
  }

  formatForCraigslist(description) {
    return description
      .replace(/[^\w\s\n.,!?-]/g, '') // Remove special chars
      .substring(0, 8000) // Craigslist limit
      .trim();
  }

  // Category mapping helper
  mapCategory(platform, category) {
    const map = this.categoryMaps[platform];
    return map?.[category] || 'other';
  }

  // Condition mapping
  mapCondition(platform, condition) {
    const conditionMaps = {
      facebook: {
        'new': 'new',
        'like_new': 'excellent',
        'good': 'good',
        'fair': 'fair',
        'poor': 'poor'
      }
    };
    
    const map = conditionMaps[platform];
    return map?.[condition] || 'good';
  }

  // Craigslist city code mapping
  getCraigslistCityCode(city) {
    const cityMap = {
      'new york': 'newyork',
      'los angeles': 'losangeles',
      'chicago': 'chicago',
      'houston': 'houston',
      'phoenix': 'phoenix',
      'philadelphia': 'philadelphia',
      'san antonio': 'sanantonio',
      'san diego': 'sandiego',
      'dallas': 'dallas',
      'san jose': 'sfbay',
      'austin': 'austin',
      'jacksonville': 'jacksonville',
      'san francisco': 'sfbay',
      'columbus': 'columbus',
      'charlotte': 'charlotte',
      'fort worth': 'dallas',
      'indianapolis': 'indianapolis',
      'seattle': 'seattle',
      'denver': 'denver',
      'boston': 'boston'
    };
    
    const normalizedCity = city?.toLowerCase().trim();
    return cityMap[normalizedCity] || 'newyork';
  }

  // Craigslist area code helper
  getCraigslistArea(zipCode) {
    // Simple mapping - in production, use proper ZIP to area mapping
    const firstDigit = zipCode?.charAt(0);
    const areaMap = {
      '0': '1', '1': '2', '2': '3', '3': '4', '4': '5',
      '5': '6', '6': '7', '7': '8', '8': '9', '9': '10'
    };
    return areaMap[firstDigit] || '1';
  }

  // Generate copy-paste templates for platforms without deep links
  generateTemplate(listing, platform) {
    const templates = {
      poshmark: this.generatePoshmarkTemplate(listing),
      vinted: this.generateVintedTemplate(listing),
      tradesy: this.generateTradesyTemplate(listing),
      vestiaire: this.generateVestiaireTemplate(listing)
    };
    
    return templates[platform] || this.generateGenericTemplate(listing);
  }

  generatePoshmarkTemplate(listing) {
    const hashtags = this.generatePoshmarkHashtags(listing);
    
    return {
      title: listing.title,
      description: `${listing.description}\n\n${hashtags}`,
      price: Math.round(listing.price * 1.1), // Account for Poshmark fees
      size: listing.size || 'See description',
      brand: listing.brand || 'Other',
      category: this.mapToPoshmarkCategory(listing.category),
      text: `Title: ${listing.title}\n\nDescription:\n${listing.description}\n\n${hashtags}\n\nPrice: $${Math.round(listing.price * 1.1)}`
    };
  }

  generatePoshmarkHashtags(listing) {
    const tags = [];
    
    // Add brand tag
    if (listing.brand) {
      tags.push(`#${listing.brand.toLowerCase().replace(/\s+/g, '')}`);
    }
    
    // Add category tags
    if (listing.category) {
      tags.push(`#${listing.category}`);
    }
    
    // Add condition tag
    if (listing.condition) {
      tags.push(`#${listing.condition.replace('_', '')}`);
    }
    
    // Add generic tags
    tags.push('#poshmark', '#style', '#fashion');
    
    return tags.slice(0, 10).join(' '); // Poshmark limit
  }

  generateGenericTemplate(listing) {
    return {
      title: listing.title,
      description: listing.description,
      price: listing.price,
      text: `${listing.title}\n\n${listing.description}\n\nPrice: $${listing.price}`
    };
  }

  // Utility method to check if deep link is available
  isDeepLinkAvailable(platform) {
    return Object.keys(this.platforms).includes(platform);
  }

  // Get user-friendly platform names
  getPlatformDisplayName(platform) {
    const displayNames = {
      facebook: 'Facebook Marketplace',
      craigslist: 'Craigslist',
      offerup: 'OfferUp',
      nextdoor: 'Nextdoor',
      mercari: 'Mercari',
      poshmark: 'Poshmark',
      vinted: 'Vinted',
      tradesy: 'Tradesy'
    };
    
    return displayNames[platform] || platform;
  }
}

module.exports = DeepLinkBuilder;