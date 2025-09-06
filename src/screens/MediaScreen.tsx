import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  Image as ImageIcon,
  FileText,
  Plus,
  X,
  Download,
  Trash2,
  Edit,
  Copy,
} from 'lucide-react-native';
import { colors } from '../styles/colors';
import PrismCard from '../components/PrismCard';
import PDFViewer from '../components/PDFViewer';
import apiService from '../services/api';
import { Media } from '../models';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = StackScreenProps<RootStackParamList, 'MediaScreen'>;

const { width: screenWidth } = Dimensions.get('window');
const itemWidth = (screenWidth - 60) / 2; // 2 columns with 20px padding and 10px gap

export default function MediaScreen({ route }: Props) {
  const { projectId } = route.params || { projectId: 'all' };
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'photos' | 'screenshots' | 'pdfs'>('photos');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMedia();
    requestPermissions();
  }, [projectId, selectedTab]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload photos.'
      );
    }
  };

  const fetchMedia = async () => {
    try {
      const mediaType = selectedTab === 'photos' ? 'photo' : selectedTab === 'screenshots' ? 'screenshot' : 'pdf';
      const response = await apiService.getMedia(projectId === 'all' ? undefined : projectId, mediaType);
      setMedia(response);
    } catch (error) {
      console.error('Error fetching media:', error);
      Alert.alert('Error', 'Failed to load media');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMedia();
  };

  const handleUpload = () => {
    Alert.alert(
      'Upload Media',
      'Choose upload method',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Document', onPress: pickDocument },
        { text: 'Paste Screenshot', onPress: pasteScreenshot },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadFile(result.assets[0]);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadFile(result.assets[0]);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        uploadFile({
          uri: file.uri,
          type: file.mimeType || 'application/pdf',
          fileName: file.name,
          fileSize: file.size,
        } as any);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pasteScreenshot = async () => {
    if (projectId === 'all') {
      Alert.alert('Select Project', 'Please select a specific project to upload media');
      return;
    }

    try {
      const hasImage = await Clipboard.hasImageAsync();
      if (!hasImage) {
        Alert.alert('No Image', 'No image found in clipboard');
        return;
      }

      const image = await Clipboard.getImageAsync();
      if (image) {
        // Convert clipboard image to base64 and upload as screenshot
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const name = `Screenshot ${timestamp}`;
        
        setUploading(true);
        try {
          await apiService.uploadScreenshot(projectId, image.data, name);
          fetchMedia();
          Alert.alert('Success', 'Screenshot uploaded successfully');
        } catch (error) {
          console.error('Error uploading screenshot:', error);
          Alert.alert('Error', 'Failed to upload screenshot');
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Error pasting screenshot:', error);
      Alert.alert('Error', 'Failed to paste screenshot');
    }
  };

  const uploadFile = async (file: any) => {
    if (projectId === 'all') {
      Alert.alert('Select Project', 'Please select a specific project to upload media');
      return;
    }

    setUploading(true);
    try {
      const fileData = {
        uri: file.uri,
        type: file.type || file.mimeType || 'image/jpeg',
        name: file.fileName || file.name || `upload_${Date.now()}.jpg`,
      };

      await apiService.uploadMedia(projectId, fileData);
      fetchMedia();
      Alert.alert('Success', 'File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = (mediaItem: Media) => {
    Alert.alert(
      'Delete Media',
      `Are you sure you want to delete "${mediaItem.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteMedia(mediaItem._id);
              fetchMedia();
              Alert.alert('Success', 'Media deleted successfully');
            } catch (error) {
              console.error('Error deleting media:', error);
              Alert.alert('Error', 'Failed to delete media');
            }
          },
        },
      ]
    );
  };

  const openLightbox = (mediaItem: Media) => {
    setSelectedMedia(mediaItem);
    if (mediaItem.type === 'pdf') {
      setShowPDFViewer(true);
    } else {
      setShowLightbox(true);
    }
  };

  const closeLightbox = () => {
    setSelectedMedia(null);
    setShowLightbox(false);
  };

  const closePDFViewer = () => {
    setSelectedMedia(null);
    setShowPDFViewer(false);
  };

  const filteredMedia = media.filter(item => {
    if (selectedTab === 'photos') return item.type === 'photo';
    if (selectedTab === 'screenshots') return item.type === 'screenshot';
    if (selectedTab === 'pdfs') return item.type === 'pdf';
    return true;
  });

  const renderMediaItem = (item: Media) => {
    const isImage = item.type === 'photo' || item.type === 'screenshot';
    
    return (
      <TouchableOpacity
        key={item._id}
        style={[styles.mediaItem, { width: itemWidth }]}
        onPress={() => openLightbox(item)}
        onLongPress={() => handleDeleteMedia(item)}
      >
        <PrismCard style={styles.mediaCard}>
          {isImage ? (
            <Image
              source={{ uri: item.thumbnailUrl || item.url }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.pdfThumbnail}>
              <FileText color={colors.cosmic.purple} size={40} />
              <Text style={styles.pdfLabel} numberOfLines={2}>
                {item.name}
              </Text>
            </View>
          )}
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.overlay}
          >
            <Text style={styles.mediaName} numberOfLines={2}>
              {item.name}
            </Text>
          </LinearGradient>
        </PrismCard>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cosmic.purple} />
          <Text style={styles.loadingText}>Loading media...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'photos', label: 'Photos', icon: ImageIcon },
          { key: 'screenshots', label: 'Screenshots', icon: Camera },
          { key: 'pdfs', label: 'PDFs', icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.tab,
              selectedTab === key && styles.activeTab,
            ]}
            onPress={() => setSelectedTab(key as any)}
          >
            <Icon
              color={selectedTab === key ? colors.cosmic.purple : colors.text.muted}
              size={20}
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === key && styles.activeTabText,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Media Grid */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.grid}>
          {filteredMedia.length > 0 ? (
            filteredMedia.map(renderMediaItem)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No {selectedTab} yet
              </Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first {selectedTab.slice(0, -1)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Upload FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleUpload}
        disabled={uploading}
      >
        <LinearGradient
          colors={[colors.cosmic.purple, colors.cosmic.blue]}
          style={styles.fabGradient}
        >
          {uploading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Plus color="white" size={24} />
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Lightbox Modal */}
      <Modal
        visible={showLightbox}
        transparent
        animationType="fade"
        onRequestClose={closeLightbox}
      >
        <View style={styles.lightboxContainer}>
          <TouchableOpacity
            style={styles.lightboxBackdrop}
            activeOpacity={1}
            onPress={closeLightbox}
          />
          
          {selectedMedia && (
            <>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeLightbox}
              >
                <X color="white" size={24} />
              </TouchableOpacity>
              
              <Image
                source={{ uri: selectedMedia.url }}
                style={styles.lightboxImage}
                resizeMode="contain"
              />
              
              <View style={styles.lightboxInfo}>
                <Text style={styles.lightboxTitle}>
                  {selectedMedia.name}
                </Text>
                <Text style={styles.lightboxDate}>
                  {new Date(selectedMedia.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* PDF Viewer Modal */}
      {selectedMedia && (
        <PDFViewer
          media={selectedMedia}
          visible={showPDFViewer}
          onClose={closePDFViewer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.muted,
    marginTop: 16,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    backgroundColor: colors.ui.hover,
  },
  tabText: {
    color: colors.text.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.cosmic.purple,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
  },
  mediaItem: {
    marginBottom: 16,
  },
  mediaCard: {
    padding: 0,
    overflow: 'hidden',
    aspectRatio: 1,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  pdfThumbnail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  pdfLabel: {
    color: colors.text.primary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  mediaName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    width: '100%',
  },
  emptyText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.text.muted,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  lightboxImage: {
    width: screenWidth - 40,
    height: screenWidth - 40,
    maxHeight: '70%',
  },
  lightboxInfo: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  lightboxTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  lightboxDate: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 4,
  },
});