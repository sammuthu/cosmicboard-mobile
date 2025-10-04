import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Plus, Filter, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTheme } from '../contexts/ThemeContext';
import PrismCard from '../components/PrismCard';
import UserAvatar from '../components/UserAvatar';
import apiService from '../services/api';
import { Project, Task, Reference } from '../models';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

type Priority = 'SUPERNOVA' | 'STELLAR' | 'NEBULA';

interface ProjectWithCounts extends Project {
  priority?: Priority;
  counts: {
    tasks: {
      active: number;
      completed: number;
      deleted: number;
    };
    references: {
      total: number;
      snippets: number;
      documentation: number;
    };
  };
}

const PRIORITY_EMOJIS: Record<Priority, string> = {
  SUPERNOVA: '🌟',
  STELLAR: '⭐',
  NEBULA: '☁️'
};

const PRIORITY_LABELS: Record<Priority, string> = {
  SUPERNOVA: 'SuperNova',
  STELLAR: 'Stellar',
  NEBULA: 'Nebula'
};

export default function ProjectsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();
  const { colors: themeColors } = useTheme();
  const styles = createStyles(colors);
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<ProjectWithCounts[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [showPriorityMenu, setShowPriorityMenu] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(true);

  const loadProjects = async () => {
    try {
      // Initialize API service
      await apiService.init();

      // Fetch active projects from API
      const projectList = await apiService.getProjects();

      // Fetch deleted projects - commented out temporarily
      // const deletedList = await apiService.getDeletedProjects();
      const deletedList: any[] = [];

      // Use the counts from the API response
      const projectsWithCounts = projectList.map((project: any) => ({
        ...project,
        _id: project.id || project._id, // Handle both id formats
        counts: project.counts || {
          tasks: {
            active: 0,
            completed: 0,
            deleted: 0,
          },
          references: {
            total: 0,
            snippets: 0,
            documentation: 0,
          },
        },
      }));

      setProjects(projectsWithCounts);

      // Process deleted projects
      const deletedWithCounts = deletedList.map((project: any) => ({
        ...project,
        _id: project.id || project._id,
        counts: project.counts || {
          tasks: { active: 0, completed: 0, deleted: 0 },
          references: { total: 0, snippets: 0, documentation: 0 },
        },
      }));
      setDeletedProjects(deletedWithCounts);
    } catch (error) {
      console.error('Failed to load projects:', error);
      // For development, show empty state if API fails
      setProjects([]);
      setDeletedProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handleCreateProject = () => {
    Alert.prompt(
      'New Project',
      'Enter project name:',
      async (name) => {
        if (name && name.trim()) {
          try {
            await apiService.createProject({ name: name.trim() });
            loadProjects();
          } catch (error) {
            console.error('Failed to create project:', error);
            Alert.alert('Error', 'Failed to create project');
          }
        }
      },
      'plain-text'
    );
  };

  const handlePriorityChange = async (projectId: string, newPriority: Priority) => {
    try {
      // Update locally first for instant UI feedback
      setProjects(prevProjects =>
        prevProjects.map(project =>
          project._id === projectId
            ? { ...project, priority: newPriority }
            : project
        )
      );

      // Update on backend
      await apiService.updateProjectPriority(projectId, newPriority);
      setShowPriorityMenu(null);
    } catch (error) {
      console.error('Failed to update priority:', error);
      Alert.alert('Error', 'Failed to update project priority');
      // Revert on error
      loadProjects();
    }
  };

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Apply priority filter
    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter(project => {
        const projectPriority = project.priority || 'NEBULA';
        return projectPriority === priorityFilter;
      });
    }

    // Apply sorting
    if (sortByPriority) {
      filtered.sort((a, b) => {
        const priorityOrder = { SUPERNOVA: 3, STELLAR: 2, NEBULA: 1 };
        const aPriority = a.priority || 'NEBULA';
        const bPriority = b.priority || 'NEBULA';
        return priorityOrder[bPriority] - priorityOrder[aPriority];
      });
    }

    return filtered;
  }, [projects, priorityFilter, sortByPriority]);

  const renderProject = ({ item }: { item: ProjectWithCounts }) => {
    const totalTasks = item.counts.tasks.active + item.counts.tasks.completed;
    const progress = totalTasks > 0
      ? (item.counts.tasks.completed / totalTasks) * 100
      : 0;

    const currentPriority = item.priority || 'NEBULA';
    const isPriorityMenuOpen = showPriorityMenu === item._id;

    return (
      <PrismCard
        onPress={() => navigation.navigate('ProjectDetail', { projectId: item._id })}
      >
        {/* Priority badge in top-right */}
        <View style={styles.priorityBadge}>
          <TouchableOpacity
            onPress={(e) => {
              setShowPriorityMenu(isPriorityMenuOpen ? null : item._id);
            }}
          >
            <Text style={styles.priorityEmoji}>{PRIORITY_EMOJIS[currentPriority]}</Text>
          </TouchableOpacity>

          {/* Priority selection menu */}
          {isPriorityMenuOpen && (
            <View style={styles.priorityMenuOverlay}>
              <View style={styles.priorityMenuContainer}>
                {(['SUPERNOVA', 'STELLAR', 'NEBULA'] as Priority[]).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityMenuItem,
                      currentPriority === priority && styles.priorityMenuItemActive
                    ]}
                    onPress={() => handlePriorityChange(item._id, priority)}
                  >
                    <Text style={styles.priorityMenuEmoji}>{PRIORITY_EMOJIS[priority]}</Text>
                    <Text style={styles.priorityMenuLabel}>{PRIORITY_LABELS[priority]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <Text style={styles.projectName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.projectDescription}>{item.description}</Text>
        )}

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statsColumn, styles.statsBorder]}>
            <Text style={styles.statsTitle}>TASKS</Text>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Active</Text>
              <Text style={[styles.statValue, { color: colors.status.active }]}>
                {item.counts.tasks.active}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Done</Text>
              <Text style={[styles.statValue, { color: colors.status.completed }]}>
                {item.counts.tasks.completed}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Deleted</Text>
              <Text style={[styles.statValue, { color: colors.status.deleted }]}>
                {item.counts.tasks.deleted}
              </Text>
            </View>
          </View>

          <View style={styles.statsColumn}>
            <Text style={styles.statsTitle}>REFERENCES</Text>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={[styles.statValue, { color: colors.cosmic.purple }]}>
                {item.counts.references.total}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Snippets</Text>
              <Text style={[styles.statValue, { color: colors.cosmic.cyan }]}>
                {item.counts.references.snippets}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Docs</Text>
              <Text style={[styles.statValue, { color: colors.cosmic.amber }]}>
                {item.counts.references.documentation}
              </Text>
            </View>
          </View>
        </View>
      </PrismCard>
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={themeColors ? [
          themeColors.parentBackground.from,
          themeColors.parentBackground.via,
          themeColors.parentBackground.to
        ] : [colors.background.primary, colors.background.primary, colors.background.primary]}
        style={[styles.container, styles.centerContent]}
      >
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      <LinearGradient
        colors={themeColors ? [
          themeColors.parentBackground.from,
          themeColors.parentBackground.via,
          themeColors.parentBackground.to
        ] : [colors.background.primary, colors.background.primary, colors.background.primary]}
        style={styles.container}
      >
        {/* Modern Social Media Style Header - Instagram Layout */}
        <View style={styles.headerContainer}>
          {/* Left: Avatar */}
          <UserAvatar size={36} showEditButton={true} />

          {/* Center: Title */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>Cosmic Space</Text>
          </View>

          {/* Right: Filter */}
          <TouchableOpacity
            onPress={() => {
              console.log('Filter button tapped!');
              setShowFilterModal(true);
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Filter color={colors.cosmic.purple} size={24} />
            {priorityFilter !== 'ALL' && <View style={styles.filterBadge} />}
          </TouchableOpacity>
        </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X color={colors.text.primary} size={24} />
              </TouchableOpacity>
            </View>

            {/* Priority Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Priority</Text>
              {[
                { value: 'ALL', label: 'All Priorities', emoji: '📋' },
                { value: 'SUPERNOVA', label: 'SuperNova', emoji: PRIORITY_EMOJIS.SUPERNOVA },
                { value: 'STELLAR', label: 'Stellar', emoji: PRIORITY_EMOJIS.STELLAR },
                { value: 'NEBULA', label: 'Nebula', emoji: PRIORITY_EMOJIS.NEBULA },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    priorityFilter === option.value && styles.filterOptionActive
                  ]}
                  onPress={() => setPriorityFilter(option.value as Priority | 'ALL')}
                >
                  <Text style={styles.filterOptionEmoji}>{option.emoji}</Text>
                  <Text style={styles.filterOptionLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort</Text>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  sortByPriority && styles.filterOptionActive
                ]}
                onPress={() => setSortByPriority(!sortByPriority)}
              >
                <Text style={styles.filterOptionLabel}>
                  {sortByPriority ? '✓ Highest Priority First' : 'Sort by Priority'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.closeButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Temporarily commented out tab UI to fix app loading
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, !showDeleted && styles.activeTab]}
          onPress={() => setShowDeleted(false)}
        >
          <Text style={[styles.tabText, !showDeleted && styles.activeTabText]}>
            Active Projects ({projects.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showDeleted && styles.activeTab]}
          onPress={() => setShowDeleted(true)}
        >
          <Text style={[styles.tabText, showDeleted && styles.activeTabText]}>
            Deleted ({deletedProjects.length})
          </Text>
        </TouchableOpacity>
      </View>
      */}

      <FlatList
        data={filteredAndSortedProjects}
        keyExtractor={(item) => item._id}
        renderItem={renderProject}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.cosmic.purple}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No projects yet
            </Text>
            <Text style={styles.emptySubtext}>
              Tap + to create your first project
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateProject}
      >
        <Plus color={colors.text.primary} size={24} />
      </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  activeTab: {
    backgroundColor: colors.cosmic.purple,
    borderColor: colors.cosmic.purple,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  activeTabText: {
    color: colors.text.primary,
  },
  listContent: {
    paddingBottom: 100, // Add space for FAB and ensure scrolling
  },
  projectName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  progressValue: {
    fontSize: 14,
    color: colors.cosmic.purple,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.ui.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.cosmic.purple,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statsColumn: {
    flex: 1,
  },
  statsBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.ui.divider,
    paddingRight: 16,
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.muted,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cosmic.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
    backgroundColor: colors.background.secondary,
    zIndex: 10,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cosmic.purple,
  },
  priorityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  priorityEmoji: {
    fontSize: 28,
  },
  priorityMenuOverlay: {
    position: 'absolute',
    top: 36,
    right: 0,
    zIndex: 20,
  },
  priorityMenuContainer: {
    backgroundColor: colors.glass.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.border,
    padding: 8,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  priorityMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  priorityMenuItemActive: {
    backgroundColor: colors.cosmic.purple + '20',
  },
  priorityMenuEmoji: {
    fontSize: 24,
  },
  priorityMenuLabel: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.glass.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
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
    color: colors.text.primary,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.ui.border + '20',
    marginBottom: 8,
    gap: 12,
  },
  filterOptionActive: {
    backgroundColor: colors.cosmic.purple + '30',
    borderWidth: 2,
    borderColor: colors.cosmic.purple,
  },
  filterOptionEmoji: {
    fontSize: 24,
  },
  filterOptionLabel: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: colors.cosmic.purple,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});