import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
  FolderKanban,
  CheckSquare,
  FileText,
  Calendar,
  Image as ImageIcon,
  Camera,
  FileCheck,
  Heart,
  MessageCircle,
  Bookmark,
  Eye
} from 'lucide-react-native';
import PrismCard from './PrismCard';
import { useThemeColors } from '../hooks/useThemeColors';
import { DiscoverFeedItem } from '../hooks/useDiscoverFeed';

interface DiscoverContentCardProps {
  item: DiscoverFeedItem;
  onPress?: () => void;
}

/**
 * DiscoverContentCard - Displays a content item in the discover feed
 *
 * Supports all content types:
 * - PROJECT: Shows project name, description, and asset counts
 * - TASK: Shows task title, priority, status, and tags
 * - NOTE: Shows note title, content preview, category, and tags
 * - EVENT: Shows event name, dates, location
 * - PHOTO/SCREENSHOT/PDF: Shows media thumbnail and metadata
 */
export default function DiscoverContentCard({ item, onPress }: DiscoverContentCardProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  /**
   * Format relative time (e.g., "2h ago", "3d ago")
   */
  const formatRelativeTime = (dateString: string): string => {
    const now = new Date().getTime();
    const createdAt = new Date(dateString).getTime();
    const diffInMinutes = Math.floor((now - createdAt) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  /**
   * Get content type icon and color
   */
  const getContentTypeInfo = () => {
    switch (item.contentType) {
      case 'PROJECT':
        return { Icon: FolderKanban, color: colors.cosmic.purple, label: 'Project' };
      case 'TASK':
        return { Icon: CheckSquare, color: colors.cosmic.cyan, label: 'Task' };
      case 'NOTE':
        return { Icon: FileText, color: colors.cosmic.amber, label: 'Note' };
      case 'EVENT':
        return { Icon: Calendar, color: colors.cosmic.pink, label: 'Event' };
      case 'PHOTO':
        return { Icon: ImageIcon, color: colors.cosmic.blue, label: 'Photo' };
      case 'SCREENSHOT':
        return { Icon: Camera, color: colors.cosmic.purpleLight, label: 'Screenshot' };
      case 'PDF':
        return { Icon: FileCheck, color: colors.cosmic.amber, label: 'PDF' };
      default:
        return { Icon: FileText, color: colors.text.secondary, label: 'Content' };
    }
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'SUPERNOVA':
        return colors.priorities.supernova;
      case 'STELLAR':
        return colors.priorities.stellar;
      case 'NEBULA':
        return colors.priorities.nebula;
      default:
        return colors.text.secondary;
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return colors.status.completed;
      case 'ACTIVE':
        return colors.status.active;
      case 'DELETED':
        return colors.status.deleted;
      default:
        return colors.text.secondary;
    }
  };

  /**
   * Render content based on type
   */
  const renderContent = () => {
    const content = item.content;

    if (!content) {
      return (
        <View style={styles.emptyContent}>
          <Text style={styles.emptyText}>Content not available</Text>
        </View>
      );
    }

    switch (item.contentType) {
      case 'PROJECT':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.contentTitle} numberOfLines={2}>
              {content.name}
            </Text>
            {content.description && (
              <Text style={styles.contentDescription} numberOfLines={3}>
                {content.description}
              </Text>
            )}
            {content._count && (
              <View style={styles.projectStats}>
                <View style={styles.statItem}>
                  <CheckSquare size={14} color={colors.text.secondary} />
                  <Text style={styles.statText}>{content._count.tasks} tasks</Text>
                </View>
                <View style={styles.statItem}>
                  <FileText size={14} color={colors.text.secondary} />
                  <Text style={styles.statText}>{content._count.references} notes</Text>
                </View>
                <View style={styles.statItem}>
                  <ImageIcon size={14} color={colors.text.secondary} />
                  <Text style={styles.statText}>{content._count.media} media</Text>
                </View>
              </View>
            )}
            {content.priority && (
              <View style={[styles.priorityBadge, { borderColor: getPriorityColor(content.priority) }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(content.priority) }]}>
                  {content.priority}
                </Text>
              </View>
            )}
          </View>
        );

      case 'TASK':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.contentTitle} numberOfLines={2}>
              {content.title}
            </Text>
            {content.content && (
              <Text style={styles.contentDescription} numberOfLines={3}>
                {content.content}
              </Text>
            )}
            <View style={styles.taskMeta}>
              {content.priority && (
                <View style={[styles.priorityBadge, { borderColor: getPriorityColor(content.priority) }]}>
                  <Text style={[styles.priorityText, { color: getPriorityColor(content.priority) }]}>
                    {content.priority}
                  </Text>
                </View>
              )}
              {content.status && (
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(content.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(content.status) }]}>
                    {content.status}
                  </Text>
                </View>
              )}
            </View>
            {content.tags && content.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {content.tags.slice(0, 3).map((tag: string, index: number) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            {content.project && (
              <Text style={styles.associationText}>
                <FolderKanban size={12} color={colors.text.muted} /> {content.project.name}
              </Text>
            )}
          </View>
        );

      case 'NOTE':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.contentTitle} numberOfLines={2}>
              {content.title}
            </Text>
            {content.content && (
              <Text style={styles.contentDescription} numberOfLines={4}>
                {content.content}
              </Text>
            )}
            {content.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{content.category}</Text>
              </View>
            )}
            {content.tags && content.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {content.tags.slice(0, 3).map((tag: string, index: number) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            {content.project && (
              <Text style={styles.associationText}>
                <FolderKanban size={12} color={colors.text.muted} /> {content.project.name}
              </Text>
            )}
          </View>
        );

      case 'EVENT':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.contentTitle} numberOfLines={2}>
              {content.name}
            </Text>
            {content.description && (
              <Text style={styles.contentDescription} numberOfLines={3}>
                {content.description}
              </Text>
            )}
            {content.startDate && (
              <View style={styles.eventMeta}>
                <Calendar size={14} color={colors.cosmic.pink} />
                <Text style={styles.eventDate}>
                  {new Date(content.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            )}
            {content.location && (
              <Text style={styles.eventLocation} numberOfLines={1}>
                📍 {content.location}
              </Text>
            )}
            {content.project && (
              <Text style={styles.associationText}>
                <FolderKanban size={12} color={colors.text.muted} /> {content.project.name}
              </Text>
            )}
          </View>
        );

      case 'PHOTO':
      case 'SCREENSHOT':
      case 'PDF':
        const MediaIcon = getContentTypeInfo().Icon;
        return (
          <View style={styles.contentSection}>
            {content.thumbnailUrl ? (
              <Image source={{ uri: content.thumbnailUrl }} style={styles.mediaThumbnail} />
            ) : (
              <View style={styles.mediaPlaceholder}>
                <MediaIcon size={48} color={colors.text.muted} />
              </View>
            )}
            <Text style={styles.mediaName} numberOfLines={2}>
              {content.name}
            </Text>
            {content.size && (
              <Text style={styles.mediaSize}>
                {(content.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            )}
            {content.project && (
              <Text style={styles.associationText}>
                <FolderKanban size={12} color={colors.text.muted} /> {content.project.name}
              </Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const { Icon, color, label } = getContentTypeInfo();

  return (
    <PrismCard onPress={onPress}>
      {/* Owner Header */}
      <View style={styles.header}>
        <View style={styles.ownerInfo}>
          <View style={[styles.avatar, { backgroundColor: color + '30' }]}>
            <Text style={[styles.avatarText, { color }]}>
              {item.owner.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.ownerDetails}>
            <Text style={styles.ownerName}>{item.owner.name}</Text>
            <Text style={styles.ownerUsername}>@{item.owner.username}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.contentTypeBadge}>
            <Icon size={14} color={color} />
            <Text style={[styles.contentTypeLabel, { color }]}>{label}</Text>
          </View>
          <Text style={styles.timestamp}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Engagement Footer */}
      <View style={styles.engagement}>
        <TouchableOpacity style={styles.engagementButton}>
          <Heart size={18} color={colors.text.secondary} />
          <Text style={styles.engagementText}>{item.engagement.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.engagementButton}>
          <MessageCircle size={18} color={colors.text.secondary} />
          <Text style={styles.engagementText}>{item.engagement.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.engagementButton}>
          <Bookmark size={18} color={colors.text.secondary} />
          <Text style={styles.engagementText}>{item.engagement.bookmarks}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.engagementButton}>
          <Eye size={18} color={colors.text.secondary} />
          <Text style={styles.engagementText}>{item.engagement.views}</Text>
        </TouchableOpacity>
      </View>
    </PrismCard>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  ownerUsername: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  headerRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  contentTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  contentTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: colors.text.muted,
  },
  contentSection: {
    marginBottom: 16,
  },
  emptyContent: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  contentDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  projectStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  priorityBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: colors.cosmic.purple + '20',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: colors.cosmic.purple,
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: colors.cosmic.amber + '20',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  categoryText: {
    fontSize: 12,
    color: colors.cosmic.amber,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  eventDate: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  eventLocation: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 6,
  },
  associationText: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  mediaThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  mediaPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mediaName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  mediaSize: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  engagement: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.ui.divider + '30',
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engagementText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});
