import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  Clipboard, 
  Linking,
  StyleSheet,
  ScrollView,
  Share
} from 'react-native';
import { DeepLinkBuilder } from '../services/deep-link-builder';

const DeepLinkSharing = ({ listing, userLocation, onClose }) => {
  const [deepLinks, setDeepLinks] = useState({});
  const [loading, setLoading] = useState(true);
  const builder = new DeepLinkBuilder();

  useEffect(() => {
    generateLinks();
  }, [listing]);

  const generateLinks = () => {
    setLoading(true);
    try {
      const links = builder.generateAllDeepLinks(listing, userLocation);
      setDeepLinks(links);
    } catch (error) {
      console.error('Error generating deep links:', error);
      Alert.alert('Error', 'Failed to generate sharing links');
    } finally {
      setLoading(false);
    }
  };

  const openPlatform = async (platform) => {
    const linkData = deepLinks[platform];
    if (!linkData) {
      Alert.alert('Error', 'Link not available for this platform');
      return;
    }

    try {
      let url = typeof linkData === 'string' ? linkData : linkData.mobile;
      
      // For platforms with mobile/web options, try mobile first
      if (linkData.mobile && linkData.web) {
        const canOpenMobile = await Linking.canOpenURL(linkData.mobile);
        url = canOpenMobile ? linkData.mobile : linkData.web;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        // Track analytics
        trackPlatformOpen(platform);
      } else {
        Alert.alert(
          'App Not Found', 
          `The ${builder.getPlatformDisplayName(platform)} app is not installed. Would you like to copy the listing details instead?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Copy Details', onPress: () => copyTemplate(platform) }
          ]
        );
      }
    } catch (error) {
      console.error(`Error opening ${platform}:`, error);
      Alert.alert('Error', `Could not open ${builder.getPlatformDisplayName(platform)}`);
    }
  };

  const copyTemplate = async (platform) => {
    try {
      const template = builder.generateTemplate(listing, platform);
      await Clipboard.setString(template.text);
      
      Alert.alert(
        'Copied!', 
        `${builder.getPlatformDisplayName(platform)} listing template copied to clipboard. You can now paste it when creating your listing.`
      );
      
      // Track analytics
      trackTemplateCopy(platform);
    } catch (error) {
      console.error('Error copying template:', error);
      Alert.alert('Error', 'Failed to copy template');
    }
  };

  const shareAsText = async (platform) => {
    try {
      const template = builder.generateTemplate(listing, platform);
      await Share.share({
        message: template.text,
        title: `${listing.title} - Ready for ${builder.getPlatformDisplayName(platform)}`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const trackPlatformOpen = (platform) => {
    // Add your analytics tracking here
    console.log(`User opened ${platform} deep link`);
  };

  const trackTemplateCopy = (platform) => {
    // Add your analytics tracking here
    console.log(`User copied ${platform} template`);
  };

  const PlatformButton = ({ platform, title, icon, hasDeepLink, onPress }) => (
    <TouchableOpacity 
      style={[styles.platformButton, hasDeepLink ? styles.deepLinkButton : styles.templateButton]}
      onPress={onPress}
    >
      <Text style={styles.platformIcon}>{icon}</Text>
      <Text style={styles.platformTitle}>{title}</Text>
      <Text style={styles.platformSubtext}>
        {hasDeepLink ? 'Open & auto-fill' : 'Copy template'}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Generating sharing links...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Share to Other Platforms</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Your listing "{listing.title}" is ready to share!
      </Text>

      <ScrollView style={styles.platformList}>
        {/* Deep Link Platforms */}
        <Text style={styles.sectionTitle}>🚀 Auto-Fill Supported</Text>
        
        <PlatformButton
          platform="facebook"
          title="Facebook Marketplace"
          icon="📘"
          hasDeepLink={true}
          onPress={() => openPlatform('facebook')}
        />

        <PlatformButton
          platform="offerup"
          title="OfferUp"
          icon="🏷️"
          hasDeepLink={true}
          onPress={() => openPlatform('offerup')}
        />

        <PlatformButton
          platform="craigslist"
          title="Craigslist"
          icon="📰"
          hasDeepLink={true}
          onPress={() => openPlatform('craigslist')}
        />

        <PlatformButton
          platform="mercari"
          title="Mercari"
          icon="🛍️"
          hasDeepLink={true}
          onPress={() => openPlatform('mercari')}
        />

        {/* Template Platforms */}
        <Text style={styles.sectionTitle}>📋 Copy Template</Text>
        
        <PlatformButton
          platform="poshmark"
          title="Poshmark"
          icon="👗"
          hasDeepLink={false}
          onPress={() => copyTemplate('poshmark')}
        />

        <PlatformButton
          platform="vinted"
          title="Vinted"
          icon="👕"
          hasDeepLink={false}
          onPress={() => copyTemplate('vinted')}
        />

        <PlatformButton
          platform="tradesy"
          title="Tradesy"
          icon="💎"
          hasDeepLink={false}
          onPress={() => copyTemplate('tradesy')}
        />

        {/* Share Options */}
        <Text style={styles.sectionTitle}>📤 Share</Text>
        
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={() => shareAsText('generic')}
        >
          <Text style={styles.shareButtonText}>Share Listing Details</Text>
        </TouchableOpacity>
      </ScrollView>

      <Text style={styles.footer}>
        💡 Tip: Auto-fill platforms will open with your listing pre-filled. Just add photos and hit post!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 10,
  },
  closeText: {
    fontSize: 20,
    color: '#666',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  platformList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  platformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  deepLinkButton: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  templateButton: {
    backgroundColor: '#fff8e1',
    borderColor: '#FFC107',
  },
  platformIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  platformTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  platformSubtext: {
    fontSize: 12,
    color: '#666',
  },
  shareButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default DeepLinkSharing;