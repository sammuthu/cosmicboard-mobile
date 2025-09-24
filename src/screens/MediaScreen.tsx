import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  Image as ImageIcon,
  FileText,
  Plus,
  X,
} from 'lucide-react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import apiService from '../services/api';
import { colors } from '../styles/colors';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3 - 8;

type MediaScreenRouteProp = RouteProp<MainTabParamList & RootStackParamList, 'Media' | 'MediaScreen'>;

interface MediaItem {
  id: string;
  type: 'photo' | 'screenshot' | 'pdf';
  name: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  createdAt: string;
}

export default function MediaScreen() {
  const route = useRoute<MediaScreenRouteProp>();
  const navigation = useNavigation();
  const projectId = route.params?.projectId || 'all';

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'photo' | 'screenshot' | 'pdf'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadMedia();
  }, [projectId, selectedType]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      // Temporarily return empty array since media endpoints aren't ready
      setMedia([]);
    } catch (error) {
      console.error('Failed to load media:', error);
      Alert.alert('Error', 'Failed to load media files');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedia();
    setRefreshing(false);
  };

  const showUploadOptions = () => {
    Alert.alert('Media Upload', 'Media upload features are temporarily disabled');
  };

  const renderMediaItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity style={styles.mediaItem}>
      {item.type === 'pdf' ? (
        <View style={styles.pdfThumbnail}>
          <FileText size={40} color={colors.text.secondary} />
          <Text style={styles.pdfName} numberOfLines={2}>{item.name}</Text>
        </View>
      ) : (
        <Image source={{ uri: item.thumbnailUrl || item.url }} style={styles.image} />
      )}
    </TouchableOpacity>
  );

  const filteredMedia = selectedType === 'all'
    ? media
    : media.filter(item => item.type === selectedType);

  return (
    <SafeAreaView style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, selectedType === 'all' && styles.activeFilterTab]}
          onPress={() => setSelectedType('all')}
        >
          <Text style={[styles.filterText, selectedType === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedType === 'photo' && styles.activeFilterTab]}
          onPress={() => setSelectedType('photo')}
        >
          <Text style={[styles.filterText, selectedType === 'photo' && styles.activeFilterText]}>
            Photos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedType === 'screenshot' && styles.activeFilterTab]}
          onPress={() => setSelectedType('screenshot')}
        >
          <Text style={[styles.filterText, selectedType === 'screenshot' && styles.activeFilterText]}>
            Screenshots
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedType === 'pdf' && styles.activeFilterTab]}
          onPress={() => setSelectedType('pdf')}
        >
          <Text style={[styles.filterText, selectedType === 'pdf' && styles.activeFilterText]}>
            PDFs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Media Grid */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.cosmic.purple} />
        </View>
      ) : filteredMedia.length === 0 ? (
        <View style={styles.centerContainer}>
          <ImageIcon size={64} color={colors.text.muted} />
          <Text style={styles.emptyText}>No media files yet</Text>
          <Text style={styles.emptySubtext}>Tap + to upload your first file</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMedia}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.cosmic.purple}
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={showUploadOptions}
      >
        <LinearGradient
          colors={[colors.cosmic.purple, colors.cosmic.nebula]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Plus size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: colors.cosmic.purple + '20',
  },
  filterText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: colors.cosmic.purple,
  },
  grid: {
    padding: 4,
  },
  mediaItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.background.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pdfThumbnail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  pdfName: {
    marginTop: 8,
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.text.primary,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text.muted,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});