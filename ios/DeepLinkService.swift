// DeepLinkService.swift
// iOS implementation for ListPro deep link sharing

import UIKit
import Foundation

class DeepLinkService {
    
    static let shared = DeepLinkService()
    
    private init() {}
    
    // MARK: - Main Deep Link Generation
    
    func generateAllDeepLinks(for listing: Listing, userLocation: UserLocation) -> [String: Any] {
        var links: [String: Any] = [:]
        
        links["facebook"] = buildFacebookMarketplaceURL(listing: listing, location: userLocation)
        links["offerup"] = buildOfferUpURL(listing: listing)
        links["craigslist"] = buildCraigslistURL(listing: listing, location: userLocation)
        links["mercari"] = buildMercariURL(listing: listing)
        links["nextdoor"] = buildNextdoorURL(listing: listing)
        
        return links
    }
    
    // MARK: - Platform-Specific Deep Links
    
    func buildFacebookMarketplaceURL(listing: Listing, location: UserLocation) -> String {
        let baseURL = "https://www.facebook.com/marketplace/create/item/"
        
        var components = URLComponents(string: baseURL)
        components?.queryItems = [
            URLQueryItem(name: "title", value: listing.title),
            URLQueryItem(name: "description", value: formatForFacebook(listing.description)),
            URLQueryItem(name: "price", value: String(listing.price)),
            URLQueryItem(name: "category", value: mapToFacebookCategory(listing.category)),
            URLQueryItem(name: "condition", value: mapToFacebookCondition(listing.condition))
        ]
        
        if let city = location.city {
            components?.queryItems?.append(URLQueryItem(name: "location", value: city))
        }
        
        return components?.url?.absoluteString ?? baseURL
    }
    
    func buildOfferUpURL(listing: Listing) -> [String: String] {
        // Mobile app deep link
        let mobileComponents = URLComponents(string: "offerup://post")!
        var mobileItems = [
            URLQueryItem(name: "title", value: listing.title),
            URLQueryItem(name: "price", value: String(listing.price))
        ]
        
        if listing.description.count <= 500 {
            mobileItems.append(URLQueryItem(name: "description", value: listing.description))
        }
        
        mobileComponents.queryItems = mobileItems
        
        // Web fallback
        let webComponents = URLComponents(string: "https://offerup.com/post/")!
        webComponents.queryItems = [
            URLQueryItem(name: "title", value: listing.title),
            URLQueryItem(name: "price", value: String(listing.price))
        ]
        
        return [
            "mobile": mobileComponents.url?.absoluteString ?? "",
            "web": webComponents.url?.absoluteString ?? "",
            "preferred": "mobile"
        ]
    }
    
    func buildCraigslistURL(listing: Listing, location: UserLocation) -> String {
        let cityCode = getCraigslistCityCode(for: location.city)
        let baseURL = "https://\(cityCode).craigslist.org/cgi-bin/posting.cgi"
        
        var components = URLComponents(string: baseURL)
        components?.queryItems = [
            URLQueryItem(name: "category", value: mapToCraigslistCategory(listing.category)),
            URLQueryItem(name: "title", value: listing.title),
            URLQueryItem(name: "price", value: String(listing.price))
        ]
        
        if let zipCode = location.zipCode {
            components?.queryItems?.append(URLQueryItem(name: "postal", value: zipCode))
        }
        
        return components?.url?.absoluteString ?? baseURL
    }
    
    func buildMercariURL(listing: Listing) -> String {
        let baseURL = "https://www.mercari.com/sell/"
        
        var components = URLComponents(string: baseURL)
        components?.queryItems = [
            URLQueryItem(name: "title", value: listing.title),
            URLQueryItem(name: "price", value: String(listing.price))
        ]
        
        return components?.url?.absoluteString ?? baseURL
    }
    
    func buildNextdoorURL(listing: Listing) -> String {
        let baseURL = "https://nextdoor.com/for_sale_and_free/"
        
        var components = URLComponents(string: baseURL)
        components?.queryItems = [
            URLQueryItem(name: "title", value: listing.title),
            URLQueryItem(name: "price", value: String(listing.price))
        ]
        
        return components?.url?.absoluteString ?? baseURL
    }
    
    // MARK: - Deep Link Opening
    
    func openPlatform(_ platform: String, with listing: Listing, location: UserLocation, completion: @escaping (Bool) -> Void) {
        let links = generateAllDeepLinks(for: listing, userLocation: location)
        
        guard let linkData = links[platform] else {
            completion(false)
            return
        }
        
        // Handle different link formats
        if let urlString = linkData as? String {
            openURL(urlString, completion: completion)
        } else if let urlDict = linkData as? [String: String] {
            // Try mobile first, then web fallback
            if let mobileURL = urlDict["mobile"] {
                openURL(mobileURL) { success in
                    if success {
                        completion(true)
                    } else if let webURL = urlDict["web"] {
                        self.openURL(webURL, completion: completion)
                    } else {
                        completion(false)
                    }
                }
            }
        } else {
            completion(false)
        }
    }
    
    private func openURL(_ urlString: String, completion: @escaping (Bool) -> Void) {
        guard let url = URL(string: urlString) else {
            completion(false)
            return
        }
        
        if UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url) { success in
                completion(success)
            }
        } else {
            completion(false)
        }
    }
    
    // MARK: - Template Generation
    
    func generatePoshmarkTemplate(from listing: Listing) -> PoshmarkTemplate {
        let hashtags = generatePoshmarkHashtags(for: listing)
        let adjustedPrice = Int(listing.price * 1.1) // Account for Poshmark fees
        
        let template = PoshmarkTemplate(
            title: listing.title,
            description: "\(listing.description)\n\n\(hashtags)",
            price: adjustedPrice,
            size: listing.size ?? "See description",
            brand: listing.brand ?? "Other",
            condition: listing.condition
        )
        
        return template
    }
    
    func copyPoshmarkTemplate(from listing: Listing) {
        let template = generatePoshmarkTemplate(from: listing)
        let text = """
        Title: \(template.title)
        
        Description:
        \(template.description)
        
        Price: $\(template.price)
        Size: \(template.size)
        Brand: \(template.brand)
        Condition: \(template.condition)
        """
        
        UIPasteboard.general.string = text
    }
    
    // MARK: - Helper Methods
    
    private func formatForFacebook(_ description: String) -> String {
        return description
            .replacingOccurrences(of: "\n\n", with: "\n")
            .prefix(5000)
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .description
    }
    
    private func mapToFacebookCategory(_ category: String) -> String {
        let categoryMap: [String: String] = [
            "electronics": "electronics",
            "clothing": "clothing_and_accessories",
            "home": "home_and_garden",
            "vehicles": "vehicles",
            "books": "books_and_magazines",
            "collectibles": "collectibles",
            "sports": "sports_and_outdoors",
            "toys": "toys_and_games"
        ]
        
        return categoryMap[category] ?? "other"
    }
    
    private func mapToFacebookCondition(_ condition: String) -> String {
        let conditionMap: [String: String] = [
            "new": "new",
            "like_new": "excellent",
            "good": "good",
            "fair": "fair",
            "poor": "poor"
        ]
        
        return conditionMap[condition] ?? "good"
    }
    
    private func mapToCraigslistCategory(_ category: String) -> String {
        let categoryMap: [String: String] = [
            "electronics": "ele",
            "clothing": "clo",
            "home": "hsg",
            "vehicles": "cta",
            "books": "bks",
            "collectibles": "clt",
            "sports": "spo",
            "toys": "tag"
        ]
        
        return categoryMap[category] ?? "for"
    }
    
    private func getCraigslistCityCode(for city: String?) -> String {
        guard let city = city?.lowercased() else { return "newyork" }
        
        let cityMap: [String: String] = [
            "new york": "newyork",
            "los angeles": "losangeles",
            "chicago": "chicago",
            "houston": "houston",
            "phoenix": "phoenix",
            "philadelphia": "philadelphia",
            "san antonio": "sanantonio",
            "san diego": "sandiego",
            "dallas": "dallas",
            "san jose": "sfbay",
            "austin": "austin",
            "seattle": "seattle",
            "denver": "denver",
            "boston": "boston",
            "san francisco": "sfbay"
        ]
        
        return cityMap[city] ?? "newyork"
    }
    
    private func generatePoshmarkHashtags(for listing: Listing) -> String {
        var tags: [String] = []
        
        // Brand tag
        if let brand = listing.brand {
            tags.append("#\(brand.lowercased().replacingOccurrences(of: " ", with: ""))")
        }
        
        // Category tag
        tags.append("#\(listing.category)")
        
        // Condition tag
        tags.append("#\(listing.condition.replacingOccurrences(of: "_", with: ""))")
        
        // Generic tags
        tags.append(contentsOf: ["#poshmark", "#style", "#fashion"])
        
        return Array(tags.prefix(10)).joined(separator: " ")
    }
}

// MARK: - Supporting Models

struct PoshmarkTemplate {
    let title: String
    let description: String
    let price: Int
    let size: String
    let brand: String
    let condition: String
}

struct Listing {
    let title: String
    let description: String
    let price: Double
    let category: String
    let condition: String
    let brand: String?
    let size: String?
    let images: [String]
}

struct UserLocation {
    let city: String?
    let zipCode: String?
    let state: String?
}

// MARK: - Usage Example

/*
 // Example usage in your view controller:
 
 let listing = Listing(
     title: "iPhone 13 Pro Max 128GB",
     description: "Excellent condition, barely used...",
     price: 750.0,
     category: "electronics",
     condition: "like_new",
     brand: "Apple",
     size: nil,
     images: ["image1.jpg", "image2.jpg"]
 )
 
 let location = UserLocation(
     city: "New York",
     zipCode: "10001",
     state: "NY"
 )
 
 // Open Facebook Marketplace
 DeepLinkService.shared.openPlatform("facebook", with: listing, location: location) { success in
     if success {
         print("Successfully opened Facebook Marketplace")
     } else {
         print("Failed to open - app not installed or link invalid")
     }
 }
 
 // Copy Poshmark template
 DeepLinkService.shared.copyPoshmarkTemplate(from: listing)
 */