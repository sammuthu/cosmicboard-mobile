import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Globe, RefreshCw, AlertCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTheme } from '../contexts/ThemeContext';
import { useDiscoverFeed, DiscoverFeedItem } from '../hooks/useDiscoverFeed';
import DiscoverContentCard from '../components/DiscoverContentCard';
import UserAvatar from '../components/UserAvatar';

/**
 * DiscoverScreen - Browse public content from other users
 *
 * Features:
 * - Infinite scroll with FlatList
 * - Pull-to-refresh
 * - Loading states
 * - Error handling
 * - Empty state
 * - Auto-pagination on scroll
 */
export default function DiscoverScreen() {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { colors: themeColors } = useTheme();
  const styles = createStyles(colors);

  const {
    items,
    loading,
    refreshing,
    hasMore,
    error,
    fetchMore,
    refresh
  } = useDiscoverFeed({ limit: 20 });

  const flatListRef = useRef<FlatList>(null);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  /**
   * Handle end reached (load more items)
   */
  const handleEndReached = useCallback(async () => {
    if (!hasMore || loading || isLoadingMore) {
      return;
    }

    console.log('📜 Reached end, loading more...');
    setIsLoadingMore(true);
    await fetchMore();
    setIsLoadingMore(false);
  }, [hasMore, loading, isLoadingMore, fetchMore]);

  /**
   * Handle scroll to top button
   */
  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  /**
   * Render individual content item
   */
  const renderItem = ({ item }: { item: DiscoverFeedItem }) => (
    <DiscoverContentCard
      item={item}
      onPress={() => {
        // Navigate to content detail based on type
        if (item.contentType === 'PROJECT') {
          navigation.navigate('ProjectDetail' as never, { projectId: item.contentId } as never);
        }
        // TODO: Add navigation for other content types (TASK, NOTE, EVENT, etc.)
      }}
    />
  );

  /**
   * Render footer (loading indicator when fetching more)
   */
  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.cosmic.purple} />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.cosmic.purple} />
          <Text style={styles.emptyText}>Loading discover feed...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <AlertCircle size={64} color={colors.status.error} />
          <Text style={styles.emptyTitle}>Error loading feed</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <RefreshCw size={18} color={colors.text.primary} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Globe size={64} color={colors.text.muted} />
        <Text style={styles.emptyTitle}>No public content yet</Text>
        <Text style={styles.emptyText}>
          Be the first to share something with the community!
        </Text>
      </View>
    );
  };

  /**
   * Render end of feed message
   */
  const renderEndMessage = () => {
    if (items.length === 0 || hasMore) return null;

    return (
      <View style={styles.endMessage}>
        <Text style={styles.endText}>✨ You've reached the end</Text>
        <TouchableOpacity onPress={scrollToTop} style={styles.scrollTopButton}>
          <Text style={styles.scrollTopText}>Scroll to top</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Use theme gradient colors
  const gradientColors = themeColors
    ? [
        themeColors.parentBackground.from,
        themeColors.parentBackground.via,
        themeColors.parentBackground.to
      ]
    : [colors.background.primary, colors.background.secondary, colors.background.primary];

  return (
    <LinearGradient
      colors={gradientColors as readonly [string, string, ...string[]]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <UserAvatar size={36} showEditButton={false} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Discover</Text>
            <Text style={styles.headerSubtitle}>Public content from the community</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={refresh} disabled={refreshing}>
              <RefreshCw
                size={24}
                color={refreshing ? colors.text.muted : colors.cosmic.purple}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Feed List */}
        <FlatList
          ref={flatListRef}
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.cosmic.purple}
              colors={[colors.cosmic.purple]}
            />
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />

        {/* End Message */}
        {renderEndMessage()}
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    width: 36,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  headerRight: {
    width: 36,
    alignItems: 'flex-end',
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cosmic.purple + '20',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.cosmic.purple,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  footerText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  endMessage: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  endText: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  scrollTopButton: {
    backgroundColor: colors.cosmic.purple + '20',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cosmic.purple,
  },
  scrollTopText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.cosmic.purple,
  },
});
