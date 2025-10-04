import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Camera, X, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors } from '../hooks/useThemeColors';
import apiService from '../services/api';

interface UserAvatarProps {
  size?: number;
  showEditButton?: boolean;
}

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
}

interface AvatarHistory {
  id: string;
  url: string;
  isActive: boolean;
  uploadedAt: string;
}

export default function UserAvatar({ size = 40, showEditButton = false }: UserAvatarProps) {
  const colors = useThemeColors();
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [avatarHistory, setAvatarHistory] = useState<AvatarHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvatarHistory = async () => {
    try {
      const history = await apiService.getAvatarHistory();
      setAvatarHistory(history);
    } catch (error) {
      console.error('Failed to load avatar history:', error);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (asset: any) => {
    try {
      setUploading(true);
      const file = {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      };

      const response = await apiService.uploadProfilePicture(file);
      setUser(prev => prev ? { ...prev, avatar: response.avatar } : null);
      await loadAvatarHistory();
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (avatarId: string, avatarUrl: string) => {
    try {
      await apiService.setActiveAvatar(avatarId);
      setAvatarHistory(prev =>
        prev.map(a => ({ ...a, isActive: a.id === avatarId }))
      );
      setUser(prev => prev ? { ...prev, avatar: avatarUrl } : null);
      Alert.alert('Success', 'Avatar updated!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update avatar');
    }
  };

  const handleDelete = async (avatarId: string) => {
    try {
      await apiService.deleteAvatar(avatarId);
      setAvatarHistory(prev => prev.filter(a => a.id !== avatarId));
      Alert.alert('Success', 'Avatar deleted');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete avatar');
    }
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  };

  if (loading) {
    return (
      <View style={[styles.avatarContainer, { width: size, height: size }]}>
        <ActivityIndicator size="small" color={colors.cosmic.purple} />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          setShowModal(true);
          loadAvatarHistory();
        }}
        style={styles.avatarWrapper}
      >
        <View style={[styles.avatarContainer, { width: size, height: size }]}>
          {user?.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={[styles.avatar, { width: size, height: size }]}
            />
          ) : (
            <View
              style={[
                styles.initialsContainer,
                { width: size, height: size, borderRadius: size / 2 },
              ]}
            >
              <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
                {getInitials()}
              </Text>
            </View>
          )}
          {showEditButton && (
            <View style={styles.editBadge}>
              <Camera color={colors.text.primary} size={12} />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Avatar Modal - Instagram/Facebook Style */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.secondary }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Profile Picture
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color={colors.text.primary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Current User Info */}
              <View style={styles.userInfo}>
                <View style={[styles.largeAvatar, { borderColor: colors.cosmic.purple }]}>
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.largeAvatarImage} />
                  ) : (
                    <View style={[styles.initialsContainer, styles.largeAvatarImage]}>
                      <Text style={[styles.initials, { fontSize: 36 }]}>{getInitials()}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.userName, { color: colors.text.primary }]}>
                  {user?.name || user?.email}
                </Text>
                {user?.username && (
                  <Text style={[styles.userHandle, { color: colors.text.secondary }]}>
                    @{user.username}
                  </Text>
                )}
              </View>

              {/* Upload Button */}
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.cosmic.purple }]}
                onPress={handlePickImage}
                disabled={uploading}
              >
                <Camera color={colors.text.primary} size={20} />
                <Text style={[styles.uploadButtonText, { color: colors.text.primary }]}>
                  {uploading ? 'Uploading...' : 'Upload New Picture'}
                </Text>
              </TouchableOpacity>

              {/* Avatar History Grid */}
              {avatarHistory.length > 0 && (
                <View style={styles.historySection}>
                  <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    Your Photos
                  </Text>
                  <View style={styles.avatarGrid}>
                    {avatarHistory.map(avatar => (
                      <View key={avatar.id} style={styles.gridItem}>
                        <TouchableOpacity
                          onPress={() => !avatar.isActive && handleSetActive(avatar.id, avatar.url)}
                          style={[
                            styles.gridAvatar,
                            avatar.isActive && {
                              borderWidth: 3,
                              borderColor: colors.cosmic.purple,
                            },
                          ]}
                        >
                          <Image
                            source={{ uri: avatar.url }}
                            style={styles.gridAvatarImage}
                          />
                          {avatar.isActive && (
                            <View
                              style={[
                                styles.activeBadge,
                                { backgroundColor: colors.cosmic.purple },
                              ]}
                            >
                              <Text style={styles.activeBadgeText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        {!avatar.isActive && (
                          <TouchableOpacity
                            style={[styles.deleteButton, { backgroundColor: colors.status.deleted }]}
                            onPress={() =>
                              Alert.alert(
                                'Delete Avatar',
                                'Are you sure you want to delete this avatar?',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: () => handleDelete(avatar.id),
                                  },
                                ]
                              )
                            }
                          >
                            <X color="#fff" size={14} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatarWrapper: {
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    borderRadius: 999,
  },
  initialsContainer: {
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
  },
  initials: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    padding: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  largeAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    padding: 4,
    marginBottom: 12,
  },
  largeAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  historySection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '31%',
    aspectRatio: 1,
    position: 'relative',
  },
  gridAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gridAvatarImage: {
    width: '100%',
    height: '100%',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
