import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Check, Edit2, Palette, Sparkles, Globe, Smartphone } from 'lucide-react-native';
import { useTheme, ThemeTemplate } from '../../contexts/ThemeContext';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getDeviceType } from '../../utils/deviceHelper';
import apiService from '../../services/api';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ThemeGallery'>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

// Theme emojis for visual identification
const themeEmojis: Record<string, string> = {
  moon: '🌙',
  sun: '☀️',
  daylight: '🌞',
  comet: '☄️',
  earth: '🌍',
  rocket: '🚀',
  saturn: '🪐',
  sparkle: '✨',
};

export default function ThemeGalleryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, activeTheme, availableThemes, customizations, setTheme, loading, refreshTheme } = useTheme();
  const [applying, setApplying] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [themeScope, setThemeScope] = useState<any>(null);
  const deviceType = getDeviceType();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTheme();
    setRefreshing(false);
  };

  const handleApplyTheme = (themeId: string) => {
    const deviceTypeDisplay = deviceType === 'tablet' ? 'Tablet' : 'Phone';

    Alert.alert(
      'Apply Theme',
      'How would you like to apply this theme?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: `This ${deviceTypeDisplay} Only`,
          onPress: () => applyThemeWithScope(themeId, false),
        },
        {
          text: 'All Devices',
          onPress: () => applyThemeWithScope(themeId, true),
        },
      ],
      { cancelable: true }
    );
  };

  const applyThemeWithScope = async (themeId: string, isGlobal: boolean) => {
    setApplying(themeId);
    try {
      await apiService.setActiveTheme(themeId, isGlobal, isGlobal ? undefined : deviceType);
      await refreshTheme();
      // Update local state to reflect the scope
      const scope = isGlobal ? 'Universal' : deviceType;
      setThemeScope({ themeId, scope });
    } catch (error) {
      console.error('Failed to apply theme:', error);
      Alert.alert('Error', 'Failed to apply theme. Please try again.');
    } finally {
      setApplying(null);
    }
  };

  const handleCustomizeTheme = (themeTemplate: ThemeTemplate) => {
    navigation.navigate('ThemeCustomization', { theme: themeTemplate });
  };

  const hasCustomization = (themeId: string) => {
    return customizations.some(c => c.themeId === themeId);
  };

  const renderThemeCard = (themeTemplate: ThemeTemplate) => {
    const isActive = activeTheme?.themeId === themeTemplate.id;
    const isCustomized = hasCustomization(themeTemplate.id);
    const isApplying = applying === themeTemplate.id;
    const scope = isActive && activeTheme ?
      (activeTheme as any).scope || (activeTheme as any).isGlobal ? 'Universal' : (activeTheme as any).deviceType :
      null;

    return (
      <TouchableOpacity
        key={themeTemplate.id}
        style={styles.cardContainer}
        onPress={() => handleCustomizeTheme(themeTemplate)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[
            themeTemplate.colors.parentBackground.from,
            themeTemplate.colors.parentBackground.via,
            themeTemplate.colors.parentBackground.to,
          ]}
          style={styles.card}
        >
          {/* Theme Preview Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.themeEmoji}>{themeEmojis[themeTemplate.name] || '🎨'}</Text>
            {isActive && (
              <View style={styles.badgeContainer}>
                <View style={[styles.badge, { backgroundColor: themeTemplate.colors.status.success }]}>
                  <Check size={12} color="#ffffff" />
                  <Text style={styles.badgeText}>Active</Text>
                </View>
                {scope && (
                  <View style={[styles.scopeBadge, { backgroundColor: themeTemplate.colors.buttons.primary.background }]}>
                    {scope === 'Universal' ? (
                      <Globe size={10} color="#ffffff" />
                    ) : (
                      <Smartphone size={10} color="#ffffff" />
                    )}
                    <Text style={styles.scopeBadgeText}>
                      {scope === 'Universal' ? 'Universal' : scope === 'tablet' ? 'Tablet' : 'Mobile'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Theme Name */}
          <Text style={[styles.themeName, { color: themeTemplate.colors.text.primary }]}>
            {themeTemplate.displayName}
          </Text>
          <Text style={[styles.themeDescription, { color: themeTemplate.colors.text.secondary }]}>
            {themeTemplate.description}
          </Text>

          {/* Color Swatches */}
          <View style={styles.colorSwatches}>
            <View
              style={[styles.swatch, { backgroundColor: themeTemplate.colors.buttons.primary.background }]}
            />
            <View
              style={[styles.swatch, { backgroundColor: themeTemplate.colors.prismCard.glowGradient.from }]}
            />
            <View
              style={[styles.swatch, { backgroundColor: themeTemplate.colors.status.success }]}
            />
            <View
              style={[styles.swatch, { backgroundColor: themeTemplate.colors.status.warning }]}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.cardActions}>
            {isCustomized && (
              <View style={[styles.customBadge, { backgroundColor: themeTemplate.colors.text.accent + '20' }]}>
                <Sparkles size={12} color={themeTemplate.colors.text.accent} />
                <Text style={[styles.customBadgeText, { color: themeTemplate.colors.text.accent }]}>
                  Customized
                </Text>
              </View>
            )}

            {!isActive && (
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: themeTemplate.colors.buttons.primary.background }]}
                onPress={() => handleApplyTheme(themeTemplate.id)}
                disabled={isApplying}
              >
                {isApplying ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.applyButtonText}>Apply</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.customizeButton, { borderColor: themeTemplate.colors.buttons.primary.background }]}
              onPress={() => handleCustomizeTheme(themeTemplate)}
            >
              <Edit2 size={14} color={themeTemplate.colors.buttons.primary.background} />
              <Text style={[styles.customizeButtonText, { color: themeTemplate.colors.buttons.primary.background }]}>
                Customize
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.cosmic.purple} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.cosmic.purple}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {availableThemes.map((themeTemplate) => renderThemeCard(themeTemplate))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    minHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  themeEmoji: {
    fontSize: 32,
  },
  badgeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scopeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
    opacity: 0.9,
  },
  scopeBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  themeName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  colorSwatches: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardActions: {
    gap: 8,
  },
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 8,
  },
  customBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  customizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});