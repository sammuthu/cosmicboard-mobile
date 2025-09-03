import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Plus } from 'lucide-react-native';
import { colors } from '../styles/colors';
import PrismCard from '../components/PrismCard';
import apiService from '../services/api';
import { Project, Task, Reference } from '../models';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

interface ProjectWithCounts extends Project {
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

export default function ProjectsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      // Initialize API service
      await apiService.init();
      
      // Fetch projects from API
      const projectList = await apiService.getProjects();
      
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
    } catch (error) {
      console.error('Failed to load projects:', error);
      // For development, show empty state if API fails
      setProjects([]);
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

  const renderProject = ({ item }: { item: ProjectWithCounts }) => {
    const totalTasks = item.counts.tasks.active + item.counts.tasks.completed;
    const progress = totalTasks > 0 
      ? (item.counts.tasks.completed / totalTasks) * 100 
      : 0;

    return (
      <PrismCard
        onPress={() => navigation.navigate('ProjectDetail', { projectId: item._id })}
      >
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
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
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
            <Text style={styles.emptyText}>No projects yet</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first project</Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateProject}
      >
        <Plus color={colors.text.primary} size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
});