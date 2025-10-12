import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../services/api';

// Types matching the backend API response
export interface DiscoverFeedOwner {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  username: string;
  bio: string | null;
}

export interface DiscoverFeedEngagement {
  likes: number;
  comments: number;
  bookmarks: number;
  views: number;
}

export interface DiscoverFeedItem {
  id: string;
  contentType: 'PROJECT' | 'TASK' | 'NOTE' | 'EVENT' | 'PHOTO' | 'SCREENSHOT' | 'PDF';
  contentId: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  owner: DiscoverFeedOwner;
  content: any; // Full content details (Project, Task, Reference, Event, or Media)
  engagement: DiscoverFeedEngagement;
}

export interface DiscoverFeedResponse {
  items: DiscoverFeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
  meta: {
    count: number;
    requestedLimit: number;
  };
}

export interface UseDiscoverFeedOptions {
  limit?: number;
  type?: 'PROJECT' | 'TASK' | 'NOTE' | 'EVENT' | 'PHOTO' | 'SCREENSHOT' | 'PDF';
}

export interface UseDiscoverFeedReturn {
  items: DiscoverFeedItem[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  fetchMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing discover feed state and pagination
 *
 * Features:
 * - Auto-fetches initial feed on mount
 * - Cursor-based pagination for infinite scroll
 * - Pull-to-refresh support
 * - Loading and error states
 * - Content type filtering
 *
 * Usage:
 * ```tsx
 * const { items, loading, hasMore, fetchMore, refresh } = useDiscoverFeed({ limit: 20 });
 * ```
 */
export function useDiscoverFeed(options: UseDiscoverFeedOptions = {}): UseDiscoverFeedReturn {
  const { limit = 20, type } = options;

  const [items, setItems] = useState<DiscoverFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch initial feed (first page)
   */
  const fetchInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(type && { type })
      });

      console.log('📡 Fetching discover feed:', { limit, type });

      const response = await axios.get<DiscoverFeedResponse>(
        `${API_URL}/discover/feed?${params.toString()}`
      );

      console.log(`✅ Received ${response.data.items.length} items`);

      setItems(response.data.items || []);
      setNextCursor(response.data.nextCursor);
      setHasMore(response.data.hasMore || false);
    } catch (err: any) {
      console.error('❌ Error fetching discover feed:', err);
      setError(err.response?.data?.error || 'Failed to load discover feed');
    } finally {
      setLoading(false);
    }
  }, [limit, type]);

  /**
   * Fetch next page (for infinite scroll)
   */
  const fetchMore = useCallback(async () => {
    if (!hasMore || loading || !nextCursor) {
      console.log('🛑 Cannot fetch more:', { hasMore, loading, nextCursor });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        cursor: nextCursor,
        ...(type && { type })
      });

      console.log('📡 Fetching more items with cursor:', nextCursor);

      const response = await axios.get<DiscoverFeedResponse>(
        `${API_URL}/discover/feed?${params.toString()}`
      );

      console.log(`✅ Received ${response.data.items.length} more items`);

      setItems(prev => [...prev, ...response.data.items]);
      setNextCursor(response.data.nextCursor);
      setHasMore(response.data.hasMore || false);
    } catch (err: any) {
      console.error('❌ Error fetching more items:', err);
      setError(err.response?.data?.error || 'Failed to load more items');
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, nextCursor, limit, type]);

  /**
   * Refresh feed (pull-to-refresh)
   */
  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(type && { type })
      });

      console.log('🔄 Refreshing discover feed');

      const response = await axios.get<DiscoverFeedResponse>(
        `${API_URL}/discover/feed?${params.toString()}`
      );

      console.log(`✅ Refreshed with ${response.data.items.length} items`);

      setItems(response.data.items || []);
      setNextCursor(response.data.nextCursor);
      setHasMore(response.data.hasMore || false);
    } catch (err: any) {
      console.error('❌ Error refreshing feed:', err);
      setError(err.response?.data?.error || 'Failed to refresh feed');
    } finally {
      setRefreshing(false);
    }
  }, [limit, type]);

  // Auto-fetch initial feed on mount
  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  return {
    items,
    loading,
    refreshing,
    hasMore,
    error,
    fetchMore,
    refresh
  };
}
