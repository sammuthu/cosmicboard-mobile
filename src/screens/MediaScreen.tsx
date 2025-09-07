import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Camera,
  Trash2,
  Edit2,
  Download,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { colors } from '../styles/colors';
import PrismCard from '../components/PrismCard';
import apiService from '../services/api';
import { MediaFile, Photo, Screenshot, PDFFile } from '../models';

interface MediaScreenProps {
  projectId: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function MediaScreen() {
  const route = useRoute();
  const { projectId } = route.params as MediaScreenProps;
  
  const [activeTab, setActiveTab] = useState<'photos' | 'screenshots' | 'pdfs'>('photos');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadMedia();
  }, [projectId]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const [photosData, screenshotsData, pdfsData] = await Promise.all([
        apiService.getMedia(projectId, 'photo'),
        apiService.getMedia(projectId, 'screenshot'),
        apiService.getMedia(projectId, 'pdf'),
      ]);
      
      setPhotos(photosData);
      setScreenshots(screenshotsData);
      setPdfs(pdfsData);
    } catch (error) {
      console.error('Failed to load media:', error);
      Alert.alert('Error', 'Failed to load media files');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMedia();
    setRefreshing(false);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadPhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      } as any);
      formData.append('type', activeTab === 'photos' ? 'photo' : 'screenshot');

      await apiService.uploadMedia(projectId, formData);
      await loadMedia(); // Refresh media list
      
      Alert.alert('Success', 'Photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMedia = async (mediaId: string) => {
    Alert.alert(
      'Delete Media',
      'Are you sure you want to delete this media file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteMedia(projectId, mediaId);
              await loadMedia();
              Alert.alert('Success', 'Media file deleted');
            } catch (error) {
              console.error('Error deleting media:', error);
              Alert.alert('Error', 'Failed to delete media file');
            }
          },
        },
      ]
    );
  };

  const openLightbox = (media: MediaFile, index: number) => {
    setSelectedMedia(media);
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedMedia(null);
    setSelectedIndex(-1);
  };

  const navigateMedia = (direction: 'prev' | 'next') => {
    if (selectedIndex === -1) return;
    
    const currentList = activeTab === 'photos' ? photos : 
                      activeTab === 'screenshots' ? screenshots : pdfs;
    
    const newIndex = direction === 'prev' 
      ? Math.max(0, selectedIndex - 1)
      : Math.min(currentList.length - 1, selectedIndex + 1);
    
    setSelectedIndex(newIndex);
    setSelectedMedia(currentList[newIndex]);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCurrentMediaList = () => {
    switch (activeTab) {
      case 'photos': return photos;
      case 'screenshots': return screenshots;
      case 'pdfs': return pdfs;
      default: return [];
    }
  };

  const renderMediaGrid = (mediaList: MediaFile[]) => {
    if (mediaList.length === 0) {
      return (
        <View style={styles.emptyState}>
          <ImageIcon color={colors.text.muted} size={64} />
          <Text style={styles.emptyText}>
            No {activeTab} yet
          </Text>
          <Text style={styles.emptySubText}>
            Upload your first {activeTab.slice(0, -1)} to get started
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.mediaGrid}>
        {mediaList.map((media, index) => (
          <TouchableOpacity
            key={media._id}
            style={styles.mediaItem}
            onPress={() => openLightbox(media, index)}
          >
            {media.type === 'pdf' ? (
              <View style={styles.pdfThumbnail}>
                <FileText color={colors.cosmic.purple} size={40} />
                <Text style={styles.pdfText} numberOfLines={2}>
                  {media.name}
                </Text>
              </View>
            ) : (
              <Image 
                source={{ uri: media.thumbnailUrl || media.url }} 
                style={styles.thumbnail}
                resizeMode="cover"
              />
            )}
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                deleteMedia(media._id);
              }}
            >
              <Trash2 color="white" size={16} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
        <Text style={styles.loadingText}>Loading media...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'photos', label: 'Photos', icon: ImageIcon },
          { key: 'screenshots', label: 'Screenshots', icon: Camera },
          { key: 'pdfs', label: 'PDFs', icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.activeTab]}
            onPress={() => setActiveTab(key as any)}
          >
            <Icon 
              color={activeTab === key ? colors.cosmic.purple : colors.text.muted} 
              size={20} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === key && styles.activeTabText
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upload Section */}
      <PrismCard style={styles.uploadCard}>
        <Text style={styles.uploadTitle}>
          Upload {activeTab.slice(0, -1)}
        </Text>
        <View style={styles.uploadButtons}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickImage}
            disabled={isUploading}
          >
            <Upload color="white" size={20} />
            <Text style={styles.uploadButtonText}>
              {isUploading ? 'Uploading...' : 'From Gallery'}
            </Text>
          </TouchableOpacity>
          
          {activeTab !== 'pdfs' && (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={takePhoto}
              disabled={isUploading}
            >
              <Camera color="white" size={20} />
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </PrismCard>

      {/* Media Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderMediaGrid(getCurrentMediaList())}
      </ScrollView>

      {/* Lightbox Modal */}
      {selectedMedia && (
        <Modal
          visible={true}
          animationType="fade"
          statusBarTranslucent
          onRequestClose={closeLightbox}
        >
          <View style={styles.lightboxContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeLightbox}
            >
              <X color="white" size={24} />
            </TouchableOpacity>

            {selectedIndex > 0 && (
              <TouchableOpacity
                style={styles.navButtonLeft}
                onPress={() => navigateMedia('prev')}
              >
                <ChevronLeft color="white" size={24} />
              </TouchableOpacity>
            )}

            {selectedIndex < getCurrentMediaList().length - 1 && (
              <TouchableOpacity
                style={styles.navButtonRight}
                onPress={() => navigateMedia('next')}
              >
                <ChevronRight color="white" size={24} />
              </TouchableOpacity>
            )}

            <View style={styles.lightboxContent}>
              {selectedMedia.type === 'pdf' ? (
                <View style={styles.pdfViewer}>
                  <FileText color={colors.cosmic.purple} size={80} />
                  <Text style={styles.pdfViewerText}>{selectedMedia.name}</Text>
                  <Text style={styles.pdfViewerSubText}>
                    PDF • {formatFileSize(selectedMedia.size)}
                  </Text>
                </View>
              ) : (
                <Image
                  source={{ uri: selectedMedia.url }}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />
              )}
              
              <View style={styles.mediaInfo}>
                <Text style={styles.mediaName}>{selectedMedia.name}</Text>
                <Text style={styles.mediaDetails}>
                  {selectedMedia.metadata?.width && selectedMedia.metadata?.height
                    ? `${selectedMedia.metadata.width} × ${selectedMedia.metadata.height} • `
                    : ''}
                  {formatFileSize(selectedMedia.size)}
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
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
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    color: colors.text.secondary,
    marginTop: 16,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.cosmic.purple + '20',
  },
  tabText: {
    color: colors.text.muted,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.cosmic.purple,
  },
  uploadCard: {
    margin: 16,
  },
  uploadTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cosmic.purple,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubText: {
    color: colors.text.muted,
    fontSize: 14,
    marginTop: 8,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  mediaItem: {
    width: (screenWidth - 48) / 2,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  pdfThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  pdfText: {
    color: colors.text.primary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 16,
    padding: 4,
  },
  lightboxContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 8,
  },
  navButtonLeft: {
    position: 'absolute',
    left: 20,
    top: '50%',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 8,
  },
  navButtonRight: {
    position: 'absolute',
    right: 20,
    top: '50%',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 8,
  },
  lightboxContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.7,
  },
  pdfViewer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  pdfViewerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  pdfViewerSubText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  mediaInfo: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 16,
  },
  mediaName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  mediaDetails: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 4,
  },
});