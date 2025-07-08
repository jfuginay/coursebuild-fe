import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { VideoAIProcessor } from '../services/video-ai-processor';

const { width, height } = Dimensions.get('window');

const VideoListingCamera = ({ onListingGenerated, onClose }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  
  const cameraRef = useRef(null);
  const recordingTimer = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const processor = new VideoAIProcessor();

  useEffect(() => {
    getPermissions();
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, []);

  const getPermissions = async () => {
    const cameraStatus = await Camera.requestCameraPermissionsAsync();
    const audioStatus = await Audio.requestPermissionsAsync();
    
    setHasPermission(
      cameraStatus.status === 'granted' && audioStatus.status === 'granted'
    );
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    try {
      // Start recording animation
      startPulseAnimation();
      
      const video = await cameraRef.current.recordAsync({
        quality: Camera.Constants.VideoQuality['720p'],
        maxDuration: 60, // 1 minute max
        mute: false
      });

      setRecording(true);
      setRecordingDuration(0);
      
      // Start duration timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

      console.log('Recording started:', video);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !recording) return;

    try {
      await cameraRef.current.stopRecording();
      setRecording(false);
      stopPulseAnimation();
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      // Start processing immediately
      processVideo();
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const processVideo = async () => {
    setProcessing(true);
    
    try {
      // Simulate video processing stages
      const stages = [
        { stage: 'Extracting audio...', duration: 2000 },
        { stage: 'Converting speech to text...', duration: 3000 },
        { stage: 'Analyzing video frames...', duration: 4000 },
        { stage: 'Generating AI insights...', duration: 5000 },
        { stage: 'Creating platform content...', duration: 3000 },
        { stage: 'Finalizing listing...', duration: 1000 }
      ];

      for (const { stage, duration } of stages) {
        setProcessingStage(stage);
        await new Promise(resolve => setTimeout(resolve, duration));
      }

      // Simulate successful processing result
      const mockResult = {
        success: true,
        listingId: 'listing_' + Date.now(),
        analysis: {
          itemDetails: {
            title: 'Vintage Leica M3 35mm Camera - Chrome Body',
            brand: 'Leica',
            model: 'M3',
            condition: 'excellent',
            category: 'electronics',
            description: 'Beautiful vintage Leica M3 from the 1960s with chrome body. Belonged to my grandfather, works perfectly but I never use it. A true classic for photography enthusiasts.',
            suggestedPrice: 1250
          },
          emotionalContext: {
            attachment: 'high',
            reason: 'inheritance, not being used',
            sentiment: 'nostalgic but practical'
          },
          confidence: 0.92
        },
        platformContent: {
          ebay: {
            title: 'Vintage 1960s Leica M3 Chrome 35mm Camera - Excellent Working Condition',
            description: 'Classic Leica M3 rangefinder camera from the 1960s...',
            suggestedPrice: 1250
          },
          poshmark: {
            title: '📸 Vintage Leica M3 Camera - Grandfather\'s Collection',
            description: 'This gorgeous vintage camera has such a special story! It belonged to my grandfather who was a photography enthusiast...',
            hashtags: ['#vintage', '#leica', '#camera', '#photography', '#collector']
          },
          instagram: {
            caption: '✨ Vintage Leica M3 looking for a new home! This beauty belonged to my grandfather and while I treasure the memories, I know it deserves to be in the hands of someone who will actually use it 📸 DM if interested! #vintage #leica #camera #forsale',
            hashtags: ['#vintage', '#leica', '#camera', '#forsale', '#photography']
          }
        }
      };

      onListingGenerated(mockResult);
      
    } catch (error) {
      console.error('Video processing failed:', error);
      Alert.alert('Processing Failed', 'Something went wrong processing your video. Please try again.');
    } finally {
      setProcessing(false);
      setProcessingStage('');
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true
    }).start();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera and microphone access is required</Text>
        <TouchableOpacity style={styles.button} onPress={getPermissions}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (processing) {
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.processingTitle}>Creating Your Listing</Text>
        <Text style={styles.processingStage}>{processingStage}</Text>
        
        <View style={styles.processingSteps}>
          <Text style={styles.stepText}>✅ Video recorded ({formatDuration(recordingDuration)})</Text>
          <Text style={styles.stepText}>🎤 Extracting voice insights</Text>
          <Text style={styles.stepText}>👁️ Analyzing visual details</Text>
          <Text style={styles.stepText}>🧠 Generating smart descriptions</Text>
          <Text style={styles.stepText}>📱 Optimizing for all platforms</Text>
        </View>
        
        <Text style={styles.processingNote}>
          This usually takes 15-20 seconds. We're creating personalized listings for eBay, Poshmark, Instagram, and more!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera 
        style={styles.camera} 
        ref={cameraRef}
        type={Camera.Constants.Type.back}
        flashMode={Camera.Constants.FlashMode.auto}
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Video Listing</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Recording indicator */}
          {recording && (
            <View style={styles.recordingIndicator}>
              <Animated.View 
                style={[
                  styles.recordingDot,
                  { transform: [{ scale: pulseAnim }] }
                ]} 
              />
              <Text style={styles.recordingText}>REC {formatDuration(recordingDuration)}</Text>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>
              {recording ? "Describe your item while showing it!" : "Show and tell about your item"}
            </Text>
            <Text style={styles.instructionsText}>
              {recording 
                ? "Talk naturally about brand, condition, story, price..."
                : "Record a video while describing what you're selling. AI will create perfect listings!"
              }
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                recording && styles.recordingButton
              ]}
              onPress={recording ? stopRecording : startRecording}
            >
              <View style={[
                styles.recordButtonInner,
                recording && styles.recordingButtonInner
              ]} />
            </TouchableOpacity>
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Pro Tips:</Text>
            <Text style={styles.tip}>• Show item clearly in good lighting</Text>
            <Text style={styles.tip}>• Mention brand, condition, and story</Text>
            <Text style={styles.tip}>• Keep video under 60 seconds</Text>
            <Text style={styles.tip}>• Speak naturally and enthusiastically!</Text>
          </View>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    alignItems: 'center',
  },
  instructionsTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  instructionsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  controls: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 100,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  recordingButton: {
    backgroundColor: 'rgba(255,59,48,0.3)',
  },
  recordButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF3B30',
  },
  recordingButtonInner: {
    borderRadius: 8,
    width: 30,
    height: 30,
  },
  tipsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 15,
  },
  tipsTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tip: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  processingContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  processingStage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  processingSteps: {
    width: '100%',
    marginBottom: 30,
  },
  stepText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    paddingLeft: 10,
  },
  processingNote: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  loadingText: {
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VideoListingCamera;