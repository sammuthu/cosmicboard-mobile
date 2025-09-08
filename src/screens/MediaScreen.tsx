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
  TextInput,
  FlatList,
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
  ChevronRight,
  Plus
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../styles/colors';
import PrismCard from '../components/PrismCard';
import apiService from '../services/api';
import { MediaFile, Photo, Screenshot, PDFFile } from '../models';

interface MediaScreenProps {
  projectId: string;
}

const { width: screenWidth } = Dimensions.get('window');

export default function MediaScreen() {
  const route = useRoute();
  const { projectId } = route.params as MediaScreenProps;
  
  const [activeTab, setActiveTab] = useState<'moments' | 'snaps' | 'scrolls'>('moments');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Lightbox state
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadMedia();
  }, [projectId]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const mediaData = await apiService.getMedia(projectId);
      
      // Filter media by type to match web version
      const photosData = mediaData.filter((m: MediaFile) => m.type === 'photo') as Photo[];
      const screenshotsData = mediaData.filter((m: MediaFile) => m.type === 'screenshot') as Screenshot[];
      const pdfsData = mediaData.filter((m: MediaFile) => m.type === 'pdf') as PDFFile[];
      
      setPhotos(photosData);
      setScreenshots(screenshotsData);
      setPdfs(pdfsData);
    } catch (error) {
      console.error('Failed to load media:', error);
      // Set empty arrays on error
      setPhotos([]);
      setScreenshots([]);
      setPdfs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMedia();
  };

  const handlePhotoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        // In a real implementation, we'd upload the image here
        console.log('Photo selected:', result.assets[0]);
        Alert.alert('Photo Upload', 'Photo upload functionality will be implemented');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const openLightbox = (photo: Photo, index: number) => {
    setCurrentImageIndex(index);
    setLightboxVisible(true);
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleRename = async (id: string) => {
    if (editName.trim() && editName !== editName) {
      try {
        await apiService.renameMedia(id, editName.trim());
        await loadMedia(); // Reload to get updated data
      } catch (error) {
        console.error('Rename error:', error);
        Alert.alert('Error', 'Failed to rename file');
      }
    }
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async (id: string, name: string) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteMedia(id);
              await loadMedia();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  const renderPhotoItem = ({ item, index }: { item: Photo; index: number }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => openLightbox(item, index)}
    >
      <PrismCard variant="media" aspectRatio="square">
        <Image
          source={{ uri: item.thumbnailUrl || item.url }}
          style={styles.photoImage}
          resizeMode="cover"
        />
        <View style={styles.photoOverlay}>
          <Text style={styles.photoName} numberOfLines={1}>
            {editingId === item._id ? (
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                onBlur={() => handleRename(item._id)}
                onSubmitEditing={() => handleRename(item._id)}
                autoFocus
              />
            ) : (
              item.name
            )}
          </Text>
          <View style={styles.photoActions}>
            <TouchableOpacity
              onPress={() => startEditing(item._id, item.name)}
              style={styles.actionButton}
            >
              <Edit2 color={colors.text.primary} size={16} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item._id, item.name)}
              style={styles.actionButton}
            >
              <Trash2 color={colors.error} size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </PrismCard>
    </TouchableOpacity>
  );

  const renderUploadArea = () => (
    <TouchableOpacity style={styles.uploadArea} onPress={handlePhotoUpload}>
      <PrismCard variant="media" aspectRatio="square">
        <View style={styles.uploadContent}>
          <Plus color={colors.cosmic.purple} size={32} />
          <Text style={styles.uploadText}>Add Photo</Text>
        </View>
      </PrismCard>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.cosmic.purple} />
          <Text style={styles.loadingText}>Loading media...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'moments':
        const photosWithUpload = [...photos];
        return (
          <FlatList
            data={photosWithUpload}
            renderItem={renderPhotoItem}
            keyExtractor={(item, index) => item._id || `upload-${index}`}
            numColumns={2}
            columnWrapperStyle={styles.photoRow}
            contentContainerStyle={styles.photoGrid}
            ListHeaderComponent={renderUploadArea}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ImageIcon color={colors.text.muted} size={48} />
                <Text style={styles.emptyText}>No photos yet</Text>
                <Text style={styles.emptySubtext}>Tap + to add your first photo</Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.cosmic.purple}
              />
            }
          />
        );

      case 'snaps':
        return (
          <View style={styles.centerContainer}>
            <Camera color={colors.text.muted} size={48} />
            <Text style={styles.emptyText}>Screenshot capture</Text>
            <Text style={styles.emptySubtext}>Feature coming soon</Text>
          </View>
        );

      case 'scrolls':
        return (
          <View style={styles.centerContainer}>
            <FileText color={colors.text.muted} size={48} />
            <Text style={styles.emptyText}>PDF documents</Text>
            <Text style={styles.emptySubtext}>Feature coming soon</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Bar - matching web version */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'moments' && styles.activeTabMoments
          ]}
          onPress={() => setActiveTab('moments')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'moments' && styles.activeTabText
          ]}>
            📸 Moments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'snaps' && styles.activeTabSnaps
          ]}
          onPress={() => setActiveTab('snaps')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'snaps' && styles.activeTabText
          ]}>
            📎 Snaps
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'scrolls' && styles.activeTabScrolls
          ]}
          onPress={() => setActiveTab('scrolls')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'scrolls' && styles.activeTabText
          ]}>
            📄 Scrolls
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* Lightbox Modal */}
      <Modal
        visible={lightboxVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLightboxVisible(false)}
      >
        <View style={styles.lightboxContainer}>
          <TouchableOpacity
            style={styles.lightboxClose}
            onPress={() => setLightboxVisible(false)}
          >
            <X color={colors.text.primary} size={24} />
          </TouchableOpacity>
          
          {photos[currentImageIndex] && (
            <Image
              source={{ uri: photos[currentImageIndex].url }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}
          
          {photos.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.lightboxNav, styles.lightboxNavLeft]}
                onPress={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
              >
                <ChevronLeft color={colors.text.primary} size={32} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.lightboxNav, styles.lightboxNavRight]}
                onPress={() => setCurrentImageIndex(Math.min(photos.length - 1, currentImageIndex + 1))}
              >
                <ChevronRight color={colors.text.primary} size={32} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  activeTabMoments: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)', // Blue gradient
    borderBottomWidth: 2,
    borderBottomColor: colors.cosmic.blue,
  },
  activeTabSnaps: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)', // Green gradient
    borderBottomWidth: 2,
    borderBottomColor: colors.success,
  },
  activeTabScrolls: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)', // Red gradient
    borderBottomWidth: 2,
    borderBottomColor: colors.error,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 8,
    textAlign: 'center',
  },
  photoGrid: {
    padding: 16,
  },
  photoRow: {
    justifyContent: 'space-between',
  },
  photoItem: {
    width: (screenWidth - 48) / 2, // Account for padding and gap
    marginBottom: 16,
  },
  uploadArea: {
    width: (screenWidth - 48) / 2,
    marginBottom: 16,
    alignSelf: 'center',
  },
  uploadContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.cosmic.purple,
    borderStyle: 'dashed',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.cosmic.purple,
    fontWeight: '600',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoName: {
    flex: 1,
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '500',
  },
  editInput: {
    flex: 1,
    fontSize: 12,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    padding: 4,
    borderRadius: 4,
  },
  photoActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 8,
    padding: 4,
  },
  // Lightbox styles
  lightboxContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  lightboxImage: {
    width: screenWidth,
    height: '70%',
  },
  lightboxNav: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  lightboxNavLeft: {
    left: 20,
  },
  lightboxNavRight: {
    right: 20,
  },
});