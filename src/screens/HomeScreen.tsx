import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FolderOpen,
  ListTodo,
  Code,
  Image,
  TrendingUp,
  Zap,
} from 'lucide-react-native';
import { colors } from '../styles/colors';
import PrismCard from '../components/PrismCard';
import apiService from '../services/api';
import authService from '../services/auth.service';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;
type TabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const tabNavigation = useNavigation<TabNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPriority, setCurrentPriority] = useState<any>(null);
  const [projectsCount, setProjectsCount] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);
  const [referencesCount, setReferencesCount] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);

  const loadData = async () => {
    try {
      // Get projects count
      const projects = await apiService.getProjects();
      setProjectsCount(projects.length);

      // Calculate total tasks and references
      let totalTasks = 0;
      let totalRefs = 0;
      let activeTaskCount = 0;

      for (const project of projects) {
        if (project.tasksCount) totalTasks += project.tasksCount;
        if (project.referencesCount) totalRefs += project.referencesCount;
      }

      setTasksCount(totalTasks);
      setReferencesCount(totalRefs);

      // Get current priority task and count active tasks
      if (projects.length > 0) {
        for (const project of projects) {
          try {
            const tasks = await apiService.getTasks(project.id || project._id);
            const activeTasks = tasks.filter((t: any) => t.status === 'ACTIVE');
            activeTaskCount += activeTasks.length;

            const supernovaTasks = tasks.filter((t: any) =>
              t.priority === 'SUPERNOVA' && t.status === 'ACTIVE'
            );
            if (!currentPriority && supernovaTasks.length > 0) {
              setCurrentPriority({
                ...supernovaTasks[0],
                projectName: project.name
              });
            }
          } catch (error) {
            console.error('Error loading tasks:', error);
          }
        }
      }
      setActiveTasks(activeTaskCount);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };


  const features = [
    {
      id: 'projects',
      title: 'Projects',
      icon: <FolderOpen size={32} color={colors.cosmic.purple} />,
      color: colors.cosmic.purple,
      onPress: () => {
        // Navigate to Projects tab
        tabNavigation.navigate('Projects');
      }
    },
    {
      id: 'tasks',
      title: 'Tasks',
      icon: <ListTodo size={32} color={colors.cosmic.cyan} />,
      color: colors.cosmic.cyan,
      onPress: () => {
        // For now, navigate to Projects screen since tasks are per project
        tabNavigation.navigate('Projects');
      }
    },
    {
      id: 'scrolls',
      title: 'Scrolls',
      icon: <Code size={32} color={colors.cosmic.amber} />,
      color: colors.cosmic.amber,
      onPress: () => {
        // For now, navigate to Projects screen since references are per project
        navigation.getParent()?.navigate('Projects');
      }
    },
    {
      id: 'media',
      title: 'Media',
      icon: <Image size={32} color={colors.cosmic.pink} />,
      color: colors.cosmic.pink,
      onPress: () => {
        // For now, navigate to Projects screen since media is per project
        navigation.getParent()?.navigate('Projects');
      }
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
        <Text style={styles.loadingText}>Loading cosmic space...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.cosmic.purple}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Compact Header with gradient tagline */}
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.cosmic.purple, colors.cosmic.pink, colors.cosmic.cyan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.taglineGradient}
        >
          <Text style={styles.tagline}>Align your actions with the cosmos</Text>
        </LinearGradient>
      </View>

      {/* Quick Actions Grid - More prominent */}
      <View style={styles.quickActions}>
        {features.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.actionCard}
            onPress={feature.onPress}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: feature.color + '15' }]}>
              {feature.icon}
            </View>
            <Text style={styles.actionTitle}>{feature.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Current Priority - More compact */}
      {currentPriority && (
        <TouchableOpacity
          style={styles.priorityCard}
          onPress={() => navigation.navigate('TaskDetail', {
            taskId: currentPriority.id,
            projectId: currentPriority.projectId
          })}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.priority.supernova + '20', colors.priority.supernova + '10']}
            style={styles.priorityGradient}
          >
            <View style={styles.priorityContent}>
              <View style={styles.priorityLeft}>
                <View style={styles.priorityHeader}>
                  <Zap size={16} color={colors.priority.supernova} />
                  <Text style={styles.priorityLabel}>CURRENT PRIORITY</Text>
                </View>
                <Text style={styles.priorityTitle} numberOfLines={2}>{currentPriority.title}</Text>
                <Text style={styles.priorityProject}>{currentPriority.projectName}</Text>
              </View>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityBadgeText}>SUPERNOVA</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Stats Overview - Redesigned */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => tabNavigation.navigate('Projects')}
            activeOpacity={0.8}
          >
            <View style={styles.statIconContainer}>
              <FolderOpen size={20} color={colors.cosmic.purple} />
            </View>
            <Text style={styles.statValue}>{projectsCount}</Text>
            <Text style={styles.statLabel}>Projects</Text>
            <View style={styles.statIndicator}>
              <TrendingUp size={12} color={colors.cosmic.green} />
            </View>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <ListTodo size={20} color={colors.cosmic.cyan} />
            </View>
            <Text style={styles.statValue}>{activeTasks}</Text>
            <Text style={styles.statLabel}>Active</Text>
            <Text style={styles.statSubLabel}>{tasksCount} total</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Code size={20} color={colors.cosmic.amber} />
            </View>
            <Text style={styles.statValue}>{referencesCount}</Text>
            <Text style={styles.statLabel}>Scrolls</Text>
            <View style={styles.statIndicator}>
              <TrendingUp size={12} color={colors.cosmic.green} />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingBottom: 24,
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
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  taglineGradient: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 20,
    gap: 12,
  },
  actionCard: {
    width: (width - 48) / 2, // 2 columns with gap
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.border + '30',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  priorityCard: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  priorityGradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.priority.supernova + '30',
  },
  priorityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityLeft: {
    flex: 1,
    marginRight: 12,
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  priorityLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priorityTitle: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 22,
  },
  priorityProject: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  priorityBadge: {
    backgroundColor: colors.priority.supernova,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 10,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  statsContainer: {
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.border + '30',
    position: 'relative',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  statSubLabel: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  statIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});